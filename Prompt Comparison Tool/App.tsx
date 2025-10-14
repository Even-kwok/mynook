
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GeneratedImage, PhotoPreset, StylePreset, PresetType, AnyPreset, GlobalPreset, GeneratedImageStatus } from './types';
import { toBase64, cropImage } from './utils/imageUtils';
import { generateImage, extractPromptFromImage } from './services/geminiService';
import { Button } from './components/Button';
import { IconUpload, IconSparkles, IconOptions, IconDownload, IconCamera, IconSave, IconFolderOpen, IconTrash, IconX, IconPlus } from './components/Icons';


// --- Helper Components defined outside App ---

const PhotoDisplay: React.FC<{
    era: string;
    prompt: string;
    imageUrl: string;
    onDownload: (imageUrl: string, era: string) => void;
    onRegenerate: () => void;
    onImageClick: (imageUrl: string) => void;
}> = ({ era, prompt, imageUrl, onDownload, onRegenerate, onImageClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopyPrompt = useCallback(() => {
        if (!prompt) return;
        navigator.clipboard.writeText(prompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy prompt: ', err);
        });
    }, [prompt]);

    const containerClass = 'relative group bg-white rounded-2xl shadow-md border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1';
    
    const imageContainerClass = 'rounded-t-2xl overflow-hidden cursor-pointer';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={containerClass}
        >
            <div className={`${imageContainerClass} aspect-square`} onClick={() => onImageClick(imageUrl)}>
                <img src={imageUrl} alt={`You in ${era}`} className="w-full h-full object-cover" />
            </div>
            
             <div className="flex items-start justify-between mt-4 px-5 pb-5">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-800">{era}</p>
                  <button
                    onClick={handleCopyPrompt}
                    title="Copy Prompt"
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors mt-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
                </div>
                
            </div>

            <div className="absolute top-4 right-4 z-10" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full bg-white/60 text-gray-700 hover:bg-white/90 transition-colors backdrop-blur-sm shadow-md"
                    aria-label="Options"
                >
                    <IconOptions />
                </button>

                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-12 mt-2 w-48 origin-top-right bg-white/80 backdrop-blur-md rounded-xl shadow-2xl ring-1 ring-black/5 text-gray-800 text-sm flex flex-col p-2"
                    >
                        <button onClick={() => { onRegenerate(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-blue-500/10 rounded-md transition-colors">Regenerate</button>
                        <button onClick={() => { onDownload(imageUrl, era); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-blue-500/10 rounded-md transition-colors">Download</button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

const SkeletonLoader: React.FC<{className: string}> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 ${className}`}></div>
);

const LoadingCard: React.FC<{era: string}> = ({ era }) => {
    return (
        <div className="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <SkeletonLoader className="aspect-square" />
            <div className="p-5">
                <SkeletonLoader className="h-5 w-3/4 rounded-md" />
                 <SkeletonLoader className="h-4 w-1/2 rounded-md mt-2" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        </div>
    );
};

const ErrorCard: React.FC<{
    era: string; 
    onRegenerate?: () => void;
}> = ({ era, onRegenerate }) => {
    return (
        <div
            className="relative transition-all duration-500 ease-in-out group bg-white rounded-2xl shadow-md border border-gray-100"
        >
            <div 
                className="flex flex-col items-center justify-center text-center p-4 rounded-t-2xl bg-red-50 border-2 border-dashed border-red-200 aspect-square"
            >
                <p className="text-red-600 font-semibold mb-4">Generation failed</p>
                {onRegenerate && (
                    <Button onClick={onRegenerate} primary>
                        Retry
                    </Button>
                )}
            </div>
            <p className="text-center mt-4 mb-5 text-base font-semibold text-gray-800 px-5">{era}</p>
        </div>
    );
};

const EmptyCard: React.FC<{era: string}> = ({ era }) => {
    return (
        <div className="relative bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-t-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Empty Prompt</p>
            </div>
            <p className="text-center mt-4 mb-5 text-base font-semibold text-gray-500 px-5">{era}</p>
        </div>
    );
};

const ErrorNotification: React.FC<{message: string | null; onDismiss: () => void}> = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-md p-4 bg-white/90 backdrop-blur-lg border border-gray-200 text-gray-800 rounded-xl shadow-lg flex items-center justify-between animate-fade-in-down" style={{transform: 'translateX(-50%)'}}>
            <span>{message}</span>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-gray-200 transition-colors ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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

        return () => {
            stopCamera();
        };
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

    const handleRetake = () => {
        setCapturedImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl w-full max-w-2xl text-center relative"
             >
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Camera</h3>
                <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden relative mb-6 flex items-center justify-center">
                    {cameraError ? (
                        <div className="p-4 text-red-500">{cameraError}</div>
                    ) : (
                        <>
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                            )}
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
                         <button onClick={handleCapture} disabled={!!cameraError} className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"></button>
                    )}
                </div>
                
                <button onClick={() => { setCapturedImage(null); onClose(); }} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                     <IconX />
                </button>
                <canvas ref={canvasRef} className="hidden"></canvas>
            </motion.div>
        </div>
    );
};

const ImageViewerModal: React.FC<{
    imageUrl: string | null;
    onClose: () => void;
}> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative"
                onClick={(e) => e.stopPropagation()} 
            >
                <img src={imageUrl} alt="Full screen view" className="block max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                <button 
                    onClick={onClose} 
                    className="absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-gray-200 transition-colors border border-gray-200"
                    aria-label="Close image viewer"
                >
                    <IconX />
                </button>
            </motion.div>
        </div>
    );
};


const getModelInstruction = (promptBase: string): string => {
    const trimmedPrompt = promptBase.trim();
    if (!trimmedPrompt) return "";

    const promptStartIndex = trimmedPrompt.indexOf('---[ 提示词开始 / PROMPT START ]---');

    // If the prompt from the textarea contains a full MyNook prompt, extract and use it.
    if (promptStartIndex !== -1) {
        const fullPrompt = trimmedPrompt.substring(promptStartIndex);
        // The placeholder might still be there if the user manually edits, so remove it.
        return fullPrompt.replace('[INSERT SPECIFIC STYLE, MATERIAL, FURNITURE, DECOR, AND SCENE DETAILS HERE]', '');
    }

    // Otherwise, it's just a style description. Wrap it in the full template.
    const styleDescription = trimmedPrompt;
    const masterPrompt = `---[ 提示词开始 / PROMPT START ]---
Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.

${styleDescription}

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`;

    return masterPrompt;
};


// --- Main App Component ---

const App: React.FC = () => {
    // Core state
    const [uploadedImages, setUploadedImages] = useState<(string | null)[]>(Array(10).fill(null));
    const [extractorImages, setExtractorImages] = useState<(string | null)[]>(Array(18).fill(null));
    const [isExtracting, setIsExtracting] = useState(false);
    const [isUploadingExtractor, setIsUploadingExtractor] = useState(false);
    const [extractorPrompt, setExtractorPrompt] = useState<string>(`Your task is to analyze the provided image and generate a two-part response.

1.  **Style Name:** On the very first line, write a short, descriptive name for the design style (e.g., "Scandinavian Minimalist", "Modern Farmhouse").
2.  **Full Prompt:** On the next line, provide the complete, filled-in "MyNook" prompt template. To do this, create a single, detailed sentence describing the image's style, materials, furniture, and atmosphere, and insert it into the \`[INSERT ...]\` placeholder.

**Example Output Format:**
Contemporary Minimalist Living Room
---[ 提示词开始 / PROMPT START ]---
... (full template with the detailed sentence filled in) ...
---[ 提示词结束 / PROMPT END ]---

**Your final response must strictly follow this format.**

---
**TEMPLATE TO FILL:**

---[ 提示词开始 / PROMPT START ]---
Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.

[INSERT SPECIFIC STYLE, MATERIAL, FURNITURE, DECOR, AND SCENE DETAILS HERE]

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`);

    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloadingAlbum, setIsDownloadingAlbum] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const extractorFileInputRef = useRef<HTMLInputElement>(null);
    const uploadTargetIndexRef = useRef<number | null>(null);

    const [uploadingSlots, setUploadingSlots] = useState<Record<number, boolean>>({});
    const [cameraTargetIndex, setCameraTargetIndex] = useState<number | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    const resultsRef = useRef<HTMLDivElement>(null);
    const promptsRef = useRef<HTMLDivElement>(null);

    // Headshot-specific state
    const [userPrompts, setUserPrompts] = useState<string[]>(Array(3).fill(''));
    

    // Preset state
    const [globalPresets, setGlobalPresets] = useState<GlobalPreset[]>([]);
    const [photoPresets, setPhotoPresets] = useState<PhotoPreset[]>([]);
    const [stylePresets, setStylePresets] = useState<StylePreset[]>([]);
    
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [activePresetType, setActivePresetType] = useState<PresetType | null>(null);

    const primaryImage = useMemo(() => uploadedImages[0], [uploadedImages]);

    // --- Preset Management ---

    const usePresetStorage = <T extends AnyPreset>(
        key: string, 
        stateSetter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        useEffect(() => {
            try {
                const savedJSON = localStorage.getItem(key);
                if (savedJSON) {
                    stateSetter(JSON.parse(savedJSON));
                }
            } catch (error) {
                console.error(`Failed to load presets from ${key}:`, error);
                localStorage.removeItem(key);
            }
        }, [key, stateSetter]);
    };

    usePresetStorage('pictureMeGlobalPresets', setGlobalPresets);
    usePresetStorage('pictureMePhotoPresets', setPhotoPresets);
    usePresetStorage('pictureMeStylePresets', setStylePresets);
    
    useEffect(() => {
      try { localStorage.setItem('pictureMeGlobalPresets', JSON.stringify(globalPresets)); } catch (e) { console.error(e); }
    }, [globalPresets]);
    useEffect(() => {
      try { localStorage.setItem('pictureMePhotoPresets', JSON.stringify(photoPresets)); } catch (e) { console.error(e); }
    }, [photoPresets]);
    useEffect(() => {
      try { localStorage.setItem('pictureMeStylePresets', JSON.stringify(stylePresets)); } catch (e) { console.error(e); }
    }, [stylePresets]);

    const activePromptsCount = useMemo(() => userPrompts.filter(p => p.trim() !== '').length, [userPrompts]);
    const activeExtractorImagesCount = useMemo(() => extractorImages.filter(p => p !== null).length, [extractorImages]);

    const handleOpenSaveModal = (type: PresetType) => {
        if ((type === 'photo' || type === 'global') && !primaryImage) {
            setError("Please upload a primary photo before saving a preset.");
            return;
        }
        if ((type === 'style' || type === 'global') && activePromptsCount === 0) {
            setError("Please enter at least one style before saving.");
            return;
        }
        setActivePresetType(type);
        setNewPresetName('');
        setIsSaveModalOpen(true);
    };

    const handleOpenLoadModal = (type: PresetType) => {
        setActivePresetType(type);
        setIsLoadModalOpen(true);
    };

    const handleSavePreset = () => {
        if (newPresetName.trim() === '') {
            setError("Please enter a name for your preset.");
            return;
        }

        const basePreset = { id: new Date().toISOString(), name: newPresetName };

        switch (activePresetType) {
            case 'global':
                if (!primaryImage || activePromptsCount === 0) return;
                setGlobalPresets(prev => [...prev, { ...basePreset, uploadedImages, userPrompts }]);
                break;
            case 'photo':
                if (!primaryImage) return;
                setPhotoPresets(prev => [...prev, { ...basePreset, uploadedImages }]);
                break;
            case 'style':
                if (activePromptsCount === 0) return;
                setStylePresets(prev => [...prev, { ...basePreset, userPrompts }]);
                break;
        }

        setIsSaveModalOpen(false);
        setError(null);
    };

    const handleLoadPreset = (preset: AnyPreset) => {
        const loadImages = (images: (string | null)[]) => {
             const loaded = images || [];
             const finalImages = [...loaded, ...Array(10 - loaded.length).fill(null)].slice(0, 10);
             setUploadedImages(finalImages);
        };
        
        switch (activePresetType) {
            case 'global':
                const globalPreset = preset as GlobalPreset;
                loadImages(globalPreset.uploadedImages);
                const loadedGlobalPrompts = globalPreset.userPrompts || [];
                setUserPrompts(loadedGlobalPrompts.length > 0 ? loadedGlobalPrompts : Array(3).fill(''));
                setGeneratedImages([]);
                break;
            case 'photo':
                loadImages((preset as PhotoPreset).uploadedImages);
                setGeneratedImages([]);
                break;
            case 'style':
                const loadedStylePrompts = (preset as StylePreset).userPrompts || [];
                setUserPrompts(loadedStylePrompts.length > 0 ? loadedStylePrompts : Array(3).fill(''));
                break;
        }
        setError(null);
        setIsLoadModalOpen(false);
    };

    const handleDeletePreset = (presetId: string) => {
        switch (activePresetType) {
            case 'global':
                setGlobalPresets(prev => prev.filter(p => p.id !== presetId));
                break;
            case 'photo':
                setPhotoPresets(prev => prev.filter(p => p.id !== presetId));
                break;
            case 'style':
                setStylePresets(prev => prev.filter(p => p.id !== presetId));
                break;
        }
    };

    const presetsForActiveType = useMemo(() => {
        switch (activePresetType) {
            case 'global': return globalPresets;
            case 'photo': return photoPresets;
            case 'style': return stylePresets;
            default: return [];
        }
    }, [activePresetType, globalPresets, photoPresets, stylePresets]);

    const modalTitle = useMemo(() => {
        switch (activePresetType) {
            case 'global': return "Project";
            case 'photo': return "Image";
            case 'style': return "Prompt";
            default: return "";
        }
    }, [activePresetType]);
    
    // --- Image Handling ---
    
    const handleFileSelect = (index: number) => {
        uploadTargetIndexRef.current = index;
        fileInputRef.current?.click();
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uploadTargetIndexRef.current === null) return;
        const index = uploadTargetIndexRef.current;
        const file = event.target.files?.[0];

        if (file) {
            setUploadingSlots(prev => ({ ...prev, [index]: true }));
            setError(null);
            try {
                const base64Image = await toBase64(file);
                const croppedImage = await cropImage(base64Image, '1:1');
                setUploadedImages(prev => {
                    const newImages = [...prev];
                    newImages[index] = croppedImage;
                    return newImages;
                });
                if (index === 0) {
                   setGeneratedImages([]); 
                }
            } catch (err) {
                console.error("Error during image upload:", err);
                setError("That image couldn't be processed. Please try another file.");
            } finally {
                setUploadingSlots(prev => ({ ...prev, [index]: false }));
                uploadTargetIndexRef.current = null;
                 if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };
    
    const handleExtractorImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
    
        const currentImageCount = extractorImages.filter(img => img !== null).length;
        const availableSlots = 18 - currentImageCount;
    
        if (availableSlots <= 0) {
            setError("You have reached the maximum of 18 images.");
            return;
        }
    
        const filesToProcess = Array.from(files).slice(0, availableSlots);
        
        if (files.length > availableSlots) {
            setError(`You can only add ${availableSlots} more images. ${filesToProcess.length} have been added.`);
        } else {
            setError(null);
        }
    
        setIsUploadingExtractor(true);
    
        try {
            const processingPromises = filesToProcess.map(file => 
                toBase64(file).then(base64 => cropImage(base64, '1:1'))
            );
    
            const newImages = await Promise.all(processingPromises);
    
            setExtractorImages(prev => {
                const updatedImages = [...prev];
                let newImageIndex = 0;
                for (let i = 0; i < updatedImages.length && newImageIndex < newImages.length; i++) {
                    if (updatedImages[i] === null) {
                        updatedImages[i] = newImages[newImageIndex];
                        newImageIndex++;
                    }
                }
                return updatedImages;
            });
    
        } catch (err) {
            console.error("Error during extractor image upload:", err);
            setError("Some images couldn't be processed. Please try again.");
        } finally {
            setIsUploadingExtractor(false);
            if (extractorFileInputRef.current) {
                extractorFileInputRef.current.value = "";
            }
        }
    };
    
    const handleCaptureConfirm = async (imageDataUrl: string) => {
        if (cameraTargetIndex === null) return;
        const index = cameraTargetIndex;
        
        try {
            const croppedImage = await cropImage(imageDataUrl, '1:1');
            setUploadedImages(prev => {
                const newImages = [...prev];
                newImages[index] = croppedImage;
                return newImages;
            });
            
            if (index === 0) {
                setGeneratedImages([]);
            }
            setError(null);
        } catch (err) {
            console.error("Error cropping captured image:", err);
            setError("Could not process the captured photo. Please try again.");
        } finally {
            setCameraTargetIndex(null);
        }
    };

    const handleRemoveImage = (index: number) => {
        setUploadedImages(prev => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
        if (index === 0) {
           setGeneratedImages([]); 
        }
    };
    
    const handleRemoveExtractorImage = (index: number) => {
        setExtractorImages(prev => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
    };

    const handlePromptChange = (index: number, value: string) => {
        const newPrompts = [...userPrompts];
        newPrompts[index] = value;
        setUserPrompts(newPrompts);
    };
    
    const handleAddPrompt = () => {
        if (userPrompts.length < 18) {
            setUserPrompts(prev => [...prev, '']);
        }
    };

    const handleRemovePrompt = (indexToRemove: number) => {
        if (userPrompts.length > 1) {
            setUserPrompts(prev => prev.filter((_, index) => index !== indexToRemove));
        }
    };

    // --- Prompt Extraction ---
    const handleExtractPrompts = async () => {
        const imagesToProcess = extractorImages.filter((img): img is string => img !== null);
        if (imagesToProcess.length === 0) {
            setError("Please upload at least one image to extract prompts from.");
            return;
        }

        setIsExtracting(true);
        setError(null);

        const extractionPromises = imagesToProcess.map(img =>
            extractPromptFromImage(img.split(',')[1], extractorPrompt)
        );

        const results = await Promise.allSettled(extractionPromises);
        
        const successfulPrompts = results
            .filter((res): res is PromiseFulfilledResult<string> => res.status === 'fulfilled' && !!res.value)
            .map(res => res.value.trim());
        
        const failedCount = results.length - successfulPrompts.length;
        if (failedCount > 0) {
            setError(`${failedCount} prompt(s) could not be extracted. Please try again.`);
        }

        if (successfulPrompts.length > 0) {
            const currentValidPrompts = userPrompts.filter(p => p.trim() !== '');
            let combinedPrompts = [...currentValidPrompts, ...successfulPrompts];
            
            if (combinedPrompts.length < 3) {
                combinedPrompts.push(...Array(3 - combinedPrompts.length).fill(''));
            }
            
            setUserPrompts(combinedPrompts.slice(0, 18));
            
            setTimeout(() => {
                promptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
        setIsExtracting(false);
        setExtractorImages(Array(18).fill(null));
    };
    
    const handleExportPrompts = () => {
        const promptsToExport = userPrompts.filter(p => p.trim() !== '');
        if (promptsToExport.length === 0) {
            setError("No prompts to export.");
            return;
        }

        const fileContent = promptsToExport.join('\n\n---\n\n');
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'prompts-export.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    // --- Generation & Regeneration ---

    const handleGenerateClick = async () => {
        if (!primaryImage) {
            setError("Please upload a primary image to get started!");
            return;
        }
        if (activePromptsCount === 0) {
            setError("Please enter at least one prompt to generate.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        const primary = uploadedImages[0];
        const references = uploadedImages.slice(1).filter((img): img is string => img !== null);
        const orderedImages = [...references];
        if (primary) {
            orderedImages.push(primary);
        }
        const imagesForApi = orderedImages.map(img => img.split(',')[1]);

        const newGeneratedImages = userPrompts.map((prompt, index) => {
            const trimmedPrompt = prompt.trim();
            
            let displayName = `Prompt ${index + 1}`;
            const lines = trimmedPrompt.split('\n');
            if (lines.length > 1 && lines[1].trim().startsWith('---[ 提示词开始')) {
                displayName = lines[0].trim();
            }
    
            if (trimmedPrompt === '') {
                return { id: displayName, status: 'empty' as GeneratedImageStatus, imageUrl: null, promptBase: '' };
            }
            
            return { id: displayName, status: 'pending' as GeneratedImageStatus, imageUrl: null, promptBase: trimmedPrompt };
        });

        setGeneratedImages(newGeneratedImages);
        
        const generationTasks = newGeneratedImages
            .map((image, index) => ({ ...image, originalIndex: index }))
            .filter(task => task.status === 'pending');
        
        if (generationTasks.length === 0) {
            setIsLoading(false);
            return;
        }

        const generationPromises = generationTasks.map((task) => (async () => {
            try {
                const modelInstruction = getModelInstruction(task.promptBase);
                
                const imageUrl = await generateImage(modelInstruction, imagesForApi);
    
                setGeneratedImages(prev => {
                    const updated = [...prev];
                    if (updated[task.originalIndex]) {
                       updated[task.originalIndex] = { ...updated[task.originalIndex], status: 'success', imageUrl };
                    }
                    return updated;
                });
    
            } catch (err) {
                console.error(`Generation failed for prompt at index ${task.originalIndex}:`, err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Oops! Generation for "${task.id}" failed. ${errorMessage}`);
                setGeneratedImages(prev => {
                    const updated = [...prev];
                    if (updated[task.originalIndex]) {
                        updated[task.originalIndex] = { ...updated[task.originalIndex], status: 'failed' };
                    }
                    return updated;
                });
            }
        })());
        
        await Promise.all(generationPromises);
        setIsLoading(false);
    };

    const regenerateImageAtIndex = async (imageIndex: number) => {
        const imageToRegenerate = generatedImages[imageIndex];
        if (!imageToRegenerate || !primaryImage) return;
    
        setGeneratedImages(prev => prev.map((img, index) =>
            index === imageIndex ? { ...img, status: 'pending' } : img
        ));
        setError(null);
    
        const promptBase = imageToRegenerate.promptBase;
        if (!promptBase) {
            setError("Could not find the prompt to regenerate.");
            setGeneratedImages(prev => prev.map((img, index) => index === imageIndex ? { ...img, status: 'failed' } : img));
            return;
        }

        const primary = uploadedImages[0];
        const references = uploadedImages.slice(1).filter((img): img is string => img !== null);
        const orderedImages = [...references];
        if (primary) {
            orderedImages.push(primary);
        }
        const imagesForApi = orderedImages.map(img => img.split(',')[1]);

        if (imagesForApi.length === 0) {
            setError("Cannot regenerate without any uploaded images.");
            setGeneratedImages(prev => prev.map((img, index) => index === imageIndex ? { ...img, status: 'failed' } : img));
            return;
        }
    
        try {
            const modelInstruction = getModelInstruction(promptBase);
            
            const imageUrl = await generateImage(modelInstruction, imagesForApi);
    
            setGeneratedImages(prev => prev.map((img, index) =>
                index === imageIndex ? { ...img, status: 'success', imageUrl } : img
            ));
    
        } catch (err) {
            console.error(`Regeneration failed for ${imageToRegenerate.id}:`, err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Oops! Regeneration for "${imageToRegenerate.id}" failed. ${errorMessage}`);
            setGeneratedImages(prev => prev.map((img, index) =>
                index === imageIndex ? { ...img, status: 'failed' } : img
            ));
        }
    };

    // --- Downloading ---

    const triggerDownload = async (href: string, fileName: string) => {
        try {
            const link = document.createElement('a');
            link.href = href;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Could not download the image:", error);
            setError("Sorry, the download failed. Please try again.");
        }
    };

    const handleDownloadRequest = async (imageUrl: string, era: string) => {
        const fileName = `prompt-comparison-${era.toLowerCase().replace(/\s+/g, '-')}-1x1.png`;
        try {
            const croppedImageUrl = await cropImage(imageUrl, '1:1');
            await triggerDownload(croppedImageUrl, fileName);
        } catch (err) {
            console.error(`Failed to create cropped image for download:`, err);
            setError(`Could not prepare that image for download. Please try again.`);
        }
    };
    
    const handleSaveAllClick = async () => {
        if (isSavingAll) return;
        
        const successfulImages = generatedImages.filter(img => img.status === 'success' && img.imageUrl);
        if (successfulImages.length === 0) {
            setError("There are no successful images to save.");
            return;
        }

        setIsSavingAll(true);
        setError(`Preparing to download ${successfulImages.length} images...`);

        try {
            for (let i = 0; i < successfulImages.length; i++) {
                const img = successfulImages[i];
                setError(`Downloading image ${i + 1} of ${successfulImages.length}: "${img.id}"`);
                await handleDownloadRequest(img.imageUrl!, img.id);
                
                if (i < successfulImages.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            setError("All images have been saved successfully!");
            setTimeout(() => setError(null), 4000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Failed to save all images:", err);
            setError(`Sorry, saving all images failed. ${errorMessage}`);
        } finally {
            setIsSavingAll(false);
        }
    };

    const handleAlbumDownloadRequest = async () => {
        if (isDownloadingAlbum) return;
        setIsDownloadingAlbum(true);
        setError(null);

        try {
            const successfulImages = generatedImages.filter(img => img.status === 'success' && img.imageUrl);
            if (successfulImages.length === 0) {
                throw new Error("There are no successful images to include in an album.");
            }

            const croppedImageUrls = await Promise.all(
                successfulImages.map(img => cropImage(img.imageUrl!, '1:1'))
            );

            const imagesToStitch: HTMLImageElement[] = await Promise.all(
                croppedImageUrls.map((url) => new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = url;
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                }))
            );

            if (imagesToStitch.length === 0) throw new Error("No images to create an album.");
            
            const stitchCanvas = document.createElement('canvas');
            const stitchCtx = stitchCanvas.getContext('2d');
            if(!stitchCtx) throw new Error("No stitch context");

            const cols = imagesToStitch.length > 4 ? 3 : 2;
            const rows = Math.ceil(imagesToStitch.length / cols);
            const imageWidth = imagesToStitch[0].width;
            const imageHeight = imagesToStitch[0].height;
            const padding = Math.floor(imageWidth * 0.05);

            stitchCanvas.width = (cols * imageWidth) + ((cols + 1) * padding);
            stitchCanvas.height = (rows * imageHeight) + ((rows + 1) * padding);
            
            stitchCtx.fillStyle = '#FFFFFF';
            stitchCtx.fillRect(0, 0, stitchCanvas.width, stitchCanvas.height);

            imagesToStitch.forEach((img, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                stitchCtx.drawImage(img, padding + col * (imageWidth + padding), padding + row * (imageHeight + padding), imageWidth, imageHeight);
            });
            
            await triggerDownload(stitchCanvas.toDataURL('image/png'), `prompt-comparison-album-1x1.png`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Failed to create or download album:", err);
            setError(`Sorry, the album download failed. ${errorMessage}`);
        } finally {
            setIsDownloadingAlbum(false);
        }
    };
    
    const handleStartOver = () => {
        setGeneratedImages([]);
        setError(null);
        setUploadedImages(Array(10).fill(null));
        setExtractorImages(Array(18).fill(null));
        setUserPrompts(Array(3).fill(''));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Sub-components ---
    const AlbumDownloadButton: React.FC = () => {
        return (
             <div className="relative">
                <Button primary disabled={isDownloadingAlbum} onClick={handleAlbumDownloadRequest}>
                    {isDownloadingAlbum ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Preparing...</span>
                        </div>
                    ) : (
                         <div className="flex items-center gap-2">
                            <IconDownload />
                            <span>Download Album</span>
                        </div>
                    )}
                </Button>
            </div>
        );
    };

    const hasGeneratedImages = generatedImages.length > 0;
    const hasSuccessfulImages = generatedImages.some(img => img.status === 'success');
    const progress = generatedImages.length > 0
        ? (generatedImages.filter(img => img.status !== 'pending').length / generatedImages.length) * 100
        : 0;
    const isAnySlotUploading = Object.values(uploadingSlots).some(Boolean);
    
    const Section: React.FC<{title: string, subtitle: string, children: React.ReactNode, presetType: PresetType, onSave: () => void, onLoad: () => void, saveDisabled: boolean, loadDisabled: boolean, onExport?: () => void, exportDisabled?: boolean}> = ({ title, subtitle, children, presetType, onSave, onLoad, saveDisabled, loadDisabled, onExport, exportDisabled }) => (
        <div className="space-y-6">
             <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
                    <p className="text-gray-500 mt-1">{subtitle}</p>
                </div>
                {presetType !== 'global' &&
                  <div className="flex items-center gap-2 text-gray-500">
                      <button onClick={onSave} aria-label={`Save ${presetType} preset`} className="p-2 rounded-full hover:bg-gray-200 hover:text-blue-600 transition-colors" disabled={saveDisabled}><IconSave /></button>
                      <button onClick={onLoad} aria-label={`Load ${presetType} preset`} className="p-2 rounded-full hover:bg-gray-200 hover:text-blue-600 transition-colors" disabled={loadDisabled}><IconFolderOpen /></button>
                       {onExport && (
                          <button onClick={onExport} aria-label="Export prompts" className="p-2 rounded-full hover:bg-gray-200 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={exportDisabled}>
                              <IconDownload />
                          </button>
                      )}
                  </div>
                }
            </div>
            {children}
        </div>
    );

    return (
        <>
            <CameraModal
                isOpen={cameraTargetIndex !== null}
                onClose={() => setCameraTargetIndex(null)}
                onCapture={handleCaptureConfirm}
            />
            <ImageViewerModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            
            {/* Save Preset Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl w-full max-w-md"
                    >
                        <h3 className="text-2xl font-semibold mb-4 text-gray-900">Save {modalTitle} Preset</h3>
                        <p className="text-gray-500 mb-6">Save your current {modalTitle.toLowerCase()} settings for later use.</p>
                        <input 
                            type="text" 
                            value={newPresetName} 
                            onChange={e => setNewPresetName(e.target.value)} 
                            placeholder={`My Favorite ${modalTitle}`}
                            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 mb-6" 
                        />
                        <div className="flex justify-end gap-4">
                            <Button onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSavePreset} primary>Save</Button>
                        </div>
                    </motion.div>
                </div>
            )}
            
            {/* Load Preset Modal */}
            {isLoadModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-xl w-full max-w-lg relative"
                    >
                        <h3 className="text-2xl font-semibold mb-4 text-gray-900 px-2">Load {modalTitle} Preset</h3>
                        <button onClick={() => setIsLoadModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                            <IconX />
                        </button>
                        <div className="max-h-[60vh] overflow-y-auto space-y-3 p-2 mt-6">
                            {presetsForActiveType.length > 0 ? presetsForActiveType.map(preset => (
                                <div key={preset.id} className="bg-gray-100/80 p-3 rounded-lg flex items-center justify-between transition-colors hover:bg-gray-200/50">
                                    <span className="text-gray-700 font-medium truncate pr-4">{preset.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => handleDeletePreset(preset.id)} 
                                            className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-white/50"
                                            aria-label={`Delete preset ${preset.name}`}
                                        >
                                            <IconTrash />
                                        </button>
                                        <Button onClick={() => handleLoadPreset(preset)} className="px-5 py-2 text-sm">Load</Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-8">No saved {modalTitle} presets found.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 pb-20">
                 <ErrorNotification message={error} onDismiss={() => setError(null)} />
                
                <div className="w-full max-w-6xl mx-auto">
                    <header className="text-center my-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tighter">Prompt Comparison Tool</h1>
                        <p className="text-gray-500 text-lg mt-4 max-w-2xl mx-auto">Enter multiple prompts to generate images simultaneously and visually compare the results.</p>
                    </header>

                    <main>
                        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-100 mb-16">
                             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-gray-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Project Presets</h2>
                                    <p className="text-gray-500">Save or load your entire project configuration.</p>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <Button onClick={() => handleOpenSaveModal('global')} disabled={!primaryImage || activePromptsCount === 0}>
                                        <div className="flex items-center gap-2"><IconSave /><span>Save</span></div>
                                    </Button>
                                    <Button onClick={() => handleOpenLoadModal('global')} disabled={globalPresets.length === 0}>
                                        <div className="flex items-center gap-2"><IconFolderOpen /><span>Load</span></div>
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-16">
                               <Section 
                                  title="Your Images"
                                  subtitle="The first image will be the main reference for generation."
                                  presetType="photo"
                                  onSave={() => handleOpenSaveModal('photo')}
                                  onLoad={() => handleOpenLoadModal('photo')}
                                  saveDisabled={!primaryImage}
                                  loadDisabled={photoPresets.length === 0}
                               >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                        {/* Left Column: Photo Uploader */}
                                        <div>
                                            <div 
                                                className="w-full aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 overflow-hidden shadow-inner relative group"
                                                onClick={() => !primaryImage && handleFileSelect(0)}
                                            >
                                                {uploadingSlots[0] ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                                        <p className="text-gray-500 mt-4">Processing...</p>
                                                    </div>
                                                ) : primaryImage ? (
                                                    <>
                                                        <img src={primaryImage} alt="Uploaded preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                            <Button onClick={() => handleFileSelect(0)} className="px-6 py-3 text-sm">Replace</Button>
                                                            <button onClick={() => handleRemoveImage(0)} className="p-3 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"><IconTrash /></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
                                                        <IconUpload />
                                                        <p className="mt-4 text-lg text-gray-700 font-semibold">Upload Main Image</p>
                                                        <p className="mt-4 text-sm">or</p>
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCameraTargetIndex(0);
                                                            }}
                                                            className="mt-4"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <IconCamera />
                                                                <span>Use Camera</span>
                                                            </div>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                                        </div>
                                        
                                        {/* Right Column: Additional Photos */}
                                        <div>
                                             <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center lg:text-left">Other Reference Images</h3>
                                             <div className="grid grid-cols-3 gap-4">
                                                {Array.from({ length: 9 }).map((_, i) => {
                                                    const index = i + 1;
                                                    const imageUrl = uploadedImages[index];
                                                    const isUploading = uploadingSlots[index];

                                                    return (
                                                        <div 
                                                            key={index} 
                                                            className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 relative group cursor-pointer hover:border-blue-400/70 transition-colors"
                                                            onClick={() => !imageUrl && !isUploading && handleFileSelect(index)}
                                                        >
                                                            {isUploading ? (
                                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                            ) : imageUrl ? (
                                                               <>
                                                                    <img src={imageUrl} alt={`Reference ${index}`} className="w-full h-full object-cover rounded-xl" />
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                                                                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                        aria-label={`Remove image ${index}`}
                                                                    >
                                                                        <IconX />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center text-gray-400">
                                                                    <IconPlus />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                 </Section>
                                 
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Extract Prompts (Optional)</h2>
                                        <p className="text-gray-500 mt-1">Upload images and define a prompt to automatically generate new prompts.</p>
                                    </div>
                                     <textarea
                                        value={extractorPrompt}
                                        onChange={(e) => setExtractorPrompt(e.target.value)}
                                        placeholder="e.g., Describe this image for a text-to-image prompt..."
                                        className="w-full p-4 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                        rows={8}
                                        aria-label="Custom prompt for image extraction"
                                    />
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                                        {extractorImages.map((imageUrl, index) => {
                                            if (!imageUrl) return null;
                                            return (
                                                <div key={`extractor-${index}`} className="aspect-square bg-slate-50 rounded-xl relative group">
                                                    <img src={imageUrl} alt={`Extractor ref ${index}`} className="w-full h-full object-cover rounded-xl" />
                                                    <button 
                                                        onClick={() => handleRemoveExtractorImage(index)}
                                                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                        aria-label={`Remove extractor image ${index}`}
                                                    >
                                                        <IconX />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {activeExtractorImagesCount < 18 && (
                                            <div 
                                                className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 relative group cursor-pointer hover:border-blue-400/70 transition-colors"
                                                onClick={() => !isUploadingExtractor && extractorFileInputRef.current?.click()}
                                            >
                                                {isUploadingExtractor ? (
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400 text-center p-2">
                                                        <IconUpload />
                                                        <span className="text-xs mt-2 font-medium">Upload Images</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={extractorFileInputRef} 
                                        onChange={handleExtractorImageUpload} 
                                        accept="image/png, image/jpeg" 
                                        className="hidden"
                                        multiple
                                    />
                                    <div className="text-center pt-2">
                                         <Button
                                            onClick={handleExtractPrompts}
                                            disabled={activeExtractorImagesCount === 0 || isExtracting || isUploadingExtractor}
                                            primary
                                            className="text-md px-8 py-3"
                                         >
                                            <div className="flex items-center gap-3">
                                                {isExtracting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                        <span>Extracting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconSparkles className="w-5 h-5" />
                                                        Extract Prompts ({activeExtractorImagesCount})
                                                    </>
                                                )}
                                            </div>
                                         </Button>
                                    </div>
                                </div>


                                 <div ref={promptsRef}>
                                    <Section 
                                        title="Your Prompts"
                                        subtitle="Each prompt will generate a separate image. Up to 18 prompts are supported."
                                        presetType="style"
                                        onSave={() => handleOpenSaveModal('style')}
                                        onLoad={() => handleOpenLoadModal('style')}
                                        saveDisabled={activePromptsCount === 0}
                                        loadDisabled={stylePresets.length === 0}
                                        onExport={handleExportPrompts}
                                        exportDisabled={activePromptsCount === 0}
                                    >
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {userPrompts.map((prompt, index) => (
                                                <div key={index} className="relative group">
                                                    <textarea
                                                        value={prompt}
                                                        onChange={(e) => handlePromptChange(index, e.target.value)}
                                                        placeholder="Enter a prompt..."
                                                        className="w-full h-32 p-4 bg-slate-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                        aria-label={`Style prompt ${index + 1}`}
                                                    />
                                                    {userPrompts.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemovePrompt(index)}
                                                            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-black/20 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                            aria-label={`Remove style prompt ${index + 1}`}
                                                        >
                                                            <IconX />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {userPrompts.length < 18 && (
                                                <button
                                                    onClick={handleAddPrompt}
                                                    className="w-full h-32 p-3 bg-transparent border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                                    aria-label="Add new style prompt"
                                                >
                                                    <IconPlus />
                                                    <span className="mt-2 text-sm font-medium">Add Prompt</span>
                                                </button>
                                            )}
                                        </div>
                                    </Section>
                                </div>
                                 
                                <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                                     <Button
                                        onClick={handleGenerateClick}
                                        disabled={!primaryImage || activePromptsCount === 0 || isLoading || isAnySlotUploading || isExtracting}
                                        primary
                                        className="text-base px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                                     >
                                        <div className="flex items-center gap-3">
                                            {isLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                    {`Generating... (${Math.round(progress)}%)`}
                                                </>
                                            ) : (
                                                <>
                                                    <IconSparkles className="w-6 h-6" />
                                                    Generate Images ({activePromptsCount})
                                                </>
                                            )}
                                        </div>
                                     </Button>
                                </div>
                            </div>
                        </div>


                        <div ref={resultsRef}>
                            {hasGeneratedImages && (
                                <div className="mt-24">
                                    <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center tracking-tight">Results</h2>

                                    {isLoading && (
                                        <div className="w-full max-w-4xl mx-auto mb-8 text-center">
                                            <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                                                <motion.div
                                                    className="bg-blue-500 h-2.5 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <p className="text-gray-500 mt-4 text-sm">Generating images, please do not close this window.</p>
                                        </div>
                                    )}
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                                        {generatedImages.map((img, index) => {
                                            switch (img.status) {
                                                case 'success':
                                                    const fullPrompt = getModelInstruction(img.promptBase);
                                                    return <PhotoDisplay
                                                        key={`${img.id}-${index}-success`}
                                                        era={img.id}
                                                        prompt={fullPrompt}
                                                        imageUrl={img.imageUrl!}
                                                        onDownload={handleDownloadRequest}
                                                        onRegenerate={() => regenerateImageAtIndex(index)}
                                                        onImageClick={setFullScreenImage}
                                                    />;
                                                case 'failed':
                                                    return <ErrorCard
                                                        key={`${img.id}-${index}-failed`}
                                                        era={img.id}
                                                        onRegenerate={() => regenerateImageAtIndex(index)}
                                                    />;
                                                case 'empty':
                                                    return <EmptyCard
                                                        key={`${img.id}-${index}-empty`}
                                                        era={img.id}
                                                    />;
                                                case 'pending':
                                                default:
                                                    return <LoadingCard 
                                                        key={`${img.id}-${index}-pending`} 
                                                        era={img.id} 
                                                    />;
                                            }
                                        })}
                                    </div>
                                </div>
                            )}

                            {!isLoading && hasGeneratedImages && (
                                <div className="text-center mt-16 mb-12 flex flex-wrap justify-center gap-6">
                                    <Button onClick={() => handleStartOver()}>Start Over</Button>
                                    {hasSuccessfulImages && <AlbumDownloadButton />}
                                    {hasSuccessfulImages && 
                                        <Button onClick={handleSaveAllClick} disabled={isSavingAll}>
                                            {isSavingAll ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600"></div>
                                                    <span>Saving...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <IconDownload />
                                                    <span>Save All</span>
                                                </div>
                                            )}
                                        </Button>
                                    }
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;