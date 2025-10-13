import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, primary = false, className = '' }) => {
    const baseClass = "px-5 py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md disabled:shadow-sm";
    const themeClass = primary 
        ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500" 
        : "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400 border border-gray-200";
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${themeClass} ${className}`}
        >
            {children}
        </button>
    );
};