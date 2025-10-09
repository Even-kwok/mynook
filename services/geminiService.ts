

import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Google Gemini API key is not configured. AI features will be disabled until GEMINI_API_KEY is set.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const requireClient = () => {
    if (!ai) {
        throw new Error("Google Gemini API key is not configured. Please add GEMINI_API_KEY to your environment.");
    }
    return ai;
};

/**
 * Generates a text response from the model, with an optional image and system instruction.
 * @param instruction The user's text prompt.
 * @param systemInstruction A system-level instruction to guide the model's behavior.
 * @param base64Image An optional base64 encoded image string (with data: prefix).
 * @returns A promise that resolves to the generated text string.
 */
export const generateTextResponse = async (
    instruction: string,
    systemInstruction: string,
    base64Image: string | null
): Promise<string> => {
    try {
        const textPart = { text: instruction };
        const parts = [];

        if (base64Image) {
            const imagePart = {
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: 'image/png', // The app consistently uses PNG format
                },
            };
            parts.push(imagePart);
        }
        parts.push(textPart);

        const response = await requireClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts }],
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text response:", error);
        throw new Error("Failed to get a response from the advisor. Please try again.");
    }
};


/**
 * Generates a dynamic prompt for a theme using Gemini.
 * @param themeDescription A description of the theme.
 * @returns A promise that resolves to the generated prompt string.
 */
export const generateDynamicPrompt = async (themeDescription: string): Promise<string> => {
    try {
        const response = await requireClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a creative and specific interior design style description. The style should be described in a single, detailed sentence. Style theme: ${themeDescription}`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating dynamic prompt:", error);
        throw new Error("Failed to generate a creative style. Please try again.");
    }
};

/**
 * Generates an image using the Gemini image editing model.
 * @param instruction The detailed instruction for the image generation.
 * @param base64Images An array of base64 encoded source image strings (without the data: prefix).
 * @returns A promise that resolves to the base64 URL of the generated image.
 */
export const generateImage = async (instruction: string, base64Images: string[]): Promise<string> => {
    try {
        const textPart = { text: instruction };
        const imageParts = base64Images.map(imgData => ({
            inlineData: {
                data: imgData,
                mimeType: 'image/png', // The app consistently uses PNG format
            },
        }));

        const response = await requireClient().models.generateContent({
            // FIX: Use the correct model for image editing tasks.
            model: 'gemini-2.5-flash-image',
            // FIX: Wrap the 'parts' object in a 'contents' array to match the expected `Content[]` type,
            // which is more robust for multi-modal requests.
            contents: [{
                parts: [
                    ...imageParts,
                    textPart,
                ],
            }],
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // The model can return multiple parts, find the image part.
        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        
        if (imagePart && imagePart.inlineData) {
            const base64Data = imagePart.inlineData.data;
            return `data:image/png;base64,${base64Data}`;
        }
        
        throw new Error("API response did not contain image data.");
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw new Error("Image generation failed. Please check the console for details.");
    }
};
