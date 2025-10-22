import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';
import { verifyUserToken, checkAndDeductCredits, refundCredits, CREDIT_COSTS } from './lib/creditsService.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. 验证用户身份
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

  try {
    const { imageUrl, scale = '2x' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // 验证scale参数
    if (!['2x', '4x', '8x'].includes(scale)) {
      return res.status(400).json({ 
        error: 'scale must be 2x, 4x, or 8x',
        code: 'INVALID_SCALE' 
      });
    }

    // 2. 检查并扣除信用点（统一1点）
    const requiredCredits = CREDIT_COSTS.IMAGE_UPSCALE;
    const { success, remainingCredits, error: creditsError } = await checkAndDeductCredits(
      userId,
      requiredCredits
    );

    if (!success) {
      return res.status(402).json({ 
        error: creditsError || 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        required: requiredCredits
      });
    }

    console.log(`✅ Credits deducted for user ${userId}: -${requiredCredits} (remaining: ${remainingCredits})`);

    // 3. 检查 Replicate API Token
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      await refundCredits(userId, requiredCredits);
      return res.status(500).json({ 
        error: 'Replicate API not configured',
        code: 'API_KEY_MISSING'
      });
    }

    // 4. 调用 Replicate API
    const replicate = new Replicate({
      auth: replicateToken,
    });

    console.log(`🔍 Starting upscale: ${scale} for user ${userId}`);
    console.log(`- Image URL: ${imageUrl}`);
    console.log(`- Token length: ${replicateToken.length}`);

    const scaleNumber = parseInt(scale.replace('x', ''));

    console.log('🚀 Calling Replicate API...');
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: imageUrl,
          scale: scaleNumber,
          face_enhance: false,
        }
      }
    );

    console.log(`✅ Upscale completed for user ${userId}`);
    console.log(`- Output type: ${typeof output}`);
    console.log(`- Output constructor: ${output?.constructor?.name}`);
    
    // Replicate 可能返回不同格式，需要正确提取 URL
    let upscaledImageUrl: string;
    
    if (Array.isArray(output)) {
      // 格式1：数组 ["https://..."]
      upscaledImageUrl = output[0];
    } else if (typeof output === 'string') {
      // 格式2：直接字符串 "https://..."
      upscaledImageUrl = output;
    } else if (output && typeof output === 'object') {
      // 格式3：FileOutput 对象或包含 url 的对象
      if (typeof (output as any).url === 'function') {
        // url 是方法，需要调用
        upscaledImageUrl = (output as any).url();
      } else if (typeof (output as any).url === 'string') {
        // url 是属性
        upscaledImageUrl = (output as any).url;
      } else if (typeof (output as any).toString === 'function') {
        // 尝试 toString()
        const str = (output as any).toString();
        if (str.startsWith('http')) {
          upscaledImageUrl = str;
        } else {
          throw new Error(`Cannot extract URL from output: ${str}`);
        }
      } else {
        throw new Error(`Output object has no url property or method`);
      }
    } else {
      throw new Error(`Unexpected output format: ${typeof output}`);
    }

    console.log(`📷 Final image URL: ${upscaledImageUrl}`);

    return res.status(200).json({
      success: true,
      upscaledImageUrl: upscaledImageUrl,
      scale: scale,
      creditsUsed: requiredCredits,
      remainingCredits: remainingCredits,
    });

  } catch (error) {
    console.error('❌ Upscale error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // 尝试获取更多错误信息
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    
    // 失败时退款
    if (userId) {
      const requiredCredits = CREDIT_COSTS.IMAGE_UPSCALE;
      await refundCredits(userId, requiredCredits);
      console.log(`💰 Refunded ${requiredCredits} credits to user ${userId}`);
    }

    return res.status(500).json({
      error: 'Image upscaling failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name,
      code: 'UPSCALE_FAILED'
    });
  }
}

