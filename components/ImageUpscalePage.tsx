/**
 * Image Upscale Page - Standalone Component
 * Allows users to upscale images using AI
 */
import React, { useState, useRef, useContext } from 'react';
import { Button } from './Button';
import { IconUpload, IconSparkles, IconDownload, IconLock, IconTrash, IconX } from './Icons';
import { upscaleImage, getUpscaleResolution, getUpscaleCreditCost } from '../services/imageUpscaleService';
import { AuthContext } from '../context/AuthContext';
import { User } from '../types';
import { supabase } from '../config/supabase';

interface ImageUpscalePageProps {
  currentUser: User | null;
  onLoginRequest: () => void;
  onUpgrade: () => void;
}

export const ImageUpscalePage: React.FC<ImageUpscalePageProps> = ({
  currentUser,
  onLoginRequest,
  onUpgrade,
}) => {
  const { profile } = useContext(AuthContext);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scale, setScale] = useState<'2x' | '4x' | '8x'>('2x');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 权限检查 - Pro/Premium/Business 用户可以使用
  const hasAccess = currentUser && currentUser.permissionLevel >= 2;
  const userCredits = profile?.credits || 0;
  const originalSize = 1024; // 假设原图是1024x1024

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUpscaledUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择有效的图片文件');
      return;
    }

    setSelectedImage(file);
    setUpscaledUrl(null);
    setError(null);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpscale = async () => {
    if (!selectedImage || !imagePreview || isUpscaling) return;

    if (!currentUser) {
      onLoginRequest();
      return;
    }

    if (!hasAccess) {
      onUpgrade();
      return;
    }

    const creditCost = getUpscaleCreditCost();
    if (userCredits < creditCost) {
      setError(`信用点不足！需要 ${creditCost} 点，当前只有 ${userCredits} 点`);
      return;
    }

    setIsUpscaling(true);
    setError(null);

    try {
      // 第1步：上传图片到 Supabase Storage 获取公开 URL
      const timestamp = Date.now();
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `upscale-${timestamp}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      console.log('📤 Uploading image to storage...');
      
      const { error: uploadError } = await supabase.storage
        .from('upscale-images')
        .upload(filePath, selectedImage, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`);
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('upscale-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('✅ Image uploaded:', publicUrl);

      // 第2步：调用放大 API
      const result = await upscaleImage({
        imageUrl: publicUrl,
        scale,
      });

      setUpscaledUrl(result.upscaledImageUrl);

      // 第3步：可选 - 删除临时文件（等待一段时间后再删除，确保 Replicate 已经读取）
      setTimeout(async () => {
        try {
          await supabase.storage.from('upscale-images').remove([filePath]);
          console.log('🗑️ Temporary file cleaned up');
        } catch (e) {
          console.warn('Failed to clean up temporary file:', e);
        }
      }, 60000); // 60秒后删除

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '放大失败';
      setError(errorMsg);
      console.error('Upscale error:', err);
    } finally {
      setIsUpscaling(false);
    }
  };


  const handleDownload = async () => {
    if (!upscaledUrl) return;
    
    try {
      // 使用 fetch 获取图片，解决跨域下载问题
      const response = await fetch(upscaledUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled_${scale}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理 blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error('Download failed:', err);
      // 降级：直接打开链接
      window.open(upscaledUrl, '_blank');
    }
  };

  const handleImageClick = () => {
    if (upscaledUrl) {
      setFullscreenImage(upscaledUrl);
    }
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const targetResolution = getUpscaleResolution(originalSize, scale);
  const creditCost = getUpscaleCreditCost();

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0a0a0a]">
      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                Image Upscale
              </h1>
              <p className="text-[#a0a0a0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                Enhance your images with AI-powered upscaling. Scale up to 8x while maintaining quality.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          {!imagePreview ? (
            <div className="bg-[#1a1a1a] rounded-xl border-2 border-dashed border-[#333333] p-12">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="text-center">
                <IconUpload className="mx-auto h-16 w-16 text-[#666666] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Upload Your Image
                </h3>
                <p className="text-[#a0a0a0] mb-6" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Supports JPG, PNG, WEBP
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  primary
                  className="inline-flex items-center gap-2"
                >
                  <IconUpload className="w-5 h-5" />
                  Choose Image
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                    Original Image
                  </h3>
                </div>
                <div className="relative aspect-square max-w-md mx-auto bg-[#0a0a0a] rounded-lg overflow-hidden">
                  <button
                    onClick={handleRemoveImage}
                    type="button"
                    className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                    aria-label="Remove image"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                  <img
                    src={imagePreview}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Scale Factor Selection */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
                <h3 className="text-white font-semibold mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Scale Factor
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['2x', '4x', '8x'] as const).map((s) => {
                    const resolution = getUpscaleResolution(originalSize, s);
                    return (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        disabled={isUpscaling || !hasAccess}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          scale === s
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-[#333333] hover:border-[#555555] text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      >
                        <div className="font-bold text-2xl mb-1">{s}</div>
                        <div className="text-xs text-[#a0a0a0]">{resolution}×{resolution}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info & Credits */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[#a0a0a0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📏</span>
                      <span>{originalSize}×{originalSize} → {targetResolution}×{targetResolution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <span>{creditCost} Credit</span>
                    </div>
                  </div>
                  {hasAccess && (
                    <div className="text-[#a0a0a0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Available: {userCredits} credits
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>{error}</p>
                  </div>
                </div>
              )}

              {/* Upscale Button */}
              <div className="relative">
                {!hasAccess && (
                  <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <IconLock className="w-12 h-12 text-[#666666] mx-auto mb-4" />
                      <p className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                        This feature requires Pro membership
                      </p>
                      <Button onClick={onUpgrade} primary>
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleUpscale}
                  disabled={isUpscaling || !hasAccess}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {isUpscaling ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                      Upscaling...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-6 h-6" />
                      Upscale ({creditCost} Credit)
                    </>
                  )}
                </button>
              </div>

              {/* Result */}
              {upscaledUrl && (
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-green-500/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className="text-green-400 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                        Upscale Complete!
                      </h3>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      <IconDownload className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div 
                    className="relative aspect-square max-w-2xl mx-auto bg-[#0a0a0a] rounded-lg overflow-hidden cursor-pointer group"
                    onClick={handleImageClick}
                  >
                    <img
                      src={upscaledUrl}
                      alt="Upscaled result"
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm bg-black/60 px-4 py-2 rounded-lg">
                        点击查看大图
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <IconX className="w-6 h-6" />
          </button>
          <div className="max-w-7xl max-h-full flex items-center justify-center">
            <img
              src={fullscreenImage}
              alt="Upscaled result - fullscreen"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

