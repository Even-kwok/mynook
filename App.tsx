import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GoogleGenAI, Chat, Content } from "@google/genai";
// FIX: Import ManagedTemplateData and ManagedPromptTemplateCategory to resolve type errors.
import { GeneratedImage, PromptTemplateCategory, GenerationBatch, PromptTemplate, AdvisorPersona, ChatMessage, User, ManagedTemplateData, ManagedPromptTemplateCategory, CanvasImage, DrawablePath, Annotation, PromptPreset } from './types';
import { toBase64 } from './utils/imageUtils';
import { generateImage, generateTextResponse } from './services/geminiService';
import { Button } from './components/Button';
import { IconUpload, IconSparkles, IconOptions, IconDownload, IconCamera, IconX, IconPlus, IconPhoto, IconBell, IconUserCircle, IconLogo, IconCheck, IconCrown, IconChevronDown, IconGoogle, IconApple, IconViewLarge, IconViewMedium, IconViewSmall, IconTrash, IconBookmark, IconLock } from './components/Icons';
import { ALL_ADVISORS, ALL_TEMPLATE_CATEGORIES, ROOM_TYPES, STYLES_BY_ROOM_TYPE, ITEM_TYPES, BUILDING_TYPES, PERMISSION_MAP, ADMIN_PAGE_CATEGORIES, EXPLORE_GALLERY_ITEMS } from './constants';
import { getAllTemplates, getAllTemplatesPublic, getTemplatePrompts } from './services/templateService';
import { PricingPage } from './components/PricingPage';
import { FreeCanvasPage, MyDesignsSidebar } from './components/FreeCanvasPage';
import { AdminPage } from './components/AdminPage';
import { ImageComparison } from './components/ImageComparison';
import { HomeSection, HeroSection } from './types';
import { getAllHomeSections } from './services/homeSectionService';
import { getHeroSection } from './services/heroSectionService';
import { HeroBannerCarousel } from './components/HeroBannerCarousel';
import { TermsPage } from './components/TermsPage';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { MEMBERSHIP_CONFIG } from './types/database';

// --- Re-styled Helper Components ---

const PromptTemplates: React.FC<{
    categories: PromptTemplateCategory[];
    onTemplateSelect: (templateId: string) => void;
    selectedTemplateIds: string[];
    maxTemplates: number;
}> = ({ categories, onTemplateSelect, selectedTemplateIds, maxTemplates }) => {
    return (
        <div className="space-y-6">
            {categories.map(category => (
                <div key={category.name}>
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">{category.name}</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {category.templates.map((template) => {
                            const isSelected = selectedTemplateIds.includes(template.id);
                            const limitReached = selectedTemplateIds.length >= maxTemplates;
                            const isDisabled = !isSelected && limitReached;

                            return (
                                <div
                                    key={template.id}
                                    onClick={() => !isDisabled && onTemplateSelect(template.id)}
                                    className={`group ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                    <div className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-100 transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-200 group-hover:border-indigo-400'}`}>
                                        <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-indigo-700/60 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                                    <IconCheck className="w-5 h-5 text-indigo-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-center text-xs mt-2 font-medium transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{template.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


const PhotoDisplay: React.FC<{
    era: string;
    imageUrl: string;
    onDownload: (imageUrl: string, era: string) => void;
    onRegenerate: () => void;
    onImageClick: (imageUrl: string) => void;
    onDragStart: (e: React.DragEvent<HTMLImageElement>) => void;
}> = ({ era, imageUrl, onDownload, onRegenerate, onImageClick, onDragStart }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='relative group'
        >
            <div className="rounded-2xl overflow-hidden cursor-grab aspect-square" onClick={() => onImageClick(imageUrl)}>
                <img src={imageUrl} alt={`Generated image: ${era}`} className="w-full h-full object-cover" draggable="true" onDragStart={onDragStart} />
            </div>
            
            <div className="absolute top-3 right-3 z-10" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full bg-white/30 text-slate-800 hover:bg-white/90 transition-colors backdrop-blur-md shadow-lg"
                    aria-label="Options"
                >
                    <IconOptions />
                </button>

                <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-12 mt-1 w-48 origin-top-right bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 text-slate-700 text-sm flex flex-col p-1.5"
                    >
                        <button onClick={() => { onRegenerate(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-500/10 rounded-lg transition-colors">Regenerate</button>
                        <button onClick={() => { onDownload(imageUrl, era); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-indigo-500/10 rounded-lg transition-colors">Download</button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const SkeletonLoader: React.FC<{className?: string}> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`}></div>
);

const LoadingCard: React.FC = () => (
    <div className="relative bg-slate-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="aspect-square bg-slate-200"></div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    </div>
);


const ErrorCard: React.FC<{ onRegenerate?: () => void; }> = ({ onRegenerate }) => {
    return (
        <div className="aspect-square flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-red-50 border-2 border-dashed border-red-300">
            <p className="text-red-600 font-medium mb-4">Generation failed</p>
            {onRegenerate && <Button onClick={onRegenerate} primary>Retry</Button>}
        </div>
    );
}

const ErrorNotification: React.FC<{message: string | null; onDismiss: () => void}> = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-md p-4 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-800 rounded-2xl shadow-2xl flex items-center justify-between animate-fade-in-down" style={{transform: 'translateX(-50%)'}}>
            <span>{message}</span>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-slate-100 transition-colors ml-4">
                <IconX/>
            </button>
        </div>
    );
};

const CameraModal: React.FC<{
    isOpen: boolean; 
    onClose: () => void; 
    onCapture: (imageDataUrl: string) => void;
}> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (videoRef.current) {
            setCameraError(null);
            try {
                stopCamera();
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1024 }, height: { ideal: 1024 }, facingMode: 'user' }
                });
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                setCameraError("Camera access denied. Please allow camera access in your browser settings.");
            }
        }
    }, [stopCamera]);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, capturedImage, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.scale(-1, 1);
            context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            setCapturedImage(null);
            onClose();
        }
    };

    const handleRetake = () => setCapturedImage(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-2xl text-center relative"
             >
                <h3 className="text-2xl font-semibold mb-4 text-slate-900">Camera</h3>
                <div className="aspect-square bg-slate-200 rounded-2xl overflow-hidden relative mb-4 flex items-center justify-center">
                    {cameraError ? <div className="p-4 text-red-500">{cameraError}</div> : (
                        <>
                            {capturedImage ? 
                                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" /> : 
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                            }
                        </>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    {capturedImage ? (
                        <>
                            <Button onClick={handleRetake}>Retake</Button>
                            <Button onClick={handleConfirm} primary>Use Photo</Button>
                        </>
                    ) : (
                         <button onClick={handleCapture} disabled={!!cameraError} className="w-20 h-20 rounded-full bg-white border-4 border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"></button>
                    )}
                </div>
                
                <button onClick={() => { setCapturedImage(null); onClose(); }} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"><IconX /></button>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </motion.div>
        </div>
    );
};

const ImageViewerModal: React.FC<{ imageUrl: string | null; onClose: () => void; }> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-lg" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="relative"
                onClick={(e) => e.stopPropagation()} 
            >
                <img src={imageUrl} alt="Full screen view" className="block max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
                <button onClick={onClose} className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200" aria-label="Close image viewer"><IconX /></button>
            </motion.div>
        </div>
    );
};

