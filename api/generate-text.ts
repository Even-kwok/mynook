import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { 
  verifyUserToken, 
  checkCreditsAvailable, 
  deductCredits, 
  refundCredits,
  CREDIT_COSTS,
  logGeneration 
} from './lib/creditsService.js';

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
  const requiredCredits = CREDIT_COSTS.TEXT_GENERATION;
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
  // 4. 执行文本生成
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

  let generationSuccess = false;

  try {
    const { instruction, systemInstruction, base64Image } = parseRequestBody(req.body);

    if (typeof instruction !== 'string' || instruction.trim().length === 0) {
      // 回滚信用点
      await refundCredits(userId, requiredCredits);
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

    generationSuccess = true;

    // 记录生成日志
    await logGeneration({
      userId,
      type: 'text',
      creditsUsed: requiredCredits,
      success: true,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      text: response.text ?? '',
      creditsUsed: requiredCredits,
      creditsRemaining: remainingCredits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating text response:', error);

    // 如果生成失败，回滚信用点
    if (!generationSuccess) {
      await refundCredits(userId, requiredCredits);
      await logGeneration({
        userId,
        type: 'text',
        creditsUsed: 0,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      error: 'Failed to generate response. Please try again.',
      details: message,
    });
  }
}
