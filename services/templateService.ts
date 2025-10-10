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
 */
export async function getAllTemplates(): Promise<ManagedTemplateData> {
  try {
    const { data, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('enabled', true)
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

      // 查找或创建子分类
      let subCategory = grouped[mainCat].find(sc => sc.name === subCat);
      if (!subCategory) {
        subCategory = {
          name: subCat,
          templates: [],
          enabled: true
        };
        grouped[mainCat].push(subCategory);
      }

      // 添加模板
      subCategory.templates.push({
        id: template.id,
        name: template.name,
        imageUrl: template.image_url,
        prompt: template.prompt,
        category: template.main_category
      });
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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('design_templates')
      .insert([{
        ...template,
        created_by: userData.user.id,
        updated_by: userData.user.id
      }])
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
  updates: Partial<Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<DesignTemplate> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('design_templates')
      .update({
        ...updates,
        updated_by: userData.user.id
      })
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
 * 批量导入模板
 */
export async function batchImportTemplates(
  templates: Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]
): Promise<DesignTemplate[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const templatesWithUser = templates.map(t => ({
      ...t,
      created_by: userData.user.id,
      updated_by: userData.user.id
    }));

    const { data, error } = await supabase
      .from('design_templates')
      .insert(templatesWithUser)
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

