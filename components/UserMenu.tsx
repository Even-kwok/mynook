import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSparkles, IconLogout } from './Icons';
import { CreditPackModal } from './CreditPackModal';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    email: string;
    credits: number;
    permissionLevel: number;
  };
  onLogout: () => void;
  onNavigate?: (page: string) => void; // 添加导航回调
  onPurchaseCredits?: (packId: string) => void; // 购买信用点回调
  isPurchasing?: boolean; // 购买进行中状态
  anchorRef: React.RefObject<HTMLButtonElement | HTMLDivElement>;
  position?: 'top' | 'bottom'; // 'top' = above button, 'bottom' = below button
}

const TIER_NAMES: Record<number, string> = {
  1: 'FREE',
  2: 'PRO',
  3: 'PREMIUM',
  4: 'BUSINESS'
};

const TIER_COLORS: Record<number, string> = {
  1: 'text-slate-400',
  2: 'text-blue-400',
  3: 'text-purple-400',
  4: 'text-yellow-400'
};

const TIER_EMOJIS: Record<number, string> = {
  1: '🆓',
  2: '⭐',
  3: '👑',
  4: '💼'
};

export const UserMenu: React.FC<UserMenuProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogout,
  onNavigate,
  onPurchaseCredits,
  isPurchasing = false,
  anchorRef,
  position = 'top'
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  const tierName = TIER_NAMES[user.permissionLevel] || 'FREE';
  const tierColor = TIER_COLORS[user.permissionLevel] || 'text-slate-400';
  const tierEmoji = TIER_EMOJIS[user.permissionLevel] || '🆓';
  
  // 判断是否显示升级按钮（BUSINESS用户不显示）
  const showUpgradeButton = user.permissionLevel < 4;
  
  // 处理升级按钮点击
  const handleUpgradeClick = () => {
    if (onNavigate) {
      onNavigate('Pricing');
      onClose();
    }
  };

  // 处理购买信用点
  const handlePurchaseCredits = (packId: string) => {
    console.log('🔄 UserMenu handlePurchaseCredits called with:', packId);
    if (onPurchaseCredits) {
      console.log('✅ onPurchaseCredits callback exists, calling it...');
      onPurchaseCredits(packId);
    } else {
      console.error('❌ onPurchaseCredits callback is undefined!');
    }
  };

  // 查看完整定价页面
  const handleViewFullPricing = () => {
    if (onNavigate) {
      onNavigate('Pricing');
    }
  };

  // 根据 position 设置不同的位置类
  const positionClasses = position === 'top' 
    ? 'bottom-full left-0 mb-2' 
    : 'top-full right-0 mt-2';

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`absolute ${positionClasses} w-64 bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl overflow-hidden`}
          style={{ 
            fontFamily: 'Arial, sans-serif',
            zIndex: 9999
          }}
        >
          {/* User Info Section */}
          <div className="p-4 bg-gradient-to-br from-[#252525] to-[#1a1a1a] border-b border-[#333333]">
            {/* Avatar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                🐱
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{tierEmoji}</span>
                    <span className={`text-xs font-semibold ${tierColor}`}>{tierName}</span>
                  </div>
                  {showUpgradeButton && (
                    <button
                      onClick={handleUpgradeClick}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Credits */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#333333]">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-[#a0a0a0] font-medium">Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-yellow-400">{user.credits}</span>
                {/* 购买信用点按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreditModalOpen(true);
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#333333] hover:bg-purple-500/20 hover:text-purple-400 text-[#a0a0a0] transition-all text-xs font-bold"
                  title="Purchase Credits"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-2">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[#2a2a2a] transition-colors group"
            >
              <IconLogout className="w-4 h-4 text-[#a0a0a0] group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium text-[#a0a0a0] group-hover:text-white transition-colors">
                Sign Out
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Credit Pack Purchase Modal - 独立于 AnimatePresence 之外 */}
    <CreditPackModal
      isOpen={isCreditModalOpen}
      onClose={() => setIsCreditModalOpen(false)}
      onPurchase={handlePurchaseCredits}
      onViewFullPricing={handleViewFullPricing}
      userPermissionLevel={user.permissionLevel}
      isPurchasing={isPurchasing}
    />
  </>
  );
};

