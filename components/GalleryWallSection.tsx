import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HomeSection, PromptTemplate } from '../types';
import { getAllTemplatesPublic } from '../services/templateService';
import { useTemplate } from '../context/TemplateContext';

interface GalleryWallSectionProps {
  section: HomeSection;
  onNavigate: (page: string) => void;
}

export const GalleryWallSection: React.FC<GalleryWallSectionProps> = ({ section, onNavigate }) => {
  const [allTemplates, setAllTemplates] = useState<PromptTemplate[]>([]);
  const [displayedTemplates, setDisplayedTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setPreselectedTemplate } = useTemplate();
  
  const BATCH_SIZE = 21; // 3列×7行

  useEffect(() => {
    loadTemplates();
    const cleanup = startAutoScroll();
    return cleanup;
  }, [section.gallery_filter_type, section.gallery_main_category, section.gallery_sub_category]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = (data: any): PromptTemplate[] => {
    const templates: PromptTemplate[] = [];
    
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
    
    return templates;
  };

  const shuffleArray = (array: PromptTemplate[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || isLoading) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // 当滚动到距离末尾200px时，加载更多
    if (scrollWidth - (scrollLeft + clientWidth) < 200) {
      loadMoreTemplates();
    }
  };

  const loadMoreTemplates = () => {
    if (displayedTemplates.length >= allTemplates.length) return;
    
    const nextBatch = allTemplates.slice(
      displayedTemplates.length,
      displayedTemplates.length + BATCH_SIZE
    );
    setDisplayedTemplates([...displayedTemplates, ...nextBatch]);
  };

  const startAutoScroll = () => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += 0.5; // 缓慢滚动
      }
    }, 30);
    
    return () => clearInterval(interval);
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

  if (displayedTemplates.length === 0 && !isLoading) {
    return (
      <div className="relative overflow-hidden py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center text-slate-400">
          <p>No templates found for the selected filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      {/* 标题区 */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-5xl font-bold text-white mb-4">
          {section.title}
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          {section.subtitle}
        </p>
      </div>
      
      {/* 图片墙容器 */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto px-8 pb-4 hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* 3列布局 */}
        {[0, 1, 2].map(colIndex => (
          <div 
            key={colIndex}
            className="flex flex-col gap-6 flex-shrink-0"
            style={{ 
              transform: `translateY(${colIndex % 2 === 0 ? '0' : '40px'})` 
            }}
          >
            {displayedTemplates
              .filter((_, idx) => idx % 3 === colIndex)
              .map(template => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  onClick={() => handleTemplateClick(template)}
                  className="relative w-[360px] h-[360px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
                >
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <p className="text-white text-lg font-semibold mb-2">{template.name}</p>
                    <p className="text-slate-300 text-sm">{template.category}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        ))}
      </div>
      
      {/* 按钮 */}
      <div className="text-center mt-12">
        <button
          onClick={() => onNavigate(section.button_link)}
          className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          {section.button_text}
        </button>
      </div>
    </div>
  );
};

