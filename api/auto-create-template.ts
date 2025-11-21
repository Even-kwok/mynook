import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for server-side operations
// Use multiple environment variable names for compatibility
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration for auto-create-template API');
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// MyNook Universal Template (used in fullPrompt generation)
const MYNOOK_TEMPLATE = `---[ 提示词开始 / PROMPT START ]---
Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.

[INSERT SPECIFIC STYLE, MATERIAL, FURNITURE, DECOR, AND SCENE DETAILS HERE]

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`;

  /**
   * 生成AI识别提示词（基于大分类）
   * @param allowedCategories 允许的大分类列表
   * @param autoDetect 是否自动识别二级分类
   * @param manualSubCat 手动指定的二级分类
   */
  const generateExtractorPrompt = (
    allowedCategories: string[], 
    autoDetect: boolean,
    manualSubCat: string | null
  ): string => {
    const categoryList = allowedCategories.map(cat => `'${cat}'`).join(' OR ');
    
    // 根据是否自动识别，生成不同的二级分类指令
    const subCategoryInstruction = autoDetect
      ? `"secondaryCategory": "Automatically identify or create appropriate sub-category based on the design"`
      : `"secondaryCategory": "Use exactly this value: '${manualSubCat}'"`;

    return `Analyze this design image and extract information in JSON format.

Return ONLY a valid JSON object with these exact fields:
{
  "templateName": "Short descriptive name (e.g., 'Oak Herringbone Floor' or 'Modern Kitchen Design')",
  "mainCategory": "MUST BE ONE OF: ${categoryList}",
  ${subCategoryInstruction},
  "styleDescription": "A single detailed sentence describing key features, materials, colors, patterns, and characteristics",
  "fullPrompt": "Complete MyNook-V1.0-Universal format prompt with [INSERT...] section filled in"
}

${autoDetect ? `
**Category-specific sub-category guidelines:**
- For "Floor Style": Identify material and pattern (e.g., "Hardwood - Herringbone", "Tile - Subway", "Marble - Polished")
- For "Interior Design": Identify room type (e.g., "living-room", "bedroom", "kitchen", "bathroom")
- For "Festive Decor": Identify festival/event (e.g., "Christmas", "Halloween", "Easter", "Birthday")
- For "Exterior Design": Identify architectural style (e.g., "Modern", "Mediterranean", "Colonial")
- For "Wall Paint": Identify style/type (e.g., "Solid Color", "Textured", "Accent Wall", "Mural")
- For "Garden & Backyard Design": Identify garden style (e.g., "Zen Garden", "English Garden", "Modern Minimalist")
- If the sub-category doesn't exist in the database, create a new meaningful one
` : `
**Important: Use exactly the provided secondaryCategory value: "${manualSubCat}"**
- Do NOT try to identify or create a different sub-category
- Simply use the exact value provided above
`}

**Important Rules:**
- mainCategory MUST exactly match one of: ${categoryList}
- secondaryCategory ${autoDetect ? 'will be automatically created if it doesn\'t exist' : 'must be exactly as specified above'}
- styleDescription should be detailed and specific to what you see in the image
- fullPrompt must follow MyNook-V1.0-Universal template with the [INSERT...] section replaced by styleDescription

**MyNook Template Reference:**
${MYNOOK_TEMPLATE}

**Output Format:**
Return ONLY valid JSON, no markdown code blocks, no additional text.`;
  };

interface ExtractedTemplateData {
  templateName: string;
  mainCategory: string;
  secondaryCategory: string;
  styleDescription: string;
  fullPrompt: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Support both JWT and API Key authentication for Zapier integration
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  
  let userId: string | null = null;
  let isAdmin = false;

