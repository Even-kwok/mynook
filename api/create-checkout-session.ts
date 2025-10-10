/**
 * API Endpoint: Create Checkout Session
 * Creates a CREEM checkout session for subscription payment
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '../services/creemService';
import { createSubscription } from '../services/subscriptionService';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
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

    // Get request body
    const { planType, billingCycle } = req.body;

    // Validate input
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

    // Get user's email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, creem_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Create checkout session URLs
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const successUrl = `${baseUrl}/?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/?subscription=cancelled`;

    // Create CREEM checkout session
    const checkoutSession = await createCheckoutSession({
      planType,
      billingCycle,
      userId: user.id,
      userEmail: userData.email,
      successUrl,
      cancelUrl,
    });

    // Create pending subscription record in database
    const amount = planType === 'pro' 
      ? (billingCycle === 'monthly' ? 39 : 199)
      : planType === 'premium'
      ? (billingCycle === 'monthly' ? 99 : 499)
      : (billingCycle === 'monthly' ? 299 : 1699);

    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    try {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: 'pending',
          creem_subscription_id: checkoutSession.subscription_id || checkoutSession.id,
          creem_customer_id: checkoutSession.customer_id || userData.creem_customer_id,
          creem_checkout_session_id: checkoutSession.id,
          amount,
          currency: 'USD',
          start_date: null, // Will be set when payment succeeds
          end_date: endDate.toISOString(),
        });

      // Update user's CREEM customer ID if provided
      if (checkoutSession.customer_id && !userData.creem_customer_id) {
        await supabase
          .from('users')
          .update({ creem_customer_id: checkoutSession.customer_id })
          .eq('id', user.id);
      }
    } catch (dbError) {
      console.error('Error creating subscription record:', dbError);
      // Continue anyway - webhook will handle it
    }

    // Return the checkout URL
    return res.status(200).json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}

