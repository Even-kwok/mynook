/**
 * API Endpoint: Get Subscription Status
 * Returns the current user's subscription information
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getUserActiveSubscription } from '../services/subscriptionService';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Get user's current subscription
    const subscription = await getUserActiveSubscription(user.id);

    // Get user's membership info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('membership_tier, credits, subscription_status, subscription_end_date')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Return subscription status
    return res.status(200).json({
      success: true,
      subscription: subscription || null,
      user: {
        membershipTier: userData.membership_tier,
        credits: userData.credits,
        subscriptionStatus: userData.subscription_status,
        subscriptionEndDate: userData.subscription_end_date,
      },
    });

  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch subscription status',
      message: error.message 
    });
  }
}

