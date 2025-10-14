export type GeneratedImageStatus = 'pending' | 'success' | 'failed' | 'empty';

export interface GeneratedImage {
  id: string;
  status: GeneratedImageStatus;
  imageUrl: string | null;
  promptBase: string;
}

// --- Presets ---

export type PresetType = 'photo' | 'style' | 'global';

export interface BasePreset {
  id: string;
  name: string;
}

// Granular Presets
export interface PhotoPreset extends BasePreset {
  uploadedImages: (string | null)[];
}

export interface StylePreset extends BasePreset {
  userPrompts: string[];
}

// Global Preset
export interface GlobalPreset extends BasePreset {
  uploadedImages: (string | null)[];
  userPrompts: string[];
}

export type AnyPreset = PhotoPreset | StylePreset | GlobalPreset;