  // Check API Key first (for Zapier)
  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    isAdmin = true;
  } else {
    // Use JWT authentication
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Missing or invalid authorization header', code: 'AUTH_REQUIRED' });
    }
    const { userId: verifiedUserId, error: authError } = await verifyUserToken(authHeader);
    if (authError || !verifiedUserId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    }
    userId = verifiedUserId;

    // Verify admin permission using admin_users table
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (adminError || !adminData || !adminData.is_active) {
      return res.status(403).json({ error: 'Admin permission required', code: 'INSUFFICIENT_PERMISSION' });
    }
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { 
    originalImage, 
    thumbnailImage, 
    allowedCategories,
    autoDetectSubCategory = true,
    manualSubCategory = null 
  } = req.body;

  if (!originalImage || !thumbnailImage) {
    return res.status(400).json({ error: 'Missing required fields: originalImage, thumbnailImage' });
  }

  // 验证手动模式时必须提供二级分类
  if (!autoDetectSubCategory && !manualSubCategory) {
    return res.status(400).json({ 
      error: 'When autoDetectSubCategory is false, manualSubCategory is required' 
    });
  }

  try {
    // Get API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

      // Generate extractor prompt based on selected main categories
      const extractorPrompt = generateExtractorPrompt(
        allowedCategories, 
        autoDetectSubCategory, 
        manualSubCategory
      );
    
    console.log('🤖 Using AI extraction for categories:', allowedCategories.join(', '));
    console.log('🏷️ Sub-category mode:', autoDetectSubCategory ? 'Auto-detect' : `Manual: ${manualSubCategory}`);

    // Call Gemini to extract information
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // Extract base64 data
    const imageData = originalImage.includes(',') 
      ? originalImage.split(',')[1] 
      : originalImage;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: extractorPrompt },
          { inlineData: { data: imageData, mimeType: 'image/png' } }
        ],
      },
    });

    if (!response || !response.text) {
      throw new Error('Empty response from Gemini');
    }

    // Parse JSON response
    let extracted: ExtractedTemplateData;
    try {
      // Clean up response text (remove markdown code blocks if present)
      let jsonText = response.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      extracted = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', response.text);
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate required fields
    if (!extracted.templateName || !extracted.mainCategory || !extracted.secondaryCategory || !extracted.fullPrompt) {
      throw new Error('Missing required fields in extracted data');
    }

    // Verify category is in allowed range
    if (allowedCategories && !allowedCategories.includes(extracted.mainCategory)) {
      return res.status(400).json({ 
        error: 'Category not allowed',
        extracted,
        allowedCategories 
      });
    }

    // 如果是手动模式，确保使用手动指定的二级分类
    if (!autoDetectSubCategory && manualSubCategory) {
      extracted.secondaryCategory = manualSubCategory;
      console.log('✅ Using manual sub-category:', manualSubCategory);
    } else {
      console.log('🤖 Using AI-detected sub-category:', extracted.secondaryCategory);
    }

    // Upload thumbnail to Supabase Storage
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${extracted.mainCategory}/${extracted.secondaryCategory}/${fileName}`;
    
    // Extract base64 data from thumbnail
    const thumbnailData = thumbnailImage.includes(',')
      ? thumbnailImage.split(',')[1]
      : thumbnailImage;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('template-thumbnails')
      .upload(filePath, Buffer.from(thumbnailData, 'base64'), {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('template-thumbnails')
      .getPublicUrl(filePath);

    // Create template record
    const isInterior = extracted.mainCategory === 'Interior Design';
    const { data: templateData, error: insertError } = await supabaseAdmin
      .from('design_templates')
      .insert({
        name: extracted.templateName,
        image_url: publicUrl,
        prompt: extracted.fullPrompt,
        main_category: extracted.mainCategory,
        sub_category: isInterior ? 'Modern Minimalist' : extracted.secondaryCategory,
        room_type: isInterior ? extracted.secondaryCategory : null,
        enabled: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to create template: ${insertError.message}`);
    }

    return res.status(200).json({
      success: true,
      template: templateData,
      extracted,
    });

  } catch (error) {
    console.error('Auto-create template error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.toString() : 'Unknown error',
    });
  }
}

