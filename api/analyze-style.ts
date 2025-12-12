import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';

const isModelNotFoundError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  // @google/genai often surfaces API errors as JSON-string-like messages, e.g.:
  // {"error":{"code":404,"message":"models/xxx is not found ...","status":"NOT_FOUND"}}
  return (
    message.includes('"status":"NOT_FOUND"') ||
    message.includes('"code":404') ||
    message.includes('models/') && message.includes('not found')
  );
};

const getAnalyzeStyleModelCandidates = (): string[] => {
  const raw = [
    process.env.GEMINI_ANALYZE_STYLE_MODEL,
    process.env.GEMINI_MODEL,
    // Preferred: keep aligned with other endpoints in this repo.
    'gemini-3-pro-preview',
    // Fast + cheap fallback
    'gemini-2.5-flash',
    // Conservative fallback
    'gemini-1.5-pro',
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  // de-dupe while preserving order
  return Array.from(new Set(raw));
};

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

Perspective Enhancements (Apply adaptively):
- Wide Angle: A wide-angle professional interior photography shot capturing the entire room's layout and atmosphere. Focus on spatial volume, flow, and the overall architectural statement. Camera: 24mm lens. High-end Architectural Digest style.
- Top Down: Elevated Bird's Eye View. Camera is positioned high up near the ceiling, looking down at a 45-60 degree angle. Show the entire floor area and furniture layout clearly from above. Wide field of view. NOT eye-level. Professional real estate drone-style interior shot.

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
    const { data: adminData, error: adminError } = await (supabaseAdmin as any)
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
  if (!Array.isArray(allowedCategories) || allowedCategories.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid allowedCategories' });
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

    const modelCandidates = getAnalyzeStyleModelCandidates();
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              { text: extractorPrompt },
              { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
            ],
          },
        });
        break;
      } catch (error) {
        lastError = error;
        if (isModelNotFoundError(error)) {
          console.warn(`[analyze-style] Model not found, falling back. model=${model}`);
          continue;
        }
        throw error;
      }
    }

    if (!response) {
      const details = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
      throw new Error(`All Gemini models failed for analyze-style. Tried: ${modelCandidates.join(', ')}. Last error: ${details}`);
    }

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

