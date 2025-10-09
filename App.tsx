import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GoogleGenAI, Chat, Content } from "@google/genai";
// FIX: Import ManagedTemplateData and ManagedPromptTemplateCategory to resolve type errors.
import { GeneratedImage, PromptTemplateCategory, GenerationBatch, PromptTemplate, AdvisorPersona, ChatMessage, User, ManagedTemplateData, ManagedPromptTemplateCategory, CanvasImage, DrawablePath, Annotation, PromptPreset } from './types';
import { toBase64 } from './utils/imageUtils';
import { generateImage, generateTextResponse } from './services/geminiService';
import { Button } from './components/Button';
import { IconUpload, IconSparkles, IconOptions, IconDownload, IconCamera, IconX, IconPlus, IconPhoto, IconBell, IconUserCircle, IconLogo, IconCheck, IconCrown, IconChevronDown, IconGoogle, IconApple, IconViewLarge, IconViewMedium, IconViewSmall, IconTrash, IconBookmark } from './components/Icons';
import { ALL_ADVISORS, ALL_TEMPLATE_CATEGORIES, ROOM_TYPES, STYLES_BY_ROOM_TYPE, ITEM_TYPES, BUILDING_TYPES, PERMISSION_MAP, ADMIN_PAGE_CATEGORIES, EXPLORE_GALLERY_ITEMS } from './constants';
import { PricingPage } from './components/PricingPage';
import { BlogPage } from './components/BlogPage';
import { FreeCanvasPage, MyDesignsSidebar } from './components/FreeCanvasPage';
import { AdminPage } from './components/AdminPage';

// --- Re-styled Helper Components ---

