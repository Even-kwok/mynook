import React from 'react';
import { IconSparkles } from './Icons';

export const BannerHero: React.FC = () => {
  return (
    <div className="h-[180px] relative overflow-hidden">
      {/* 渐变背景 - 蓝到橙 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-cyan-500 to-orange-500" 
           style={{
             background: 'linear-gradient(90deg, rgb(30, 64, 175) 0%, rgb(14, 165, 233) 30%, rgb(6, 182, 212) 45%, rgb(245, 158, 11) 70%, rgb(249, 115, 22) 100%)'
           }} 
      />
      
      {/* 动态光效 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '1s' }} 
        />
      </div>
      
      {/* 内容区域 */}
      <div className="relative h-full flex items-center px-12 gap-6 z-10">
        {/* 左侧图标 */}
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
          <IconSparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        
        {/* 右侧文字 */}
        <div className="flex-1">
          <h2 className="text-white text-3xl font-bold mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
            Transform Your Space with AI
          </h2>
          <p className="text-white/80 text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
            Upload a photo, choose your style, and watch the magic happen →
          </p>
        </div>
        
        {/* 右侧快捷按钮 */}
        <button className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-semibold transition-all border border-white/30 shadow-lg hover:scale-105">
          Get Started
        </button>
      </div>
    </div>
  );
};

