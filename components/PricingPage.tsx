import React, { useState } from 'react';
import { IconCheck } from './Icons';
import { motion } from 'framer-motion';

const plans = [
    {
        name: 'Pro Plan',
        monthlyPrice: 39,
        yearlyPrice: 17,
        yearlyBilled: 199,
        features: [
            'Create 1,000 interior designs',
            'Create up to 4 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Slow response times',
        ],
        isPopular: false,
    },
    {
        name: 'Premium Plan',
        monthlyPrice: 99,
        yearlyPrice: 42,
        yearlyBilled: 499,
        description: 'All Pro features, plus:',
        features: [
            'Create 5,000 interior designs',
            'Create up to 8 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Fast response times',
            'Furniture removal',
            'Magic editor',
            'Multi-view staging',
            'Outdoor landscaping mode',
            'Cloud storage',
        ],
        isPopular: true,
    },
    {
        name: 'Business Plan',
        monthlyPrice: 299,
        yearlyPrice: 142,
        yearlyBilled: 1699,
        description: 'All Premium features, plus:',
        features: [
            'Create 25,000 interior designs',
            'Create up to 16 designs in parallel',
            'Commercial use license',
            'No watermark',
            'Style transfer',
            'Very fast response times',
            'Furniture removal',
            'Magic editor',
            'Multi-view staging',
            'Outdoor landscaping mode',
            'Cloud storage',
            'Early access to new features',
        ],
        isPopular: false,
    },
];

export const PricingPage: React.FC = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

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

                            <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                            
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
                                className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-center transition-transform duration-200 transform hover:scale-[1.02] ${
                                    plan.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-white hover:bg-slate-900'
                                }`}
                            >
                                Subscribe
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
            </div>
        </main>
    );
};