const PromptTemplates: React.FC<{
    categories: PromptTemplateCategory[];
    onTemplateSelect: (templateId: string) => void;
    selectedTemplateIds: string[];
}> = ({ categories, onTemplateSelect, selectedTemplateIds }) => {
    const SELECTION_LIMIT = 9;

    return (
        <div className="space-y-6">
            {categories.map(category => (
                <div key={category.name}>
                    <h2 className="text-base font-semibold text-slate-700 mb-3">{category.name}</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {category.templates.map((template) => {
                            const isSelected = selectedTemplateIds.includes(template.id);
                            const limitReached = selectedTemplateIds.length >= SELECTION_LIMIT;
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
            {imageUrl && (
                 <div className="space-y-1 mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            )}
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
                            aria-label={`Remove image`}
                        >
                            <IconX />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center p-4 cursor-pointer" onClick={onFileSelect}>
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
    designTools: { key: string; label: string; }[];
}> = ({ onNavigate, activeItem, designTools }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full mt-3 w-64 origin-top-left bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black/5 text-slate-800 text-sm flex flex-col p-2"
        >
            {designTools.map(item => (
                <button
                    key={item.key}
                    onClick={() => onNavigate(item.label)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-3 ${activeItem === item.label ? 'bg-indigo-500/10 text-indigo-600' : 'hover:bg-slate-500/10'}`}
                >
                    <span>{item.label}</span>
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
    const activeDesignToolLabel = isDesignToolActive ? activeItem : 'Tools';

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

    const navItems = ['Terms', 'Pricing', 'News'];

    return (
        <header className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 bg-white/70 backdrop-blur-xl z-40 border-b border-slate-900/10 shadow-sm">
            <div className="flex items-center gap-6">
                <button onClick={() => onNavigate('Explore')} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient-pan">MyNook.AI</span>
                </button>
                <nav className="hidden md:flex items-center gap-2">
                    <div className="relative" ref={designToolsRef}>
                        <button
                            onClick={() => setDesignToolsOpen(o => !o)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors relative flex items-center gap-1.5 ${isDesignToolActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            <span>{activeDesignToolLabel}</span>
                            <IconChevronDown className={`w-3 h-3 transition-transform duration-200 ${designToolsOpen ? 'rotate-180' : ''}`} />
                            {isDesignToolActive && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                        </button>
                        <AnimatePresence>
                            {designToolsOpen && <DesignToolsMenu onNavigate={(page) => { onNavigate(page); setDesignToolsOpen(false); }} activeItem={activeItem} designTools={designTools} />}
                        </AnimatePresence>
                    </div>

                    {navItems.map(item => (
                         <a 
                           key={item} 
                           href="#" 
                           onClick={(e) => { e.preventDefault(); onNavigate(item); }}
                           className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors relative ${activeItem === item ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                           {item}
                           {activeItem === item && <motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500" layoutId="nav-underline" />}
                        </a>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-4">
                {user && (
                    <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                        {`Credits: ${user.credits}`}
                    </div>
                )}

                {upgradeButton.visible && (
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

                <div className="relative" ref={userMenuRef}>
                    {user ? (
                        <button onClick={() => setUserMenuOpen(o => !o)} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-inner shadow-black/10">
                            {user.email.charAt(0)}
                        </button>
                    ) : (
                        <button onClick={onLoginClick} className="text-slate-500 hover:text-slate-800"><IconUserCircle/></button>
                    )}
                    <AnimatePresence>
                        {user && userMenuOpen && <UserMenu user={user} onLogout={onLogout} onNavigate={onNavigate} />}
                    </AnimatePresence>
                </div>
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
    return (
        <main className="flex-1 overflow-y-auto bg-white text-slate-800 scrollbar-hide flex flex-col">
            {/* Hero Section */}
            <section 
              className="relative bg-cover bg-center text-white pt-[168px] pb-24 sm:pt-[200px] sm:pb-32 px-4 h-[50vh] flex items-center justify-center" 
              style={{ backgroundImage: "url('https://storage.googleapis.com/aistudio-hosting/templates/interior-japandi.png')" }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative container mx-auto max-w-4xl text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl sm:text-6xl font-extrabold tracking-tight drop-shadow-lg"
                    >
                        Effortless Design, Powered by AI
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        className="mt-4 text-lg sm:text-xl max-w-2xl mx-auto text-white/90 drop-shadow-md"
                    >
                        Transform photos of your rooms with powerful AI. Create stunning visuals for home renovations, staging, lookbooks, and more.
                    </motion.p>
                </div>
            </section>
            
            <section className="px-4 sm:px-6 lg:px-8 py-16">
                <div className="w-full mx-auto columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
                    {EXPLORE_GALLERY_ITEMS.map((item) => (
                        <div 
                            key={item.id} 
                            className="mb-4 break-inside-avoid relative group cursor-pointer overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-slate-200"
                            style={{
                                aspectRatio: (item.width && item.height) ? `${item.width} / ${item.height}` : 'auto'
                            }}
                        >
                            {item.type === 'image' ? (
                                <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <video 
                                    src={item.src} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover" 
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute top-0 right-0 p-3">
                                    <button className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100" aria-label="Save">
                                        <IconBookmark className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

             {/* Footer */}
            <footer className="text-center p-4 border-t border-slate-200 text-slate-500 mt-auto flex justify-center items-center text-sm px-8">
                <span>© 2024 MyNook.AI. All Rights Reserved.</span>
            </footer>
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

const AuthModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => string | null;
    onRegister: (email: string, password: string) => string | null;
}> = ({ isOpen, onClose, onLogin, onRegister }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        let errorResult: string | null = null;
        if (activeTab === 'signin') {
            errorResult = onLogin(email, password);
        } else {
            errorResult = onRegister(email, password);
        }
        if (errorResult) {
            setAuthError(errorResult);
        } else {
            onClose(); // Close modal on success
        }
    };

    const handleSocialLogin = (providerEmail: string) => {
        const errorResult = onLogin(providerEmail, 'social_login_placeholder');
        if (errorResult) {
            const registerError = onRegister(providerEmail, 'social_login_placeholder');
            if (registerError) {
                setAuthError(registerError);
            } else {
                onClose();
            }
        } else {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setAuthError(null);
            setActiveTab('signin');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 shadow-2xl w-full max-w-sm text-center relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><IconX /></button>
                <div className="flex items-center justify-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient-pan">MyNook.AI</h2>
                </div>
                
                <div className="flex justify-center border-b border-slate-200 mb-6">
                    <button onClick={() => { setActiveTab('signin'); setAuthError(null); }} className={`py-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'signin' ? 'text-slate-800' : 'text-slate-500'}`}>
                        Sign In
                        {activeTab === 'signin' && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500" layoutId="auth-underline" />}
                    </button>
                    <button onClick={() => { setActiveTab('signup'); setAuthError(null); }} className={`py-3 px-6 text-sm font-medium transition-colors relative ${activeTab === 'signup' ? 'text-slate-800' : 'text-slate-500'}`}>
                        Sign Up
                        {activeTab === 'signup' && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500" layoutId="auth-underline" />}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-100/80 border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div>
                         <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 bg-slate-100/80 border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    {authError && <p className="text-red-500 text-sm text-left">{authError}</p>}
                     <Button type="submit" primary className="w-full py-3 text-base">
                        {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">OR</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>

                <div className="space-y-3">
                    <Button onClick={() => handleSocialLogin('user@google.com')} className="w-full !py-3">
                        <IconGoogle />
                        <span>Continue with Google</span>
                    </Button>
                    <Button onClick={() => handleSocialLogin('user@apple.com')} className="w-full !py-3">
                        <IconApple className="w-6 h-6"/>
                        <span>Continue with Apple</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};


// --- Custom iOS-style Select Component ---

const CustomSelect: React.FC<{
    options: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    label: string;
}> = ({ options, value, onChange, label }) => {
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
        onChange(optionId);
        setIsOpen(false);
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
            <div className="relative" ref={selectRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-4 bg-white/50 backdrop-blur-xl border border-slate-300 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                    <span className="truncate">{selectedOption?.name || 'Select...'}</span>
                    <IconChevronDown className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
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
  annotations: Annotation[];
  activeTool: 'select' | 'draw' | 'annotate';
  brushColor: string;
  brushSize: number;
  annotationShape: 'rect' | 'circle';
  selectedImageId: string | null;
  selectedPathId: string | null;
  presets: PromptPreset[];
}


const App: React.FC = () => {
    // Navigation state
    const [activePage, setActivePage] = useState('Explore');
    
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


    // Auth state
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Load users from localStorage on initial render
    useEffect(() => {
        try {
            const storedUsers = localStorage.getItem('homevision_users');
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            }
        } catch (error) {
            console.error("Failed to parse users from localStorage", error);
        }
    }, []);

    // Save users to localStorage whenever the users state changes
    useEffect(() => {
        try {
            localStorage.setItem('homevision_users', JSON.stringify(users));
        } catch (error) {
            console.error("Failed to save users to localStorage", error);
        }
    }, [users]);


    // --- Auth Handlers ---
    const handleRegister = (email: string, password: string): string | null => {
        if (users.some(u => u.email === email)) {
            return "An account with this email already exists.";
        }
        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            password,
            status: 'Active',
            joined: new Date().toISOString(),
            registrationIp: '127.0.0.1', // Mock IP
            lastIp: '127.0.0.1',       // Mock IP
            permissionLevel: 1,        // Default to Normal User
            credits: 10,               // Starting credits
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        return null;
    };
    
    const handleLogin = (email: string, password: string): string | null => {
        const user = users.find(u => u.email === email);
        if (!user) {
            return "No account found with this email.";
        }
        if (user.password !== password) {
            return "Incorrect password. Please try again.";
        }
        if (user.status === 'Banned') {
            return "This account has been banned.";
        }
        
        const updatedUser = { ...user, lastIp: '127.0.0.1' }; // Mock IP update
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        return null;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };
    
    const handleUpdateUser = (userId: string, updates: Partial<User>) => {
        setUsers(currentUsers =>
            currentUsers.map(u => (u.id === userId ? { ...u, ...updates } : u))
        );
         if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter(u => u.id !== userId));
        if (currentUser?.id === userId) {
            setCurrentUser(null);
        }
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
    
    // AI Advisor State
    const [advisorChat, setAdvisorChat] = useState<Chat | null>(null);
    const [advisorQuestion, setAdvisorQuestion] = useState('');
    const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
    const [currentAdvisorResponse, setCurrentAdvisorResponse] = useState<GenerationBatch | null>(null);
    const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

    // History state
    const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>([]);
    
    // Free Canvas State (lifted for persistence)
    const [freeCanvasState, setFreeCanvasState] = useState<FreeCanvasState>(() => {
        const initialPresets = (() => {
            try {
                const savedPresets = localStorage.getItem('freeCanvasPresets');
                return savedPresets ? JSON.parse(savedPresets) : [];
            } catch (e) {
                console.error("Failed to load presets from localStorage", e);
                return [];
            }
        })();
        return {
            images: [],
            prompt: '',
            paths: [],
            annotations: [],
            activeTool: 'select',
            brushColor: '#ef4444',
            brushSize: 8,
            annotationShape: 'rect',
            selectedImageId: null,
            selectedPathId: null,
            presets: initialPresets,
        };
    });

    useEffect(() => {
        try {
            localStorage.setItem('freeCanvasPresets', JSON.stringify(freeCanvasState.presets));
        } catch (e) {
            console.error("Failed to save presets to localStorage", e);
        }
    }, [freeCanvasState.presets]);


    const hasModule1Image = useMemo(() => module1Images.some(img => img !== null), [module1Images]);
    const hasItemReplaceImage = useMemo(() => itemReplaceImage !== null, [itemReplaceImage]);
    const hasStyleMatchImage = useMemo(() => styleMatchImage !== null, [styleMatchImage]);
    const hasMultiItemImages = useMemo(() => multiItemImages.some(img => img !== null), [multiItemImages]);
    const hasSelection = useMemo(() => selectedTemplateIds.length > 0, [selectedTemplateIds]);

    const designTools = [
        { key: 'Interior Design', label: 'Interior Design' },
        { key: 'Festive Decor', label: 'Festive Decor' },
        { key: 'Exterior Design', label: 'Exterior Design' },
        { key: 'Wall Paint', label: 'Wall Paint' },
        { key: 'Floor Style', label: 'Floor Style' },
        { key: 'Garden & Backyard Design', label: 'Garden & Backyard Design' },
        { key: 'Item Replace', label: 'Item Replace' },
        { key: 'Reference Style Match', label: 'Reference Style Match' },
        { key: 'AI Design Advisor', label: 'AI Design Advisor' },
        { key: 'Multi-Item Preview', label: 'Multi-Item Preview' },
        { key: 'Free Canvas', label: 'Free Canvas' },
    ];
    const [adminTemplateData, setAdminTemplateData] = useState<ManagedTemplateData>(ADMIN_PAGE_CATEGORIES);
    const [adminCategoryOrder, setAdminCategoryOrder] = useState<string[]>(Object.keys(ADMIN_PAGE_CATEGORIES));

    // --- Image Handling ---
    
    const handleFileSelect = (module: 'm1' | 'item' | 'sm' | 'multi', index: number) => {
        uploadTargetRef.current = { module, index };
        const input = fileInputRef.current;
        if (input) {
            input.multiple = false;
            input.click();
        }
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
            if (prev.length < 9) {
                return [...prev, templateId];
            }
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
            setIsAuthModalOpen(true);
            return;
        }
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
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
    
        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
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

        const placeholders: GeneratedImage[] = selectedTemplates.map(template => ({
            id: template.name,
            status: 'pending',
            imageUrl: null,
            promptBase: isWallPaint || isGardenBackyard || isFloorStyle
                ? template.prompt
                : isExteriorDesign
                    ? `A ${buildingTypeName}, ${template.prompt}`
                    : `A ${roomTypeName}, ${template.prompt}`,
        }));
        
        setGeneratedImages(placeholders);
    
        const finalResults = await Promise.all(placeholders.map(async (placeholder) => {
            try {
                const imageUrl = await generateImage(getModelInstruction(placeholder.promptBase), module1ForApi);
                return { ...placeholder, status: 'success' as const, imageUrl };
            } catch (err) {
                console.error(`Generation failed for ${placeholder.id}:`, err);
                return { ...placeholder, status: 'failed' as const };
            }
        }));
    
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
            userId: currentUser.id,
        };
        setGenerationHistory(prev => [newBatch, ...prev]);
    
        setIsLoading(false);
    };

    const handleItemReplaceClick = async () => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
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
    
        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
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
    
        } catch (err) {
            console.error("Item replacement failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleStyleMatchClick = async () => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
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

        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
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
    
        } catch (err) {
            console.error("Style match failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleMultiItemClick = async () => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
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

        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
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
    
        } catch (err) {
            console.error("Multi-item placement failed:", err);
            setGeneratedImages([{ ...placeholder, status: 'failed' as const }]);
        }
    
        setIsLoading(false);
    };

    const handleAskAdvisor = async () => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
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

        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
        setIsAdvisorLoading(true);
        setError(null);
        setGeneratedImages([]);

        const roomImage = module1Images.find((img): img is string => !!img);
        const selectedPersonas = selectedAdvisorIds.map(id => ALL_ADVISORS.find(p => p.id === id)).filter((p): p is AdvisorPersona => !!p);

        // Single persona response for now
        const primaryPersona = selectedPersonas[0];

        try {
            const responseText = await generateTextResponse(
                advisorQuestion,
                primaryPersona.systemInstruction,
                roomImage
            );

            const newBatch: GenerationBatch = {
                id: `advisor_${Date.now()}`,
                type: 'ai_advisor',
                timestamp: new Date(),
                subjectImage: roomImage || null,
                styleImages: [],
                prompt: advisorQuestion,
                results: [],
                templateIds: [],
                textResponse: responseText,
                chatHistory: [
                    { role: 'user', text: advisorQuestion },
                    { role: 'model', text: responseText }
                ],
                multiModelResponses: [{ personaId: primaryPersona.id, text: responseText }],
                userId: currentUser.id,
            };

            setCurrentAdvisorResponse(newBatch);
            setGenerationHistory(prev => [newBatch, ...prev]);
            
        } catch (err) {
             console.error("Advisor generation failed:", err);
             setError("Failed to get a response from the advisor.");
        } finally {
            setIsAdvisorLoading(false);
        }
    };
    
    const handleRegenerate = async (image: GeneratedImage) => {
        if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
        }
        if (currentUser.credits < 1) {
            setError("You have run out of credits. Please upgrade your plan to continue generating.");
            return;
        }
        
        handleUpdateUser(currentUser.id, { credits: currentUser.credits - 1 });
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
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${baseName.replace(/\s+/g, '_')}_${Date.now()}.png`;
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
            case 'News': return <BlogPage />;
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
                    onLoginRequest={() => setIsAuthModalOpen(true)} 
                    onError={setError}
                    canvasState={freeCanvasState}
                    setCanvasState={setFreeCanvasState}
                />;
            case 'Terms':
                 return <ComingSoonPage pageName={activePage} />;
            case 'Admin':
// FIX: Pass 'handleUpdateUser' to 'onUpdateUser' prop to fix 'Cannot find name' error.
                return <AdminPage users={users} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} generationHistory={generationHistory} totalDesignsGenerated={generationHistory.reduce((acc, b) => acc + b.results.length, 0)} onDeleteBatch={handleDeleteGenerationBatch} templateData={adminTemplateData} setTemplateData={setAdminTemplateData} categoryOrder={adminCategoryOrder} setCategoryOrder={setAdminCategoryOrder}/>
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
        if (activePage === 'Interior Design' && STYLES_BY_ROOM_TYPE[selectedRoomType]) {
            categories = STYLES_BY_ROOM_TYPE[selectedRoomType];
        } else if (activePage === 'Wall Paint') {
             categories = adminTemplateData["Wall Paint"];
        } else if (activePage === 'Floor Style') {
            categories = adminTemplateData["Floor Style"];
        } else if (activePage === 'Garden & Backyard Design') {
            categories = adminTemplateData["Garden"];
        } else if (activePage === 'Exterior Design') {
            categories = adminTemplateData["Exterior Design"];
        } else if (activePage === 'Festive Decor') {
            categories = adminTemplateData["Festive Decor"];
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

                            {['Interior Design', 'Festive Decor'].includes(activePage) && (
                                <CustomSelect
                                    label="Choose a Room Type"
                                    options={ROOM_TYPES}
                                    value={selectedRoomType}
                                    onChange={setSelectedRoomType}
                                />
                            )}
                            {activePage === 'Exterior Design' && (
                                <CustomSelect
                                    label="Choose a Building Type"
                                    options={BUILDING_TYPES}
                                    value={selectedBuildingType}
                                    onChange={setSelectedBuildingType}
                                />
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
                                <PromptTemplates categories={categories} onTemplateSelect={handleTemplateSelect} selectedTemplateIds={selectedTemplateIds} />
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
                                        {isLoading ? "Generating..." : `Generate ${selectedTemplateIds.length > 0 ? `${selectedTemplateIds.length} Design(s)` : ''} (1 Credit)`}
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
                        <div className="p-8 max-w-4xl mx-auto">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                                <h2 className="text-xl font-semibold text-slate-800 mb-2">AI Advisor's Answer</h2>
                                <p className="text-sm text-slate-500 mb-4 whitespace-pre-wrap"><strong>Your Question:</strong> {currentAdvisorResponse.prompt}</p>
                                <div className="prose prose-slate max-w-none">
                                    <p>{currentAdvisorResponse.textResponse}</p>
                                </div>
                            </div>
                        </div>
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
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onRegister={handleRegister}
            />

            <Header 
                activeItem={activePage} 
                onNavigate={setActivePage} 
                user={currentUser} 
                onLoginClick={() => setIsAuthModalOpen(true)}
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