import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconSparkles, IconUpload } from './Icons';
import { darkThemeClasses } from '../config/darkTheme';
import { PromptTemplate } from '../types';

interface SlidingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  
  // 上传模块
  imageUrl: string | null;
  isUploading: boolean;
  onFileSelect: () => void;
  onRemoveImage: () => void;
  onImageClick?: (url: string) => void;
  onDrop?: (e: React.DragEvent) => void;
  
  // 选择器（如房间类型）
  selectorLabel?: string;
  selectorOptions?: Array<{ id: string; name: string }>;
  selectorValue?: string;
  onSelectorChange?: (value: string) => void;
  
  // 模板列表
  templates: PromptTemplate[];
  selectedTemplateIds: string[];
  onTemplateSelect: (templateId: string) => void;
  maxTemplates?: number;
  
  // 生成按钮
  onGenerate: () => void;
  isGenerating: boolean;
  generateDisabled: boolean;
}

export const SlidingPanel: React.FC<SlidingPanelProps> = ({
  isOpen,
  onClose,
  toolName,
  imageUrl,
  isUploading,
  onFileSelect,
  onRemoveImage,
  onImageClick,
  onDrop,
  selectorLabel,
  selectorOptions,
  selectorValue,
  onSelectorChange,
  templates,
  selectedTemplateIds,
  onTemplateSelect,
  maxTemplates = 1,
  onGenerate,
  isGenerating,
  generateDisabled,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -600 }}
          animate={{ x: 0 }}
          exit={{ x: -600 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-[90px] top-0 bottom-0 w-[600px] bg-[#0a0a0a] z-10 flex"
        >
          {/* 左侧：上传模块 */}
          <div className="w-[280px] flex flex-col">
            {/* 标题栏 - 渐变下划线设计 */}
            <div className="px-4 pt-4 pb-3 relative">
              <div className="flex items-center justify-center pb-2 relative">
                <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {toolName}
                </h3>
                {/* 渐变下划线 */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg hover:bg-[#2a2a2a] text-[#666666] hover:text-white transition-colors flex items-center justify-center"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            
            {/* 上传区域 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {/* 图片上传 */}
              <div>
                <label className={`text-xs font-semibold ${darkThemeClasses.textSecondary} mb-2 block`} style={{ fontFamily: 'Arial, sans-serif' }}>
                  📤 Upload Photo
                </label>
                <div
                  onClick={!imageUrl && !isUploading ? onFileSelect : undefined}
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`
                    relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer
                    ${imageUrl 
                      ? 'border-[#333333]' 
                      : 'border-[#404040] hover:border-indigo-500/50 hover:bg-[#333333]'
                    }
                    ${darkThemeClasses.bgTertiary}
                  `}
                >
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt="Uploaded" 
                        className="w-full h-full object-cover rounded-xl cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onImageClick) onImageClick(imageUrl);
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage();
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <IconX />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666666]">
                      <IconUpload className="w-12 h-12 mb-2" />
                      <p className="text-xs">Click or drag</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 选择器（如房间类型）- 放在图片下方 */}
              {selectorLabel && selectorOptions && (
                <div>
                  <label className={`text-xs font-semibold ${darkThemeClasses.textSecondary} mb-2 block`} style={{ fontFamily: 'Arial, sans-serif' }}>
                    {selectorLabel}
                  </label>
                  <select
                    value={selectorValue}
                    onChange={(e) => onSelectorChange?.(e.target.value)}
                    className={`
                      w-full h-10 px-3 rounded-lg
                      bg-[#0a0a0a]
                      border border-[#333333]
                      text-white
                      focus:border-indigo-500 focus:outline-none
                      text-sm
                    `}
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    {selectorOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 未来：Text输入区域 */}
              {/* <div>
                <label className="text-xs font-semibold text-[#a0a0a0] mb-2 block">
                  💬 Describe (Optional)
                </label>
                <textarea 
                  className="w-full h-20 px-3 py-2 bg-[#2a2a2a] border border-[#333333] rounded-xl text-white text-sm resize-none"
                  placeholder="Describe what you want..."
                />
              </div> */}
              
              {/* Generate 按钮 - 跟随内容 */}
              <div className="mt-6">
                <button
                  onClick={onGenerate}
                  disabled={generateDisabled || isGenerating}
                  className={`
                    w-full h-12 rounded-xl font-semibold text-white transition-all
                    ${generateDisabled || isGenerating
                      ? 'bg-[#333333] cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105'
                    }
                  `}
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <IconSparkles className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : selectedTemplateIds.length > 1 ? `Generate (${selectedTemplateIds.length} Credits)` : 'Generate (1 Credit)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧：模板选择 - 顶天立地 */}
          <div className="w-[320px] flex flex-col">
            {/* 模板网格 - 顶天立地，可滚动 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
              <div className="space-y-4">
                {templates.map((template) => {
                  const isSelected = selectedTemplateIds.includes(template.id);
                  const canSelect = isSelected || selectedTemplateIds.length < maxTemplates;
                  
                  return (
                    <div
                      key={template.id}
                      onClick={() => canSelect && onTemplateSelect(template.id)}
                      className={`
                        relative rounded-xl overflow-hidden cursor-pointer transition-all
                        ${isSelected 
                          ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/50 scale-105' 
                          : canSelect
                            ? 'ring-1 ring-[#333333] hover:ring-indigo-500/50 hover:scale-102'
                            : 'ring-1 ring-[#333333] opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      {/* 图片 */}
                      <div className="aspect-[6/5] bg-[#2a2a2a] relative flex items-center justify-center">
                        <img 
                          src={template.imageUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* 占位图标 - 当图片加载失败时显示 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* 标题 */}
                      <div className={`p-3 ${darkThemeClasses.bgTertiary}`}>
                        <p className={`text-sm font-medium ${isSelected ? 'text-white' : darkThemeClasses.textSecondary}`} style={{ fontFamily: 'Arial, sans-serif' }}>
                          {template.name}
                        </p>
                      </div>
                      
                      {/* 选中标记 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

