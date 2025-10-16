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
          className={`fixed left-[90px] top-[60px] bottom-0 w-[600px] ${darkThemeClasses.bgSecondary} border-r ${darkThemeClasses.borderDefault} z-40 flex shadow-2xl`}
        >
          {/* 左侧：上传模块 */}
          <div className="w-[280px] border-r border-[#2a2a2a] flex flex-col">
            {/* 标题栏 */}
            <div className="h-14 border-b border-[#2a2a2a] px-4 flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${darkThemeClasses.textPrimary}`} style={{ fontFamily: 'Arial, sans-serif' }}>
                {toolName}
              </h3>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-lg ${darkThemeClasses.bgHover} ${darkThemeClasses.textSecondary} hover:text-white transition-colors flex items-center justify-center`}
              >
                <IconX />
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
            </div>
            
            {/* Generate 按钮 - 固定底部 */}
            <div className="p-4 border-t border-[#2a2a2a]">
              <button
                onClick={onGenerate}
                disabled={generateDisabled || isGenerating}
                className={`
                  w-full h-12 rounded-xl font-semibold text-white transition-all
                  ${generateDisabled || isGenerating
                    ? 'bg-[#333333] cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'
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
          
          {/* 右侧：模板选择 */}
          <div className="w-[320px] flex flex-col">
            {/* 选择器（如房间类型）*/}
            {selectorLabel && selectorOptions && (
              <div className="p-4 border-b border-[#2a2a2a]">
                <label className={`text-xs font-semibold ${darkThemeClasses.textSecondary} mb-2 block`} style={{ fontFamily: 'Arial, sans-serif' }}>
                  {selectorLabel}
                </label>
                <select
                  value={selectorValue}
                  onChange={(e) => onSelectorChange?.(e.target.value)}
                  className={`
                    w-full h-10 px-3 rounded-lg
                    ${darkThemeClasses.bgTertiary} 
                    border ${darkThemeClasses.borderLight}
                    ${darkThemeClasses.textPrimary}
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
            
            {/* 模板网格 - 可滚动 */}
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
                      <div className="aspect-[6/5] bg-[#2a2a2a]">
                        <img 
                          src={template.imageUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
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

