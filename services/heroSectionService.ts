import { supabase } from '../config/supabase';
import { HeroSection } from '../types';

/**
 * 获取 Hero Section 数据（单例）
 */
export async function getHeroSection(): Promise<HeroSection | null> {
  const { data, error } = await supabase
    .from('hero_section')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching hero section:', error);
    return null;
  }

  return data;
}

/**
 * 获取 Hero Section（管理后台，包括未激活的）
 */
export async function getHeroSectionForAdmin(): Promise<HeroSection | null> {
  const { data, error } = await supabase
    .from('hero_section')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching hero section for admin:', error);
    return null;
  }

  return data;
}

/**
 * 更新 Hero Section
 */
export async function updateHeroSection(
  id: string,
  updates: Partial<Omit<HeroSection, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('hero_section')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating hero section:', error);
    throw error;
  }
}

/**
 * 上传 Hero Section 媒体文件到 Supabase Storage
 */
export async function uploadHeroMedia(
  file: File,
  mediaType: 'main' | 'before' | 'after'
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `hero-${mediaType}-${Date.now()}.${fileExt}`;
  const filePath = `hero/${fileName}`;

  // 上传文件
  const { error: uploadError } = await supabase.storage
    .from('home-sections')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  // 获取公开 URL
  const { data } = supabase.storage
    .from('home-sections')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 删除 Storage 中的媒体文件
 */
export async function deleteHeroMedia(url: string): Promise<void> {
  try {
    // 从 URL 中提取文件路径
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'home-sections');
    
    if (bucketIndex === -1) {
      console.warn('Not a valid home-sections storage URL:', url);
      return;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('home-sections')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error parsing URL or deleting file:', err);
  }
}

