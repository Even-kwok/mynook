



// --- PNG Metadata Embedding ---

// CRC32 Table for PNG chunk checksum calculation
const crc32Table = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    return table;
})();

// CRC32 calculation function
const crc32 = (bytes: Uint8Array): number => {
    let crc = -1;
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
};

/**
 * Embeds a text prompt into a PNG image's metadata.
 * @param dataUrl The base64 data URL of the PNG image.
 * @param prompt The prompt text to embed.
 * @returns A new base64 data URL of the PNG with the embedded prompt.
 */
export const embedPromptInImage = (dataUrl: string, prompt: string): string => {
    try {
        // 1. Decode base64 to byte array
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Create the tEXt chunk data
        const keyword = "prompt";
        const encoder = new TextEncoder();
        const keywordBytes = encoder.encode(keyword);
        const promptBytes = encoder.encode(prompt);
        const chunkData = new Uint8Array(keywordBytes.length + 1 + promptBytes.length);
        chunkData.set(keywordBytes, 0);
        chunkData.set([0], keywordBytes.length); // Null separator
        chunkData.set(promptBytes, keywordBytes.length + 1);

        const chunkType = new Uint8Array([116, 69, 88, 116]); // "tEXt"

        // 3. Create the full chunk (Length + Type + Data + CRC)
        const chunkLength = chunkData.length;
        
        const crcData = new Uint8Array(chunkType.length + chunkData.length);
        crcData.set(chunkType, 0);
        crcData.set(chunkData, chunkType.length);
        
        const crc = crc32(crcData);

        const chunk = new Uint8Array(4 + 4 + chunkLength + 4);
        const view = new DataView(chunk.buffer);
        view.setUint32(0, chunkLength, false); // Length (Big Endian)
        chunk.set(chunkType, 4);              // Type
        chunk.set(chunkData, 8);              // Data
        view.setUint32(4 + 4 + chunkLength, crc, false); // CRC (Big Endian)

        // 4. Find the position to insert the chunk (before the IEND chunk)
        const iendPosition = bytes.length - 12;
        if (iendPosition <= 8) { // 8 is for PNG signature
            console.error("Invalid PNG format, cannot find IEND chunk.");
            return dataUrl; // Return original if format is incorrect
        }
        
        // 5. Inject the chunk
        const newBytes = new Uint8Array(bytes.length + chunk.length);
        newBytes.set(bytes.slice(0, iendPosition), 0);
        newBytes.set(chunk, iendPosition);
        newBytes.set(bytes.slice(iendPosition), iendPosition + chunk.length);
        
        // 6. Encode back to base64
        let newBinaryString = '';
        for (let i = 0; i < newBytes.length; i++) {
            newBinaryString += String.fromCharCode(newBytes[i]);
        }
        const newBase64 = btoa(newBinaryString);
        
        return `data:image/png;base64,${newBase64}`;
    } catch (error) {
        console.error("Failed to embed prompt in image:", error);
        return dataUrl; // Return original on any error
    }
};


// --- Original Utils ---

export const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export const cropImage = (imageUrl: string, aspectRatio: string): Promise<string> => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
        }

        let sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number;
        const originalWidth = img.width;
        const originalHeight = img.height;
        const originalAspectRatio = originalWidth / originalHeight;

        const [targetW, targetH] = aspectRatio.split(':').map(Number);
        const targetAspectRatio = targetW / targetH;

        if (originalAspectRatio > targetAspectRatio) {
            sourceHeight = originalHeight;
            sourceWidth = originalHeight * targetAspectRatio;
            sourceX = (originalWidth - sourceWidth) / 2;
            sourceY = 0;
        } else {
            sourceWidth = originalWidth;
            sourceHeight = originalWidth / targetAspectRatio;
            sourceY = (originalHeight - sourceHeight) / 2;
            sourceX = 0;
        }

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
        resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
});


export const createSingleFramedImage = (imageUrl: string, cropRatio: string, labelText: string | null = null): Promise<string> => new Promise(async (resolve, reject) => {
    try {
        const croppedImgUrl = await cropImage(imageUrl, cropRatio);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = croppedImgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }

            const hasLabel = !!labelText;
            const sidePadding = img.width * 0.04;
            const topPadding = img.width * 0.04;
            let bottomPadding = img.width * 0.18;

            if (hasLabel) {
                bottomPadding = img.width * 0.24;
            }

            canvas.width = img.width + sidePadding * 2;
            canvas.height = img.height + topPadding + bottomPadding;

            ctx.fillStyle = '#FFFFFF'; // White frame for iOS style
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, sidePadding, topPadding);

            if (hasLabel) {
                 const labelFontSize = Math.max(24, Math.floor(img.width * 0.08));
                 ctx.font = `700 ${labelFontSize}px Inter, sans-serif`;
                 ctx.fillStyle = "#1f2937"; // Dark gray text
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillText(labelText, canvas.width / 2, img.height + topPadding + (bottomPadding - img.width * 0.1) / 2);
            }

            const fontSize = Math.max(12, Math.floor(img.width * 0.05));
            ctx.font = `600 ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = "#9ca3af"; // Light gray text for watermark
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Made with Gemini", canvas.width / 2, canvas.height - (img.width * 0.11));

            const nanoFontSize = Math.max(8, Math.floor(img.width * 0.035));
            ctx.font = `600 ${nanoFontSize}px Inter, sans-serif`;
            ctx.fillText("Edit your images with gemini.google", canvas.width / 2, canvas.height - (img.width * 0.05));

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
    } catch(err) {
        // Fix: Ensure a proper Error object is rejected.
        // The caught `err` is of type `unknown`, which could cause type issues downstream
        // if a function expecting a specific error type consumes this promise's rejection.
        if (err instanceof Error) {
            reject(err);
        } else {
            reject(new Error(String(err) || 'Failed to create framed image'));
        }
    }
});