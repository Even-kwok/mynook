import React, { useState } from 'react';
import { IconSparkles } from '@tabler/icons-react';

interface TemplateImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
    fallbackIcon?: React.ReactNode;
}

/**
 * 模板图片组件 - 带优雅的占位符回退
 * 
 * 特性：
 * - 图片加载失败时显示渐变背景 + 图标 + 名称
 * - 加载中显示动画
 * - 不依赖外部占位符服务
 */
export const TemplateImageWithFallback: React.FC<TemplateImageWithFallbackProps> = ({ 
    src, 
    alt, 
    className = '',
    fallbackIcon 
}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // 如果图片加载失败或URL是占位符链接，显示优雅的占位符
    const shouldShowFallback = imageError || 
        src.includes('placeholder.com') || 
        src.includes('placeholder.cn') ||
        !src ||
        src === '';
    
    if (shouldShowFallback) {
        return (
            <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6 relative overflow-hidden group`}>
                {/* 动画背景效果 */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
                
                {/* 装饰性图案 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                
                {/* 主要内容 */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    {/* 图标 */}
                    <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
                        {fallbackIcon || <IconSparkles className="w-12 h-12 text-white/90" strokeWidth={1.5} />}
                    </div>
                    
                    {/* 模板名称 */}
                    <div 
                        className="text-sm font-semibold text-center px-4 leading-snug"
                        style={{ 
                            fontFamily: 'Arial, sans-serif',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        {alt}
                    </div>
                    
                    {/* 小标签 */}
                    <div className="mt-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                        Preview
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative w-full h-full">
            {/* 加载中状态 */}
            {isLoading && (
                <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200`}>
                    <div className="flex flex-col items-center space-y-3">
                        {/* 加载动画 */}
                        <div className="relative">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <IconSparkles className="w-4 h-4 text-indigo-400" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Loading...</div>
                    </div>
                </div>
            )}
            
            {/* 实际图片 */}
            <img 
                src={src}
                alt={alt}
                className={`${className} ${isLoading ? 'hidden' : 'block'} object-cover`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setImageError(true);
                }}
                loading="lazy"
            />
        </div>
    );
};

