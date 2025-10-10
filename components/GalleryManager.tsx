/**
 * Gallery Manager Component
 * 图片墙后台管理组件 - 支持批量上传、编辑、删除
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUpload, IconX, IconTrash, IconCheck, IconPhoto, IconSparkles } from './Icons';
import { GALLERY_CATEGORIES } from '../constants';
import { uploadImage, getImageMetadata, ImageMetadata } from '../services/storageService';
import {
  fetchAllGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  toggleGalleryItemActive,
  GalleryItemDB
} from '../services/galleryService';
import { deleteImage } from '../services/storageService';
import { supabase } from '../config/supabase';

export interface GalleryManagerProps {
  onSuccess?: () => void;
}

interface UploadingImage {
  file: File;
  preview: string;
  metadata?: ImageMetadata;
  title: string;
  category: string;
  categoryName: string;
  toolPage: string;
  author: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ onSuccess }) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItemDB[]>([]);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载图片列表
  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    const items = await fetchAllGalleryItems();
    setGalleryItems(items);
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: UploadingImage[] = [];

    for (let i = 0; i < Math.min(files.length, 20); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;

      const preview = URL.createObjectURL(file);
      
      try {
        const metadata = file.type.startsWith('image/') 
          ? await getImageMetadata(file)
          : { width: 600, height: 800, size: file.size, type: file.type };

        newImages.push({
          file,
          preview,
          metadata,
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: GALLERY_CATEGORIES[0].id,
          categoryName: GALLERY_CATEGORIES[0].name,
          toolPage: GALLERY_CATEGORIES[0].page,
          author: 'MyNook Team',
          uploading: false,
          uploaded: false
        });
      } catch (error) {
        console.error('Error loading image metadata:', error);
      }
    }

    setUploadingImages((prev) => [...prev, ...newImages]);
  };

  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 更新上传图片的字段
  const updateUploadingImage = (index: number, updates: Partial<UploadingImage>) => {
    setUploadingImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, ...updates } : img))
    );
  };

  // 更新分类
  const updateCategory = (index: number, categoryId: string) => {
    const category = GALLERY_CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      updateUploadingImage(index, {
        category: category.id,
        categoryName: category.name,
        toolPage: category.page
      });
    }
  };

  // 移除上传图片
  const removeUploadingImage = (index: number) => {
    const image = uploadingImages[index];
    URL.revokeObjectURL(image.preview);
    setUploadingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 批量上传
  const handleBatchUpload = async () => {
    if (uploadingImages.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < uploadingImages.length; i++) {
      const image = uploadingImages[i];
      if (image.uploaded) continue;

      updateUploadingImage(i, { uploading: true, error: undefined });

      try {
        // 上传文件到 Storage
        const uploadResult = await uploadImage(image.file, image.category);

        if (!uploadResult.success || !uploadResult.path || !image.metadata) {
          updateUploadingImage(i, {
            uploading: false,
            error: uploadResult.error || 'Upload failed'
          });
          continue;
        }

        // 创建数据库记录
        const itemId = await createGalleryItem({
          storage_path: uploadResult.path,
          category: image.category,
          category_name: image.categoryName,
          tool_page: image.toolPage,
          title: image.title,
          author: image.author,
          type: image.file.type.startsWith('video/') ? 'video' : 'image',
          width: image.metadata.width,
          height: image.metadata.height,
          is_active: true
        });

        if (itemId) {
          updateUploadingImage(i, { uploading: false, uploaded: true });
        } else {
          updateUploadingImage(i, {
            uploading: false,
            error: 'Failed to create database record'
          });
        }
      } catch (error) {
        updateUploadingImage(i, {
          uploading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setIsUploading(false);
    await loadGalleryItems();
    if (onSuccess) onSuccess();
  };

  // 清除已上传的图片
  const clearUploaded = () => {
    uploadingImages.forEach((img) => {
      if (img.uploaded) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setUploadingImages((prev) => prev.filter((img) => !img.uploaded));
  };

  // 删除已存在的图片
  const handleDeleteItem = async (item: GalleryItemDB) => {
    if (!confirm(`确定要删除 "${item.title}" 吗？`)) return;

    // 删除 Storage 文件
    await deleteImage(item.storage_path);

    // 删除数据库记录
    const success = await deleteGalleryItem(item.id);
    if (success) {
      await loadGalleryItems();
    }
  };

  // 切换激活状态
  const handleToggleActive = async (item: GalleryItemDB) => {
    const success = await toggleGalleryItemActive(item.id, !item.is_active);
    if (success) {
      await loadGalleryItems();
    }
  };

  // 筛选图片
  const filteredItems = selectedCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
              <IconPhoto className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Items</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">{galleryItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <IconCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Active</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {galleryItems.filter((i) => i.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <IconSparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Categories</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">{GALLERY_CATEGORIES.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Upload New Images</h2>

        {/* 拖拽上传区 */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 hover:border-indigo-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IconUpload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            Drag & drop images here, or click to select
          </p>
          <p className="text-sm text-slate-500">Supports JPG, PNG, WebP, GIF, MP4 (max 20 files)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* 上传列表 */}
        {uploadingImages.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Files to Upload ({uploadingImages.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={clearUploaded}
                  disabled={!uploadingImages.some((img) => img.uploaded)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Uploaded
                </button>
                <button
                  onClick={handleBatchUpload}
                  disabled={isUploading || uploadingImages.every((img) => img.uploaded)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <IconUpload className="w-5 h-5" />
                      Upload All
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadingImages.map((image, index) => (
                <UploadingImageCard
                  key={index}
                  image={image}
                  onUpdate={(updates) => updateUploadingImage(index, updates)}
                  onCategoryChange={(categoryId) => updateCategory(index, categoryId)}
                  onRemove={() => removeUploadingImage(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 已有图片管理 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Manage Gallery Items</h2>
          
          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <IconPhoto className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <GalleryItemCard
                key={item.id}
                item={item}
                onToggleActive={() => handleToggleActive(item)}
                onDelete={() => handleDeleteItem(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 上传中的图片卡片
const UploadingImageCard: React.FC<{
  image: UploadingImage;
  onUpdate: (updates: Partial<UploadingImage>) => void;
  onCategoryChange: (categoryId: string) => void;
  onRemove: () => void;
}> = ({ image, onUpdate, onCategoryChange, onRemove }) => {
  return (
    <div className="border border-slate-200 rounded-xl p-4 relative">
      {/* 状态指示器 */}
      {image.uploaded && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <IconCheck className="w-4 h-4 text-white" />
        </div>
      )}
      {image.uploading && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {!image.uploaded && !image.uploading && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
        >
          <IconX className="w-4 h-4 text-white" />
        </button>
      )}

      {/* 预览图 */}
      <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-3">
        <img src={image.preview} alt={image.title} className="w-full h-full object-cover" />
      </div>

      {/* 表单 */}
      <div className="space-y-2">
        <input
          type="text"
          value={image.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Title"
          disabled={image.uploading || image.uploaded}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
        />

        <select
          value={image.category}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={image.uploading || image.uploaded}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
        >
          {GALLERY_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={image.author}
          onChange={(e) => onUpdate({ author: e.target.value })}
          placeholder="Author"
          disabled={image.uploading || image.uploaded}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
        />

        {image.metadata && (
          <p className="text-xs text-slate-500">
            {image.metadata.width} x {image.metadata.height} • {(image.metadata.size / 1024).toFixed(0)}KB
          </p>
        )}

        {image.error && (
          <p className="text-xs text-red-600">{image.error}</p>
        )}
      </div>
    </div>
  );
};

// 已有图片卡片
const GalleryItemCard: React.FC<{
  item: GalleryItemDB;
  onToggleActive: () => void;
  onDelete: () => void;
}> = ({ item, onToggleActive, onDelete }) => {
  const { data } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(item.storage_path);

  return (
    <div className="border border-slate-200 rounded-xl p-3 relative group">
      {/* 激活状态 */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={onToggleActive}
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            item.is_active ? 'bg-green-500' : 'bg-slate-400'
          } hover:opacity-80`}
        >
          <IconCheck className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 rounded-full items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
      >
        <IconTrash className="w-4 h-4 text-white" />
      </button>

      {/* 预览图 */}
      <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
        {item.type === 'video' ? (
          <video src={data.publicUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={data.publicUrl} alt={item.title} className="w-full h-full object-cover" />
        )}
      </div>

      {/* 信息 */}
      <p className="text-xs font-medium text-slate-700 truncate">{item.title}</p>
      <p className="text-xs text-slate-500 truncate">{item.category_name}</p>
      <p className="text-xs text-slate-400">
        {item.width} x {item.height}
      </p>
    </div>
  );
};

