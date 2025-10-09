

export type GeneratedImageStatus = 'pending' | 'success' | 'failed' | 'empty';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GeneratedImage {
  id: string;
  status: GeneratedImageStatus;
  imageUrl: string | null;
  promptBase: string;
}

export interface GenerationBatch {
  id: string;
  // FIX: Add 'floor_style' to the union type to support the floor style generation feature.
  // FIX: A type literal property cannot have an initializer.
  type: 'style' | 'item_replace' | 'wall_paint' | 'garden' | 'style_match' | 'ai_advisor' | 'multi_item' | 'exterior' | 'festive' | 'free_canvas' | 'floor_style';
  timestamp: Date;
  subjectImage: string | null;
  styleImages: string[];
  prompt: string;
  results: GeneratedImage[];
  templateIds: string[];
  textResponse?: string;
  chatHistory?: ChatMessage[];
  multiModelResponses?: {
    personaId: string;
    text: string;
  }[];
  buildingTypeId?: string;
  userId?: string; // To link generation to a user
}

// --- Presets ---

export type PresetType = 'photo' | 'style' | 'global';

export interface BasePreset {
  id:string;
  name: string;
}

// Granular Presets
export interface PhotoPreset extends BasePreset {
  module1Images: (string | null)[];
  module2Images: (string | null)[];
}

export interface StylePreset extends BasePreset {
  userPrompt: string;
}

// Global Preset
export interface GlobalPreset extends BasePreset {
  module1Images: (string | null)[];
  module2Images: (string | null)[];
  userPrompt: string;
}

export type AnyPreset = PhotoPreset | StylePreset | GlobalPreset;

// --- Prompt Templates ---

export interface PromptTemplate {
  id: string;
  name:string;
  imageUrl: string;
  prompt: string;
  category?: string;
}

export interface PromptTemplateCategory {
  name: string;
  templates: PromptTemplate[];
}

// --- AI Advisor ---

export interface AdvisorPersona {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  systemInstruction: string;
}

// --- User Authentication ---
export interface User {
    id: string;
    email: string;
    // NOTE: In a real-world application, never store passwords in plaintext.
    // This should be a securely hashed and salted password.
    password: string; 
    status: 'Active' | 'Banned';
    joined: string; // ISO Date string
    lastIp: string;
    registrationIp: string;
    permissionLevel: 1 | 2 | 3 | 4; // 1: Normal, 2: Pro, 3: Premium, 4: Business
    credits: number;
}
// --- Admin Panel Specific Types ---

export interface RecentActivity {
  id: string;
  type: 'new_user' | 'new_design';
  timestamp: Date;
  details: string;
}

export interface ManagedPromptTemplateCategory {
  name: string;
  enabled: boolean;
  templates: PromptTemplate[];
}

export type ManagedTemplateData = Record<string, ManagedPromptTemplateCategory[]>;


// --- Free Canvas Types ---
export type CanvasImage = {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
};

export type Point = { x: number; y: number };

export type DrawablePath = {
    id: string;
    points: Point[];
    color: string;
    size: number;
};

export type Annotation = {
    id: string;
    shape: 'rect' | 'circle';
    box: { x: number; y: number; width: number; height: number; };
    label: string;
    text: string;
};

export type PromptPreset = {
    id: string;
    name: string;
    prompt: string;
};

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  title: string;
  author: string;
  authorAvatarUrl: string;
  width?: number;
  height?: number;
}