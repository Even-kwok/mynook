/**
 * 深色主题配置
 * 基于用户提供的参考设计
 */

export const darkTheme = {
  // 背景色
  background: {
    primary: '#0a0a0a',      // 纯黑背景（主工作区）
    secondary: '#1a1a1a',    // 深灰（侧边栏、面板）
    tertiary: '#2a2a2a',     // 稍浅灰（卡片、输入框）
    hover: '#333333',        // 悬停状态
  },
  
  // 文字颜色
  text: {
    primary: '#ffffff',      // 主要文字（白色）
    secondary: '#a0a0a0',    // 次要文字（灰色）
    tertiary: '#666666',     // 辅助文字（深灰）
    disabled: '#404040',     // 禁用文字
  },
  
  // 边框颜色
  border: {
    default: '#2a2a2a',      // 默认边框
    light: '#333333',        // 浅边框
    focus: '#4a4a4a',        // 聚焦边框
  },
  
  // 强调色
  accent: {
    primary: '#6366f1',      // indigo-500
    hover: '#4f46e5',        // indigo-600
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
  },
  
  // 状态颜色
  status: {
    success: '#10b981',      // 成功（绿色）
    warning: '#f59e0b',      // 警告（橙色）
    error: '#ef4444',        // 错误（红色）
    info: '#3b82f6',         // 信息（蓝色）
    premium: '#f59e0b',      // Premium（金色）
  },
  
  // 阴影
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.6)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowHover: '0 0 30px rgba(99, 102, 241, 0.5)',
  }
} as const;

// Tailwind class names for easy usage
export const darkThemeClasses = {
  // 背景
  bgPrimary: 'bg-[#0a0a0a]',
  bgSecondary: 'bg-[#1a1a1a]',
  bgTertiary: 'bg-[#2a2a2a]',
  bgHover: 'hover:bg-[#333333]',
  
  // 文字
  textPrimary: 'text-white',
  textSecondary: 'text-[#a0a0a0]',
  textTertiary: 'text-[#666666]',
  textDisabled: 'text-[#404040]',
  
  // 边框
  borderDefault: 'border-[#2a2a2a]',
  borderLight: 'border-[#333333]',
  borderFocus: 'focus:border-[#4a4a4a]',
  
  // 强调
  accentPrimary: 'bg-indigo-600',
  accentHover: 'hover:bg-indigo-700',
  accentText: 'text-indigo-500',
  
  // 工具栏图标状态
  iconDefault: 'text-[#666666]',
  iconHover: 'hover:text-white hover:bg-[#2a2a2a]',
  iconActive: 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white',
} as const;

