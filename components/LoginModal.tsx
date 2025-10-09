/**
 * 登录/注册模态框组件
 * 支持邮箱密码和Google登录
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconGoogle } from './Icons';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 重置表单
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
  };

  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  // 关闭模态框
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理邮箱密码登录/注册
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (mode === 'signin') {
        result = await signIn({ email, password });
      } else {
        result = await signUp({ email, password, fullName });
      }

      if (result.error) {
        // 错误消息本地化
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
      } else {
        // 成功后关闭模态框
        handleClose();
      }
    } catch (err) {
      setError('发生未知错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理Google登录
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError('Google 登录失败，请稍后重试');
      }
      // Google OAuth会重定向，不需要手动关闭模态框
    } catch (err) {
      setError('Google 登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* 模态框内容 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <IconX className="w-5 h-5 text-slate-500" />
          </button>

          {/* 内容区域 */}
          <div className="p-8">
            {/* 标题 */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {mode === 'signin' ? '欢迎回来' : '创建账户'}
              </h2>
              <p className="text-slate-500">
                {mode === 'signin' ? '登录继续使用 AI 设计工具' : '注册开始你的设计之旅'}
              </p>
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* 表单 */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="输入你的姓名"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-slate-500">至少6个字符</p>
                )}
              </div>

              <Button
                type="submit"
                primary
                disabled={loading}
                className="w-full py-3 text-base font-semibold"
              >
                {loading ? '处理中...' : mode === 'signin' ? '登录' : '注册'}
              </Button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">或</span>
              </div>
            </div>

            {/* Google 登录 */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconGoogle className="w-5 h-5" />
              使用 Google 账号{mode === 'signin' ? '登录' : '注册'}
            </button>

            {/* 切换模式 */}
            <div className="mt-6 text-center text-sm text-slate-600">
              {mode === 'signin' ? '还没有账户？' : '已有账户？'}
              <button
                onClick={toggleMode}
                className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {mode === 'signin' ? '立即注册' : '去登录'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// 错误消息本地化
function getErrorMessage(error: any): string {
  const message = error?.message || '';
  
  // Supabase 常见错误
  if (message.includes('Invalid login credentials')) {
    return '邮箱或密码错误';
  }
  if (message.includes('Email not confirmed')) {
    return '请先验证你的邮箱';
  }
  if (message.includes('User already registered')) {
    return '该邮箱已被注册';
  }
  if (message.includes('Password should be at least')) {
    return '密码至少需要6个字符';
  }
  if (message.includes('Unable to validate email address')) {
    return '邮箱格式无效';
  }
  
  // 默认错误
  return '操作失败，请稍后重试';
}

