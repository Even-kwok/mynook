import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserToken } from './lib/creditsService.js';
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

const EXTRACTOR_PROMPT = `Analyze this interior/exterior design image and return information in JSON format.

Return ONLY a valid JSON object with these fields:
{
  "templateName": "Short descriptive name (e.g., 'Modern Scandinavian Living Room')",
  "mainCategory": "ONE OF: 'Interior Design' OR 'Exterior Design' OR 'Garden & Backyard Design'",
  "secondaryCategory": "For Interior: living-room/bedroom/kitchen/bathroom/dining-room/office/kids-room/entryway/closet. For Exterior: Modern/Traditional/Mediterranean/Contemporary/Rustic. For Garden: Landscaping/Patio/Pool-Area/Garden-Design",
  "styleDescription": "A single detailed sentence describing the style, materials, furniture, decor, and atmosphere",
  "fullPrompt": "Complete MyNook-V1.0-Universal format prompt"
}

**Rules:**
1. mainCategory MUST match one of the three exact options
2. For Interior Design, secondaryCategory should be the room type
3. For other categories, secondaryCategory should be the design style
4. styleDescription is inserted into the [INSERT...] placeholder
5. fullPrompt must follow MyNook-V1.0-Universal template format

**MyNook Template:**
---[ 提示词开始 / PROMPT START ]---
Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.

[INSERT SPECIFIC STYLE, MATERIAL, FURNITURE, DECOR, AND SCENE DETAILS HERE]

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`;

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

  const { originalImage, thumbnailImage, allowedCategories } = req.body;

  if (!originalImage || !thumbnailImage) {
    return res.status(400).json({ error: 'Missing required fields: originalImage, thumbnailImage' });
  }

  try {
    // Get API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

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
          { text: EXTRACTOR_PROMPT },
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

