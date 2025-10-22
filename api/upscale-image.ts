import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';
import { verifyUserToken, checkAndDeductCredits, refundCredits, CREDIT_COSTS } from './lib/creditsService';

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
    console.log(`- Image URL: ${imageUrl.substring(0, 50)}...`);

    const scaleNumber = parseInt(scale.replace('x', ''));

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

    return res.status(200).json({
      success: true,
      upscaledImageUrl: output,
      scale: scale,
      creditsUsed: requiredCredits,
      remainingCredits: remainingCredits,
    });

  } catch (error) {
    console.error('❌ Upscale error:', error);
    
    // 失败时退款
    if (userId) {
      const requiredCredits = CREDIT_COSTS.IMAGE_UPSCALE;
      await refundCredits(userId, requiredCredits);
      console.log(`💰 Refunded ${requiredCredits} credits to user ${userId}`);
    }

    return res.status(500).json({
      error: 'Image upscaling failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'UPSCALE_FAILED'
    });
  }
}

