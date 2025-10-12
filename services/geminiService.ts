/**
 * Gemini Service - Now calls backend API endpoints for security
 * API keys are stored server-side only
 */

import { supabase } from '../config/supabase';

/**
 * 获取用户认证 token
 */
const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
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
        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be logged in to use this feature');
        }

        const response = await fetch('/api/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                instruction,
                systemInstruction,
                base64Image,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle specific HTTP status codes
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in to use this feature.');
            } else if (response.status === 402) {
                throw new Error(`Insufficient credits. You need ${errorData.required || 1} credits but only have ${errorData.available || 0}.`);
            } else if (response.status === 500) {
                const detail = errorData.details ? `: ${errorData.details}` : '';
                throw new Error(`Server error${detail}. Please try again later.`);
            }
            
            const detail = errorData.details ? ` Details: ${errorData.details}` : '';
            throw new Error((errorData.error || 'Failed to get response from server') + detail);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error generating text response:", error);
        // Re-throw the error with the original message
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to get a response. Please try again.");
    }
};


/**
 * Generates a dynamic prompt for a theme using Gemini.
 * @param themeDescription A description of the theme.
 * @returns A promise that resolves to the generated prompt string.
 */
export const generateDynamicPrompt = async (themeDescription: string): Promise<string> => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be logged in to use this feature');
        }

        const instruction = `Generate a creative and specific interior design style description. The style should be described in a single, detailed sentence. Style theme: ${themeDescription}`;
        
        const response = await fetch('/api/generate-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                instruction,
                systemInstruction: '',
                base64Image: null,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle specific HTTP status codes
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in to use this feature.');
            } else if (response.status === 402) {
                throw new Error(`Insufficient credits. You need ${errorData.required || 1} credits but only have ${errorData.available || 0}.`);
            } else if (response.status === 500) {
                const detail = errorData.details ? `: ${errorData.details}` : '';
                throw new Error(`Server error${detail}. Please try again later.`);
            }
            
            const detail = errorData.details ? ` Details: ${errorData.details}` : '';
            throw new Error((errorData.error || 'Failed to get response from server') + detail);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Error generating dynamic prompt:", error);
        // Re-throw the error with the original message
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to generate a creative style. Please try again.");
    }
};

/**
 * Generates an image using the Gemini image editing model.
 * @param instruction The detailed instruction for the image generation.
 * @param base64Images An array of base64 encoded source image strings (without the data: prefix).
 * @returns A promise that resolves to the base64 URL of the generated image.
 */
export const generateImage = async (
    instruction: string, 
    base64Images: string[]
): Promise<string> => {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('You must be logged in to use this feature');
        }

        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                instruction,
                base64Images,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle specific HTTP status codes
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in to use this feature.');
            } else if (response.status === 402) {
                throw new Error(`Insufficient credits. You need ${errorData.required || 5} credits but only have ${errorData.available || 0}.`);
            } else if (response.status === 500) {
                const detail = errorData.details ? `: ${errorData.details}` : '';
                throw new Error(`Server error${detail}. Please try again later.`);
            }
            
            const detail = errorData.details ? ` Details: ${errorData.details}` : '';
            throw new Error((errorData.error || 'Failed to get response from server') + detail);
        }

        const data: any = await response.json();
        const imageUrl: unknown = data?.imageUrl
            ?? data?.imageUrls?.[0]
            ?? data?.images?.[0]?.imageUrl
            ?? data?.images?.[0];

        if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
            return imageUrl;
        }

        throw new Error('Server returned an unexpected response format. Please try again.');
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Image generation failed. Please try again.");
    }
};
