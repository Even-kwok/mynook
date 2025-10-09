import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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
    const { instruction, systemInstruction, base64Image } = req.body;

    if (!instruction) {
      return res.status(400).json({ error: 'instruction is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const parts = [];

    if (base64Image) {
      const imagePart = {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: 'image/png',
        },
      };
      parts.push(imagePart);
    }
    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts }],
      config: systemInstruction ? {
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

