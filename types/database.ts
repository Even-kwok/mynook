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

export type Database = {
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
      refund_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
        };
        Returns: {
          success: boolean;
          refunded_credits?: number;
          error?: string;
        };
      };
      check_and_deduct_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
        };
        Returns: {
          success: boolean;
          remaining_credits?: number;
          membership_tier?: string;
          error?: string;
          required?: number;
        };
      };
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
    maxTemplates: 1, // Free 用户可以选择1个模板（体验功能，但生成时需要升级）
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: '🆓',
    features: ['浏览功能', '基础设计查看'],
  },
  pro: {
    name: 'Pro',
    credits: 1000, // Pro 用户 1000 点
    maxTemplates: 1, // Pro 可以选择1个模板，生成1张图片
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '⭐',
    features: ['设计生图功能', '1000 信用点', '每次生成1张图片'],
  },
  premium: {
    name: 'Premium',
    credits: 5000, // Premium 用户 5000 点
    maxTemplates: 8, // Premium 可以选择8个模板，生成8张图片
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '👑',
    features: ['优先队列', '解锁 Free Canvas 功能', '5000 信用点', '每次生成最多8张图片'],
  },
  business: {
    name: 'Business',
    credits: 25000, // Business 用户 25000 点
    maxTemplates: 50, // Business 可以选择50个模板，生成50张图片
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: '💼',
    features: ['专属低价', 'Free Canvas 功能', '25000 信用点', '综合单价更低', '每次生成最多50张图片'],
  },
} as const;