const ImageUploader: React.FC<{
  title: string;
  description: string;
  imageUrl: string | null;
  isUploading: boolean;
  onFileSelect: () => void;
  onRemove: () => void;
  onImageClick: (imageUrl: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ title, description, imageUrl, isUploading, onFileSelect, onRemove, onImageClick, onDrop }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e);
    };

    return (
        <div>
            <div
                className={`aspect-square w-full bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-dashed relative group hover:border-indigo-400 transition-all duration-300 ${isDragOver ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-slate-300'} ${imageUrl ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (imageUrl) {
                        onImageClick(imageUrl);
                    } else if (!isUploading) {
                        onFileSelect();
                    }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isUploading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                ) : imageUrl ? (
                    <>
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-2xl" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            aria-label="Remove uploaded image"
                        >
                            <IconX />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center p-4 cursor-pointer">
                         <div className="space-y-1 text-center">
                            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                            <p className="text-sm text-slate-500">{description}</p>
                        </div>
                        <div className="flex flex-col items-center text-slate-400 mt-4">
                          <IconUpload />
                          <span className="text-sm mt-2 font-medium">Upload or Drag</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MultiItemUploader: React.FC<{
  images: (string | null)[];
  isUploadingSlots: Record<string, boolean>;
  onFileSelect: (index: number) => void;
  onRemove: (index: number) => void;
}> = ({ images, isUploadingSlots, onFileSelect, onRemove }) => {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-slate-800">Upload Furniture/Items to Place</h3>
                <p className="text-sm text-slate-500">Upload up to 9 items to place in the redesigned room.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {images.map((imageUrl, index) => {
                    const isUploading = !!isUploadingSlots[`multi-${index}`];
                    return (
                        <div
                            key={index}
                            className="aspect-square w-full bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 relative group cursor-pointer hover:border-indigo-400/70 transition-colors"
                            onClick={() => !imageUrl && !isUploading && onFileSelect(index)}
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                            ) : imageUrl ? (
                                <>
                                    <img src={`Item ${index + 1}`} alt={`Item ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        aria-label={`Remove item ${index + 1}`}
                                    >
                                        <IconX />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                                    <IconPlus />
                                    <span className="text-xs mt-1 font-medium">Add</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- New Page/Layout Components ---

const DesignToolsMenu: React.FC<{
    onNavigate: (page: string) => void;
    activeItem: string;
    designTools: { key: string; label: string; requiresPremium?: boolean; comingSoon?: boolean; }[];
    user: User | null;
}> = ({ onNavigate, activeItem, designTools, user }) => {
    const handleNavigate = (item: { key: string; label: string; requiresPremium?: boolean; comingSoon?: boolean; }) => {
        // 如果是Coming Soon功能，不允许导航
        if (item.comingSoon) {
            return;
        }
        // 允许所有用户进入页面浏览功能
        // 权限检查将在具体使用功能时进行（如点击生成按钮）
        onNavigate(item.label);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full mt-3 w-80 origin-top-left bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
        >
            {designTools.map(item => (
                <button
                    key={item.key}
                    onClick={() => handleNavigate(item)}
                    disabled={item.comingSoon}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                        item.comingSoon 
                            ? 'opacity-50 cursor-not-allowed' 
                            : activeItem === item.label 
                                ? 'bg-indigo-500/10 text-indigo-600' 
                                : 'hover:bg-slate-500/10'
                    }`}
                >
                    <span>{item.label}</span>
                    {item.comingSoon ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-400 to-slate-500 text-white">
                            <IconLock className="w-3 h-3" /> Coming
                        </span>
                    ) : item.requiresPremium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-amber-500 text-white">
                            👑 Premium
                        </span>
                    ) : null}
                </button>
            ))}
        </motion.div>
    );
};


const Header: React.FC<{
    activeItem: string;
    onNavigate: (page: string) => void;
    user: User | null;
    onLoginClick: () => void;
    onLogout: () => void;
    designTools: { key: string; label: string; }[];
}> = ({ activeItem, onNavigate, user, onLoginClick, onLogout, designTools }) => {
    
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [designToolsOpen, setDesignToolsOpen] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const designToolsRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setUserMenuOpen(false);
        }
        if (designToolsRef.current && !designToolsRef.current.contains(event.target as Node)) {
            setDesignToolsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const designToolLabels = useMemo(() => designTools.map(item => item.label), [designTools]);
    const isDesignToolActive = useMemo(() => designToolLabels.includes(activeItem), [designToolLabels, activeItem]);
    const activeDesignToolLabel = isDesignToolActive ? activeItem : 'Start Design My Nook';

    // 检测是否在功能页面（白底页面）
    const isFunctionalPage = useMemo(() => {
        const functionalPages = [
            ...designToolLabels,
            'Terms',
            'Pricing',
            'Admin'
        ];
        return functionalPages.includes(activeItem);
    }, [designToolLabels, activeItem]);

    const upgradeButton = useMemo(() => {
        if (!user) {
            return { text: 'Upgrade to PRO', visible: true, disabled: false };
        }
        switch (user.permissionLevel) {
            case 1: // Normal
                return { text: 'Upgrade to PRO', visible: true, disabled: false };
            case 2: // Pro
                return { text: 'Upgrade to Premium', visible: true, disabled: false };
            case 3: // Premium
                return { text: 'Upgrade to Business', visible: true, disabled: false };
            case 4: // Business
                return { text: 'Business Plan', visible: true, disabled: true };
            default:
                return { text: 'Upgrade to PRO', visible: true, disabled: false };
        }
    }, [user]);

    const navItems = ['Terms', 'Pricing'];

    return (
        <header className={`fixed top-2 left-0 right-0 flex items-center justify-between pl-8 h-[72px] z-40 transition-all ${isFunctionalPage ? 'bg-white shadow-sm' : 'bg-transparent'}`} style={{ paddingRight: '38px' }}>
            <div className="flex items-center gap-6">
                <button onClick={() => onNavigate('Explore')} className="flex items-center gap-2 cursor-pointer">
                    <span className="logo-gradient" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px', letterSpacing: '0.8px' }}>MyNook.AI</span>
                </button>
                {/* Moved and restyled Start Design button */}
                <div className="relative hidden md:block" ref={designToolsRef}>
                    <button
                        onClick={() => setDesignToolsOpen(o => !o)}
                        className={`px-4 rounded-full text-sm leading-5 font-normal transition-all flex items-center justify-between gap-2 shadow-md ${
                            isFunctionalPage 
                                ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200' 
                                : isDesignToolActive 
                                    ? 'text-white bg-[#2b2f34] ring-1 ring-white/10' 
                                    : 'text-white/90 bg-[#2b2f34] hover:bg-[#32383f] ring-1 ring-white/10'
                        }`}
                        style={{ width: '239.09px', height: '32px' }}
                    >
                        <IconSparkles className={`w-4 h-4 ${isFunctionalPage ? 'text-indigo-500' : 'text-white'}`} />
                        <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>{activeDesignToolLabel}</span>
                        <IconChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${designToolsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {designToolsOpen && <DesignToolsMenu onNavigate={(page) => { onNavigate(page); setDesignToolsOpen(false); }} activeItem={activeItem} designTools={designTools} user={user} />}
                    </AnimatePresence>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Right-side nav items (moved button removed) */}
                <nav className="hidden md:flex items-center gap-2">

                    {navItems.map(item => (
                         <a 
                           key={item} 
                           href="#" 
                           onClick={(e) => { e.preventDefault(); onNavigate(item); }}
                           className={`px-3 py-2 text-base font-normal transition-colors ${isFunctionalPage ? 'text-black' : 'text-white'}`}
                           style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}
                        >
                           {item}
                        </a>
                    ))}
                    {!user && (
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); onLoginClick(); }}
                            className={`px-3 py-2 text-base font-normal transition-colors ${isFunctionalPage ? 'text-black' : 'text-white'}`}
                            style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}
                        >
                            Login
                        </a>
                    )}
                </nav>
                {user && (
                    <div className="flex items-center gap-2">
                        {/* 会员等级徽章 */}
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            user.permissionLevel === 1 ? 'bg-slate-100 text-slate-700' :
                            user.permissionLevel === 2 ? 'bg-blue-100 text-blue-700' :
                            user.permissionLevel === 3 ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {user.permissionLevel === 1 ? '🆓 FREE' :
                             user.permissionLevel === 2 ? '⭐ PRO' :
                             user.permissionLevel === 3 ? '👑 PREMIUM' :
                             '💼 BUSINESS'}
                        </div>
                        {/* 信用点显示 */}
                        <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1.5">
                            <IconSparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{user.credits.toLocaleString()}</span>
                        </div>
                    </div>
                )}

                {!user && (
                    <button
                        onClick={onLoginClick}
                        className="hidden md:flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-colors"
                        style={{ width: '171.66px', height: '36px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}
                    >
                        REGISTER for FREE
                    </button>
                )}
                {user && upgradeButton.visible && (
                    <Button 
                        primary 
                        className="rounded-full !px-4 !py-2 text-sm font-bold hidden md:flex" 
                        onClick={() => onNavigate('Pricing')}
                        disabled={upgradeButton.disabled}
                    >
                        <IconCrown className="w-4 h-4 mr-1.5" />
                        <span>{upgradeButton.text}</span>
                    </Button>
                )}

                {user && (
                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setUserMenuOpen(o => !o)} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center font-bold text-lg shadow-inner shadow-black/10 hover:scale-110 transition-transform">
                            🐱
                        </button>
                        <AnimatePresence>
                            {userMenuOpen && <UserMenu user={user} onLogout={onLogout} onNavigate={onNavigate} />}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </header>
    );
}

const ResultsPlaceholder: React.FC<{isAdvisor?: boolean}> = ({ isAdvisor = false }) => {
    // FIX: Explicitly type `cardVariants` with `Variants` from framer-motion
    // to ensure correct type inference for the `ease` property in transitions.
    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: "easeOut",
            }
        })
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            className="w-full h-full flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md text-center flex flex-col items-center">
                <div className="relative w-48 h-40 mb-8 flex items-center justify-center">
                    {/* These are decorative cards */}
                    <motion.div
                        custom={0}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-3xl border border-slate-200 shadow-sm"
                        style={{ rotate: `8deg`, transformOrigin: 'bottom center' }}
                    />
                     <motion.div
                        custom={1}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-3xl border border-slate-200 shadow-md"
                        style={{ rotate: `-5deg`, transformOrigin: 'bottom center' }}
                    />
                    {/* Top card with icon */}
                    <motion.div
                        custom={2}
                        variants={cardVariants}
                        className="absolute w-40 h-44 bg-white rounded-3xl border border-slate-300 shadow-lg flex flex-col items-center justify-center p-4"
                    >
                        <IconSparkles className="w-12 h-12 text-indigo-500" />
                        <div className="w-24 h-2 bg-slate-200 rounded-full mt-4"></div>
                        <div className="w-16 h-2 bg-slate-200 rounded-full mt-2"></div>
                    </motion.div>
                </div>

                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-2xl font-bold text-slate-800"
                >
                    {isAdvisor ? "Your advisor's response will appear here" : "Your generated designs will appear here"}
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="text-slate-500 mt-2 max-w-sm"
                >
                    {isAdvisor ? "Ask a design question in the left panel to get expert advice." : "Get started by uploading a photo of your room and describing a style in the left panel."}
                </motion.p>
            </div>
        </motion.div>
    );
}

const ExplorePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
    const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [loadedRef] = useState({ current: false }); // 防止重复加载

    useEffect(() => {
        // 防止重复加载
        if (loadedRef.current) return;
        loadedRef.current = true;
        
        loadAllSections();
    }, []);

    const loadAllSections = async () => {
        try {
            // 并行加载 Hero Section 和 Home Sections
            const [hero, sections] = await Promise.all([
                getHeroSection(),
                getAllHomeSections()
            ]);
            
            setHeroSection(hero);
            setHomeSections(sections);
        } catch (error) {
            console.error('Error loading sections:', error);
        } finally {
            setSectionsLoading(false);
        }
    };

    // 渲染单个 Section（支持图片/视频/对比图）
    const renderSection = useCallback((section: HomeSection, index: number) => {
        const isLeftImage = section.layout_direction === 'left-image';
        
        // 媒体卡片
        const MediaCard = () => (
            <motion.div
                initial={{ opacity: 0, x: isLeftImage ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`w-full max-w-[704px] ${!isLeftImage ? 'lg:ml-auto' : ''}`}
            >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>{section.card_title}</span>
                        <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>{section.card_subtitle}</span>
                    </div>
                    
                    {/* 媒体显示区域 */}
                    <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 overflow-hidden">
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
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        )}
                        {section.media_type === 'comparison' && section.comparison_before_url && section.comparison_after_url && (
                            <ImageComparison
                                beforeImage={section.comparison_before_url}
                                afterImage={section.comparison_after_url}
                            />
                        )}
                    </div>
                    
                    <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                        Generate AI Design
                    </button>
                </div>
            </motion.div>
        );
        
        // 文字内容
        const TextContent = () => (
            <motion.div
                initial={{ opacity: 0, x: isLeftImage ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
            >
                <h2 
                    className="text-white whitespace-pre-line"
                    style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        fontWeight: 400, 
                        fontSize: '48px', 
                        lineHeight: '60px', 
                        letterSpacing: '0px'
                    }}
                >
                    {section.title}
                </h2>
                
                <p 
                    className="text-slate-300"
                    style={{ 
                        fontFamily: 'Arial, sans-serif', 
                        fontWeight: 400, 
                        fontSize: '16px', 
                        lineHeight: '24px', 
                        letterSpacing: '0px'
                    }}
                >
                    {section.subtitle}
                </p>

                <button
                    onClick={() => onNavigate(section.button_link)}
                    className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                    style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                >
                    {section.button_text}
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </motion.div>
        );
        
        return (
            <div key={section.id} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                {isLeftImage ? (
                    <>
                        <MediaCard />
                        <TextContent />
                    </>
                ) : (
                    <>
                        <TextContent />
                        <MediaCard />
                    </>
                )}
            </div>
        );
    }, [onNavigate]); // useCallback 依赖项

    // 使用 useMemo 缓存渲染的 sections，避免重复触发动画
    const renderedSections = useMemo(() => {
        if (sectionsLoading) return null;
        return homeSections.map((section) => renderSection(section, 0));
    }, [homeSections, sectionsLoading, renderSection]);

    return (
        <main className="min-h-screen bg-black relative overflow-y-auto">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
                    alt="Mountain background" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90" />
            </div>
            
            {/* Unified Content Container */}
            <div className="container mx-auto px-8 pt-[188px] pb-20 relative z-10">
                {/* Section 1 - Hero Area (Dynamic from Database) */}
                {!sectionsLoading && heroSection && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Left Side: Hero Title */}
                        <div className="space-y-6">
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-white"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif', 
                                    fontWeight: 400, 
                                    fontSize: '60px', 
                                    lineHeight: '75px', 
                                    letterSpacing: '0px',
                                    textRendering: 'optimizeLegibility',
                                    WebkitFontSmoothing: 'antialiased',
                                    MozOsxFontSmoothing: 'grayscale'
                                }}
                            >
                                <span className="block">{heroSection.title_line_1}</span>
                                <span className="block">{heroSection.title_line_2}</span>
                                <span className="block">{heroSection.title_line_3}</span>
                                <span className="block">{heroSection.title_line_4}</span>
                            </motion.h1>
                            
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                onClick={() => onNavigate(heroSection.button_link)}
                                className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                                style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                            >
                                {heroSection.button_text}
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </motion.button>
                        </div>
                        
                        {/* Right Side: Preview Card and Stats */}
                        <div className="flex flex-col items-end gap-6 w-full">
                            {/* Preview Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="w-full max-w-[704px] bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>{heroSection.preview_title}</span>
                                    <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>{heroSection.preview_subtitle}</span>
                                </div>
                                
                                {/* Preview Area */}
                                <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
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
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
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
                                
                                {/* Generate Button */}
                                <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                    Generate AI Design
                                </button>
                            </motion.div>
                            {/* Stats Bar - 固定数据 */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="w-full max-w-[704px] grid grid-cols-3 gap-4 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20"
                            >
                                <div className="text-center">
                                    <div className="text-cyan-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 30, lineHeight: '36px', letterSpacing: '0px' }}>50+</div>
                                    <div className="text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Design Styles</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-purple-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 30, lineHeight: '36px', letterSpacing: '0px' }}>10+</div>
                                    <div className="text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Room Types</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-blue-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 30, lineHeight: '36px', letterSpacing: '0px' }}>&lt;30s</div>
                                    <div className="text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Generation Time</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
                
                {/* Dynamically Rendered Sections 2-6 from Database */}
                {renderedSections}
                
                {/* LEGACY: Hardcoded Sections - Hidden */}
                {false && <>
                {/* Section 2 - Exterior Design Feature Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                        {/* Left Side: Preview Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="w-full max-w-[704px]"
                        >
                            {/* Preview Card */}
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>AI EXTERIOR PREVIEW</span>
                                    <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Modern Architectural Design</span>
                                </div>
                                
                                {/* Preview Area */}
                                <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop" 
                                        alt="Exterior Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                {/* Generate Button */}
                                <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                    Generate Exterior Design
                                </button>
                            </div>
                        </motion.div>

                        {/* Right Side: Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-6"
                        >
                            <h2 
                                className="text-white"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif', 
                                    fontWeight: 400, 
                                    fontSize: '48px', 
                                    lineHeight: '60px', 
                                    letterSpacing: '0px'
                                }}
                            >
                                Transform Your<br />
                                Home Exterior with<br />
                                AI-Powered Design
                            </h2>
                            
                            <p 
                                className="text-slate-300"
                                style={{ 
                                    fontFamily: 'Arial, sans-serif', 
                                    fontWeight: 400, 
                                    fontSize: '16px', 
                                    lineHeight: '24px', 
                                    letterSpacing: '0px'
                                }}
                            >
                                Reimagine your home's facade with 6 architectural styles - from Modern to Victorian. Our AI technology transforms your exterior photos into stunning architectural visions in seconds. Explore different materials, colors, and design elements effortlessly.
                            </p>

                            <button
                                onClick={() => onNavigate('Exterior Design')}
                                className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                                style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                            >
                                Design My Exterior
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </motion.div>
                </div>
                
                {/* Section 3 - Wall Paint (Right Card, Left Text) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                    {/* Left Side: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <h2 
                            className="text-white"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '48px', 
                                lineHeight: '60px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Perfect Wall Colors<br />
                            for Every Room
                        </h2>
                        
                        <p 
                            className="text-slate-300"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '16px', 
                                lineHeight: '24px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Transform your space with AI-powered color recommendations. Get personalized paint suggestions that match your style and lighting conditions.
                        </p>

                        <button
                            onClick={() => onNavigate('Wall Paint')}
                            className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                            style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                        >
                            Get Started
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>

                    {/* Right Side: Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full max-w-[704px] lg:ml-auto"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>AI DESIGN PREVIEW</span>
                                <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Wall Paint Design</span>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=2000&auto=format&fit=crop" 
                                    alt="Wall Paint Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                Generate AI Design
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Section 4 - Floor Style (Left Card, Right Text) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                    {/* Left Side: Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-[704px]"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>AI DESIGN PREVIEW</span>
                                <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Floor Style Design</span>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2000&auto=format&fit=crop" 
                                    alt="Floor Style Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                Generate AI Design
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Side: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <h2 
                            className="text-white"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '48px', 
                                lineHeight: '60px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Stunning Flooring<br />
                            Options & Styles
                        </h2>
                        
                        <p 
                            className="text-slate-300"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '16px', 
                                lineHeight: '24px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Discover the perfect flooring for your space. From hardwood to tile, our AI helps you visualize different materials and patterns instantly.
                        </p>

                        <button
                            onClick={() => onNavigate('Floor Style')}
                            className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                            style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                        >
                            Get Started
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>
                </div>

                {/* Section 5 - Garden & Backyard (Right Card, Left Text) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                    {/* Left Side: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <h2 
                            className="text-white"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '48px', 
                                lineHeight: '60px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Beautiful Gardens<br />
                            & Outdoor Spaces
                        </h2>
                        
                        <p 
                            className="text-slate-300"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '16px', 
                                lineHeight: '24px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Transform your backyard into a stunning oasis. Get AI-powered landscaping ideas and garden designs tailored to your outdoor space.
                        </p>

                        <button
                            onClick={() => onNavigate('Garden & Backyard Design')}
                            className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                            style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                        >
                            Get Started
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>

                    {/* Right Side: Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full max-w-[704px] lg:ml-auto"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>AI DESIGN PREVIEW</span>
                                <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Garden Design</span>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src="https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=2000&auto=format&fit=crop" 
                                    alt="Garden Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                Generate AI Design
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Section 6 - Festive Decor (Left Card, Right Text) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">
                    {/* Left Side: Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-[704px]"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white/70" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>AI DESIGN PREVIEW</span>
                                <span className="text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>Festive Decoration</span>
                            </div>
                            <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                                <img 
                                    src="https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2000&auto=format&fit=crop" 
                                    alt="Festive Decor Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 14, lineHeight: '20px', letterSpacing: '0px' }}>
                                Generate AI Design
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Side: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <h2 
                            className="text-white"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '48px', 
                                lineHeight: '60px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Magical Festive<br />
                            Decorations
                        </h2>
                        
                        <p 
                            className="text-slate-300"
                            style={{ 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 400, 
                                fontSize: '16px', 
                                lineHeight: '24px', 
                                letterSpacing: '0px'
                            }}
                        >
                            Celebrate in style with AI-designed festive decorations. From holidays to special occasions, create the perfect atmosphere for any celebration.
                        </p>

                        <button
                            onClick={() => onNavigate('Festive Decor')}
                            className="rounded-xl bg-[#00BCD4] hover:bg-[#00ACC1] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-black"
                            style={{ width: '185.1px', height: '48px', fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: 18, lineHeight: '28px', letterSpacing: '0px' }}
                        >
                            Get Started
                            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </motion.div>
                </div>
                {/* Section 6 end */}
                </>}
                {/* END LEGACY Hardcoded Sections */}
            </div>
        </main>
    );
};

const ComingSoonPage: React.FC<{ pageName: string }> = ({ pageName }) => {
    return (
        <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
                <motion.div initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
                    <IconLogo />
                </motion.div>
                <motion.h2 initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.1}} className="mt-6 text-4xl font-bold text-slate-900">Coming Soon</motion.h2>
                <motion.p initial={{opacity: 0, y:20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.2}} className="text-slate-500 mt-2">{`The "${pageName}" page is under construction. Stay tuned!`}</motion.p>
            </div>
        </div>
    );
};

const MyRendersPage: React.FC<{
    history: GenerationBatch[];
    onNavigate: (page: string) => void;
    onDownload: (imageUrl: string, era: string) => void;
    setFullScreenImage: (url: string | null) => void;
    onDelete: (batchId: string, imageId: string) => void;
}> = ({ history, onNavigate, onDownload, setFullScreenImage, onDelete }) => {
    const [galleryViewSize, setGalleryViewSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [selectedAlbum, setSelectedAlbum] = useState<string>('all');

    const imageBatchTypes: GenerationBatch['type'][] = ['style', 'item_replace', 'wall_paint', 'floor_style', 'garden', 'style_match', 'multi_item', 'exterior', 'festive', 'free_canvas'];
    
    const albumTypeLabels: Record<string, string> = {
        "style": "Interior Designs",
        "item_replace": "Item Replacements",
        "wall_paint": "Wall Paints",
        "floor_style": "Floor Styles",
        "garden": "Garden Designs",
        "style_match": "Style Matches",
        "ai_advisor": "AI Advisor Chats",
        "multi_item": "Multi-Item Previews",
        "exterior": "Exterior Designs",
        "festive": "Festive Decor",
        "free_canvas": "Free Canvas Creations"
    };

    const albumTypes = useMemo(() => {
        const types = new Set(history.filter(b => imageBatchTypes.includes(b.type)).map(batch => batch.type));
        return Array.from(types);
    }, [history]);

    const galleryImages = useMemo(() => {
        const filteredBatches = selectedAlbum === 'all'
            ? history.filter(b => imageBatchTypes.includes(b.type))
            : history.filter(batch => batch.type === selectedAlbum);

        return filteredBatches.flatMap(batch =>
            batch.results
                .filter(result => result.status === 'success' && result.imageUrl)
                .map(result => ({
                    ...result,
                    batchInfo: {
                        type: batch.type,
                        timestamp: batch.timestamp,
                        prompt: batch.prompt,
                        id: batch.id
                    }
                }))
        );
    }, [history, selectedAlbum]);

    const viewSizeClasses = useMemo(() => {
        switch (galleryViewSize) {
            case 'sm': return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8';
            case 'lg': return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
            case 'md': default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        }
    }, [galleryViewSize]);

    if (history.filter(b => imageBatchTypes.includes(b.type) && b.results.some(r => r.status === 'success')).length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 pt-[72px]">
                 <div className="p-8 bg-white rounded-full border-2 border-slate-200 mb-6">
                    <IconPhoto className="w-16 h-16 text-slate-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">No Designs Yet</h2>
                <p className="text-slate-500 mt-2 max-w-md">You haven't generated any designs. Your past design batches will appear here.</p>
                <Button primary className="mt-6 py-3 px-6" onClick={() => onNavigate('Interior Design')}>
                    <IconSparkles className="w-5 h-5"/>
                    Start Designing
                </Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 overflow-hidden h-full pt-[72px]">
            <aside className="w-[280px] bg-white p-4 border-r border-slate-200 flex flex-col overflow-y-auto scrollbar-hide">
                <h2 className="text-lg font-semibold text-slate-800 px-2 pb-4">My Albums</h2>
                <div className="space-y-1">
                    <button 
                        onClick={() => setSelectedAlbum('all')}
                        className={`w-full text-left p-3 rounded-2xl transition-colors flex items-center gap-3 text-sm font-medium ${selectedAlbum === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <IconPhoto className="w-5 h-5" />
                        <span>All Designs</span>
                    </button>
                    {albumTypes.map(albumType => (
                        <button 
                            key={albumType} 
                            onClick={() => setSelectedAlbum(albumType)}
                            className={`w-full text-left p-3 rounded-2xl transition-colors flex items-center gap-3 text-sm font-medium ${selectedAlbum === albumType ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                             <IconSparkles className="w-5 h-5" />
                            <span className="truncate">{albumTypeLabels[albumType]}</span>
                        </button>
                    ))}
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {selectedAlbum === 'all' ? 'All Designs' : albumTypeLabels[selectedAlbum]}
                    </h1>
                    <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-xl">
                        {(['lg', 'md', 'sm'] as const).map(size => (
                           <button 
                                key={size}
                                onClick={() => setGalleryViewSize(size)}
                                className={`p-2 rounded-lg transition-colors ${galleryViewSize === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                                aria-label={`${size} view`}
                           >
                                {size === 'lg' && <IconViewLarge className="w-5 h-5" />}
                                {size === 'md' && <IconViewMedium className="w-5 h-5" />}
                                {size === 'sm' && <IconViewSmall className="w-5 h-5" />}
                           </button>
                        ))}
                    </div>
                </div>

                {galleryImages.length > 0 ? (
                     <motion.div
                        key={selectedAlbum + galleryViewSize}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                        className={`grid ${viewSizeClasses} gap-4`}
                    >
                        {galleryImages.map((image, index) => (
                            <motion.div 
                                key={`${image.id}-${index}`}
                                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                                className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-200 shadow-sm"
                            >
                                <img 
                                    src={image.imageUrl!} 
                                    alt={image.promptBase} 
                                    className="w-full h-full object-cover cursor-pointer" 
                                    onClick={() => setFullScreenImage(image.imageUrl)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-3 flex flex-col justify-end">
                                    <h4 className="text-white text-sm font-semibold truncate">{image.batchInfo.prompt}</h4>
                                    <p className="text-white/80 text-xs">{albumTypeLabels[image.batchInfo.type]}</p>
                                    <p className="text-white/60 text-xs">{image.batchInfo.timestamp.toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => onDownload(image.imageUrl!, image.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                    aria-label="Download"
                                >
                                    <IconDownload />
                                </button>
                                <button
                                    onClick={() => onDelete(image.batchInfo.id, image.id)}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                    aria-label="Delete"
                                >
                                    <IconTrash className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500">
                        <div className="flex flex-col items-center">
                            <IconPhoto className="w-12 h-12 text-slate-400 mb-4" />
                            <p className="font-semibold">No designs found in this album yet.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


const getModelInstruction = (promptBase: string): string => promptBase.trim();


// --- New UI Components for Header ---

const UserMenu: React.FC<{ user: User, onLogout: () => void, onNavigate: (page: string) => void }> = ({ user, onLogout, onNavigate }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-64 origin-top-right bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
        >
            <div className="p-2 border-b border-slate-200 mb-2">
                <p className="text-sm font-semibold">Signed in as</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {PERMISSION_MAP[user.permissionLevel]}
                    </span>
                </div>
            </div>
            <button onClick={() => onNavigate('My Designs')} className="w-full text-left px-3 py-2 hover:bg-slate-500/10 rounded-xl transition-colors">My Designs</button>
            <button onClick={onLogout} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-600 rounded-xl transition-colors">Sign Out</button>
        </motion.div>
    );
};

// --- Custom iOS-style Select Component ---

const CustomSelect: React.FC<{
    options: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    disabled?: boolean;
}> = ({ options, value, onChange, label, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const selectedOption = useMemo(() => options.find(opt => opt.id === value), [options, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionId: string) => {
        if (!disabled) {
            onChange(optionId);
            setIsOpen(false);
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
            <div className="relative" ref={selectRef}>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between p-4 backdrop-blur-xl border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        disabled 
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-white/50 border-slate-300 text-slate-800'
                    }`}
                >
                    <span className="truncate">{selectedOption?.name || 'Select...'}</span>
                    <IconChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${disabled ? 'text-slate-300' : 'text-slate-500'} ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && !disabled && (
                        <motion.ul
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-10 top-full mt-2 w-full bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 overflow-hidden max-h-60 overflow-y-auto"
                            role="listbox"
                        >
                            {options.map(option => (
                                <li key={option.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(option.id)}
                                        className="w-full text-left p-4 text-slate-800 hover:bg-indigo-500/10 flex items-center justify-between"
                                        role="option"
                                        aria-selected={value === option.id}
                                    >
                                        <span>{option.name}</span>
                                        {value === option.id && <IconCheck className="w-5 h-5 text-indigo-600" />}
                                    </button>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


// --- Main App Component ---

interface FreeCanvasState {
  images: CanvasImage[];
  prompt: string;
  paths: DrawablePath[];
  activeTool: 'select' | 'draw';
  brushColor: string;
  brushSize: number;
  selectedImageId: string | null;
  selectedPathId: string | null;
}


const App: React.FC = () => {
    // Auth - 使用新的Supabase认证系统
    const auth = useAuth();
    // 注意：不再使用本地的 isAuthModalOpen，而是使用 AuthContext 中的 showLoginModal
    // const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
    const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<'premium' | 'business'>('premium');
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    
    // 创建兼容的用户对象（兼容旧的User类型）
    const currentUser: User | null = auth.profile ? {
        id: auth.profile.id,
        email: auth.profile.email,
        password: '', // 不再存储密码
        status: 'Active',
        joined: auth.profile.created_at,
        lastIp: '',
        registrationIp: '',
        permissionLevel: (() => {
            switch (auth.profile.membership_tier) {
                case 'free': return 1;
                case 'pro': return 2;
                case 'premium': return 3;
                case 'business': return 4;
                default: return 1;
            }
        })(),
        credits: auth.profile.credits,
        membershipTier: auth.profile.membership_tier, // 添加 membershipTier 字段
    } : null;

    // Navigation state
    const [activePage, setActivePage] = useState('Explore');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLevel, setAdminLevel] = useState<string>('none');
    
    // Admin users data state
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    
    // 检测密码重置URL
    useEffect(() => {
        // 检查URL hash中是否包含密码重置的token
        // Supabase会在用户点击重置链接后重定向，并在URL hash中包含access_token和type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        if (type === 'recovery') {
            // 显示密码重置模态框
            setIsResetPasswordModalOpen(true);
            // 清除URL hash，避免刷新页面时再次触发
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    // Check admin access on mount and user change
    useEffect(() => {
        const checkAdmin = async () => {
            if (currentUser) {
                const { checkAdminAccess, getAdminLevel } = await import('./services/adminService');
                const hasAccess = await checkAdminAccess();
                const level = await getAdminLevel();
                setIsAdmin(hasAccess);
                setAdminLevel(level);
            } else {
                setIsAdmin(false);
                setAdminLevel('none');
            }
        };
        
        checkAdmin();
    }, [currentUser]);
    
    // Load users data for Admin page
    useEffect(() => {
        const loadUsers = async () => {
            if (!isAdmin) {
                setUsers([]);
                return;
            }
            
            setIsLoadingUsers(true);
            try {
                const { supabase } = await import('./config/supabase');
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading users:', error);
                    setUsers([]);
                } else {
                    // 转换 Supabase 用户数据为 App 的 User 类型
                    const transformedUsers: User[] = (data || []).map(user => ({
                        id: user.id,
                        email: user.email,
                        password: '', // 不存储密码
                        status: 'Active',
                        joined: user.created_at,
                        lastIp: '',
                        registrationIp: '',
                        permissionLevel: (() => {
                            switch (user.membership_tier) {
                                case 'free': return 1;
                                case 'pro': return 2;
                                case 'premium': return 3;
                                case 'business': return 4;
                                default: return 1;
                            }
                        })(),
                        credits: user.credits,
                        membershipTier: user.membership_tier,
                    }));
                    setUsers(transformedUsers);
                }
            } catch (err) {
                console.error('Failed to load users:', err);
                setUsers([]);
            } finally {
                setIsLoadingUsers(false);
            }
        };
        
        loadUsers();
    }, [isAdmin]);
    
    // Monitor URL hash for admin access
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            
            if (hash === '#admin' || hash === '#/admin') {
                if (!currentUser) {
                    alert('请先登录');
                    window.location.hash = '';
                    auth.setShowLoginModal(true);
                } else if (!isAdmin) {
                    alert('访问被拒绝：您没有管理员权限');
                    window.location.hash = '';
                } else {
                    setActivePage('Admin');
                }
            }
        };
        
        // Check on mount
        handleHashChange();
        
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [currentUser, isAdmin]);
    
    // Keyboard shortcut for admin access (Ctrl/Cmd + Shift + A)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                if (!currentUser) {
                    alert('请先登录');
                    auth.setShowLoginModal(true);
                } else if (!isAdmin) {
                    alert('访问被拒绝：您没有管理员权限');
                } else {
                    window.location.hash = '#admin';
                    setActivePage('Admin');
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentUser, isAdmin]);
    
    useEffect(() => {
        // Reset selections and results when changing design tools to prevent state leakage
        setSelectedTemplateIds([]);
        setSelectedAdvisorIds([]);
        setGeneratedImages([]);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
        setAdvisorQuestion('');
        setError(null);
        setIsLoading(false);
        setIsAdvisorLoading(false);
        setSelectedBuildingType(BUILDING_TYPES[0].id);
        // FIX: Corrected typo from setSelectedItemType to setItemType.
        setSelectedItemType(ITEM_TYPES[0].id);
    }, [activePage]);

    // --- Auth Handlers (使用 Supabase) ---
    const handleLogout = async () => {
        await auth.signOut();
    };
    
    // 保留用于Admin页面的用户更新函数（如果需要的话）
    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        // 如果是更新信用点，刷新当前用户信息以同步显示
        if (updates.credits !== undefined && userId === currentUser?.id) {
            // 等待一小段时间，确保后端已经完成信用点扣除
            await new Promise(resolve => setTimeout(resolve, 500));
            // 刷新用户信息以显示最新的信用点
            await auth.refreshProfile();
        }
        // TODO: 如果需要管理其他用户，需要通过Supabase API实现
        console.log('Update user:', userId, updates);
    };

    const handleDeleteUser = (userId: string) => {
        // TODO: 如果需要删除用户，需要通过Supabase API实现
        console.log('Delete user:', userId);
    };

    // 检查用户是否有Premium权限（Premium或Business）
    const checkPremiumPermission = (featureName: string): boolean => {
        if (!currentUser) return false;
        
        const hasPremiumAccess = currentUser.membershipTier === 'premium' || 
                                 currentUser.membershipTier === 'business';
        
        if (!hasPremiumAccess) {
            setUpgradeFeatureName(featureName);
            setUpgradeRequiredTier('premium');
            setIsUpgradeModalOpen(true);
            return false;
        }
        
        return true;
    };

    // Core generator state
    const [module1Images, setModule1Images] = useState<(string | null)[]>([null]);
    const [itemReplaceImage, setItemReplaceImage] = useState<string | null>(null);
    const [styleMatchImage, setStyleMatchImage] = useState<string | null>(null);
    const [multiItemImages, setMultiItemImages] = useState<(string | null)[]>(Array(9).fill(null));
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
    const uploadTargetRef = useRef<{ module: 'm1' | 'item' | 'sm' | 'multi', index: number } | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [selectedRoomType, setSelectedRoomType] = useState<string>(ROOM_TYPES[0].id);
    const [selectedBuildingType, setSelectedBuildingType] = useState<string>(BUILDING_TYPES[0].id);
    const [selectedItemType, setSelectedItemType] = useState<string>(ITEM_TYPES[0].id);
    const [selectedFestiveType, setSelectedFestiveType] = useState<string>('');
    const [selectedWallPaintType, setSelectedWallPaintType] = useState<string>('');
    const [selectedFloorType, setSelectedFloorType] = useState<string>('');
    const [selectedGardenType, setSelectedGardenType] = useState<string>('');
    
    // AI Advisor State
    const [advisorChat, setAdvisorChat] = useState<Chat | null>(null);
    const [advisorQuestion, setAdvisorQuestion] = useState('');
    const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
    const [currentAdvisorResponse, setCurrentAdvisorResponse] = useState<GenerationBatch | null>(null);
    const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
    const advisorById = useMemo(() => {
        const map = new Map<string, AdvisorPersona>();
        ALL_ADVISORS.forEach(persona => map.set(persona.id, persona));
        return map;
    }, []);

    // History state
    const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>([]);
    
    // Free Canvas State (lifted for persistence)
    const [freeCanvasState, setFreeCanvasState] = useState<FreeCanvasState>(() => {
        return {
            images: [],
            prompt: '',
            paths: [],
            activeTool: 'select',
            brushColor: '#ef4444',
            brushSize: 8,
            selectedImageId: null,
            selectedPathId: null,
        };
    });

    // 辅助函数：获取用户会员等级
    const getUserMembershipTier = (): 'free' | 'pro' | 'premium' | 'business' => {
        if (!currentUser) return 'free';
        
        if (currentUser.membershipTier) {
            // 确保是小写
            return currentUser.membershipTier.toLowerCase() as 'free' | 'pro' | 'premium' | 'business';
        }
        
        // 从 permissionLevel 映射
        switch (currentUser.permissionLevel) {
            case 1: return 'free';
            case 2: return 'pro';
            case 3: return 'premium';
            case 4: return 'business';
            default: return 'free';
        }
    };

    const hasModule1Image = useMemo(() => module1Images.some(img => img !== null), [module1Images]);
    const hasItemReplaceImage = useMemo(() => itemReplaceImage !== null, [itemReplaceImage]);
    const hasStyleMatchImage = useMemo(() => styleMatchImage !== null, [styleMatchImage]);
    const hasMultiItemImages = useMemo(() => multiItemImages.some(img => img !== null), [multiItemImages]);
    const hasSelection = useMemo(() => selectedTemplateIds.length > 0, [selectedTemplateIds]);

    const designTools = [
        { key: 'Interior Design', label: 'Interior Design', requiresPremium: false },
        { key: 'Exterior Design', label: 'Exterior Design', requiresPremium: false },
        { key: 'Wall Paint', label: 'Wall Paint', requiresPremium: false },
        { key: 'Floor Style', label: 'Floor Style', requiresPremium: false },
        { key: 'Garden & Backyard Design', label: 'Garden & Backyard Design', requiresPremium: false },
        { key: 'Festive Decor', label: 'Festive Decor', requiresPremium: false },
        { key: 'Item Replace', label: 'Item Replace', requiresPremium: true },
        { key: 'Reference Style Match', label: 'Reference Style Match', requiresPremium: true, comingSoon: true },
        { key: 'AI Design Advisor', label: 'AI Design Advisor', requiresPremium: true, comingSoon: true },
        { key: 'Multi-Item Preview', label: 'Multi-Item Preview', requiresPremium: true, comingSoon: true },
        { key: 'Free Canvas', label: 'Free Canvas', requiresPremium: true },
    ];
    // ⚠️ 修复：初始状态设为空对象，避免显示硬编码的残留数据
    // 前端功能页面使用的模板数据（只包含启用的模板）
    const [adminTemplateData, setAdminTemplateData] = useState<ManagedTemplateData>({});
    const [adminCategoryOrder, setAdminCategoryOrder] = useState<string[]>([]);
    
    // Admin Panel使用的模板数据（包含所有模板，包括禁用的）
    const [adminTemplateDataFull, setAdminTemplateDataFull] = useState<ManagedTemplateData>({});
    const [adminCategoryOrderFull, setAdminCategoryOrderFull] = useState<string[]>([]);
    
    const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);

    // Load templates from database on mount
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                setTemplatesLoading(true);
                
                // 前端功能页面使用 getAllTemplatesPublic()（只显示启用的模板）
                const publicTemplates = await getAllTemplatesPublic();
                
                // Admin Panel 使用 getAllTemplates()（显示所有模板）
                const allTemplates = await getAllTemplates();
                
                // 完全使用数据库模板，不合并硬编码模板
                if (Object.keys(publicTemplates).length > 0) {
                    setAdminTemplateData(publicTemplates);
                    setAdminCategoryOrder(Object.keys(publicTemplates));
                    console.log('✅ Public templates loaded from database');
                } else {
                    // 仅在数据库完全为空时使用默认模板作为fallback
                    console.log('ℹ️ Database empty, using default templates as fallback');
                    setAdminTemplateData(ADMIN_PAGE_CATEGORIES);
                    setAdminCategoryOrder(Object.keys(ADMIN_PAGE_CATEGORIES));
                }
                
                // 设置Admin Panel的完整数据
                if (Object.keys(allTemplates).length > 0) {
                    setAdminTemplateDataFull(allTemplates);
                    setAdminCategoryOrderFull(Object.keys(allTemplates));
                    console.log('✅ All templates loaded for Admin Panel');
                } else {
                    setAdminTemplateDataFull(ADMIN_PAGE_CATEGORIES);
                    setAdminCategoryOrderFull(Object.keys(ADMIN_PAGE_CATEGORIES));
                }
            } catch (error) {
                console.error('Failed to load templates:', error);
                // 错误时使用默认模板
                setAdminTemplateData(ADMIN_PAGE_CATEGORIES);
                setAdminCategoryOrder(Object.keys(ADMIN_PAGE_CATEGORIES));
                setAdminTemplateDataFull(ADMIN_PAGE_CATEGORIES);
                setAdminCategoryOrderFull(Object.keys(ADMIN_PAGE_CATEGORIES));
            } finally {
                setTemplatesLoading(false);
            }
        };
        
        loadTemplates();
    }, [currentUser?.permissionLevel]);
    
    // 刷新模板数据的回调函数（在Admin Panel编辑模板后调用）
    const refreshTemplateData = useCallback(async () => {
        try {
            console.log('🔄 Refreshing template data...');
            
            // 刷新前端功能页面的公开模板
            const publicTemplates = await getAllTemplatesPublic();
            if (Object.keys(publicTemplates).length > 0) {
                setAdminTemplateData(publicTemplates);
                setAdminCategoryOrder(Object.keys(publicTemplates));
                console.log('✅ Public templates refreshed');
            }
            
            // 刷新Admin Panel的完整模板
            const allTemplates = await getAllTemplates();
            if (Object.keys(allTemplates).length > 0) {
                setAdminTemplateDataFull(allTemplates);
                setAdminCategoryOrderFull(Object.keys(allTemplates));
                console.log('✅ Admin templates refreshed');
            }
        } catch (error) {
            console.error('Failed to refresh templates:', error);
        }
    }, []);

    // 动态生成可用的房间类型列表（只显示有启用模板的房间类型）
    const availableRoomTypes = useMemo(() => {
        // ⚠️ 修复：数据加载期间返回空数组，不显示硬编码数据
        if (templatesLoading) {
            return [];
        }
        
        const interiorData = adminTemplateData["Interior Design"];
        if (!interiorData || interiorData.length === 0) {
            return []; // 数据库为空时也返回空数组，不使用硬编码fallback
        }
        
        // 从数据库数据生成房间类型选项（只包含有模板的房间类型）
        const roomTypeOptions = interiorData
            .filter(sc => sc.templates.length > 0) // 只显示有模板的房间类型
            .map(sc => {
                // 从 ROOM_TYPES 中查找对应的显示名称
                const existingType = ROOM_TYPES.find(rt => rt.id === sc.name);
                return {
                    id: sc.name,
                    name: existingType?.name || sc.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                };
            });
        
        return roomTypeOptions;
    }, [adminTemplateData, templatesLoading]);
    
    // Festive Decor 子分类选项
    const availableFestiveTypes = useMemo(() => {
        if (templatesLoading) return [];
        const festiveData = adminTemplateData["Festive Decor"];
        if (!festiveData || festiveData.length === 0) return [];
        return festiveData
            .filter(sc => sc.templates.length > 0)
            .map(sc => ({ id: sc.name, name: sc.name }));
    }, [adminTemplateData, templatesLoading]);

    // Exterior Design 建筑类型选项
    const availableBuildingTypes = useMemo(() => {
        if (templatesLoading) return [];
        const exteriorData = adminTemplateData["Exterior Design"];
        if (!exteriorData || exteriorData.length === 0) return [];
        return exteriorData
            .filter(sc => sc.templates.length > 0)
            .map(sc => ({ id: sc.name, name: sc.name }));
    }, [adminTemplateData, templatesLoading]);

    // Wall Paint 色调选项
    const availableWallPaintTypes = useMemo(() => {
        if (templatesLoading) return [];
        const data = adminTemplateData["Wall Paint"];
        if (!data || data.length === 0) return [];
        return data
            .filter(sc => sc.templates.length > 0)
            .map(sc => ({ id: sc.name, name: sc.name }));
    }, [adminTemplateData, templatesLoading]);

    // Floor Style 地板类型选项
    const availableFloorTypes = useMemo(() => {
        if (templatesLoading) return [];
        const data = adminTemplateData["Floor Style"];
        if (!data || data.length === 0) return [];
        return data
            .filter(sc => sc.templates.length > 0)
            .map(sc => ({ id: sc.name, name: sc.name }));
    }, [adminTemplateData, templatesLoading]);

    // Garden & Backyard Design 花园类型选项
    const availableGardenTypes = useMemo(() => {
        if (templatesLoading) return [];
        const data = adminTemplateData["Garden & Backyard Design"];
        if (!data || data.length === 0) return [];
        return data
            .filter(sc => sc.templates.length > 0)
            .map(sc => ({ id: sc.name, name: sc.name }));
    }, [adminTemplateData, templatesLoading]);
    
    // 确保当前选择的类型在可用列表中，否则选择第一个
    useEffect(() => {
        if (activePage === 'Interior Design' && availableRoomTypes.length > 0) {
            const isCurrentRoomTypeAvailable = availableRoomTypes.some(rt => rt.id === selectedRoomType);
            if (!isCurrentRoomTypeAvailable) {
                setSelectedRoomType(availableRoomTypes[0].id);
            }
        } else if (activePage === 'Festive Decor' && availableFestiveTypes.length > 0) {
            if (!selectedFestiveType || !availableFestiveTypes.some(ft => ft.id === selectedFestiveType)) {
                setSelectedFestiveType(availableFestiveTypes[0].id);
            }
        } else if (activePage === 'Exterior Design' && availableBuildingTypes.length > 0) {
            if (!selectedBuildingType || !availableBuildingTypes.some(bt => bt.id === selectedBuildingType)) {
                setSelectedBuildingType(availableBuildingTypes[0].id);
            }
        } else if (activePage === 'Wall Paint' && availableWallPaintTypes.length > 0) {
            if (!selectedWallPaintType || !availableWallPaintTypes.some(wt => wt.id === selectedWallPaintType)) {
                setSelectedWallPaintType(availableWallPaintTypes[0].id);
            }
        } else if (activePage === 'Floor Style' && availableFloorTypes.length > 0) {
            if (!selectedFloorType || !availableFloorTypes.some(ft => ft.id === selectedFloorType)) {
                setSelectedFloorType(availableFloorTypes[0].id);
            }
        } else if (activePage === 'Garden & Backyard Design' && availableGardenTypes.length > 0) {
            if (!selectedGardenType || !availableGardenTypes.some(gt => gt.id === selectedGardenType)) {
                setSelectedGardenType(availableGardenTypes[0].id);
            }
        }
    }, [availableRoomTypes, selectedRoomType, activePage, 
        availableFestiveTypes, selectedFestiveType,
        availableBuildingTypes, selectedBuildingType,
        availableWallPaintTypes, selectedWallPaintType,
        availableFloorTypes, selectedFloorType,
        availableGardenTypes, selectedGardenType]);

    // --- Image Handling ---
    
    const handleFileSelect = (module: 'm1' | 'item' | 'sm' | 'multi', index: number) => {
        uploadTargetRef.current = { module, index };
        const input = fileInputRef.current;
        if (!input) return;

        input.value = "";
        input.multiple = false;
        input.accept = "image/png,image/jpeg";
        input.click();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const capturedFiles = event.target.files ? Array.from(event.target.files) : [];
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (capturedFiles.length === 0 || !uploadTargetRef.current) return;
        
        const { module, index } = uploadTargetRef.current;
        const uploadKey = `${module}-${index}`;
        
        setUploadingSlots(prev => ({ ...prev, [uploadKey]: true }));
        setError(null);
        
        try {
            const base64Image = await toBase64(capturedFiles[0] as File);
            if (module === 'm1') {
                setModule1Images([base64Image]);
            } else if (module === 'item') {
                setItemReplaceImage(base64Image);
            } else if (module === 'sm') {
                setStyleMatchImage(base64Image);
            } else if (module === 'multi') {
                setMultiItemImages(prev => {
                    const newImages = [...prev];
                    newImages[index] = base64Image;
                    return newImages;
                });
            }
            setGeneratedImages([]);
            setCurrentAdvisorResponse(null);
        } catch (err) {
            console.error(`Error during ${module} upload:`, err);
            setError("An image couldn't be processed. Please try another file.");
        } finally {
            setUploadingSlots(prev => ({ ...prev, [uploadKey]: false }));
            uploadTargetRef.current = null;
        }
    };
    
    const handleRemoveImage = (module: 'm1', index: number) => {
        if (module === 'm1') {
            setModule1Images([null]);
        }
        setGeneratedImages([]);
        setCurrentAdvisorResponse(null);
    };

    const handleRemoveItemImage = () => {
        setItemReplaceImage(null);
        setGeneratedImages([]);
    };
    
    const handleRemoveStyleMatchImage = () => {
        setStyleMatchImage(null);
        setGeneratedImages([]);
    };

    const handleRemoveMultiItemImage = (index: number) => {
        setMultiItemImages(prev => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
        setGeneratedImages([]);
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateIds(prev => {
            if (prev.includes(templateId)) {
                return prev.filter(id => id !== templateId);
            }
            
            // 未登录用户可以自由选择模板（最多9个），登录时才检查权限
            if (!currentUser) {
                const MAX_SELECTION = 9;
                if (prev.length < MAX_SELECTION) {
                    return [...prev, templateId];
                }
                setError(`You can select up to ${MAX_SELECTION} templates at a time.`);
                setTimeout(() => setError(null), 3000);
                return prev;
            }
            
            // 已登录用户：根据会员等级限制可选择的模板数量
            const membershipTier = getUserMembershipTier();
            const maxTemplates = MEMBERSHIP_CONFIG[membershipTier].maxTemplates;
            
            console.log('[Template Selection] User:', currentUser?.email, 'Tier:', membershipTier, 'Level:', currentUser?.permissionLevel, 'MaxTemplates:', maxTemplates, 'CurrentSelected:', prev.length);
            
            if (prev.length < maxTemplates) {
                return [...prev, templateId];
            }
            
            // 达到上限时显示提示
            setError(`Your ${MEMBERSHIP_CONFIG[membershipTier].name} plan allows selecting up to ${maxTemplates} template${maxTemplates > 1 ? 's' : ''} at a time. Please upgrade for more.`);
            setTimeout(() => setError(null), 3000);
            
            return prev;
        });
    };

    const handleAdvisorSelect = (personaId: string) => {
        setSelectedAdvisorIds(prev => {
            if (prev.includes(personaId)) {
                return prev.filter(id => id !== personaId);
            }
            if (prev.length < 9) {
                return [...prev, personaId];
            }
            return prev;
        });
    };

    const handleDropOnUploader = async (e: React.DragEvent<HTMLDivElement>, targetModule: 'm1' | 'item' | 'sm') => {
        // First, check for an image dragged from the My Designs sidebar
        const draggedImageSrc = e.dataTransfer.getData('application/homevision-image-src');
        if (draggedImageSrc) {
            if (targetModule === 'm1') setModule1Images([draggedImageSrc]);
            else if (targetModule === 'item') setItemReplaceImage(draggedImageSrc);
            else if (targetModule === 'sm') setStyleMatchImage(draggedImageSrc);
            
            setGeneratedImages([]);
            setCurrentAdvisorResponse(null);
            return;
        }
    
        // Fallback to handle files dragged from the user's computer
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            const uploadKey = `${targetModule}-0`;
            setUploadingSlots(prev => ({ ...prev, [uploadKey]: true }));
            setError(null);
    
            try {
                const base64Image = await toBase64(file);
                if (targetModule === 'm1') setModule1Images([base64Image]);
                else if (targetModule === 'item') setItemReplaceImage(base64Image);
                else if (targetModule === 'sm') setStyleMatchImage(base64Image);
    
                setGeneratedImages([]);
                setCurrentAdvisorResponse(null);
            } catch (err) {
                console.error(`Error during ${targetModule} drop upload:`, err);
                setError("An image couldn't be processed. Please try another file.");
            } finally {
                setUploadingSlots(prev => ({ ...prev, [uploadKey]: false }));
            }
        }
    };

    const handleResultImageDragStart = (e: React.DragEvent<HTMLImageElement>, src: string) => {
        e.dataTransfer.setData('application/homevision-image-src', src);
        e.dataTransfer.effectAllowed = 'copy';
    };

    // --- Generation & Regeneration ---

    const handleGenerateClick = async () => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        
        const cleanModule1 = module1Images.filter((img): img is string => !!img);
        if (cleanModule1.length === 0) {
            setError("Please upload a photo of your room.");
            return;
        }
        if (selectedTemplateIds.length === 0) {
            setError("Please select a design style.");
            return;
        }
        
        // 检查会员等级的模板选择数量限制
        const membershipTier = getUserMembershipTier();
        const maxTemplates = MEMBERSHIP_CONFIG[membershipTier].maxTemplates;
        
        if (selectedTemplateIds.length > maxTemplates) {
            setError(`Your ${MEMBERSHIP_CONFIG[membershipTier].name} plan allows generating up to ${maxTemplates} template${maxTemplates > 1 ? 's' : ''} at a time. You have selected ${selectedTemplateIds.length}. Please upgrade or reduce your selection.`);
            setIsUpgradeModalOpen(true);
            setUpgradeFeatureName('Multiple Template Generation');
            setUpgradeRequiredTier(membershipTier === 'free' ? 'pro' : 'premium');
            return;
        }
        
        // 根据选中的模板数量计算所需信用点（每个模板1个信用点）
        const creditsNeeded = selectedTemplateIds.length;
        if (currentUser.credits < creditsNeeded) {
            setError(`You need ${creditsNeeded} credits to generate ${selectedTemplateIds.length} image${selectedTemplateIds.length > 1 ? 's' : ''}. You have ${currentUser.credits} credit${currentUser.credits !== 1 ? 's' : ''} remaining. Please upgrade your plan.`);
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);

        const isWallPaint = activePage === 'Wall Paint';
        const isFloorStyle = activePage === 'Floor Style';
        const isGardenBackyard = activePage === 'Garden & Backyard Design';
        const isExteriorDesign = activePage === 'Exterior Design';
        const isFestiveDecor = activePage === 'Festive Decor';
    
        const module1ForApi = cleanModule1.map(img => img.split(',')[1]);

        // FIX: Add explicit type to `c` to resolve type inference issue.
        const allTemplates = Object.values(adminTemplateData).flat().flatMap((c: ManagedPromptTemplateCategory) => c.templates);

        const selectedTemplates = selectedTemplateIds.map(id => 
            allTemplates.find(t => t.id === id)
        ).filter((t): t is PromptTemplate => !!t);
        
        const roomTypeName = ROOM_TYPES.find(r => r.id === selectedRoomType)?.name || selectedRoomType;
        const buildingTypeName = BUILDING_TYPES.find(b => b.id === selectedBuildingType)?.name || selectedBuildingType;

        // 动态获取所有选中模板的 prompt（批量获取以提高性能）
        const templatePrompts = await getTemplatePrompts(selectedTemplateIds);

        const placeholders: GeneratedImage[] = selectedTemplates.map(template => {
            // 从服务器获取的 prompt，而不是从前端模板对象
            const templatePrompt = templatePrompts.get(template.id) || template.prompt || '';
            
            return {
                id: template.name,
                status: 'pending',
                imageUrl: null,
                promptBase: isWallPaint || isGardenBackyard || isFloorStyle
                    ? templatePrompt
                    : isExteriorDesign
                        ? `A ${buildingTypeName}, ${templatePrompt}`
                        : `A ${roomTypeName}, ${templatePrompt}`,
                // 保存模板元数据以便后续显示完整路径
                templateId: template.id,
                templateName: template.name,
                templateCategory: template.category,
                templateSubCategory: template.subCategory,
            };
        });
        
        setGeneratedImages(placeholders);
    
        // 并发控制：一次最多9个并发请求，避免浏览器连接限制和服务器过载
        const CONCURRENT_LIMIT = 9;
        const finalResults: GeneratedImage[] = [];

        // 分批处理，每批9个
        for (let i = 0; i < placeholders.length; i += CONCURRENT_LIMIT) {
            const batch = placeholders.slice(i, i + CONCURRENT_LIMIT);
            
            // 处理当前批次
            const batchResults = await Promise.all(batch.map(async (placeholder) => {
                try {
                    const imageUrl = await generateImage(
                        getModelInstruction(placeholder.promptBase), 
                        module1ForApi
                    );
                    return { ...placeholder, status: 'success' as const, imageUrl };
                } catch (err) {
                    console.error(`Generation failed for ${placeholder.id}:`, err);
                    return { ...placeholder, status: 'failed' as const };
                }
            }));
            
            // 添加到总结果
            finalResults.push(...batchResults);
            
            // 实时更新UI，显示已完成的图片
            const remainingPlaceholders = placeholders.slice(finalResults.length).map(p => ({ 
                ...p, 
                status: 'pending' as const 
            }));
            setGeneratedImages([...finalResults, ...remainingPlaceholders]);
            
            // 在批次之间添加小延迟，避免API限流
            if (i + CONCURRENT_LIMIT < placeholders.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    
        // 最终更新
        setGeneratedImages(finalResults);
    
        const newBatch: GenerationBatch = {
            id: Date.now().toString(),
            type: isWallPaint ? 'wall_paint' : (isFloorStyle ? 'floor_style' : (isGardenBackyard ? 'garden' : (isExteriorDesign ? 'exterior' : (isFestiveDecor ? 'festive' : 'style')))),
            timestamp: new Date(),
            subjectImage: cleanModule1[0],
            styleImages: [],
            prompt: selectedTemplates.map(t => t.name).join(', '),
            results: finalResults,
            templateIds: selectedTemplateIds,
            ...(isExteriorDesign && { buildingTypeId: selectedBuildingType }),
            // 保存房间类型ID以便后续显示完整路径
            roomTypeId: selectedRoomType,
            userId: currentUser.id,
        };
        setGenerationHistory(prev => [newBatch, ...prev]);
    
        // 图片生成完成后，刷新用户信用点显示
        await handleUpdateUser(currentUser.id, { credits: currentUser.credits - creditsNeeded });
    
        // 根据生成结果决定是否清除选中状态
        const hasAnySuccess = finalResults.some(result => result.status === 'success');
        
        if (hasAnySuccess) {
            // 至少有一个生成成功，清除选中状态，避免下次重复生成
            setSelectedTemplateIds([]);
        }
        // 如果全部失败，保持选中状态，方便用户重试
    
        setIsLoading(false);
    };

    const handleItemReplaceClick = async () => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        
        // 权限检查：Item Replace 需要 Premium 权限
        if (!checkPremiumPermission('Item Replace')) {
            return;
        }
        
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        const roomImage = module1Images.find((img): img is string => !!img);
        if (!roomImage || !itemReplaceImage) {
            setError("Please upload both a room photo and an item to place.");
            return;
        }
    
        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);
    
        const roomImageForApi = roomImage.split(',')[1];
        const itemImageForApi = itemReplaceImage.split(',')[1];
        const itemTypeName = ITEM_TYPES.find(i => i.id === selectedItemType)?.name || selectedItemType;
    
        const instruction = `This is an interior design task. The first image is a photo of a room. The second image is a ${itemTypeName}. Your task is to seamlessly integrate the object from the second image into the first image. The object should replace a suitable existing object in the room if one exists, otherwise, place it in a natural and logical position. Ensure the lighting, shadows, and perspective of the added object match the room perfectly. The final output must be a single, photorealistic image of the modified room. Do not change anything else in the room.`;
    
        const placeholder: GeneratedImage = {
            id: `item-replace-${Date.now()}`,
            status: 'pending',
            imageUrl: null,
            promptBase: instruction
        };
        setGeneratedImages([placeholder]);
    
        try {
            const imageUrl = await generateImage(instruction, [roomImageForApi, itemImageForApi]);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'item_replace',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: [itemReplaceImage],
                prompt: `Replaced with: ${itemTypeName}`,
                results: [finalResult],
                templateIds: [],
                userId: currentUser.id,
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
            
            // 图片生成完成后，刷新用户信用点显示
            await handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
    
        } catch (err) {
            console.error("Item replacement failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleStyleMatchClick = async () => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        
        // 权限检查：Reference Style Match 需要 Premium 权限
        if (!checkPremiumPermission('Reference Style Match')) {
            return;
        }
        
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        const roomImage = module1Images.find((img): img is string => !!img);
        if (!roomImage || !styleMatchImage) {
            setError("Please upload both a room photo and a target style photo.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);

        const roomImageForApi = roomImage.split(',')[1];
        const styleImageForApi = styleMatchImage.split(',')[1];
        const roomTypeName = ROOM_TYPES.find(r => r.id === selectedRoomType)?.name || selectedRoomType;

        const instruction = `This is an advanced interior design style transfer task. The first image is a photo of a ${roomTypeName} that needs a complete redesign. The second image is the target style reference. Your task is to COMPLETELY transform the room in the first image to match the aesthetic, color palette, materials, furniture style, and overall mood of the second image. You MUST strictly preserve the architectural layout, window and door placements, and overall structure of the first image. The final output must be a single, photorealistic image of the redesigned room.`;
        
        const placeholder: GeneratedImage = {
            id: `style-match-${Date.now()}`,
            status: 'pending',
            imageUrl: null,
            promptBase: instruction
        };
        setGeneratedImages([placeholder]);

        try {
            const imageUrl = await generateImage(instruction, [roomImageForApi, styleImageForApi]);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'style_match',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: [styleMatchImage],
                prompt: `Matched style from reference`,
                results: [finalResult],
                templateIds: [],
                userId: currentUser.id,
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
            
            // 图片生成完成后，刷新用户信用点显示
            await handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
    
        } catch (err) {
            console.error("Style match failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleMultiItemClick = async () => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        
        // 权限检查：Multi-Item Preview 需要 Premium 权限
        if (!checkPremiumPermission('Multi-Item Preview')) {
            return;
        }
        
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        const roomImage = module1Images.find((img): img is string => !!img);
        const cleanMultiItemImages = multiItemImages.filter((img): img is string => !!img);

        if (!roomImage || cleanMultiItemImages.length === 0) {
            setError("Please upload a room photo and at least one item.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentAdvisorResponse(null);
        setAdvisorChat(null);

        const roomImageForApi = roomImage.split(',')[1];
        const itemImagesForApi = cleanMultiItemImages.map(img => img.split(',')[1]);
        const roomTypeName = ROOM_TYPES.find(r => r.id === selectedRoomType)?.name || selectedRoomType;

        const instruction = `This is an interior design task for a ${roomTypeName}. The first image provided is the base room. The subsequent images are various furniture and decor items. Your task is to intelligently and aesthetically place all of these items into the base room. The items should be scaled appropriately and positioned in a way that creates a cohesive and well-designed space. Ensure lighting and shadows on the new items match the room's environment. The final output must be a single, photorealistic image of the room with all items integrated.`;

        const placeholder: GeneratedImage = {
            id: `multi-item-${Date.now()}`,
            status: 'pending',
            imageUrl: null,
            promptBase: instruction
        };
        setGeneratedImages([placeholder]);

        try {
            const imageUrl = await generateImage(instruction, [roomImageForApi, ...itemImagesForApi]);
            const finalResult = { ...placeholder, status: 'success' as const, imageUrl };
            setGeneratedImages([finalResult]);
    
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'multi_item',
                timestamp: new Date(),
                subjectImage: roomImage,
                styleImages: cleanMultiItemImages,
                prompt: `${cleanMultiItemImages.length} items placed`,
                results: [finalResult],
                templateIds: [],
                userId: currentUser.id,
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
            
            // 图片生成完成后，刷新用户信用点显示
            await handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
    
        } catch (err) {
            console.error("Multi-item placement failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleAskAdvisor = async () => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        
        // 权限检查：AI Design Advisor 需要 Premium 权限
        if (!checkPremiumPermission('AI Design Advisor')) {
            return;
        }
        
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        if (!advisorQuestion.trim()) {
            setError("Please enter a question for the advisor.");
            return;
        }
        if (selectedAdvisorIds.length === 0) {
            setError("Please select an advisor persona.");
            return;
        }

        setIsAdvisorLoading(true);
        setError(null);
        setGeneratedImages([]);

        const roomImage = module1Images.find((img): img is string => !!img);
        const selectedPersonas = selectedAdvisorIds
            .map(id => advisorById.get(id))
            .filter((p): p is AdvisorPersona => !!p);

        try {
            const personaResults = await Promise.allSettled(
                selectedPersonas.map(async persona => {
                    const text = await generateTextResponse(
                        advisorQuestion,
                        persona.systemInstruction,
                        roomImage
                    );
                    return { persona, text: text?.trim() ?? '' };
                })
            );

            const successfulResponses = personaResults.flatMap(result => {
                if (result.status === 'fulfilled' && result.value.text) {
                    return [result.value];
                }
                if (result.status === 'rejected') {
                    console.error("Advisor persona request failed:", result.reason);
                }
                return [];
            });

            if (successfulResponses.length === 0) {
                throw new Error("No advisor was able to generate a response.");
            }

            const chatHistory: ChatMessage[] = [
                { role: 'user', text: advisorQuestion },
                ...successfulResponses.map(({ persona, text }) => ({
                    role: 'model',
                    text: `${persona.name}: ${text}`,
                }))
            ];

            const newBatch: GenerationBatch = {
                id: `advisor_${Date.now()}`,
                type: 'ai_advisor',
                timestamp: new Date(),
                subjectImage: roomImage || null,
                styleImages: [],
                prompt: advisorQuestion,
                results: [],
                templateIds: [],
                textResponse: successfulResponses[0].text,
                chatHistory,
                multiModelResponses: successfulResponses.map(({ persona, text }) => ({
                    personaId: persona.id,
                    personaName: persona.name,
                    personaImageUrl: persona.imageUrl,
                    text,
                })),
                userId: currentUser.id,
            };

            setCurrentAdvisorResponse(newBatch);
            setGenerationHistory(prev => [newBatch, ...prev]);
            
            // 图片生成完成后，刷新用户信用点显示
            await handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
            
            if (successfulResponses.length < selectedPersonas.length) {
                setError("Some advisors could not respond. Showing available answers.");
            }
        } catch (err) {
             console.error("Advisor generation failed:", err);
             setError("Failed to get a response from the advisor.");
        } finally {
            setIsAdvisorLoading(false);
        }
    };
    
    const handleRegenerate = async (image: GeneratedImage) => {
        if (!currentUser) {
            auth.setShowLoginModal(true);
            return;
        }
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        const cleanModule1 = module1Images.filter((img): img is string => !!img);
        if (cleanModule1.length === 0) {
            setError(`Cannot regenerate "${image.id}" without the original room photo.`);
            return;
        }
    
        setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'pending' } : img));
        setError(null);
    
        try {
            const module1ForApi = cleanModule1.map(img => img.split(',')[1]);
            const newImageUrl = await generateImage(getModelInstruction(image.promptBase), module1ForApi);
            setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'success', imageUrl: newImageUrl } : img));
            
            // 同步更新 generationHistory 中的对应图片
            setGenerationHistory(prevHistory => 
                prevHistory.map(batch => {
                    // 检查这个批次是否包含当前重新生成的图片
                    const hasImage = batch.results.some(img => img.id === image.id);
                    if (hasImage) {
                        return {
                            ...batch,
                            results: batch.results.map(img => 
                                img.id === image.id 
                                    ? { ...img, status: 'success', imageUrl: newImageUrl }
                                    : img
                            )
                        };
                    }
                    return batch;
                })
            );
            
            // 图片生成完成后，刷新用户信用点显示
            await handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
        } catch (err) {
            console.error(`Regeneration failed for ${image.id}:`, err);
            setError(`Oops! Regeneration for "${image.id}" failed.`);
            setGeneratedImages(prev => prev.map(img => img.id === image.id ? { ...img, status: 'failed' } : img));
        }
    };

    // --- History Management ---
    const handleDeleteGenerationBatch = (batchId: string) => {
        setGenerationHistory(prev => prev.filter(batch => batch.id !== batchId));
    };
    
    const handleDeleteGenerationImage = (batchId: string, imageId: string) => {
        setGenerationHistory(prevHistory => {
            return prevHistory.map(batch => {
                if (batch.id === batchId) {
                    const newResults = batch.results.filter(result => result.id !== imageId);
                    // If the batch has no more results, remove the batch itself
                    if (newResults.length === 0) {
                        return null;
                    }
                    return { ...batch, results: newResults };
                }
                return batch;
            }).filter((b): b is GenerationBatch => b !== null);
        });
    };

    const handleDownload = (imageUrl: string, baseName: string) => {
        // 从 generationHistory 中查找这张图片的完整信息，使用统一的命名格式
        let fileName = `${baseName.replace(/\s+/g, '_')}_${Date.now()}.png`;
        
        // 尝试找到对应的 batch 和 image
        for (const batch of generationHistory) {
            const image = batch.results.find(r => r.imageUrl === imageUrl);
            if (image) {
                // 使用与批量下载相同的命名格式: type_roomTypeId_templateName_timestamp
                const parts = [
                    batch.type,
                    batch.roomTypeId || batch.buildingTypeId || 'no-room',
                    image.id,
                    batch.id,
                ];
                
                fileName = parts
                    .map(p => String(p).toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                    .join('_') + '.png';
                break;
            }
        }
        
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // --- Render Logic ---
    const pageInfo: Record<string, { title: string; description: string }> = {
        'Interior Design': {
            title: 'Interior Design',
            description: "Redesign your room's style. Upload a photo, choose an aesthetic, and generate stunning new looks.",
        },
        'Festive Decor': {
            title: 'Festive Decor',
            description: 'Get your space ready for the holidays. Add seasonal decorations for Halloween, Christmas, and more.',
        },
        'Exterior Design': {
            title: 'Exterior Design',
            description: "Reimagine your property's exterior. Transform the architectural style of your home or building.",
        },
        'Wall Paint': {
            title: 'Wall Paint',
            description: 'Virtually repaint your walls. Choose from various colors and finishes to see an instant change.',
        },
        'Floor Style': {
            title: 'Floor Style',
            description: 'Change your flooring with a single click. Experiment with different materials like wood, tile, or concrete.',
        },
        'Garden & Backyard Design': {
            title: 'Garden & Backyard Design',
            description: 'Create your dream outdoor space. Design beautiful gardens, patios, and backyards.',
        },
        'Item Replace': {
            title: 'Item Replace',
            description: 'Swap out furniture and decor. Upload a photo of your room and an item you want to place in it.',
        },
        'Reference Style Match': {
            title: 'Reference Style Match',
            description: 'Match any style you love. Use a reference photo to apply its aesthetic directly to your room.',
        },
        'AI Design Advisor': {
            title: 'AI Design Advisor',
            description: 'Get expert advice on your space. Ask our AI personas for design tips, color suggestions, and more.',
        },
        'Multi-Item Preview': {
            title: 'Multi-Item Preview',
            description: 'See how multiple pieces look together. Upload your room and up to nine items to create a cohesive scene.',
        },
    };

    const renderPage = () => {
        switch (activePage) {
            case 'Explore': return <ExplorePage onNavigate={setActivePage} />;
            case 'Pricing': return <PricingPage />;
            case 'My Designs': 
                return currentUser ? <MyRendersPage history={generationHistory} onNavigate={setActivePage} onDownload={handleDownload} setFullScreenImage={setFullScreenImage} onDelete={handleDeleteGenerationImage} /> : <div className="flex-1 flex items-center justify-center text-center p-4 pt-[72px]">Please log in to view your designs.</div>;
            case 'Free Canvas':
                return <FreeCanvasPage 
                    setGenerationHistory={setGenerationHistory} 
                    generationHistory={generationHistory} 
                    // FIX: Corrected a typo in the onDownload prop, changing from the undefined 'onDownload' variable to the existing 'handleDownload' function.
                    onDownload={handleDownload} 
                    setFullScreenImage={setFullScreenImage} 
                    currentUser={currentUser} 
                    onUpdateUser={handleUpdateUser} 
                    onLoginRequest={() => auth.setShowLoginModal(true)} 
                    onError={setError}
                    onUpgrade={() => setActivePage('Pricing')}
                    canvasState={freeCanvasState}
                    setCanvasState={setFreeCanvasState}
                />;
            case 'Terms':
                return <TermsPage />;
            case 'Admin':
                // Check admin permissions
                if (!currentUser) {
                    return (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center">
                                <p className="text-xl text-slate-600 mb-4">请先登录</p>
                                <Button onClick={() => auth.setShowLoginModal(true)}>登录</Button>
                            </div>
                        </div>
                    );
                }
                
                if (!isAdmin) {
                    return (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center">
                                <p className="text-xl text-slate-600 mb-2">访问被拒绝</p>
                                <p className="text-sm text-slate-500">您没有管理员权限</p>
                            </div>
                        </div>
                    );
                }
                
                // Show loading state while fetching users
                if (isLoadingUsers) {
                    return (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 mx-auto"></div>
                                <p className="text-slate-600">加载管理后台...</p>
                            </div>
                        </div>
                    );
                }
                
                // Render AdminPage with data
                return <AdminPage 
                    users={users} 
                    onUpdateUser={handleUpdateUser} 
                    onDeleteUser={handleDeleteUser} 
                    generationHistory={generationHistory} 
                    totalDesignsGenerated={generationHistory.reduce((acc, b) => acc + b.results.length, 0)} 
                    onDeleteBatch={handleDeleteGenerationBatch} 
                    templateData={adminTemplateDataFull} 
                    setTemplateData={setAdminTemplateDataFull} 
                    categoryOrder={adminCategoryOrderFull} 
                    setCategoryOrder={setAdminCategoryOrderFull}
                    onTemplatesUpdated={refreshTemplateData}
                  />
            default: return renderMainGenerator();
        }
    };
    
    const renderMainGenerator = () => {
        const isStyleBased = ['Interior Design', 'Wall Paint', 'Floor Style', 'Garden & Backyard Design', 'Exterior Design', 'Festive Decor'].includes(activePage);
        const isItemReplace = activePage === 'Item Replace';
        const isStyleMatch = activePage === 'Reference Style Match';
        const isAIAdvisor = activePage === 'AI Design Advisor';
        const isMultiItem = activePage === 'Multi-Item Preview';
        
        let categories: PromptTemplateCategory[] = [];
        if (activePage === 'Interior Design') {
            // ✅ 从数据库加载 Interior Design 数据
            const interiorData = adminTemplateData["Interior Design"];
            if (interiorData) {
                // 查找当前选择的房间类型
                const roomCategory = interiorData.find(sc => sc.name === selectedRoomType);
                if (roomCategory && roomCategory.templates.length > 0) {
                    // 不按 sub_category 分组，直接显示所有模板
                    // sub_category 是技术性的固定值（"Style"），不需要显示
                    categories = [{
                        name: selectedRoomType, // 使用房间类型名称
                        templates: roomCategory.templates
                    }];
                }
            }
        } else if (activePage === 'Festive Decor') {
            const festiveData = adminTemplateData["Festive Decor"];
            if (festiveData) {
                const festiveCategory = festiveData.find(sc => sc.name === selectedFestiveType);
                if (festiveCategory && festiveCategory.templates.length > 0) {
                    categories = [{
                        name: selectedFestiveType,
                        templates: festiveCategory.templates
                    }];
                }
            }
        } else if (activePage === 'Exterior Design') {
            const exteriorData = adminTemplateData["Exterior Design"];
            if (exteriorData) {
                const buildingCategory = exteriorData.find(sc => sc.name === selectedBuildingType);
                if (buildingCategory && buildingCategory.templates.length > 0) {
                    categories = [{
                        name: selectedBuildingType,
                        templates: buildingCategory.templates
                    }];
                }
            }
        } else if (activePage === 'Wall Paint') {
            const wallPaintData = adminTemplateData["Wall Paint"];
            if (wallPaintData) {
                const wallPaintCategory = wallPaintData.find(sc => sc.name === selectedWallPaintType);
                if (wallPaintCategory && wallPaintCategory.templates.length > 0) {
                    categories = [{
                        name: selectedWallPaintType,
                        templates: wallPaintCategory.templates
                    }];
                }
            }
        } else if (activePage === 'Floor Style') {
            const floorData = adminTemplateData["Floor Style"];
            if (floorData) {
                const floorCategory = floorData.find(sc => sc.name === selectedFloorType);
                if (floorCategory && floorCategory.templates.length > 0) {
                    categories = [{
                        name: selectedFloorType,
                        templates: floorCategory.templates
                    }];
                }
            }
        } else if (activePage === 'Garden & Backyard Design') {
            const gardenData = adminTemplateData["Garden & Backyard Design"];
            if (gardenData) {
                const gardenCategory = gardenData.find(sc => sc.name === selectedGardenType);
                if (gardenCategory && gardenCategory.templates.length > 0) {
                    categories = [{
                        name: selectedGardenType,
                        templates: gardenCategory.templates
                    }];
                }
            }
        }

        const isGenerateDisabled = isLoading || !hasModule1Image || (!isAIAdvisor && !hasSelection && !isItemReplace && !isStyleMatch && !isMultiItem);

        const primaryImageTitle = 
            isStyleMatch ? 'Your Room Photo'
            : isItemReplace ? 'Your Room Photo'
            : isMultiItem ? 'Your Room Photo'
            : activePage === 'Exterior Design' ? 'Your Building/Site Photo'
            : activePage === 'Garden & Backyard Design' ? 'Your Garden or Backyard Photo'
            : 'Your Room Photo';
        
        const primaryImageDesc = 
            isStyleMatch ? 'The room you want to redesign.'
            : isItemReplace ? 'The room you want to redesign.'
            : isMultiItem ? 'The room you want to redesign.'
            : activePage === 'Exterior Design' ? 'The building or site you want to redesign.'
            : activePage === 'Garden & Backyard Design' ? 'The outdoor space you want to redesign.'
            : 'The room you want to redesign.';
            
        const currentPageInfo = pageInfo[activePage];

        return (
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-[380px] bg-white px-6 pb-6 pt-24 border-r border-slate-200 flex-shrink-0">
                    <div className="h-full overflow-y-auto scrollbar-hide pr-2 -mr-2">
                        <div className="flex flex-col gap-6">
                            {currentPageInfo && (
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-slate-800">{currentPageInfo.title}</h2>
                                    <p className="text-sm text-slate-500">{currentPageInfo.description}</p>
                                </div>
                            )}
                            <ImageUploader
                                title={primaryImageTitle}
                                description={primaryImageDesc}
                                imageUrl={module1Images[0]}
                                isUploading={!!uploadingSlots['m1-0']}
                                onFileSelect={() => handleFileSelect('m1', 0)}
                                onRemove={() => handleRemoveImage('m1', 0)}
                                onImageClick={setFullScreenImage}
                                onDrop={(e) => handleDropOnUploader(e, 'm1')}
                            />
                            
                            {isItemReplace && (
                                 <ImageUploader
                                    title="Item to Place"
                                    description="The object you want to add to the room."
                                    imageUrl={itemReplaceImage}
                                    isUploading={!!uploadingSlots['item-0']}
                                    onFileSelect={() => handleFileSelect('item', 0)}
                                    onRemove={handleRemoveItemImage}
                                    onImageClick={setFullScreenImage}
                                    onDrop={(e) => handleDropOnUploader(e, 'item')}
                                />
                            )}
                            {isStyleMatch && (
                                <ImageUploader
                                    title="Target Style Photo"
                                    description="Upload an image of the design style you want to match."
                                    imageUrl={styleMatchImage}
                                    isUploading={!!uploadingSlots['sm-0']}
                                    onFileSelect={() => handleFileSelect('sm', 0)}
                                    onRemove={handleRemoveStyleMatchImage}
                                    onImageClick={setFullScreenImage}
                                    onDrop={(e) => handleDropOnUploader(e, 'sm')}
                                />
                            )}
                            {isMultiItem && (
                                <MultiItemUploader
                                    images={multiItemImages}
                                    isUploadingSlots={uploadingSlots}
                                    onFileSelect={(index) => handleFileSelect('multi', index)}
                                    onRemove={handleRemoveMultiItemImage}
                                />
                            )}

                            {activePage === 'Interior Design' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Room Type"
                                        options={availableRoomTypes.length > 0 ? availableRoomTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No room types available'}]}
                                        value={availableRoomTypes.length > 0 ? selectedRoomType : 'loading'}
                                        onChange={setSelectedRoomType}
                                        disabled={templatesLoading || availableRoomTypes.length === 0}
                                    />
                                </div>
                            )}
                            {activePage === 'Festive Decor' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Festive Type"
                                        options={availableFestiveTypes.length > 0 ? availableFestiveTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No festive types available'}]}
                                        value={availableFestiveTypes.length > 0 ? selectedFestiveType : 'loading'}
                                        onChange={setSelectedFestiveType}
                                        disabled={templatesLoading || availableFestiveTypes.length === 0}
                                    />
                                </div>
                            )}
                            {activePage === 'Exterior Design' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Building Type"
                                        options={availableBuildingTypes.length > 0 ? availableBuildingTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No building types available'}]}
                                        value={availableBuildingTypes.length > 0 ? selectedBuildingType : 'loading'}
                                        onChange={setSelectedBuildingType}
                                        disabled={templatesLoading || availableBuildingTypes.length === 0}
                                    />
                                </div>
                            )}
                            {activePage === 'Wall Paint' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Color Tone"
                                        options={availableWallPaintTypes.length > 0 ? availableWallPaintTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No color tones available'}]}
                                        value={availableWallPaintTypes.length > 0 ? selectedWallPaintType : 'loading'}
                                        onChange={setSelectedWallPaintType}
                                        disabled={templatesLoading || availableWallPaintTypes.length === 0}
                                    />
                                </div>
                            )}
                            {activePage === 'Floor Style' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Floor Type"
                                        options={availableFloorTypes.length > 0 ? availableFloorTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No floor types available'}]}
                                        value={availableFloorTypes.length > 0 ? selectedFloorType : 'loading'}
                                        onChange={setSelectedFloorType}
                                        disabled={templatesLoading || availableFloorTypes.length === 0}
                                    />
                                </div>
                            )}
                            {activePage === 'Garden & Backyard Design' && (
                                <div>
                                    <CustomSelect
                                        label="Choose a Garden Type"
                                        options={availableGardenTypes.length > 0 ? availableGardenTypes : [{id: 'loading', name: templatesLoading ? 'Loading...' : 'No garden types available'}]}
                                        value={availableGardenTypes.length > 0 ? selectedGardenType : 'loading'}
                                        onChange={setSelectedGardenType}
                                        disabled={templatesLoading || availableGardenTypes.length === 0}
                                    />
                                </div>
                            )}
                            {isItemReplace && (
                                <CustomSelect
                                    label="Choose an Item Type"
                                    options={ITEM_TYPES}
                                    value={selectedItemType}
                                    onChange={setSelectedItemType}
                                />
                            )}

                            {isStyleBased && categories.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Choose a Style</h3>
                                    <PromptTemplates 
                                        categories={categories} 
                                        onTemplateSelect={handleTemplateSelect} 
                                        selectedTemplateIds={selectedTemplateIds}
                                        maxTemplates={currentUser ? MEMBERSHIP_CONFIG[currentUser.membershipTier].maxTemplates : 1}
                                    />
                                </div>
                            )}
                            {isAIAdvisor && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Ask an AI Advisor</h3>
                                        <textarea
                                            value={advisorQuestion}
                                            onChange={(e) => setAdvisorQuestion(e.target.value)}
                                            placeholder="Ask about your design, e.g., 'What color curtains would match this sofa?'"
                                            className="w-full mt-2 p-3 bg-white border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            rows={4}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Choose a Persona</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {ALL_ADVISORS.map(persona => {
                                                 const isSelected = selectedAdvisorIds.includes(persona.id);
                                                 return (
                                                    <div key={persona.id} onClick={() => handleAdvisorSelect(persona.id)} className={`p-3 border-2 rounded-2xl cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <img src={persona.imageUrl} alt={persona.name} className="w-12 h-12 rounded-full" />
                                                            <div>
                                                                <p className="font-semibold text-slate-800">{persona.name}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-2">{persona.description}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="sticky bottom-0 bg-white -mx-6 px-6 pt-4 pb-6 -mb-6 border-t border-slate-200">
                                {isAIAdvisor ? (
                                    <Button onClick={handleAskAdvisor} disabled={isAdvisorLoading} primary className="w-full text-base py-3">
                                        <IconSparkles className="w-5 h-5"/>
                                        {isAdvisorLoading ? "Thinking..." : "Ask (1 Credit)"}
                                    </Button>
                                ) : isItemReplace ? (
                                    <Button onClick={handleItemReplaceClick} disabled={isLoading || !hasModule1Image || !hasItemReplaceImage} primary className="w-full text-base py-3">
                                        <IconSparkles className="w-5 h-5"/>
                                        {isLoading ? "Replacing..." : "Replace (1 Credit)"}
                                    </Button>
                                ) : isStyleMatch ? (
                                    <Button onClick={handleStyleMatchClick} disabled={isLoading || !hasModule1Image || !hasStyleMatchImage} primary className="w-full text-base py-3">
                                        <IconSparkles className="w-5 h-5"/>
                                        {isLoading ? "Matching Style..." : "Generate (1 Credit)"}
                                    </Button>
                                ) : isMultiItem ? (
                                    <Button onClick={handleMultiItemClick} disabled={isLoading || !hasModule1Image || !hasMultiItemImages} primary className="w-full text-base py-3">
                                        <IconSparkles className="w-5 h-5"/>
                                        {isLoading ? "Placing Items..." : "Generate (1 Credit)"}
                                    </Button>
                                ) : (
                                    <Button onClick={handleGenerateClick} disabled={isGenerateDisabled} primary className="w-full text-base py-3">
                                        <IconSparkles className="w-5 h-5"/>
                                        {isLoading ? "Generating..." : selectedTemplateIds.length > 1 ? `Generate (${selectedTemplateIds.length} Credits)` : "Generate (1 Credit)"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 bg-slate-50 overflow-y-auto pt-[72px]">
                    {generatedImages.length > 0 ? (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedImages.map((image, i) => (
                                image.status === 'success' && image.imageUrl ? (
                                    <PhotoDisplay
                                        key={`${image.id}-${i}`}
                                        era={image.id}
                                        imageUrl={image.imageUrl}
                                        onDownload={handleDownload}
                                        onRegenerate={() => handleRegenerate(image)}
                                        onImageClick={setFullScreenImage}
                                        onDragStart={() => {}}
                                    />
                                ) : image.status === 'pending' ? (
                                    <LoadingCard key={`${image.id}-${i}-loading`} />
                                ) : (
                                    <ErrorCard key={`${image.id}-${i}-error`} onRegenerate={() => handleRegenerate(image)} />
                                )
                            ))}
                        </div>
                    ) : currentAdvisorResponse ? (
                        (() => {
                            const responses = (currentAdvisorResponse.multiModelResponses && currentAdvisorResponse.multiModelResponses.length > 0)
                                ? currentAdvisorResponse.multiModelResponses
                                : currentAdvisorResponse.textResponse
                                    ? [{
                                        personaId: 'ai-advisor-default',
                                        personaName: 'AI Advisor',
                                        personaImageUrl: '',
                                        text: currentAdvisorResponse.textResponse,
                                    }]
                                    : [];
                            return (
                                <div className="p-8">
                                    <div className="max-w-4xl mx-auto space-y-6">
                                        <div className="flex justify-end">
                                            <div className="max-w-xl bg-indigo-600 text-white rounded-3xl rounded-tr-sm shadow-lg p-5">
                                                <div className="text-xs uppercase tracking-wide text-indigo-100 mb-2">You</div>
                                                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{currentAdvisorResponse.prompt}</p>
                                            </div>
                                        </div>
                                        {responses.map((response) => {
                                            const persona = advisorById.get(response.personaId);
                                            const personaName = response.personaName || persona?.name || "Advisor";
                                            const personaImage = response.personaImageUrl || persona?.imageUrl || '';
                                            return (
                                                <div key={`${currentAdvisorResponse.id}-${response.personaId}`} className="flex items-start gap-4">
                                                    {personaImage ? (
                                                        <img src={personaImage} alt={personaName} className="w-12 h-12 rounded-full border border-slate-200 object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
                                                            {personaName.slice(0, 1)}
                                                        </div>
                                                    )}
                                                    <div className="max-w-xl bg-white border border-slate-200 rounded-3xl rounded-tl-sm shadow-sm p-5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-slate-800">{personaName}</span>
                                                            <span className="text-xs text-slate-400 uppercase tracking-wide">AI Designer</span>
                                                        </div>
                                                        <p className="text-sm sm:text-base leading-relaxed text-slate-600 whitespace-pre-wrap">{response.text}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <ResultsPlaceholder isAdvisor={isAIAdvisor} />
                    )}
                </main>
                <MyDesignsSidebar
                    generationHistory={generationHistory}
                    onDownload={handleDownload}
                    setFullScreenImage={setFullScreenImage}
                    onImageDragStart={handleResultImageDragStart}
                    onDelete={handleDeleteGenerationImage}
                />
            </div>
        )
    };
    
    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans">
            <ErrorNotification message={error} onDismiss={() => setError(null)} />
            <AnimatePresence>
                <ImageViewerModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            </AnimatePresence>
            <LoginModal 
                isOpen={auth.showLoginModal} 
                onClose={() => auth.setShowLoginModal(false)}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName={upgradeFeatureName}
                requiredTier={upgradeRequiredTier}
                onUpgrade={() => {
                    setIsUpgradeModalOpen(false);
                    setActivePage('Pricing');
                }}
            />
            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
            />

            <Header 
                activeItem={activePage} 
                onNavigate={setActivePage} 
                user={currentUser} 
                onLoginClick={() => auth.setShowLoginModal(true)}
                onLogout={handleLogout}
                designTools={designTools}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                {renderPage()}
            </div>

            {/* Hidden file input for uploads */}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
        </div>
    );
};

export default App;
