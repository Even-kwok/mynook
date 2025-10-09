import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

interface GenerateTextRequestBody {
  instruction?: unknown;
  systemInstruction?: unknown;
  base64Image?: unknown;
}

const parseRequestBody = (body: VercelRequest['body']): GenerateTextRequestBody => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return {};
    }
  }

  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf-8'));
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return {};
    }
  }

  return body as GenerateTextRequestBody;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables (server-side only)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' 
    });
  }

  try {
    const { instruction, systemInstruction, base64Image } = parseRequestBody(req.body);

    if (typeof instruction !== 'string' || instruction.trim().length === 0) {
      return res.status(400).json({ error: 'instruction is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const sanitizedInstruction = instruction.trim();
    const parts = [] as Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;

    if (typeof base64Image === 'string' && base64Image.length > 0) {
      const trimmedImage = base64Image.trim();
      const commaIndex = trimmedImage.indexOf(',');
      const imageData = commaIndex >= 0 ? trimmedImage.slice(commaIndex + 1) : trimmedImage;
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData,
            mimeType: 'image/png',
          },
        });
      }
    }

    parts.push({ text: sanitizedInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts,
      }],
      config: typeof systemInstruction === 'string' && systemInstruction.trim().length > 0 ? {
        systemInstruction: systemInstruction.trim(),
      } : undefined,
    });

    return res.status(200).json({
      text: response.text ?? ''
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating text response:', error);
    return res.status(500).json({
      error: 'Failed to generate response. Please try again.',
      details: message,
    });
  }
}
