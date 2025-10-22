import { supabase } from '../config/supabase';

export interface UpscaleOptions {
  imageUrl: string;
  scale: '2x' | '4x' | '8x';
}

export interface UpscaleResult {
  success: boolean;
  upscaledImageUrl: string;
  scale: string;
  creditsUsed: number;
  remainingCredits: number;
}

/**
 * 放大图片
 */
export const upscaleImage = async (
  options: UpscaleOptions
): Promise<UpscaleResult> => {
  // 获取认证token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('请先登录才能使用放大功能');
  }

  console.log('🚀 Calling upscale API:', {
    imageUrl: options.imageUrl.substring(0, 50) + '...',
    scale: options.scale,
  });

  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      throw new Error('认证失败，请重新登录');
    } else if (response.status === 402) {
      throw new Error(`信用点不足。需要 ${error.required} 点，请充值后再试`);
    }
    
    throw new Error(error.error || '图片放大失败');
  }

  const result = await response.json();
  console.log('✅ Upscale success:', result);
  
  return result;
};

/**
 * 获取放大后的分辨率信息
 */
export const getUpscaleResolution = (originalSize: number, scale: '2x' | '4x' | '8x'): number => {
  const multiplier = parseInt(scale.replace('x', ''));
  return originalSize * multiplier;
};

/**
 * 获取放大所需信用点（固定为1点）
 */
export const getUpscaleCreditCost = (): number => {
  return 1;
};

