
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { IconUserCircle, IconSparkles, IconPhoto, IconLayoutDashboard, IconUsers, IconSettings, IconPencil, IconTrash, IconPlus, IconChevronDown, IconArrowDown, IconArrowUp, IconX, IconMoveUp, IconMoveDown, IconMoveToTop, IconMoveToBottom, IconUpload, IconTag } from './Icons';
import { PERMISSION_MAP } from '../constants';
import { PromptTemplate, User, GenerationBatch, RecentActivity, ManagedTemplateData, ManagedPromptTemplateCategory, DashboardOverview, SimilarCategoryGroup } from '../types';
import { analyzeSimilarCategories } from '../services/categoryMergeService';
import { supabase } from '../config/supabase';
import { Button } from './Button';
import { toBase64 } from '../utils/imageUtils';
import { BatchTemplateUpload } from './BatchTemplateUpload';
import { BatchImageMatcher } from './BatchImageMatcher';
import { HomeSectionManager } from './HomeSectionManager';
import { HeroSectionManager } from './HeroSectionManager';
import { AITemplateCreator } from './AITemplateCreator';
import { createTemplate, updateTemplate, deleteTemplate as deleteTemplateFromDB, getAllTemplates, toggleCategoryEnabled, toggleMainCategoryEnabled, addMainCategory as addMainCategoryToDB, deleteMainCategory as deleteMainCategoryFromDB, deleteSubCategory as deleteSubCategoryFromDB, reorderMainCategories, reorderSubCategories, reorderTemplates, batchDeleteTemplates } from '../services/templateService';
import { getToolsOrder, saveToolsOrder, resetToolsOrder, moveToolUp, moveToolDown, moveToolToTop, moveToolToBottom, ToolItemConfig } from '../services/toolsOrderService';

// --- Component Props ---

export interface AdminPageProps {
    users: User[];
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
    generationHistory: GenerationBatch[];
    totalDesignsGenerated: number;
    onDeleteBatch: (batchId: string) => void;
    templateData: ManagedTemplateData;
    setTemplateData: React.Dispatch<React.SetStateAction<ManagedTemplateData>>;
    categoryOrder: string[];
    setCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
    onTemplatesUpdated?: () => void;
    dashboardData: DashboardOverview | null;
    isDashboardLoading: boolean;
    onRefreshDashboard?: () => void | Promise<void>;
}

