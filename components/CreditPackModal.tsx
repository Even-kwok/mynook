import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconXMark } from './Icons';

const creditPacks = [
  {
    id: '100',
    credits: 100,
    price: 9.90,
    icon: '💎',
    name: '100 Credits Pack',
    description: 'Perfect for trying out',
  },
  {
    id: '300',
    credits: 300,
    price: 24.99,
    icon: '💎',
    name: '300 Credits Pack',
    description: 'Great for small projects',
    isPopular: true,
  },
  {
    id: '1000',
    credits: 1000,
    price: 69.99,
    icon: '💎',
    name: '1000 Credits Pack',
    description: 'Best value per credit',
  },
];

interface CreditPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (packId: string) => void;
  onViewFullPricing: () => void;
  userPermissionLevel: number;
  isPurchasing?: boolean;
}

export const CreditPackModal: React.FC<CreditPackModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
  onViewFullPricing,
  userPermissionLevel,
  isPurchasing = false,
}) => {
  // 本地状态：追踪哪个信用包按钮正在加载
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  
  // 只有Pro (2)及以上用户才能购买信用包
  const canPurchase = userPermissionLevel >= 2;
  
  // 关闭弹窗的处理函数，重置状态
  const handleClose = () => {
    setPurchasingPackId(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
            style={{ fontFamily: 'Arial, sans-serif' }}
          />
          
          {/* 模态框 - 使用 flex 居中而不是 transform */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-[#333333] bg-gradient-to-br from-[#252525] to-[#1a1a1a]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💎</span>
                <span>Purchase Credits</span>
              </h3>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center justify-center disabled:opacity-50"
                disabled={purchasingPackId !== null}
              >
                <IconXMark className="w-5 h-5 text-[#a0a0a0]" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-4 space-y-3">
              {!canPurchase && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                  ⭐ Upgrade to Pro, Premium or Business to purchase credits
                </div>
              )}

              {creditPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative p-4 bg-[#252525] border rounded-xl transition-all ${
                    pack.isPopular 
                      ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' 
                      : 'border-[#333333] hover:border-[#444444]'
                  }`}
                >
                  {pack.isPopular && (
                    <div className="absolute -top-2 left-4 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pack.icon}</span>
                        <div>
                          <div className="text-white font-bold">{pack.credits} Credits</div>
                          <div className="text-xs text-[#a0a0a0]">{pack.description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-[#666666] mt-1">
                        ${(pack.price / pack.credits * 100).toFixed(2)} per 100 credits
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        console.log('💎 Credit pack button clicked:', pack.id, 'canPurchase:', canPurchase);
                        if (canPurchase) {
                          console.log('📞 Calling onPurchase with:', pack.id);
                          setPurchasingPackId(pack.id);
                          try {
                            await onPurchase(pack.id);
                          } finally {
                            setPurchasingPackId(null);
                          }
                        } else {
                          console.log('👉 Redirecting to pricing page');
                          onViewFullPricing();
                          handleClose();
                        }
                      }}
                      disabled={purchasingPackId !== null}
                      className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all min-w-[80px] ${
                        canPurchase
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                          : 'bg-[#333333] text-[#666666] hover:bg-[#3a3a3a] hover:text-[#888888]'
                      }`}
                    >
                      {purchasingPackId === pack.id ? (
                        <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : canPurchase ? (
                        `$${pack.price}`
                      ) : (
                        'Upgrade'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 底部 */}
            <div className="p-4 border-t border-[#333333] bg-[#0a0a0a]">
              <button
                onClick={() => {
                  onViewFullPricing();
                  handleClose();
                }}
                disabled={purchasingPackId !== null}
                className="w-full py-2.5 text-sm text-[#a0a0a0] hover:text-white transition-colors disabled:opacity-50"
              >
                View Full Pricing & Plans →
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

