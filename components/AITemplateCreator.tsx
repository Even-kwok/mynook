import React, { useState, useRef } from 'react';
import { IconUpload, IconSparkles, IconX, IconRefresh } from './Icons';
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

const ALLOWED_CATEGORIES = [
  'Interior Design',
  'Exterior Design', 
  'Garden & Backyard Design'
];

export const AITemplateCreator: React.FC = () => {
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allowedCategories, setAllowedCategories] = useState<string[]>(ALLOWED_CATEGORIES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (allowedCategories.length === 0) {
      alert('请至少选择一个允许的分类范围！');
      return;
    }
    
    // 最多70张
    const validFiles = files.slice(0, 70);
    
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
          allowedCategories,
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
      {/* 分类范围限制设置 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold mb-4 text-slate-900">允许的分类范围</h3>
        <p className="text-sm text-slate-600 mb-4">
          AI提取的分类必须在选中的范围内，否则将被拒绝创建
        </p>
        <div className="space-y-2">
          {ALLOWED_CATEGORIES.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowedCategories.includes(cat)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setAllowedCategories([...allowedCategories, cat]);
                  } else {
                    setAllowedCategories(allowedCategories.filter(c => c !== cat));
                  }
                }}
                disabled={isProcessing}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">{cat}</span>
            </label>
          ))}
        </div>
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
            disabled={isProcessing || allowedCategories.length === 0}
            primary
            className="inline-flex items-center"
          >
            <IconSparkles className="w-5 h-5 mr-2" />
            选择图片 (最多70张)
          </Button>
          {allowedCategories.length === 0 && (
            <p className="text-red-600 text-sm mt-2">请先选择至少一个允许的分类范围</p>
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

