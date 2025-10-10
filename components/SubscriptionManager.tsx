/**
 * Subscription Manager Component
 * Displays user's current subscription status and allows management
 */

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../config/supabase';

interface Subscription {
    id: string;
    plan_type: string;
    billing_cycle: string;
    status: string;
    amount: number;
    currency: string;
    start_date: string;
    end_date: string;
    next_billing_date?: string;
    created_at: string;
}

export const SubscriptionManager: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [membershipInfo, setMembershipInfo] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchSubscriptionStatus();
        }
    }, [user]);

    const fetchSubscriptionStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Please log in to view your subscription');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/get-subscription-status', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subscription status');
            }

            const data = await response.json();
            setSubscription(data.subscription);
            setMembershipInfo(data.user);
            setLoading(false);
        } catch (err: any) {
            console.error('Error fetching subscription:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getPlanName = (planType: string) => {
        const names: Record<string, string> = {
            'pro': 'Pro Plan',
            'premium': 'Premium Plan',
            'business': 'Business Plan',
        };
        return names[planType] || planType;
    };

    const getPlanIcon = (planType: string) => {
        const icons: Record<string, string> = {
            'pro': '⭐',
            'premium': '👑',
            'business': '💼',
        };
        return icons[planType] || '📦';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'active': 'bg-green-100 text-green-800',
            'cancelled': 'bg-yellow-100 text-yellow-800',
            'expired': 'bg-red-100 text-red-800',
            'pending': 'bg-blue-100 text-blue-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-red-600">
                    <p className="font-semibold">Error loading subscription</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!subscription || !membershipInfo) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        No Active Subscription
                    </h3>
                    <p className="text-slate-600 mb-6">
                        Subscribe to unlock powerful AI design features and premium credits
                    </p>
                    <a
                        href="/?page=pricing"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        View Plans
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="text-4xl">{getPlanIcon(subscription.plan_type)}</span>
                            <div>
                                <h2 className="text-2xl font-bold">{getPlanName(subscription.plan_type)}</h2>
                                <p className="text-indigo-100">
                                    {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} Subscription
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">
                                ${subscription.amount}
                            </div>
                            <div className="text-indigo-100 text-sm">
                                per {subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Status */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(subscription.status)}`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                    </div>

                    {/* Credits */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Available Credits</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            {membershipInfo.credits.toLocaleString()}
                        </span>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        {/* Start Date */}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Started on</span>
                            <span className="text-slate-900 font-medium">{formatDate(subscription.start_date)}</span>
                        </div>

                        {/* End Date */}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">
                                {subscription.status === 'active' ? 'Renews on' : 'Expires on'}
                            </span>
                            <span className="text-slate-900 font-medium">{formatDate(subscription.end_date)}</span>
                        </div>

                        {/* Next Billing */}
                        {subscription.next_billing_date && subscription.status === 'active' && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Next billing</span>
                                <span className="text-slate-900 font-medium">
                                    {formatDate(subscription.next_billing_date)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {subscription.status === 'active' && (
                        <div className="pt-4 flex gap-3">
                            <a
                                href="/?page=pricing"
                                className="flex-1 text-center bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                            >
                                Upgrade Plan
                            </a>
                            <button
                                className="flex-1 text-center bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                                onClick={() => {
                                    // TODO: Implement cancel subscription
                                    alert('Cancel subscription feature coming soon!');
                                }}
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    )}

                    {subscription.status === 'cancelled' && (
                        <div className="pt-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                Your subscription has been cancelled. You can continue using premium features until {formatDate(subscription.end_date)}.
                            </div>
                            <a
                                href="/?page=pricing"
                                className="mt-3 block text-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Resubscribe
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📘 Subscription Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your credits will be automatically renewed each billing cycle</li>
                    <li>• You can upgrade or change your plan at any time</li>
                    <li>• Cancellation takes effect at the end of your current billing period</li>
                </ul>
            </div>
        </div>
    );
};

