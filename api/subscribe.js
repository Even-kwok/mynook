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

    // ========== Return mock response ==========
    // TODO: Integrate CREEM payment API
    console.log('⚠️ Returning mock checkout URL (CREEM integration pending)');
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const mockResponse = {
      success: true,
      checkoutUrl: `${baseUrl}/pricing?message=subscription-pending&plan=${planType}&cycle=${billingCycle}`,
      message: '✅ Subscription system validated. CREEM integration pending.',
      debug: {
        userId: userData.id,
        email: userData.email,
        requestedPlan: planType,
        billingCycle: billingCycle,
        currentTier: userData.membership_tier || 'free',
        canProceed: true,
        note: 'This is a mock response. Real payment integration coming soon.'
      }
    };

    console.log('✅ Mock response prepared');
    return res.status(200).json(mockResponse);

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

