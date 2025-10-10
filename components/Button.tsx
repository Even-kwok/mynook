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
        ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400" 
        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-500";
    
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