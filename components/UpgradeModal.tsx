/**
 * Membership Upgrade Modal Component
 * Displayed when users try to use premium features without sufficient permissions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconCrown, IconCheck } from './Icons';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string; // Feature name, e.g., "Free Canvas"
  requiredTier: 'premium' | 'business'; // Required membership tier
  onUpgrade?: () => void; // Callback to upgrade page
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  featureName,
  requiredTier,
  onUpgrade 
}) => {
  const { membershipTier } = useAuth();

  // Tier configuration
  const tierConfig = {
    premium: {
      name: 'Premium',
      icon: '👑',
      price: '$42/month',
      color: 'from-purple-500 to-pink-500',
      features: [
        '5,000 credits/month',
        'Unlock Canva feature',
        'Priority processing queue',
        'Generate up to 9 designs simultaneously',
        'Commercial use license',
      ]
    },
    business: {
      name: 'Business',
      icon: '💼',
      price: '$142/month',
      color: 'from-blue-500 to-indigo-600',
      features: [
        '25,000 credits/month',
        'All Premium features',
        'Generate up to 18 designs simultaneously',
        'Fastest response time',
        'Early access to new features',
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
        {/* Background overlay - 深色主题 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal content - 深色主题 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl shadow-2xl overflow-hidden border border-[#333333]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10 text-white"
          >
            <IconX />
          </button>

          {/* Gradient header - 优化渐变效果 */}
          <div className="relative p-8 text-white overflow-hidden">
            {/* 背景渐变效果 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20`}></div>
            <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-20 h-20 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-4xl shadow-lg`}>
                  {config.icon}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                Upgrade to {config.name}
              </h2>
              <p className="text-center text-white/80 text-base" style={{ fontFamily: 'Arial, sans-serif' }}>
                Unlock <span className="font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{featureName}</span> feature
              </p>
            </div>
          </div>

          {/* Content area - 深色主题 */}
          <div className="p-8">
            {/* Current status notice - 深色主题 */}
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-300 text-sm text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                <span className="font-semibold">💡 Notice:</span>
                {' '}You are currently a <span className="font-semibold capitalize">{membershipTier}</span> member,
                you need to upgrade to <span className="font-semibold">{config.name}</span> to use this feature
              </p>
            </div>

            {/* Price display - 深色主题 */}
            <div className="text-center mb-6">
              <div className={`text-4xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent mb-1`} style={{ fontFamily: 'Arial, sans-serif' }}>
                {config.price}
              </div>
              <div className="text-sm text-slate-400" style={{ fontFamily: 'Arial, sans-serif' }}>
                Save more with annual billing
              </div>
            </div>

            {/* Features list - 深色主题 */}
            <div className="space-y-3 mb-8">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <IconCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-300" style={{ fontFamily: 'Arial, sans-serif' }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* Button group - 深色主题优化 */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                <IconCrown className="w-5 h-5" />
                Upgrade to {config.name}
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                Maybe Later
              </button>
            </div>

            {/* Additional info - 深色主题 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500" style={{ fontFamily: 'Arial, sans-serif' }}>
                Takes effect immediately after upgrade
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

