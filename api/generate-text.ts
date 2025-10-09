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
    const parts = [];

    if (typeof base64Image === 'string' && base64Image.length > 0) {
      const [, imageData = base64Image] = base64Image.includes(',')
        ? base64Image.split(',')
        : [null, base64Image];
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/png',
        },
      };
      parts.push(imagePart);
    }
    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts }],
      config: typeof systemInstruction === 'string' && systemInstruction.trim().length > 0 ? {
        systemInstruction: systemInstruction,
      } : undefined,
    });

    return res.status(200).json({ 
      text: response.text 
    });
  } catch (error) {
    console.error('Error generating text response:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response. Please try again.' 
    });
  }
}
