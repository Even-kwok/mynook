import React from 'react';
import { IconLock } from './Icons';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
  // FIX: Add 'type' prop to allow for different button types (e.g., 'submit').
  type?: 'button' | 'submit' | 'reset';
  // 锁定状态：显示锁图标，点击时触发 onLockedClick
  locked?: boolean;
  onLockedClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  primary = false, 
  className = '', 
  type = 'button',
  locked = false,
  onLockedClick
}) => {
    const baseClass = "px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2";
    
    // 锁定状态的样式
    const lockedClass = locked 
        ? "bg-slate-300 text-slate-600 cursor-pointer hover:bg-slate-400" 
        : disabled 
        ? "disabled:cursor-not-allowed" 
        : "";
    
    const themeClass = locked 
        ? "" // 锁定状态使用独立样式
        : primary 
        ? "relative bg-gradient-to-r from-indigo-600/90 to-cyan-600/90 backdrop-blur-md text-white border-2 border-indigo-400/50 hover:border-indigo-400/80 disabled:opacity-50 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300" 
        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-500";
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (locked && onLockedClick) {
            onLockedClick();
        } else if (onClick && !disabled && !locked) {
            onClick(event);
        }
    };
    
    return (
        <button
            onClick={handleClick}
            disabled={disabled && !locked}
            type={type}
            className={`${baseClass} ${themeClass} ${lockedClass} ${className}`}
        >
            {locked && <IconLock className="w-4 h-4" />}
            {children}
        </button>
    );
};