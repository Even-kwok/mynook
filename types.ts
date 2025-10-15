

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
  // 模板元数据 - 用于显示完整路径和批量上传
  templateId?: string;
  templateName?: string;
  templateCategory?: string;
  templateSubCategory?: string;
}

export interface GenerationBatch {
  id: string;
  // FIX: Add 'floor_style' to the union type to support the floor style generation feature.
  // FIX: A type literal property cannot have an initializer.
  type: 'style' | 'item_replace' | 'wall_design' | 'garden' | 'style_match' | 'ai_advisor' | 'multi_item' | 'exterior' | 'festive' | 'free_canvas' | 'floor_style';
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
    personaName: string;
    personaImageUrl: string;
    text: string;
  }[];
  buildingTypeId?: string;
  roomTypeId?: string; // 房间类型ID（用于Interior Design）
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
  roomType?: string | null; // 房间类型，用于Interior Design
  subCategory?: string; // 子分类，用于前端分组显示
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
    membershipTier?: 'free' | 'pro' | 'premium' | 'business'; // 会员等级
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
  category: string;      // Category ID for grouping
  categoryName: string;  // Display name for category
  toolPage: string;      // Target page to navigate to
}

// Hero Banner 过渡效果类型
export type TransitionEffect = 'fade' | 'slide' | 'zoom';

// Hero Banner 项目接口（扩展自 GalleryItem）
export interface HeroBannerItem extends GalleryItem {
  bannerTitle: string;        // 横幅主标题
  bannerSubtitle: string;     // 横幅副标题
  transitionEffect: TransitionEffect;  // 过渡效果
  displayDuration: number;    // 显示时长（秒）
  isAutoplay: boolean;        // 是否自动播放
  sortOrder: number;          // 排序顺序
}

// Hero Banner 轮播配置
export interface HeroBannerConfig {
  autoplay: boolean;           // 全局自动播放设置
  defaultDuration: number;     // 默认显示时长
  defaultTransition: TransitionEffect;  // 默认过渡效果
  pauseOnHover: boolean;       // 悬停时暂停
  showIndicators: boolean;     // 显示指示器
  showControls: boolean;       // 显示控制按钮
}

// Home Section 媒体类型
export type HomeSectionMediaType = 'image' | 'video' | 'comparison';

// Home Section 布局方向
export type HomeSectionLayout = 'left-image' | 'right-image';

// Home Section 接口（首页 Section 2-6）
export interface HomeSection {
  id: string;
  section_number: number;
  title: string;
  subtitle: string;
  media_url: string;
  media_type: HomeSectionMediaType;
  comparison_before_url: string | null;  // 对比图：改造前
  comparison_after_url: string | null;   // 对比图：改造后
  card_title: string;                    // 预览卡片左侧标题
  card_subtitle: string;                 // 预览卡片右侧标题
  button_text: string;
  button_link: string;
  layout_direction: HomeSectionLayout;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hero Section 接口（首页 Section 1）
export interface HeroSection {
  id: string;
  title_line_1: string;
  title_line_2: string;
  title_line_3: string;
  title_line_4: string;
  button_text: string;
  button_link: string;
  preview_media_url: string;
  preview_media_type: HomeSectionMediaType;
  preview_comparison_before_url: string | null;
  preview_comparison_after_url: string | null;
  preview_title: string;
  preview_subtitle: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}