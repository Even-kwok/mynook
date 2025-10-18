/**
 * Simple Subscription API - Pure JavaScript (No TypeScript)
 * Returns mock subscription response for testing
 */

export default async function handler(req, res) {
  console.log('========== Subscription API Called ==========');
  
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
    const { planType, billingCycle } = req.body;
    console.log('Request:', { planType, billingCycle });

    if (!planType || !billingCycle) {
      return res.status(400).json({ 
        error: 'Missing required fields: planType and billingCycle' 
      });
    }

    if (!['pro', 'premium', 'business'].includes(planType)) {
      return res.status(400).json({ 
        error: 'Invalid plan type. Must be: pro, premium, or business' 
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ 
        error: 'Invalid billing cycle. Must be: monthly or yearly' 
      });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, membership_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user:', userError?.message);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ User data retrieved');

    // Check if user already has active subscription
    if (userData.subscription_status === 'active') {
      const currentTier = userData.membership_tier || 'free';
      
      if (currentTier === planType) {
        return res.status(400).json({ 
          error: `You already have an active ${planType} subscription`,
          currentPlan: currentTier,
        });
      }
      
      console.log('✅ User can upgrade from', currentTier, 'to', planType);
    }

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

    console.log('✅ Calling CREEM API...');

    // CREEM Product ID mapping
    const PRODUCT_IDS = {
      pro: {
        monthly: 'prod_2JlRhCPx3dJVaQUNLRgo6D',
        yearly: 'prod_43bA82tdR38NzQksz6fHxH',
      },
      premium: {
        monthly: 'prod_3wRnKHJa6LSF5afsd1QjEG',
        yearly: 'prod_18rfRuIGJVtWPeIIfZpLWA',
      },
      business: {
        monthly: 'prod_wMGy2WQe6Kv5PmTZLjcsn',
        yearly: 'prod_6065m1QjyimGZ8lg15pqB5',
      },
    };

    const productId = PRODUCT_IDS[planType][billingCycle];
    if (!productId) {
      console.error('❌ Product ID not found for:', planType, billingCycle);
      throw new Error('Invalid plan configuration');
    }

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    console.log(`✅ Using Product ID: ${productId} for ${planType} ${billingCycle}`);

    try {
      const creemResponse = await fetch(`${creemApiUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'x-api-key': creemApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          request_id: `sub_${userData.id}_${Date.now()}`,
          units: 1,
          customer: {
            email: userData.email,
          },
          success_url: `${baseUrl}/?message=subscription-success&plan=${planType}&cycle=${billingCycle}`,
          cancel_url: `${baseUrl}/pricing?message=subscription-cancelled`,
          custom_field: {
            plan_type: planType,
            billing_cycle: billingCycle,
            user_id: userData.id,
          },
        }),
      });

      if (!creemResponse.ok) {
        const errorData = await creemResponse.json().catch(() => ({}));
        console.error('❌ CREEM API error:', errorData);
        throw new Error(errorData.message || `CREEM API returned ${creemResponse.status}`);
      }

      const session = await creemResponse.json();
      console.log('✅ CREEM checkout session created:', session.id);

      return res.status(200).json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        message: 'Checkout session created successfully'
      });

    } catch (creemError) {
      console.error('❌ CREEM integration error:', creemError.message);
      
      // Fallback to mock response if CREEM fails
      console.log('⚠️ Falling back to mock response...');
      return res.status(200).json({
        success: true,
        checkoutUrl: `${baseUrl}/pricing?message=subscription-pending&plan=${planType}&cycle=${billingCycle}`,
        message: '⚠️ Using mock checkout (CREEM error)',
        error: creemError.message,
        debug: {
          userId: userData.id,
          email: userData.email,
          requestedPlan: planType,
          billingCycle: billingCycle,
          productId: productId,
        }
      });
    }

  } catch (error) {
    console.error('========== UNEXPECTED ERROR ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to process subscription request',
      message: error.message
    });
  }
}

