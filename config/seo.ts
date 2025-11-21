export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  image?: string;
  url?: string;
}

export const SEO_CONFIG: Record<string, PageSEO> = {
  home: {
    title: 'MyNook.AI - AI-Powered Interior Design & Home Renovation',
    description: 'Transform your space with AI-powered interior design. Generate stunning room designs, exterior makeovers, and home renovation ideas in seconds. Free templates and professional results.',
    keywords: 'AI interior design, home design, room design, interior decoration, AI home renovation, virtual staging, room planner, design ideas, home makeover',
    image: 'https://mynook.ai/og-image.jpg',
    url: 'https://mynook.ai',
  },
  
  interiorDesign: {
    title: 'Interior Design - AI Room Designer',
    description: 'Create beautiful interior designs with AI. Choose from living room, bedroom, kitchen, and more. Get professional design ideas instantly with our AI-powered room designer.',
    keywords: 'interior design AI, room designer, living room design, bedroom design, kitchen design, AI room planner, interior decoration',
    url: 'https://mynook.ai/interior-design',
  },
  
  exteriorDesign: {
    title: 'Exterior Design - AI House & Garden Designer',
    description: 'Redesign your home exterior with AI. Transform facades, gardens, and outdoor spaces. Get stunning architectural designs and landscaping ideas instantly.',
    keywords: 'exterior design, house design, garden design, facade design, landscaping, outdoor design, AI architecture, home exterior',
    url: 'https://mynook.ai/exterior-design',
  },
  
  drawEdit: {
    title: 'Draw & Edit - AI Canvas Drawing Tool',
    description: 'Create custom designs with our AI-powered drawing canvas. Draw, sketch, and let AI transform your ideas into professional designs.',
    keywords: 'AI drawing tool, design canvas, sketch to design, AI art, creative tool, digital canvas',
    url: 'https://mynook.ai/draw-edit',
  },
  
  galleryWall: {
    title: 'Gallery Wall Designer - AI Art Arrangement',
    description: 'Design perfect gallery walls with AI. Arrange multiple artworks and photos beautifully. Get professional gallery wall layouts instantly.',
    keywords: 'gallery wall, art arrangement, photo wall, wall art, picture arrangement, AI gallery designer',
    url: 'https://mynook.ai/gallery-wall',
  },
  
  itemReplace: {
    title: 'Item Replace - AI Object Replacement Tool',
    description: 'Replace furniture and objects in your photos with AI. Swap items instantly and visualize different design options.',
    keywords: 'item replacement, furniture swap, object replacement, AI photo editing, virtual furniture',
    url: 'https://mynook.ai/item-replace',
  },
  
  imageUpscale: {
    title: 'Image Upscale - AI Image Enhancement',
    description: 'Upscale and enhance your design images with AI. Improve resolution and quality up to 4x without losing detail.',
    keywords: 'image upscale, AI upscaling, image enhancement, photo quality, resolution increase, AI image enhancer',
    url: 'https://mynook.ai/image-upscale',
  },
  
  pricing: {
    title: 'Pricing - MyNook.AI Plans & Credits',
    description: 'Flexible pricing plans for AI interior design. Choose from free templates or premium credits. Get professional design results that fit your budget.',
    keywords: 'pricing, plans, credits, subscription, AI design pricing, interior design cost',
    url: 'https://mynook.ai/pricing',
  },
  
  terms: {
    title: 'Terms of Service - MyNook.AI',
    description: 'Terms of Service for MyNook.AI. Read our terms and conditions for using our AI-powered interior design platform.',
    keywords: 'terms of service, terms and conditions, user agreement',
    url: 'https://mynook.ai/terms',
  },
  
  privacy: {
    title: 'Privacy Policy - MyNook.AI',
    description: 'Privacy Policy for MyNook.AI. Learn how we protect your data and respect your privacy on our platform.',
    keywords: 'privacy policy, data protection, privacy, user data, GDPR',
    url: 'https://mynook.ai/privacy',
  },
};

// JSON-LD Structured Data for Homepage
export const HOME_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MyNook.AI',
  description: 'AI-Powered Interior Design & Home Renovation Platform',
  url: 'https://mynook.ai',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free AI interior design templates available',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
  featureList: [
    'AI Interior Design',
    'Exterior Design',
    'Gallery Wall Designer',
    'Item Replacement',
    'Image Upscaling',
    'Draw & Edit Canvas',
  ],
};

// JSON-LD for Organization
export const ORGANIZATION_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MyNook.AI',
  url: 'https://mynook.ai',
  logo: 'https://mynook.ai/logo.png',
  sameAs: [
    // Add social media links when available
    // 'https://twitter.com/mynook',
    // 'https://facebook.com/mynook',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    availableLanguage: 'English',
  },
};

