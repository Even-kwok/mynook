/**
 * 密码重置模态框组件
 * 当用户点击邮件中的重置链接后，显示此模态框让用户设置新密码
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconCheck } from './Icons';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { verifyPasswordResetToken } from '../services/authService';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const { updatePassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // 验证重置token是否有效
  useEffect(() => {
    if (isOpen) {
      checkToken();
    }
  }, [isOpen]);

  const checkToken = async () => {
    setVerifying(true);
    try {
      const { isValid } = await verifyPasswordResetToken();
      setTokenValid(isValid);
      
      if (!isValid) {
        setError('密码重置链接无效或已过期，请重新申请密码重置。');
      }
    } catch (err) {
      setError('验证失败，请稍后重试。');
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  // 关闭模态框
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理密码重置
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证密码
    if (newPassword.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        setError(getErrorMessage(error));
      } else {
        setSuccess(true);
        // 3秒后自动关闭并跳转
        setTimeout(() => {
          handleClose();
          // 可以在这里添加跳转到首页的逻辑
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      setError('密码重置失败，请稍后重试');
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
            {/* 验证中 */}
            {verifying && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
                />
                <p className="text-slate-600">验证中...</p>
              </div>
            )}

            {/* 验证完成 */}
            {!verifying && (
              <>
                {/* 标题 */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {success ? '重置成功' : '设置新密码'}
                  </h2>
                  <p className="text-slate-500">
                    {success ? '您的密码已成功重置！' : '请输入您的新密码'}
                  </p>
                </div>

                {/* 成功提示 */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
                    >
                      <IconCheck className="w-8 h-8 text-white" />
                    </motion.div>
                    <p className="text-green-700 font-medium mb-2">密码重置成功！</p>
                    <p className="text-green-600 text-sm">页面将自动跳转...</p>
                  </motion.div>
                )}

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
                {!success && tokenValid && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        新密码
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <p className="mt-1 text-xs text-slate-500">至少6个字符</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <Button
                      type="submit"
                      primary
                      disabled={loading}
                      className="w-full py-3 text-base font-semibold relative"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          重置中...
                        </span>
                      ) : (
                        '重置密码'
                      )}
                    </Button>
                  </form>
                )}

                {/* Token无效时显示返回按钮 */}
                {!success && !tokenValid && (
                  <Button
                    onClick={handleClose}
                    primary
                    className="w-full py-3 text-base font-semibold"
                  >
                    返回
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// 错误消息本地化
function getErrorMessage(error: any): string {
  const message = error?.message || '';
  
  if (message.includes('Password should be at least')) {
    return '密码至少需要6个字符';
  }
  if (message.includes('Same password')) {
    return '新密码不能与旧密码相同';
  }
  if (message.includes('Invalid token')) {
    return '密码重置链接无效或已过期';
  }
  
  console.error('Reset password error:', error);
  return `密码重置失败: ${message || '未知错误'}`;
}

