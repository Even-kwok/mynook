
import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBase64 } from '../utils/imageUtils';
import { generateImage } from '../services/geminiService';
import { Button } from './Button';
import { IconUpload, IconSparkles, IconCursorArrow, IconBrush, IconPhoto, IconX, IconDownload, IconUndo, IconTrash, IconArrowDown, IconArrowUp, IconViewLarge, IconViewMedium, IconViewSmall, IconChevronDown, IconChevronRight, IconCrop, IconPencil, IconMicrophone, IconRotateRight, IconTag, IconRectangle, IconCircle } from './Icons';
import { GenerationBatch, GeneratedImage, User, CanvasImage, DrawablePath, Annotation, PromptPreset } from '../types';


interface FreeCanvasPageProps {
    setGenerationHistory: React.Dispatch<React.SetStateAction<GenerationBatch[]>>;
    generationHistory: GenerationBatch[];
    onDownload: (imageUrl: string, era: string) => void;
    setFullScreenImage: (url: string | null) => void;
    currentUser: User | null;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onLoginRequest: () => void;
    onError: (message: string | null) => void;
    canvasState: {
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
    };
    setCanvasState: React.Dispatch<React.SetStateAction<FreeCanvasPageProps['canvasState']>>;
}

interface MyDesignsSidebarProps {
    generationHistory: GenerationBatch[];
    onDownload: (imageUrl: string, era: string) => void;
    setFullScreenImage: (url: string | null) => void;
    onImageDragStart?: (e: React.DragEvent<HTMLImageElement>, src: string) => void;
    onDelete: (batchId: string, imageId: string) => void;
}

