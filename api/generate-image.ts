import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part, Modality } from '@google/genai';
import { Buffer } from 'node:buffer';
import {
  verifyUserToken,
  checkAndDeductCredits,
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

const detectImageType = (
  buffer: Buffer
): { mimeType: string; extension: string } => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF89a' || buffer.toString('ascii', 0, 6) === 'GIF87a')
  ) {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  // Default to PNG if the format cannot be detected reliably
  return { mimeType: 'image/png', extension: 'png' };
};

const buildImageParts = (normalizedImages: string[]): Part[] => {
  return normalizedImages.map((imgData) => {
    try {
      const buffer = Buffer.from(imgData, 'base64');
      if (buffer.length === 0) {
        return null;
      }

      const { mimeType } = detectImageType(buffer);
      
      return {
        inlineData: {
          data: imgData,
          mimeType,
        },
      } as Part;
    } catch (error) {
      console.error('Failed to build image part:', error);
      return null;
    }
  }).filter((value): value is Part => value !== null);
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
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }

  // ========================================
  // 2. 检查并扣除信用点
  // ========================================
  const requiredCredits = CREDIT_COSTS.IMAGE_GENERATION;
  const { 
    success: creditsDeducted, 
    remainingCredits,
    error: creditsError 
  } = await checkAndDeductCredits(userId, requiredCredits);

  if (!creditsDeducted) {
    return res.status(402).json({ 
      error: creditsError || 'Insufficient credits',
      code: 'INSUFFICIENT_CREDITS'
    });
  }

  // ========================================
  // 3. 执行图片生成（使用 Google AI Studio API）
  // ========================================

  // 检查 API Key
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    await refundCredits(userId, requiredCredits);
    return res.status(500).json({ 
      error: 'API key not configured. Please set GEMINI_API_KEY in environment variables.',
      code: 'API_KEY_MISSING'
    });
  }

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
    
    // 准备参考图像
    const normalizedImages = base64Images
      .map(normalizeBase64Image)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    if (normalizedImages.length === 0) {
      await refundCredits(userId, requiredCredits);
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    const imageParts = buildImageParts(normalizedImages);
    if (imageParts.length === 0) {
      await refundCredits(userId, requiredCredits);
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    // 调试日志
    console.log('🔍 API Debug:');
    console.log('- Instruction length:', instruction.length);
    console.log('- Instruction preview:', instruction.substring(0, 100) + '...');
    console.log('- Number of images received:', normalizedImages.length);
    console.log('- Image parts created:', imageParts.length);
    console.log('- Image 1 size:', normalizedImages[0]?.length || 0);
    console.log('- Image 2 size:', normalizedImages[1]?.length || 0);

    // 使用 gemini-2.5-flash-image 模型（支持图像编辑）
    const modelName = 'gemini-2.5-flash-image';

    // 调用 Google AI Studio API（使用原型的简洁配置）
    // 注意：使用简单对象格式而不是数组格式，以确保调用正确的API端点
    
    // 为多图片任务构建更明确的parts数组
    const contentParts: Part[] = [];
    
    // 对于图像编辑任务，明确标记每张图片
    if (imageParts.length === 2) {
      console.log('📸 Multi-image task detected - using explicit labeling');
      contentParts.push(
        { text: 'Image 1 (Base/Room):' },
        imageParts[0],
        { text: 'Image 2 (Object/Item):' },
        imageParts[1],
        { text: instruction }
      );
    } else if (imageParts.length === 1) {
      contentParts.push(
        { text: instruction },
        imageParts[0]
      );
    } else {
      // 多于2张图片的情况
      contentParts.push(
        { text: instruction },
        ...imageParts
      );
    }
    
    const response = await aiClient.models.generateContent({
      model: modelName,
      contents: {
        parts: contentParts
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    } as any);

    // 从响应中提取生成的图像
    const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (generatedImagePart?.inlineData?.data) {
      generationSuccess = true;

      const mimeType = generatedImagePart.inlineData.mimeType ?? 'image/png';
      const base64ImageBytes = generatedImagePart.inlineData.data;
      
      return res.status(200).json({
        imageUrl: `data:${mimeType};base64,${base64ImageBytes}`,
        creditsUsed: requiredCredits,
        creditsRemaining: remainingCredits,
      });
    }

    // 生成失败，回滚信用点
    await refundCredits(userId, requiredCredits);

    return res.status(500).json({
      error: 'API response did not contain image data.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error('❌ Error generating image:', {
      message,
      stack,
      userId,
      errorType: error?.constructor?.name,
      errorDetails: JSON.stringify(error, null, 2)
    });
    
    // 如果生成失败，回滚信用点
    if (!generationSuccess) {
      await refundCredits(userId, requiredCredits);
    }

    return res.status(500).json({
      error: 'Image generation failed. Please try again.',
      details: message,
      code: 'GENERATION_FAILED'
    });
  }
}
