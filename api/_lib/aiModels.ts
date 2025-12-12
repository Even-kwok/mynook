/**
 * Centralized Gemini model configuration for all Vercel API routes.
 *
 * Defaults are set to the latest Gemini 3 preview models (as of 2025-12-12).
 * You can override via environment variables:
 * - GEMINI_TEXT_MODEL
 * - GEMINI_IMAGE_MODEL
 * - GEMINI_ANALYZE_STYLE_MODEL
 */

export const ALLOWED_GEMINI_TEXT_MODELS = [
  // Latest (preview)
  'gemini-3-pro-preview',
  // Stable fallbacks
  'gemini-2.5-pro',
  'gemini-2.5-flash',
] as const;

export type AllowedGeminiTextModel = (typeof ALLOWED_GEMINI_TEXT_MODELS)[number];

export const ALLOWED_GEMINI_IMAGE_MODELS = [
  // Latest (preview) - Nano Banana Pro in AI Studio
  'gemini-3-pro-image-preview',
  // Legacy / fallback
  'gemini-2.5-flash-image',
] as const;

export type AllowedGeminiImageModel = (typeof ALLOWED_GEMINI_IMAGE_MODELS)[number];

export const ALLOWED_GEMINI_ANALYZE_STYLE_MODELS = [
  // Analyze-style can use either a text model or a multimodal model
  ...ALLOWED_GEMINI_TEXT_MODELS,
  ...ALLOWED_GEMINI_IMAGE_MODELS,
] as const;

export type AllowedGeminiAnalyzeStyleModel = (typeof ALLOWED_GEMINI_ANALYZE_STYLE_MODELS)[number];

const resolveFromEnv = <TAllowed extends readonly string[]>(
  envKey: string,
  allowed: TAllowed,
  fallback: TAllowed[number]
): TAllowed[number] => {
  const raw = (process.env[envKey] || '').trim();
  const candidate = (raw || fallback) as string;

  if ((allowed as readonly string[]).includes(candidate)) {
    return candidate as TAllowed[number];
  }

  throw new Error(
    `Invalid ${envKey}. Allowed: ${allowed.join(', ')}. Received: ${candidate}`
  );
};

export const resolveGeminiTextModel = (): AllowedGeminiTextModel => {
  return resolveFromEnv(
    'GEMINI_TEXT_MODEL',
    ALLOWED_GEMINI_TEXT_MODELS,
    'gemini-3-pro-preview'
  ) as AllowedGeminiTextModel;
};

export const resolveGeminiImageModel = (): AllowedGeminiImageModel => {
  return resolveFromEnv(
    'GEMINI_IMAGE_MODEL',
    ALLOWED_GEMINI_IMAGE_MODELS,
    'gemini-3-pro-image-preview'
  ) as AllowedGeminiImageModel;
};

export const resolveGeminiAnalyzeStyleModel = (): AllowedGeminiAnalyzeStyleModel => {
  // Allow dedicated override, otherwise fall back to the text model choice.
  const configured = (process.env.GEMINI_ANALYZE_STYLE_MODEL || '').trim();
  if (!configured) {
    return resolveGeminiTextModel() as AllowedGeminiAnalyzeStyleModel;
  }

  return resolveFromEnv(
    'GEMINI_ANALYZE_STYLE_MODEL',
    ALLOWED_GEMINI_ANALYZE_STYLE_MODELS,
    'gemini-3-pro-preview'
  ) as AllowedGeminiAnalyzeStyleModel;
};

