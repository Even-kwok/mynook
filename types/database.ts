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
    credits: 10,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: '🆓',
  },
  pro: {
    name: 'Pro',
    credits: 100,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '⭐',
  },
  premium: {
    name: 'Premium',
    credits: 500,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '👑',
  },
  business: {
    name: 'Business',
    credits: -1, // -1 表示无限
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '💼',
  },
} as const;

