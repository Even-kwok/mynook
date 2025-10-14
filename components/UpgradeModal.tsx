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
        'Unlock Free Canvas feature',
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
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <IconX className="text-white" />
          </button>

          {/* Gradient header */}
          <div className={`bg-gradient-to-br ${config.color} p-8 text-white`}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl">
                {config.icon}
              </div>
            </div>
            <h2 className="text-white text-center mb-2" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>
              Upgrade to {config.name}
            </h2>
            <p className="text-center text-white/90" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', letterSpacing: '0px' }}>
              Unlock <span className="font-semibold">{featureName}</span> feature
            </p>
          </div>

          {/* Content area */}
          <div className="p-8">
            {/* Current status notice */}
            <div className="mb-6 p-4 bg-amber-500/20 border border-amber-400/30 backdrop-blur-md rounded-xl">
              <p className="text-amber-300 text-sm text-center">
                <span className="font-semibold">💡 Notice:</span>
                {' '}You are currently a <span className="font-semibold capitalize">{membershipTier}</span> member,
                you need to upgrade to <span className="font-semibold">{config.name}</span> to use this feature
              </p>
            </div>

            {/* Price display */}
            <div className="text-center mb-6">
              <div className="text-white mb-1" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '36px', lineHeight: '48px', letterSpacing: '0px' }}>
                {config.price}
              </div>
              <div className="text-sm text-slate-400">
                Save more with annual billing
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-3 mb-8">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <IconCheck className="w-5 h-5 text-[#00BCD4]" />
                  </div>
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Button group */}
            <div className="space-y-3">
              <Button
                onClick={handleUpgrade}
                primary
                className="w-full py-3 text-base font-semibold"
              >
                <IconCrown className="w-5 h-5 mr-2" />
                Upgrade to {config.name}
              </Button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                Maybe Later
              </button>
            </div>

            {/* Additional info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Takes effect immediately after upgrade
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

