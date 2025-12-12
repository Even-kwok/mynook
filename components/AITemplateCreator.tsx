import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconUpload, IconSparkles, IconX, IconRefresh, IconCheck, IconPlayerPlay, IconPlayerPause } from './Icons';
import { toBase64, cropToSquareThumbnail } from '../utils/imageUtils';
import { Button } from './Button';
import { supabase } from '../config/supabase';

// Icons for Play/Pause since they might not be in Icons.tsx yet, defining simple SVGs here or assuming existence
const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);
const PauseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
  </svg>
);

type ProcessStatus = 'pending' | 'analyzing' | 'generating' | 'compressing' | 'saving' | 'success' | 'failed' | 'paused';

interface ExtractedData {
  templateName: string;
  mainCategory: string;
  secondaryCategory: string;
  styleDescription: string;
  fullPrompt: string;
}

interface QueueItem {
  id: string;
  file: File; // Style reference image
  status: ProcessStatus;
  originalPreviewUrl: string; // Local blob url for display
  generatedPreviewUrl?: string; // Result from Gemini
  extractedData?: ExtractedData;
  error?: string;
}

interface CategoryInfo {
  name: string;
  description: string;
}

interface AITemplateCreatorProps {
  onTemplatesUpdated?: () => void | Promise<void>;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Interior Design': '室内设计和装修',
  'Exterior Design': '建筑外观设计',
  'Wall Paint': '墙面颜色和涂料',
  'Wall Design': '墙面设计和装饰',
  'Floor Style': '地板材质和风格',
  'Garden & Backyard Design': '花园和户外景观',
  'Festive Decor': '节日装饰和主题',
  'Item Replace': '物品替换和更新',
  'Reference Style Match': '参考风格匹配',
  'Free Canvas': '自由创作画布',
};

