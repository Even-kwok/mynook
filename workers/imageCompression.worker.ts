/**
 * Web Worker for Background Image Compression
 * Processes images in a separate thread to avoid blocking the UI
 */

interface CompressionMessage {
    type: 'compress';
    base64: string;
    maxSize: number;
    quality: number;
    format: 'jpeg' | 'png';
}

interface CompressionResponse {
    type: 'success' | 'error';
    base64?: string;
    error?: string;
}

// Worker message handler
self.onmessage = async (e: MessageEvent<CompressionMessage>) => {
    const { type, base64, maxSize, quality, format } = e.data;
    
    if (type === 'compress') {
        try {
            const compressed = await compressInWorker(base64, maxSize, quality, format);
            
            const response: CompressionResponse = {
                type: 'success',
                base64: compressed
            };
            
            self.postMessage(response);
        } catch (error) {
            const response: CompressionResponse = {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            self.postMessage(response);
        }
    }
};

/**
 * Compress image in worker context
 */
async function compressInWorker(
    base64: string,
    maxSize: number,
    quality: number,
    format: 'jpeg' | 'png'
): Promise<string> {
    // In worker context, we use OffscreenCanvas if available
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                let width = img.width;
                let height = img.height;
                
                // Scale down if necessary
                if (width > maxSize || height > maxSize) {
                    const scale = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                
                // Try to use OffscreenCanvas for better performance
                let canvas: HTMLCanvasElement | OffscreenCanvas;
                
                if (typeof OffscreenCanvas !== 'undefined') {
                    canvas = new OffscreenCanvas(width, height);
                } else {
                    // Fallback to regular canvas
                    canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                }
                
                const ctx = canvas.getContext('2d', {
                    alpha: format === 'png',
                    willReadFrequently: false
                });
                
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                // Enable high-quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to data URL
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                
                if (canvas instanceof OffscreenCanvas) {
                    // OffscreenCanvas path
                    canvas.convertToBlob({ type: mimeType, quality }).then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error('Failed to read blob'));
                        reader.readAsDataURL(blob);
                    }).catch(reject);
                } else {
                    // HTMLCanvasElement path
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    resolve(dataUrl);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image in worker'));
        img.src = base64;
    });
}

export {};

