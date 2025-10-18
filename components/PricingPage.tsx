import React, { useState, useContext } from 'react';
import { IconCheck, IconXMark } from './Icons';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../config/supabase';

// Credit packs for one-time purchase
const creditPacks = [
    {
        id: '100',
        credits: 100,
        price: 9.90,
        icon: '💎',
        name: '100 Credits Pack',
        description: 'Perfect for trying out',
    },
    {
        id: '300',
        credits: 300,
        price: 24.99,
        icon: '💎',
        name: '300 Credits Pack',
        description: 'Great for small projects',
        isPopular: true,
    },
    {
        id: '1000',
        credits: 1000,
        price: 69.99,
        icon: '💎',
        name: '1000 Credits Pack',
        description: 'Best value per credit',
    },
];

const plans = [
    {
        id: 'pro',
        name: 'Pro Plan',
        icon: '⭐',
        monthlyPrice: 39,
        yearlyPrice: 17,
        yearlyBilled: 199,
        credits: 1000,
        features: [
            '✓ 1,000 credits for AI generation',
            '✓ Design generation features',
            '✓ Create up to 1 design per generation',
            '✓ Commercial use license',
            '✓ No watermark',
            '✓ Style transfer',
            '✓ Standard response times',
            '✗ Free Canvas feature',
            '✗ Item Replace feature',
            '✗ Priority queue',
            '✗ Early access to new features',
        ],
        isPopular: false,
    },
    {
        id: 'premium',
        name: 'Premium Plan',
        icon: '👑',
        monthlyPrice: 99,
        yearlyPrice: 42,
        yearlyBilled: 499,
        credits: 5000,
        description: 'All Pro features, plus:',
        features: [
            '✓ 5,000 credits for AI generation',
            '✓ Create up to 8 designs in parallel',
            '✓ Free Canvas feature',
            '✓ Item Replace feature',
            '✓ Priority queue processing',
            '✓ Fast response times',
            '✓ Commercial use license',
            '✓ No watermark',
            '✓ Style transfer',
            '✓ Early access to new features',
        ],
        isPopular: true,
    },
    {
        id: 'business',
        name: 'Business Plan',
        icon: '💼',
        monthlyPrice: 299,
        yearlyPrice: 142,
        yearlyBilled: 1699,
        credits: 25000,
        description: 'All Premium features, plus:',
        features: [
            '✓ 25,000 credits (Best value per credit)',
            '✓ Create up to 16 designs in parallel',
            '✓ Free Canvas feature',
            '✓ Item Replace feature',
            '✓ Priority queue processing',
            '✓ Fast response times',
            '✓ Commercial use license',
            '✓ No watermark',
            '✓ Style transfer',
            '✓ Early access to new features',
        ],
        isPopular: false,
    },
];

