/**
 * Hero Banner Manager Component
 * Hero Banner 后台管理组件 - 支持上传、编辑、排序、配置
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { IconUpload, IconX, IconTrash, IconCheck, IconPencil, IconSparkles, IconEye, IconMenu } from './Icons';
import { TransitionEffect } from '../types';
import { uploadImage, getImageMetadata, ImageMetadata, deleteImage } from '../services/storageService';
import {
  fetchAllHeroBanners,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  toggleGalleryItemActive,
  reorderHeroBanners,
  GalleryItemDB
} from '../services/galleryService';
import { supabase } from '../config/supabase';

export interface HeroBannerManagerProps {
  onSuccess?: () => void;
}

interface UploadingBanner {
  file: File;
  preview: string;
  metadata?: ImageMetadata;
  title: string;
  bannerTitle: string;
  bannerSubtitle: string;
  transitionEffect: TransitionEffect;
  displayDuration: number;
  isAutoplay: boolean;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

interface EditingBanner extends GalleryItemDB {
  isEditing: boolean;
}

const TRANSITION_EFFECTS: { value: TransitionEffect; label: string; description: string }[] = [
  { value: 'fade', label: 'Fade', description: '淡入淡出' },
  { value: 'slide', label: 'Slide', description: '滑动切换' },
  { value: 'zoom', label: 'Zoom', description: '缩放效果' }
];

export const HeroBannerManager: React.FC<HeroBannerManagerProps> = ({ onSuccess }) => {
  const [banners, setBanners] = useState<GalleryItemDB[]>([]);
  const [uploadingBanners, setUploadingBanners] = useState<UploadingBanner[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingBanner, setEditingBanner] = useState<EditingBanner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<GalleryItemDB | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载横幅列表
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    const items = await fetchAllHeroBanners();
    setBanners(items);
  };

  // 处理文件选择
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newBanners: UploadingBanner[] = [];

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const preview = URL.createObjectURL(file);
      
      try {
        const metadata = await getImageMetadata(file);

        newBanners.push({
          file,
          preview,
          metadata,
          title: file.name.replace(/\.[^/.]+$/, ''),
          bannerTitle: 'Effortless Design, Powered by AI',
          bannerSubtitle: 'Transform photos of your rooms with powerful AI',
          transitionEffect: 'fade',
          displayDuration: 5,
          isAutoplay: true,
          uploading: false,
          uploaded: false
        });
      } catch (error) {
        console.error('Error loading image metadata:', error);
      }
    }

    setUploadingBanners((prev) => [...prev, ...newBanners]);
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

  // 更新上传横幅的字段
  const updateUploadingBanner = (index: number, updates: Partial<UploadingBanner>) => {
    setUploadingBanners((prev) =>
      prev.map((banner, i) => (i === index ? { ...banner, ...updates } : banner))
    );
  };

  // 移除上传横幅
  const removeUploadingBanner = (index: number) => {
    const banner = uploadingBanners[index];
    URL.revokeObjectURL(banner.preview);
    setUploadingBanners((prev) => prev.filter((_, i) => i !== index));
  };

  // 批量上传
  const handleBatchUpload = async () => {
    if (uploadingBanners.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < uploadingBanners.length; i++) {
      const banner = uploadingBanners[i];
      if (banner.uploaded) continue;

      updateUploadingBanner(i, { uploading: true, error: undefined });

      try {
        // 上传文件到 Storage
        const uploadResult = await uploadImage(banner.file, 'hero-banner');

        if (!uploadResult.success || !uploadResult.path || !banner.metadata) {
          updateUploadingBanner(i, {
            uploading: false,
            error: uploadResult.error || 'Upload failed'
          });
          continue;
        }

        // 创建数据库记录
        const itemId = await createGalleryItem({
          storage_path: uploadResult.path,
          category: 'hero-banner',
          category_name: 'Hero Banner / 首页横幅',
          tool_page: 'Homepage',
          title: banner.title,
          author: 'MyNook Team',
          type: 'image',
          width: banner.metadata.width,
          height: banner.metadata.height,
          is_active: true,
          banner_title: banner.bannerTitle,
          banner_subtitle: banner.bannerSubtitle,
          transition_effect: banner.transitionEffect,
          display_duration: banner.displayDuration,
          is_autoplay: banner.isAutoplay,
          sort_order: banners.length + i
        });

        if (itemId) {
          updateUploadingBanner(i, { uploading: false, uploaded: true });
        } else {
          updateUploadingBanner(i, {
            uploading: false,
            error: 'Failed to create database record'
          });
        }
      } catch (error) {
        updateUploadingBanner(i, {
          uploading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setIsUploading(false);
    await loadBanners();
    if (onSuccess) onSuccess();
  };

  // 清除已上传的横幅
  const clearUploaded = () => {
    uploadingBanners.forEach((banner) => {
      if (banner.uploaded) {
        URL.revokeObjectURL(banner.preview);
      }
    });
    setUploadingBanners((prev) => prev.filter((banner) => !banner.uploaded));
  };

  // 删除已存在的横幅
  const handleDeleteBanner = async (item: GalleryItemDB) => {
    if (!confirm(`确定要删除 "${item.title}" 吗？`)) return;

    await deleteImage(item.storage_path);
    const success = await deleteGalleryItem(item.id);
    if (success) {
      await loadBanners();
    }
  };

  // 切换激活状态
  const handleToggleActive = async (item: GalleryItemDB) => {
    const success = await toggleGalleryItemActive(item.id, !item.is_active);
    if (success) {
      await loadBanners();
    }
  };

  // 开始编辑
  const startEdit = (item: GalleryItemDB) => {
    setEditingBanner({ ...item, isEditing: true });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingBanner) return;

    const success = await updateGalleryItem(editingBanner.id, {
      title: editingBanner.title,
      banner_title: editingBanner.banner_title,
      banner_subtitle: editingBanner.banner_subtitle,
      transition_effect: editingBanner.transition_effect,
      display_duration: editingBanner.display_duration,
      is_autoplay: editingBanner.is_autoplay
    });

    if (success) {
      await loadBanners();
      setEditingBanner(null);
    }
  };

  // 重新排序
  const handleReorder = async (newOrder: GalleryItemDB[]) => {
    setBanners(newOrder);
    const ids = newOrder.map(item => item.id);
    await reorderHeroBanners(ids);
  };

  return (
    <div className="space-y-8">
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
              <IconSparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Banners</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">{banners.length}</p>
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
                {banners.filter((b) => b.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <IconEye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Auto-play</h3>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {banners.filter((b) => b.is_autoplay).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Upload New Hero Banners</h2>
        <p className="text-sm text-slate-600 mb-4">
          推荐尺寸: 1920x1080 (16:9) | 支持格式: JPG, PNG, WebP | 最多上传 5 张
        </p>

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
            Drag & drop hero banner images here, or click to select
          </p>
          <p className="text-sm text-slate-500">Recommended: 1920x1080 px (16:9 aspect ratio)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* 上传列表 */}
        {uploadingBanners.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Files to Upload ({uploadingBanners.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={clearUploaded}
                  disabled={!uploadingBanners.some((b) => b.uploaded)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Uploaded
                </button>
                <button
                  onClick={handleBatchUpload}
                  disabled={isUploading || uploadingBanners.every((b) => b.uploaded)}
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

            <div className="grid grid-cols-1 gap-4">
              {uploadingBanners.map((banner, index) => (
                <UploadingBannerCard
                  key={index}
                  banner={banner}
                  onUpdate={(updates) => updateUploadingBanner(index, updates)}
                  onRemove={() => removeUploadingBanner(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 已有横幅管理 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Manage Hero Banners</h2>
            <p className="text-sm text-slate-600 mt-1">
              拖拽卡片可以调整轮播顺序
            </p>
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <IconSparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hero banners found. Upload your first one!</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={banners} onReorder={handleReorder} className="space-y-4">
            {banners.map((item) => (
              <Reorder.Item key={item.id} value={item}>
                <HeroBannerCard
                  item={item}
                  onToggleActive={() => handleToggleActive(item)}
                  onDelete={() => handleDeleteBanner(item)}
                  onEdit={() => startEdit(item)}
                  onPreview={() => setPreviewBanner(item)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* 编辑模态框 */}
      {editingBanner && (
        <EditBannerModal
          banner={editingBanner}
          onChange={setEditingBanner}
          onSave={saveEdit}
          onCancel={() => setEditingBanner(null)}
        />
      )}

      {/* 预览模态框 */}
      {previewBanner && (
        <PreviewBannerModal
          banner={previewBanner}
          onClose={() => setPreviewBanner(null)}
        />
      )}
    </div>
  );
};

// 上传中的横幅卡片
const UploadingBannerCard: React.FC<{
  banner: UploadingBanner;
  onUpdate: (updates: Partial<UploadingBanner>) => void;
  onRemove: () => void;
}> = ({ banner, onUpdate, onRemove }) => {
  return (
    <div className="border border-slate-200 rounded-xl p-4 relative">
      {/* 状态指示器 */}
      {banner.uploaded && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10">
          <IconCheck className="w-4 h-4 text-white" />
        </div>
      )}
      {banner.uploading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {!banner.uploaded && !banner.uploading && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 z-10"
        >
          <IconX className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="flex gap-4">
        {/* 预览图 */}
        <div className="w-48 h-27 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
          <img src={banner.preview} alt={banner.title} className="w-full h-full object-cover" />
        </div>

        {/* 表单 */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <input
            type="text"
            value={banner.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="File name"
            disabled={banner.uploading || banner.uploaded}
            className="col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          />

          <input
            type="text"
            value={banner.bannerTitle}
            onChange={(e) => onUpdate({ bannerTitle: e.target.value })}
            placeholder="Banner Title"
            disabled={banner.uploading || banner.uploaded}
            className="col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          />

          <input
            type="text"
            value={banner.bannerSubtitle}
            onChange={(e) => onUpdate({ bannerSubtitle: e.target.value })}
            placeholder="Banner Subtitle"
            disabled={banner.uploading || banner.uploaded}
            className="col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          />

          <select
            value={banner.transitionEffect}
            onChange={(e) => onUpdate({ transitionEffect: e.target.value as TransitionEffect })}
            disabled={banner.uploading || banner.uploaded}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
          >
            {TRANSITION_EFFECTS.map((effect) => (
              <option key={effect.value} value={effect.value}>
                {effect.label} - {effect.description}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={banner.displayDuration}
              onChange={(e) => onUpdate({ displayDuration: parseInt(e.target.value) || 5 })}
              min="1"
              max="30"
              disabled={banner.uploading || banner.uploaded}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
            />
            <span className="text-sm text-slate-600">秒</span>
          </div>

          {banner.metadata && (
            <p className="col-span-2 text-xs text-slate-500">
              {banner.metadata.width} x {banner.metadata.height} • {(banner.metadata.size / 1024).toFixed(0)}KB
            </p>
          )}

          {banner.error && (
            <p className="col-span-2 text-xs text-red-600">{banner.error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// 已有横幅卡片
const HeroBannerCard: React.FC<{
  item: GalleryItemDB;
  onToggleActive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPreview: () => void;
}> = ({ item, onToggleActive, onDelete, onEdit, onPreview }) => {
  const { data } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(item.storage_path);

  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white cursor-move">
      <div className="flex gap-4">
        {/* 拖拽手柄 */}
        <div className="flex items-center">
          <IconMenu className="w-5 h-5 text-slate-400" />
        </div>

        {/* 预览图 */}
        <div className="w-48 h-27 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
          <img src={data.publicUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* 信息 */}
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{item.banner_title || item.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{item.banner_subtitle}</p>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span>效果: {item.transition_effect || 'fade'}</span>
            <span>时长: {item.display_duration || 5}秒</span>
            <span>{item.width} x {item.height}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 items-start">
          <button
            onClick={onToggleActive}
            className={`p-2 rounded-lg ${
              item.is_active
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            title={item.is_active ? 'Active' : 'Inactive'}
          >
            <IconCheck className="w-5 h-5" />
          </button>
          <button
            onClick={onPreview}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            title="Preview"
          >
            <IconEye className="w-5 h-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
            title="Edit"
          >
            <IconPencil className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
            title="Delete"
          >
            <IconTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 编辑模态框
const EditBannerModal: React.FC<{
  banner: EditingBanner;
  onChange: (banner: EditingBanner) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ banner, onChange, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Hero Banner</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              File Name
            </label>
            <input
              type="text"
              value={banner.title}
              onChange={(e) => onChange({ ...banner, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Banner Title (主标题)
            </label>
            <input
              type="text"
              value={banner.banner_title || ''}
              onChange={(e) => onChange({ ...banner, banner_title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Effortless Design, Powered by AI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Banner Subtitle (副标题)
            </label>
            <textarea
              value={banner.banner_subtitle || ''}
              onChange={(e) => onChange({ ...banner, banner_subtitle: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={2}
              placeholder="Transform photos of your rooms with powerful AI"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transition Effect (过渡效果)
              </label>
              <select
                value={banner.transition_effect || 'fade'}
                onChange={(e) => onChange({ ...banner, transition_effect: e.target.value as TransitionEffect })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {TRANSITION_EFFECTS.map((effect) => (
                  <option key={effect.value} value={effect.value}>
                    {effect.label} - {effect.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Display Duration (显示时长)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={banner.display_duration || 5}
                  onChange={(e) => onChange({ ...banner, display_duration: parseInt(e.target.value) || 5 })}
                  min="1"
                  max="30"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">秒</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_autoplay"
              checked={banner.is_autoplay}
              onChange={(e) => onChange({ ...banner, is_autoplay: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="is_autoplay" className="text-sm font-medium text-slate-700">
              Enable auto-play for this banner
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// 预览模态框
const PreviewBannerModal: React.FC<{
  banner: GalleryItemDB;
  onClose: () => void;
}> = ({ banner, onClose }) => {
  const { data } = supabase.storage
    .from('gallery-images')
    .getPublicUrl(banner.storage_path);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-slate-300"
        >
          <IconX className="w-8 h-8" />
        </button>

        <div className="relative h-[60vh] rounded-2xl overflow-hidden">
          <img
            src={data.publicUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h1 className="text-5xl font-bold mb-4">{banner.banner_title || banner.title}</h1>
              <p className="text-xl">{banner.banner_subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-white text-sm">
          Effect: {banner.transition_effect || 'fade'} | Duration: {banner.display_duration || 5}s
        </div>
      </motion.div>
    </div>
  );
};

