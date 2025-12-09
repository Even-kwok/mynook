import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from './_lib/creditsService.js';
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

  // Auth check
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  let userId: string | null = null;
  let isAdmin = false;

  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    isAdmin = true;
  } else {
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Missing authorization', code: 'AUTH_REQUIRED' });
    }
    const { userId: verifiedUserId, error } = await verifyUserToken(authHeader);
    if (error || !verifiedUserId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    }
    userId = verifiedUserId;
    
    // Check admin
    const { data: adminData } = await supabaseAdmin
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .single();
    
    if (adminData?.is_active) isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { 
    imageData, // base64
    name,
    mainCategory,
    subCategory,
    roomType,
    prompt,
    styleDescription
  } = req.body;

  if (!imageData || !name || !mainCategory || !subCategory) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Upload Image
    const fileName = `${mainCategory}/${subCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('template-thumbnails')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('template-thumbnails')
      .getPublicUrl(fileName);

    // 2. Insert DB Record
    const { data: template, error: dbError } = await supabaseAdmin
      .from('design_templates')
      .insert({
        name,
        image_url: publicUrl,
        prompt: prompt || styleDescription || '',
        main_category: mainCategory,
        sub_category: subCategory,
        room_type: roomType || (mainCategory === 'Interior Design' ? subCategory : null),
        enabled: true,
        sort_order: 0,
        metadata: {
            generated_by: 'ai-template-creator-v2',
            style_description: styleDescription
        }
      })
      .select()
      .single();

    if (dbError) throw new Error(`DB Insert failed: ${dbError.message}`);

    return res.status(200).json({ success: true, template });

  } catch (error) {
    console.error('Save template error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

