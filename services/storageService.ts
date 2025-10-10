/**
 * Supabase Storage 服务
 * 处理图片上传、删除、优化等操作
 */

import { supabase } from '../config/supabase';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
}

/**
 * 获取图片元数据
 */
export const getImageMetadata = (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * 优化图片 - 压缩大图片
 */
export const optimizeImage = async (file: File, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // 如果图片小于最大宽度，直接返回原文件
      if (img.width <= maxWidth && file.size < 1024 * 1024) { // < 1MB
        resolve(file);
        return;
      }
      
      // 计算新尺寸
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (img.width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (img.height * maxWidth) / img.width;
      }
      
      // 创建 canvas 进行压缩
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          // 创建新文件
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`Optimized: ${(file.size / 1024).toFixed(2)}KB -> ${(optimizedFile.size / 1024).toFixed(2)}KB`);
          resolve(optimizedFile);
        },
        'image/jpeg',
        0.85 // 85% 质量
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * 生成唯一文件名
 */
const generateFileName = (originalName: string, category: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'jpg';
  return `${category}/${timestamp}-${random}.${ext}`;
};

/**
 * 上传单张图片到 Supabase Storage
 */
export const uploadImage = async (
  file: File,
  category: string,
  bucket: string = 'gallery-images'
): Promise<UploadResult> => {
  try {
    // 优化图片
    const optimizedFile = await optimizeImage(file);
    
    // 生成文件路径
    const filePath = generateFileName(file.name, category);
    
    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, optimizedFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
    
    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * 批量上传图片
 */
export const uploadBatch = async (
  files: File[],
  category: string,
  onProgress?: (index: number, total: number) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], category);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return results;
};

/**
 * 删除图片
 */
export const deleteImage = async (
  path: string,
  bucket: string = 'gallery-images'
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * 获取公开 URL
 */
export const getPublicUrl = (
  path: string,
  bucket: string = 'gallery-images'
): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