// --- Sub-Components ---

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtitle?: string; isLoading?: boolean }> = ({ title, value, icon, subtitle, isLoading = false }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            {icon}
        </div>
        <div className="flex-1">
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            {isLoading ? (
                <div className="mt-2 h-7 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
                <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            )}
            {subtitle && !isLoading && (
                <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
        </div>
    </div>
);

const Dashboard: React.FC<{
    users: User[];
    generationHistory: GenerationBatch[];
    totalDesignsGenerated: number;
    data: DashboardOverview | null;
    isLoading: boolean;
    onRefresh?: () => void | Promise<void>;
}> = ({ users, generationHistory, totalDesignsGenerated, data, isLoading, onRefresh }) => {

    const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
    const percentageFormatter = useMemo(() => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }), []);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }), []);

    const membershipRows = useMemo(() => {
        if (data?.membershipDistribution && data.membershipDistribution.length > 0) {
            return data.membershipDistribution;
        }
        if (users.length === 0) return [];

        const map = new Map<string, { tier: string; userCount: number; totalCredits: number }>();
        users.forEach(user => {
            const tier = user.membershipTier || 'free';
            const entry = map.get(tier) || { tier, userCount: 0, totalCredits: 0 };
            entry.userCount += 1;
            entry.totalCredits += user.credits;
            map.set(tier, entry);
        });

        return Array.from(map.values())
            .map(entry => ({
                ...entry,
                percentage: users.length > 0 ? Number(((entry.userCount / users.length) * 100).toFixed(1)) : 0,
            }))
            .sort((a, b) => b.userCount - a.userCount);
    }, [data?.membershipDistribution, users]);

    const metrics = data?.metrics;
    const totalUsersValue = metrics?.totalUsers ?? users.length;
    const newUsersValue = metrics?.newUsersThisWeek ?? 0;
    const totalGenerationsValue = metrics?.totalGenerations ?? totalDesignsGenerated;
    const averageGenerationsValue = metrics?.averageGenerationsPerUser ?? (users.length > 0 ? Number((totalGenerationsValue / users.length).toFixed(2)) : 0);
    const activeSubscriptionsValue = metrics?.activeSubscriptions ?? users.filter(u => u.permissionLevel > 1).length;
    const monthlyRevenueValue = metrics?.monthlyRecurringRevenue ?? (activeSubscriptionsValue * 39);

    const fallbackRemaining = users.reduce((acc, user) => acc + user.credits, 0);
    const credits = data?.credit ?? {
        totalPurchased: totalGenerationsValue + fallbackRemaining,
        totalRemaining: fallbackRemaining,
        totalConsumed: totalGenerationsValue,
    };

    const templateDistribution = data?.templateDistribution ?? [];
    const categoryDistribution = data?.categoryDistribution ?? [];
    const topTemplates = templateDistribution.slice(0, 10);
    const topCategories = categoryDistribution.slice(0, 10);

    const lastUpdated = data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : null;

    const recentActivities: RecentActivity[] = useMemo(() => {
        const userActivities: RecentActivity[] = [...users]
            .sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime())
            .slice(0, 3)
            .map(user => ({
                id: `user-${user.id}`,
                type: 'new_user' as const,
                timestamp: new Date(user.joined),
                details: `${user.email} joined.`,
            }));

        const designActivities: RecentActivity[] = generationHistory
            .slice(0, 3)
            .map(batch => ({
                id: `design-${batch.id}`,
                type: 'new_design' as const,
                timestamp: new Date(batch.timestamp),
                details: `New '${batch.type}' generation created.`,
            }));

        return [...userActivities, ...designActivities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 6);
    }, [users, generationHistory]);

    const formatDate = (value: string | null) => {
        if (!value) return '—';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '—';
        return parsed.toLocaleString();
    };

    const formatTier = (tier: string) => {
        return tier
            .replace(/_/g, ' ')
            .split(' ')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const renderSkeletonRows = (columns: number) => (
        <tbody className="divide-y divide-slate-200">
            {Array.from({ length: 4 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                    {Array.from({ length: columns }).map((__, colIndex) => (
                        <td key={colIndex} className="py-3 px-3">
                            <div className="h-4 w-full rounded bg-slate-200" />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Analytics Overview</h2>
                    <p className="text-sm text-slate-500">Monitor growth, usage, and credit health for Mynook AI.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">Last updated: {lastUpdated || '—'}</span>
                    {onRefresh && (
                        <Button primary onClick={() => onRefresh?.()} disabled={isLoading} className="text-sm px-4 py-2">
                            {isLoading ? '刷新中...' : '刷新数据'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={numberFormatter.format(totalUsersValue)}
                    subtitle={`+${numberFormatter.format(newUsersValue)} new this week`}
                    icon={<IconUsers className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
                <StatCard
                    title="Total Generations"
                    value={numberFormatter.format(totalGenerationsValue)}
                    subtitle={`Avg ${averageGenerationsValue} per user`}
                    icon={<IconSparkles className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
                <StatCard
                    title="Active Subscriptions"
                    value={numberFormatter.format(activeSubscriptionsValue)}
                    subtitle={activeSubscriptionsValue > 0 ? `${percentageFormatter.format((activeSubscriptionsValue / Math.max(totalUsersValue, 1)) * 100)}% of users` : 'No paid members'}
                    icon={<IconUserCircle className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
                <StatCard
                    title="Monthly Recurring Revenue"
                    value={currencyFormatter.format(monthlyRevenueValue)}
                    subtitle="Normalized for yearly plans"
                    icon={<span className="text-2xl font-bold">$</span>}
                    isLoading={isLoading && !data}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Credits Purchased"
                    value={numberFormatter.format(credits.totalPurchased)}
                    subtitle="Lifetime (consumed + remaining)"
                    icon={<IconTag className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
                <StatCard
                    title="Credits Consumed"
                    value={numberFormatter.format(credits.totalConsumed)}
                    subtitle="Tied to total generations"
                    icon={<IconPhoto className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
                <StatCard
                    title="Credits Remaining"
                    value={numberFormatter.format(credits.totalRemaining)}
                    subtitle="Current balance across all users"
                    icon={<IconSparkles className="w-6 h-6" />}
                    isLoading={isLoading && !data}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Membership Breakdown</h3>
                            <p className="text-sm text-slate-500">Active users by tier and available credits</p>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Users</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Share</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Credits</th>
                                </tr>
                            </thead>
                            {isLoading && !data ? (
                                renderSkeletonRows(4)
                            ) : membershipRows.length > 0 ? (
                                <tbody className="divide-y divide-slate-200">
                                    {membershipRows.map(row => (
                                        <tr key={row.tier}>
                                            <td className="px-3 py-3 text-sm font-medium text-slate-700">{formatTier(row.tier)}</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{numberFormatter.format(row.userCount)}</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{percentageFormatter.format(row.percentage)}%</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{numberFormatter.format(row.totalCredits)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                                            {isLoading ? 'Loading membership data...' : 'No membership data available yet.'}
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                        <span className="text-xs text-slate-400">Last 6 events</span>
                    </div>
                    <div className="mt-4 space-y-4">
                        {recentActivities.length > 0 ? (
                            recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-start gap-4 p-3 -mx-3 rounded-lg hover:bg-slate-50">
                                    <div className={`p-2 rounded-full ${activity.type === 'new_user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {activity.type === 'new_user' ? <IconUserCircle className="w-5 h-5" /> : <IconPhoto className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{activity.details}</p>
                                        <p className="text-xs text-slate-500">{activity.timestamp.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No recent activity to show.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Top Templates by Usage</h3>
                            <p className="text-sm text-slate-500">Based on template_usage_stats (top 10)</p>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Template</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usage</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Used</th>
                                </tr>
                            </thead>
                            {isLoading && !data ? (
                                renderSkeletonRows(4)
                            ) : topTemplates.length > 0 ? (
                                <tbody className="divide-y divide-slate-200">
                                    {topTemplates.map(template => (
                                        <tr key={template.templateId}>
                                            <td className="px-3 py-3 text-sm font-medium text-slate-700">{template.templateName}</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">
                                                <div className="flex flex-col">
                                                    <span>{template.mainCategory}</span>
                                                    <span className="text-xs text-slate-400">{template.subCategory}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{numberFormatter.format(template.usageCount)}</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{formatDate(template.lastUsedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                                            {isLoading ? 'Loading template usage...' : 'No template usage data captured yet.'}
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Category Performance</h3>
                            <p className="text-sm text-slate-500">Aggregated usage by main & sub category</p>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usage</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Used</th>
                                </tr>
                            </thead>
                            {isLoading && !data ? (
                                renderSkeletonRows(3)
                            ) : topCategories.length > 0 ? (
                                <tbody className="divide-y divide-slate-200">
                                    {topCategories.map(category => (
                                        <tr key={`${category.mainCategory}-${category.subCategory}`}>
                                            <td className="px-3 py-3 text-sm font-medium text-slate-700">
                                                <div className="flex flex-col">
                                                    <span>{category.mainCategory}</span>
                                                    <span className="text-xs text-slate-400">{category.subCategory}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{numberFormatter.format(category.usageCount)}</td>
                                            <td className="px-3 py-3 text-sm text-slate-500">{formatDate(category.lastUsedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">
                                            {isLoading ? 'Loading category usage...' : 'No category usage data captured yet.'}
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserManagement: React.FC<{
    users: User[];
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
}> = ({ users, onUpdateUser, onDeleteUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (updatedUser: User) => {
        onUpdateUser(updatedUser.id, updatedUser);
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">User Management</h3>
                <div className="mt-4 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Plan</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Joined</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{user.email}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{PERMISSION_MAP[user.permissionLevel]}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(user.joined).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">
                                                    Edit<span className="sr-only">, {user.email}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <UserModal
                isOpen={isUserModalOpen}
                user={editingUser}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                onDelete={onDeleteUser}
            />
        </>
    );
};

const DesignManagement: React.FC<{
    generationHistory: GenerationBatch[];
    onDeleteBatch: (batchId: string) => void;
}> = ({ generationHistory, onDeleteBatch }) => {
    const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

    const summary = useMemo(() => {
        if (!generationHistory || generationHistory.length === 0) {
            return {
                totalBatches: 0,
                totalImages: 0,
                uniqueUsers: 0,
                uniqueTemplates: 0,
                lastGeneratedAt: null as string | null,
            };
        }

        let totalImages = 0;
        const uniqueUsers = new Set<string>();
        const uniqueTemplates = new Set<string>();
        let lastGenerated: Date | null = null;

        generationHistory.forEach(batch => {
            const timestamp = batch.timestamp instanceof Date ? batch.timestamp : new Date(batch.timestamp);
            if (!Number.isNaN(timestamp.getTime())) {
                if (!lastGenerated || timestamp > lastGenerated) {
                    lastGenerated = timestamp;
                }
            }

            totalImages += batch.results?.length || 0;

            if (batch.userId) {
                uniqueUsers.add(batch.userId);
            }

            batch.templateIds?.forEach(id => {
                if (id) {
                    uniqueTemplates.add(id);
                }
            });

            batch.results?.forEach(result => {
                if (result.templateId) {
                    uniqueTemplates.add(result.templateId);
                }
            });
        });

        return {
            totalBatches: generationHistory.length,
            totalImages,
            uniqueUsers: uniqueUsers.size,
            uniqueTemplates: uniqueTemplates.size,
            lastGeneratedAt: lastGenerated ? lastGenerated.toLocaleString() : null,
        };
    }, [generationHistory]);

    const typeStats = useMemo(() => {
        const map = new Map<string, { type: string; batchCount: number; totalResults: number; lastGenerated: Date | null }>();

        generationHistory.forEach(batch => {
            const type = batch.type || 'unknown';
            const entry = map.get(type) || { type, batchCount: 0, totalResults: 0, lastGenerated: null };

            entry.batchCount += 1;
            entry.totalResults += batch.results?.length || 0;

            const timestamp = batch.timestamp instanceof Date ? batch.timestamp : new Date(batch.timestamp);
            if (!Number.isNaN(timestamp.getTime())) {
                if (!entry.lastGenerated || timestamp > entry.lastGenerated) {
                    entry.lastGenerated = timestamp;
                }
            }

            map.set(type, entry);
        });

        return Array.from(map.values()).sort((a, b) => b.totalResults - a.totalResults || b.batchCount - a.batchCount);
    }, [generationHistory]);

    const templateStats = useMemo(() => {
        const map = new Map<string, {
            templateId: string;
            templateName?: string;
            category?: string;
            usageCount: number;
            batchCount: number;
            lastGenerated: Date | null;
        }>();

        generationHistory.forEach(batch => {
            const timestamp = batch.timestamp instanceof Date ? batch.timestamp : new Date(batch.timestamp);
            const templateIds = new Set<string>();

            batch.templateIds?.forEach(id => {
                if (id) {
                    templateIds.add(id);
                }
            });

            batch.results?.forEach(result => {
                if (result.templateId) {
                    templateIds.add(result.templateId);
                    const entry = map.get(result.templateId) || {
                        templateId: result.templateId,
                        usageCount: 0,
                        batchCount: 0,
                        lastGenerated: null,
                    };

                    entry.usageCount += 1;
                    if (result.templateName) {
                        entry.templateName = result.templateName;
                    }
                    if (result.templateCategory) {
                        entry.category = result.templateCategory;
                    }
                    if (!Number.isNaN(timestamp.getTime())) {
                        if (!entry.lastGenerated || timestamp > entry.lastGenerated) {
                            entry.lastGenerated = timestamp;
                        }
                    }

                    map.set(result.templateId, entry);
                }
            });

            templateIds.forEach(id => {
                const entry = map.get(id) || {
                    templateId: id,
                    usageCount: 0,
                    batchCount: 0,
                    lastGenerated: null,
                };

                entry.batchCount += 1;
                if (!Number.isNaN(timestamp.getTime())) {
                    if (!entry.lastGenerated || timestamp > entry.lastGenerated) {
                        entry.lastGenerated = timestamp;
                    }
                }

                map.set(id, entry);
            });
        });

        return Array.from(map.values())
            .sort((a, b) => b.usageCount - a.usageCount || b.batchCount - a.batchCount)
            .slice(0, 10);
    }, [generationHistory]);

    const userStats = useMemo(() => {
        const map = new Map<string, { userId: string; batchCount: number; totalResults: number; lastGenerated: Date | null }>();

        generationHistory.forEach(batch => {
            if (!batch.userId) {
                return;
            }

            const entry = map.get(batch.userId) || { userId: batch.userId, batchCount: 0, totalResults: 0, lastGenerated: null };

            entry.batchCount += 1;
            entry.totalResults += batch.results?.length || 0;

            const timestamp = batch.timestamp instanceof Date ? batch.timestamp : new Date(batch.timestamp);
            if (!Number.isNaN(timestamp.getTime())) {
                if (!entry.lastGenerated || timestamp > entry.lastGenerated) {
                    entry.lastGenerated = timestamp;
                }
            }

            map.set(batch.userId, entry);
        });

        return Array.from(map.values())
            .sort((a, b) => b.totalResults - a.totalResults || b.batchCount - a.batchCount)
            .slice(0, 10);
    }, [generationHistory]);

    const recentBatches = useMemo(() => {
        return [...generationHistory]
            .sort((a, b) => {
                const aTime = (a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp)).getTime();
                const bTime = (b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp)).getTime();
                return bTime - aTime;
            })
            .slice(0, 10);
    }, [generationHistory]);

    const formatDateTime = (value: Date | string | null | undefined) => {
        if (!value) return '—';
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) return '—';
        return parsed.toLocaleString();
    };

    const formatGenerationType = (type: GenerationBatch['type']) => {
        if (!type) return 'Unknown';
        return type
            .split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">Design History</h3>
                <p className="text-sm text-slate-500">统计用户生成设计的总体情况，聚焦于数据指标而非图片预览。</p>
                <span className="text-xs text-slate-400">最后一次生成时间：{summary.lastGeneratedAt || '—'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total Batches"
                    value={numberFormatter.format(summary.totalBatches)}
                    subtitle="记录的生成任务总数"
                    icon={<IconLayoutDashboard className="w-6 h-6" />}
                />
                <StatCard
                    title="Images Generated"
                    value={numberFormatter.format(summary.totalImages)}
                    subtitle="累计输出图片数量"
                    icon={<IconPhoto className="w-6 h-6" />}
                />
                <StatCard
                    title="Active Creators"
                    value={numberFormatter.format(summary.uniqueUsers)}
                    subtitle="参与生成的唯一用户"
                    icon={<IconUsers className="w-6 h-6" />}
                />
                <StatCard
                    title="Templates Used"
                    value={numberFormatter.format(summary.uniqueTemplates)}
                    subtitle="覆盖的模板数量"
                    icon={<IconSparkles className="w-6 h-6" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-slate-700">Generation Type 分布</h4>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2 pr-3 font-medium">类型</th>
                                    <th className="py-2 px-3 font-medium">批次数</th>
                                    <th className="py-2 px-3 font-medium">图片数</th>
                                    <th className="py-2 px-3 font-medium">最近生成</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {typeStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-slate-400">暂无生成数据</td>
                                    </tr>
                                ) : (
                                    typeStats.map(stat => (
                                        <tr key={stat.type}>
                                            <td className="py-3 pr-3 text-slate-700 font-medium">{formatGenerationType(stat.type as GenerationBatch['type'])}</td>
                                            <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.batchCount)}</td>
                                            <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.totalResults)}</td>
                                            <td className="py-3 px-3 text-slate-400">{formatDateTime(stat.lastGenerated)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-700">模板使用 Top 10</h4>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2 pr-3 font-medium">模板</th>
                                    <th className="py-2 px-3 font-medium">批次数</th>
                                    <th className="py-2 px-3 font-medium">图片数</th>
                                    <th className="py-2 px-3 font-medium">最近生成</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {templateStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-slate-400">暂无模板使用记录</td>
                                    </tr>
                                ) : (
                                    templateStats.map(stat => (
                                        <tr key={stat.templateId}>
                                            <td className="py-3 pr-3">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-medium">{stat.templateName || stat.templateId}</span>
                                                    {stat.category && <span className="text-xs text-slate-400">{stat.category}</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.batchCount)}</td>
                                            <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.usageCount)}</td>
                                            <td className="py-3 px-3 text-slate-400">{formatDateTime(stat.lastGenerated)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-700">高频用户 Top 10</h4>
                <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2 pr-3 font-medium">用户 ID</th>
                                <th className="py-2 px-3 font-medium">批次数</th>
                                <th className="py-2 px-3 font-medium">图片数</th>
                                <th className="py-2 px-3 font-medium">最近生成</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {userStats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-slate-400">暂无用户生成记录</td>
                                </tr>
                            ) : (
                                userStats.map(stat => (
                                    <tr key={stat.userId}>
                                        <td className="py-3 pr-3 text-slate-700 font-medium">{stat.userId}</td>
                                        <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.batchCount)}</td>
                                        <td className="py-3 px-3 text-slate-500">{numberFormatter.format(stat.totalResults)}</td>
                                        <td className="py-3 px-3 text-slate-400">{formatDateTime(stat.lastGenerated)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-700">最近的生成任务</h4>
                <div className="mt-3 overflow-hidden border border-slate-200 rounded-xl">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="py-3 pl-4 pr-3 text-left font-medium">类型</th>
                                <th className="py-3 px-3 text-left font-medium">提示词</th>
                                <th className="py-3 px-3 text-left font-medium">生成时间</th>
                                <th className="py-3 px-3 text-left font-medium">结果数</th>
                                <th className="py-3 pr-4 text-right font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {recentBatches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-400">暂无生成记录</td>
                                </tr>
                            ) : (
                                recentBatches.map(batch => (
                                    <tr key={batch.id}>
                                        <td className="py-3 pl-4 pr-3 font-medium text-slate-700">{formatGenerationType(batch.type)}</td>
                                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={batch.prompt}>{batch.prompt}</td>
                                        <td className="py-3 px-3 text-slate-500">{formatDateTime(batch.timestamp)}</td>
                                        <td className="py-3 px-3 text-slate-500">{numberFormatter.format(batch.results?.length || 0)}</td>
                                        <td className="py-3 pr-4 text-right">
                                            <Button onClick={() => onDeleteBatch(batch.id)} className="!px-3 !py-1.5 text-sm !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200">
                                                <IconTrash className="w-4 h-4" /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Sort Controls Component ---
const SortControls: React.FC<{
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ onMoveUp, onMoveDown, onMoveToTop, onMoveToBottom, isFirst, isLast }) => {
    return (
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
                onClick={onMoveToTop}
                disabled={isFirst}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="移到最前"
            >
                <IconMoveToTop className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="上移"
            >
                <IconMoveUp className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="下移"
            >
                <IconMoveDown className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveToBottom}
                disabled={isLast}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="移到最后"
            >
                <IconMoveToBottom className="w-3.5 h-3.5 text-slate-600" />
            </button>
        </div>
    );
};

const TemplateManagement: React.FC<{
    templateData: ManagedTemplateData;
    setTemplateData: React.Dispatch<React.SetStateAction<ManagedTemplateData>>;
    categoryOrder: string[];
    setCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
    onTemplatesUpdated?: () => void;
}> = ({ templateData, setTemplateData, categoryOrder, setCategoryOrder, onTemplatesUpdated }) => {
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<{ main: string, sub: string } | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryModalType, setCategoryModalType] = useState<'main' | 'sub' | 'room'>('main');
    const [categoryModalContext, setCategoryModalContext] = useState<{ mainCategory?: string } | null>(null);
    
    // 从 localStorage 读取折叠状态（持久化用户的展开/折叠选择）
    const [collapsedMainCategories, setCollapsedMainCategories] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('admin-collapsed-main-categories');
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load collapsed state from localStorage:', error);
        }
        // 默认折叠所有主分类
        return new Set(categoryOrder);
    });
    
    const [collapsedSubCategories, setCollapsedSubCategories] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('admin-collapsed-sub-categories');
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load collapsed state from localStorage:', error);
        }
        return new Set();
    });
    
    const [isSorting, setIsSorting] = useState(false);
    const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
    const [isBatchImageMatcherOpen, setIsBatchImageMatcherOpen] = useState(false);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
    // Smart Merge 相关状态
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [currentMergeCategory, setCurrentMergeCategory] = useState<string>('');
    const [mergeSuggestions, setMergeSuggestions] = useState<SimilarCategoryGroup[]>([]);
    const [selectedMerges, setSelectedMerges] = useState<Set<number>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    // 保存主分类折叠状态到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('admin-collapsed-main-categories', 
                JSON.stringify(Array.from(collapsedMainCategories)));
        } catch (error) {
            console.error('Failed to save collapsed state to localStorage:', error);
        }
    }, [collapsedMainCategories]);
    
    // 保存子分类折叠状态到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('admin-collapsed-sub-categories', 
                JSON.stringify(Array.from(collapsedSubCategories)));
        } catch (error) {
            console.error('Failed to save collapsed state to localStorage:', error);
        }
    }, [collapsedSubCategories]);
    
    // 当新增分类时，默认折叠新分类（仅针对新出现的分类）
    useEffect(() => {
        const currentCategories = new Set(categoryOrder);
        const savedCategories = collapsedMainCategories;
        
        // 只折叠新出现的分类，不影响已存在的分类状态
        const newCategories = categoryOrder.filter(cat => 
            currentCategories.has(cat) && !Array.from(savedCategories).includes(cat)
        );
        
        if (newCategories.length > 0) {
            setCollapsedMainCategories(prev => {
                const updated = new Set(prev);
                newCategories.forEach(cat => updated.add(cat));
                return updated;
            });
        }
    }, [categoryOrder]);

    const handleEditTemplate = (template: PromptTemplate, mainCategory: string, subCategory: string) => {
        setEditingTemplate(template);
        setTargetCategory({ main: mainCategory, sub: subCategory });
        setIsTemplateModalOpen(true);
    };

    const handleAddTemplate = (mainCategory: string, subCategory: string) => {
        const newTemplate: PromptTemplate = {
            id: `template_${Date.now()}`,
            name: 'New Template',
            imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder.png',
            prompt: 'A new design prompt.',
        };
        setEditingTemplate(newTemplate);
        setTargetCategory({ main: mainCategory, sub: subCategory });
        setIsTemplateModalOpen(true);
    };

    const handleSaveTemplate = async (updatedTemplate: PromptTemplate) => {
        if (!targetCategory) return;
        
        try {
            const templateId = typeof updatedTemplate.id === 'string'
                ? updatedTemplate.id
                : String(updatedTemplate.id);
            const isNewTemplate = templateId.startsWith('template_');
            
            // 对于 Interior Design，targetCategory.sub 实际上是 room_type
            // 需要正确映射到数据库字段
            const isInteriorDesign = targetCategory.main === 'Interior Design';
            const templateData = {
                name: updatedTemplate.name,
                image_url: updatedTemplate.imageUrl,
                prompt: updatedTemplate.prompt,
                main_category: targetCategory.main,
                sub_category: isInteriorDesign ? 'Modern Minimalist' : targetCategory.sub, // Interior Design 使用默认风格
                room_type: isInteriorDesign ? targetCategory.sub : null, // Interior Design 设置 room_type
                enabled: true,
                sort_order: 0
            };
            
            if (isNewTemplate) {
                // Create new template in database
                await createTemplate(templateData);
            } else {
                // Update existing template in database
                await updateTemplate(templateId, {
                    name: templateData.name,
                    image_url: templateData.image_url,
                    prompt: templateData.prompt,
                    main_category: templateData.main_category,
                    sub_category: templateData.sub_category,
                    room_type: templateData.room_type
                });
            }
            
            // 重新从数据库加载所有模板（Admin Panel用）
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            setIsTemplateModalOpen(false);
            toast.success('Template saved successfully! ✨');
            
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Failed to save template. Please try again.');
        }
    };

    const handleDeleteTemplate = async (templateId: string, mainCategory: string, subCategoryName: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        // 备份当前数据，用于失败时恢复
        const backupData = { ...templateData };
        
        // 乐观更新：立即从 UI 移除
        const optimisticData = { ...templateData };
        if (optimisticData[mainCategory]) {
            const subCategoryIndex = optimisticData[mainCategory].findIndex(
                (sub: any) => sub.name === subCategoryName
            );
            if (subCategoryIndex !== -1) {
                const updatedTemplates = optimisticData[mainCategory][subCategoryIndex].templates.filter(
                    (t: any) => t.id !== templateId
                );
                optimisticData[mainCategory][subCategoryIndex].templates = updatedTemplates;
            }
        }
        setTemplateData(optimisticData);
        
        // 使用 toast.promise 显示异步操作状态
        const deletePromise = deleteTemplateFromDB(templateId)
            .then(async () => {
                // ✅ 删除成功，只在后台通知前端刷新（不影响 Admin Panel 的折叠状态）
                if (onTemplatesUpdated) {
                    await onTemplatesUpdated();
                }
                // ✅ Admin Panel 已经通过乐观更新完成了 UI 变化，不需要重新加载
            })
            .catch((error) => {
                // 恢复备份数据
                setTemplateData(backupData);
                console.error('Failed to delete template:', error);
                throw error;
            });
        
        toast.promise(deletePromise, {
            loading: 'Deleting template...',
            success: 'Template deleted successfully! ✨',
            error: 'Failed to delete template. Please try again.',
        });
    };

    const toggleMainCategory = async (mainCategory: string) => {
        // 获取当前所有子分类的状态，如果至少有一个是启用的，则全部禁用；否则全部启用
        const currentData = templateData[mainCategory];
        if (!currentData || currentData.length === 0) return;
        
        const hasAnyEnabled = currentData.some((sc: ManagedPromptTemplateCategory) => sc.enabled);
        const newEnabledState = !hasAnyEnabled;
        
        try {
            // 同步到数据库
            await toggleMainCategoryEnabled(mainCategory, newEnabledState);
            
            // 更新本地状态 - 更新所有子分类
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                if (newData[mainCategory]) {
                    newData[mainCategory].forEach((sc: ManagedPromptTemplateCategory) => {
                        sc.enabled = newEnabledState;
                    });
                }
                return newData;
            });
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            console.log(`✅ Main category ${mainCategory} toggled to ${newEnabledState}`);
        } catch (error) {
            console.error('Failed to toggle main category:', error);
            toast.error('Failed to update main category status. Please try again.');
        }
    };

    const handleAddMainCategory = () => {
        setCategoryModalType('main');
        setCategoryModalContext(null);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteMainCategory = async (mainCategory: string) => {
        if (!confirm(`Are you sure you want to delete the entire "${mainCategory}" category? This will delete ALL templates under it.`)) return;
        
        // 备份当前数据
        const backupData = { ...templateData };
        const backupOrder = [...categoryOrder];
        
        // 乐观更新：立即从 UI 移除
        const optimisticData = { ...templateData };
        delete optimisticData[mainCategory];
        setTemplateData(optimisticData);
        setCategoryOrder(Object.keys(optimisticData));
        
        // 同时从折叠状态中移除该分类
        setCollapsedMainCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(mainCategory);
            return newSet;
        });
        
        const deletePromise = deleteMainCategoryFromDB(mainCategory)
            .then(async () => {
                // ✅ 删除成功，只在后台通知前端刷新
                if (onTemplatesUpdated) {
                    await onTemplatesUpdated();
                }
                // ✅ Admin Panel 已经通过乐观更新完成，不需要重新加载
            })
            .catch((error) => {
                // 恢复备份数据
                setTemplateData(backupData);
                setCategoryOrder(backupOrder);
                console.error('Failed to delete main category:', error);
                throw error;
            });
        
        toast.promise(deletePromise, {
            loading: `Deleting "${mainCategory}"...`,
            success: `Successfully deleted "${mainCategory}"! ✨`,
            error: 'Failed to delete category. Please try again.',
        });
    };

    const handleAddSubCategory = (mainCategory: string) => {
        const type = mainCategory === 'Interior Design' ? 'room' : 'sub';
        setCategoryModalType(type);
        setCategoryModalContext({ mainCategory });
        setIsCategoryModalOpen(true);
    };

    const handleDeleteSubCategory = async (mainCategory: string, subCategoryName: string) => {
        if (!confirm(`Are you sure you want to delete "${subCategoryName}"? This will delete ALL templates under it.`)) return;
        
        // 备份当前数据
        const backupData = { ...templateData };
        
        // 乐观更新：立即从 UI 移除
        const optimisticData = { ...templateData };
        if (optimisticData[mainCategory]) {
            optimisticData[mainCategory] = optimisticData[mainCategory].filter(
                (sub: any) => sub.name !== subCategoryName
            );
        }
        setTemplateData(optimisticData);
        
        // 同时从折叠状态中移除该子分类
        const subKey = `${mainCategory}::${subCategoryName}`;
        setCollapsedSubCategories(prev => {
            const newSet = new Set(prev);
            newSet.delete(subKey);
            return newSet;
        });
        
        const deletePromise = deleteSubCategoryFromDB(mainCategory, subCategoryName)
            .then(async () => {
                // ✅ 删除成功，只在后台通知前端刷新
                if (onTemplatesUpdated) {
                    await onTemplatesUpdated();
                }
                // ✅ Admin Panel 已经通过乐观更新完成，不需要重新加载
            })
            .catch((error) => {
                // 恢复备份数据
                setTemplateData(backupData);
                console.error('Failed to delete sub category:', error);
                throw error;
            });
        
        toast.promise(deletePromise, {
            loading: `Deleting "${subCategoryName}"...`,
            success: `Successfully deleted "${subCategoryName}"! ✨`,
            error: 'Failed to delete category. Please try again.',
        });
    };

    const toggleSubCategory = async (mainCategory: string, subCategoryName: string) => {
        // 先获取当前状态
        const currentData = templateData[mainCategory];
        const subCategory = currentData?.find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
        if (!subCategory) return;
        
        const newEnabledState = !subCategory.enabled;
        
        try {
            // 同步到数据库
            await toggleCategoryEnabled(mainCategory, subCategoryName, newEnabledState);
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const subCat = newData[mainCategory].find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
                if (subCat) {
                    subCat.enabled = newEnabledState;
                }
                return newData;
            });
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            console.log(`✅ Category ${mainCategory} > ${subCategoryName} toggled to ${newEnabledState}`);
        } catch (error) {
            console.error('Failed to toggle category:', error);
            toast.error('Failed to update category status. Please try again.');
        }
    };

    const toggleMainCategoryCollapse = (mainCategory: string) => {
        setCollapsedMainCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mainCategory)) {
                newSet.delete(mainCategory);
            } else {
                newSet.add(mainCategory);
            }
            return newSet;
        });
    };

    const toggleSubCategoryCollapse = (mainCategory: string, subCategoryName: string) => {
        const key = `${mainCategory}::${subCategoryName}`;
        setCollapsedSubCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    // 排序处理函数
    const handleSortMainCategory = async (category: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const currentIndex = categoryOrder.indexOf(category);
            const newOrder = [...categoryOrder];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(category);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(category);
                    break;
            }
            
            setCategoryOrder(newOrder);
            await reorderMainCategories(newOrder);
            
            // ✅ 排序操作不需要完整刷新 - 本地state已更新，避免触发重新渲染导致折叠
            // 只在前端静默更新公开模板的顺序即可
            console.log('✅ Main category sorted successfully');
        } catch (error) {
            console.error('Failed to sort main category:', error);
            toast.error('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    const handleSortSubCategory = async (mainCategory: string, subCategory: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const subCategories = templateData[mainCategory] || [];
            const subCategoryNames = subCategories.map((sc: ManagedPromptTemplateCategory) => sc.name);
            const currentIndex = subCategoryNames.indexOf(subCategory);
            const newOrder = [...subCategoryNames];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(subCategory);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(subCategory);
                    break;
            }
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = { ...prevData };
                const reorderedSubCategories = newOrder.map(name => 
                    subCategories.find((sc: ManagedPromptTemplateCategory) => sc.name === name)
                ).filter(Boolean);
                newData[mainCategory] = reorderedSubCategories;
                return newData;
            });
            
            await reorderSubCategories(mainCategory, newOrder);
            
            // ✅ 排序操作不需要完整刷新 - 本地state已更新，避免触发重新渲染导致折叠
            console.log('✅ Sub category sorted successfully');
        } catch (error) {
            console.error('Failed to sort sub category:', error);
            toast.error('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    const handleSortTemplate = async (mainCategory: string, subCategory: string, templateId: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const subCategories = templateData[mainCategory] || [];
            const subCat = subCategories.find((sc: ManagedPromptTemplateCategory) => sc.name === subCategory);
            if (!subCat) return;
            
            const templates = subCat.templates;
            const templateIds = templates.map(t => t.id);
            const currentIndex = templateIds.indexOf(templateId);
            const newOrder = [...templateIds];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(templateId);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(templateId);
                    break;
            }
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const subCat = newData[mainCategory].find((sc: ManagedPromptTemplateCategory) => sc.name === subCategory);
                if (subCat) {
                    subCat.templates = newOrder.map(id => 
                        templates.find(t => t.id === id)
                    ).filter(Boolean);
                }
                return newData;
            });
            
            await reorderTemplates(newOrder);
            
            // ✅ 排序操作不需要完整刷新 - 本地state已更新，避免触发重新渲染导致折叠
            console.log('✅ Template sorted successfully');
        } catch (error) {
            console.error('Failed to sort template:', error);
            toast.error('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    // 模板多选功能
    const toggleTemplateSelection = (templateId: string) => {
        setSelectedTemplateIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(templateId)) {
                newSet.delete(templateId);
            } else {
                newSet.add(templateId);
            }
            return newSet;
        });
    };

    const selectAllInSubCategory = (mainCategory: string, subCategoryName: string) => {
        const subCategories = templateData[mainCategory] || [];
        const subCategory = subCategories.find((sc: ManagedPromptTemplateCategory) => sc.name === subCategoryName);
        if (!subCategory) return;

        const templateIds = subCategory.templates.map(t => t.id);
        setSelectedTemplateIds(prev => {
            const newSet = new Set(prev);
            const allSelected = templateIds.every(id => newSet.has(id));
            
            if (allSelected) {
                // 取消全选
                templateIds.forEach(id => newSet.delete(id));
            } else {
                // 全选
                templateIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleBatchDelete = () => {
        if (selectedTemplateIds.size === 0) return;
        setIsDeleteConfirmOpen(true);
    };

    const confirmBatchDelete = async () => {
        if (selectedTemplateIds.size === 0) return;

        const templateIdsArray = Array.from(selectedTemplateIds);
        const count = templateIdsArray.length;
        
        // 备份当前数据
        const backupData = { ...templateData };
        
        // 乐观更新：立即从 UI 移除所有选中的模板
        const optimisticData = { ...templateData };
        Object.keys(optimisticData).forEach(mainCategory => {
            optimisticData[mainCategory] = optimisticData[mainCategory].map((subCategory: any) => ({
                ...subCategory,
                templates: subCategory.templates.filter((t: any) => !selectedTemplateIds.has(t.id))
            }));
        });
        setTemplateData(optimisticData);
        
        // 清空选中状态
        setSelectedTemplateIds(new Set());
        
        // 关闭确认对话框
        setIsDeleteConfirmOpen(false);
        
        const deletePromise = batchDeleteTemplates(templateIdsArray)
            .then(async () => {
                // ✅ 批量删除成功，只在后台通知前端刷新
                if (onTemplatesUpdated) {
                    await onTemplatesUpdated();
                }
                // ✅ Admin Panel 已经通过乐观更新完成，不需要重新加载
            })
            .catch((error) => {
                // 恢复备份数据和选中状态
                setTemplateData(backupData);
                setSelectedTemplateIds(new Set(templateIdsArray));
                console.error('Failed to batch delete templates:', error);
                throw error;
            });
        
        toast.promise(deletePromise, {
            loading: `Deleting ${count} template(s)...`,
            success: `Successfully deleted ${count} template(s)! ✨`,
            error: 'Failed to delete templates. Please try again.',
        });
    };

    // ==================== Smart Merge 功能 ====================
    
    // 分析相似分类
    const handleAnalyzeSimilarCategories = async (mainCategory: string) => {
        setIsAnalyzing(true);
        setCurrentMergeCategory(mainCategory);
        
        try {
            const subCategories = templateData[mainCategory]?.map(sub => ({
                name: sub.name,
                templateCount: sub.templates.length
            })) || [];
            
            console.log('🔍 Analyzing categories for:', mainCategory);
            console.log('Subcategories:', subCategories);
            
            if (subCategories.length < 2) {
                toast.info('Need at least 2 subcategories to analyze');
                setIsAnalyzing(false);
                return;
            }
            
            toast.loading('AI is analyzing categories...', { id: 'analyzing' });
            
            const suggestions = await analyzeSimilarCategories(mainCategory, subCategories);
            
            console.log('✅ AI analysis complete. Suggestions:', suggestions);
            
            toast.dismiss('analyzing');
            
            if (suggestions.length === 0) {
                toast.success('✅ No similar categories found. Your categories are well organized!');
                setIsAnalyzing(false);
                return;
            }
            
            setMergeSuggestions(suggestions);
            setSelectedMerges(new Set(suggestions.map((_, idx) => idx))); // 默认全选
            setIsMergeModalOpen(true);
            toast.success(`Found ${suggestions.length} merge suggestion(s)! 🎯`);
            
        } catch (error) {
            console.error('❌ Failed to analyze categories:', error);
            toast.dismiss('analyzing');
            toast.error(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    // 切换合并选择
    const toggleMergeSelection = (index: number) => {
        setSelectedMerges(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };
    
    // 执行合并
    const handleConfirmMerge = async () => {
        const selectedSuggestions = mergeSuggestions.filter((_, idx) => 
            selectedMerges.has(idx)
        );
        
        if (selectedSuggestions.length === 0) {
            toast.error('Please select at least one merge suggestion');
            return;
        }
        
        setIsMerging(true);
        
        try {
            console.log('🔄 Starting merge process...');
            console.log('Selected suggestions:', selectedSuggestions);
            
            let totalMoved = 0;
            const results = [];
            
            // 判断是 Interior Design 还是其他分类
            const isInteriorDesign = currentMergeCategory === 'Interior Design';
            const fieldToUpdate = isInteriorDesign ? 'room_type' : 'sub_category';
            
            console.log(`📝 Category: ${currentMergeCategory}, Field to update: ${fieldToUpdate}`);
            
            // 逐个处理每组合并
            for (const suggestion of selectedSuggestions) {
                console.log(`\n📦 Merging: ${suggestion.categories.join(', ')} → ${suggestion.suggestedName}`);
                
                // 先查询有多少模板会被影响 - 使用正确的字段
                const { data: existingTemplates, error: countError } = await supabase
                    .from('design_templates')
                    .select(`id, name, ${fieldToUpdate}`)
                    .eq('main_category', currentMergeCategory)
                    .in(fieldToUpdate, suggestion.categories);
                
                if (countError) {
                    console.error('❌ Failed to query templates:', countError);
                }
                
                console.log(`📊 Found ${existingTemplates?.length || 0} templates in categories:`, suggestion.categories);
                if (existingTemplates && existingTemplates.length > 0) {
                    console.log('Templates breakdown:', existingTemplates.map((t: any) => {
                        const fieldValue = isInteriorDesign ? t.room_type : t.sub_category;
                        return `${t.name} (${fieldValue})`;
                    }));
                }
                
                if (!existingTemplates || existingTemplates.length === 0) {
                    console.log('⚠️ No templates found to move. These categories might be empty.');
                    results.push({ success: true, movedCount: 0 });
                    continue;
                }
                
                // 构建更新对象 - 根据分类类型更新正确的字段
                const updateData = isInteriorDesign 
                    ? { room_type: suggestion.suggestedName }
                    : { sub_category: suggestion.suggestedName };
                
                console.log('Update data:', updateData);
                
                // 将所有源分类的模板迁移到目标分类
                const { data: movedTemplates, error: updateError } = await supabase
                    .from('design_templates')
                    .update(updateData)
                    .eq('main_category', currentMergeCategory)
                    .in(fieldToUpdate, suggestion.categories)
                    .select('id');
                
                if (updateError) {
                    console.error('❌ Failed to merge:', updateError);
                    results.push({ success: false, error: updateError.message });
                    continue;
                }
                
                const movedCount = movedTemplates?.length || 0;
                totalMoved += movedCount;
                
                console.log(`✅ Moved ${movedCount} templates to "${suggestion.suggestedName}"`);
                results.push({ success: true, movedCount });
            }
            
            console.log(`\n✅ Merge complete. Total templates moved: ${totalMoved}`);
            
            // 关闭弹窗
            setIsMergeModalOpen(false);
            
            // 刷新数据
            console.log('🔄 Refreshing template data...');
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            console.log('✅ Template data refreshed');
            
            // 通知前端刷新
            if (onTemplatesUpdated) {
                console.log('🔄 Notifying parent to refresh...');
                await onTemplatesUpdated();
            }
            
            if (totalMoved === 0) {
                toast.warning('Merge completed, but no templates were moved. Categories might already be merged or empty.');
            } else {
                toast.success(`Successfully merged ${selectedSuggestions.length} category group(s)! Moved ${totalMoved} templates. ✨`);
            }
            
        } catch (error) {
            console.error('❌ Failed to merge categories:', error);
            toast.error(`Failed to merge categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsMerging(false);
        }
    };
    
    // ==================== End Smart Merge ====================

    // 获取选中模板的详细信息（用于确认对话框）
    const getSelectedTemplatesInfo = () => {
        const selectedInfo: Array<{ id: string; name: string; imageUrl: string; category: string }> = [];
        
        Object.keys(templateData).forEach(mainCategory => {
            const subCategories = templateData[mainCategory] || [];
            subCategories.forEach((subCategory: ManagedPromptTemplateCategory) => {
                subCategory.templates.forEach(template => {
                    if (selectedTemplateIds.has(template.id)) {
                        selectedInfo.push({
                            id: template.id,
                            name: template.name,
                            imageUrl: template.imageUrl,
                            category: `${mainCategory} > ${subCategory.name}`
                        });
                    }
                });
            });
        });
        
        return selectedInfo;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Template Management</h3>
                <div className="flex gap-2">
                    <Button 
                        onClick={handleAddMainCategory}
                        className="!bg-indigo-50 hover:!bg-indigo-100 !text-indigo-600 !border-indigo-200"
                    >
                        <IconPlus className="w-4 h-4 mr-1" />
                        Add Category
                    </Button>
                    <Button 
                        onClick={() => setIsBatchUploadOpen(true)}
                        className="!bg-purple-50 hover:!bg-purple-100 !text-purple-600 !border-purple-200"
                    >
                        <IconUpload className="w-4 h-4 mr-1" />
                        Batch Upload
                    </Button>
                    <Button 
                        onClick={() => setIsBatchImageMatcherOpen(true)}
                        className="!bg-blue-50 hover:!bg-blue-100 !text-blue-600 !border-blue-200"
                    >
                        <IconPhoto className="w-4 h-4 mr-1" />
                        Match Images
                    </Button>
                    {selectedTemplateIds.size > 0 && (
                        <Button 
                            onClick={handleBatchDelete}
                            className="!bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200"
                        >
                            <IconTrash className="w-4 h-4 mr-1" />
                            Delete ({selectedTemplateIds.size})
                        </Button>
                    )}
                </div>
            </div>
            <div className="mt-4 space-y-4">
                {categoryOrder.map(mainCategory => {
                    const subCategories = templateData[mainCategory] || [];
                    
                    // Admin Panel 显示所有分类（包括空分类），除非管理员手动删除
                    // ✅ 允许显示空分类，方便管理员添加模板
                    
                    const hasAnyEnabled = subCategories.some((sc: ManagedPromptTemplateCategory) => sc.enabled);
                    
                    const isMainCollapsed = collapsedMainCategories.has(mainCategory);
                    
                    const mainCategoryIndex = categoryOrder.indexOf(mainCategory);
                    
                    return (
                        <div key={mainCategory} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleMainCategoryCollapse(mainCategory)}
                                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                    title={isMainCollapsed ? "Expand" : "Collapse"}
                                >
                                    <IconChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                                <h4 className="font-semibold text-slate-900">{mainCategory}</h4>
                                <SortControls 
                                    onMoveUp={() => handleSortMainCategory(mainCategory, 'up')}
                                    onMoveDown={() => handleSortMainCategory(mainCategory, 'down')}
                                    onMoveToTop={() => handleSortMainCategory(mainCategory, 'top')}
                                    onMoveToBottom={() => handleSortMainCategory(mainCategory, 'bottom')}
                                    isFirst={mainCategoryIndex === 0}
                                    isLast={mainCategoryIndex === categoryOrder.length - 1}
                                />
                                <button 
                                    onClick={() => handleDeleteMainCategory(mainCategory)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Category"
                                >
                                    <IconTrash className="w-4 h-4" />
                                </button>
                                {/* Smart Merge 按钮 */}
                                <button
                                    onClick={() => handleAnalyzeSimilarCategories(mainCategory)}
                                    disabled={isAnalyzing}
                                    className="ml-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    title="AI-powered category merge suggestions"
                                >
                                    <IconSparkles className="w-3.5 h-3.5" />
                                    {isAnalyzing ? 'Analyzing...' : 'Smart Merge'}
                                </button>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={hasAnyEnabled} 
                                    onChange={() => toggleMainCategory(mainCategory)} 
                                    className="sr-only peer" 
                                />
                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {!isMainCollapsed && (
                        <div className="mt-3 space-y-3">
                            {subCategories.map((subCategory: ManagedPromptTemplateCategory, subIndex: number) => {
                                const subKey = `${mainCategory}::${subCategory.name}`;
                                const isSubCollapsed = collapsedSubCategories.has(subKey);
                                
                                return (
                                <div key={subCategory.name}>
                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleSubCategoryCollapse(mainCategory, subCategory.name)}
                                                className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                                                title={isSubCollapsed ? "Expand" : "Collapse"}
                                            >
                                                <IconChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isSubCollapsed ? '-rotate-90' : ''}`} />
                                            </button>
                                            <h5 className="font-medium text-sm text-slate-700">{subCategory.name}</h5>
                                            <SortControls 
                                                onMoveUp={() => handleSortSubCategory(mainCategory, subCategory.name, 'up')}
                                                onMoveDown={() => handleSortSubCategory(mainCategory, subCategory.name, 'down')}
                                                onMoveToTop={() => handleSortSubCategory(mainCategory, subCategory.name, 'top')}
                                                onMoveToBottom={() => handleSortSubCategory(mainCategory, subCategory.name, 'bottom')}
                                                isFirst={subIndex === 0}
                                                isLast={subIndex === subCategories.length - 1}
                                            />
                                            <button 
                                                onClick={() => handleDeleteSubCategory(mainCategory, subCategory.name)}
                                                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                                                title="Delete Sub-Category"
                                            >
                                                <IconTrash className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={subCategory.enabled} onChange={() => toggleSubCategory(mainCategory, subCategory.name)} className="sr-only peer" />
                                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    {!isSubCollapsed && (
                                    <div className="grid grid-cols-8 gap-2 mt-2">
                                        {subCategory.templates.map((template, templateIndex) => (
                                            <div key={template.id} className="group relative">
                                                {/* 复选框 - 左上角 */}
                                                <div className="absolute top-1 left-1 z-20">
                                                    <label 
                                                        className="flex items-center cursor-pointer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedTemplateIds.has(template.id)}
                                                            onChange={() => toggleTemplateSelection(template.id)}
                                                            className="w-4 h-4 rounded border-2 border-white shadow-lg cursor-pointer accent-indigo-600 bg-white/90"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-[10px] text-center mt-1 text-slate-600 truncate">{template.name}</p>
                                                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex flex-col items-center justify-center h-full gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleEditTemplate(template, mainCategory, subCategory.name)} className="p-1.5 bg-white/80 rounded-full hover:bg-white"><IconPencil className="w-3 h-3" /></button>
                                                            <button onClick={() => handleDeleteTemplate(template.id, mainCategory, subCategory.name)} className="p-1.5 bg-white/80 rounded-full hover:bg-white text-red-500"><IconTrash className="w-3 h-3" /></button>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 bg-white/90 rounded-md p-0.5">
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'top')}
                                                                disabled={templateIndex === 0}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="移到最前"
                                                            >
                                                                <IconMoveToTop className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'up')}
                                                                disabled={templateIndex === 0}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="上移"
                                                            >
                                                                <IconMoveUp className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'down')}
                                                                disabled={templateIndex === subCategory.templates.length - 1}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="下移"
                                                            >
                                                                <IconMoveDown className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'bottom')}
                                                                disabled={templateIndex === subCategory.templates.length - 1}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="移到最后"
                                                            >
                                                                <IconMoveToBottom className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => handleAddTemplate(mainCategory, subCategory.name)} className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                                            <IconPlus className="w-4 h-4" />
                                            <span className="text-[10px] mt-0.5">Add</span>
                                        </button>
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                            <button
                                onClick={() => handleAddSubCategory(mainCategory)}
                                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span className="text-sm font-medium">Add {mainCategory === 'Interior Design' ? 'Room Type' : 'Sub-Category'}</span>
                            </button>
                        </div>
                        )}
                        </div>
                    );
                })}
            </div>
            <TemplateModal
                isOpen={isTemplateModalOpen}
                template={editingTemplate}
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={handleSaveTemplate}
            />
            <CategoryModal
                isOpen={isCategoryModalOpen}
                type={categoryModalType}
                context={categoryModalContext}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={async (categoryName) => {
                    try {
                        if (categoryModalType === 'main') {
                            // 添加新的主分类到数据库
                            await addMainCategoryToDB(categoryName);
                            
                            // 重新加载模板数据以包含新分类
                            const freshTemplates = await getAllTemplates();
                            setTemplateData(freshTemplates);
                            setCategoryOrder(Object.keys(freshTemplates));
                            
                            // 通知父组件刷新前端模板数据
                            if (onTemplatesUpdated) {
                                await onTemplatesUpdated();
                            }
                        } else {
                            // 添加子分类到现有主分类（仅本地状态，等待添加模板时自动创建）
                            const mainCategory = categoryModalContext?.mainCategory;
                            if (mainCategory) {
                                setTemplateData(prev => {
                                    const newData = JSON.parse(JSON.stringify(prev));
                                    if (!newData[mainCategory]) {
                                        newData[mainCategory] = [];
                                    }
                                    // 检查是否已存在
                                    if (!newData[mainCategory].find((sc: ManagedPromptTemplateCategory) => sc.name === categoryName)) {
                                        newData[mainCategory].push({
                                            name: categoryName,
                                            templates: [],
                                            enabled: false
                                        });
                                    }
                                    return newData;
                                });
                            }
                        }
                        
                        setIsCategoryModalOpen(false);
                        toast.success(`"${categoryName}" added! Now you can add templates to it. ✨`);
                    } catch (error) {
                        console.error('Failed to add category:', error);
                        toast.error('Failed to add category. Please try again.');
                    }
                }}
            />
            <BatchTemplateUpload
                isOpen={isBatchUploadOpen}
                onClose={() => setIsBatchUploadOpen(false)}
                onSuccess={async () => {
                    // 刷新模板列表
                    const freshTemplates = await getAllTemplates();
                    setTemplateData(freshTemplates);
                    setCategoryOrder(Object.keys(freshTemplates));
                    
                    // 通知父组件刷新前端模板数据
                    if (onTemplatesUpdated) {
                        await onTemplatesUpdated();
                    }
                }}
            />
            <BatchImageMatcher
                isOpen={isBatchImageMatcherOpen}
                onClose={() => setIsBatchImageMatcherOpen(false)}
                onSuccess={async () => {
                    // 刷新模板列表
                    const freshTemplates = await getAllTemplates();
                    setTemplateData(freshTemplates);
                    setCategoryOrder(Object.keys(freshTemplates));
                    if (onTemplatesUpdated) {
                        await onTemplatesUpdated();
                    }
                }}
            />
            
            {/* 批量删除确认对话框 */}
            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Delete {selectedTemplateIds.size} Template{selectedTemplateIds.size > 1 ? 's' : ''}?
                                    </h3>
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <IconX className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-red-600 font-medium">
                                    ⚠️ This action cannot be undone.
                                </p>
                            </div>
                            
                            <div className="p-6 overflow-y-auto max-h-96">
                                <p className="text-sm text-slate-600 mb-4">
                                    The following templates will be permanently deleted:
                                </p>
                                <div className="space-y-2">
                                    {getSelectedTemplatesInfo().slice(0, 10).map((template) => (
                                        <div 
                                            key={template.id} 
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                                        >
                                            <img 
                                                src={template.imageUrl} 
                                                alt={template.name}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {template.name}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {template.category}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedTemplateIds.size > 10 && (
                                        <p className="text-sm text-slate-500 text-center py-2">
                                            ...and {selectedTemplateIds.size - 10} more
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                                <Button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="!bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-300"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmBatchDelete}
                                    className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600"
                                >
                                    <IconTrash className="w-4 h-4 mr-2" />
                                    Delete {selectedTemplateIds.size} Template{selectedTemplateIds.size > 1 ? 's' : ''}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Smart Merge Modal */}
            <MergeSuggestionsModal
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                mainCategory={currentMergeCategory}
                suggestions={mergeSuggestions}
                selectedMerges={selectedMerges}
                onToggleSelection={toggleMergeSelection}
                onConfirm={handleConfirmMerge}
                isMerging={isMerging}
            />
        </div>
    );
};

const UserModal: React.FC<{
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSave: (user: User) => void;
    onDelete: (userId: string) => void;
}> = ({ isOpen, user, onClose, onSave, onDelete }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        setEditingUser(user);
    }, [user]);

    if (!isOpen || !editingUser) return null;

    const handleSave = () => {
        if (editingUser) onSave(editingUser);
    };
    
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the user ${editingUser.email}? This action cannot be undone.`)) {
            onDelete(editingUser.id);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-md relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">Edit User</h3>
                        <p className="text-sm text-slate-500 -mt-1">{editingUser.email}</p>
                        
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Permission Level</label>
                                <select
                                    value={editingUser.permissionLevel}
                                    onChange={(e) => setEditingUser({ ...editingUser, permissionLevel: parseInt(e.target.value) as User['permissionLevel'] })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                >
                                    {Object.keys(PERMISSION_MAP).map(levelStr => {
                                        const level = parseInt(levelStr) as User['permissionLevel'];
                                        return (
                                            <option key={level} value={level}>{PERMISSION_MAP[level]}</option>
                                        );
                                    })}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-slate-700">Credits</label>
                                <input
                                    type="number"
                                    value={editingUser.credits}
                                    onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Banned">Banned</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            <Button onClick={handleDelete} className="!bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200">
                                <IconTrash className="w-4 h-4" /> Delete User
                            </Button>
                            <div className="flex gap-3">
                                <Button onClick={onClose}>Cancel</Button>
                                <Button onClick={handleSave} primary>Save Changes</Button>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><IconX/></button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const TemplateModal: React.FC<{
    isOpen: boolean;
    template: PromptTemplate | null;
    onClose: () => void;
    onSave: (template: PromptTemplate) => void;
}> = ({ isOpen, template, onClose, onSave }) => {
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (template) {
            setEditingTemplate(JSON.parse(JSON.stringify(template)));
        }
    }, [template]);
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingTemplate) {
            const base64 = await toBase64(file);
            setEditingTemplate({ ...editingTemplate, imageUrl: base64 });
        }
    };

    if (!isOpen || !editingTemplate) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-lg relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">Edit Template</h3>
                        <div className="mt-6 grid grid-cols-3 gap-6">
                            <div className="col-span-1 space-y-2">
                                <label className="text-sm font-medium text-slate-700">Image</label>
                                <div 
                                    className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <img src={editingTemplate.imageUrl} alt="Template preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconPencil />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="col-span-2 space-y-4">
                                 <div>
                                    <label className="text-sm font-medium text-slate-700">Template Name</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Prompt</label>
                                    <textarea
                                        value={editingTemplate.prompt}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, prompt: e.target.value })}
                                        className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg h-32"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={() => onSave(editingTemplate)} primary>Save Template</Button>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><IconX /></button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const CategoryModal: React.FC<{
    isOpen: boolean;
    type: 'main' | 'sub' | 'room';
    context: { mainCategory?: string } | null;
    onClose: () => void;
    onSave: (categoryName: string) => void;
}> = ({ isOpen, type, context, onClose, onSave }) => {
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCategoryName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getTitle = () => {
        if (type === 'main') return 'Add Main Category';
        if (type === 'room') return 'Add Room Type';
        return 'Add Sub-Category';
    };

    const getPlaceholder = () => {
        if (type === 'main') return 'e.g., Interior Design';
        if (type === 'room') return 'e.g., living-room';
        return 'e.g., Design Aesthetics';
    };

    const handleSubmit = () => {
        if (!categoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        onSave(categoryName.trim());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-md relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">{getTitle()}</h3>
                        {context?.mainCategory && (
                            <p className="text-sm text-slate-500 mt-1">
                                under <span className="font-medium">{context.mainCategory}</span>
                            </p>
                        )}
                        
                        <div className="mt-6">
                            <label className="text-sm font-medium text-slate-700">Category Name</label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder={getPlaceholder()}
                                className="w-full p-3 mt-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                            />
                            {type === 'room' && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Use lowercase with hyphens (e.g., living-room, dining-room)
                                </p>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSubmit} primary>Add Category</Button>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                            <IconX />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Tools Order Management Component ---
const ToolsOrderManagement: React.FC = () => {
    const [tools, setTools] = useState<ToolItemConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTools = async () => {
            try {
                const loadedTools = await getToolsOrder();
                setTools(loadedTools);
            } catch (err) {
                console.error('Failed to load tools:', err);
                setError('加载工具列表失败');
            }
        };
        loadTools();
    }, []);

    const handleMoveUp = async (index: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const newTools = await moveToolUp(tools, index);
            setTools(newTools);
        } catch (err) {
            console.error('Failed to move tool up:', err);
            setError('移动失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveDown = async (index: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const newTools = await moveToolDown(tools, index);
            setTools(newTools);
        } catch (err) {
            console.error('Failed to move tool down:', err);
            setError('移动失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveToTop = async (index: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const newTools = await moveToolToTop(tools, index);
            setTools(newTools);
        } catch (err) {
            console.error('Failed to move tool to top:', err);
            setError('移动失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveToBottom = async (index: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const newTools = await moveToolToBottom(tools, index);
            setTools(newTools);
        } catch (err) {
            console.error('Failed to move tool to bottom:', err);
            setError('移动失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        if (confirm('确定要重置功能按钮排序为默认顺序吗？')) {
            setIsLoading(true);
            setError(null);
            try {
                const defaultTools = await resetToolsOrder();
                setTools(defaultTools);
            } catch (err) {
                console.error('Failed to reset tools order:', err);
                setError('重置失败，请重试');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleToggleVisible = async (index: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const newTools = tools.map((t, i) => {
                if (i !== index) return t;
                const current = t.isVisible !== false; // default true
                return { ...t, isVisible: !current };
            });
            await saveToolsOrder(newTools);
            setTools(newTools);
        } catch (err) {
            console.error('Failed to toggle tool visibility:', err);
            setError('更新显示状态失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">功能按钮排序</h3>
                        <p className="text-sm text-slate-500 mt-1">调整左侧工具栏中功能按钮的显示顺序</p>
                    </div>
                    <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconX className="w-4 h-4" />
                        重置为默认
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-800">正在更新排序...</p>
                    </div>
                )}

                <div className="space-y-2">
                    {tools.map((tool, index) => (
                        <div
                            key={tool.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
                        >
                            {/* Tool Info */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-slate-200">
                                    <span className="text-2xl">{tool.emoji}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-800">{tool.name}</h4>
                                        {tool.isPremium && tool.id !== 'image-upscale' && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                                Premium
                                            </span>
                                        )}
                                        {tool.isComingSoon && (
                                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-semibold rounded">
                                                Coming Soon
                                            </span>
                                        )}
                                        {tool.isVisible === false && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">ID: {tool.id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Visible Toggle */}
                                <button
                                    onClick={() => handleToggleVisible(index)}
                                    disabled={isLoading}
                                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors border ${
                                        tool.isVisible === false
                                            ? 'bg-slate-200 border-slate-300'
                                            : 'bg-emerald-500 border-emerald-600'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={tool.isVisible === false ? '当前：隐藏（点击切换为显示）' : '当前：显示（点击切换为隐藏）'}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                                            tool.isVisible === false ? 'translate-x-1' : 'translate-x-9'
                                        }`}
                                    />
                                    <span className="sr-only">Toggle visibility</span>
                                </button>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleMoveToTop(index)}
                                    disabled={isLoading || index === 0}
                                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors group"
                                    title="置顶"
                                >
                                    <IconMoveToTop className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                                <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={isLoading || index === 0}
                                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors group"
                                    title="上移一层"
                                >
                                    <IconMoveUp className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                                <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={isLoading || index === tools.length - 1}
                                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors group"
                                    title="下移一层"
                                >
                                    <IconMoveDown className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                                <button
                                    onClick={() => handleMoveToBottom(index)}
                                    disabled={isLoading || index === tools.length - 1}
                                    className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors group"
                                    title="置底"
                                >
                                    <IconMoveToBottom className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                        <IconSparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">提示：</p>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>排序更改会立即生效并应用到左侧工具栏</li>
                                <li>排序信息保存在浏览器本地存储中</li>
                                <li>点击"重置为默认"可恢复初始排序</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Admin Page Component ---
export const AdminPage: React.FC<AdminPageProps> = ({
    users,
    onUpdateUser,
    onDeleteUser,
    generationHistory,
    totalDesignsGenerated,
    onDeleteBatch,
    templateData,
    setTemplateData,
    categoryOrder,
    setCategoryOrder,
    onTemplatesUpdated,
    dashboardData,
    isDashboardLoading,
    onRefreshDashboard,
}) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: IconLayoutDashboard },
        { id: 'users', name: 'Users', icon: IconUsers },
        { id: 'designs', name: 'Designs', icon: IconPhoto },
        { id: 'templates', name: 'Templates', icon: IconSparkles },
        { id: 'ai-creator', name: 'AI Template Creator', icon: IconSparkles },
        { id: 'tools-order', name: 'Tools Order', icon: IconArrowUp },
        { id: 'hero-section', name: 'Hero Section', icon: IconSparkles },
        { id: 'home-sections', name: 'Home Sections', icon: IconLayoutDashboard },
        { id: 'settings', name: 'Settings', icon: IconSettings },
    ];

    // 注意：模板数据现在通过props从App.tsx传入（adminTemplateDataFull）
    // Admin Panel 使用包含所有模板（包括禁用的）的完整数据
    // 前端功能页面使用只包含启用模板的数据（adminTemplateData）

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <Dashboard
                        users={users}
                        generationHistory={generationHistory}
                        totalDesignsGenerated={totalDesignsGenerated}
                        data={dashboardData}
                        isLoading={isDashboardLoading}
                        onRefresh={onRefreshDashboard}
                    />
                );
            case 'users':
                return <UserManagement users={users} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
            case 'designs':
                return <DesignManagement generationHistory={generationHistory} onDeleteBatch={onDeleteBatch} />;
            case 'templates':
                return <TemplateManagement templateData={templateData} setTemplateData={setTemplateData} categoryOrder={categoryOrder} setCategoryOrder={setCategoryOrder} onTemplatesUpdated={onTemplatesUpdated} />;
            case 'ai-creator':
                return <AITemplateCreator onTemplatesUpdated={onTemplatesUpdated} />;
            case 'tools-order':
                return <ToolsOrderManagement />;
            case 'hero-section':
                return <HeroSectionManager onUpdate={onTemplatesUpdated} />;
            case 'home-sections':
                return <HomeSectionManager onUpdate={onTemplatesUpdated} />;
            default:
                return <div className="bg-white p-6 rounded-2xl shadow-sm">Coming soon...</div>;
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-slate-100 pt-[72px]">
            <aside className="w-64 bg-white p-4 border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-2 pb-6 border-b border-slate-200">
                    <span className="text-2xl font-bold text-indigo-600">MN</span>
                    <span className="text-xl font-bold text-slate-800">Admin Panel</span>
                </div>
                <nav className="mt-6 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-900">Welcome, Admin!</h1>
                <p className="mt-1 text-slate-500">Here's an overview of your platform's activity.</p>
                <div className="mt-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

// --- Merge Suggestions Modal Component ---
interface MergeSuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mainCategory: string;
    suggestions: SimilarCategoryGroup[];
    selectedMerges: Set<number>;
    onToggleSelection: (index: number) => void;
    onConfirm: () => void;
    isMerging: boolean;
}

const MergeSuggestionsModal: React.FC<MergeSuggestionsModalProps> = ({
    isOpen,
    onClose,
    mainCategory,
    suggestions,
    selectedMerges,
    onToggleSelection,
    onConfirm,
    isMerging
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <IconSparkles className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Smart Category Merge</h3>
                                    <p className="text-sm text-slate-600 mt-0.5">AI-powered category optimization</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                                disabled={isMerging}
                            >
                                <IconX className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-800">
                                <strong className="font-semibold">Category:</strong> {mainCategory}<br />
                                <strong className="font-semibold">Found:</strong> {suggestions.length} merge suggestion(s)<br />
                                <strong className="font-semibold">Instructions:</strong> Select which groups you want to merge, then click "Merge Selected"
                            </p>
                        </div>

                        {suggestions.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <div className="text-5xl mb-4">✅</div>
                                <p className="text-lg font-medium">No similar categories found</p>
                                <p className="text-sm mt-2">Your categories are well organized!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {suggestions.map((suggestion, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`border-2 rounded-xl p-5 transition-all ${selectedMerges.has(index)
                                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedMerges.has(index)}
                                                onChange={() => onToggleSelection(index)}
                                                className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                disabled={isMerging}
                                            />

                                            <div className="flex-1">
                                                {/* Before */}
                                                <div className="mb-3">
                                                    <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Before:</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestion.categories.map(cat => (
                                                            <span
                                                                key={cat}
                                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                                                            >
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="text-center py-2">
                                                    <div className="inline-block px-4 py-1 bg-slate-100 rounded-full">
                                                        <span className="text-2xl">↓</span>
                                                    </div>
                                                </div>

                                                {/* After */}
                                                <div className="mb-3">
                                                    <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">After:</div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold shadow-sm">
                                                            {suggestion.suggestedName}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            ({suggestion.templateCount} templates)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg">💡</span>
                                                        <p className="text-sm text-slate-700 italic leading-relaxed">
                                                            {suggestion.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {suggestions.length > 0 && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-sm text-slate-600">
                                    <span className="font-semibold">{selectedMerges.size}</span> of {suggestions.length} groups selected
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        disabled={isMerging}
                                        className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        disabled={selectedMerges.size === 0 || isMerging}
                                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isMerging ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Merging...
                                            </>
                                        ) : (
                                            <>
                                                <IconSparkles className="w-4 h-4" />
                                                Merge {selectedMerges.size} Group{selectedMerges.size !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};