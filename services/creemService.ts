/**
 * CREEM Payment Service
 * Handles all interactions with CREEM payment platform API
 */

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_API_BASE_URL = 'https://api.creem.io/v1'; // Update with actual CREEM API URL

interface CheckoutSessionParams {
  planType: 'pro' | 'premium' | 'business';
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

interface CreemCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  subscription_id?: string;
}

interface CreemSubscription {
  id: string;
  customer_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  plan_type: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

/**
 * Plan pricing configuration
 */
const PLAN_PRICING = {
  pro: {
    monthly: 39,
    yearly: 199,
  },
  premium: {
    monthly: 99,
    yearly: 499,
  },
  business: {
    monthly: 299,
    yearly: 1699,
  },
} as const;

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CreemCheckoutSession> {
  if (!CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not configured');
  }

  const { planType, billingCycle, userId, userEmail, successUrl, cancelUrl } = params;
  
  // Get pricing for the selected plan
  const amount = PLAN_PRICING[planType][billingCycle];

  try {
    const response = await fetch(`${CREEM_API_BASE_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'subscription',
        customer_email: userEmail,
        client_reference_id: userId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
                description: `MyNook ${planType} subscription - ${billingCycle}`,
              },
              recurring: {
                interval: billingCycle === 'monthly' ? 'month' : 'year',
              },
              unit_amount: amount * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          plan_type: planType,
          billing_cycle: billingCycle,
          user_id: userId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CREEM API error: ${error.message || response.statusText}`);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get subscription details from CREEM
 */
export async function getSubscription(subscriptionId: string): Promise<CreemSubscription> {
  if (!CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${CREEM_API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CREEM API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<CreemSubscription> {
  if (!CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${CREEM_API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CREEM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CREEM API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // CREEM typically uses HMAC SHA256 for webhook signatures
    // This is a placeholder - adjust based on actual CREEM documentation
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(customerId: string): Promise<CreemSubscription[]> {
  if (!CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not configured');
  }

  try {
    const response = await fetch(
      `${CREEM_API_BASE_URL}/subscriptions?customer_id=${customerId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CREEM_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CREEM API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    throw error;
  }
}

export { PLAN_PRICING };

