import { supabase } from '../config/supabase';
import type {
  DashboardOverview,
  TemplateUsageStat,
  CategoryUsageStat,
  MembershipDistributionStat,
  DashboardMetrics,
  CreditStats,
} from '../types';

const PLAN_PRICES: Record<string, number> = {
  pro: 39,
  premium: 99,
  business: 299,
};

const normalizeAmount = (amount: unknown): number => {
  if (typeof amount === 'number') {
    return amount;
  }
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const fetchDashboardOverview = async (): Promise<DashboardOverview> => {
  const generatedAt = new Date().toISOString();

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, membership_tier, credits, total_generations, created_at');

  if (usersError) {
    console.error('Failed to load dashboard users data:', usersError);
    throw usersError;
  }

  const users = (usersData || []) as Array<{
    id: string;
    membership_tier: string | null;
    credits: number | null;
    total_generations: number | null;
    created_at: string | null;
  }>;

  const totalUsers = users.length;
  const totalGenerations = users.reduce((acc, user) => acc + (user.total_generations || 0), 0);
  const totalCreditsRemaining = users.reduce((acc, user) => acc + (user.credits || 0), 0);
  const totalCreditsPurchased = totalGenerations + totalCreditsRemaining;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newUsersThisWeek = users.filter(user => {
    if (!user.created_at) return false;
    const created = new Date(user.created_at);
    return created >= weekAgo;
  }).length;

  const membershipMap = new Map<string, MembershipDistributionStat>();
  users.forEach(user => {
    const tier = user.membership_tier || 'free';
    const entry = membershipMap.get(tier) || {
      tier,
      userCount: 0,
      percentage: 0,
      totalCredits: 0,
    };

    entry.userCount += 1;
    entry.totalCredits += user.credits || 0;
    membershipMap.set(tier, entry);
  });

  const membershipDistribution = Array.from(membershipMap.values())
    .map(entry => ({
      ...entry,
      percentage: totalUsers > 0 ? Number(((entry.userCount / totalUsers) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.userCount - a.userCount);

  let activeSubscriptions = 0;
  let monthlyRecurringRevenue = 0;

  try {
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_type, amount, billing_cycle, status');

    if (subscriptionError) {
      throw subscriptionError;
    }

    const active = (subscriptionData || []).filter(sub => sub.status === 'active');
    activeSubscriptions = active.length;
    monthlyRecurringRevenue = active.reduce((total, sub) => {
      const amount = normalizeAmount(sub.amount);
      if (!Number.isFinite(amount)) return total;
      if (sub.billing_cycle === 'yearly') {
        return total + amount / 12;
      }
      return total + amount;
    }, 0);
  } catch (error) {
    console.warn('Falling back to membership-based revenue calculation:', error);
    const paidUsers = users.filter(user => user.membership_tier && user.membership_tier !== 'free');
    activeSubscriptions = paidUsers.length;
    monthlyRecurringRevenue = paidUsers.reduce((total, user) => {
      return total + (PLAN_PRICES[user.membership_tier || ''] || 0);
    }, 0);
  }

  const metrics: DashboardMetrics = {
    totalUsers,
    newUsersThisWeek,
    totalGenerations,
    activeSubscriptions,
    monthlyRecurringRevenue: Number(monthlyRecurringRevenue.toFixed(2)),
    averageGenerationsPerUser: totalUsers > 0 ? Number((totalGenerations / totalUsers).toFixed(2)) : 0,
  };

  const credit: CreditStats = {
    totalPurchased: totalCreditsPurchased,
    totalRemaining: totalCreditsRemaining,
    totalConsumed: totalGenerations,
  };

  const { data: templateUsageData, error: templateUsageError } = await supabase
    .from('design_templates')
    .select('id, name, main_category, sub_category, template_usage_stats(usage_count, last_used_at)')
    .order('usage_count', { foreignTable: 'template_usage_stats', ascending: false, nullsFirst: false })
    .limit(50);

  if (templateUsageError) {
    console.error('Failed to load template usage stats:', templateUsageError);
  }

  const templateDistribution: TemplateUsageStat[] = (templateUsageData || []).map((item: any) => {
    const usage = Array.isArray(item.template_usage_stats) && item.template_usage_stats.length > 0
      ? item.template_usage_stats[0]
      : { usage_count: 0, last_used_at: null };

    return {
      templateId: item.id,
      templateName: item.name,
      mainCategory: item.main_category,
      subCategory: item.sub_category,
      usageCount: usage?.usage_count || 0,
      lastUsedAt: usage?.last_used_at || null,
    };
  }).sort((a, b) => b.usageCount - a.usageCount);

  const { data: categoryUsageData, error: categoryUsageError } = await supabase
    .from('category_usage_stats')
    .select('main_category, sub_category, usage_count, last_used_at')
    .order('usage_count', { ascending: false })
    .limit(50);

  if (categoryUsageError) {
    console.error('Failed to load category usage stats:', categoryUsageError);
  }

  const categoryDistribution: CategoryUsageStat[] = (categoryUsageData || []).map(item => ({
    mainCategory: item.main_category,
    subCategory: item.sub_category,
    usageCount: item.usage_count || 0,
    lastUsedAt: item.last_used_at || null,
  }));

  return {
    metrics,
    credit,
    membershipDistribution,
    templateDistribution,
    categoryDistribution,
    generatedAt,
  };
};

