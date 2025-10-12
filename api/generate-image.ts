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

  // 优化：使用固定的凭据文件名，避免每次创建新文件
  // 这样可以重用已有文件，减少I/O操作
  const tempCredPath = join('/tmp', `gcloud-creds-${credentials.project_id}.json`);
  
  try {
    // 只在文件不存在时才写入，节省时间
    if (!existsSync(tempCredPath)) {
      writeFileSync(tempCredPath, credentialsJson);
      console.log(`✅ Credentials written to temp file: ${tempCredPath}`);
    } else {
      console.log(`✅ Reusing existing credentials file: ${tempCredPath}`);
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
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

    const startTime = Date.now();
    console.log(`🔧 [${startTime}] Initializing Vertex AI client for user ${userId}...`);
    const aiClient = new GoogleGenAI({ 
      vertexai: true,
      project: credentials.project_id,
      location,
    });
    console.log(`📝 Instruction length: ${instruction.length} chars, Images: ${base64Images.length}`);
    
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
    const prepTime = Date.now() - startTime;
    console.log(`🤖 Using model: ${modelName} via Vertex AI (prep: ${prepTime}ms)`);
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

    // 设置请求超时为90秒（给Vertex AI充足时间）
    const apiStartTime = Date.now();
    console.log(`📡 [${apiStartTime}] Starting Vertex AI API call...`);
    
    const requestTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error(`⏱️ Vertex AI timeout triggered after 90 seconds`);
        reject(new Error('Vertex AI request timeout after 90 seconds'));
      }, 90000);
    });

    const generateRequest = aiClient.models.generateContent({
      model: modelName,
      contents,
    }).then(res => {
      const apiTime = Date.now() - apiStartTime;
      console.log(`✅ Vertex AI responded in ${apiTime}ms (${(apiTime/1000).toFixed(1)}s)`);
      return res;
    });

    // 使用Promise.race来实现超时控制
    const response = await Promise.race([generateRequest, requestTimeout]);

    // 从响应中提取生成的图像
    const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (generatedImagePart?.inlineData?.data) {
      generationSuccess = true;
      const totalTime = Date.now() - startTime;

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
      
      console.log(`✅ Image generated successfully for user ${userId} in ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
      
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
    // 保留凭据文件以供后续请求重用，不再每次删除
    // 这显著提升了第二次及后续请求的速度
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS === tempCredPath) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
    console.log(`✅ Request completed, credentials file retained for reuse`);
  }
}
