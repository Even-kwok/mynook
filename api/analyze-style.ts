import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

const generateExtractorPrompt = (
  allowedCategories: string[], 
  autoDetect: boolean,
  manualSubCat: string | null
): string => {
  const categoryList = allowedCategories.map(cat => `'${cat}'`).join(' OR ');
  
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

  // Authentication check
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  let userId: string | null = null;
  let isAdmin = false;

  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    isAdmin = true;
  } else {
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const { userId: verifiedUserId, error: authError } = await verifyUserToken(authHeader);
    if (authError || !verifiedUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    userId = verifiedUserId;

    // Verify admin permission
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (adminError || !adminData || !adminData.is_active) {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    isAdmin = true;
  }

  const { 
    originalImage, 
    allowedCategories,
    autoDetectSubCategory = true,
    manualSubCategory = null 
  } = req.body;

  if (!originalImage) {
    return res.status(400).json({ error: 'Missing originalImage' });
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const extractorPrompt = generateExtractorPrompt(
      allowedCategories, 
      autoDetectSubCategory, 
      manualSubCategory
    );

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const imageData = originalImage.includes(',') ? originalImage.split(',')[1] : originalImage;

    // Use Gemini 3.0 Pro Preview as requested
    // If this specific model ID is invalid in the future, fallback to 'gemini-2.0-flash-exp' or 'gemini-1.5-pro'
    const response = await ai.models.generateContent({
      model: 'gemini-3.0-pro-preview', 
      contents: {
        parts: [
          { text: extractorPrompt },
          { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
        ],
      },
    });

    if (!response || !response.text) {
      throw new Error('Empty response from Gemini');
    }

    // Clean JSON
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const extracted: ExtractedTemplateData = JSON.parse(jsonText);

    return res.status(200).json({
      success: true,
      extracted
    });

  } catch (error) {
    console.error('Analyze style error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Analysis failed',
      details: error instanceof Error ? error.toString() : 'Unknown error'
    });
  }
}

