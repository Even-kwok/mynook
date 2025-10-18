/**
 * Credits Purchase API - Pure JavaScript
 * Handles one-time credit pack purchases via CREEM
 */

export default async function handler(req, res) {
  console.log('========== Credits Purchase API Called ==========');
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('✅ Token received');

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Database credentials not configured'
      });
    }
    console.log('✅ Supabase credentials found');

    // Import Supabase dynamically
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    console.log('✅ User authenticated:', user.id);

    // Get request body
    const { packType } = req.body;
    console.log('Request:', { packType });

    if (!packType) {
      return res.status(400).json({ 
        error: 'Missing required field: packType' 
      });
    }

    // Define credit packs with CREEM Product IDs
    const CREDIT_PACKS = {
      '100': { 
        credits: 100, 
        price: 9.90, 
        name: '100 Credits Pack',
        productId: 'prod_22tEVFxJtOQU8cm5H10bZc'
      },
      '300': { 
        credits: 300, 
        price: 24.99, 
        name: '300 Credits Pack',
        productId: 'prod_3E171a5TGDhmBhtYM0Gbk3'
      },
      '1000': { 
        credits: 1000, 
        price: 69.99, 
        name: '1000 Credits Pack',
        productId: 'prod_MmthQ5RlRKNalU3rEsowB'
      },
    };

    const pack = CREDIT_PACKS[packType];
    if (!pack) {
      return res.status(400).json({ 
        error: 'Invalid pack type. Must be: 100, 300, or 1000' 
      });
    }

    console.log(`✅ Using Product ID: ${pack.productId} for ${pack.credits} credits`);

    // Get user data with membership tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, credits, membership_tier')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user:', userError?.message);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ User data retrieved, current credits:', userData.credits, 'membership:', userData.membership_tier);

    // Check if user has a paid membership (Pro, Premium, or Business)
    if (userData.membership_tier === 'free') {
      console.log('❌ Free user attempted to purchase credits');
      return res.status(403).json({ 
        error: 'Credit packs are only available for Pro, Premium, and Business members',
        message: 'Please upgrade your plan to purchase credit packs',
        requiresUpgrade: true
      });
    }
    console.log('✅ User has valid membership tier for credit purchases');

    // ========== Call CREEM API to create checkout session ==========
    const creemApiKey = process.env.CREEM_API_KEY;
    const creemApiUrl = process.env.CREEM_API_URL || 'https://api.creem.io';

    if (!creemApiKey) {
      console.error('❌ CREEM_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'CREEM API key is missing'
      });
    }

    console.log('✅ Calling CREEM API for credit pack...');

    // 构建正确的 base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || (req.headers.origin)
      || (req.headers.host ? `https://${req.headers.host}` : null)
      || 'https://mynook-ai.vercel.app';
    
    console.log('🌐 Base URL:', baseUrl);

    try {
      const successUrl = `${baseUrl}/?message=credits-purchased&credits=${pack.credits}`;
      const cancelUrl = `${baseUrl}/?message=purchase-cancelled`;
      
      console.log('📦 CREEM Request Details:');
      console.log('  - Product ID:', pack.productId);
      console.log('  - Success URL:', successUrl);
      console.log('  - Cancel URL:', cancelUrl);
      console.log('  - Customer:', userData.email);

      const creemPayload = {
        product_id: pack.productId,
        request_id: `credits_${userData.id}_${Date.now()}`,
        units: 1,
        customer: {
          email: userData.email,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        custom_field: {
          type: 'credits',
          pack_type: packType,
          credits_amount: pack.credits,
          user_id: userData.id,
        },
      };

      console.log('📤 Sending to CREEM:', JSON.stringify(creemPayload, null, 2));

      const creemResponse = await fetch(`${creemApiUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creemApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creemPayload),
      });

      if (!creemResponse.ok) {
        const errorData = await creemResponse.json().catch(() => ({}));
        console.error('❌ CREEM API error:', {
          status: creemResponse.status,
          statusText: creemResponse.statusText,
          error: errorData
        });
        
        // 返回更详细的错误信息
        return res.status(500).json({
          error: 'Payment system error',
          message: errorData.message || `CREEM API returned ${creemResponse.status}`,
          details: errorData,
          debug: {
            baseUrl,
            successUrl,
            cancelUrl,
            productId: pack.productId
          }
        });
      }

      const session = await creemResponse.json();
      console.log('✅ CREEM checkout session created:', session.id);

      return res.status(200).json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: 'Checkout session created successfully',
        pack: {
          credits: pack.credits,
          price: pack.price,
        }
      });

    } catch (creemError) {
      console.error('❌ CREEM integration error:', creemError.message);
      
      // Fallback to mock response if CREEM fails
      console.log('⚠️ Falling back to mock response...');
      return res.status(200).json({
        success: true,
        checkoutUrl: `${baseUrl}/pricing?message=credits-pending&pack=${packType}`,
        message: '⚠️ Using mock checkout (CREEM error)',
        error: creemError.message,
        debug: {
          userId: userData.id,
          email: userData.email,
          packType: packType,
          credits: pack.credits,
          price: pack.price,
        }
      });
    }

  } catch (error) {
    console.error('========== UNEXPECTED ERROR ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to process credits purchase request',
      message: error.message
    });
  }
}

