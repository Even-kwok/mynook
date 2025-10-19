/**
 * 模板选择上下文
 * 全局管理模板预选状态，用于从Gallery Wall跳转到功能页面时自动选中模板
 */

import React, { createContext, useContext, useState } from 'react';

interface TemplateContextType {
  preselectedTemplateId: string | null;
  preselectedCategory: string | null;
  setPreselectedTemplate: (templateId: string, category: string) => void;
  clearPreselectedTemplate: () => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);

  const setPreselectedTemplate = (templateId: string, category: string) => {
    setPreselectedTemplateId(templateId);
    setPreselectedCategory(category);
    console.log('🎯 Template preselected:', { templateId, category });
  };

  const clearPreselectedTemplate = () => {
    setPreselectedTemplateId(null);
    setPreselectedCategory(null);
  };

  return (
    <TemplateContext.Provider value={{
      preselectedTemplateId,
      preselectedCategory,
      setPreselectedTemplate,
      clearPreselectedTemplate,
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within TemplateProvider');
  }
  return context;
};

