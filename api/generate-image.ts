import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import { promises as fs } from 'fs';
import { Buffer } from 'node:buffer';
import { tmpdir } from 'os';
import { join } from 'path';
import { 
  verifyUserToken, 
  checkCreditsAvailable, 
  deductCredits, 
  refundCredits,
  CREDIT_COSTS,
  logGeneration 
} from './lib/creditsService.js';

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

type UploadedImagePart = { part: { fileData: { fileUri: string; mimeType: string } }; fileName?: string };

const uploadBase64Image = async (
  ai: GoogleGenAI,
  base64Image: string,
  index: number
): Promise<UploadedImagePart | null> => {
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    if (imageBuffer.length === 0) {
      return null;
    }

    const mimeType = 'image/png';
    const blob = new Blob([imageBuffer], { type: mimeType });
    const displayName = `source-image-${Date.now()}-${index}.png`;

    const uploadedFile = await ai.files.upload({
      file: blob,
      config: {
        mimeType,
        displayName,
      },
    });

    const fileUri = uploadedFile.uri ?? uploadedFile.name;
    if (!fileUri) {
      console.error('Uploaded file is missing a URI and name.');
      return null;
    }

    return {
      part: {
        fileData: {
          fileUri,
          mimeType: uploadedFile.mimeType ?? mimeType,
        },
      },
      fileName: uploadedFile.name,
    };
  } catch (error) {
    console.error('Failed to upload base64 image to Gemini Files API:', error);
    return null;
  }
};

const cleanupUploadedFiles = async (ai: GoogleGenAI, uploadedFiles: UploadedImagePart[]) => {
  await Promise.all(
    uploadedFiles
      .map((file) => file.fileName)
      .filter((name): name is string => typeof name === 'string' && name.length > 0)
      .map(async (name) => {
        try {
          await ai.files.delete({ name });
        } catch (cleanupError) {
          console.warn('Failed to delete uploaded source image:', cleanupError);
        }
      })
  );
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

  // ========================================
  // 1. 验证用户身份
  // ========================================
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const { userId, error: authError } = await verifyUserToken(authHeader);
  if (authError || !userId) {
    return res.status(401).json({ 
      error: authError || 'Invalid authentication',
      code: 'AUTH_INVALID'
    });
  }

  // ========================================
  // 2. 检查信用点余额
  // ========================================
  const requiredCredits = CREDIT_COSTS.IMAGE_GENERATION;
  const { available, currentCredits, membershipTier, error: checkError } = await checkCreditsAvailable(userId, requiredCredits);
  
  if (checkError) {
    return res.status(500).json({ 
      error: 'Failed to check credits',
      code: 'CREDITS_CHECK_FAILED'
    });
  }

  if (!available) {
    return res.status(402).json({ 
      error: `Insufficient credits. Required: ${requiredCredits}, Available: ${currentCredits}`,
      code: 'INSUFFICIENT_CREDITS',
      required: requiredCredits,
      available: currentCredits,
      membershipTier
    });
  }

  // ========================================
  // 3. 扣除信用点
  // ========================================
  const { success: deductSuccess, remainingCredits, error: deductError } = await deductCredits(userId, requiredCredits);
  
  if (!deductSuccess) {
    return res.status(500).json({ 
      error: deductError || 'Failed to deduct credits',
      code: 'CREDITS_DEDUCT_FAILED'
    });
  }

  console.log(`✅ Credits deducted for user ${userId}: -${requiredCredits} (remaining: ${remainingCredits})`);

  // ========================================
  // 4. 执行图片生成
  // ========================================

  // Get API key from environment variables (server-side only)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // 回滚信用点
    await refundCredits(userId, requiredCredits);
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' 
    });
  }

  let ai: GoogleGenAI | null = null;
  let uploadedImageParts: UploadedImagePart[] = [];
  let generationSuccess = false;

  try {
    const { instruction, base64Images } = parseRequestBody(req.body);

    if (typeof instruction !== 'string' || !Array.isArray(base64Images) || base64Images.length === 0) {
      // 回滚信用点
      await refundCredits(userId, requiredCredits);
      return res.status(400).json({
        error: 'instruction and base64Images (array) are required'
      });
    }

    const aiClient = new GoogleGenAI({ apiKey });
    ai = aiClient;
    const textPart = { text: instruction };
    const normalizedImages = base64Images
      .map(normalizeBase64Image)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (normalizedImages.length === 0) {
      // 回滚信用点
      await refundCredits(userId, requiredCredits);
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    uploadedImageParts = (
      await Promise.all(
        normalizedImages.map((imgData, index) => uploadBase64Image(aiClient, imgData, index))
      )
    ).filter((value): value is UploadedImagePart => value !== null);

    if (uploadedImageParts.length === 0) {
      await cleanupUploadedFiles(aiClient, uploadedImageParts);
      // 回滚信用点
      await refundCredits(userId, requiredCredits);
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        role: 'user',
        parts: [
          ...uploadedImageParts.map((item) => item.part),
          textPart,
        ],
      }],
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates ?? [];
    let generatedImage: { data: string; mimeType: string } | null = null;

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        const inlineImage = extractInlineImage(part);
        if (inlineImage) {
          generatedImage = {
            data: inlineImage.data,
            mimeType: inlineImage.mimeType ?? 'image/png',
          };
          break;
        }

        const downloaded = await downloadFilePart(aiClient, part);
        if (downloaded) {
          generatedImage = {
            data: downloaded.data,
            mimeType: downloaded.mimeType ?? 'image/png',
          };
          break;
        }
      }

      if (generatedImage) {
        break;
      }
    }

    await cleanupUploadedFiles(aiClient, uploadedImageParts);

    if (generatedImage) {
      generationSuccess = true;
      
      // 记录生成日志
      await logGeneration({
        userId,
        type: 'image',
        creditsUsed: requiredCredits,
        success: true,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        imageUrl: `data:${generatedImage.mimeType};base64,${generatedImage.data}`,
        creditsUsed: requiredCredits,
        creditsRemaining: remainingCredits,
      });
    }

    // 生成失败，回滚信用点
    await refundCredits(userId, requiredCredits);
    await logGeneration({
      userId,
      type: 'image',
      creditsUsed: 0,
      success: false,
      timestamp: new Date().toISOString(),
    });

    console.error('API response did not contain inline or file-based image data:', JSON.stringify(response, null, 2));
    return res.status(500).json({
      error: 'API response did not contain image data.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating image:', error);
    
    // 清理上传的文件
    if (ai && uploadedImageParts.length > 0) {
      await cleanupUploadedFiles(ai, uploadedImageParts);
    }

    // 如果生成失败，回滚信用点
    if (!generationSuccess) {
      await refundCredits(userId, requiredCredits);
      await logGeneration({
        userId,
        type: 'image',
        creditsUsed: 0,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      error: 'Image generation failed. Please try again.',
      details: message,
    });
  }
}
