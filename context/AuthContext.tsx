/**
 * 用户认证上下文
 * 全局管理用户登录状态、用户信息、信用点等
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle,
  getCurrentUser, 
  getUserProfile,
  deductCredits as deductCreditsService,
  onAuthStateChange,
  sendPasswordResetEmail,
  updatePassword,
  type SignInData,
  type SignUpData,
} from '../services/authService';
import type { UserProfile } from '../types/database';

// ===== Context 类型定义 =====

interface AuthContextType {
  // 用户状态
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  
  // 认证方法
  signIn: (data: SignInData) => Promise<{ error: any }>;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  
  // 密码重置
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  
  // 用户操作
  refreshProfile: (userId?: string) => Promise<void>;
  deductCredits: (amount?: number) => Promise<{ success: boolean; remainingCredits: number }>;
  
  // UI状态
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  
  // 便捷访问
  isAuthenticated: boolean;
  credits: number;
  membershipTier: UserProfile['membership_tier'];
  totalGenerations: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== Provider 组件 =====

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 刷新用户资料
  const refreshProfile = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;

    if (targetUserId) {
      try {
        const userProfile = await getUserProfile(targetUserId);
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to refresh profile:', error);
        // 不要在这里抛出错误，避免无限循环
      }
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  // 初始化：获取当前用户
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // 注意：不在初始化时加载profile，避免网络问题导致无限循环
        // profile会在auth state change时加载
      } catch (error) {
        console.error('Init auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        try {
          await refreshProfile(newSession.user.id);
        } catch (error) {
          console.error('Failed to refresh profile on auth change:', error);
          // 继续运行，不阻塞
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // 登录方法
  const handleSignIn = async (data: SignInData) => {
    try {
      const { user: authUser, session: authSession, error } = await signIn(data);
      
      if (error) {
        return { error };
      }
      
      // 不在这里设置user和session，让onAuthStateChange统一处理
      // 这样避免重复查询getUserProfile
      // setUser(authUser);
      // setSession(authSession);
      
      // 移除这里的refreshProfile调用，由onAuthStateChange统一处理
      // onAuthStateChange会自动触发，无需手动调用
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  // 注册方法
  const handleSignUp = async (data: SignUpData) => {
    try {
      const { user: authUser, session: authSession, error } = await signUp(data);
      
      if (error) {
        return { error };
      }
      
      // 不在这里设置user和session，让onAuthStateChange统一处理
      // 这样避免重复查询getUserProfile
      // setUser(authUser);
      // setSession(authSession);
      
      // 移除这里的refreshProfile调用，由onAuthStateChange统一处理
      // 注册后触发器会创建user记录，onAuthStateChange会自动获取
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  // Google 登录方法
  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      return { error };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error };
    }
  };

  // 登出方法
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 扣除信用点
  const handleDeductCredits = async (amount: number = 1) => {
    if (!user) {
      return { success: false, remainingCredits: 0 };
    }

    const result = await deductCreditsService(user.id, amount);
    
    if (result.success) {
      // 更新本地状态
      await refreshProfile();
    }
    
    return result;
  };

  // 发送密码重置邮件
  const handleSendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await sendPasswordResetEmail(email);
      return { error };
    } catch (error) {
      console.error('Send password reset email error:', error);
      return { error };
    }
  };

  // 更新密码
  const handleUpdatePassword = async (newPassword: string) => {
    try {
      const { error } = await updatePassword(newPassword);
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    sendPasswordResetEmail: handleSendPasswordResetEmail,
    updatePassword: handleUpdatePassword,
    refreshProfile,
    deductCredits: handleDeductCredits,
    showLoginModal,
    setShowLoginModal,
    isAuthenticated: !!user,
    credits: profile?.credits || 0,
    membershipTier: profile?.membership_tier || 'free',
    totalGenerations: profile?.total_generations || 0,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== Hook =====

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 导出 Context 以便在不使用 Hook 的地方使用
export { AuthContext };
