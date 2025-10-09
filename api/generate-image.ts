import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

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
    const { instruction, base64Images } = req.body;

    if (!instruction || !base64Images || !Array.isArray(base64Images)) {
      return res.status(400).json({ 
        error: 'instruction and base64Images (array) are required' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const textPart = { text: instruction };
    const imageParts = base64Images.map((imgData: string) => ({
      inlineData: {
        data: imgData,
        mimeType: 'image/png',
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        parts: [
          ...imageParts,
          textPart,
        ],
      }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );
    
    if (imagePart && imagePart.inlineData) {
      const base64Data = imagePart.inlineData.data;
      return res.status(200).json({ 
        imageUrl: `data:image/png;base64,${base64Data}` 
      });
    }
    
    return res.status(500).json({ 
      error: 'API response did not contain image data.' 
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      error: 'Image generation failed. Please try again.' 
    });
  }
}