// @ts-ignore
// Renamed the `SpeechRecognition` constant to `SpeechRecognitionAPI` to avoid shadowing the global `SpeechRecognition` type. This resolves the "Cannot find name 'SpeechRecognition'" error for the `recognitionRef` type annotation.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const MyDesignsSidebar: React.FC<MyDesignsSidebarProps> = ({
    generationHistory,
    onDownload,
    setFullScreenImage,
    onImageDragStart,
    onDelete,
}) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(true);
    const [galleryViewSize, setGalleryViewSize] = useState<'sm' | 'md' | 'lg'>('md');
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

    const allGalleryImages = useMemo(() => {
        return generationHistory
            .filter(b => imageBatchTypes.includes(b.type))
            .flatMap(batch =>
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
            ).sort((a, b) => b.batchInfo.timestamp.getTime() - a.batchInfo.timestamp.getTime());
    }, [generationHistory]);

    const groupedImages = useMemo(() => {
        const groups: Record<string, typeof allGalleryImages> = {};
        allGalleryImages.forEach(image => {
            const type = image.batchInfo.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type]!.push(image);
        });
        return groups;
    }, [allGalleryImages]);

    const albumOrder = useMemo(() => Object.keys(groupedImages).sort((a, b) => {
        const latestA = groupedImages[a][0].batchInfo.timestamp.getTime();
        const latestB = groupedImages[b][0].batchInfo.timestamp.getTime();
        return latestB - latestA;
    }), [groupedImages]);

    const [expandedAlbums, setExpandedAlbums] = useState<Set<string>>(new Set(albumOrder));

    useEffect(() => {
        setExpandedAlbums(new Set(albumOrder));
    }, [albumOrder]);

    const toggleAlbum = (albumType: string) => {
        setExpandedAlbums(prev => {
            const newSet = new Set(prev);
            if (newSet.has(albumType)) {
                newSet.delete(albumType);
            } else {
                newSet.add(albumType);
            }
            return newSet;
        });
    };

    const viewSizeClasses = useMemo(() => {
        switch (galleryViewSize) {
            case 'sm': return 'grid-cols-3';
            case 'lg': return 'grid-cols-1';
            case 'md': default: return 'grid-cols-2';
        }
    }, [galleryViewSize]);

    return (
        <div className="relative flex-shrink-0">
            <button
                onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                className="absolute top-1/2 -translate-y-1/2 -left-3 z-30 w-6 h-24 bg-white border border-r-0 border-slate-300 rounded-l-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label={isGalleryOpen ? 'Collapse gallery' : 'Expand gallery'}
            >
                <motion.div animate={{ rotate: isGalleryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <IconChevronRight className="w-4 h-4" />
                </motion.div>
            </button>
            <motion.aside
                initial={false}
                animate={{ width: isGalleryOpen ? 320 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="h-full overflow-hidden bg-white border-l border-slate-200"
            >
                <div className="w-[320px] h-full px-4 pb-4 pt-[88px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-slate-800">My Designs</h2>
                        <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-xl">
                            {(['lg', 'md', 'sm'] as const).map(size => (
                                <button
                                    key={size}
                                    onClick={() => setGalleryViewSize(size)}
                                    className={`p-1.5 rounded-lg transition-colors ${galleryViewSize === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                                    aria-label={`${size} view`}
                                >
                                    {size === 'lg' && <IconViewLarge className="w-4 h-4" />}
                                    {size === 'md' && <IconViewMedium className="w-4 h-4" />}
                                    {size === 'sm' && <IconViewSmall className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {allGalleryImages.length > 0 ? (
                            <div className="space-y-2">
                                {albumOrder.map(albumType => {
                                    const imagesInAlbum = groupedImages[albumType];
                                    const isExpanded = expandedAlbums.has(albumType);
                                    return (
                                        <div key={albumType}>
                                            <button
                                                onClick={() => toggleAlbum(albumType)}
                                                className="w-full text-left p-2 rounded-xl hover:bg-slate-100 transition-colors flex justify-between items-center"
                                                aria-expanded={isExpanded}
                                            >
                                                <h3 className="font-semibold text-sm text-slate-700">{albumTypeLabels[albumType]} ({imagesInAlbum.length})</h3>
                                                <IconChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        key="content"
                                                        initial="collapsed"
                                                        animate="open"
                                                        exit="collapsed"
                                                        variants={{
                                                            open: { opacity: 1, height: 'auto' },
                                                            collapsed: { opacity: 0, height: 0 }
                                                        }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className={`grid ${viewSizeClasses} gap-4 mt-2`}>
                                                            {imagesInAlbum.map((image, index) => (
                                                                <motion.div
                                                                    key={`${image.id}-${index}`}
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                    className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-200 shadow-sm"
                                                                >
                                                                    <img
                                                                        src={image.imageUrl!}
                                                                        alt={image.promptBase}
                                                                        className={`w-full h-full object-cover ${onImageDragStart ? 'cursor-grab' : 'cursor-pointer'}`}
                                                                        onClick={() => setFullScreenImage(image.imageUrl!)}
                                                                        draggable={!!onImageDragStart}
                                                                        onDragStart={(e) => onImageDragStart?.(e, image.imageUrl!)}
                                                                    />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-2 flex flex-col justify-end">
                                                                        <h4 className="text-white text-xs font-semibold truncate">{image.batchInfo.prompt}</h4>
                                                                        <p className="text-white/80 text-xs truncate">{albumTypeLabels[image.batchInfo.type]}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => onDownload(image.imageUrl!, image.id)}
                                                                        className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                                                        aria-label="Download"
                                                                    >
                                                                        <IconDownload className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => onDelete(image.batchInfo.id, image.id)}
                                                                        className="absolute bottom-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform scale-75 group-hover:scale-100 pointer-events-auto"
                                                                        aria-label="Delete"
                                                                    >
                                                                        <IconTrash className="w-4 h-4" />
                                                                    </button>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-4">
                                <IconPhoto className="w-12 h-12 text-slate-300" />
                                <p className="mt-4 text-sm font-medium text-slate-500">No Designs Yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>
        </div>
    );
};

interface ClearConfirmationModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    clearButtonRef: React.RefObject<HTMLButtonElement>;
}

const ClearConfirmationModal: React.FC<ClearConfirmationModalProps> = ({ isOpen, setIsOpen, onConfirm, clearButtonRef }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current && !modalRef.current.contains(event.target as Node) &&
                clearButtonRef.current && !clearButtonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen, clearButtonRef]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-12 right-28 z-30 w-full max-w-xs"
                >
                    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-200">
                        <div className="absolute top-1/2 -right-[7px] transform -translate-y-1/2 w-4 h-4 bg-white/90 border-t border-r border-slate-200 rotate-45 z-0 rounded-sm"></div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2 text-slate-800">Clear Canvas?</h3>
                            <p className="text-sm text-slate-600 mb-6">
                                Are you sure you want to clear everything on the canvas? This action cannot be undone.
                            </p>
                            <div className="flex justify-between">
                                <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button onClick={onConfirm} className="!bg-red-600 hover:!bg-red-700 !border-red-600 text-white">
                                    Clear Canvas
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


export const FreeCanvasPage: React.FC<FreeCanvasPageProps> = ({ 
    setGenerationHistory, 
    generationHistory, 
    onDownload, 
    setFullScreenImage, 
    currentUser, 
    onUpdateUser, 
    onLoginRequest, 
    onError,
    canvasState,
    setCanvasState
}) => {
    // 检查用户是否有权限访问 Free Canvas（只有 Premium 和 Business 可以访问）
    const hasAccess = currentUser && (currentUser.membershipTier === 'premium' || currentUser.membershipTier === 'business');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef<({ type: 'image'; id: string; offsetX: number; offsetY: number } | { type: 'path'; id: string; startX: number; startY: number; originalPath: DrawablePath }) | null>(null);
    const resizeInfo = useRef<{
        imageId: string;
        handle: 'tl' | 'tr' | 'bl' | 'br';
        startX: number;
        startY: number;
        startImageX: number;
        startImageY: number;
        startImageWidth: number;
        startImageHeight: number;
    } | null>(null);
    const rotationInfo = useRef<{
        imageId: string;
        centerX: number;
        centerY: number;
        startAngle: number;
        initialRotation: number;
    } | null>(null);
    const cropDragInfo = useRef<{
        handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
        startX: number;
        startY: number;
        startBox: { x: number; y: number; width: number; height: number; };
    } | null>(null);

    const {
        images,
        prompt,
        paths,
        annotations,
        activeTool,
        brushColor,
        brushSize,
        annotationShape,
        selectedImageId,
        selectedPathId,
        presets,
    } = canvasState;

    const setImages = (updater: React.SetStateAction<CanvasImage[]>) => setCanvasState(prev => ({ ...prev, images: typeof updater === 'function' ? updater(prev.images) : updater }));
    const setPrompt = (updater: React.SetStateAction<string>) => setCanvasState(prev => ({ ...prev, prompt: typeof updater === 'function' ? updater(prev.prompt) : updater }));
    const setPaths = (updater: React.SetStateAction<DrawablePath[]>) => setCanvasState(prev => ({ ...prev, paths: typeof updater === 'function' ? updater(prev.paths) : updater }));
    const setAnnotations = (updater: React.SetStateAction<Annotation[]>) => setCanvasState(prev => ({ ...prev, annotations: typeof updater === 'function' ? updater(prev.annotations) : updater }));
    const setActiveTool = (updater: React.SetStateAction<'select' | 'draw' | 'annotate'>) => setCanvasState(prev => ({ ...prev, activeTool: typeof updater === 'function' ? updater(prev.activeTool) : updater }));
    const setBrushColor = (updater: React.SetStateAction<string>) => setCanvasState(prev => ({ ...prev, brushColor: typeof updater === 'function' ? updater(prev.brushColor) : updater }));
    const setBrushSize = (updater: React.SetStateAction<number>) => setCanvasState(prev => ({ ...prev, brushSize: typeof updater === 'function' ? updater(prev.brushSize) : updater }));
    const setAnnotationShape = (updater: React.SetStateAction<'rect' | 'circle'>) => setCanvasState(prev => ({ ...prev, annotationShape: typeof updater === 'function' ? updater(prev.annotationShape) : updater }));
    const setSelectedImageId = (updater: React.SetStateAction<string | null>) => setCanvasState(prev => ({ ...prev, selectedImageId: typeof updater === 'function' ? updater(prev.selectedImageId) : updater }));
    const setSelectedPathId = (updater: React.SetStateAction<string | null>) => setCanvasState(prev => ({ ...prev, selectedPathId: typeof updater === 'function' ? updater(prev.selectedPathId) : updater }));
    const setPresets = (updater: React.SetStateAction<PromptPreset[]>) => setCanvasState(prev => ({ ...prev, presets: typeof updater === 'function' ? updater(prev.presets) : updater }));
    
    // Local UI state, doesn't need to be persisted
    const [drawingAnnotation, setDrawingAnnotation] = useState<{ startX: number; startY: number; currentBox?: { x: number; y: number; width: number; height: number; } } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [cropState, setCropState] = useState<{ imageId: string; box: { x: number; y: number; width: number; height: number; }; } | null>(null);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<PromptPreset | { name: string; prompt: string } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    // @ts-ignore - SpeechRecognition is a browser API that may not be in all TS lib configurations.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    // FIX: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
    const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isRotationSnapped, setIsRotationSnapped] = useState<boolean>(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const clearButtonRef = useRef<HTMLButtonElement>(null);


    const getPathBoundingBox = (path: DrawablePath): { x: number; y: number; width: number; height: number } | null => {
        if (path.points.length === 0) return null;
        let minX = path.points[0].x;
        let minY = path.points[0].y;
        let maxX = path.points[0].x;
        let maxY = path.points[0].y;
        path.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    };
    
    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(prev => (prev ? prev + ' ' : '') + transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            onError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
                recordingTimeoutRef.current = null;
            }
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            if (recordingTimeoutRef.current) {
                clearTimeout(recordingTimeoutRef.current);
            }
        };
    }, [onError, setPrompt]);
    
    const handleToggleRecording = () => {
        if (!recognitionRef.current) {
            onError("Speech recognition is not supported by your browser.");
            return;
        }
    
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
                recordingTimeoutRef.current = setTimeout(() => {
                    recognitionRef.current?.stop();
                }, 15000); // 15 second limit
            } catch (e) {
                console.error("Could not start speech recognition", e);
                onError("Could not start speech recognition. Please check microphone permissions.");
                setIsRecording(false);
            }
        }
    };

    const handleUndo = useCallback(() => {
        setPaths(prev => prev.slice(0, -1));
    }, [setPaths]);

    const handleDeletePath = useCallback((pathId: string) => {
        setPaths(prev => prev.filter(p => p.id !== pathId));
        setSelectedPathId(null);
    }, [setPaths, setSelectedPathId]);

    const handleDeleteAnnotation = useCallback((id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    }, [setAnnotations]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                if (selectedPathId) {
                    handleDeletePath(selectedPathId);
                }
                if (selectedImageId) {
                    setImages(prev => prev.filter(img => img.id !== selectedImageId));
                    setSelectedImageId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPathId, selectedImageId, handleDeletePath, setImages, setSelectedImageId]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+Z or Cmd+Z for undo functionality
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); // Prevent the browser's default undo action
                handleUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleUndo]);


    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await toBase64(file);
                const img = new Image();
                img.onload = () => {
                    const newImage: CanvasImage = {
                        id: `img_${Date.now()}`,
                        src: base64,
                        x: 50,
                        y: 50,
                        width: img.width > 400 ? 400 : img.width,
                        height: img.width > 400 ? (img.height * (400 / img.width)) : img.height,
                        rotation: 0,
                    };
                    setImages(prev => [...prev, newImage]);
                };
                img.src = base64;
            } catch (err) {
                console.error("Error processing image:", err);
                onError("Failed to load image.");
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>, imageId?: string) => {
        if (cropState) return;

        if (!imageId) {
            setSelectedImageId(null);
            setSelectedPathId(null);
        }
    
        if (activeTool === 'select' && imageId) {
            setSelectedImageId(imageId);
            setSelectedPathId(null);
            const image = images.find(img => img.id === imageId);
            if (!image) return;
            dragInfo.current = {
                type: 'image',
                id: imageId,
                offsetX: e.clientX - image.x,
                offsetY: e.clientY - image.y,
            };
        } else if (activeTool === 'draw' && workspaceRef.current) {
            setIsDrawing(true);
            const rect = workspaceRef.current.getBoundingClientRect();
            const newPath: DrawablePath = {
                id: `path_${Date.now()}`,
                points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
                color: brushColor,
                size: brushSize,
            };
            setPaths(prev => [...prev, newPath]);
        } else if (activeTool === 'annotate' && workspaceRef.current && annotations.length < 9) {
            const rect = workspaceRef.current.getBoundingClientRect();
            setDrawingAnnotation({
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
            });
        }
    };

    const handlePathMouseDown = (e: ReactMouseEvent, pathId: string) => {
        e.stopPropagation();
        if (activeTool === 'select' || activeTool === 'draw') {
            setSelectedImageId(null);
            setSelectedPathId(pathId);
            const path = paths.find(p => p.id === pathId);
            if (!path) return;
            dragInfo.current = {
                type: 'path',
                id: pathId,
                startX: e.clientX,
                startY: e.clientY,
                originalPath: { ...path, points: path.points.map(p => ({...p})) }, // Deep copy
            };
        }
    }

    const handleResizeMouseDown = (e: ReactMouseEvent<HTMLDivElement>, imageId: string, handle: 'tl' | 'tr' | 'bl' | 'br') => {
        e.stopPropagation();
        dragInfo.current = null;
        const image = images.find(img => img.id === imageId);
        if (!image) return;
        resizeInfo.current = {
            imageId,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startImageX: image.x,
            startImageY: image.y,
            startImageWidth: image.width,
            startImageHeight: image.height,
        };
    };

    const handleRotationMouseDown = (e: ReactMouseEvent, imageId: string) => {
        e.stopPropagation();
        dragInfo.current = null;
        resizeInfo.current = null;

        const image = images.find(img => img.id === imageId);
        if (!image || !workspaceRef.current) return;

        const rect = workspaceRef.current.getBoundingClientRect();
        // Image center relative to the workspace div
        const centerX = image.x + image.width / 2;
        const centerY = image.y + image.height / 2;

        // Mouse position relative to the workspace div
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Angle of the mouse click relative to the image center
        const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX);

        rotationInfo.current = {
            imageId,
            centerX,
            centerY,
            startAngle,
            initialRotation: image.rotation || 0,
        };
    };

    const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
        if (cropState) return; // Cropping has its own handler

        if (rotationInfo.current) {
            const { imageId, centerX, centerY, startAngle, initialRotation } = rotationInfo.current;
            if (!workspaceRef.current) return;

            const rect = workspaceRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
            const angleDelta = currentAngle - startAngle;

            const rotationInDegrees = angleDelta * (180 / Math.PI);
            let newRotation = initialRotation + rotationInDegrees;
            
            const SNAP_ANGLES = [0, 90, 180, 270, 360, -90, -180, -270, -360];
            const SNAP_THRESHOLD = 4; // degrees
            let snapped = false;

            for (const angle of SNAP_ANGLES) {
                if (Math.abs(newRotation - angle) < SNAP_THRESHOLD) {
                    newRotation = angle;
                    snapped = true;
                    break;
                }
            }
            
            setIsRotationSnapped(snapped);

            setImages(prev => prev.map(img =>
                img.id === imageId ? { ...img, rotation: newRotation } : img
            ));
        } else if (resizeInfo.current) {
            const { imageId, handle, startX, startY, startImageX, startImageY, startImageWidth, startImageHeight } = resizeInfo.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const aspectRatio = startImageWidth / startImageHeight;

            let newWidth = startImageWidth;
            let newHeight = startImageHeight;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (handle.includes('r')) {
                    newWidth = startImageWidth + dx;
                } else if (handle.includes('l')) {
                    newWidth = startImageWidth - dx;
                }
                newHeight = newWidth / aspectRatio;
            } else {
                if (handle.includes('b')) {
                    newHeight = startImageHeight + dy;
                } else if (handle.includes('t')) {
                    newHeight = startImageHeight - dy;
                }
                newWidth = newHeight * aspectRatio;
            }

            let newX = startImageX;
            let newY = startImageY;

            if (handle.includes('l')) {
                newX = startImageX + (startImageWidth - newWidth);
            }
            if (handle.includes('t')) {
                newY = startImageY + (startImageHeight - newHeight);
            }
    
            if (newWidth > 20 && newHeight > 20) {
                setImages(prev => prev.map(img =>
                    img.id === imageId ? { ...img, x: newX, y: newY, width: newWidth, height: newHeight } : img
                ));
            }
        } else if (activeTool === 'select' && dragInfo.current) {
            if (dragInfo.current.type === 'image') {
                const { id, offsetX, offsetY } = dragInfo.current;
                setImages(prev => prev.map(img =>
                    img.id === id ? { ...img, x: e.clientX - offsetX, y: e.clientY - offsetY } : img
                ));
            } else if (dragInfo.current.type === 'path') {
                const { id, startX, startY, originalPath } = dragInfo.current;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                setPaths(prev => prev.map(p =>
                    p.id === id ? { ...p, points: originalPath.points.map(point => ({ x: point.x + dx, y: point.y + dy })) } : p
                ));
            }
        } else if (activeTool === 'draw' && isDrawing && workspaceRef.current) {
             const rect = workspaceRef.current.getBoundingClientRect();
             const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
             setPaths(prev => {
                const newPaths = [...prev];
                const currentPath = newPaths[newPaths.length - 1];
                if (currentPath) {
                    currentPath.points.push(newPoint);
                }
                return newPaths;
            });
        } else if (activeTool === 'annotate' && drawingAnnotation && workspaceRef.current) {
            const rect = workspaceRef.current.getBoundingClientRect();
            const { startX, startY } = drawingAnnotation;
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const newBox = {
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: Math.abs(currentX - startX),
                height: Math.abs(currentY - startY),
            };
            setDrawingAnnotation(prev => prev ? {...prev, currentBox: newBox} : null);
        }
    };

    const handleMouseUp = (e: ReactMouseEvent<HTMLDivElement>) => {
        if (activeTool === 'annotate' && drawingAnnotation && workspaceRef.current) {
            const rect = workspaceRef.current.getBoundingClientRect();
            const { startX, startY } = drawingAnnotation;
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            const box = {
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY),
            };

            if (box.width > 10 && box.height > 10) {
                const newAnnotation: Annotation = {
                    id: `ann_${Date.now()}`,
                    shape: annotationShape,
                    box,
                    label: `Box ${annotations.length + 1}`,
                    text: '',
                };
                setAnnotations(prev => [...prev, newAnnotation]);
            }
            setDrawingAnnotation(null);
        }

        dragInfo.current = null;
        resizeInfo.current = null;
        rotationInfo.current = null;
        setIsDrawing(false);
        setIsRotationSnapped(false);
    };

     const handleDeleteImage = (e: ReactMouseEvent | null, imageId: string) => {
        e?.stopPropagation();
        setImages(prev => prev.filter(img => img.id !== imageId));
        setSelectedImageId(null);
    };

    const handleLayerChange = (imageId: string, direction: 'up' | 'down') => {
        const index = images.findIndex(img => img.id === imageId);
        if (index === -1) return;

        const newImages = [...images];

        if (direction === 'down' && index > 0) {
            [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
            setImages(newImages);
        } else if (direction === 'up' && index < images.length - 1) {
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
            setImages(newImages);
        }
    };
    
    const handleQuickRotate = (imageId: string, angle: number) => {
        setImages(prev => prev.map(img => {
            if (img.id === imageId) {
                const currentRotation = img.rotation || 0;
                const newRotation = currentRotation + angle;
                return { ...img, rotation: newRotation };
            }
            return img;
        }));
    };

    // --- Cropping Logic ---

    const handleStartCrop = (imageId: string) => {
        const image = images.find(img => img.id === imageId);
        if (!image) return;
        setActiveTool('select');
        setSelectedImageId(null); 
        setCropState({
            imageId: imageId,
            box: { x: image.x, y: image.y, width: image.width, height: image.height }
        });
    };

    const handleCropMouseDown = (e: ReactMouseEvent, handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move') => {
        e.stopPropagation();
        if (!cropState) return;
        cropDragInfo.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startBox: { ...cropState.box },
        };
    };

    const handleCropMouseMove = (e: ReactMouseEvent) => {
        if (!cropDragInfo.current || !cropState) return;
        
        const image = images.find(img => img.id === cropState.imageId);
        if (!image) return;

        const { handle, startX, startY, startBox } = cropDragInfo.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let { x, y, width, height } = startBox;

        if (handle.includes('r')) width = Math.max(20, startBox.width + dx);
        if (handle.includes('l')) {
            width = Math.max(20, startBox.width - dx);
            x = startBox.x + dx;
        }
        if (handle.includes('b')) height = Math.max(20, startBox.height + dy);
        if (handle.includes('t')) {
            height = Math.max(20, startBox.height - dy);
            y = startBox.y + dy;
        }
        if (handle === 'move') {
            x = startBox.x + dx;
            y = startBox.y + dy;
        }

        // Constrain box to image bounds
        x = Math.max(image.x, x);
        y = Math.max(image.y, y);
        if (x + width > image.x + image.width) {
            width = image.x + image.width - x;
        }
        if (y + height > image.y + image.height) {
            height = image.y + image.height - y;
        }

        setCropState(prev => prev ? { ...prev, box: { x, y, width, height } } : null);
    };

    const handleCropMouseUp = () => {
        cropDragInfo.current = null;
    };

    const handleConfirmCrop = async () => {
        if (!cropState) return;

        const image = images.find(img => img.id === cropState.imageId);
        if (!image) return;

        const { box } = cropState;

        const originalImg = new Image();
        originalImg.crossOrigin = "anonymous";
        originalImg.src = image.src;

        originalImg.onload = () => {
            const scaleX = originalImg.naturalWidth / image.width;
            const scaleY = originalImg.naturalHeight / image.height;

            const sourceX = (box.x - image.x) * scaleX;
            const sourceY = (box.y - image.y) * scaleY;
            const sourceWidth = box.width * scaleX;
            const sourceHeight = box.height * scaleY;
            
            const canvas = document.createElement('canvas');
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(originalImg, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            
            const newSrc = canvas.toDataURL('image/png');
            
            setImages(prev => prev.map(img => 
                img.id === cropState.imageId ? {
                    ...img,
                    src: newSrc,
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height,
                } : img
            ));
            
            setCropState(null);
            setSelectedImageId(cropState.imageId);
        };
    };

    // --- End Cropping ---

    const handleSavePreset = () => {
        if (!prompt.trim()) return;
        setEditingPreset({ name: '', prompt: prompt });
        setIsPresetModalOpen(true);
    };

    const handleSetPrompt = (e: React.MouseEvent, newPrompt: string) => {
        e.stopPropagation();
        setPrompt(newPrompt);
    };

    const handleEditPreset = (e: React.MouseEvent, preset: PromptPreset) => {
        e.stopPropagation();
        setEditingPreset(preset);
        setIsPresetModalOpen(true);
    };

    const handleDeletePreset = (e: React.MouseEvent, presetId: string) => {
        e.stopPropagation();
        setPresets(prev => prev.filter(p => p.id !== presetId));
    };

    const handlePresetModalSave = (name: string, promptText: string) => {
        if (editingPreset && 'id' in editingPreset) {
            setPresets(prev => prev.map(p => p.id === (editingPreset as PromptPreset).id ? { ...p, name, prompt: promptText } : p));
        } else {
            const newPreset: PromptPreset = {
                id: `preset_${Date.now()}`,
                name,
                prompt: promptText
            };
            setPresets(prev => [...prev, newPreset]);
        }
        setIsPresetModalOpen(false);
        setEditingPreset(null);
    };
    
    const handleAnnotationTextChange = (id: string, newText: string) => {
        setAnnotations(prev =>
            prev.map(ann => (ann.id === id ? { ...ann, text: newText } : ann))
        );
    };

    useEffect(() => {
        const annotationPrompt = annotations
            .filter(ann => ann.text.trim() !== '')
            .map(ann => `${ann.label}: ${ann.text.trim()}`)
            .join(', ');
        
        if (annotations.length > 0) {
            setPrompt(annotationPrompt);
        }
    }, [annotations, setPrompt]);


    const captureCanvasAsImage = async (): Promise<string> => {
        const workspace = workspaceRef.current;
        if (!workspace) throw new Error("Workspace not found");

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not available");

        const rect = workspace.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.fillStyle = '#F9FAFB'; // Match BG color
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw images
        const imagePromises = images.map(imgData => new Promise<void>(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                ctx.drawImage(img, imgData.x, imgData.y, imgData.width, imgData.height);
                resolve();
            };
            img.onerror = () => resolve(); // Don't block on error
            img.src = imgData.src;
        }));
        await Promise.all(imagePromises);

        // Draw paths
        paths.forEach(path => {
            if (path.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        });

        return canvas.toDataURL('image/png');
    };
    
    const createCompositeForGeneration = async (
        baseImage: CanvasImage,
        overlayImages: CanvasImage[],
        paths: DrawablePath[],
        annotations: Annotation[]
    ): Promise<string> => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not available");

        const baseImgEl = new Image();
        baseImgEl.crossOrigin = "anonymous";
        const baseImgPromise = new Promise<void>((resolve, reject) => {
            baseImgEl.onload = () => resolve();
            baseImgEl.onerror = reject;
        });
        baseImgEl.src = baseImage.src;
        await baseImgPromise;
        
        canvas.width = baseImgEl.naturalWidth;
        canvas.height = baseImgEl.naturalHeight;

        const scaleX = canvas.width / baseImage.width;
        const scaleY = canvas.height / baseImage.height;

        ctx.drawImage(baseImgEl, 0, 0);

        const overlayPromises = overlayImages.map(overlay => new Promise<void>(resolve => {
            const overlayImgEl = new Image();
            overlayImgEl.crossOrigin = "anonymous";
            overlayImgEl.onload = () => {
                const relX = (overlay.x - baseImage.x) * scaleX;
                const relY = (overlay.y - baseImage.y) * scaleY;
                const scaledWidth = overlay.width * scaleX;
                const scaledHeight = overlay.height * scaleY;
                ctx.drawImage(overlayImgEl, relX, relY, scaledWidth, scaledHeight);
                resolve();
            };
            overlayImgEl.onerror = () => resolve();
            overlayImgEl.src = overlay.src;
        }));
        await Promise.all(overlayPromises);

        paths.forEach(path => {
            if (path.points.length < 2) return;
            ctx.beginPath();
            const startX = (path.points[0].x - baseImage.x) * scaleX;
            const startY = (path.points[0].y - baseImage.y) * scaleY;
            ctx.moveTo(startX, startY);
            path.points.slice(1).forEach(point => {
                const pointX = (point.x - baseImage.x) * scaleX;
                const pointY = (point.y - baseImage.y) * scaleY;
                ctx.lineTo(pointX, pointY);
            });
            
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.size * scaleX;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        });

        annotations.forEach(ann => {
            ctx.strokeStyle = '#f59e0b'; // amber-500
            ctx.lineWidth = 2 * scaleX;
            ctx.setLineDash([6 * scaleX, 3 * scaleX]);
    
            const boxX = (ann.box.x - baseImage.x) * scaleX;
            const boxY = (ann.box.y - baseImage.y) * scaleY;
            const boxWidth = ann.box.width * scaleX;
            const boxHeight = ann.box.height * scaleY;
    
            if (ann.shape === 'rect') {
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            } else { // circle
                ctx.beginPath();
                ctx.ellipse(boxX + boxWidth / 2, boxY + boxHeight / 2, boxWidth / 2, boxHeight / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
    
            ctx.setLineDash([]);
    
            ctx.fillStyle = '#f59e0b';
            const fontSize = 14 * scaleX;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(ann.label, boxX, boxY - (5 * scaleY));
        });

        return canvas.toDataURL('image/png');
    };

    const handleGenerate = async () => {
        if (!currentUser) {
            onLoginRequest();
            return;
        }
        if (currentUser.credits < 1) {
            onError("You need at least 1 credit to generate an image. Please upgrade your plan to continue.");
            return;
        }
        if (!prompt || (images.length === 0 && paths.length === 0)) {
            onError("Please add an image or drawing and provide a prompt.");
            return;
        }
    
        // Start loading state (don't deduct credits here - backend will handle it)
        setIsLoading(true);
        onError(null);

        // Defensively clear any lingering interaction states
        dragInfo.current = null;
        resizeInfo.current = null;
        setIsDrawing(false);
    
        try {
            let imageForApi: string;
            let finalPrompt: string;
    
            if (images.length > 0) {
                // The first image in the array (bottom layer) is the base for generation.
                const baseImage = images[0];
                const overlayImages = images.slice(1);
    
                imageForApi = await createCompositeForGeneration(baseImage, overlayImages, paths, annotations);
    
                if (annotations.length > 0) {
                     finalPrompt = `You are an expert inpainting and photo editing AI. The user has provided an image marked with numbered boxes. These boxes are instructional overlays and indicate specific areas for editing. Your task is to perform the edits described in the user's prompt, which are mapped to these numbered boxes. After applying the edits, you MUST completely remove the boxes and their labels. The final output must be a clean, photorealistic image with no trace of any instructional markings (no boxes, no dashed lines, no numbers, no labels). It should look like a real photograph. The user's instructions are: "${prompt}"`;
                } else if (overlayImages.length > 0 || paths.length > 0) {
                     finalPrompt = `You are an expert photo editor. Your task is to edit the provided base image. This image may contain other overlaid images or drawings which act as instructions for what to add or change. You must seamlessly integrate these elements into the base image, guided by the user's text prompt, to produce a single, photorealistic, and cohesive final image. IMPORTANT: The drawings and overlaid images are instructional guides; they should be replaced by realistic content and must NOT appear literally in the final output. User's prompt: "${prompt}"`;
                } else {
                    // Just one image and a text prompt, treat as a general transformation.
                    finalPrompt = `You are an expert photo editor. Your task is to transform the provided image based on the user's prompt. Produce a new, photorealistic version of the original image with the requested changes seamlessly integrated. User's prompt: "${prompt}"`;
                }
    
            } else {
                // No images, only drawings. Generate from scratch on the whole canvas.
                imageForApi = await captureCanvasAsImage();
                finalPrompt = `Generate a photorealistic image based on the user's drawings on a blank canvas and their text prompt. The drawings provide a rough sketch or composition. The text prompt is: "${prompt}"`;
            }
            
            const imageForApiData = imageForApi.split(',')[1];
            const generatedUrl = await generateImage(finalPrompt, [imageForApiData]);
    
            // Note: Backend automatically deducted 5 credits after successful generation
            // The parent component should refresh user data to show updated credits
    
            // Save to history
            const resultImage: GeneratedImage = {
                id: `canvas_${Date.now()}`,
                status: 'success',
                imageUrl: generatedUrl,
                promptBase: finalPrompt,
            };
            const newBatch: GenerationBatch = {
                id: Date.now().toString(),
                type: 'free_canvas',
                timestamp: new Date(),
                subjectImage: imageForApi,
                styleImages: [],
                prompt: prompt,
                results: [resultImage],
                templateIds: [],
            };
            setGenerationHistory(prev => [newBatch, ...prev]);
    
        } catch (err) {
            console.error("Generation failed:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            
            // Handle specific error cases
            if (errorMessage.includes('logged in') || errorMessage.includes('Authentication')) {
                onError("Please log in to use this feature.");
                onLoginRequest();
            } else if (errorMessage.includes('Insufficient credits')) {
                onError("You don't have enough credits. Please upgrade your plan.");
            } else if (errorMessage.includes('Auth session missing')) {
                onError("Your session has expired. Please log in again.");
                onLoginRequest();
            } else {
                onError(`Generation failed: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearDrawings = useCallback(() => {
        setPaths([]);
    }, [setPaths]);
    
    const handleConfirmClear = () => {
        setImages([]);
        setPaths([]);
        setAnnotations([]);
        setSelectedImageId(null);
        setSelectedPathId(null);
        setCropState(null);
        setIsClearConfirmOpen(false);
    };

    const handleResultImageDragStart = (e: React.DragEvent<HTMLImageElement>, src: string) => {
        e.dataTransfer.setData('application/homevision-image-src', src);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const src = e.dataTransfer.getData('application/homevision-image-src');
        if (!src || !workspaceRef.current) return;

        const workspaceRect = workspaceRef.current.getBoundingClientRect();
        const dropX = e.clientX - workspaceRect.left;
        const dropY = e.clientY - workspaceRect.top;

        const img = new Image();
        img.onload = () => {
            const initialWidth = img.width > 400 ? 400 : img.width;
            const initialHeight = img.width > 400 ? (img.height * (400 / img.width)) : img.height;
            
            const newImage: CanvasImage = {
                id: `img_${Date.now()}`,
                src: src,
                x: dropX - initialWidth / 2, // Center the image on the drop point
                y: dropY - initialHeight / 2,
                width: initialWidth,
                height: initialHeight,
                rotation: 0,
            };
            setImages(prev => [...prev, newImage]);
            setSelectedImageId(newImage.id); // Select the newly dropped image
            setActiveTool('select'); // Switch to select tool for immediate manipulation
        };
        img.src = src;
    };
    
    const handleDelete = (batchId: string, imageId: string) => {
        const imageBatchTypes: GenerationBatch['type'][] = ['style', 'item_replace', 'wall_paint', 'floor_style', 'garden', 'style_match', 'multi_item', 'exterior', 'festive', 'free_canvas'];
        setGenerationHistory(prevHistory => {
            const newHistory = prevHistory.map(batch => {
                if (batch.id === batchId) {
                    const newResults = batch.results.filter(result => result.id !== imageId);
                    if (newResults.length === 0 && imageBatchTypes.includes(batch.type)) {
                        return null;
                    }
                    return { ...batch, results: newResults };
                }
                return batch;
            });
            return newHistory.filter((b): b is GenerationBatch => b !== null);
        });
    };

    const PresetModal = () => {
        if (!isPresetModalOpen || !editingPreset) return null;

        const [name, setName] = useState(editingPreset.name);
        const [promptText, setPromptText] = useState(editingPreset.prompt);
        const isEditing = 'id' in editingPreset;

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (name.trim() && promptText.trim()) {
                handlePresetModalSave(name, promptText);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200"
                >
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-lg font-semibold mb-4 text-slate-800">{isEditing ? "Edit Prompt" : "Save Prompt"}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., 'Remove background'"
                                    className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-400 focus:ring focus:ring-indigo-300 focus:ring-opacity-50 p-2 bg-slate-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Prompt Text</label>
                                <textarea
                                    value={promptText}
                                    onChange={e => setPromptText(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-400 focus:ring focus:ring-indigo-300 focus:ring-opacity-50 h-32 p-2 bg-slate-50"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" onClick={() => setIsPresetModalOpen(false)}>Cancel</Button>
                            <Button type="submit" primary>{isEditing ? "Update" : "Save"}</Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        );
    };

    // 如果没有登录，显示登录提示
    if (!currentUser) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">👑</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Free Canvas - Premium Feature</h2>
                    <p className="text-slate-600 mb-6">
                        Please log in to access the Free Canvas feature.
                    </p>
                    <Button onClick={onLoginRequest} primary>
                        Login to Continue
                    </Button>
                </div>
            </div>
        );
    }
    
    // 如果用户等级不够，显示升级提示
    if (!hasAccess) {
        const tierName = currentUser?.membershipTier 
            ? currentUser.membershipTier.charAt(0).toUpperCase() + currentUser.membershipTier.slice(1)
            : 'Free';
        
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md px-6">
                    <div className="text-6xl mb-4">👑</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Free Canvas - Premium Feature</h2>
                    <p className="text-slate-600 mb-4">
                        Free Canvas is a premium feature available for <span className="font-semibold text-purple-600">Premium</span> and <span className="font-semibold text-amber-600">Business</span> members.
                    </p>
                    <p className="text-sm text-slate-500 mb-6">
                        Your current plan: <span className="font-semibold">{tierName}</span>
                    </p>
                    <div className="space-y-3 text-left bg-white rounded-2xl p-4 mb-6">
                        <p className="text-sm font-semibold text-slate-700">With Premium or Business, you can:</p>
                        <ul className="text-sm text-slate-600 space-y-2">
                            <li>✨ Combine multiple images on a canvas</li>
                            <li>🎨 Draw and annotate freely</li>
                            <li>🖼️ Generate custom designs with AI</li>
                            <li>🔧 Advanced editing tools</li>
                        </ul>
                    </div>
                    <Button primary>
                        Upgrade to Premium
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PresetModal />
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-[380px] bg-white flex flex-col overflow-hidden flex-shrink-0 border-r border-slate-200">
                    <div className="flex-1 px-6 pb-6 pt-24 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col gap-6">
                            <div className="space-y-3">
                                <h2 className="text-xl font-bold text-slate-800">Free Canvas</h2>
                                <p className="text-sm text-slate-500">Combine images, draw annotations, and use a prompt to generate a new creation.</p>
                            </div>

                            <Button onClick={() => fileInputRef.current?.click()}>
                                <IconUpload />
                                Upload Image
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                            
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                <h3 className="text-base font-semibold text-slate-800">Tools</h3>
                                <div className="flex gap-2 p-1 bg-slate-200 rounded-xl">
                                    <button onClick={() => setActiveTool('select')} className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTool === 'select' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
                                        <IconCursorArrow className="w-5 h-5"/> Select
                                    </button>
                                     <button onClick={() => setActiveTool('draw')} className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTool === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
                                        <IconBrush className="w-5 h-5"/> Draw
                                    </button>
                                    <button onClick={() => setActiveTool('annotate')} className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTool === 'annotate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
                                        <IconTag className="w-5 h-5"/> Annotate
                                    </button>
                                </div>
                                {activeTool === 'draw' && (
                                    <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} className="space-y-4 overflow-hidden">
                                        <div className="space-y-2">
                                            <label htmlFor="brushColor" className="text-sm font-medium text-slate-700 flex justify-between">
                                                Brush Color <span>{brushColor}</span>
                                            </label>
                                            <input id="brushColor" type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-full h-10 p-1 bg-white border border-slate-300 rounded-lg cursor-pointer" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="brushSize" className="text-sm font-medium text-slate-700 flex justify-between">
                                                Brush Size <span>{brushSize}px</span>
                                            </label>
                                            <input id="brushSize" type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-slate-200">
                                            <h4 className="text-sm font-medium text-slate-700">Drawing Actions</h4>
                                            <div className="flex gap-2">
                                                <Button onClick={handleUndo} disabled={paths.length === 0} className="w-full !py-2 !px-3 text-sm">
                                                    <IconUndo className="w-4 h-4" />
                                                    Undo
                                                </Button>
                                                <Button onClick={handleClearDrawings} disabled={paths.length === 0} className="w-full !py-2 !px-3 text-sm">
                                                    <IconTrash className="w-4 h-4" />
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {activeTool === 'annotate' && (
                                    <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} className="space-y-4 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-slate-700">Shape</h4>
                                            <div className="flex gap-1 p-0.5 bg-slate-200 rounded-lg">
                                                <button onClick={() => setAnnotationShape('rect')} className={`p-1.5 rounded-md ${annotationShape === 'rect' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/70'}`} aria-label="Rectangle">
                                                    <IconRectangle className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setAnnotationShape('circle')} className={`p-1.5 rounded-md ${annotationShape === 'circle' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/70'}`} aria-label="Circle">
                                                    <IconCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">Click and drag on the canvas to draw a shape. You can create up to 9 annotations.</p>
                                    </motion.div>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <h3 className="text-base font-semibold text-slate-800">Prompt</h3>
                                <div className="relative">
                                    <textarea 
                                        value={prompt} 
                                        onChange={(e) => { if (annotations.length === 0) setPrompt(e.target.value); }} 
                                        readOnly={annotations.length > 0}
                                        placeholder={annotations.length > 0 ? "Prompt is generated from annotations." : "Describe what you want to create..."} 
                                        className="w-full p-3 pr-24 h-32 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 read-only:bg-slate-100" />
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleToggleRecording}
                                            className={`p-2 rounded-full transition-colors ${
                                                isRecording
                                                    ? 'bg-red-500 text-white animate-pulse'
                                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                                            disabled={!SpeechRecognitionAPI}
                                        >
                                            <IconMicrophone className="w-5 h-5" />
                                        </button>
                                        {prompt.trim() && (
                                            <Button onClick={handleSavePreset} className="!py-1 !px-2 text-xs">
                                                Save
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <h3 className="text-base font-semibold text-slate-800">Saved Prompts</h3>
                                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                                    {presets.length > 0 ? (
                                        presets.map(p => (
                                            <div key={p.id} className="group flex items-center justify-between -mx-2 px-2 py-1.5 rounded-xl hover:bg-slate-200 transition-colors">
                                                <button onClick={(e) => handleSetPrompt(e, p.prompt)} className="flex-1 text-left text-sm text-slate-700 group-hover:text-slate-900 truncate pr-2" title={p.name}>
                                                    {p.name}
                                                </button>
                                                <div className="flex items-center flex-shrink-0 gap-1">
                                                    <button onClick={(e) => handleEditPreset(e, p)} className="p-1 text-slate-500 hover:text-slate-800 rounded-md" aria-label={`Edit "${p.name}" prompt`}>
                                                        <IconPencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={(e) => handleDeletePreset(e, p.id)} className="p-1 text-slate-500 hover:text-red-600 rounded-md" aria-label={`Delete "${p.name}" prompt`}>
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic px-2">No saved prompts yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-4 border-t border-slate-200">
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt || (images.length === 0 && paths.length === 0 && annotations.length === 0)} primary className="w-full text-base py-3">
                            <IconSparkles className="w-5 h-5" />
                            {isLoading ? "Generating your vision..." : "Generate (1 Credit)"}
                        </Button>
                    </div>
                </aside>
                <main className="flex-1 p-8 pt-[104px] flex items-center justify-center bg-slate-50 relative">
                     {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    )}
                    <AnimatePresence>
                        {(images.length > 0 || paths.length > 0 || annotations.length > 0) && !isLoading && (
                            <motion.button
                                ref={clearButtonRef}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => setIsClearConfirmOpen(o => !o)}
                                className="absolute bottom-12 right-12 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-colors"
                                aria-label="Clear canvas"
                            >
                                <IconTrash className="w-6 h-6" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                     <ClearConfirmationModal 
                        isOpen={isClearConfirmOpen}
                        setIsOpen={setIsClearConfirmOpen}
                        onConfirm={handleConfirmClear}
                        clearButtonRef={clearButtonRef}
                     />
                    <div className="w-full max-h-full aspect-[4/5] bg-slate-100 border border-slate-200 shadow-inner rounded-3xl relative overflow-hidden">
                        <>
                            {images.length === 0 && paths.length === 0 && annotations.length === 0 && !cropState && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400">
                                    <IconPhoto className="w-16 h-16" />
                                    <h3 className="text-xl font-semibold mt-4 text-slate-600">Your Creative Canvas</h3>
                                    <p className="mt-1">Upload images and start bringing your ideas to life.</p>
                                </div>
                            )}
                            <div 
                                ref={workspaceRef}
                                className={`w-full h-full relative ${activeTool === 'draw' || activeTool === 'annotate' ? 'cursor-crosshair' : 'cursor-default'}`}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {images.map((image, index) => {
                                    if (cropState?.imageId === image.id) return null; // Hide normal image when cropping
                                    const isSelected = selectedImageId === image.id && activeTool === 'select';
                                    const isFirst = index === 0;
                                    const isLast = index === images.length - 1;
                                    return (
                                    <div
                                        key={image.id}
                                        className={`absolute select-none group ${isSelected ? 'outline outline-2 outline-offset-4 outline-indigo-500 rounded-xl' : ''} ${activeTool === 'select' ? 'cursor-move' : ''}`}
                                        style={{ left: image.x, top: image.y, width: image.width, height: image.height, transform: `rotate(${image.rotation || 0}deg)` }}
                                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, image.id); }}
                                    >
                                        <img src={image.src} alt="canvas element" draggable="false" className="w-full h-full object-cover pointer-events-none rounded-lg" />
                                        {isSelected && (
                                            <>
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-white rounded-full shadow-md">
                                                    <button onClick={() => handleLayerChange(image.id, 'down')} disabled={isFirst} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move layer down">
                                                        <IconArrowDown />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteImage(e, image.id)} className="p-1.5 text-slate-600 hover:bg-red-500 hover:text-white rounded-full transition-colors" aria-label="Delete image">
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleLayerChange(image.id, 'up')} disabled={isLast} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move layer up">
                                                        <IconArrowUp />
                                                    </button>
                                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleStartCrop(image.id); }} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" aria-label="Crop image">
                                                        <IconCrop className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                
                                                <div className={`absolute -top-[48px] left-1/2 -translate-x-1/2 w-px h-6 pointer-events-none transition-colors ${isRotationSnapped ? 'bg-green-500' : 'bg-indigo-500'}`} />
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center z-20 gap-2">
                                                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handleQuickRotate(image.id, -90)} className="p-1.5 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Rotate left 90 degrees">
                                                        <IconUndo className="w-4 h-4" />
                                                    </button>
                                                    <div
                                                        onMouseDown={(e) => handleRotationMouseDown(e, image.id)}
                                                        className={`w-5 h-5 bg-white border-2 rounded-full cursor-[grab] active:cursor-[grabbing] shadow transition-colors ${isRotationSnapped ? 'border-green-500' : 'border-indigo-500'}`}
                                                    />
                                                    <button onMouseDown={(e) => e.stopPropagation()} onClick={() => handleQuickRotate(image.id, 90)} className="p-1.5 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Rotate right 90 degrees">
                                                        <IconRotateRight className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'tl')} className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-10 shadow"></div>
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'tr')} className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-10 shadow"></div>
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'bl')} className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nesw-resize z-10 shadow"></div>
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, image.id, 'br')} className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-10 shadow"></div>
                                            </>
                                        )}
                                    </div>
                                )})}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    {paths.map((path) => {
                                        const pathData = path.points.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                        return (
                                            <g key={path.id} onMouseDown={(e) => handlePathMouseDown(e, path.id)} style={{ pointerEvents: activeTool === 'select' || activeTool === 'draw' ? 'auto' : 'none' }}>
                                                <path
                                                    d={pathData}
                                                    stroke="transparent"
                                                    strokeWidth={path.size + 12}
                                                    fill="none"
                                                    className={activeTool === 'select' || activeTool === 'draw' ? 'cursor-move' : ''}
                                                />
                                                <path
                                                    d={pathData}
                                                    stroke={path.color}
                                                    strokeWidth={path.size}
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                                {selectedPathId && (() => {
                                    const selectedPath = paths.find(p => p.id === selectedPathId);
                                    if (!selectedPath) return null;
                                    const bbox = getPathBoundingBox(selectedPath);
                                    if (!bbox) return null;
                                    const padding = selectedPath.size;
                                    
                                    return (
                                        <div 
                                            className="absolute select-none pointer-events-none outline outline-2 outline-indigo-500 rounded-lg" 
                                            style={{ 
                                                left: bbox.x - padding, 
                                                top: bbox.y - padding, 
                                                width: bbox.width + padding * 2, 
                                                height: bbox.height + padding * 2 
                                            }}
                                        >
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
                                                <button onClick={() => handleDeletePath(selectedPathId)} className="p-1.5 bg-white text-slate-600 hover:bg-red-500 hover:text-white rounded-full shadow-md transition-colors" aria-label="Delete drawing">
                                                    <IconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {drawingAnnotation && drawingAnnotation.currentBox && (
                                    <div
                                        className={`absolute border-2 border-dashed ${annotationShape === 'circle' ? 'rounded-full' : ''}`}
                                        style={{
                                            left: drawingAnnotation.currentBox.x,
                                            top: drawingAnnotation.currentBox.y,
                                            width: drawingAnnotation.currentBox.width,
                                            height: drawingAnnotation.currentBox.height,
                                            borderColor: '#f59e0b',
                                            pointerEvents: 'none'
                                        }}
                                    />
                                )}
                                {annotations.map(ann => (
                                    <React.Fragment key={ann.id}>
                                        <div
                                            className={`absolute border-2 border-dashed ${ann.shape === 'circle' ? 'rounded-full' : ''}`}
                                            style={{
                                                left: ann.box.x,
                                                top: ann.box.y,
                                                width: ann.box.width,
                                                height: ann.box.height,
                                                borderColor: '#f59e0b', // amber-500
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            <div className="absolute -top-6 left-0 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                                {ann.label}
                                            </div>
                                        </div>
                                        <div
                                            className="absolute flex items-center gap-2 z-10"
                                            style={{
                                                left: ann.box.x + ann.box.width + 10,
                                                top: ann.box.y,
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={ann.text}
                                                onChange={(e) => handleAnnotationTextChange(ann.id, e.target.value)}
                                                className="p-2 bg-white/60 backdrop-blur-lg border border-white/40 shadow-lg rounded-xl text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                                placeholder={`Describe change for ${ann.label}...`}
                                                onClick={e => e.stopPropagation()}
                                                onMouseDown={e => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={() => handleDeleteAnnotation(ann.id)}
                                                className="p-2 bg-white/60 backdrop-blur-lg border border-white/40 shadow-lg rounded-full text-slate-500 hover:bg-red-500/20 hover:text-red-600 transition-colors"
                                                onMouseDown={e => e.stopPropagation()}
                                            >
                                                <IconX />
                                            </button>
                                        </div>
                                    </React.Fragment>
                                ))}


                                {cropState && (() => {
                                    const image = images.find(img => img.id === cropState.imageId);
                                    if (!image) return null;
                                    const CROP_HANDLE_SIZE = 12;
                                    return (
                                        <div className="absolute inset-0 z-20" onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp} onMouseLeave={handleCropMouseUp}>
                                            <img src={image.src} className="absolute opacity-50 pointer-events-none" style={{ left: image.x, top: image.y, width: image.width, height: image.height }} />
                                            <div
                                                className="absolute cursor-move"
                                                style={{
                                                    left: cropState.box.x, top: cropState.box.y, width: cropState.box.width, height: cropState.box.height,
                                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                                                }}
                                                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                                            >
                                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                                    {[...Array(9)].map((_, i) => <div key={i} className="border border-white/30 border-dashed" style={{borderRightStyle: (i+1)%3 === 0 ? 'none' : 'dashed', borderBottomStyle: i > 5 ? 'none' : 'dashed'}}></div>)}
                                                </div>
                                                
                                                {/* Corner Handles */}
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'tl')} style={{top: -CROP_HANDLE_SIZE/2, left: -CROP_HANDLE_SIZE/2, width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-nwse-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'tr')} style={{top: -CROP_HANDLE_SIZE/2, right: -CROP_HANDLE_SIZE/2, width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-nesw-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'bl')} style={{bottom: -CROP_HANDLE_SIZE/2, left: -CROP_HANDLE_SIZE/2, width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-nesw-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'br')} style={{bottom: -CROP_HANDLE_SIZE/2, right: -CROP_HANDLE_SIZE/2, width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-nwse-resize border-2 border-slate-400"></div>
                                                
                                                {/* Edge Handles */}
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 't')} style={{top: -CROP_HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-ns-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'b')} style={{bottom: -CROP_HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-ns-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'l')} style={{left: -CROP_HANDLE_SIZE/2, top: '50%', transform: 'translateY(-50%)', width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-ew-resize border-2 border-slate-400"></div>
                                                <div onMouseDown={(e) => handleCropMouseDown(e, 'r')} style={{right: -CROP_HANDLE_SIZE/2, top: '50%', transform: 'translateY(-50%)', width: CROP_HANDLE_SIZE, height: CROP_HANDLE_SIZE}} className="absolute bg-white rounded-full cursor-ew-resize border-2 border-slate-400"></div>

                                                <div className="absolute -bottom-14 left-0 flex gap-2">
                                                    <Button onClick={handleConfirmCrop} primary className="!px-4 !py-2">Confirm Crop</Button>
                                                    <Button onClick={() => setCropState(null)} className="!px-4 !py-2">Cancel</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </>
                    </div>
                </main>
                <MyDesignsSidebar 
                    generationHistory={generationHistory}
                    onDownload={onDownload}
                    setFullScreenImage={setFullScreenImage}
                    onImageDragStart={handleResultImageDragStart}
                    onDelete={handleDelete}
                />
            </div>
        </>
    );
};
