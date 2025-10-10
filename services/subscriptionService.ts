/**
 * Subscription Service
 * Manages user subscriptions and integrates with database
 */

import { createClient } from '@supabase/supabase-js';
import { MEMBERSHIP_CONFIG } from '../types/database';

// Create Supabase client that works in both browser and Node.js
const getSupabaseClient = () => {
  // In Node.js environment (Vercel Functions)
  if (typeof process !== 'undefined' && process.env) {
    const url = process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    return createClient(url, key);
  }
  
  // In browser environment
  if (typeof window !== 'undefined' && (import.meta as any).env) {
    const url = (import.meta as any).env.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
    return createClient(url, key);
  }
  
  throw new Error('Unable to initialize Supabase client');
};

const supabase = getSupabaseClient();

interface SubscriptionData {
  userId: string;
  planType: 'pro' | 'premium' | 'business';
  billingCycle: 'monthly' | 'yearly';
  creemSubscriptionId: string;
  creemCustomerId: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
}

interface UpdateMembershipParams {
  userId: string;
  membershipTier: 'pro' | 'premium' | 'business';
  credits?: number;
  subscriptionId?: string;
  subscriptionEndDate?: string;
}

// Database subscription record type
interface DbSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  creem_subscription_id: string | null;
  creem_customer_id: string | null;
  amount: number;
  currency: string;
  start_date: string | null;
  end_date: string;
  next_billing_date: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * Create a new subscription record in the database
 */
export async function createSubscription(data: SubscriptionData) {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: data.userId,
        plan_type: data.planType,
        billing_cycle: data.billingCycle,
        status: 'active',
        creem_subscription_id: data.creemSubscriptionId,
        creem_customer_id: data.creemCustomerId,
        amount: data.amount,
        currency: data.currency,
        start_date: data.startDate,
        end_date: data.endDate,
        next_billing_date: data.nextBillingDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Error in createSubscription:', error);
    throw error;
  }
}

/**
 * Update user membership tier and credits
 */
export async function updateUserMembership(params: UpdateMembershipParams) {
  const { userId, membershipTier, credits, subscriptionId, subscriptionEndDate } = params;

  try {
    // Get the default credits for the membership tier if not provided
    const membershipCredits = credits ?? MEMBERSHIP_CONFIG[membershipTier].credits;

    const updateData: any = {
      membership_tier: membershipTier,
      credits: membershipCredits,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (subscriptionId) {
      updateData.current_subscription_id = subscriptionId;
    }

    if (subscriptionEndDate) {
      updateData.subscription_end_date = subscriptionEndDate;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user membership:', error);
      throw error;
    }

    console.log(`User ${userId} upgraded to ${membershipTier} with ${membershipCredits} credits`);
    return user;
  } catch (error) {
    console.error('Error in updateUserMembership:', error);
    throw error;
  }
}

/**
 * Handle subscription activated (payment successful)
 */
export async function handleSubscriptionActivated(
  subscriptionId: string,
  creemSubscriptionData: any
) {
  try {
    // Update subscription status to active
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('creem_subscription_id', subscriptionId);

    if (subError) {
      console.error('Error activating subscription:', subError);
      throw subError;
    }

    // Get subscription details to update user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('creem_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      // Type assertion for database record
      const sub = subscription as DbSubscription;
      // Update user membership
      await updateUserMembership({
        userId: sub.user_id,
        membershipTier: sub.plan_type as 'pro' | 'premium' | 'business',
        subscriptionId: sub.id,
        subscriptionEndDate: sub.end_date,
      });
    }

    console.log(`Subscription ${subscriptionId} activated successfully`);
    return subscription;
  } catch (error) {
    console.error('Error in handleSubscriptionActivated:', error);
    throw error;
  }
}

/**
 * Handle subscription cancelled
 */
export async function handleSubscriptionCancelled(subscriptionId: string) {
  try {
    // Update subscription status
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('creem_subscription_id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }

    // Update user subscription status
    if (subscription) {
      const sub = subscription as DbSubscription;
      await supabase
        .from('users')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.user_id);
    }

    console.log(`Subscription ${subscriptionId} cancelled`);
    return subscription;
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

/**
 * Handle subscription expired
 */
export async function handleSubscriptionExpired(subscriptionId: string) {
  try {
    // Update subscription status
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('creem_subscription_id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error expiring subscription:', error);
      throw error;
    }

    // Downgrade user to free tier
    if (subscription) {
      const sub = subscription as DbSubscription;
      await supabase
        .from('users')
        .update({
          membership_tier: 'free',
          subscription_status: 'expired',
          credits: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.user_id);

      console.log(`User ${sub.user_id} downgraded to free tier`);
    }

    console.log(`Subscription ${subscriptionId} expired`);
    return subscription;
  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error);
    throw error;
  }
}

/**
 * Get user's active subscription
 */
export async function getUserActiveSubscription(userId: string): Promise<DbSubscription | null> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error fetching active subscription:', error);
      throw error;
    }

    return subscription as DbSubscription | null;
  } catch (error) {
    console.error('Error in getUserActiveSubscription:', error);
    return null;
  }
}

/**
 * Get user's subscription history
 */
export async function getUserSubscriptionHistory(userId: string): Promise<DbSubscription[]> {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }

    return (subscriptions as DbSubscription[]) || [];
  } catch (error) {
    console.error('Error in getUserSubscriptionHistory:', error);
    return [];
  }
}

