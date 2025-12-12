import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserToken } from './_lib/creditsService.js';
import { getEnvVar } from './_lib/env.js';

interface AnalyzeStyleRequestBody {
  // Support multiple legacy keys for compatibility
  image?: unknown;
  base64Image?: unknown;
  originalImage?: unknown;
  allowedCategories?: unknown;
}

const parseRequestBody = (body: VercelRequest['body']): AnalyzeStyleRequestBody => {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf-8'));
    } catch {
      return {};
    }
  }
  return body as AnalyzeStyleRequestBody;
};

const normalizeBase64 = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth (same pattern as other APIs)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const { userId, error: authError } = await verifyUserToken(authHeader);
  if (authError || !userId) {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Please set GEMINI_API_KEY in environment variables.',
      code: 'API_KEY_MISSING',
    });
  }

  try {
    const body = parseRequestBody(req.body);
    const imageData =
      normalizeBase64(body.originalImage) ??
      normalizeBase64(body.base64Image) ??
      normalizeBase64(body.image);

    if (!imageData) {
      return res.status(400).json({ error: 'Missing image (base64).', code: 'MISSING_IMAGE' });
    }

    const allowedCategories = Array.isArray(body.allowedCategories)
      ? (body.allowedCategories.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) as string[])
      : [];

    const categoryHint = allowedCategories.length > 0
      ? `\nOptional category hint (may be empty): ${allowedCategories.map((c) => `"${c}"`).join(', ')}`
      : '';

    const prompt = `Analyze the provided design/style image and return ONLY valid JSON (no markdown, no extra text).
Schema:
{
  "styleName": "short name",
  "styleDescription": "one detailed sentence describing the style",
  "colors": ["..."],
  "materials": ["..."],
  "furniture": ["..."],
  "lighting": ["..."],
  "keywords": ["..."]
}${categoryHint}`;

    const ai = new GoogleGenAI({ apiKey });

    const preferredModel = getEnvVar('GEMINI_STYLE_MODEL', 'GEMINI_TEXT_MODEL', 'GEMINI_MODEL_TEXT') ?? 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash';

    const isModelNotFoundError = (err: unknown): boolean => {
      const message = err instanceof Error ? err.message : String(err ?? '');
      return (
        message.includes('is not found') ||
        message.includes('NOT_FOUND') ||
        message.includes('not supported for generateContent')
      );
    };

    const runGenerate = async (model: string) => {
      return ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: imageData, mimeType: 'image/png' } },
          ],
        },
      } as any);
    };

    let response;
    try {
      response = await runGenerate(preferredModel);
    } catch (err) {
      if (preferredModel !== fallbackModel && isModelNotFoundError(err)) {
        console.warn(`⚠️ Model "${preferredModel}" unavailable; falling back to "${fallbackModel}"`);
        response = await runGenerate(fallbackModel);
      } else {
        throw err;
      }
    }

    const rawText = (response as any)?.text ?? '';
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!text) {
      return res.status(500).json({ error: 'Empty response from model', code: 'EMPTY_MODEL_RESPONSE' });
    }

    // Best-effort JSON parse with code-fence stripping
    let jsonText = text;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }

    let extracted: any;
    try {
      extracted = JSON.parse(jsonText);
    } catch {
      // Still return the raw text for debugging/compatibility
      return res.status(200).json({
        extracted: null,
        styleDescription: null,
        raw: text,
        code: 'NON_JSON_MODEL_OUTPUT',
      });
    }

    return res.status(200).json({
      extracted,
      styleDescription: extracted?.styleDescription ?? null,
      raw: text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ analyze-style failed:', error);
    return res.status(500).json({ error: 'Failed to analyze style', details: message });
  }
}

