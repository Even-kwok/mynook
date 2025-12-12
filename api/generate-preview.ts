import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part, Modality } from '@google/genai';
import { Buffer } from 'node:buffer';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';
import { resolveGeminiImageModel } from './_lib/aiModels.js';

// Initialize Supabase admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const normalizeBase64Image = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
};

const detectImageType = (buffer: Buffer): { mimeType: string; extension: string } => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return { mimeType: 'image/png', extension: 'png' };
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication check
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  let userId: string | null = null;
  let isAdmin = false;

  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    isAdmin = true;
  } else {
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const { userId: verifiedUserId, error: authError } = await verifyUserToken(authHeader);
    if (authError || !verifiedUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    userId = verifiedUserId;

    // Verify admin permission
    const { data: adminData, error: adminError } = await (supabaseAdmin as any)
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (adminError || !adminData || !adminData.is_active) {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    isAdmin = true;
  }

  const { baseImage, prompt } = req.body;

  if (!baseImage || !prompt) {
    return res.status(400).json({ error: 'Missing baseImage or prompt' });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    const normalizedImage = normalizeBase64Image(baseImage);
    
    if (!normalizedImage) {
      return res.status(400).json({ error: 'Invalid base image' });
    }

    const buffer = Buffer.from(normalizedImage, 'base64');
    const { mimeType } = detectImageType(buffer);
    const imagePart: Part = {
      inlineData: {
        data: normalizedImage,
        mimeType,
      },
    };

    // Using latest image model (default: gemini-3-pro-image-preview)
    const modelName = resolveGeminiImageModel();

    const contentParts: Part[] = [
      { text: prompt },
      imagePart
    ];

    const response = await aiClient.models.generateContent({
      model: modelName,
      contents: {
        parts: contentParts
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    } as any);

    const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (generatedImagePart?.inlineData?.data) {
      const mimeType = generatedImagePart.inlineData.mimeType ?? 'image/png';
      const base64ImageBytes = generatedImagePart.inlineData.data;
      
      return res.status(200).json({
        success: true,
        imageUrl: `data:${mimeType};base64,${base64ImageBytes}`
      });
    }

    throw new Error('No image data in response');

  } catch (error) {
    console.error('Generate preview error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Generation failed',
      details: error instanceof Error ? error.toString() : 'Unknown error'
    });
  }
}

