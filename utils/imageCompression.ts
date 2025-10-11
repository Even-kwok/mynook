/**
 * Smart Image Compression Utility
 * Automatically selects optimal compression strategy based on file size
 * Inspired by Canvas and Canva best practices
 */

export interface CompressionConfig {
    maxSize: number;      // Maximum width/height in pixels
    quality: number;      // JPEG quality (0-1)
    format: 'jpeg' | 'png';
    label: string;        // For logging/debugging
}

export interface CompressionResult {
    base64: string;
    originalSize: number;
    compressedSize: number;
    reduction: number;    // Percentage reduced
    timeTaken: number;    // Milliseconds
    strategy: string;
}

/**
 * Compression strategies based on file size
 */
const COMPRESSION_STRATEGIES: Record<string, CompressionConfig> = {
    small: {
        maxSize: 2048,
        quality: 0.92,
        format: 'jpeg',
        label: 'Light compression (high quality)'
    },
    medium: {
        maxSize: 1536,
        quality: 0.88,
        format: 'jpeg',
        label: 'Balanced compression'
    },
    large: {
        maxSize: 1024,
        quality: 0.85,
        format: 'jpeg',
        label: 'Optimized compression'
    },
    xlarge: {
        maxSize: 768,
        quality: 0.80,
        format: 'jpeg',
        label: 'Aggressive compression (fast)'
    }
};

/**
 * Determine optimal compression strategy based on file size
 */
export function getCompressionStrategy(fileSize: number): CompressionConfig {
    const sizeMB = fileSize / (1024 * 1024);
    
    if (sizeMB < 0.5) {
        return COMPRESSION_STRATEGIES.small;
    } else if (sizeMB < 2) {
        return COMPRESSION_STRATEGIES.medium;
    } else if (sizeMB < 5) {
        return COMPRESSION_STRATEGIES.large;
    } else {
        return COMPRESSION_STRATEGIES.xlarge;
    }
}

/**
 * Get file size from base64 string
 */
export function getBase64Size(base64: string): number {
    // Remove data URL prefix if present
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    // Calculate size: base64 is ~33% larger than binary
    return (base64Data.length * 3) / 4;
}

/**
 * Smart compression: automatically selects best strategy
 */
export async function smartCompress(
    file: File,
    onProgress?: (message: string) => void
): Promise<CompressionResult> {
    const startTime = Date.now();
    const originalSize = file.size;
    
    // Select strategy
    const strategy = getCompressionStrategy(originalSize);
    
    if (onProgress) {
        onProgress(`Optimizing image... (${strategy.label})`);
    }
    
    console.log(`📦 Compressing ${(originalSize / 1024).toFixed(0)}KB image with strategy: ${strategy.label}`);
    
    try {
        // Read file
        const base64 = await readFileAsDataURL(file);
        
        // Compress
        const compressed = await compressBase64(base64, strategy);
        
        const compressedSize = getBase64Size(compressed);
        const reduction = ((1 - compressedSize / originalSize) * 100);
        const timeTaken = Date.now() - startTime;
        
        console.log(`✅ Compression complete: ${reduction.toFixed(0)}% smaller in ${timeTaken}ms`);
        
        if (onProgress) {
            onProgress(`Optimized! Reduced by ${reduction.toFixed(0)}%`);
        }
        
        return {
            base64: compressed,
            originalSize,
            compressedSize,
            reduction,
            timeTaken,
            strategy: strategy.label
        };
    } catch (error) {
        console.error('Compression error:', error);
        // Fallback: return original
        const base64 = await readFileAsDataURL(file);
        return {
            base64,
            originalSize,
            compressedSize: originalSize,
            reduction: 0,
            timeTaken: Date.now() - startTime,
            strategy: 'none (fallback)'
        };
    }
}

/**
 * Compress a base64 image with given strategy
 */
export async function compressBase64(
    base64: string,
    config: CompressionConfig
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                // Scale down if necessary
                if (width > config.maxSize || height > config.maxSize) {
                    const scale = Math.min(
                        config.maxSize / width,
                        config.maxSize / height
                    );
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d', {
                    alpha: config.format === 'png',
                    willReadFrequently: false
                });
                
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
                const compressed = canvas.toDataURL(mimeType, config.quality);
                
                // Clean up
                canvas.width = 0;
                canvas.height = 0;
                
                resolve(compressed);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        img.src = base64;
    });
}

/**
 * Read file as data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Compress specifically for generation API (fixed config)
 */
export async function compressForGeneration(base64: string): Promise<string> {
    const config: CompressionConfig = {
        maxSize: 1024,
        quality: 0.85,
        format: 'jpeg',
        label: 'Generation optimized'
    };
    
    return compressBase64(base64, config);
}

/**
 * Compress for preview/display (lighter, faster)
 */
export async function compressForPreview(base64: string): Promise<string> {
    const config: CompressionConfig = {
        maxSize: 768,
        quality: 0.75,
        format: 'jpeg',
        label: 'Preview optimized'
    };
    
    return compressBase64(base64, config);
}

/**
 * Check if browser supports OffscreenCanvas
 */
export function supportsOffscreenCanvas(): boolean {
    return typeof OffscreenCanvas !== 'undefined';
}

/**
 * Check if browser supports Web Workers
 */
export function supportsWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
}

/**
 * Compress image using Web Worker (non-blocking)
 * Falls back to main thread if Worker is not supported
 */
export async function compressInWorker(
    file: File,
    onProgress?: (message: string) => void
): Promise<CompressionResult> {
    const startTime = Date.now();
    const originalSize = file.size;

    // 对于小文件直接跳过压缩以避免不必要的失败
    const SMALL_FILE_THRESHOLD = 300 * 1024; // 300KB
    if (originalSize <= SMALL_FILE_THRESHOLD) {
        if (onProgress) {
            onProgress('Image is small, skipping compression...');
        }

        const base64 = await readFileAsDataURL(file);
        return {
            base64,
            originalSize,
            compressedSize: originalSize,
            reduction: 0,
            timeTaken: Date.now() - startTime,
            strategy: 'skipped (small file)'
        };
    }

    // Web Worker + OffscreenCanvas 在部分浏览器/iframe 中经常失败，直接回退主线程压缩更稳定
    if (!supportsWebWorkers() || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
        console.log('⚠️ Background compression not fully supported, using main thread compression');
        return smartCompress(file, onProgress);
    }

    // 即便环境支持，也暂时禁用 Worker 压缩以保证上传成功率
    console.log('ℹ️ Worker compression disabled for reliability, using main thread compression');
    return smartCompress(file, onProgress);
}

