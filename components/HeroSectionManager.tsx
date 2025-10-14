import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconPencil, IconX, IconUpload, IconPhoto, IconVideo } from './Icons';
import { HeroSection, HomeSectionMediaType } from '../types';
import {
  getHeroSectionForAdmin,
  updateHeroSection,
  uploadHeroMedia,
  deleteHeroMedia
} from '../services/heroSectionService';
import { Button } from './Button';
import { ImageComparison } from './ImageComparison';

interface HeroSectionManagerProps {
  onUpdate?: () => void;
}

export const HeroSectionManager: React.FC<HeroSectionManagerProps> = ({ onUpdate }) => {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadHeroSection();
  }, []);

  const loadHeroSection = async () => {
    try {
      setLoading(true);
      const data = await getHeroSectionForAdmin();
      setHeroSection(data);
    } catch (error) {
      console.error('Error loading hero section:', error);
      alert('Failed to load hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
  };

  const handleSaveSuccess = () => {
    loadHeroSection();
    handleCloseModal();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading hero section...</div>
      </div>
    );
  }

  if (!heroSection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Hero section not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hero Section Management</h2>
          <p className="text-slate-500 mt-1">Manage content for homepage hero area (Section 1)</p>
        </div>
      </div>

      {/* Hero Section Preview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Section 1 - Hero Area</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                heroSection.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {heroSection.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit hero section"
              >
                <IconPencil className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Title Preview */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Main Title</h4>
                <div className="space-y-1 text-slate-900 font-semibold">
                  <div>{heroSection.title_line_1}</div>
                  <div>{heroSection.title_line_2}</div>
                  <div>{heroSection.title_line_3}</div>
                  <div>{heroSection.title_line_4}</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Button</h4>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-800 rounded-lg">
                  <span>{heroSection.button_text}</span>
                  <span>→</span>
                  <span className="text-xs">({heroSection.button_link})</span>
                </div>
              </div>
            </div>

            {/* Right: Preview Card */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Preview Card</h4>
              <div className="bg-slate-100 rounded-xl p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">{heroSection.preview_title}</span>
                  <span className="text-slate-700">{heroSection.preview_subtitle}</span>
                </div>
                <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden mb-2">
                  {heroSection.preview_media_type === 'image' && (
                    <img
                      src={heroSection.preview_media_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {heroSection.preview_media_type === 'video' && (
                    <video
                      src={heroSection.preview_media_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                  )}
                  {heroSection.preview_media_type === 'comparison' && 
                   heroSection.preview_comparison_before_url && 
                   heroSection.preview_comparison_after_url && (
                    <ImageComparison
                      beforeImage={heroSection.preview_comparison_before_url}
                      afterImage={heroSection.preview_comparison_after_url}
                    />
                  )}
                </div>
                <div className="text-xs text-center text-slate-500 bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2 rounded">
                  Generate AI Design
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && heroSection && (
          <EditHeroModal
            heroSection={heroSection}
            onClose={handleCloseModal}
            onSave={handleSaveSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Edit Hero Modal Component
interface EditHeroModalProps {
  heroSection: HeroSection;
  onClose: () => void;
  onSave: () => void;
}

const EditHeroModal: React.FC<EditHeroModalProps> = ({ heroSection, onClose, onSave }) => {
  const [formData, setFormData] = useState<HeroSection>(heroSection);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availablePages = [
    'Interior Design',
    'Wall Paint',
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

      const url = await uploadHeroMedia(file, type);

      // Delete old file if exists
      if (type === 'main' && formData.preview_media_url && formData.preview_media_url.includes('supabase')) {
        await deleteHeroMedia(formData.preview_media_url);
      } else if (type === 'before' && formData.preview_comparison_before_url && formData.preview_comparison_before_url.includes('supabase')) {
        await deleteHeroMedia(formData.preview_comparison_before_url);
      } else if (type === 'after' && formData.preview_comparison_after_url && formData.preview_comparison_after_url.includes('supabase')) {
        await deleteHeroMedia(formData.preview_comparison_after_url);
      }

      // Update form data
      if (type === 'main') {
        setFormData({
          ...formData,
          preview_media_url: url,
          preview_media_type: isVideo ? 'video' : 'image'
        });
      } else if (type === 'before') {
        setFormData({
          ...formData,
          preview_comparison_before_url: url,
          preview_media_type: 'comparison'
        });
      } else if (type === 'after') {
        setFormData({
          ...formData,
          preview_comparison_after_url: url,
          preview_media_type: 'comparison'
        });
      }

      alert('Upload successful!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.title_line_1.trim() || !formData.title_line_2.trim() || 
          !formData.title_line_3.trim() || !formData.title_line_4.trim()) {
        alert('All title lines are required');
        return;
      }
      if (!formData.button_text.trim()) {
        alert('Button text is required');
        return;
      }
      if (!formData.preview_media_url && formData.preview_media_type !== 'comparison') {
        alert('Please upload a preview media file');
        return;
      }
      if (formData.preview_media_type === 'comparison' && 
          (!formData.preview_comparison_before_url || !formData.preview_comparison_after_url)) {
        alert('Please upload both before and after images for comparison');
        return;
      }

      await updateHeroSection(heroSection.id, {
        title_line_1: formData.title_line_1,
        title_line_2: formData.title_line_2,
        title_line_3: formData.title_line_3,
        title_line_4: formData.title_line_4,
        button_text: formData.button_text,
        button_link: formData.button_link,
        preview_media_url: formData.preview_media_url,
        preview_media_type: formData.preview_media_type,
        preview_comparison_before_url: formData.preview_comparison_before_url,
        preview_comparison_after_url: formData.preview_comparison_after_url,
        preview_title: formData.preview_title,
        preview_subtitle: formData.preview_subtitle,
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
            Edit Hero Section (Section 1)
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <IconX className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title Lines */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Main Title (4 Lines)
            </label>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(num => (
                <input
                  key={num}
                  type="text"
                  value={formData[`title_line_${num}` as keyof HeroSection] as string}
                  onChange={(e) => setFormData({ ...formData, [`title_line_${num}`]: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Line ${num}`}
                />
              ))}
            </div>
          </div>

          {/* Button */}
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

          {/* Preview Card Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preview Title (Left)
              </label>
              <input
                type="text"
                value={formData.preview_title}
                onChange={(e) => setFormData({ ...formData, preview_title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="AI DESIGN PREVIEW"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preview Subtitle (Right)
              </label>
              <input
                type="text"
                value={formData.preview_subtitle}
                onChange={(e) => setFormData({ ...formData, preview_subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Alpine Interior Adventure"
              />
            </div>
          </div>

          {/* Media Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preview Card Media Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, preview_media_type: 'image' })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.preview_media_type === 'image'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <IconPhoto className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Image</div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, preview_media_type: 'video' })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.preview_media_type === 'video'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <IconVideo className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Video</div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, preview_media_type: 'comparison' })}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                  formData.preview_media_type === 'comparison'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-lg mb-1">⇄</div>
                <div className="text-sm font-medium">Before/After</div>
              </button>
            </div>
          </div>

          {/* Media Upload */}
          {formData.preview_media_type !== 'comparison' && (
            <MediaUploadField
              label="Preview Media File"
              currentUrl={formData.preview_media_url}
              onUpload={(file) => handleFileUpload(file, 'main')}
              uploading={uploading}
              accept={formData.preview_media_type === 'video' ? 'video/mp4' : 'image/*'}
              hint="Recommended: 800 x 600 px (4:3 ratio) for images, MP4 format for videos"
            />
          )}

          {/* Comparison Images Upload */}
          {formData.preview_media_type === 'comparison' && (
            <div className="grid grid-cols-2 gap-4">
              <MediaUploadField
                label="Before Image"
                currentUrl={formData.preview_comparison_before_url || ''}
                onUpload={(file) => handleFileUpload(file, 'before')}
                uploading={uploading}
                accept="image/*"
                hint="800 x 600 px"
              />
              <MediaUploadField
                label="After Image"
                currentUrl={formData.preview_comparison_after_url || ''}
                onUpload={(file) => handleFileUpload(file, 'after')}
                uploading={uploading}
                accept="image/*"
                hint="800 x 600 px"
              />
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is-active-hero"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is-active-hero" className="text-sm font-medium text-slate-700">
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

// Media Upload Field Component (reused)
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
          id={`upload-hero-${label}`}
        />
        <label
          htmlFor={`upload-hero-${label}`}
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

