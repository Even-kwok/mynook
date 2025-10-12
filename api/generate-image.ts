import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part } from '@google/genai';
import { Buffer } from 'node:buffer';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
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
  
  console.log(`✅ User ${userId} authenticated successfully`);

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

  console.log(`✅ Credits deducted for user ${userId}: -${requiredCredits} (remaining: ${remainingCredits})`);

  // ========================================
  // 3. 执行图片生成（使用 Vertex AI）
  // ========================================

  // 检查 Vertex AI 环境变量
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!project || !credentialsJson) {
    await refundCredits(userId, requiredCredits);
    console.error('❌ Missing Vertex AI configuration');
    console.error('GOOGLE_CLOUD_PROJECT:', !!project);
    console.error('GOOGLE_APPLICATION_CREDENTIALS_JSON:', !!credentialsJson);
    return res.status(500).json({ 
      error: 'Vertex AI not properly configured. Please check environment variables.',
      code: 'VERTEX_AI_CONFIG_MISSING',
      hint: 'Required: GOOGLE_CLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS_JSON'
    });
  }

  console.log(`✅ Vertex AI config found: project=${project}, location=${location}`);

  // 解析凭据
  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
    console.log(`✅ Credentials parsed successfully: ${credentials.client_email}`);
  } catch (err) {
    await refundCredits(userId, requiredCredits);
    console.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', err);
    return res.status(500).json({ 
      error: 'Invalid Vertex AI credentials format. JSON parse failed.',
      code: 'VERTEX_AI_CREDENTIALS_INVALID'
    });
  }

  // 将凭据写入临时文件（Vercel 的 /tmp 目录可写）
  const tempCredPath = join('/tmp', `gcloud-creds-${userId}-${Date.now()}.json`);
  
  try {
    writeFileSync(tempCredPath, credentialsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
    console.log(`✅ Credentials written to temp file: ${tempCredPath}`);
  } catch (writeErr) {
    await refundCredits(userId, requiredCredits);
    console.error('❌ Failed to write credentials file:', writeErr);
    return res.status(500).json({ 
      error: 'Failed to setup Vertex AI credentials',
      code: 'CREDENTIALS_SETUP_FAILED'
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

    console.log(`🔧 Initializing Vertex AI client for user ${userId}...`);
    const aiClient = new GoogleGenAI({ 
      vertexai: true,
      project: credentials.project_id,
      location,
    });
    console.log(`📝 Instruction: ${instruction.substring(0, 100)}...`);
    
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
      console.error('❌ No valid image parts could be built');
      return res.status(400).json({
        error: 'No valid base64 images were provided for generation.'
      });
    }

    // 使用 gemini-2.5-flash-image 模型（支持图像编辑）
    const modelName = 'gemini-2.5-flash-image';
    console.log(`🤖 Using model: ${modelName} via Vertex AI`);
    console.log(`📤 Calling Vertex AI with ${imageParts.length} reference image(s)...`);

    // 构建内容：图像 + 文本提示
    const contents = [
      {
        role: 'user',
        parts: [
          ...imageParts,
          { text: instruction }
        ]
      }
    ];

    const response = await aiClient.models.generateContent({
      model: modelName,
      contents,
    });

    // 从响应中提取生成的图像
    const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (generatedImagePart?.inlineData?.data) {
      generationSuccess = true;

      // 记录生成日志
      await logGeneration({
        userId,
        type: 'image',
        creditsUsed: requiredCredits,
        success: true,
        timestamp: new Date().toISOString(),
      });

      const mimeType = generatedImagePart.inlineData.mimeType ?? 'image/png';
      const base64ImageBytes = generatedImagePart.inlineData.data;
      
      console.log(`✅ Image generated successfully for user ${userId}`);
      
      return res.status(200).json({
        imageUrl: `data:${mimeType};base64,${base64ImageBytes}`,
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

    console.error('API response did not contain generated image data:', JSON.stringify(response, null, 2));
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
      console.log(`💰 Refunded ${requiredCredits} credits to user ${userId}`);
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
      code: 'GENERATION_FAILED'
    });
  } finally {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS === tempCredPath) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
    if (existsSync(tempCredPath)) {
      try {
        unlinkSync(tempCredPath);
        console.log(`🧹 Cleaned up temp credentials file: ${tempCredPath}`);
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to remove temp credentials file:', cleanupErr);
      }
    }
  }
}