export const AITemplateCreator: React.FC<AITemplateCreatorProps> = ({ onTemplatesUpdated }) => {
  // Global State
  const [baseImage, setBaseImage] = useState<string | null>(null); // Base64
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null); // Display URL
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const processingCountRef = useRef(0);
  const MAX_CONCURRENT = 6; // API limit for concurrent generation

  // Configuration State
  const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Sub-category config
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [autoDetectSubCategory, setAutoDetectSubCategory] = useState<boolean>(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [customSubCategory, setCustomSubCategory] = useState<string>('');

  const baseImageInputRef = useRef<HTMLInputElement>(null);
  const styleImageInputRef = useRef<HTMLInputElement>(null);
  const refreshTemplatesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NOTE: AITemplateCreator is currently used inside AdminPage.
  // AdminPage already has `onTemplatesUpdated` which triggers a full reload from Supabase.
  // We debounce refresh to avoid triggering a full reload for every single item in a big batch.
  const scheduleTemplatesRefresh = useCallback((onTemplatesUpdated?: () => void | Promise<void>) => {
    if (refreshTemplatesTimerRef.current) {
      clearTimeout(refreshTemplatesTimerRef.current);
    }
    refreshTemplatesTimerRef.current = setTimeout(() => {
      if (onTemplatesUpdated) {
        Promise.resolve(onTemplatesUpdated()).catch((err) => {
          console.error('Failed to refresh template data:', err);
        });
        return;
      }
      // Fallback for legacy usage (in case a parent wants to listen globally).
      window.dispatchEvent(new CustomEvent('mynook:templates-updated'));
    }, 1200);
  }, []);

  // --- Initialization ---

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTemplatesTimerRef.current) {
        clearTimeout(refreshTemplatesTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCategories.length > 0) {
      loadSubCategories(selectedCategories);
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedCategories]);

  // --- Data Loading ---

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase.from('design_templates').select('main_category');
      if (error) throw error;
      
      const categories = (data as any[] || [])
        .map((item: any) => item.main_category)
        .filter((cat): cat is string => Boolean(cat));
      const uniqueCategories = [...new Set(categories)] as string[];
      
      const categoryList: CategoryInfo[] = uniqueCategories.map(cat => ({
        name: cat,
        description: CATEGORY_DESCRIPTIONS[cat] || '',
      }));
      
      setAvailableCategories(categoryList);
      setSelectedCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadSubCategories = async (mainCategories: string[]) => {
    try {
      const { data, error } = await supabase
        .from('design_templates')
        .select('sub_category, main_category, room_type');

      if (error) throw error;
      
      const subCats = (data as any[] || [])
        .filter((item: any) => mainCategories.includes(item.main_category))
        .flatMap((item: any) => {
          const cats: string[] = [];
          if (item.sub_category) cats.push(item.sub_category);
          if (item.room_type) cats.push(item.room_type);
          return cats;
        })
        .filter(Boolean);
      
      const uniqueSubCats = [...new Set(subCats)] as string[];
      setAvailableSubCategories(uniqueSubCats.sort());
    } catch (error) {
      console.error('Failed to load sub-categories:', error);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  // --- Handlers ---

  const handleBaseImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await toBase64(file);
      setBaseImage(base64);
      setBaseImagePreview(URL.createObjectURL(file));
    } catch (error) {
      alert('Failed to load base image');
    }
  };

  const handleStyleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!baseImage) {
      alert('请先上传标准底图 (Base Image)！');
      return;
    }

    if (selectedCategories.length === 0) {
      alert('请至少选择一个允许的分类范围！');
      return;
    }

    // Limit to 70 as per requirement
    const validFiles = files.slice(0, 70);
    if (files.length > 70) {
      alert('最多一次只能上传70张参考图，已自动截取前70张。');
    }

    const newItems: QueueItem[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      originalPreviewUrl: URL.createObjectURL(file),
    }));

    setQueue(prev => [...prev, ...newItems]);
    setIsPaused(false); // Auto start
  };

  // --- Queue Processing Engine ---

  const updateItemStatus = (id: string, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const processItem = async (item: QueueItem) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // 1. Analyze Style
      updateItemStatus(item.id, { status: 'analyzing', error: undefined });
      const originalBase64 = await toBase64(item.file);
      
      const analyzeRes = await fetch('/api/analyze-style', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalImage: originalBase64,
          allowedCategories: selectedCategories,
          autoDetectSubCategory,
          manualSubCategory: autoDetectSubCategory 
            ? null 
            : (customSubCategory.trim() || selectedSubCategory || null),
        }),
      });
      
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const { extracted } = await analyzeRes.json();
      updateItemStatus(item.id, { extractedData: extracted });

      // 2. Generate Preview
      updateItemStatus(item.id, { status: 'generating' });
      const generateRes = await fetch('/api/generate-preview', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          baseImage: baseImage, // The standard room image
          prompt: extracted.fullPrompt,
        }),
      });

      if (!generateRes.ok) {
        const err = await generateRes.json();
        throw new Error(err.error || 'Generation failed');
      }
      const { imageUrl: generatedImageUrl } = await generateRes.json();
      updateItemStatus(item.id, { generatedPreviewUrl: generatedImageUrl });

      // 3. Compress
      updateItemStatus(item.id, { status: 'compressing' });
      const compressedImage = await cropToSquareThumbnail(generatedImageUrl, 360, 0.85);

      // 4. Save
      updateItemStatus(item.id, { status: 'saving' });
      const saveRes = await fetch('/api/save-template', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateName: extracted.templateName,
          mainCategory: extracted.mainCategory,
          secondaryCategory: extracted.secondaryCategory,
          fullPrompt: extracted.fullPrompt,
          thumbnailImage: compressedImage,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Save failed');
      }

      // Let other parts of the app refresh template lists (debounced).
      scheduleTemplatesRefresh(onTemplatesUpdated);
      updateItemStatus(item.id, { status: 'success' });

    } catch (error) {
      console.error('Processing error:', error);
      updateItemStatus(item.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      processingCountRef.current--;
      triggerProcessing(); // Try to start next
    }
  };

  const triggerProcessing = useCallback(() => {
    if (isPaused) return;

    setQueue(currentQueue => {
      // We need to count how many are *currently* active based on state
      // But React state update is async, so we use ref for immediate counting
      // Actually, relying on ref for concurrency is safer.
      
      const pendingItems = currentQueue.filter(i => i.status === 'pending');
      if (pendingItems.length === 0) return currentQueue;

      let startedCount = 0;
      // Try to fill slots
      while (processingCountRef.current < MAX_CONCURRENT && pendingItems.length > 0) {
        const nextItem = pendingItems.shift(); // Remove from local array
        if (nextItem) {
            processingCountRef.current++;
            processItem(nextItem); // Start async process
            startedCount++;
        }
      }

      return currentQueue; // State doesn't change here, processItem will update it
    });
  }, [isPaused, baseImage, selectedCategories, autoDetectSubCategory, customSubCategory, selectedSubCategory]);

  // Trigger whenever queue length changes or paused state changes
  useEffect(() => {
    triggerProcessing();
  }, [queue.length, isPaused, triggerProcessing]);


  const handleRetry = (id: string) => {
    updateItemStatus(id, { status: 'pending', error: undefined });
    // Trigger will pick it up
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有任务吗？正在处理的任务将在后台继续完成。')) {
      setQueue([]);
      processingCountRef.current = 0;
    }
  };

  // --- Render ---

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Base Image Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">1</span>
              设置标准底图 (Base Image)
            </h3>
            <div className="space-y-4">
              <div 
                className={`relative aspect-square rounded-lg border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  baseImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
                onClick={() => baseImageInputRef.current?.click()}
              >
                {baseImagePreview ? (
                  <img src={baseImagePreview} alt="Base" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <IconUpload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 text-center px-4">
                      点击上传标准房间图<br/>(AI将把所有风格套用在此图上)
                    </span>
                  </>
                )}
                <input 
                  ref={baseImageInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleBaseImageSelect}
                  className="hidden" 
                />
              </div>
              {baseImage && (
                <button 
                  onClick={() => baseImageInputRef.current?.click()}
                  className="w-full text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  更换底图
                </button>
              )}
            </div>
          </div>

          {/* 2. Category Configuration */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">2</span>
              配置分类范围
            </h3>
            
            {/* Main Categories */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">主分类 (Main Category)</label>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setSelectedCategories(availableCategories.map(c => c.name))} className="text-indigo-600">全选</button>
                  <button onClick={() => setSelectedCategories([])} className="text-slate-500">清空</button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {availableCategories.map(cat => (
                  <label key={cat.name} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCategories([...selectedCategories, cat.name]);
                        else setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sub Categories */}
            <div className="border-t pt-4">
               <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetectSubCategory}
                  onChange={(e) => setAutoDetectSubCategory(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-900">AI自动识别二级分类</span>
              </label>

              {!autoDetectSubCategory && (
                <div className="space-y-3 pl-6 border-l-2 border-slate-100">
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => {
                      setSelectedSubCategory(e.target.value);
                      setCustomSubCategory('');
                    }}
                    className="w-full text-sm border-slate-300 rounded-lg"
                  >
                    <option value="">-- 选择现有 --</option>
                    {availableSubCategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customSubCategory}
                    onChange={(e) => {
                      setCustomSubCategory(e.target.value);
                      setSelectedSubCategory('');
                    }}
                    placeholder="或输入新分类名称..."
                    className="w-full text-sm border-slate-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Batch Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">3</span>
              批量上传风格参考图
            </h3>
            
            <div className={`text-center p-6 border-2 border-dashed rounded-xl transition-colors ${
              !baseImage ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 cursor-pointer'
            }`}>
              <IconSparkles className="mx-auto h-10 w-10 text-indigo-400 mb-3" />
              <p className="text-sm text-slate-600 mb-4">
                {baseImage ? '选择多张风格参考图片 (Max 70)' : '请先在上方设置标准底图'}
              </p>
              <Button
                onClick={() => styleImageInputRef.current?.click()}
                disabled={!baseImage}
                primary
                className="w-full"
              >
                选择图片
              </Button>
              <input 
                ref={styleImageInputRef}
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleStyleImagesSelect}
                className="hidden" 
                disabled={!baseImage}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Queue & Status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-slate-900">生成队列 ({queue.length})</h3>
                <div className="flex gap-2 text-xs font-medium">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    处理中: {queue.filter(i => ['analyzing', 'generating', 'compressing', 'saving'].includes(i.status)).length}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    完成: {queue.filter(i => i.status === 'success').length}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    失败: {queue.filter(i => i.status === 'failed').length}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPaused(!isPaused);
                    if (isPaused) triggerProcessing(); // Resume immediately
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isPaused 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                  disabled={queue.length === 0 || queue.every(i => i.status === 'success')}
                >
                  {isPaused ? <><PlayIcon className="w-4 h-4"/> 继续</> : <><PauseIcon className="w-4 h-4"/> 暂停</>}
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                  disabled={queue.length === 0}
                >
                  清空
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[800px]">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <IconSparkles className="w-12 h-12 mb-4 opacity-20" />
                  <p>任务队列空闲</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queue.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 flex gap-3 bg-white hover:shadow-md transition-shadow">
                      {/* Left: Original Ref */}
                      <div className="w-20 h-20 flex-shrink-0 relative">
                        <img src={item.originalPreviewUrl} className="w-full h-full object-cover rounded bg-slate-100" alt="Ref" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">参考图</span>
                      </div>

                      {/* Middle: Status & Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-slate-900 text-sm truncate" title={item.file.name}>
                              {item.extractedData?.templateName || item.file.name}
                            </h4>
                            {item.status === 'failed' && (
                              <button onClick={() => handleRetry(item.id)} className="text-indigo-600 hover:text-indigo-700" title="重试">
                                <IconRefresh className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {item.extractedData?.mainCategory || '等待分析...'}
                            {item.extractedData?.secondaryCategory && ` / ${item.extractedData.secondaryCategory}`}
                          </p>
                        </div>

                        {/* Status Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            <span>
                              {item.status === 'pending' && '等待中'}
                              {item.status === 'analyzing' && '正在分析风格...'}
                              {item.status === 'generating' && 'AI 绘制中...'}
                              {item.status === 'compressing' && '压缩处理...'}
                              {item.status === 'saving' && '正在入库...'}
                              {item.status === 'success' && '已完成'}
                              {item.status === 'failed' && '失败'}
                              {item.status === 'paused' && '已暂停'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.status === 'success' ? 'bg-green-500' :
                                item.status === 'failed' ? 'bg-red-500' :
                                item.status === 'pending' ? 'bg-slate-300' :
                                'bg-indigo-500 animate-pulse'
                              }`}
                              style={{
                                width: 
                                  item.status === 'pending' ? '0%' :
                                  item.status === 'analyzing' ? '25%' :
                                  item.status === 'generating' ? '50%' :
                                  item.status === 'compressing' ? '75%' :
                                  item.status === 'saving' ? '90%' :
                                  '100%'
                              }}
                            />
                          </div>
                          {item.error && (
                            <p className="text-[10px] text-red-500 truncate" title={item.error}>
                              {item.error}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Result Preview */}
                      <div className="w-20 h-20 flex-shrink-0 relative border border-slate-100 rounded bg-slate-50 flex items-center justify-center">
                        {item.generatedPreviewUrl ? (
                          <>
                            <img src={item.generatedPreviewUrl} className="w-full h-full object-cover rounded" alt="Result" />
                            <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 text-white text-[10px] text-center py-0.5">
                              生成结果
                            </span>
                          </>
                        ) : (
                          <div className="text-slate-300 text-xs text-center px-1">
                            {item.status === 'failed' ? '无结果' : '等待生成'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
