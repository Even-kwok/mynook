/**
 * CREEM Webhook Handler - Pure JavaScript
 * Handles payment notifications from CREEM for subscriptions and credit purchases
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  console.log('========== CREEM Webhook Received ==========');
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get webhook signature
    const signature = req.headers['creem-signature'] || req.headers['x-creem-signature'];
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ CREEM_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!signature) {
      console.error('❌ No webhook signature provided');
      return res.status(401).json({ error: 'No signature provided' });
    }

    // Verify signature
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Webhook signature verified');

    // Parse event
    const event = req.body;
    const { type, data } = event;

    console.log(`📨 Event type: ${type}`);
    console.log(`📦 Event data:`, JSON.stringify(data, null, 2));

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return res.status(500).json({ error: 'Database credentials not configured' });
    }

    // Import Supabase dynamically
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different event types
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, data);
        break;

      case 'payment.succeeded':
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, data);
        break;

      case 'subscription.created':
      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, data);
        break;

      case 'subscription.updated':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, data);
        break;

      case 'subscription.deleted':
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(supabase, data);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${type}`);
    }

    // Return success
    return res.status(200).json({ received: true, type: type });

  } catch (error) {
    console.error('========== WEBHOOK ERROR ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}

/**
 * Handle checkout session completed
 * This is the main event for successful payments
 */
async function handleCheckoutCompleted(supabase, data) {
  try {
    const { metadata, customer_email, mode } = data;
    
    if (!metadata || !metadata.user_id) {
      console.error('❌ No user_id in metadata');
      return;
    }

    const userId = metadata.user_id;
    console.log(`✅ Processing checkout for user: ${userId}`);

    // Check if this is a subscription or one-time payment
    if (metadata.type === 'credits') {
      // Handle credit purchase
      await handleCreditPurchase(supabase, userId, metadata);
    } else if (metadata.plan_type) {
      // Handle subscription
      await handleSubscriptionPayment(supabase, userId, metadata);
    } else {
      console.log('⚠️ Unknown checkout type');
    }

  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

/**
 * Handle credit purchase
 */
async function handleCreditPurchase(supabase, userId, metadata) {
  try {
    const creditsAmount = parseInt(metadata.credits_amount);
    
    if (!creditsAmount || creditsAmount <= 0) {
      console.error('❌ Invalid credits amount:', metadata.credits_amount);
      return;
    }

    console.log(`💎 Adding ${creditsAmount} credits to user ${userId}`);

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('credits, email')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }

    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + creditsAmount;

    // Update user credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      throw updateError;
    }

    console.log(`✅ Credits updated: ${currentCredits} → ${newCredits}`);

  } catch (error) {
    console.error('❌ Error in handleCreditPurchase:', error);
    throw error;
  }
}

/**
 * Handle subscription payment
 */
async function handleSubscriptionPayment(supabase, userId, metadata) {
  try {
    const planType = metadata.plan_type;
    const billingCycle = metadata.billing_cycle;

    if (!planType) {
      console.error('❌ No plan_type in metadata');
      return;
    }

    console.log(`📋 Activating ${planType} subscription for user ${userId}`);

    // Define credits for each plan
    const PLAN_CREDITS = {
      pro: 1000,
      premium: 5000,
      business: 25000,
    };

    const creditsToAdd = PLAN_CREDITS[planType] || 0;

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('credits, membership_tier')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }

    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    // Update user subscription and credits
    const { error: updateError } = await supabase
      .from('users')
      .update({
        membership_tier: planType,
        subscription_status: 'active',
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user subscription:', updateError);
      throw updateError;
    }

    console.log(`✅ Subscription activated: ${planType}`);
    console.log(`✅ Credits updated: ${currentCredits} → ${newCredits}`);

  } catch (error) {
    console.error('❌ Error in handleSubscriptionPayment:', error);
    throw error;
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(supabase, data) {
  try {
    console.log('💳 Payment succeeded');
    
    // Payment success is usually handled by checkout.session.completed
    // This is a backup/confirmation event
    
    const { metadata } = data;
    if (metadata && metadata.user_id) {
      console.log(`✅ Payment confirmed for user: ${metadata.user_id}`);
    }

  } catch (error) {
    console.error('❌ Error in handlePaymentSucceeded:', error);
    throw error;
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(supabase, data) {
  try {
    console.log('📝 Subscription created');
    
    // Subscription is usually activated by checkout.session.completed
    // This event is mainly for record-keeping

  } catch (error) {
    console.error('❌ Error in handleSubscriptionCreated:', error);
    throw error;
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(supabase, data) {
  try {
    console.log('🔄 Subscription updated');
    
    const { metadata, status } = data;
    
    if (metadata && metadata.user_id) {
      const userId = metadata.user_id;
      
      // Map CREEM status to our status
      let subscriptionStatus = 'active';
      if (status === 'canceled' || status === 'cancelled') {
        subscriptionStatus = 'cancelled';
      } else if (status === 'past_due') {
        subscriptionStatus = 'past_due';
      }

      // Update user subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log(`✅ Subscription status updated to: ${subscriptionStatus}`);
    }

  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(supabase, data) {
  try {
    console.log('❌ Subscription cancelled');
    
    const { metadata } = data;
    
    if (metadata && metadata.user_id) {
      const userId = metadata.user_id;

      // Update user to free tier (but keep credits)
      await supabase
        .from('users')
        .update({
          membership_tier: 'free',
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log(`✅ User ${userId} downgraded to free tier`);
    }

  } catch (error) {
    console.error('❌ Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

