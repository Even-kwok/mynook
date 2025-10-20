import { supabase } from '../config/supabase';

export interface MergeCategoriesRequest {
  mainCategory: string;
  targetSubCategory: string;  // 合并后的新名称
  sourceSubCategories: string[];  // 要被合并的旧分类
}

export interface MergeCategoriesResponse {
  success: boolean;
  mergedCount: number;
  targetCategory: string;
  movedTemplates: number;
}

/**
 * 合并多个子分类到一个目标分类
 * 1. 将所有源分类的模板迁移到目标分类
 * 2. 源分类会自动变为空分类（模板都被移走了）
 */
export async function mergeCategories(
  request: MergeCategoriesRequest
): Promise<MergeCategoriesResponse> {
  const { mainCategory, targetSubCategory, sourceSubCategories } = request;
  
  if (!mainCategory || !targetSubCategory || !sourceSubCategories || sourceSubCategories.length === 0) {
    throw new Error('Invalid merge request parameters');
  }
  
  try {
    // 统计要移动的模板数量
    const { data: templatesToMove, error: countError } = await supabase
      .from('templates')
      .select('id')
      .eq('main_category', mainCategory)
      .in('sub_category', sourceSubCategories);
    
    if (countError) throw countError;
    
    const movedTemplates = templatesToMove?.length || 0;
    
    if (movedTemplates === 0) {
      return {
        success: true,
        mergedCount: 0,
        targetCategory: targetSubCategory,
        movedTemplates: 0,
      };
    }
    
    // 将所有源分类的模板迁移到目标分类
    const { error: updateError } = await supabase
      .from('templates')
      .update({ sub_category: targetSubCategory })
      .eq('main_category', mainCategory)
      .in('sub_category', sourceSubCategories);
    
    if (updateError) {
      console.error('Failed to update templates:', updateError);
      throw updateError;
    }
    
    console.log(`✅ Successfully merged ${sourceSubCategories.length} categories into "${targetSubCategory}"`);
    console.log(`📦 Moved ${movedTemplates} templates`);
    
    return {
      success: true,
      mergedCount: sourceSubCategories.length,
      targetCategory: targetSubCategory,
      movedTemplates,
    };
    
  } catch (error) {
    console.error('Failed to merge categories:', error);
    throw error;
  }
}

/**
 * 批量合并多组分类
 */
export async function batchMergeCategories(
  mainCategory: string,
  mergeGroups: Array<{
    targetSubCategory: string;
    sourceSubCategories: string[];
  }>
): Promise<{
  success: boolean;
  results: MergeCategoriesResponse[];
}> {
  const results: MergeCategoriesResponse[] = [];
  
  for (const group of mergeGroups) {
    try {
      const result = await mergeCategories({
        mainCategory,
        targetSubCategory: group.targetSubCategory,
        sourceSubCategories: group.sourceSubCategories,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to merge group ${group.targetSubCategory}:`, error);
      // 继续处理其他组，即使某一组失败
      results.push({
        success: false,
        mergedCount: 0,
        targetCategory: group.targetSubCategory,
        movedTemplates: 0,
      });
    }
  }
  
  const allSuccess = results.every(r => r.success);
  
  return {
    success: allSuccess,
    results,
  };
}

