import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HomeSection, PromptTemplate } from '../types';
import { getAllTemplatesPublic } from '../services/templateService';
import { useTemplate } from '../context/TemplateContext';
import { IconChevronLeft, IconChevronRight } from './Icons';

interface GalleryWallSectionProps {
  section: HomeSection;
  onNavigate: (page: string) => void;
}

export const GalleryWallSection: React.FC<GalleryWallSectionProps> = ({ section, onNavigate }) => {
  const [allTemplates, setAllTemplates] = useState<PromptTemplate[]>([]);
  const [displayedTemplates, setDisplayedTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setPreselectedTemplate } = useTemplate();
  
  const BATCH_SIZE = 30; // 一次加载30张

  useEffect(() => {
    loadTemplates();
  }, [section.gallery_filter_type, section.gallery_main_category, section.gallery_sub_category]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllTemplatesPublic();
      
      // 根据section配置过滤模板
      let filtered = filterTemplates(data);
      
      // 随机打乱（如果需要）
      if (section.gallery_filter_type?.includes('random')) {
        filtered = shuffleArray(filtered);
      }
      
      setAllTemplates(filtered);
      setDisplayedTemplates(filtered.slice(0, BATCH_SIZE));
    } catch (error) {
      console.error('Failed to load templates:', error);
      setError('Failed to load templates. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = (data: any): PromptTemplate[] => {
    const templates: PromptTemplate[] = [];
    
    try {
      Object.entries(data).forEach(([mainCat, subCats]: [string, any]) => {
        if (section.gallery_filter_type === 'all_random') {
          // 全部分类随机
          subCats.forEach((sub: any) => {
            templates.push(...sub.templates);
          });
        } else if (section.gallery_filter_type === 'main_category' && section.gallery_main_category === mainCat) {
          // 特定主分类
          subCats.forEach((sub: any) => {
            templates.push(...sub.templates);
          });
        } else if (section.gallery_filter_type === 'sub_category' && section.gallery_main_category === mainCat) {
          // 特定二级分类
          const targetSub = subCats.find((sub: any) => sub.name === section.gallery_sub_category);
          if (targetSub) {
            templates.push(...targetSub.templates);
          }
        } else if (section.gallery_filter_type === 'main_random' && section.gallery_main_category === mainCat) {
          // 该类目随机
          subCats.forEach((sub: any) => {
            templates.push(...sub.templates);
          });
        }
      });
    } catch (error) {
      console.error('Error filtering templates:', error);
    }
    
    // 只返回有图片的模板
    return templates.filter(t => t.imageUrl && t.imageUrl.trim() !== '');
  };

  const shuffleArray = (array: PromptTemplate[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleTemplateClick = (template: PromptTemplate) => {
    // 设置预选模板
    setPreselectedTemplate(template.id, template.category || 'Interior Design');
    
    // 跳转到对应功能页面
    const pageMap: Record<string, string> = {
      'Interior Design': 'Interior Design',
      'Exterior Design': 'Exterior Design',
      'Garden & Backyard Design': 'Garden & Backyard Design',
      'Festive Decor': 'Festive Decor',
      'Wall Paint': 'Wall Design',
      'Floor Style': 'Floor Style',
    };
    
    const targetPage = pageMap[template.category || 'Interior Design'] || 'Interior Design';
    onNavigate(targetPage);
  };

  // 左右滑动按钮处理
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -800, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 800, behavior: 'smooth' });
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="relative overflow-hidden py-8">
        <div className="text-center text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="relative overflow-hidden py-8">
        <div className="text-center text-red-400">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadTemplates}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (displayedTemplates.length === 0) {
    return (
      <div className="relative overflow-hidden py-8">
        <div className="text-center text-slate-400">
          <p>No templates found for the selected filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] mt-32">
      {/* 左侧滑动按钮 */}
      <button
        onClick={scrollLeft}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white p-3 rounded-full shadow-xl transition-all hover:scale-110 pointer-events-auto"
        aria-label="Scroll left"
      >
        <IconChevronLeft className="w-6 h-6 text-slate-800" />
      </button>

      {/* 右侧滑动按钮 */}
      <button
        onClick={scrollRight}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white p-3 rounded-full shadow-xl transition-all hover:scale-110 pointer-events-auto"
        aria-label="Scroll right"
      >
        <IconChevronRight className="w-6 h-6 text-slate-800" />
      </button>

      {/* 图片墙容器 - 3行横向滚动 */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto hide-scrollbar px-16"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col gap-4">
          {/* 3行布局 */}
          {[0, 1, 2].map(rowIndex => (
            <div 
              key={rowIndex}
              className="flex gap-4"
            >
            {displayedTemplates
              .filter((_, idx) => idx % 3 === rowIndex)
              .map(template => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleTemplateClick(template)}
                  className="relative w-[280px] h-[280px] rounded-xl overflow-hidden shadow-lg cursor-pointer group flex-shrink-0"
                >
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-base font-semibold mb-1">{template.name}</p>
                    <p className="text-slate-300 text-xs">{template.category}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

