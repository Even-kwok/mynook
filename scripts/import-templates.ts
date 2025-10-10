/**
 * 模板导入脚本
 * 将硬编码的模板数据导入到数据库中
 * 
 * 使用方法：
 * 1. 确保已经运行了数据库迁移 20251010_create_templates_system.sql
 * 2. 打开浏览器控制台
 * 3. 以管理员身份登录
 * 4. 在控制台运行此脚本
 */

import { ADMIN_PAGE_CATEGORIES } from '../constants';
import { batchImportTemplates } from '../services/templateService';

export async function importTemplates() {
  console.log('Starting template import...');
  
  const templatesToImport: any[] = [];
  
  // 遍历所有分类
  for (const [mainCategory, subCategories] of Object.entries(ADMIN_PAGE_CATEGORIES)) {
    console.log(`Processing category: ${mainCategory}`);
    
    for (const subCategory of subCategories) {
      console.log(`  Processing sub-category: ${subCategory.name}`);
      
      for (const template of subCategory.templates) {
        templatesToImport.push({
          name: template.name,
          image_url: template.imageUrl,
          prompt: template.prompt,
          main_category: mainCategory,
          sub_category: subCategory.name,
          enabled: subCategory.enabled !== false, // Default to true if not specified
          sort_order: 0
        });
      }
    }
  }
  
  console.log(`Total templates to import: ${templatesToImport.length}`);
  
  try {
    const result = await batchImportTemplates(templatesToImport);
    console.log(`Successfully imported ${result.length} templates!`);
    console.log('Import complete. You can now refresh the page to see the templates.');
    return result;
  } catch (error) {
    console.error('Failed to import templates:', error);
    throw error;
  }
}

// 如果在浏览器中直接运行
if (typeof window !== 'undefined') {
  (window as any).importTemplates = importTemplates;
  console.log('Template import function loaded. Run "importTemplates()" to start import.');
}

