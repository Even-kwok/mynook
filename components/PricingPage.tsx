import React, { useState, useContext } from 'react';
import { IconCheck } from './Icons';
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
            '1,000 credits for AI generation',
            'Design generation features',
            'Create up to 1 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Standard response times',
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
            '5,000 credits for AI generation',
            '🎨 Unlock Free Canvas feature',
            'Priority queue processing',
            'Create up to 8 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Fast response times',
            'Furniture removal',
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
            '25,000 credits for AI generation',
            '💰 Best value per credit',
            '🎨 Free Canvas feature included',
            'Create up to 16 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Very fast response times',
            'Furniture removal',
            'Early access to new features',
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
        <main className="min-h-screen bg-black relative overflow-y-auto text-white scrollbar-hide">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
                    alt="Mountain background" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90" />
            </div>
            
            <div className="pt-[136px] pb-16 sm:pt-[168px] sm:pb-24 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '48px', lineHeight: '60px', letterSpacing: '0px' }}>
                        Plans & pricing
                    </h1>
                    <p className="mt-4 text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', maxWidth: '48rem', margin: '1rem auto 0' }}>
                        Choose the plan that's right for you and unlock the full power of AI interior design.
                    </p>

                    {error && (
                        <div className="mt-6 mx-auto max-w-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="mt-10 flex justify-center">
                        <div className="relative flex items-center p-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-white"
                            >
                                {billingCycle === 'monthly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-white/20 rounded-full shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Monthly</span>
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-white"
                            >
                                {billingCycle === 'yearly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-white/20 rounded-full shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Yearly</span>
                                <div className="absolute -top-3 -right-5">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-white ring-4 ring-black">
                                        Save 50%+
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className={`relative border rounded-3xl p-8 flex flex-col h-full backdrop-blur-md ${
                                plan.isPopular ? 'bg-white/10 border-purple-400/30 shadow-lg shadow-purple-500/10' : 'bg-white/10 border-white/20 shadow-sm'
                            }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-500 text-white">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{plan.icon}</span>
                                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                            </div>
                            
                            <div className="mt-2 inline-block px-3 py-1 bg-[#00BCD4]/20 text-[#00BCD4] text-sm font-semibold rounded-full border border-[#00BCD4]/30">
                                {plan.credits.toLocaleString()} Credits
                            </div>
                            
                            <div className="mt-6 flex items-baseline gap-x-2">
                                <span className="text-5xl font-extrabold tracking-tight text-white">
                                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                                </span>
                                <span className="text-base font-medium text-slate-300">
                                    / month
                                </span>
                            </div>
                            
                            <p className="mt-2 text-sm text-slate-400">
                                {billingCycle === 'yearly' && `billed yearly $${plan.yearlyBilled}`}
                            </p>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loadingPlanId !== null}
                                className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-center transition-transform duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                                    plan.isPopular ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600' : 'bg-[#00BCD4] text-black hover:bg-[#00ACC1]'
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
                                ) : 'Subscribe'}
                            </button>

                            <div className="mt-10 flex-1 space-y-4">
                                {plan.description && <p className="text-sm font-semibold text-slate-300">{plan.description}</p>}
                                <ul role="list" className="space-y-4 text-sm leading-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <IconCheck className="h-6 w-5 flex-none text-[#00BCD4]" aria-hidden="true" />
                                            <span className="text-slate-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Credit Packs Section */}
                <div className="mt-24 max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '48px', lineHeight: '60px', letterSpacing: '0px' }}>
                            💎 Top up your credits
                        </h2>
                        <p className="mt-4 text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', letterSpacing: '0px', maxWidth: '48rem', margin: '1rem auto 0' }}>
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
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                    className={`relative border rounded-2xl p-6 flex flex-col backdrop-blur-md ${
                                        pack.isPopular ? 'bg-white/10 border-amber-400/30 shadow-lg shadow-amber-500/10' : 'bg-white/10 border-white/20 shadow-sm'
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
                                        <p className="mt-2 text-sm text-slate-300">{pack.description}</p>
                                        
                                        <div className="mt-4 inline-block px-4 py-2 bg-[#00BCD4]/20 text-[#00BCD4] text-lg font-bold rounded-full border border-[#00BCD4]/30">
                                            {pack.credits.toLocaleString()} Credits
                                        </div>

                                        <div className="mt-6 flex items-baseline justify-center gap-x-2">
                                            <span className="text-4xl font-extrabold tracking-tight text-white">
                                                ${pack.price}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-400">
                                            ${(pack.price / pack.credits).toFixed(3)} per credit
                                        </p>

                                        {isFreeUser && (
                                            <div className="mt-4 px-3 py-2 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                                                <p className="text-xs text-amber-300 font-medium">
                                                    ⭐ Upgrade to Pro, Premium or Business to purchase credits
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handlePurchaseCredits(pack.id)}
                                            disabled={isDisabled}
                                            className={`mt-6 w-full py-3 px-6 rounded-xl font-semibold text-center transition-transform duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                                                pack.isPopular 
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600' 
                                                    : 'bg-[#00BCD4] text-black hover:bg-[#00ACC1]'
                                            }`}
                                        >
                                            {loadingPackId === pack.id ? 'Processing...' : isFreeUser ? '🔒 Upgrade Required' : 'Buy Now'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        <p>💡 Credits never expire and can be used for any AI generation feature</p>
                    </div>
                </div>
            </div>
        </main>
    );
};
