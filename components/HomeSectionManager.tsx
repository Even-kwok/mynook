import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconPencil, IconX, IconUpload, IconPhoto, IconVideo, IconPlus, IconTrash, IconMoveUp, IconMoveDown, IconMoveToTop, IconMoveToBottom } from './Icons';
import { HomeSection, HomeSectionMediaType, HomeSectionLayout, HomeSectionDisplayMode, GalleryFilterType } from '../types';
import {
  getAllHomeSectionsForAdmin,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  uploadSectionMedia,
  deleteSectionMedia,
  reorderHomeSections
} from '../services/homeSectionService';
import { Button } from './Button';

interface HomeSectionManagerProps {
  onUpdate?: () => void;
}

export const HomeSectionManager: React.FC<HomeSectionManagerProps> = ({ onUpdate }) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await getAllHomeSectionsForAdmin();
      setSections(data);
    } catch (error) {
      console.error('Error loading sections:', error);
      alert('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section);
    setShowEditModal(true);
  };

  const handleDelete = async (section: HomeSection) => {
    if (!confirm(`Are you sure you want to delete Section ${section.section_number}?`)) {
      return;
    }

    try {
      await deleteHomeSection(section.id);
      await loadSections();
      onUpdate?.();
      alert('Section deleted successfully');
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    
    await reorderSections(newSections);
  };

  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    
    await reorderSections(newSections);
  };

  const handleMoveToTop = async (index: number) => {
    if (index === 0) return;
    
    const newSections = [...sections];
    const [removed] = newSections.splice(index, 1);
    newSections.unshift(removed);
    
    await reorderSections(newSections);
  };

  const handleMoveToBottom = async (index: number) => {
    if (index === sections.length - 1) return;
    
    const newSections = [...sections];
    const [removed] = newSections.splice(index, 1);
    newSections.push(removed);
    
    await reorderSections(newSections);
  };

  const reorderSections = async (newSections: HomeSection[]) => {
    try {
      setSections(newSections);
      
      const updates = newSections.map((section, index) => ({
        id: section.id,
        sort_order: index
      }));
      
      await reorderHomeSections(updates);
      await loadSections();
      onUpdate?.();
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Failed to reorder sections');
      await loadSections(); // 恢复原顺序
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setEditingSection(null);
  };

  const handleSaveSuccess = () => {
    loadSections();
    handleCloseModal();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Home Sections Management</h2>
          <p className="text-slate-500 mt-1">Manage content for homepage sections 2-6</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <IconPlus className="w-5 h-5" />
          Add New Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            total={sections.length}
            onEdit={() => handleEdit(section)}
            onDelete={() => handleDelete(section)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onMoveToTop={() => handleMoveToTop(index)}
            onMoveToBottom={() => handleMoveToBottom(index)}
          />
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-500 mb-4">No sections yet</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            Create First Section
          </button>
        </div>
      )}

      <AnimatePresence>
        {showEditModal && editingSection && (
          <EditSectionModal
            section={editingSection}
            onClose={handleCloseModal}
            onSave={handleSaveSuccess}
          />
        )}
        {showCreateModal && (
          <CreateSectionModal
            existingSections={sections}
            onClose={handleCloseModal}
            onSave={handleSaveSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Section Card Component
interface SectionCardProps {
  section: HomeSection;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, index, total, onEdit, onDelete, onMoveUp, onMoveDown, onMoveToTop, onMoveToBottom }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-200 transition-colors">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Section {section.section_number}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              section.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {section.is_active ? 'Active' : 'Inactive'}
            </span>
            
            {/* 排序按钮 */}
            <div className="flex items-center border-l border-slate-200 pl-2 ml-2">
              <button
                onClick={onMoveToTop}
                disabled={index === 0}
                className={`p-2 rounded-lg transition-colors ${
                  index === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100'
                }`}
                title="Move to top"
              >
                <IconMoveToTop className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className={`p-2 rounded-lg transition-colors ${
                  index === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100'
                }`}
                title="Move up"
              >
                <IconMoveUp className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === total - 1}
                className={`p-2 rounded-lg transition-colors ${
                  index === total - 1
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100'
                }`}
                title="Move down"
              >
                <IconMoveDown className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onMoveToBottom}
                disabled={index === total - 1}
                className={`p-2 rounded-lg transition-colors ${
                  index === total - 1
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-100'
                }`}
                title="Move to bottom"
              >
                <IconMoveToBottom className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            {/* 编辑和删除按钮 */}
            <div className="flex items-center border-l border-slate-200 pl-2 ml-2">
              <button
                onClick={onEdit}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit section"
              >
                <IconPencil className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete section"
              >
                <IconTrash className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview - 200x200 缩略图 */}
        <div className="w-[200px] h-[200px] bg-slate-100 rounded-xl mb-3 overflow-hidden flex-shrink-0">
          {section.media_type === 'image' && (
            <img
              src={section.media_url}
              alt={section.title}
              className="w-full h-full object-cover"
            />
          )}
          {section.media_type === 'video' && (
            <video
              src={section.media_url}
              className="w-full h-full object-cover"
              muted
              loop
            />
          )}
          {section.media_type === 'comparison' && section.comparison_before_url && (
            <div className="relative w-full h-full">
              <img
                src={section.comparison_before_url}
                alt="Before"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Before/After
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-900 text-sm line-clamp-2">
            {section.title}
          </h4>
          <p className="text-slate-500 text-xs line-clamp-2">
            {section.subtitle}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {section.layout_direction === 'left-image' ? '← Image' : 'Image →'}
            </span>
            <span className="text-xs font-medium text-indigo-600">
              → {section.button_link}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Section Modal Component
interface CreateSectionModalProps {
  existingSections: HomeSection[];
  onClose: () => void;
  onSave: () => void;
}

const CreateSectionModal: React.FC<CreateSectionModalProps> = ({ existingSections, onClose, onSave }) => {
  // 计算新 Section 的编号
  const nextSectionNumber = existingSections.length > 0
    ? Math.max(...existingSections.map(s => s.section_number)) + 1
    : 2;

  const [formData, setFormData] = useState<Omit<HomeSection, 'id' | 'created_at' | 'updated_at'>>({
    section_number: nextSectionNumber,
    title: '',
    subtitle: '',
    media_url: '',
    media_type: 'image',
    comparison_before_url: null,
    comparison_after_url: null,
    card_title: 'AI DESIGN PREVIEW',
    card_subtitle: '',
    button_text: 'Get Started',
    button_link: 'Interior Design',
    layout_direction: 'left-image',
    is_active: true,
    sort_order: existingSections.length,
    display_mode: 'media_showcase',
    gallery_filter_type: null,
    gallery_main_category: null,
    gallery_sub_category: null
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availablePages = [
    'Interior Design',
    'Wall Design',
    'Floor Style',
    'Garden & Backyard Design',
    'Exterior Design',
    'Festive Decor',
    'Item Replacement',
    'Style Matching'
  ];

  const handleFileUpload = async (
    file: File,
    type: 'main' | 'before' | 'after'
  ) => {
    try {
      setUploading(true);
      
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert('Please upload an image (JPG, PNG, WEBP) or video (MP4) file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const url = await uploadSectionMedia(file, nextSectionNumber, type);

      if (type === 'main') {
        setFormData({
          ...formData,
          media_url: url,
          media_type: isVideo ? 'video' : 'image'
        });
      } else if (type === 'before') {
        setFormData({
          ...formData,
          comparison_before_url: url,
          media_type: 'comparison'
        });
      } else if (type === 'after') {
        setFormData({
          ...formData,
          comparison_after_url: url,
          media_type: 'comparison'
        });
      }

      alert('Upload successful!');
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Upload failed. ';
      
      if (error?.message) {
        errorMessage += `Error: ${error.message}`;
      } else if (error?.error_description) {
        errorMessage += `Error: ${error.error_description}`;
      } else if (typeof error === 'string') {
        errorMessage += error;
      } else {
        errorMessage += 'Please check:\n1. You are logged in as admin\n2. Storage policies are configured\n3. File is less than 10MB';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.title.trim()) {
        alert('Title is required');
        return;
      }
      if (!formData.subtitle.trim()) {
        alert('Subtitle is required');
        return;
      }
      if (!formData.card_title.trim()) {
        alert('Card title is required');
        return;
      }
      if (!formData.card_subtitle.trim()) {
        alert('Card subtitle is required');
        return;
      }
      if (!formData.button_text.trim()) {
        alert('Button text is required');
        return;
      }
      if (!formData.media_url && formData.media_type !== 'comparison') {
        alert('Please upload a media file');
        return;
      }
      if (formData.media_type === 'comparison' && (!formData.comparison_before_url || !formData.comparison_after_url)) {
        alert('Please upload both before and after images for comparison');
        return;
      }

      await createHomeSection(formData);

      onSave();
      alert('Section created successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to create section. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            Create New Section ({nextSectionNumber})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 标题和副标题 - 使用与 EditSectionModal 相同的字段 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
            </label>
            <textarea
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter section title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle
            </label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter section subtitle"
            />
          </div>

          {/* 卡片标题 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Title (Left)
              </label>
              <input
                type="text"
                value={formData.card_title}
                onChange={(e) => setFormData({ ...formData, card_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., AI DESIGN PREVIEW"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Subtitle (Right)
              </label>
              <input
                type="text"
                value={formData.card_subtitle}
                onChange={(e) => setFormData({ ...formData, card_subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Interior Design"
              />
            </div>
          </div>

          {/* 按钮配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={formData.button_text}
                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Get Started"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Button Link (Page)
              </label>
              <select
                value={formData.button_link}
                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availablePages.map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 显示模式选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, display_mode: 'media_showcase' })}
                className={`py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.display_mode === 'media_showcase'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium">📺 Media Showcase</div>
                <div className="text-xs text-slate-500 mt-1">Image/Video/Comparison</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, display_mode: 'gallery_wall' })}
                className={`py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.display_mode === 'gallery_wall'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium">🖼️ Gallery Wall</div>
                <div className="text-xs text-slate-500 mt-1">Template Showcase</div>
              </button>
            </div>
          </div>

          {/* Gallery Wall配置（仅当选择gallery_wall时显示）*/}
          {formData.display_mode === 'gallery_wall' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <h4 className="font-medium text-slate-800 flex items-center gap-2">
                <span>🎨</span> Gallery Wall Settings
              </h4>
              
              {/* 筛选类型 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Type
                </label>
                <select
                  value={formData.gallery_filter_type || 'all_random'}
                  onChange={(e) => setFormData({ ...formData, gallery_filter_type: e.target.value as GalleryFilterType })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all_random">Random from All Categories</option>
                  <option value="main_category">Specific Main Category</option>
                  <option value="main_random">Random from Specific Category</option>
                  <option value="sub_category">Specific Sub Category</option>
                </select>
              </div>
              
              {/* 主分类选择（当需要时显示）*/}
              {formData.gallery_filter_type && ['main_category', 'main_random', 'sub_category'].includes(formData.gallery_filter_type) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Main Category
                  </label>
                  <select
                    value={formData.gallery_main_category || ''}
                    onChange={(e) => setFormData({ ...formData, gallery_main_category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Category...</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Exterior Design">Exterior Design</option>
                    <option value="Garden & Backyard Design">Garden & Backyard Design</option>
                    <option value="Festive Decor">Festive Decor</option>
                    <option value="Wall Paint">Wall Paint</option>
                    <option value="Floor Style">Floor Style</option>
                  </select>
                </div>
              )}
              
              {/* 二级分类（仅sub_category模式显示）*/}
              {formData.gallery_filter_type === 'sub_category' && formData.gallery_main_category && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={formData.gallery_sub_category || ''}
                    onChange={(e) => setFormData({ ...formData, gallery_sub_category: e.target.value })}
                    placeholder="e.g., Modern, Victorian, Minimalist"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the exact sub-category name from your template database
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 媒体类型选择（仅当选择media_showcase时显示）*/}
          {formData.display_mode === 'media_showcase' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Media Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'image' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <IconPhoto className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Image</div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'video' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'video'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <IconVideo className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Video</div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'comparison' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'comparison'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg mb-1">⇄</div>
                  <div className="text-sm font-medium">Before/After</div>
                </button>
              </div>
            </div>
          )}

          {/* 媒体上传 - 简化版，复用 MediaUploadField */}
          {formData.display_mode === 'media_showcase' && formData.media_type !== 'comparison' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Media File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept={formData.media_type === 'video' ? 'video/mp4' : 'image/*'}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'main')}
                  disabled={uploading}
                  className="hidden"
                  id="create-upload-main"
                />
                <label
                  htmlFor="create-upload-main"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <IconUpload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {uploading ? 'Uploading...' : formData.media_url ? 'Change File' : 'Upload File'}
                  </span>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">Recommended: 800 x 600 px (4:3 ratio)</p>
              {formData.media_url && (
                <div className="mt-2 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                  {formData.media_type === 'image' ? (
                    <img src={formData.media_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={formData.media_url} className="w-full h-full object-cover" controls />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comparison Images Upload */}
          {formData.display_mode === 'media_showcase' && formData.media_type === 'comparison' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Before Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'before')}
                  disabled={uploading}
                  className="hidden"
                  id="create-upload-before"
                />
                <label
                  htmlFor="create-upload-before"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <IconUpload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {uploading ? 'Uploading...' : formData.comparison_before_url ? 'Change' : 'Upload'}
                  </span>
                </label>
                {formData.comparison_before_url && (
                  <div className="mt-2 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                    <img src={formData.comparison_before_url} alt="Before" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  After Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'after')}
                  disabled={uploading}
                  className="hidden"
                  id="create-upload-after"
                />
                <label
                  htmlFor="create-upload-after"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <IconUpload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {uploading ? 'Uploading...' : formData.comparison_after_url ? 'Change' : 'Upload'}
                  </span>
                </label>
                {formData.comparison_after_url && (
                  <div className="mt-2 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
                    <img src={formData.comparison_after_url} alt="After" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          )}

          {/* 布局方向（仅media_showcase模式）*/}
          {formData.display_mode === 'media_showcase' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Layout Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout_direction: 'left-image' })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.layout_direction === 'left-image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  ← Image on Left
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout_direction: 'right-image' })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.layout_direction === 'right-image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Image on Right →
                </button>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="create-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="create-is-active" className="text-sm font-medium text-slate-700">
              Active (show on homepage)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <Button
            primary
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5"
          >
            {saving ? 'Creating...' : 'Create Section'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Edit Section Modal Component
interface EditSectionModalProps {
  section: HomeSection;
  onClose: () => void;
  onSave: () => void;
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({ section, onClose, onSave }) => {
  const [formData, setFormData] = useState<HomeSection>(section);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availablePages = [
    'Interior Design',
    'Wall Design',
    'Floor Style',
    'Garden & Backyard Design',
    'Exterior Design',
    'Festive Decor',
    'Item Replacement',
    'Style Matching'
  ];

  const handleFileUpload = async (
    file: File,
    type: 'main' | 'before' | 'after'
  ) => {
    try {
      setUploading(true);
      
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert('Please upload an image (JPG, PNG, WEBP) or video (MP4) file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const url = await uploadSectionMedia(file, section.section_number, type);

      // Delete old file if exists
      if (type === 'main' && formData.media_url && formData.media_url.includes('supabase')) {
        await deleteSectionMedia(formData.media_url);
      } else if (type === 'before' && formData.comparison_before_url && formData.comparison_before_url.includes('supabase')) {
        await deleteSectionMedia(formData.comparison_before_url);
      } else if (type === 'after' && formData.comparison_after_url && formData.comparison_after_url.includes('supabase')) {
        await deleteSectionMedia(formData.comparison_after_url);
      }

      // Update form data
      if (type === 'main') {
        setFormData({
          ...formData,
          media_url: url,
          media_type: isVideo ? 'video' : 'image'
        });
      } else if (type === 'before') {
        setFormData({
          ...formData,
          comparison_before_url: url,
          media_type: 'comparison'
        });
      } else if (type === 'after') {
        setFormData({
          ...formData,
          comparison_after_url: url,
          media_type: 'comparison'
        });
      }

      alert('Upload successful!');
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // 显示详细的错误信息
      let errorMessage = 'Upload failed. ';
      
      if (error?.message) {
        errorMessage += `Error: ${error.message}`;
      } else if (error?.error_description) {
        errorMessage += `Error: ${error.error_description}`;
      } else if (typeof error === 'string') {
        errorMessage += error;
      } else {
        errorMessage += 'Please check:\n1. You are logged in as admin\n2. Storage policies are configured\n3. File is less than 10MB';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.title.trim()) {
        alert('Title is required');
        return;
      }
      if (!formData.subtitle.trim()) {
        alert('Subtitle is required');
        return;
      }
      if (!formData.card_title.trim()) {
        alert('Card title is required');
        return;
      }
      if (!formData.card_subtitle.trim()) {
        alert('Card subtitle is required');
        return;
      }
      if (!formData.button_text.trim()) {
        alert('Button text is required');
        return;
      }
      if (!formData.media_url && formData.media_type !== 'comparison') {
        alert('Please upload a media file');
        return;
      }
      if (formData.media_type === 'comparison' && (!formData.comparison_before_url || !formData.comparison_after_url)) {
        alert('Please upload both before and after images for comparison');
        return;
      }

      await updateHomeSection(section.id, {
        title: formData.title,
        subtitle: formData.subtitle,
        media_url: formData.media_url,
        media_type: formData.media_type,
        comparison_before_url: formData.comparison_before_url,
        comparison_after_url: formData.comparison_after_url,
        card_title: formData.card_title,
        card_subtitle: formData.card_subtitle,
        button_text: formData.button_text,
        button_link: formData.button_link,
        layout_direction: formData.layout_direction,
        is_active: formData.is_active
      });

      onSave();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            Edit Section {section.section_number}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 显示模式选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, display_mode: 'media_showcase' })}
                className={`py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.display_mode === 'media_showcase'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium">📺 Media Showcase</div>
                <div className="text-xs text-slate-500 mt-1">Image/Video/Comparison</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, display_mode: 'gallery_wall' })}
                className={`py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.display_mode === 'gallery_wall'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium">🖼️ Gallery Wall</div>
                <div className="text-xs text-slate-500 mt-1">Template Showcase</div>
              </button>
            </div>
          </div>

          {/* Gallery Wall配置（仅当选择gallery_wall时显示）*/}
          {formData.display_mode === 'gallery_wall' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <h4 className="font-medium text-slate-800 flex items-center gap-2">
                <span>🎨</span> Gallery Wall Settings
              </h4>
              
              {/* 筛选类型 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter Type
                </label>
                <select
                  value={formData.gallery_filter_type || 'all_random'}
                  onChange={(e) => setFormData({ ...formData, gallery_filter_type: e.target.value as GalleryFilterType })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all_random">Random from All Categories</option>
                  <option value="main_category">Specific Main Category</option>
                  <option value="main_random">Random from Specific Category</option>
                  <option value="sub_category">Specific Sub Category</option>
                </select>
              </div>
              
              {/* 主分类选择（当需要时显示）*/}
              {formData.gallery_filter_type && ['main_category', 'main_random', 'sub_category'].includes(formData.gallery_filter_type) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Main Category
                  </label>
                  <select
                    value={formData.gallery_main_category || ''}
                    onChange={(e) => setFormData({ ...formData, gallery_main_category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Category...</option>
                    <option value="Interior Design">Interior Design</option>
                    <option value="Exterior Design">Exterior Design</option>
                    <option value="Garden & Backyard Design">Garden & Backyard Design</option>
                    <option value="Festive Decor">Festive Decor</option>
                    <option value="Wall Paint">Wall Paint</option>
                    <option value="Floor Style">Floor Style</option>
                  </select>
                </div>
              )}
              
              {/* 二级分类（仅sub_category模式显示）*/}
              {formData.gallery_filter_type === 'sub_category' && formData.gallery_main_category && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={formData.gallery_sub_category || ''}
                    onChange={(e) => setFormData({ ...formData, gallery_sub_category: e.target.value })}
                    placeholder="e.g., Modern, Victorian, Minimalist"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the exact sub-category name from your template database
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Media Type Selection（仅当选择media_showcase时显示）*/}
          {formData.display_mode === 'media_showcase' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Media Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'image' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <IconPhoto className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Image</div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'video' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'video'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <IconVideo className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Video</div>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, media_type: 'comparison' })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.media_type === 'comparison'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg mb-1">⇄</div>
                  <div className="text-sm font-medium">Before/After</div>
                </button>
              </div>
            </div>
          )}

          {/* Media Upload */}
          {formData.display_mode === 'media_showcase' && formData.media_type !== 'comparison' && (
            <MediaUploadField
              label="Media File"
              currentUrl={formData.media_url}
              onUpload={(file) => handleFileUpload(file, 'main')}
              uploading={uploading}
              accept={formData.media_type === 'video' ? 'video/mp4' : 'image/*'}
              hint="Recommended: 800 x 600 px (4:3 ratio) for images, MP4 format for videos"
            />
          )}

          {/* Comparison Images Upload */}
          {formData.display_mode === 'media_showcase' && formData.media_type === 'comparison' && (
            <div className="grid grid-cols-2 gap-4">
              <MediaUploadField
                label="Before Image"
                currentUrl={formData.comparison_before_url || ''}
                onUpload={(file) => handleFileUpload(file, 'before')}
                uploading={uploading}
                accept="image/*"
                hint="800 x 600 px"
              />
              <MediaUploadField
                label="After Image"
                currentUrl={formData.comparison_after_url || ''}
                onUpload={(file) => handleFileUpload(file, 'after')}
                uploading={uploading}
                accept="image/*"
                hint="800 x 600 px"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
            </label>
            <textarea
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter section title (use line breaks for multiline)"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle
            </label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter section subtitle"
            />
          </div>

          {/* Card Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Title (Left)
              </label>
              <input
                type="text"
                value={formData.card_title}
                onChange={(e) => setFormData({ ...formData, card_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., AI DESIGN PREVIEW"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Subtitle (Right)
              </label>
              <input
                type="text"
                value={formData.card_subtitle}
                onChange={(e) => setFormData({ ...formData, card_subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Interior Design"
              />
            </div>
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={formData.button_text}
              onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Get Started"
            />
          </div>

          {/* Button Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Button Link (Page)
            </label>
            <select
              value={formData.button_link}
              onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availablePages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Direction（仅media_showcase模式）*/}
          {formData.display_mode === 'media_showcase' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Layout Direction
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout_direction: 'left-image' })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.layout_direction === 'left-image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-medium">← Image on Left</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, layout_direction: 'right-image' })}
                  className={`py-3 px-4 rounded-xl border-2 transition-all ${
                    formData.layout_direction === 'right-image'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-medium">Image on Right →</div>
                </button>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is-active" className="text-sm font-medium text-slate-700">
              Active (show on homepage)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <Button
            primary
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Media Upload Field Component
interface MediaUploadFieldProps {
  label: string;
  currentUrl: string;
  onUpload: (file: File) => void;
  uploading: boolean;
  accept: string;
  hint?: string;
}

const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  currentUrl,
  onUpload,
  uploading,
  accept,
  hint
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      
      {currentUrl && (
        <div className="mb-3 aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
          {accept.includes('video') ? (
            <video src={currentUrl} className="w-full h-full object-cover" controls />
          ) : (
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          )}
        </div>
      )}

      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`upload-${label}`}
        />
        <label
          htmlFor={`upload-${label}`}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <IconUpload className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-600">
            {uploading ? 'Uploading...' : currentUrl ? 'Change File' : 'Upload File'}
          </span>
        </label>
      </div>
      
      {hint && (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
};

