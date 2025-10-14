import { supabase } from '../config/supabase';
import { HomeSection } from '../types';

/**
 * 获取所有激活的 Home Sections（按 sort_order 排序）
 */
export async function getAllHomeSections(): Promise<HomeSection[]> {
  const { data, error } = await supabase
    .from('home_sections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching home sections:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取所有 Home Sections（包括未激活的，用于管理后台）
 */
export async function getAllHomeSectionsForAdmin(): Promise<HomeSection[]> {
  const { data, error } = await supabase
    .from('home_sections')
    .select('*')
    .order('section_number', { ascending: true });

  if (error) {
    console.error('Error fetching home sections for admin:', error);
    throw error;
  }

  return data || [];
}

/**
 * 根据 section_number 获取单个 Section
 */
export async function getHomeSectionByNumber(sectionNumber: number): Promise<HomeSection | null> {
  const { data, error } = await supabase
    .from('home_sections')
    .select('*')
    .eq('section_number', sectionNumber)
    .single();

  if (error) {
    console.error(`Error fetching section ${sectionNumber}:`, error);
    return null;
  }

  return data;
}

/**
 * 更新 Home Section
 */
export async function updateHomeSection(
  id: string,
  updates: Partial<Omit<HomeSection, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('home_sections')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating home section:', error);
    throw error;
  }
}

/**
 * 上传 Section 图片到 Supabase Storage
 */
export async function uploadSectionMedia(
  file: File,
  sectionNumber: number,
  mediaType: 'main' | 'before' | 'after'
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `section-${sectionNumber}-${mediaType}-${Date.now()}.${fileExt}`;
  const filePath = `sections/${fileName}`;

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
export async function deleteSectionMedia(url: string): Promise<void> {
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

/**
 * 创建 Storage Bucket（如果不存在）
 * 注意：这个函数需要管理员权限，通常在初始化时执行一次
 */
export async function ensureHomeSectionsBucketExists(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  const bucketExists = buckets?.some(bucket => bucket.name === 'home-sections');
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket('home-sections', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
    });

    if (error) {
      console.error('Error creating home-sections bucket:', error);
      throw error;
    }
  }
}

