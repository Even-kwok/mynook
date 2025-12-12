import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { Buffer } from 'node:buffer';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';
import { resolveGeminiAnalyzeStyleModel } from './_lib/aiModels.js';

const detectImageType = (buffer: Buffer): { mimeType: string } => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mimeType: 'image/webp' };
  }
  return { mimeType: 'image/png' };
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

// Keep Interior Design room types canonical to avoid category explosion.
// We intentionally collapse many variations (e.g. "open concept living & dining") into "living-room".
const normalizeInteriorRoomType = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return 'other';
  const s = raw.toLowerCase();

  // Chinese keywords
  if (/(客厅|起居室|会客)/.test(s)) return 'living-room';
  if (/(卧室|主卧|次卧)/.test(s)) return 'bedroom';
  if (/(厨房)/.test(s)) return 'kitchen';
  if (/(浴室|卫生间|洗手间)/.test(s)) return 'bathroom';
  if (/(餐厅)/.test(s)) return 'dining-room';
  if (/(书房|办公室|工作间)/.test(s)) return 'office';
  if (/(玄关|门厅|入口)/.test(s)) return 'entryway';
  if (/(走廊|过道)/.test(s)) return 'hallway';
  if (/(儿童房|小孩房|婴儿房)/.test(s)) return /婴儿/.test(s) ? 'nursery' : 'kids-room';
  if (/(衣帽间|衣橱|储物间)/.test(s)) return 'closet';

  // English keywords (collapse open-plan combos into living-room)
  if (/(open|open[-\s]?plan|open[-\s]?concept)/.test(s) && /(living|lounge)/.test(s)) return 'living-room';
  if (/(living|lounge)/.test(s)) return 'living-room';
  if (/(bed(room)?|master\s*bed(room)?)/.test(s)) return 'bedroom';
  if (/(kitchen)/.test(s)) return 'kitchen';
  if (/(bath(room)?|rest\s*room|washroom|toilet)/.test(s)) return 'bathroom';
  if (/(dining)/.test(s)) return 'dining-room';
  if (/(home\s*office|office|study)/.test(s)) return 'office';
  if (/(entry\s*way|entryway|foyer|mud\s*room|mudroom)/.test(s)) return 'entryway';
  if (/(hall\s*way|hallway|corridor)/.test(s)) return 'hallway';
  if (/(kid(s)?\s*room|children('|’)?s\s*room)/.test(s)) return 'kids-room';
  if (/(nursery)/.test(s)) return 'nursery';
  if (/(closet|walk[-\s]?in\s*closet)/.test(s)) return 'closet';
  if (/(laundry)/.test(s)) return 'laundry-room';

  return 'other';
};

// Shorten template name and remove room-type words for Interior Design.
const sanitizeTemplateName = (templateName: unknown, mainCategory: unknown, roomType: string): string => {
  let name = normalizeText(templateName);
  if (!name) return '';

  // Remove obvious "null/undefined"
  if (/^(null|undefined)$/i.test(name)) name = '';
  if (!name) return '';

  const isInterior = normalizeText(mainCategory) === 'Interior Design';
  if (isInterior) {
    // Remove room-type tokens and generic suffixes/prefixes to keep it "style only"
    const roomTokens = [
      /living\s*room/gi,
      /lounge/gi,
      /bed\s*room/gi,
      /kitchen/gi,
      /bath\s*room/gi,
      /dining\s*room/gi,
      /home\s*office/gi,
      /\boffice\b/gi,
      /\bstudy\b/gi,
      /entry\s*way/gi,
      /\bentryway\b/gi,
      /\bfoyer\b/gi,
      /hall\s*way/gi,
      /\bhallway\b/gi,
      /\bcorridor\b/gi,
      /kids?\s*room/gi,
      /nursery/gi,
      /walk[-\s]?in\s*closet/gi,
      /\bcloset\b/gi,
      /laundry/gi,
      /interior/gi,
      /\bdesign\b/gi,
      /\broom\b/gi,
      /空间/gi,
      /室内/gi,
      /设计/gi,
      /客厅|起居室|卧室|厨房|浴室|卫生间|洗手间|餐厅|书房|办公室|玄关|门厅|入口|走廊|过道|儿童房|婴儿房|衣帽间/gi,
    ];

    for (const re of roomTokens) {
      name = name.replace(re, ' ');
    }

    // Remove separators and extra spaces
    name = name
      .replace(/[-–—|/,_]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // If still too generic/empty, fall back to roomType + a short generic label
    if (!name) {
      name = roomType === 'other' ? 'Interior Style' : 'Interior Style';
    }
  } else {
    // Non-interior: keep it reasonably short and remove trailing "Design"
    name = name.replace(/\bdesign\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Hard limit length for UI friendliness
  if (name.length > 32) {
    name = name.slice(0, 32).trim();
  }
  return name;
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
  "templateName": "A SHORT style name only (2-5 words). Do NOT include room type words like living room/bedroom/kitchen. Do NOT include the word 'Design'.",
  "mainCategory": "MUST BE ONE OF: ${categoryList}",
  ${subCategoryInstruction},
  "styleDescription": "A single detailed sentence describing key features, materials, colors, patterns, and characteristics",
  "fullPrompt": "Complete MyNook-V1.0-Universal format prompt with [INSERT...] section filled in"
}

${autoDetect ? `
**Category-specific sub-category guidelines:**
- For "Floor Style": Identify material and pattern (e.g., "Hardwood - Herringbone", "Tile - Subway", "Marble - Polished")
- For "Interior Design": Identify room type MUST be ONE OF: living-room, bedroom, kitchen, bathroom, dining-room, office, entryway, hallway, kids-room, nursery, closet, laundry-room, other.
- For "Interior Design": IMPORTANT: use only these canonical values (no adjectives, no extra words, no Chinese, no spaces).
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
    const { mimeType } = detectImageType(Buffer.from(imageData, 'base64'));
    const model = resolveGeminiAnalyzeStyleModel();

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: extractorPrompt },
            { inlineData: { data: imageData, mimeType } },
          ],
        },
      ],
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

    // Post-process to enforce canonical room types and short names (prevents category explosion).
    const normalizedMainCategory = normalizeText(extracted.mainCategory);
    if (normalizedMainCategory === 'Interior Design') {
      const roomType = normalizeInteriorRoomType(extracted.secondaryCategory);
      extracted.secondaryCategory = roomType;
      extracted.templateName = sanitizeTemplateName(extracted.templateName, extracted.mainCategory, roomType);
    } else {
      extracted.templateName = sanitizeTemplateName(extracted.templateName, extracted.mainCategory, 'other');
      extracted.secondaryCategory = normalizeText(extracted.secondaryCategory);
    }

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

