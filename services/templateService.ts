/**
 * 模板服务
 * 处理设计模板的增删改查操作
 */

import { supabase } from '../config/supabase';
import { PromptTemplate, ManagedPromptTemplateCategory, ManagedTemplateData } from '../types';

export interface DesignTemplate {
  id: string;
  name: string;
  image_url: string;
  prompt: string;
  main_category: string;
  sub_category: string;
  room_type?: string | null; // 房间类型，仅用于Interior Design
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateCategory {
  main_category: string;
  sub_category: string;
  display_name: string;
  enabled: boolean;
  sort_order: number;
}

/**
 * 获取所有模板（按分类组织）
 * 对于Interior Design，按room_type分组
 */
export async function getAllTemplates(): Promise<ManagedTemplateData> {
  try {
    // Admin用：获取所有模板（包括禁用的），这样管理员才能管理它们
    const { data, error } = await supabase
      .from('design_templates')
      .select('*')
      // 不过滤 enabled 状态，Admin Panel 需要看到所有模板
      .order('sort_order')
      .order('name');

    if (error) throw error;

    // 将数据库数据转换为前端需要的格式
    const templates = data as DesignTemplate[];
    const grouped: ManagedTemplateData = {};

    templates.forEach(template => {
      const mainCat = template.main_category;
      const subCat = template.sub_category;

      // 初始化主分类
      if (!grouped[mainCat]) {
        grouped[mainCat] = [];
      }

      // 对于Interior Design，使用room_type作为key
      // 对于其他分类，使用sub_category
      const categoryKey = template.room_type || subCat;

      // 查找或创建子分类
      let subCategory = grouped[mainCat].find(sc => sc.name === categoryKey);
      if (!subCategory) {
        // 子分类的 enabled 状态：使用第一个模板的状态作为初始值
        subCategory = {
          name: categoryKey,
          templates: [],
          enabled: template.enabled
        };
        grouped[mainCat].push(subCategory);
      }

      // 添加模板
      subCategory.templates.push({
        id: template.id,
        name: template.name,
        imageUrl: template.image_url,
        prompt: template.prompt,
        category: template.main_category,
        roomType: template.room_type,
        subCategory: template.sub_category // 添加 sub_category 字段用于前端重新分组
      });
      
      // 更新子分类的 enabled 状态：如果有任何模板是启用的，子分类就是启用的
      if (template.enabled) {
        subCategory.enabled = true;
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * 获取指定主分类的模板
 */
export async function getTemplatesByMainCategory(mainCategory: string): Promise<ManagedPromptTemplateCategory[]> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('main_category', mainCategory)
      .eq('enabled', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;

    const templates = data as DesignTemplate[];
    const grouped: { [key: string]: ManagedPromptTemplateCategory } = {};

    templates.forEach(template => {
      const subCat = template.sub_category;
      
      if (!grouped[subCat]) {
        grouped[subCat] = {
          name: subCat,
          templates: [],
          enabled: true
        };
      }

      grouped[subCat].templates.push({
        id: template.id,
        name: template.name,
        imageUrl: template.image_url,
        prompt: template.prompt,
        category: template.main_category
      });
    });

    return Object.values(grouped);
  } catch (error) {
    console.error('Error fetching templates by category:', error);
    throw error;
  }
}

/**
 * 创建新模板
 */
export async function createTemplate(
  template: Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<DesignTemplate> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data as DesignTemplate;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * 更新模板
 */
export async function updateTemplate(
  id: string,
  updates: Partial<Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<DesignTemplate> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DesignTemplate;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * 删除模板
 */
export async function deleteTemplate(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('design_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * 批量删除模板
 * @param templateIds - 要删除的模板ID数组
 */
export async function batchDeleteTemplates(templateIds: string[]): Promise<void> {
  try {
    if (templateIds.length === 0) return;
    
    // 限制单次删除数量
    if (templateIds.length > 100) {
      throw new Error('Cannot delete more than 100 templates at once');
    }
    
    const { error } = await supabase
      .from('design_templates')
      .delete()
      .in('id', templateIds);

    if (error) throw error;
    
    console.log(`✅ Batch deleted ${templateIds.length} templates`);
  } catch (error) {
    console.error('Error batch deleting templates:', error);
    throw error;
  }
}

/**
 * 批量导入模板
 */
export async function batchImportTemplates(
  templates: Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at'>[]
): Promise<DesignTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .insert(templates)
      .select();

    if (error) throw error;
    return data as DesignTemplate[];
  } catch (error) {
    console.error('Error batch importing templates:', error);
    throw error;
  }
}

/**
 * 切换模板启用状态
 */
export async function toggleTemplateEnabled(id: string, enabled: boolean): Promise<void> {
  try {
    await updateTemplate(id, { enabled });
  } catch (error) {
    console.error('Error toggling template:', error);
    throw error;
  }
}

/**
 * 更新模板排序
 */
export async function updateTemplateSortOrder(id: string, sortOrder: number): Promise<void> {
  try {
    await updateTemplate(id, { sort_order: sortOrder });
  } catch (error) {
    console.error('Error updating sort order:', error);
    throw error;
  }
}

/**
 * 批量更新某个分类下所有模板的 enabled 状态
 * @param mainCategory - 主分类名称
 * @param subCategoryOrRoomType - 子分类名称或房间类型
 * @param enabled - 启用/禁用状态
 */
export async function toggleCategoryEnabled(
  mainCategory: string,
  subCategoryOrRoomType: string,
  enabled: boolean
): Promise<void> {
  try {
    // 对于 Interior Design，使用 room_type 过滤
    // 对于其他分类，使用 sub_category 过滤
    const isInteriorDesign = mainCategory === 'Interior Design';
    
    let query = supabase
      .from('design_templates')
      .update({ enabled })
      .eq('main_category', mainCategory);
    
    if (isInteriorDesign) {
      query = query.eq('room_type', subCategoryOrRoomType);
    } else {
      query = query.eq('sub_category', subCategoryOrRoomType);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    
    console.log(`✅ Toggled ${mainCategory} > ${subCategoryOrRoomType} to ${enabled}`);
  } catch (error) {
    console.error('Error toggling category enabled:', error);
    throw error;
  }
}

/**
 * 批量更新整个主分类下所有模板的 enabled 状态
 * @param mainCategory - 主分类名称
 * @param enabled - 启用/禁用状态
 */
export async function toggleMainCategoryEnabled(
  mainCategory: string,
  enabled: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('design_templates')
      .update({ enabled })
      .eq('main_category', mainCategory);
    
    if (error) throw error;
    
    console.log(`✅ Toggled entire ${mainCategory} to ${enabled}`);
  } catch (error) {
    console.error('Error toggling main category enabled:', error);
    throw error;
  }
}

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<TemplateCategory[]> {
  try {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('enabled', true)
      .order('sort_order');

    if (error) throw error;
    return data as TemplateCategory[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * 获取所有实际存在的房间类型（用于 Interior Design）
 */
export async function getInteriorRoomTypes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .select('room_type')
      .eq('main_category', 'Interior Design')
      .not('room_type', 'is', null);

    if (error) throw error;

    // 去重并排序
    const uniqueRoomTypes = [...new Set(data.map(item => item.room_type))].filter(Boolean) as string[];
    return uniqueRoomTypes.sort();
  } catch (error) {
    console.error('Error fetching interior room types:', error);
    return [];
  }
}

/**
 * 获取指定主分类的所有子分类
 */
export async function getSubCategories(mainCategory: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .select('sub_category')
      .eq('main_category', mainCategory)
      .not('sub_category', 'is', null);

    if (error) throw error;

    // 去重并排序
    const uniqueSubCategories = [...new Set(data.map(item => item.sub_category))].filter(Boolean) as string[];
    return uniqueSubCategories.sort();
  } catch (error) {
    console.error(`Error fetching sub categories for ${mainCategory}:`, error);
    return [];
  }
}

/**
 * 获取所有模板（普通用户版本 - 不包含 prompt）
 * 使用公共视图，只返回图片、名字和分类信息
 * 对于Interior Design，按room_type分组
 */
export async function getAllTemplatesPublic(): Promise<ManagedTemplateData> {
  try {
    // 使用主表而不是视图，因为我们需要room_type字段
    const { data, error } = await supabase
      .from('design_templates')
      .select('id, name, image_url, main_category, sub_category, room_type, enabled, sort_order')
      .eq('enabled', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;

    // 将数据库数据转换为前端需要的格式
    const templates = data as Array<{
      id: string;
      name: string;
      image_url: string;
      main_category: string;
      sub_category: string;
      room_type?: string | null;
      enabled: boolean;
      sort_order: number;
    }>;
    const grouped: ManagedTemplateData = {};

    templates.forEach(template => {
      const mainCat = template.main_category;
      const subCat = template.sub_category;

      // 初始化主分类
      if (!grouped[mainCat]) {
        grouped[mainCat] = [];
      }

      // 对于Interior Design，使用room_type作为key
      // 对于其他分类，使用sub_category
      const categoryKey = template.room_type || subCat;

      // 查找或创建子分类
      let subCategory = grouped[mainCat].find(sc => sc.name === categoryKey);
      if (!subCategory) {
        subCategory = {
          name: categoryKey,
          templates: [],
          enabled: true
        };
        grouped[mainCat].push(subCategory);
      }

      // 添加模板（注意：不包含 prompt 字段）
      subCategory.templates.push({
        id: template.id,
        name: template.name,
        imageUrl: template.image_url,
        prompt: '', // 前端不需要看到，将在生成时动态获取
        category: template.main_category,
        roomType: template.room_type,
        subCategory: template.sub_category // 添加 sub_category 字段用于前端重新分组
      });
    });

    return grouped;
  } catch (error) {
    console.error('Error fetching public templates:', error);
    throw error;
  }
}

/**
 * 获取模板的完整提示词（用于后端生成）
 * 注意：此函数通过 SECURITY DEFINER 函数获取 prompt
 * 前端不应该直接显示此内容
 */
export async function getTemplatePrompt(templateId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('get_template_prompt', { template_id: templateId });
    
    if (error) throw error;
    return data as string;
  } catch (error) {
    console.error('Error fetching template prompt:', error);
    throw error;
  }
}

/**
 * 批量获取多个模板的提示词（性能优化）
 */
export async function getTemplatePrompts(templateIds: string[]): Promise<Map<string, string>> {
  try {
    const { data, error } = await supabase
      .rpc('get_template_prompts', { template_ids: templateIds });
    
    if (error) throw error;
    
    // 转换为 Map 方便查找
    const promptMap = new Map<string, string>();
    if (data && Array.isArray(data)) {
      data.forEach((item: { id: string; prompt: string }) => {
        promptMap.set(item.id, item.prompt);
      });
    }
    
    return promptMap;
  } catch (error) {
    console.error('Error fetching template prompts:', error);
    throw error;
  }
}

/**
 * 删除整个主分类及其所有模板
 */
export async function deleteMainCategory(mainCategory: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('design_templates')
      .delete()
      .eq('main_category', mainCategory);
    
    if (error) throw error;
    
    console.log(`✅ Deleted main category: ${mainCategory}`);
  } catch (error) {
    console.error('Error deleting main category:', error);
    throw error;
  }
}

/**
 * 删除子分类及其所有模板
 * 对于Interior Design，使用room_type；对于其他分类，使用sub_category
 */
export async function deleteSubCategory(
  mainCategory: string,
  subCategoryOrRoomType: string
): Promise<void> {
  try {
    const isInteriorDesign = mainCategory === 'Interior Design';
    
    let query = supabase
      .from('design_templates')
      .delete()
      .eq('main_category', mainCategory);
    
    if (isInteriorDesign) {
      query = query.eq('room_type', subCategoryOrRoomType);
    } else {
      query = query.eq('sub_category', subCategoryOrRoomType);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    
    console.log(`✅ Deleted sub-category: ${mainCategory} > ${subCategoryOrRoomType}`);
  } catch (error) {
    console.error('Error deleting sub-category:', error);
    throw error;
  }
}

// ============================================
// 排序功能
// ============================================

/**
 * 批量更新主分类排序
 * @param categories - 主分类名称数组，数组顺序即为显示顺序
 */
export async function reorderMainCategories(categories: string[]): Promise<void> {
  try {
    const { error } = await supabase.rpc('reorder_main_categories', {
      p_categories: categories
    });
    
    if (error) throw error;
    
    console.log(`✅ Reordered main categories:`, categories);
  } catch (error) {
    console.error('Error reordering main categories:', error);
    throw error;
  }
}

/**
 * 批量更新子分类排序
 * @param mainCategory - 主分类名称
 * @param subCategories - 子分类名称数组，数组顺序即为显示顺序
 */
export async function reorderSubCategories(
  mainCategory: string,
  subCategories: string[]
): Promise<void> {
  try {
    const { error } = await supabase.rpc('reorder_sub_categories', {
      p_main_category: mainCategory,
      p_sub_categories: subCategories
    });
    
    if (error) throw error;
    
    console.log(`✅ Reordered sub-categories for ${mainCategory}:`, subCategories);
  } catch (error) {
    console.error('Error reordering sub-categories:', error);
    throw error;
  }
}

/**
 * 批量更新模板排序
 * @param templateIds - 模板ID数组，数组顺序即为显示顺序
 */
export async function reorderTemplates(templateIds: string[]): Promise<void> {
  try {
    const { error } = await supabase.rpc('reorder_templates', {
      p_template_ids: templateIds
    });
    
    if (error) throw error;
    
    console.log(`✅ Reordered templates:`, templateIds);
  } catch (error) {
    console.error('Error reordering templates:', error);
    throw error;
  }
}

/**
 * 获取主分类排序配置
 * @returns 主分类排序配置的Map，key为分类名，value为sort_order
 */
export async function getMainCategoryOrder(): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase
      .from('main_category_order')
      .select('main_category, sort_order')
      .order('sort_order');
    
    if (error) throw error;
    
    const orderMap = new Map<string, number>();
    if (data) {
      data.forEach(item => {
        orderMap.set(item.main_category, item.sort_order);
      });
    }
    
    return orderMap;
  } catch (error) {
    console.error('Error fetching main category order:', error);
    throw error;
  }
}

/**
 * 增加模板使用次数（为未来的自动排序功能预留）
 * @param templateId - 模板ID
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_template_usage', {
      p_template_id: templateId
    });
    
    if (error) {
      // 不抛出错误，避免影响主要功能
      console.warn('Failed to increment template usage:', error);
      return;
    }
    
    console.log(`✅ Incremented usage count for template: ${templateId}`);
  } catch (error) {
    console.warn('Error incrementing template usage:', error);
  }
}

