/**
 * Supabase 数据库类型定义
 * 这些类型与数据库表结构对应
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          membership_tier: 'free' | 'pro' | 'premium' | 'business';
          credits: number;
          total_generations: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free' | 'pro' | 'premium' | 'business';
          credits?: number;
          total_generations?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          membership_tier?: 'free' | 'pro' | 'premium' | 'business';
          credits?: number;
          total_generations?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// 用户信息类型（方便使用）
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type MembershipTier = UserProfile['membership_tier'];

// 会员等级配置
export const MEMBERSHIP_CONFIG = {
  free: {
    name: 'Free',
    credits: 0, // Free 用户没有信用点额度
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: '🆓',
    features: ['浏览功能', '基础设计查看'],
  },
  pro: {
    name: 'Pro',
    credits: 1000, // Pro 用户 1000 点
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '⭐',
    features: ['设计生图功能', '1000 信用点'],
  },
  premium: {
    name: 'Premium',
    credits: 5000, // Premium 用户 5000 点
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '👑',
    features: ['优先队列', '解锁 Free Canvas 功能', '5000 信用点'],
  },
  business: {
    name: 'Business',
    credits: 25000, // Business 用户 25000 点
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '💼',
    features: ['专属低价', 'Free Canvas 功能', '25000 信用点', '综合单价更低'],
  },
} as const;

