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
            'Create up to 9 designs in parallel',
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
            'Create up to 18 designs in parallel',
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
    const { user, setShowLoginModal } = useContext(AuthContext);
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
        <main className="flex-1 overflow-y-auto bg-white text-slate-900 scrollbar-hide">
            <div className="pt-[136px] pb-16 sm:pt-[168px] sm:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                        Plans & pricing
                    </h1>
                    <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
                        Choose the plan that's right for you and unlock the full power of AI interior design.
                    </p>

                    {error && (
                        <div className="mt-6 mx-auto max-w-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="mt-10 flex justify-center">
                        <div className="relative flex items-center p-1 bg-slate-100 rounded-full">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-slate-700"
                            >
                                {billingCycle === 'monthly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Monthly</span>
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className="px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors relative text-slate-700"
                            >
                                {billingCycle === 'yearly' && (
                                    <motion.div
                                        layoutId="billing-highlight"
                                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">Yearly</span>
                                <div className="absolute -top-3 -right-5">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 ring-4 ring-white">
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
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative border rounded-3xl p-8 flex flex-col h-full ${
                                plan.isPopular ? 'bg-indigo-50 border-indigo-300 shadow-lg shadow-indigo-500/10' : 'bg-white border-slate-200 shadow-sm'
                            }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-500 text-white">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{plan.icon}</span>
                                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                            </div>
                            
                            <div className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                                {plan.credits.toLocaleString()} Credits
                            </div>
                            
                            <div className="mt-6 flex items-baseline gap-x-2">
                                <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                                </span>
                                <span className="text-base font-medium text-slate-500">
                                    / month
                                </span>
                            </div>
                            
                            <p className="mt-2 text-sm text-slate-500">
                                {billingCycle === 'yearly' && `billed yearly $${plan.yearlyBilled}`}
                            </p>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loadingPlanId !== null}
                                className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-center transition-transform duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                                    plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-900'
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
                                {plan.description && <p className="text-sm font-semibold text-slate-600">{plan.description}</p>}
                                <ul role="list" className="space-y-4 text-sm leading-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <IconCheck className="h-6 w-5 flex-none text-indigo-500" aria-hidden="true" />
                                            <span className="text-slate-600">{feature}</span>
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
                        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            💎 Top up your credits
                        </h2>
                        <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
                            Need more credits? Purchase one-time credit packs anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {creditPacks.map((pack, index) => (
                            <motion.div
                                key={pack.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                className={`relative border rounded-2xl p-6 flex flex-col ${
                                    pack.isPopular ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
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
                                    <h3 className="mt-4 text-xl font-bold text-slate-900">{pack.name}</h3>
                                    <p className="mt-2 text-sm text-slate-500">{pack.description}</p>
                                    
                                    <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-lg font-bold rounded-full">
                                        {pack.credits.toLocaleString()} Credits
                                    </div>

                                    <div className="mt-6 flex items-baseline justify-center gap-x-2">
                                        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                                            ${pack.price}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        ${(pack.price / pack.credits).toFixed(3)} per credit
                                    </p>

                                    <button
                                        onClick={() => handlePurchaseCredits(pack.id)}
                                        disabled={loadingPackId !== null}
                                        className={`mt-6 w-full py-3 px-6 rounded-xl font-semibold text-center transition-transform duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                                            pack.isPopular 
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600' 
                                                : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        {loadingPackId === pack.id ? 'Processing...' : 'Buy Now'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        <p>💡 Credits never expire and can be used for any AI generation feature</p>
                    </div>
                </div>
            </div>
        </main>
    );
};
