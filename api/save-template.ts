import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUserToken } from './_lib/creditsService.js';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

// Initialize Supabase admin client
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
    templateName,
    mainCategory,
    secondaryCategory,
    fullPrompt,
    thumbnailImage // base64
  } = req.body;

  if (!templateName || !mainCategory || !thumbnailImage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Upload thumbnail to Supabase Storage
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    // Ensure path is clean
    const safeMainCat = mainCategory.replace(/\//g, '-');
    const safeSubCat = secondaryCategory.replace(/\//g, '-');
    const filePath = `${safeMainCat}/${safeSubCat}/${fileName}`;
    
    // Extract base64 data
    const thumbnailData = thumbnailImage.includes(',')
      ? thumbnailImage.split(',')[1]
      : thumbnailImage;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('template-thumbnails')
      .upload(filePath, Buffer.from(thumbnailData, 'base64'), {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('template-thumbnails')
      .getPublicUrl(filePath);

    // Create template record
    const isInterior = mainCategory === 'Interior Design';
    
    // For Interior Design:
    // sub_category -> 'Modern Minimalist' (default) or extracted style if we want to change this later
    // room_type -> The extracted room type (e.g. 'living-room')
    
    // For others:
    // sub_category -> The extracted secondary category
    // room_type -> null
    
    const templateData = {
      name: templateName,
      image_url: publicUrl,
      prompt: fullPrompt,
      main_category: mainCategory,
      sub_category: isInterior ? 'Modern Minimalist' : secondaryCategory,
      room_type: isInterior ? secondaryCategory : null,
      enabled: true,
      sort_order: 0,
    };

    const { data: insertedTemplate, error: insertError } = await supabaseAdmin
      .from('design_templates')
      .insert(templateData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to create template: ${insertError.message}`);
    }

    return res.status(200).json({
      success: true,
      template: insertedTemplate
    });

  } catch (error) {
    console.error('Save template error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Save failed',
      details: error instanceof Error ? error.toString() : 'Unknown error'
    });
  }
}

