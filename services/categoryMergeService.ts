import { generateTextResponse } from './geminiService';

export interface SimilarCategoryGroup {
  suggestedName: string;  // 建议的新名称
  categories: string[];    // 要合并的分类列表
  reason: string;          // 合并原因
  templateCount?: number;   // 涉及的模板总数
}

export async function analyzeSimilarCategories(
  mainCategory: string,
  subCategories: Array<{ name: string; templateCount: number }>
): Promise<SimilarCategoryGroup[]> {
  
  if (subCategories.length === 0) {
    return [];
  }
  
  const prompt = `You are a category organization expert. Analyze these subcategories and suggest which ones should be merged.

Main Category: ${mainCategory}

Subcategories:
${subCategories.map(s => `- ${s.name} (${s.templateCount} templates)`).join('\n')}

Rules:
1. Group similar categories (e.g., "gym", "Home Gym", "home-gym" should be merged)
2. Use the most clear and concise name for the merged category
3. Only suggest merging if categories are truly similar in meaning
4. Keep categories separate if they represent distinct concepts
5. Look for:
   - Same words with different cases (gym, Gym, GYM)
   - Same meaning with different separators (home-gym, home_gym, homegym)
   - Synonyms or very similar concepts (living room, living-room, lounge)

Return a JSON array of merge suggestions. Each suggestion should merge 2 or more similar categories.
Format:
[
  {
    "suggestedName": "gym",
    "categories": ["gym", "Home Gym", "home-gym"],
    "reason": "All represent gym/fitness spaces, standardize to lowercase 'gym'"
  }
]

IMPORTANT: Return ONLY valid JSON array, no other text, no markdown, no explanations.
If no similar categories found, return: []
`;

  try {
    const response = await generateTextResponse(prompt);
    const text = response.trim();
    
    // 尝试提取 JSON
    let jsonText = text;
    
    // 移除可能的 markdown 代码块标记
    if (text.includes('```json')) {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    } else if (text.includes('```')) {
      const match = text.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonText = match[1];
      }
    }
    
    // 查找 JSON 数组
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.warn('No JSON array found in AI response:', text);
      return [];
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);
    
    // 验证和过滤建议
    const validSuggestions = suggestions.filter((group: any) => 
      group.categories && 
      Array.isArray(group.categories) && 
      group.categories.length >= 2 &&
      group.suggestedName &&
      group.reason
    );
    
    // 计算每组的模板总数
    return validSuggestions.map((group: any) => ({
      suggestedName: group.suggestedName,
      categories: group.categories,
      reason: group.reason,
      templateCount: group.categories.reduce((sum: number, catName: string) => {
        const cat = subCategories.find(c => c.name === catName);
        return sum + (cat?.templateCount || 0);
      }, 0)
    }));
    
  } catch (error) {
    console.error('Failed to analyze similar categories:', error);
    throw new Error('Failed to analyze categories with AI');
  }
}

