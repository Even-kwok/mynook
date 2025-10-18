import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconUpload, IconCheck, IconAlertCircle } from './Icons';
import { supabase } from '../config/supabase';
import { updateTemplate, getAllTemplates, DesignTemplate } from '../services/templateService';

interface MatchedImage {
  file: File;
  preview: string;
  fileName: string;
  matchedTemplate: DesignTemplate | null;
  manualSelection?: string; // 手动选择的模板ID
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface BatchImageMatcherProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 模糊匹配函数
const fuzzyMatchTemplate = (
  fileName: string, 
  templates: DesignTemplate[]
): DesignTemplate | null => {
  // 标准化文件名
  const normalized = fileName
    .replace(/\.(png|jpg|jpeg)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // 寻找匹配
  let bestMatch: DesignTemplate | null = null;
  let bestMatchLength = Infinity;
  
  for (const template of templates) {
    const templateNorm = template.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    if (normalized.includes(templateNorm) || templateNorm.includes(normalized)) {
      if (templateNorm.length < bestMatchLength) {
        bestMatch = template;
        bestMatchLength = templateNorm.length;
      }
    }
  }
  
  return bestMatch;
};

// 压缩图片到 360x360
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 360;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // 计算裁剪区域（中心裁剪）
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;
      
      // 绘制裁剪并缩放的图片
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize, // 源区域
        0, 0, 360, 360 // 目标区域
      );
      
      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          console.log(`🗜️ Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
          resolve(compressedFile);
        },
        'image/jpeg',
        0.85
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export const BatchImageMatcher: React.FC<BatchImageMatcherProps> = ({ isOpen, onClose, onSuccess }) => {
  const [images, setImages] = useState<MatchedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [allTemplates, setAllTemplates] = useState<DesignTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // 加载所有模板
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templateData = await getAllTemplates();
      
      // 将模板数据扁平化为数组
      const flatTemplates: DesignTemplate[] = [];
      Object.entries(templateData).forEach(([mainCategory, subCategories]) => {
        subCategories.forEach(subCat => {
          subCat.templates.forEach(template => {
            flatTemplates.push({
              id: template.id,
              name: template.name,
              image_url: template.imageUrl,
              prompt: template.prompt,
              main_category: template.category,
              sub_category: template.subCategory || '',
              room_type: template.roomType || null,
              enabled: true,
              sort_order: 0,
              created_at: '',
              updated_at: ''
            });
          });
        });
      });
      
      setAllTemplates(flatTemplates);
      console.log(`✅ Loaded ${flatTemplates.length} templates for matching`);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates. Please try again.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList) => {
    if (isLoadingTemplates) {
      alert('Please wait for templates to load...');
      return;
    }

    const newImages: MatchedImage[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      const fileName = file.name;
      const preview = URL.createObjectURL(file);
      
      // 尝试自动匹配模板
      const matchedTemplate = fuzzyMatchTemplate(fileName, allTemplates);
      
      newImages.push({
        file,
        preview,
        fileName,
        matchedTemplate,
        status: 'pending',
      });
      
      if (matchedTemplate) {
        console.log(`✅ Matched "${fileName}" -> "${matchedTemplate.name}"`);
      } else {
        console.log(`❌ No match found for "${fileName}"`);
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
  }, [allTemplates, isLoadingTemplates]);

  // 拖放处理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 文件选择
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // 移除图片
  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // 手动选择模板
  const handleManualSelect = useCallback((index: number, templateId: string) => {
    setImages(prev => {
      const newImages = [...prev];
      const template = allTemplates.find(t => t.id === templateId);
      newImages[index] = {
        ...newImages[index],
        manualSelection: templateId,
        matchedTemplate: template || null
      };
      return newImages;
    });
  }, [allTemplates]);

  // 批量上传
  const handleUpload = async () => {
    const validImages = images.filter(img => img.matchedTemplate || img.manualSelection);
    
    if (validImages.length === 0) {
      alert('没有可上传的图片！请确保所有图片都已匹配到模板。');
      return;
    }
    
    setIsUploading(true);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // 跳过未匹配的
      if (!image.matchedTemplate && !image.manualSelection) {
        continue;
      }
      
      setImages(prev => {
        const newImages = [...prev];
        newImages[i] = { ...newImages[i], status: 'uploading' };
        return newImages;
      });

      try {
        const template = image.matchedTemplate!;
        const timestamp = Date.now();
        const sanitizedName = template.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // 压缩图片到 360x360
        console.log(`🗜️ Compressing: ${image.file.name}`);
        const compressedFile = await compressImage(image.file);
        
        // 构建存储路径
        let storagePath: string;
        if (template.room_type) {
          const categoryPrefix = template.main_category.toLowerCase().replace(/\s+/g, '-');
          storagePath = `${categoryPrefix}/${template.room_type}/${sanitizedName}-${timestamp}.jpg`;
        } else {
          storagePath = `${template.main_category.toLowerCase().replace(/\s+/g, '-')}/${sanitizedName}-${timestamp}.jpg`;
        }

        console.log(`📤 Uploading to: ${storagePath}`);

        const { error: uploadError } = await supabase.storage
          .from('template-thumbnails')
          .upload(storagePath, compressedFile, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('template-thumbnails')
          .getPublicUrl(storagePath);

        console.log(`✅ Uploaded: ${urlData.publicUrl}`);

        // 更新模板的 image_url
        await updateTemplate(template.id, {
          image_url: urlData.publicUrl
        });

        console.log(`✅ Template updated: ${template.name}`);

        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i], status: 'success' };
          return newImages;
        });

      } catch (error: any) {
        console.error(`❌ Upload failed for ${image.fileName}:`, error);
        
        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = {
            ...newImages[i],
            status: 'error',
            error: error.message || 'Upload failed'
          };
          return newImages;
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsUploading(false);
    
    const successCount = images.filter(img => img.status === 'success').length;
    if (successCount > 0) {
      alert(`✅ 成功更新 ${successCount} 个模板的图片！`);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    }
  };

  const handleClose = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    onClose();
  };

  if (!isOpen) return null;

  const matchedCount = images.filter(img => img.matchedTemplate || img.manualSelection).length;
  const unmatchedCount = images.filter(img => !img.matchedTemplate && !img.manualSelection).length;
  const successCount = images.filter(img => img.status === 'success').length;
  const errorCount = images.filter(img => img.status === 'error').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">批量匹配图片到模板</h2>
              <p className="text-sm text-slate-500 mt-1">
                根据文件名自动匹配现有模板，批量更新模板图片
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Loading State */}
            {isLoadingTemplates && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
                <p className="text-slate-600">加载模板中...</p>
              </div>
            )}

            {/* Drop Zone */}
            {!isLoadingTemplates && images.length === 0 && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                <IconUpload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  拖放图片到这里
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  或者点击下方按钮选择文件
                </p>
                <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  选择图片
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-4">
                  文件名示例: "Modern Minimalist.png" 会自动匹配名为 "Modern Minimalist" 的模板
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  💡 支持模糊匹配，图片会自动压缩为 360x360
                </p>
              </div>
            )}

            {/* Image List */}
            {!isLoadingTemplates && images.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    已选择 {images.length} 个文件
                    {matchedCount > 0 && ` (已匹配: ${matchedCount})`}
                    {unmatchedCount > 0 && ` (未匹配: ${unmatchedCount})`}
                  </h3>
                  {!isUploading && (
                    <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-sm">
                      添加更多
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 p-4 rounded-lg border-2 transition-colors ${
                        image.status === 'success'
                          ? 'border-green-200 bg-green-50'
                          : image.status === 'error'
                          ? 'border-red-200 bg-red-50'
                          : image.status === 'uploading'
                          ? 'border-indigo-200 bg-indigo-50'
                          : image.matchedTemplate || image.manualSelection
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      {/* Preview */}
                      <img
                        src={image.preview}
                        alt={image.fileName}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{image.fileName}</h4>
                        
                        {image.matchedTemplate ? (
                          <div className="mt-1 space-y-1 text-sm">
                            <p className="text-green-600 font-medium">
                              ✅ 匹配成功
                            </p>
                            <p className="text-slate-700 truncate">
                              📝 模板: {image.matchedTemplate.name}
                            </p>
                            <p className="text-slate-600 text-xs truncate">
                              📁 {image.matchedTemplate.main_category}
                              {image.matchedTemplate.room_type && ` > ${image.matchedTemplate.room_type}`}
                            </p>
                          </div>
                        ) : !image.manualSelection ? (
                          <div className="mt-2">
                            <p className="text-yellow-600 text-sm mb-2">❌ 未找到匹配的模板</p>
                            <select
                              value={image.manualSelection || ''}
                              onChange={(e) => handleManualSelect(index, e.target.value)}
                              disabled={isUploading}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                            >
                              <option value="">请手动选择模板...</option>
                              {Object.entries(
                                allTemplates.reduce((acc, template) => {
                                  const category = template.main_category;
                                  if (!acc[category]) acc[category] = [];
                                  acc[category].push(template);
                                  return acc;
                                }, {} as Record<string, DesignTemplate[]>)
                              ).map(([category, templates]) => (
                                <optgroup key={category} label={category}>
                                  {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                      {template.name} {template.room_type ? `(${template.room_type})` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        
                        {image.error && (
                          <p className="text-red-600 text-xs mt-1">❌ {image.error}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center flex-shrink-0">
                        {image.status === 'pending' && !isUploading && (
                          <button
                            onClick={() => removeImage(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="移除"
                          >
                            <IconX className="w-5 h-5 text-red-600" />
                          </button>
                        )}
                        {image.status === 'uploading' && (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                        )}
                        {image.status === 'success' && (
                          <IconCheck className="w-6 h-6 text-green-600" />
                        )}
                        {image.status === 'error' && (
                          <IconAlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!isLoadingTemplates && images.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {isUploading ? (
                    <span>上传中: {successCount + errorCount} / {images.length}</span>
                  ) : (
                    <span>
                      {matchedCount > 0 && `✅ 已匹配: ${matchedCount} `}
                      {unmatchedCount > 0 && `| ⚠️ 未匹配: ${unmatchedCount} `}
                      {successCount > 0 && `| 成功: ${successCount} `}
                      {errorCount > 0 && `| ❌ 失败: ${errorCount}`}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? '上传中...' : '取消'}
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || matchedCount === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? `上传中 (${successCount}/${images.length})` : `更新 ${matchedCount} 个模板`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

