import React from 'react';
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

const tools: ToolItem[] = [
  { id: 'interior', name: 'Interior Design', shortName: 'Interior', emoji: '🛋️', isPremium: false }, 
  { id: 'exterior', name: 'Exterior Design', shortName: 'Exterior', emoji: '🏠', isPremium: false },
  { id: 'wall', name: 'Wall Design', shortName: 'Wall', emoji: '🎨', isPremium: false },
  { id: 'floor', name: 'Floor Style', shortName: 'Floor', emoji: '🪵', isPremium: false },
  { id: 'garden', name: 'Garden & Backyard Design', shortName: 'Garden', emoji: '🌳', isPremium: false },
  { id: 'festive', name: 'Festive Decor', shortName: 'Festive', emoji: '🎁', isPremium: false },
  { id: 'item-replace', name: 'Item Replace', shortName: 'Replace', emoji: '➕', isPremium: true },
  { id: 'style-match', name: 'Reference Style Match', shortName: 'Style\nMatch', emoji: '🎯', isPremium: true },
  { id: 'ai-advisor', name: 'AI Design Advisor', shortName: 'AI\nAdvisor', emoji: '💬', isComingSoon: true },
  { id: 'multi-item', name: 'Multi-Item Preview', shortName: 'Multi\nItem', emoji: '📦', isComingSoon: true },
  { id: 'free-canvas', name: 'Free Canvas', shortName: 'Canvas', emoji: '✏️', isPremium: true },
];

export interface LeftToolbarProps {
  activeTool: string | null;
  onToolClick: (toolId: string) => void;
  user: any;
  onOpenUserMenu?: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onToolClick,
  user,
  onOpenUserMenu,
}) => {
  return (
    <div className="w-[90px] bg-[#0a0a0a] flex flex-col h-full">
      {/* Logo at top */}
      <div className="h-16 flex items-center justify-center">
        <button onClick={() => onToolClick('explore')} className="text-white hover:text-indigo-400 transition-colors font-bold text-xl">
          MN
        </button>
      </div>
      
      {/* 工具按钮区域 - 可滚动，居中对齐 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2 flex items-center">
        <div className="w-full">
          <div className="flex flex-col gap-2">
            {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            
            return (
              <motion.button
                key={tool.id}
                onClick={() => onToolClick(tool.id)}
                className={`
                  relative w-full rounded-xl px-2 py-3 flex flex-col items-center gap-1 transition-all
                  ${isActive 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                    : 'text-[#a0a0a0] hover:bg-[#2a2a2a]'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                
                {/* Premium 标记 */}
                {tool.isPremium && !isActive && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px]">👑</span>
                  </div>
                )}
                
                {/* Coming Soon 标记 */}
                {tool.isComingSoon && !isActive && (
                  <div className="absolute top-1 right-1 text-[8px] bg-slate-600 px-1 rounded">
                    🔜
                  </div>
                )}
              </motion.button>
            );
            })}
          </div>
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
            
            {/* User Avatar - 只显示圆形 */}
            <button
              onClick={onOpenUserMenu}
              className="w-full flex items-center justify-center transition-all hover:scale-110"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center font-bold text-xl">
                🐱
              </div>
            </button>
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

