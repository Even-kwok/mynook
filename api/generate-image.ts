import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

interface GenerateImageRequestBody {
  instruction?: unknown;
  base64Images?: unknown;
}

const parseRequestBody = (body: VercelRequest['body']): GenerateImageRequestBody => {
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

  return body as GenerateImageRequestBody;
};

const extractInlineImage = (part: any): { data: string; mimeType: string | undefined } | null => {
  if (part?.inlineData?.data) {
    return {
      data: part.inlineData.data,
      mimeType: part.inlineData.mimeType,
    };
  }
  return null;
};

const normalizeBase64Image = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
};

const downloadFilePart = async (
  ai: GoogleGenAI,
  part: any
): Promise<{ data: string; mimeType: string | undefined } | null> => {
  const fileUri: unknown = part?.fileData?.fileUri;
  if (typeof fileUri !== 'string' || !fileUri) {
    return null;
  }

  const mimeType: string | undefined = part?.fileData?.mimeType;
  const extension = mimeType?.split('/')?.[1] ?? 'png';
  const tempPath = join(tmpdir(), `gemini-image-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);

  try {
    await ai.files.download({ file: fileUri, downloadPath: tempPath });
    const fileBuffer = await fs.readFile(tempPath);
    return {
      data: fileBuffer.toString('base64'),
      mimeType,
    };
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors but log for visibility
      console.warn('Failed to remove temporary image file:', cleanupError);
    }
  }
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
    const { instruction, base64Images } = parseRequestBody(req.body);

    if (typeof instruction !== 'string' || !Array.isArray(base64Images) || base64Images.length === 0) {
      return res.status(400).json({
        error: 'instruction and base64Images (array) are required'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const textPart = { text: instruction };
    const normalizedImages = base64Images
      .map(normalizeBase64Image)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (normalizedImages.length === 0) {
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    const imageParts = normalizedImages.map((imgData) => ({
      inlineData: {
        data: imgData,
        mimeType: 'image/png',
      },
    }));

    if (imageParts.length === 0) {
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [
          ...imageParts,
          textPart,
        ],
      }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        const inlineImage = extractInlineImage(part);
        if (inlineImage) {
          const mimeType = inlineImage.mimeType ?? 'image/png';
          return res.status(200).json({
            imageUrl: `data:${mimeType};base64,${inlineImage.data}`,
          });
        }

        const downloaded = await downloadFilePart(ai, part);
        if (downloaded) {
          const mimeType = downloaded.mimeType ?? 'image/png';
          return res.status(200).json({
            imageUrl: `data:${mimeType};base64,${downloaded.data}`,
          });
        }
      }
    }

    console.error('API response did not contain inline or file-based image data:', JSON.stringify(response, null, 2));
    return res.status(500).json({
      error: 'API response did not contain image data.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating image:', error);
    return res.status(500).json({
      error: 'Image generation failed. Please try again.',
      details: message,
    });
  }
}
