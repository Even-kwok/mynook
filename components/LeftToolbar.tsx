import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IconHome, 
  IconSparkles, 
  IconPaint, 
  IconFloor, 
  IconTree, 
  IconGift, 
  IconPlus, 
  IconTarget, 
  IconChat, 
  IconBox, 
  IconPencil
} from './Icons';
import { darkThemeClasses } from '../config/darkTheme';
import { UserMenu } from './UserMenu';
import { getToolsOrder, getToolsOrderSync, ToolItemConfig } from '../services/toolsOrderService';

// 功能工具定义
export interface ToolItem {
  id: string;
  name: string;
  shortName: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  isPremium?: boolean;
  isComingSoon?: boolean;
}

export interface LeftToolbarProps {
  activeTool: string | null;
  onToolClick: (toolId: string) => void;
  user: any;
  onOpenUserMenu?: () => void;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  onPurchaseCredits?: (packId: string) => void;
  isPurchasing?: boolean;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onToolClick,
  user,
  onOpenUserMenu,
  onLogout,
  onNavigate,
  onPurchaseCredits,
  isPurchasing = false,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  // Initialize with sync version (cache or defaults)
  const [tools, setTools] = useState<ToolItemConfig[]>(getToolsOrderSync());

  // Load tools order from database
  useEffect(() => {
    const loadTools = async () => {
      try {
        const loadedTools = await getToolsOrder();
        setTools(loadedTools);
      } catch (error) {
        console.error('Failed to load tools order:', error);
      }
    };
    
    loadTools();
    
    // Listen for toolsOrderUpdated event (e.g., from admin panel)
    const handleToolsUpdate = () => {
      loadTools();
    };
    
    window.addEventListener('toolsOrderUpdated', handleToolsUpdate);
    
    return () => {
      window.removeEventListener('toolsOrderUpdated', handleToolsUpdate);
    };
  }, []);

  const handleAvatarClick = () => {
    if (user) {
      setIsUserMenuOpen(!isUserMenuOpen);
    } else {
      onOpenUserMenu?.();
    }
  };

  return (
    <div className="w-[90px] bg-[#0a0a0a] flex flex-col h-full relative z-50">
      {/* Logo at top */}
      <div className="h-16 flex items-center justify-center px-2">
        <button onClick={() => onToolClick('explore')} className="hover:scale-110 transition-transform">
          <span className="logo-gradient" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 13, lineHeight: '20px', letterSpacing: '0.8px' }}>
            MyNook.AI
          </span>
        </button>
      </div>
      
      {/* 工具按钮区域 - 可滚动，从顶部开始 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2">
        <div className="flex flex-col gap-2">
            {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            
            return (
              <motion.button
                key={tool.id}
                onClick={() => onToolClick(tool.id)}
                disabled={tool.isComingSoon}
                className={`
                  relative w-full rounded-xl px-2 py-3 flex flex-col items-center gap-1 transition-all
                  ${isActive 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                    : tool.isComingSoon
                      ? 'text-[#404040] opacity-50 cursor-not-allowed'
                      : 'text-[#a0a0a0] hover:bg-[#2a2a2a]'
                  }
                `}
                whileHover={tool.isComingSoon ? {} : { scale: 1.05 }}
                whileTap={tool.isComingSoon ? {} : { scale: 0.95 }}
              >
                {/* Emoji 图标 */}
                <span className="text-2xl">{tool.emoji}</span>
                
                {/* 文字标签 */}
                <span 
                  className={`text-[10px] text-center leading-tight ${isActive ? 'text-white font-semibold' : 'text-inherit'}`}
                  style={{ fontFamily: 'Arial, sans-serif', whiteSpace: 'pre-line' }}
                >
                  {tool.shortName}
                </span>
                
                {/* Premium VIP 标记 */}
                {tool.isPremium && !isActive && (
                  <div className="absolute top-1 right-1">
                    <span className="text-sm">👑</span>
                  </div>
                )}
              </motion.button>
            );
            })}
        </div>
      </div>
      
      {/* 底部用户信息区 */}
      <div className="p-3 space-y-3">
        {user && (
          <>
            {/* Credits - 上下布局 */}
            <div className="flex flex-col items-center gap-1">
              <IconSparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400" style={{ fontFamily: 'Arial, sans-serif' }}>
                {user.credits}
              </span>
            </div>
            
            {/* Tier - 上下布局 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">
                {user.permissionLevel === 1 ? '🆓' :
                 user.permissionLevel === 2 ? '⭐' :
                 user.permissionLevel === 3 ? '👑' : '💼'}
              </span>
              <span className={`text-[10px] font-semibold ${
                user.permissionLevel === 1 ? 'text-slate-400' :
                user.permissionLevel === 2 ? 'text-blue-400' :
                user.permissionLevel === 3 ? 'text-purple-400' :
                'text-yellow-400'
              }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                {user.permissionLevel === 1 ? 'FREE' :
                 user.permissionLevel === 2 ? 'PRO' :
                 user.permissionLevel === 3 ? 'PREMIUM' : 'BUSINESS'}
              </span>
            </div>
            
            {/* User Avatar with Menu - 保持居中对齐 */}
            <div className="relative flex items-center justify-center">
              <button
                ref={avatarButtonRef}
                onClick={handleAvatarClick}
                className="transition-all hover:scale-110"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center font-bold text-xl">
                  🐱
                </div>
              </button>
              
              {/* FREE 用户订阅提示框 - 悬浮在右边，不影响头像位置 */}
              {user.permissionLevel === 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-pricing'));
                  }}
                  className="absolute left-full ml-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/40 hover:border-purple-400/80 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group shadow-lg whitespace-nowrap"
                  style={{ zIndex: 50 }}
                >
                  <span className="text-lg">👑</span>
                  <span className="text-[11px] font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-pink-200 transition-all" style={{ fontFamily: 'Arial, sans-serif' }}>
                    Upgrade
                  </span>
                </motion.button>
              )}
              
              {/* User Menu */}
              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                user={user}
                onLogout={onLogout}
                onNavigate={onNavigate}
                onPurchaseCredits={onPurchaseCredits}
                isPurchasing={isPurchasing}
                anchorRef={avatarButtonRef}
              />
            </div>
          </>
        )}
        
        {!user && (
          <button
            onClick={onOpenUserMenu}
            className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg text-xs text-[#a0a0a0] font-semibold transition-all"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

