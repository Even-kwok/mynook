import React, { useState, useRef, useEffect } from 'react';
import { IconUpload, IconSparkles, IconX, IconRefresh, IconCheck } from './Icons';
import { toBase64, cropToSquareThumbnail } from '../utils/imageUtils';
import { Button } from './Button';
import { supabase } from '../config/supabase';

interface ProcessResult {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'failed';
  thumbnailUrl?: string;
  extractedData?: {
    templateName: string;
    mainCategory: string;
    secondaryCategory: string;
    styleDescription: string;
  };
  error?: string;
}

interface CategoryInfo {
  name: string;
  description: string;
}

// 分类描述映射
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

export const AITemplateCreator: React.FC = () => {
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 二级分类相关状态
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);
  const [autoDetectSubCategory, setAutoDetectSubCategory] = useState<boolean>(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [customSubCategory, setCustomSubCategory] = useState<string>('');

  // 从 design_templates 表加载所有大分类
  useEffect(() => {
    loadCategories();
  }, []);

  // 当主分类选择变化时，加载对应的二级分类
  useEffect(() => {
    if (selectedCategories.length > 0) {
      loadSubCategories(selectedCategories);
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedCategories]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      // 从 design_templates 表读取实际存在的分类
      const { data, error } = await supabase
        .from('design_templates')
        .select('main_category');

      if (error) throw error;
      
      // 提取并去重分类名称
      const categories = (data as any[] || [])
        .map((item: any) => item.main_category)
        .filter((cat): cat is string => Boolean(cat));
      const uniqueCategories = [...new Set(categories)] as string[];
      
      // 转换为选择器格式
      const categoryList: CategoryInfo[] = uniqueCategories.map(cat => ({
        name: cat,
        description: CATEGORY_DESCRIPTIONS[cat] || '',
      }));
      
      setAvailableCategories(categoryList);
      // 默认全选
      setSelectedCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setAvailableCategories([]);
      setSelectedCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadSubCategories = async (mainCategories: string[]) => {
    try {
      // 从 design_templates 表读取选中主分类下的所有二级分类
      const { data, error } = await supabase
        .from('design_templates')
        .select('sub_category, main_category, room_type');

      if (error) throw error;
      
      // 提取二级分类（包括 sub_category 和 room_type）
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
      setAvailableSubCategories([]);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (selectedCategories.length === 0) {
      alert('请至少选择一个允许的分类范围！');
      return;
    }
    
    // 最多70张
    const validFiles = files.slice(0, 70) as File[];
    
    if (files.length > 70) {
      alert(`最多只能上传70张图片，已自动截取前70张。`);
    }
    
    // 初始化结果
    const initialResults: ProcessResult[] = validFiles.map(file => ({
      file,
      status: 'pending',
    }));
    setResults(initialResults);

    // 开始处理
    await processBatch(initialResults);
  };

  const processBatch = async (batch: ProcessResult[]) => {
    setIsProcessing(true);
    const CONCURRENCY = 9;

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      
      await Promise.allSettled(
        chunk.map((result, idx) => processImage(result, i + idx))
      );
    }

    setIsProcessing(false);
  };

  const processImage = async (result: ProcessResult, index: number) => {
    // 更新状态为处理中
    setResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'processing' };
      return updated;
    });

    try {
      // 1. 读取原图
      const originalImage = await toBase64(result.file);
      
      // 2. 本地裁切缩略图
      const thumbnailImage = await cropToSquareThumbnail(result.file, 360, 0.85);

      // 3. 调用API
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/auto-create-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalImage,
          thumbnailImage,
          allowedCategories: selectedCategories,
          autoDetectSubCategory,
          manualSubCategory: autoDetectSubCategory 
            ? null 
            : (customSubCategory.trim() || selectedSubCategory || null),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process');
      }

      // 成功
      setResults(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'success',
          thumbnailUrl: thumbnailImage,
          extractedData: data.extracted,
        };
        return updated;
      });

    } catch (error) {
      console.error('Process image error:', error);
      // 失败
      setResults(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        return updated;
      });
    }
  };

  const retryFailed = async () => {
    const failedIndices: number[] = [];
    const failedResults: ProcessResult[] = [];
    
    results.forEach((r, idx) => {
      if (r.status === 'failed') {
        failedIndices.push(idx);
        failedResults.push({ ...r, status: 'pending' });
      }
    });

    if (failedResults.length === 0) return;

    // 重置失败项状态
    setResults(prev => {
      const updated = [...prev];
      failedIndices.forEach(idx => {
        updated[idx] = { ...updated[idx], status: 'pending', error: undefined };
      });
      return updated;
    });

    // 重新处理
    await processBatch(failedResults);
  };

  const clearResults = () => {
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const processingCount = results.filter(r => r.status === 'processing').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* 分类范围选择器 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">选择AI识别范围</h3>
            <p className="text-sm text-slate-600 mt-1">
              AI将在选中的分类范围内识别图片。例如：只勾选 "Floor Style"，上传木地板图片，AI会自动识别木纹、材质、颜色等。
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setSelectedCategories(availableCategories.map(c => c.name))}
              className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              disabled={isProcessing || isLoadingCategories}
            >
              全选
            </button>
            <button
              onClick={() => setSelectedCategories([])}
              className="px-3 py-1 text-slate-600 hover:bg-slate-50 rounded transition-colors"
              disabled={isProcessing || isLoadingCategories}
            >
              清空
            </button>
          </div>
        </div>
        
        {isLoadingCategories ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        ) : availableCategories.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>暂无可用分类</p>
            <p className="text-sm mt-2">请联系管理员添加分类或检查数据库连接</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableCategories.map(category => (
              <label 
                key={category.name} 
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCategories.includes(category.name)
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.name]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category.name));
                    }
                  }}
                  disabled={isProcessing}
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    {category.name}
                    {selectedCategories.includes(category.name) && (
                      <IconCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs text-slate-600 mt-1">{category.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <IconSparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            已选择 <strong className="text-blue-700">{selectedCategories.length}</strong> 个分类
            {selectedCategories.length > 0 && (
              <span className="ml-2 text-slate-500">
                （{selectedCategories.join('、')}）
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 二级分类设置 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">二级分类设置</h3>
        
        {/* AI自动识别开关 */}
        <label className="flex items-start gap-3 mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 cursor-pointer hover:border-indigo-300 transition-colors">
          <input
            type="checkbox"
            checked={autoDetectSubCategory}
            onChange={(e) => {
              setAutoDetectSubCategory(e.target.checked);
              if (e.target.checked) {
                // 开启自动识别时清空手动选择
                setSelectedSubCategory('');
                setCustomSubCategory('');
              }
            }}
            disabled={isProcessing}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
          />
          <div className="flex-1">
            <div className="font-medium text-slate-900 flex items-center gap-2">
              <IconSparkles className="w-5 h-5 text-indigo-600" />
              使用AI自动识别/创建二级分类
            </div>
            <p className="text-xs text-slate-600 mt-1">
              开启后，AI会根据图片内容自动识别并创建合适的二级分类（例如：Floor Style → "Hardwood - Herringbone"）
            </p>
          </div>
        </label>

        {/* 手动选择/创建区域 */}
        {!autoDetectSubCategory && (
          <div className="space-y-4 pl-8 border-l-2 border-indigo-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择现有二级分类
              </label>
              {availableSubCategories.length > 0 ? (
                <select
                  value={selectedSubCategory}
                  onChange={(e) => {
                    setSelectedSubCategory(e.target.value);
                    setCustomSubCategory(''); // 清空自定义输入
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isProcessing}
                >
                  <option value="">-- 选择现有分类 --</option>
                  {availableSubCategories.map(subCat => (
                    <option key={subCat} value={subCat}>{subCat}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-slate-500 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
                  暂无可用的二级分类，请先选择主分类或直接创建新分类
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-300"></div>
              <span className="text-xs text-slate-500 font-medium">或</span>
              <div className="flex-1 h-px bg-slate-300"></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                创建新的二级分类
              </label>
              <input
                type="text"
                value={customSubCategory}
                onChange={(e) => {
                  setCustomSubCategory(e.target.value);
                  setSelectedSubCategory(''); // 清空下拉选择
                }}
                placeholder="例如: Modern Minimalist, Scandinavian Style, Oak Herringbone..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 建议使用英文命名，多个单词用空格或连字符分隔
              </p>
            </div>

            {/* 验证提示 */}
            {!selectedSubCategory && !customSubCategory && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-600 text-lg">⚠️</span>
                <p className="text-sm text-amber-800">
                  请选择现有分类或输入新的分类名称
                </p>
              </div>
            )}
            
            {/* 当前设置显示 */}
            {(selectedSubCategory || customSubCategory) && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <IconCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  将使用二级分类: <strong>{customSubCategory || selectedSubCategory}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 上传区域 */}
      <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="hidden"
        />
        <div className="text-center">
          <IconUpload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            AI自动模板创建
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            上传设计图片，AI将自动提取提示词、分类信息，并创建模板
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || selectedCategories.length === 0 || isLoadingCategories}
            primary
            className="inline-flex items-center"
          >
            <IconSparkles className="w-5 h-5 mr-2" />
            选择图片 (最多70张)
          </Button>
          {selectedCategories.length === 0 && !isLoadingCategories && (
            <p className="text-red-600 text-sm mt-2">请先选择至少一个分类范围</p>
          )}
        </div>
      </div>

      {/* 进度统计 */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-6 text-sm">
              <span className="text-slate-700">总计: <strong>{results.length}</strong></span>
              <span className="text-green-600">成功: <strong>{successCount}</strong></span>
              <span className="text-red-600">失败: <strong>{failedCount}</strong></span>
              <span className="text-blue-600">处理中: <strong>{processingCount}</strong></span>
              {pendingCount > 0 && (
                <span className="text-slate-500">待处理: <strong>{pendingCount}</strong></span>
              )}
            </div>
            <div className="flex gap-2">
              {failedCount > 0 && !isProcessing && (
                <Button onClick={retryFailed} className="text-sm">
                  <IconRefresh className="w-4 h-4 mr-1" />
                  重试失败项
                </Button>
              )}
              {!isProcessing && (
                <Button onClick={clearResults} className="text-sm">
                  <IconX className="w-4 h-4 mr-1" />
                  清空结果
                </Button>
              )}
            </div>
          </div>

          {/* 进度条 */}
          {isProcessing && (
            <div className="mb-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(successCount + failedCount) / results.length * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                正在处理: {successCount + failedCount} / {results.length}
              </p>
            </div>
          )}

          {/* 结果列表 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50"
                title={result.extractedData?.templateName || result.error || 'Processing...'}
              >
                {result.thumbnailUrl && (
                  <img 
                    src={result.thumbnailUrl} 
                    alt={result.extractedData?.templateName || `Image ${idx + 1}`}
                    className="w-full h-full object-cover" 
                  />
                )}
                {result.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent" />
                  </div>
                )}
                {result.status === 'success' && (
                  <div className="absolute top-1 right-1">
                    <div className="bg-green-500 text-white rounded-full p-1 shadow-md">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                {result.status === 'failed' && (
                  <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center text-white text-xs p-2">
                    <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-center line-clamp-2">{result.error}</span>
                  </div>
                )}
                {result.status === 'pending' && (
                  <div className="absolute inset-0 bg-slate-200/80 flex items-center justify-center">
                    <span className="text-slate-600 text-xs">待处理</span>
                  </div>
                )}
                {result.extractedData && result.status === 'success' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-xs truncate">
                    {result.extractedData.templateName}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 详细结果表格 */}
          {successCount > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-slate-900 mb-3">创建成功的模板</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">模板名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">主分类</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">二级分类</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-700">文件名</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results
                      .filter(r => r.status === 'success' && r.extractedData)
                      .map((result, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-900">{result.extractedData!.templateName}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{result.extractedData!.mainCategory}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">{result.extractedData!.secondaryCategory}</td>
                          <td className="px-4 py-2 text-sm text-slate-500">{result.file.name}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>支持批量上传最多70张图片</li>
          <li>并发处理9张图片，提高效率</li>
          <li>AI自动提取模板名称、分类和完整提示词</li>
          <li>图片自动裁切压缩为360×360px缩略图</li>
          <li>失败的图片可以一键重试</li>
          <li>支持Zapier等自动化工具集成（使用API Key）</li>
        </ul>
      </div>
    </div>
  );
};

