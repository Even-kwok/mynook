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
 * @param onProgress Optional callback to report progress messages.
 * @returns A promise that resolves to the base64 URL of the generated image.
 */
export const generateImage = async (
    instruction: string, 
    base64Images: string[],
    onProgress?: (message: string) => void
): Promise<string> => {
    const MAX_RETRIES = 2;
    const TIMEOUT = 45000; // 45 seconds timeout
    const RETRY_DELAY = 2000; // 2 seconds delay between retries
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const token = await getAuthToken();
            if (!token) {
                throw new Error('You must be logged in to use this feature');
            }

            // Report progress
            if (onProgress) {
                if (attempt === 0) {
                    onProgress('Preparing your image...');
                } else {
                    onProgress(`Retrying (${attempt}/${MAX_RETRIES})...`);
                }
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

            try {
                if (onProgress) {
                    onProgress('Uploading to AI service...');
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
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (onProgress) {
                    onProgress('Generating your design...');
                }

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

                const data = await response.json();
                return data.imageUrl;
            } catch (error) {
                clearTimeout(timeoutId);
                
                // Check if it's an abort error (timeout)
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new Error('Request timeout. The AI service is taking too long to respond. Please try again.');
                }
                
                throw error;
            }
        } catch (error) {
            console.error(`Error generating image (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
            
            // Don't retry for auth/credit errors
            if (error instanceof Error) {
                if (error.message.includes('Authentication') || 
                    error.message.includes('Insufficient credits') ||
                    error.message.includes('logged in')) {
                    throw error;
                }
            }
            
            // If this is the last attempt, throw the error
            if (attempt === MAX_RETRIES) {
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error("Image generation failed. Please try again.");
            }
            
            // Wait before retrying
            if (onProgress) {
                onProgress(`Request failed, retrying in ${RETRY_DELAY / 1000} seconds...`);
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
    
    throw new Error("Image generation failed after multiple attempts.");
};
