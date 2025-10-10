/**
 * 会员升级提示弹窗组件
 * 当用户尝试使用高级功能但权限不足时显示
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconCrown, IconCheck } from './Icons';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string; // 功能名称，如 "Free Canvas"
  requiredTier: 'premium' | 'business'; // 需要的会员等级
  onUpgrade?: () => void; // 跳转到升级页面的回调
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  featureName,
  requiredTier,
  onUpgrade 
}) => {
  const { membershipTier } = useAuth();

  // 会员等级配置
  const tierConfig = {
    premium: {
      name: 'Premium',
      icon: '👑',
      price: '$42/月',
      color: 'from-purple-500 to-pink-500',
      features: [
        '5,000 积分/月',
        '解锁 Free Canvas 功能',
        '优先处理队列',
        '同时生成最多 9 个设计',
        '商业使用授权',
      ]
    },
    business: {
      name: 'Business',
      icon: '💼',
      price: '$142/月',
      color: 'from-blue-500 to-indigo-600',
      features: [
        '25,000 积分/月',
        '所有 Premium 功能',
        '同时生成最多 18 个设计',
        '最快响应速度',
        '优先体验新功能',
      ]
    }
  };

  const config = tierConfig[requiredTier];

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* 模态框内容 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <IconX />
          </button>

          {/* 渐变头部 */}
          <div className={`bg-gradient-to-br ${config.color} p-8 text-white`}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl">
                {config.icon}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">
              升级到 {config.name}
            </h2>
            <p className="text-center text-white/90 text-lg">
              解锁 <span className="font-semibold">{featureName}</span> 功能
            </p>
          </div>

          {/* 内容区域 */}
          <div className="p-8">
            {/* 当前状态提示 */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm text-center">
                <span className="font-semibold">💡 提示：</span>
                您当前是 <span className="font-semibold capitalize">{membershipTier}</span> 会员，
                需要升级到 <span className="font-semibold">{config.name}</span> 才能使用此功能
              </p>
            </div>

            {/* 价格显示 */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-slate-800 mb-1">
                {config.price}
              </div>
              <div className="text-sm text-slate-500">
                年付可享受更多优惠
              </div>
            </div>

            {/* 功能列表 */}
            <div className="space-y-3 mb-8">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <IconCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* 按钮组 */}
            <div className="space-y-3">
              <Button
                onClick={handleUpgrade}
                primary
                className="w-full py-3 text-base font-semibold"
              >
                <IconCrown className="w-5 h-5 mr-2" />
                立即升级到 {config.name}
              </Button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
              >
                稍后再说
              </button>
            </div>

            {/* 额外说明 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                升级后立即生效，无需等待
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

