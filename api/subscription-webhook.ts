/**
 * API Endpoint: Subscription Webhook
 * Handles webhooks from CREEM payment platform
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '../services/creemService';
import {
  handleSubscriptionActivated,
  handleSubscriptionCancelled,
  handleSubscriptionExpired,
} from '../services/subscriptionService';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get webhook signature from headers
    const signature = req.headers['creem-signature'] || req.headers['x-creem-signature'];
    
    if (!signature || typeof signature !== 'string') {
      console.error('No webhook signature provided');
      return res.status(401).json({ error: 'No signature provided' });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, CREEM_WEBHOOK_SECRET);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook event
    const event = req.body;
    const { type, data } = event;

    console.log(`Received webhook event: ${type}`);

    // Handle different webhook events
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.activated':
      case 'subscription.active':
        await handleSubscriptionActivated(data.subscription_id, data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.cancelled':
      case 'subscription.canceled':
        await handleSubscriptionCancelled(data.subscription_id);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(data.subscription_id);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(data: any) {
  try {
    const { session_id, customer_id, subscription_id, metadata } = data;

    console.log('Checkout completed:', { session_id, customer_id, subscription_id });

    // Update subscription with customer and subscription IDs
    if (session_id) {
      await supabase
        .from('subscriptions')
        .update({
          creem_customer_id: customer_id,
          creem_subscription_id: subscription_id,
          status: 'active',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('creem_checkout_session_id', session_id);
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    throw error;
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(data: any) {
  try {
    const { subscription_id, customer_id } = data;
    console.log('Subscription created:', { subscription_id, customer_id });

    // Subscription record should already exist from checkout
    // Just update the IDs if needed
    await supabase
      .from('subscriptions')
      .update({
        creem_subscription_id: subscription_id,
        creem_customer_id: customer_id,
        updated_at: new Date().toISOString(),
      })
      .or(`creem_subscription_id.eq.${subscription_id},creem_customer_id.eq.${customer_id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(data: any) {
  try {
    const { subscription_id, status, current_period_end } = data;
    console.log('Subscription updated:', { subscription_id, status });

    await supabase
      .from('subscriptions')
      .update({
        status: mapCreemStatusToDbStatus(status),
        next_billing_date: current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('creem_subscription_id', subscription_id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(data: any) {
  try {
    const { subscription_id, amount, currency } = data;
    console.log('Payment succeeded:', { subscription_id, amount, currency });

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('creem_subscription_id', subscription_id)
      .single();

    if (subscription) {
      // Extend subscription end date
      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(currentEndDate);
      
      if (subscription.billing_cycle === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      await supabase
        .from('subscriptions')
        .update({
          end_date: newEndDate.toISOString(),
          next_billing_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(data: any) {
  try {
    const { subscription_id, reason } = data;
    console.log('Payment failed:', { subscription_id, reason });

    // Optionally notify user or take action
    // For now, just log it
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Map CREEM status to database status
 */
function mapCreemStatusToDbStatus(creemStatus: string): 'active' | 'cancelled' | 'expired' | 'pending' {
  const statusMap: Record<string, 'active' | 'cancelled' | 'expired' | 'pending'> = {
    'active': 'active',
    'canceled': 'cancelled',
    'cancelled': 'cancelled',
    'expired': 'expired',
    'past_due': 'active', // Keep active but could be flagged
    'unpaid': 'cancelled',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'trialing': 'active',
  };

  return statusMap[creemStatus.toLowerCase()] || 'pending';
}

