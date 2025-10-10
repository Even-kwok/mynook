-- Create subscriptions table for managing user subscriptions
-- This table tracks all subscription records and their status

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- Create enum for billing cycle
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plan details
    plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'premium', 'business')),
    billing_cycle billing_cycle NOT NULL,
    
    -- Status
    status subscription_status NOT NULL DEFAULT 'pending',
    
    -- CREEM integration
    creem_subscription_id TEXT UNIQUE,
    creem_customer_id TEXT,
    creem_checkout_session_id TEXT,
    
    -- Dates
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_creem_subscription_id ON public.subscriptions(creem_subscription_id);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Extend users table with subscription fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS creem_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'expired',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES public.subscriptions(id);

-- Add index for creem_customer_id
CREATE INDEX IF NOT EXISTS idx_users_creem_customer_id ON public.users(creem_customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only system (service role) can insert/update subscriptions
-- This is for webhook handlers and admin operations
CREATE POLICY "Service role can manage all subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
    s.*,
    u.email,
    u.full_name,
    u.membership_tier
FROM public.subscriptions s
JOIN public.users u ON s.user_id = u.id
WHERE s.status = 'active'
AND (s.end_date IS NULL OR s.end_date > NOW());

-- Grant permissions
GRANT SELECT ON public.active_subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

COMMENT ON TABLE public.subscriptions IS 'Stores user subscription records and integrates with CREEM payment platform';
COMMENT ON COLUMN public.subscriptions.creem_subscription_id IS 'CREEM platform subscription ID';
COMMENT ON COLUMN public.subscriptions.creem_customer_id IS 'CREEM platform customer ID';

