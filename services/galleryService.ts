/**
 * Gallery 数据服务
 * 处理 gallery_items 表的 CRUD 操作
 */

import { supabase } from '../config/supabase';
import { GalleryItem } from '../types';

export interface GalleryItemData {
  storage_path: string;
  category: string;
  category_name: string;
  tool_page: string;
  title: string;
  author?: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  display_order?: number;
  is_active?: boolean;
}

export interface GalleryItemDB {
  id: string;
  storage_path: string;
  category: string;
  category_name: string;
  tool_page: string;
  title: string;
  author: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 转换数据库记录为前端 GalleryItem 格式
 */
const convertToGalleryItem = (dbItem: GalleryItemDB): GalleryItem => {
  // 获取公开 URL
  const { data } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(dbItem.storage_path);
  
  return {
    id: dbItem.id,
    type: dbItem.type,
    src: data.publicUrl,
    title: dbItem.title,
    author: dbItem.author,
    authorAvatarUrl: 'https://storage.googleapis.com/aistudio-hosting/blog/avatar.png',
    width: dbItem.width,
    height: dbItem.height,
    category: dbItem.category,
    categoryName: dbItem.category_name,
    toolPage: dbItem.tool_page
  };
};

/**
 * 获取所有激活的图片墙项目
 */
export const fetchGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch gallery items error:', error);
      return [];
    }
    
    return data.map(convertToGalleryItem);
  } catch (error) {
    console.error('Fetch gallery items error:', error);
    return [];
  }
};

/**
 * 获取所有图片墙项目（包括未激活的，管理员用）
 */
export const fetchAllGalleryItems = async (): Promise<GalleryItemDB[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch all gallery items error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Fetch all gallery items error:', error);
    return [];
  }
};

/**
 * 按分类获取图片墙项目
 */
export const fetchGalleryItemsByCategory = async (category: string): Promise<GalleryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Fetch gallery items by category error:', error);
      return [];
    }
    
    return data.map(convertToGalleryItem);
  } catch (error) {
    console.error('Fetch gallery items by category error:', error);
    return [];
  }
};

/**
 * 创建新的图片墙项目
 */
export const createGalleryItem = async (itemData: GalleryItemData): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .insert([{
        storage_path: itemData.storage_path,
        category: itemData.category,
        category_name: itemData.category_name,
        tool_page: itemData.tool_page,
        title: itemData.title,
        author: itemData.author || 'MyNook Team',
        type: itemData.type,
        width: itemData.width,
        height: itemData.height,
        display_order: itemData.display_order || 0,
        is_active: itemData.is_active !== undefined ? itemData.is_active : true
      }])
      .select('id')
      .single();
    
    if (error) {
      console.error('Create gallery item error:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Create gallery item error:', error);
    return null;
  }
};

/**
 * 批量创建图片墙项目
 */
export const createGalleryItemsBatch = async (items: GalleryItemData[]): Promise<string[]> => {
  const createdIds: string[] = [];
  
  for (const item of items) {
    const id = await createGalleryItem(item);
    if (id) {
      createdIds.push(id);
    }
  }
  
  return createdIds;
};

/**
 * 更新图片墙项目
 */
export const updateGalleryItem = async (
  id: string,
  updates: Partial<GalleryItemData>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gallery_items')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Update gallery item error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Update gallery item error:', error);
    return false;
  }
};

/**
 * 删除图片墙项目
 */
export const deleteGalleryItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete gallery item error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete gallery item error:', error);
    return false;
  }
};

/**
 * 切换项目的激活状态
 */
export const toggleGalleryItemActive = async (id: string, isActive: boolean): Promise<boolean> => {
  return updateGalleryItem(id, { is_active: isActive });
};

/**
 * 重新排序图片墙项目
 */
export const reorderGalleryItems = async (
  itemIds: string[],
  startOrder: number = 0
): Promise<boolean> => {
  try {
    const updates = itemIds.map((id, index) => ({
      id,
      display_order: startOrder + index
    }));
    
    for (const update of updates) {
      await supabase
        .from('gallery_items')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
    
    return true;
  } catch (error) {
    console.error('Reorder gallery items error:', error);
    return false;
  }
};