export const PricingPage: React.FC = () => {
    const { user, setShowLoginModal, membershipTier, profile } = useContext(AuthContext);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchaseCredits = async (packId: string) => {
        // Check if user is logged in
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        // Check if user has a paid membership (Pro, Premium, or Business)
        if (membershipTier === 'free') {
            setError('Credit packs are only available for Pro, Premium, and Business members. Please upgrade your plan first.');
            return;
        }

        setLoadingPackId(packId);
        setError(null);

        try {
            // Get user session token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session || !session.access_token) {
                console.error('Session error:', sessionError);
                setShowLoginModal(true);
                return;
            }

            console.log('✅ Session obtained, calling purchase credits API...');

            // Call API to create checkout session for credits
            const response = await fetch('/api/purchase-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    packType: packId,
                }),
            });

            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = 'Failed to create checkout session';
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Parse success response
            const data = await response.json();
            const checkoutUrl = data.checkoutUrl;

            if (!checkoutUrl) {
                throw new Error('No checkout URL received from server');
            }

            // Redirect to CREEM checkout page
            window.location.href = checkoutUrl;

        } catch (err: any) {
            console.error('Error creating checkout session:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setLoadingPackId(null);
        }
    };

    const handleSubscribe = async (planId: string) => {
        // Check if user is logged in
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        // Check if user already has this plan or a higher tier
        const tierHierarchy = ['free', 'pro', 'premium', 'business'];
        const currentTierIndex = tierHierarchy.indexOf(membershipTier);
        const targetTierIndex = tierHierarchy.indexOf(planId);

        if (currentTierIndex >= targetTierIndex) {
            if (currentTierIndex === targetTierIndex) {
                setError(`You already have the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`);
            } else {
                setError(`You already have a higher tier plan (${membershipTier.charAt(0).toUpperCase() + membershipTier.slice(1)}).`);
            }
            return;
        }

        setLoadingPlanId(planId);
        setError(null);

        try {
            // Get user session token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session || !session.access_token) {
                console.error('Session error:', sessionError);
                setShowLoginModal(true);
                return;
            }

            console.log('✅ Session obtained, calling subscription API...');

            // Call API to create checkout session (using new pure JS API)
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    planType: planId,
                    billingCycle: billingCycle,
                }),
            });

            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = 'Failed to create checkout session';
                
                // Clone response so we can read it multiple times if needed
                const responseClone = response.clone();
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (parseError) {
                    // If response is not JSON, try to read as text from the clone
                    try {
                        const textError = await responseClone.text();
                        errorMessage = textError || `Server error: ${response.status}`;
                        console.error('Non-JSON error response:', textError);
                    } catch (textError) {
                        errorMessage = `Server error: ${response.status}`;
                    }
                }
                throw new Error(errorMessage);
            }

            // Parse success response
            let checkoutUrl;
            try {
                const data = await response.json();
                checkoutUrl = data.checkoutUrl;
            } catch (parseError) {
                console.error('Failed to parse success response:', parseError);
                throw new Error('Invalid response from server');
            }

            if (!checkoutUrl) {
                throw new Error('No checkout URL received from server');
            }

            // Redirect to CREEM checkout page
            window.location.href = checkoutUrl;

        } catch (err: any) {
            console.error('Error creating checkout session:', err);
            setError(err.message || 'Something went wrong. Please try again.');
            setLoadingPlanId(null);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] text-white scrollbar-hide" style={{ fontFamily: 'Arial, sans-serif' }}>
            <div className="pt-[136px] pb-16 sm:pt-[168px] sm:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                        Plans & pricing
                    </h1>
                    <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
                        Choose the plan that's right for you and unlock the full power of AI interior design.
                    </p>

                    {error && (
                        <div className="mt-6 mx-auto max-w-md bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="mt-10 flex justify-center">
                        <div className="relative flex items-center p-1 bg-[#1a1a1a] border border-[#333333] rounded-full">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-slate-300"
                            >
                                {billingCycle === 'monthly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Monthly</span>
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-slate-300"
                            >
                                {billingCycle === 'yearly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Yearly</span>
                                <div className="absolute -top-3 -right-5">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white ring-4 ring-[#0a0a0a]">
                                        Save 50%+
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => {
                        // 判断用户权限等级
                        const tierHierarchy = ['free', 'pro', 'premium', 'business'];
                        const currentTierIndex = tierHierarchy.indexOf(membershipTier);
                        const planTierIndex = tierHierarchy.indexOf(plan.id);
                        
                        // 判断按钮是否应该被禁用
                        const isCurrentPlan = currentTierIndex === planTierIndex;
                        const isLowerTier = currentTierIndex > planTierIndex;
                        const isPlanDisabled = isCurrentPlan || isLowerTier || loadingPlanId !== null;
                        
                        // 确定按钮文本
                        let buttonText = 'Subscribe';
                        if (isCurrentPlan) {
                            buttonText = '✓ Current Plan';
                        } else if (isLowerTier) {
                            buttonText = 'Lower Tier';
                        } else if (loadingPlanId === plan.id) {
                            buttonText = 'Processing...';
                        }
                        
                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative border rounded-3xl p-8 flex flex-col h-full ${
                                    plan.isPopular ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border-purple-500/50 shadow-lg shadow-purple-500/20' : 'bg-[#1a1a1a] border-[#333333] shadow-sm'
                                } ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-4 right-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                                            ✓ Active
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{plan.icon}</span>
                                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                                </div>
                                
                                <div className="mt-2 inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold rounded-full">
                                    {plan.credits.toLocaleString()} Credits
                                </div>
                                
                                <div className="mt-6 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                        ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                                    </span>
                                    <span className="text-base font-medium text-slate-400">
                                        / month
                                    </span>
                                </div>
                                
                                <p className="mt-2 text-sm text-slate-500">
                                    {billingCycle === 'yearly' && `billed yearly $${plan.yearlyBilled}`}
                                </p>

                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isPlanDisabled}
                                    className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-200 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                                        isPlanDisabled 
                                            ? 'bg-slate-700 text-slate-400' 
                                            : plan.isPopular 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02]' 
                                                : 'bg-[#2a2a2a] text-white hover:bg-[#333333] hover:scale-[1.02]'
                                    }`}
                                >
                                    {loadingPlanId === plan.id ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : buttonText}
                                </button>

                                {isLowerTier && (
                                    <p className="mt-2 text-xs text-center text-slate-500">
                                        You have a higher tier plan
                                    </p>
                                )}

                                <div className="mt-10 flex-1 space-y-4">
                                    {plan.description && <p className="text-sm font-semibold text-slate-400">{plan.description}</p>}
                                    <ul role="list" className="space-y-4 text-sm leading-6">
                                        {plan.features.map((feature) => {
                                            const isAvailable = feature.startsWith('✓');
                                            const featureText = feature.replace(/^[✓✗]\s*/, '');
                                            
                                            return (
                                                <li key={feature} className="flex gap-x-3">
                                                    {isAvailable ? (
                                                        <IconCheck className="h-6 w-5 flex-none text-green-400" aria-hidden="true" />
                                                    ) : (
                                                        <IconXMark className="h-6 w-5 flex-none text-red-400/60" aria-hidden="true" />
                                                    )}
                                                    <span className="text-slate-300">{featureText}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Credit Packs Section */}
                <div className="mt-24 max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white">
                            💎 Top up your credits
                        </h2>
                        <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
                            Need more credits? Purchase one-time credit packs anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {creditPacks.map((pack, index) => {
                            const isFreeUser = membershipTier === 'free';
                            const isDisabled = loadingPackId !== null || isFreeUser;
                            
                            return (
                                <motion.div
                                    key={pack.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                    className={`relative border rounded-2xl p-6 flex flex-col ${
                                        pack.isPopular ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-amber-500/50 shadow-lg shadow-amber-500/20' : 'bg-[#1a1a1a] border-[#333333] shadow-sm'
                                    }`}
                                >
                                    {pack.isPopular && (
                                        <div className="absolute -top-3 -right-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                                                Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <span className="text-5xl">{pack.icon}</span>
                                        <h3 className="mt-4 text-xl font-bold text-white">{pack.name}</h3>
                                        <p className="mt-2 text-sm text-slate-400">{pack.description}</p>
                                        
                                        <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-lg font-bold rounded-full">
                                            {pack.credits.toLocaleString()} Credits
                                        </div>

                                        <div className="mt-6 flex items-baseline justify-center gap-x-2">
                                            <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                                ${pack.price}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-500">
                                            ${(pack.price / pack.credits).toFixed(3)} per credit
                                        </p>

                                        {isFreeUser && (
                                            <div className="mt-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                <p className="text-xs text-amber-300 font-medium">
                                                    ⭐ Upgrade to Pro, Premium or Business to purchase credits
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handlePurchaseCredits(pack.id)}
                                            disabled={isDisabled}
                                            className={`mt-6 w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                                                pack.isPopular 
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600' 
                                                    : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
                                            }`}
                                        >
                                            {loadingPackId === pack.id ? 'Processing...' : isFreeUser ? '🔒 Upgrade Required' : 'Buy Now'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        <p>💡 Credits never expire and can be used for any AI generation feature</p>
                    </div>
                </div>
            </div>
        </main>
    );
};
