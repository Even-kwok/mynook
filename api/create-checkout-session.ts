/**
 * API Endpoint: Create Checkout Session (Simplified for Debugging)
 * Phase 1: Validate request and check subscription status
 * Phase 2: Will integrate CREEM payment once basic flow is confirmed
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('========== Step 1: Validating request ==========');
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  console.log('✅ Method is POST');

  try {
    console.log('========== Step 2: Authenticating user ==========');
    
    // Get the authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('✅ Authorization header present');

    // Initialize Supabase client
    console.log('========== Step 3: Initializing Supabase ==========');
    const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = getEnvVar('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Database credentials not configured'
      });
    }
    console.log('✅ Supabase credentials found');

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Verify the user's session
    console.log('========== Step 4: Verifying user token ==========');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    console.log('✅ User authenticated:', user.id);

    // Get request body
    console.log('========== Step 5: Validating input ==========');
    const { planType, billingCycle } = req.body;
    console.log('Request body:', { planType, billingCycle });

    if (!planType || !billingCycle) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: planType and billingCycle' 
      });
    }

    if (!['pro', 'premium', 'business'].includes(planType)) {
      console.log('❌ Invalid plan type:', planType);
      return res.status(400).json({ 
        error: 'Invalid plan type. Must be: pro, premium, or business' 
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      console.log('❌ Invalid billing cycle:', billingCycle);
      return res.status(400).json({ 
        error: 'Invalid billing cycle. Must be: monthly or yearly' 
      });
    }
    console.log('✅ Input validated');

    // Get user's subscription info
    console.log('========== Step 6: Checking existing subscription ==========');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, membership_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user:', userError?.message);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ User data retrieved:', {
      id: userData.id,
      email: userData.email,
      membership_tier: userData.membership_tier,
      subscription_status: userData.subscription_status
    });

    // Check if user already has an active subscription for this plan
    if (userData.subscription_status === 'active') {
      const currentTier = userData.membership_tier || 'free';
      console.log('⚠️ User has active subscription:', currentTier);
      
      // Prevent same tier subscription
      if (currentTier === planType) {
        console.log('❌ User trying to subscribe to same tier');
        return res.status(400).json({ 
          error: `You already have an active ${planType} subscription`,
          currentPlan: currentTier,
        });
      }
      
      console.log('✅ User can upgrade/downgrade from', currentTier, 'to', planType);
    } else {
      console.log('✅ User has no active subscription, can proceed');
    }

    // ========== TEMPORARY: Return mock response ==========
    // TODO: Integrate CREEM API after confirming basic flow works
    console.log('========== Step 7: Returning mock response ==========');
    console.log('⚠️ CREEM integration pending - returning mock checkout URL');
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const mockResponse = {
      success: true,
      checkoutUrl: `${baseUrl}/pricing?message=subscription-pending&plan=${planType}&cycle=${billingCycle}`,
      message: '✅ Subscription system is being configured. Your request has been validated.',
      debug: {
        userId: userData.id,
        email: userData.email,
        requestedPlan: planType,
        billingCycle: billingCycle,
        currentTier: userData.membership_tier || 'free',
        canProceed: true
      }
    };

    console.log('✅ Mock response prepared:', mockResponse);
    return res.status(200).json(mockResponse);

  } catch (error: any) {
    console.error('========== UNEXPECTED ERROR ==========');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to process subscription request',
      message: error.message,
      type: error.constructor.name
    });
  }
}
