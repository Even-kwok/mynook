/**
 * Template Generation Script
 * Generates all design templates with high-quality prompts following MyNook-V1.0-Universal format
 */

export interface DesignStyle {
  id: string;
  name: string;
  category: string;
  popularity: 'high' | 'medium' | 'low';
  sortOrder: number;
}

export interface GeneratedTemplate {
  name: string;
  imageUrl: string;
  prompt: string;
  main_category: string;
  sub_category: string;
  room_type?: string | null;
  enabled: boolean;
  sort_order: number;
  popularity: 'high' | 'medium' | 'low';
}

// ============================================
// DESIGN STYLES DEFINITION (44 styles)
// ============================================

export const DESIGN_STYLES: DesignStyle[] = [
  // Minimalist & Modern (8 styles)
  { id: 'modern-minimalist', name: 'Modern Minimalist', category: 'minimalist-modern', popularity: 'high', sortOrder: 10 },
  { id: 'warm-minimalism', name: 'Warm Minimalism', category: 'minimalist-modern', popularity: 'high', sortOrder: 5 },
  { id: 'latte-creamy-style', name: 'Latte / Creamy Style', category: 'minimalist-modern', popularity: 'high', sortOrder: 1 },
  { id: 'japandi', name: 'Japandi', category: 'minimalist-modern', popularity: 'high', sortOrder: 8 },
  { id: 'organic-modern', name: 'Organic Modern', category: 'minimalist-modern', popularity: 'high', sortOrder: 3 },
  { id: 'quiet-luxury', name: 'Quiet Luxury', category: 'minimalist-modern', popularity: 'high', sortOrder: 4 },
  { id: 'contemporary', name: 'Contemporary', category: 'minimalist-modern', popularity: 'medium', sortOrder: 15 },
  { id: 'zen-minimalism', name: 'Zen Minimalism', category: 'minimalist-modern', popularity: 'medium', sortOrder: 20 },

  // Nordic & Natural (6 styles)
  { id: 'scandinavian', name: 'Scandinavian', category: 'nordic-natural', popularity: 'high', sortOrder: 6 },
  { id: 'nordic-light', name: 'Nordic Light', category: 'nordic-natural', popularity: 'medium', sortOrder: 18 },
  { id: 'coastal', name: 'Coastal', category: 'nordic-natural', popularity: 'high', sortOrder: 12 },
  { id: 'cottagecore', name: 'Cottagecore', category: 'nordic-natural', popularity: 'high', sortOrder: 9 },
  { id: 'rustic-modern', name: 'Rustic Modern', category: 'nordic-natural', popularity: 'medium', sortOrder: 22 },
  { id: 'natural-biophilic', name: 'Natural Biophilic', category: 'nordic-natural', popularity: 'medium', sortOrder: 25 },

  // Vintage & Classic (8 styles)
  { id: 'mid-century-modern', name: 'Mid-Century Modern', category: 'vintage-classic', popularity: 'high', sortOrder: 11 },
  { id: 'art-deco', name: 'Art Deco', category: 'vintage-classic', popularity: 'medium', sortOrder: 16 },
  { id: 'grandmillennial', name: 'Grandmillennial', category: 'vintage-classic', popularity: 'high', sortOrder: 13 },
  { id: 'transitional', name: 'Transitional', category: 'vintage-classic', popularity: 'medium', sortOrder: 17 },
  { id: 'traditional', name: 'Traditional', category: 'vintage-classic', popularity: 'medium', sortOrder: 24 },
  { id: 'parisian-chic', name: 'Parisian Chic', category: 'vintage-classic', popularity: 'medium', sortOrder: 19 },
  { id: 'hollywood-regency', name: 'Hollywood Regency', category: 'vintage-classic', popularity: 'low', sortOrder: 30 },
  { id: 'victorian-modern', name: 'Victorian Modern', category: 'vintage-classic', popularity: 'low', sortOrder: 32 },

  // Bold & Colorful (7 styles)
  { id: 'bohemian', name: 'Bohemian', category: 'bold-colorful', popularity: 'high', sortOrder: 14 },
  { id: 'maximalist', name: 'Maximalist', category: 'bold-colorful', popularity: 'high', sortOrder: 7 },
  { id: 'dopamine-decor', name: 'Dopamine Decor', category: 'bold-colorful', popularity: 'high', sortOrder: 2 },
  { id: 'eclectic', name: 'Eclectic', category: 'bold-colorful', popularity: 'medium', sortOrder: 21 },
  { id: 'retro-vintage', name: 'Retro Vintage', category: 'bold-colorful', popularity: 'medium', sortOrder: 26 },
  { id: 'colorful-contemporary', name: 'Colorful Contemporary', category: 'bold-colorful', popularity: 'medium', sortOrder: 27 },
  { id: 'memphis-design', name: 'Memphis Design', category: 'bold-colorful', popularity: 'low', sortOrder: 35 },

  // Industrial & Urban (4 styles)
  { id: 'industrial-loft', name: 'Industrial Loft', category: 'industrial-urban', popularity: 'medium', sortOrder: 23 },
  { id: 'urban-modern', name: 'Urban Modern', category: 'industrial-urban', popularity: 'medium', sortOrder: 28 },
  { id: 'brutalist', name: 'Brutalist', category: 'industrial-urban', popularity: 'low', sortOrder: 36 },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', category: 'industrial-urban', popularity: 'high', sortOrder: 9 },

  // Luxury & Refined (5 styles)
  { id: 'luxury-glam', name: 'Luxury Glam', category: 'luxury-refined', popularity: 'medium', sortOrder: 29 },
  { id: 'modern-luxury', name: 'Modern Luxury', category: 'luxury-refined', popularity: 'medium', sortOrder: 31 },
  { id: 'boutique-hotel', name: 'Boutique Hotel', category: 'luxury-refined', popularity: 'medium', sortOrder: 33 },
  { id: 'resort-style', name: 'Resort Style', category: 'luxury-refined', popularity: 'medium', sortOrder: 34 },
  { id: 'art-gallery', name: 'Art Gallery', category: 'luxury-refined', popularity: 'low', sortOrder: 37 },

  // Themed (6 styles)
  { id: 'tropical', name: 'Tropical', category: 'themed', popularity: 'medium', sortOrder: 38 },
  { id: 'mediterranean', name: 'Mediterranean', category: 'themed', popularity: 'medium', sortOrder: 39 },
  { id: 'moroccan', name: 'Moroccan', category: 'themed', popularity: 'low', sortOrder: 40 },
  { id: 'asian-fusion', name: 'Asian Fusion', category: 'themed', popularity: 'low', sortOrder: 41 },
  { id: 'desert-modern', name: 'Desert Modern', category: 'themed', popularity: 'low', sortOrder: 42 },
  { id: 'english-country', name: 'English Country', category: 'themed', popularity: 'low', sortOrder: 43 },
];

// ============================================
// ROOM-STYLE MATRIX
// ============================================

// Define which styles are suitable for each room type
export const ROOM_STYLE_MATRIX: Record<string, string[]> = {
  'living-room': [
    'latte-creamy-style', 'dopamine-decor', 'organic-modern', 'quiet-luxury', 'warm-minimalism',
    'scandinavian', 'maximalist', 'japandi', 'modern-farmhouse', 'modern-minimalist',
    'mid-century-modern', 'coastal', 'grandmillennial', 'bohemian', 'contemporary',
    'art-deco', 'transitional', 'nordic-light', 'parisian-chic', 'zen-minimalism',
    'eclectic', 'rustic-modern', 'industrial-loft', 'traditional', 'natural-biophilic',
    'retro-vintage', 'colorful-contemporary', 'urban-modern'
  ],
  'master-bedroom': [
    'latte-creamy-style', 'warm-minimalism', 'quiet-luxury', 'organic-modern', 'scandinavian',
    'japandi', 'cottagecore', 'grandmillennial', 'coastal', 'modern-minimalist',
    'parisian-chic', 'zen-minimalism', 'bohemian', 'modern-luxury', 'nordic-light',
    'transitional', 'resort-style', 'natural-biophilic', 'boutique-hotel', 'traditional',
    'contemporary', 'tropical'
  ],
  'bedroom': [
    'latte-creamy-style', 'warm-minimalism', 'scandinavian', 'japandi', 'coastal',
    'cottagecore', 'modern-minimalist', 'bohemian', 'grandmillennial', 'nordic-light',
    'organic-modern', 'quiet-luxury', 'zen-minimalism', 'natural-biophilic', 'traditional',
    'transitional', 'modern-farmhouse', 'contemporary'
  ],
  'guest-bedroom': [
    'latte-creamy-style', 'warm-minimalism', 'scandinavian', 'coastal', 'transitional',
    'contemporary', 'modern-minimalist', 'japandi', 'traditional', 'cottagecore',
    'nordic-light', 'natural-biophilic'
  ],
  'kitchen': [
    'modern-farmhouse', 'latte-creamy-style', 'scandinavian', 'transitional', 'organic-modern',
    'mid-century-modern', 'contemporary', 'industrial-loft', 'mediterranean', 'traditional',
    'coastal', 'modern-minimalist', 'urban-modern', 'japandi', 'grandmillennial',
    'art-deco', 'modern-luxury', 'asian-fusion', 'english-country', 'rustic-modern'
  ],
  'dining-room': [
    'mid-century-modern', 'art-deco', 'grandmillennial', 'transitional', 'dopamine-decor',
    'maximalist', 'hollywood-regency', 'parisian-chic', 'scandinavian', 'modern-farmhouse',
    'traditional', 'bohemian', 'contemporary', 'industrial-loft', 'mediterranean',
    'coastal', 'latte-creamy-style', 'modern-luxury'
  ],
  'bathroom': [
    'organic-modern', 'scandinavian', 'coastal', 'quiet-luxury', 'japandi',
    'modern-minimalist', 'contemporary', 'mediterranean', 'traditional', 'latte-creamy-style',
    'zen-minimalism', 'modern-luxury', 'art-deco', 'industrial-loft'
  ],
  'master-bathroom': [
    'organic-modern', 'quiet-luxury', 'modern-luxury', 'resort-style', 'spa-like',
    'scandinavian', 'japandi', 'latte-creamy-style', 'contemporary', 'zen-minimalism',
    'mediterranean', 'coastal', 'boutique-hotel'
  ],
  'powder-room': [
    'art-deco', 'modern-luxury', 'parisian-chic', 'contemporary', 'bohemian',
    'maximalist', 'grandmillennial', 'hollywood-regency', 'mediterranean', 'coastal'
  ],
  'home-office': [
    'modern-minimalist', 'scandinavian', 'mid-century-modern', 'organic-modern', 'industrial-loft',
    'urban-modern', 'japandi', 'contemporary', 'quiet-luxury', 'transitional',
    'traditional', 'latte-creamy-style', 'zen-minimalism', 'natural-biophilic', 'art-gallery',
    'modern-luxury'
  ],
  'study-library': [
    'traditional', 'grandmillennial', 'parisian-chic', 'mid-century-modern', 'art-gallery',
    'english-country', 'contemporary', 'modern-minimalist', 'industrial-loft', 'victorian-modern',
    'transitional', 'quiet-luxury'
  ],
  'kids-room': [
    'dopamine-decor', 'scandinavian', 'cottagecore', 'colorful-contemporary', 'modern-minimalist',
    'playful-modern', 'natural-biophilic', 'contemporary', 'bohemian', 'nordic-light',
    'coastal', 'latte-creamy-style', 'retro-vintage', 'maximalist'
  ],
  'nursery': [
    'latte-creamy-style', 'scandinavian', 'warm-minimalism', 'cottagecore', 'modern-minimalist',
    'coastal', 'natural-biophilic', 'organic-modern', 'nordic-light', 'contemporary'
  ],
  'teen-room': [
    'dopamine-decor', 'urban-modern', 'contemporary', 'bohemian', 'industrial-loft',
    'colorful-contemporary', 'scandinavian', 'modern-minimalist', 'maximalist', 'eclectic',
    'retro-vintage', 'memphis-design'
  ],
  'laundry-room': [
    'modern-farmhouse', 'scandinavian', 'contemporary', 'transitional', 'modern-minimalist',
    'coastal', 'industrial-loft', 'organic-modern'
  ],
  'mudroom-entryway': [
    'modern-farmhouse', 'transitional', 'scandinavian', 'contemporary', 'coastal',
    'traditional', 'industrial-loft', 'modern-minimalist'
  ],
  'walk-in-closet': [
    'modern-luxury', 'quiet-luxury', 'contemporary', 'parisian-chic', 'scandinavian',
    'transitional', 'boutique-hotel', 'modern-minimalist', 'hollywood-regency', 'art-deco'
  ],
  'pantry': [
    'modern-farmhouse', 'scandinavian', 'traditional', 'contemporary', 'coastal',
    'transitional', 'modern-minimalist', 'english-country'
  ],
  'attic': [
    'industrial-loft', 'bohemian', 'scandinavian', 'cottagecore', 'contemporary',
    'rustic-modern', 'modern-minimalist', 'zen-minimalism', 'natural-biophilic', 'eclectic'
  ],
  'basement': [
    'industrial-loft', 'modern-minimalist', 'contemporary', 'urban-modern', 'traditional',
    'mid-century-modern', 'bohemian', 'modern-farmhouse', 'rustic-modern', 'scandinavian'
  ],
  'home-theater': [
    'modern-luxury', 'contemporary', 'hollywood-regency', 'art-deco', 'industrial-loft',
    'modern-minimalist', 'urban-modern', 'quiet-luxury', 'brutalist', 'maximalist'
  ],
  'game-room': [
    'dopamine-decor', 'colorful-contemporary', 'industrial-loft', 'urban-modern', 'contemporary',
    'retro-vintage', 'memphis-design', 'maximalist', 'eclectic', 'modern-minimalist'
  ],
  'home-gym': [
    'modern-minimalist', 'industrial-loft', 'contemporary', 'urban-modern', 'organic-modern',
    'scandinavian', 'zen-minimalism', 'natural-biophilic', 'brutalist', 'modern-luxury'
  ],
  'yoga-meditation-room': [
    'zen-minimalism', 'japandi', 'natural-biophilic', 'organic-modern', 'scandinavian',
    'warm-minimalism', 'modern-minimalist', 'coastal', 'asian-fusion', 'resort-style'
  ],
  'home-bar': [
    'art-deco', 'hollywood-regency', 'industrial-loft', 'mid-century-modern', 'modern-luxury',
    'urban-modern', 'contemporary', 'maximalist', 'parisian-chic', 'traditional'
  ],
  'music-room': [
    'mid-century-modern', 'bohemian', 'industrial-loft', 'contemporary', 'eclectic',
    'scandinavian', 'modern-minimalist', 'art-gallery', 'urban-modern', 'maximalist'
  ],
  'craft-hobby-room': [
    'scandinavian', 'dopamine-decor', 'contemporary', 'cottagecore', 'bohemian',
    'colorful-contemporary', 'modern-farmhouse', 'eclectic', 'natural-biophilic', 'nordic-light'
  ],
  'hallway-corridor': [
    'contemporary', 'transitional', 'scandinavian', 'modern-minimalist', 'parisian-chic',
    'art-gallery', 'industrial-loft', 'traditional', 'grandmillennial', 'modern-luxury'
  ],
  'staircase': [
    'contemporary', 'modern-minimalist', 'industrial-loft', 'traditional', 'transitional',
    'scandinavian', 'art-deco', 'mid-century-modern', 'modern-luxury', 'parisian-chic'
  ],
  'sunroom-conservatory': [
    'coastal', 'tropical', 'natural-biophilic', 'scandinavian', 'cottagecore',
    'mediterranean', 'organic-modern', 'bohemian', 'english-country', 'resort-style',
    'contemporary', 'modern-farmhouse'
  ],
  'balcony-terrace': [
    'coastal', 'mediterranean', 'tropical', 'scandinavian', 'modern-minimalist',
    'contemporary', 'resort-style', 'bohemian', 'urban-modern', 'natural-biophilic'
  ],
  'garage': [
    'industrial-loft', 'urban-modern', 'modern-minimalist', 'contemporary', 'scandinavian',
    'brutalist', 'transitional', 'modern-farmhouse'
  ],
};

// ============================================
// TEMPLATE PROMPT BASE
// ============================================

const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.`;

// ============================================
// STYLE-SPECIFIC DESCRIPTIONS
// ============================================

export const STYLE_DESCRIPTIONS: Record<string, string> = {
  'latte-creamy-style': 'Transform this {roomName} into a dreamy latte-style sanctuary featuring walls in warm cream or latte tones with smooth matte plaster finish, light natural oak or white-washed wood flooring with subtle grain, furniture with soft rounded edges in plush boucle fabric or velvet in rich caramel, oatmeal, and taupe tones, organic-shaped tables in light travertine stone or pale wood, layered textures including chunky knit throw blankets in ivory and velvet cushions, soft-pile area rug in warm beige tones, minimal decor with sculptural ceramic vases in neutral tones, dried pampas grass or natural branches, rounded arch doorways or curved architectural details where applicable, warm ambient lighting with modern fixtures in fabric or frosted glass, large windows with sheer linen curtains allowing soft diffused light, monochromatic palette of cream, latte, caramel, oatmeal, and soft taupe creating an Instagram-worthy cocoon of warmth and tactile comfort.',

  'dopamine-decor': 'Transform this {roomName} into a joyful dopamine-boosting paradise featuring walls painted in cheerful uplifting colors like soft coral, sunny yellow accent wall, or fresh sage green with white trim, light wood or painted flooring, furniture with playful shapes and vibrant upholstery in happy colors mixing coral, mint green, butter yellow, sky blue, and soft pink, colorful storage solutions and accessories, playful wall art with cheerful illustrations or colorful abstract pieces creating gallery wall, soft colorful area rug with geometric pattern or fun shapes, whimsical lighting like colorful pendant or sculptural fixtures, decorative elements like pom-pom garlands or colorful textiles, potted plants in colorful ceramic pots for touch of nature, window treatments in cheerful colors or patterns, overall vibrant energizing atmosphere that sparks creativity and happiness while remaining organized and functional, color-blocked walls or painted geometric shapes as focal points.',

  'warm-minimalism': 'Transform this {roomName} into a warm minimalist retreat featuring smooth walls in soft warm white or pale sand with micro-textured finish, wide-plank light oak flooring with natural matte surface, furniture with clean lines in natural materials like linen, bouclé, or soft leather in oatmeal, cream, and warm gray tones, sparse but intentional decor with high-quality pieces, simple sculptural elements in ceramic or matte brass, large abstract art in neutral earth tones, sheer organic cotton curtains filtering gentle sunlight, potted plants in natural fiber baskets, handwoven wool area rug in cream or natural tones, clean lines balanced with warm textures and materials, abundant negative space creating calm and serenity, overall atmosphere of sophisticated simplicity with inviting warmth and tactile richness.',

  'organic-modern': 'Transform this {roomName} into an organic modern sanctuary featuring walls in natural stone tiles such as beige travertine or limestone with subtle texture, or smooth plaster in warm cream tones, flooring in large-format natural stone tiles or wide-plank wood with matte finish, furniture in natural light wood like oak or teak with organic curved forms and live edge details, natural fiber elements like woven baskets and linen textiles in neutral tones, sculptural lighting fixtures inspired by nature, potted plants for greenery, organic wood accessories, warm ambient lighting, abundant natural light, color palette of warm whites, beiges, soft grays, natural wood tones, and organic textures, overall atmosphere of serene spa-like tranquility with strong connection to nature through organic materials, curved forms, and biophilic design elements.',

  'quiet-luxury': 'Transform this {roomName} into a quiet luxury haven featuring walls in sophisticated neutral tones like taupe, greige, warm gray, or subtle mushroom with premium smooth or micro-textured finish, flooring in wide-plank engineered hardwood in medium to dark tone or plush wall-to-wall carpet in neutral beige, statement furniture with elegant proportions in luxurious fabrics like bouclé, premium linen, or velvet in caramel, cream, or soft gray, exquisite textiles in high thread-count materials with subtle texture, investment-quality pieces with refined hardware in brushed brass or polished nickel, sculptural lighting with natural stone or ceramic bases, museum-quality art in earth tones, custom window treatments with motorized shades and floor-length drapery, carefully curated minimal decor including artisan vessels, hardcover books, single orchid or sculptural branch, handwoven area rug in neutral tones with exceptional quality, attention to proportion and negative space, impeccable craftsmanship evident in every detail, overall aesthetic of understated elegance, timeless refinement, and investment-quality materials creating space that whispers rather than shouts luxury through superior quality, craftsmanship, and restraint.',

  'scandinavian': 'Transform this {roomName} into a Scandinavian hygge haven with crisp white painted walls, light oak or birch wood plank flooring with natural matte finish, functional simple furniture with clean lines including light-colored upholstered pieces with wooden legs, light wood tables and storage, cozy textiles like chunky knit throw blankets and soft wool cushions in neutral tones, minimal decor with Nordic ceramics and candleholders, strategically placed potted houseplants, abundant natural light streaming through sheer white curtains, muted color pops in dusty pink or sage green, overall atmosphere of warmth, simplicity, and effortless comfort with focus on functionality and natural materials.',

  'japandi': 'Transform this {roomName} into a Japandi haven of focused calm featuring smooth walls in soft neutral tones like warm white, pale gray, or subtle beige with matte finish, light bamboo or oak flooring with clean natural grain, minimalist furniture in simple forms with clean lines in light or medium wood tone, Japanese-inspired elements like shoji-screen style details or washi paper fixtures, simple geometric lighting, bonsai plant or ikebana arrangement in handmade ceramic vessel, neutral color palette with touches of matte black for contrast, tatami mat or natural fiber area rug, large window with simple treatments allowing soft natural light, focus on craftsmanship and quality materials, clutter-free surfaces emphasizing negative space and mindfulness, overall aesthetic blending Japanese minimalism with Scandinavian functionality.',

  'modern-minimalist': 'Transform this {roomName} into a modern minimalist sanctuary featuring flawless smooth matte white or light gray walls, rich medium-to-dark wood plank flooring with natural finish, furniture with clean geometric lines and thin metal frames in black or chrome, thick low-block style wood tables, soft high-pile area rugs in monochromatic tones, minimal decor with single sculptural pieces, clean lines throughout, focus on negative space, serene high-contrast palette, geometric forms, and sophisticated calm through simplicity and restraint.',

  'cottagecore': 'Transform this {roomName} into a charming cottagecore retreat featuring walls with delicate floral wallpaper or painted in soft colors like blush pink, sage green, or butter yellow, natural wood flooring or painted wood in soft white, vintage-inspired furniture with distressed finishes, floral and gingham fabrics in soft colors, lace curtains and embroidered linens, dried flowers and botanical arrangements, vintage ceramics and enamelware, woven baskets, soft lighting from vintage-style fixtures, abundant plants and fresh flowers, handmade textiles, romantic pastoral aesthetic with nostalgic charm.',

  'coastal': 'Transform this {roomName} into a coastal beach house retreat with crisp white shiplap or smooth painted walls, light weathered oak or whitewashed wood plank flooring, large windows with white trim allowing abundant natural light, comfortable natural linen or white cotton upholstered furniture, natural rattan or wicker accent pieces, driftwood or whitewashed wood tables, soft blue and white textiles, natural jute or sisal area rug, coastal decor including coral specimens, seashells, nautical rope accents, soft blue-gray painted details, potted seagrass or palm plants, sheer white flowing curtains, overall light, airy, breezy atmosphere evoking seaside relaxation and casual elegance.',

  'mid-century-modern': 'Transform this {roomName} into a mid-century modern showcase featuring walls in warm white or soft gray, medium-toned wood flooring in walnut or teak with natural finish, iconic furniture pieces with organic shapes and tapered legs in teak or walnut wood, low-profile sofas with clean lines, statement lighting fixtures with sculptural forms, pops of color in mustard yellow, burnt orange, or olive green, geometric patterns in textiles and art, minimal accessories with vintage ceramics and sculptural pieces, large windows, indoor plants, overall aesthetic of functional elegance with retro charm and timeless appeal.',

  'grandmillennial': 'Transform this {roomName} into a charming grandmillennial sanctuary featuring walls with delicate floral or botanical wallpaper in soft colors like blush pink, sage green, or sky blue on white background, or painted in classic colors with decorative molding and wainscoting, traditional furniture with elegant details, upholstered pieces with skirted slipcovers in ticking stripe, gingham check, or floral patterns, vintage-inspired chandelier or classic brass fixtures, china cabinet displaying blue and white porcelain and vintage pieces, layered window treatments with roman shade and curtain panels with trim, traditional area rug in Persian or oriental pattern, mix-and-match vintage china, embroidered linens, fresh flowers, needlepoint pillows, framed botanical prints, scalloped lampshades, ribbon-trimmed accessories, overall aesthetic blending grandmother elegance with youthful fresh interpretation.',

  'bohemian': 'Transform this {roomName} into a bohemian eclectic paradise with warm earthy-toned walls, layered vintage rugs over natural flooring, low comfortable seating with colorful patterned cushions and throws, mix of vintage and handcrafted furniture, abundant layered textiles in rich patterns mixing ikat, suzani, and tribal prints, macramé wall hangings and woven baskets, floor cushions and poufs, abundance of hanging and potted plants, warm ambient lighting from lanterns and string lights, global artifacts and handmade ceramics, relaxed, lived-in, free-spirited atmosphere full of personality and texture.',

  'maximalist': 'Transform this {roomName} into a bold maximalist showcase featuring walls with dramatic wallpaper or rich paint colors, mix of patterns and textures throughout, layered furniture pieces in various styles, bold upholstery in rich colors and patterns, gallery wall with eclectic mix of art and frames, statement lighting fixtures, colorful area rugs layered over each other, abundant decorative accessories including books, ceramics, sculptures, plants, collections displayed, rich color palette with jewel tones, metallic accents in brass and gold, luxurious fabrics like velvet and silk, overall atmosphere of abundant personality, visual richness, and fearless self-expression.',

  'industrial-loft': 'Transform this {roomName} into an industrial loft with exposed red brick walls showing authentic texture, polished concrete flooring, exposed black metal pipes and ductwork on ceiling, tall windows with black metal frames, distressed leather furniture in cognac or black, reclaimed wood and metal tables with visible welds, vintage metal factory pendant lights with Edison bulbs, metal shelving units, neutral color scheme of gray, black, brown, and rust, minimal but impactful vintage industrial decor, raw urban aesthetic with refined finishing touches.',

  'art-deco': 'Transform this {roomName} into an Art Deco masterpiece featuring walls in rich colors like deep blues, emerald greens, or charcoal with metallic accents, geometric patterns throughout, luxurious materials like velvet and marble, metallic finishes in gold and brass, symmetrical layouts, bold geometric furniture, statement lighting fixtures with geometric forms, mirrors with sunburst or geometric frames, luxurious textiles, glamorous atmosphere with 1920s elegance.',

  'transitional': 'Transform this {roomName} into a refined transitional space blending traditional and contemporary elements, featuring neutral walls, mix of classic and modern furniture, comfortable upholstered pieces in quality fabrics, clean-lined wood furniture, balanced mix of straight and curved lines, simple window treatments, neutral color palette with subtle accents, timeless accessories, overall aesthetic of comfortable elegance that feels current yet classic.',

  'modern-farmhouse': 'Transform this {roomName} into a modern farmhouse masterpiece featuring white or warm-white painted surfaces, natural wood elements, mix of rustic and contemporary pieces, shiplap or board-and-batten walls, wide-plank hardwood flooring, modern fixtures in matte black or brass, farmhouse sink if applicable, open shelving with white ceramics, vintage-inspired but functional decor, neutral color palette, overall aesthetic blending rustic warmth with clean modern functionality.',

  'contemporary': 'Transform this {roomName} into a sleek contemporary space featuring clean lines, neutral color palette, mix of textures, modern furniture with simple forms, minimal accessories, quality materials, large windows with simple treatments, open and airy feel, current design trends executed with restraint, sophisticated and polished aesthetic.',

  'traditional': 'Transform this {roomName} into a classic traditional space featuring rich wood furniture, formal symmetrical arrangements, detailed moldings and trim, traditional patterns in textiles, classic color palette, formal draperies, elegant lighting fixtures, decorative accessories, overall atmosphere of timeless elegance and refined comfort.',

  'modern-luxury': 'Transform this {roomName} into a modern luxury showcase featuring high-end materials like marble and exotic woods, designer furniture pieces, custom millwork, statement lighting, rich textures, sophisticated neutral palette with metallic accents, floor-to-ceiling windows with motorized treatments, cutting-edge technology integration, museum-quality art, overall atmosphere of contemporary opulence and refined taste.',

  'parisian-chic': 'Transform this {roomName} into a Parisian chic retreat featuring elegant Haussmann-style details like crown molding and herringbone wood floors, French antique or reproduction furniture, tufted upholstery, ornate mirrors with gilt frames, crystal chandeliers, soft color palette of whites, creams, soft grays, and gold accents, silk and velvet textiles, fresh flowers, overall atmosphere of effortless Parisian elegance.',

  'tropical': 'Transform this {roomName} into a tropical paradise featuring walls in white or soft warm tones, natural materials like rattan, bamboo, and teak, lush greenery with large-leaf tropical plants, vibrant colors inspired by nature, natural fiber rugs, light airy fabrics, large windows, tropical prints and patterns, outdoor living integration, overall atmosphere of vacation-like relaxation.',

  'mediterranean': 'Transform this {roomName} into a Mediterranean retreat featuring textured walls in warm whites or terra cotta, terracotta tile or natural stone flooring, arched doorways and windows, wrought iron details, natural wood furniture, blue and white ceramics, plants in terracotta pots, warm color palette, rustic elegance, indoor-outdoor living connection.',

  'zen-minimalism': 'Transform this {roomName} into a Zen sanctuary featuring smooth walls in neutral tones, natural wood or stone flooring, low-profile furniture in dark wood, minimal decor with single sculptural pieces, natural elements like stones and bamboo, soft diffused lighting, neutral color palette, emphasis on empty space, overall atmosphere of meditation and peace.',

  'rustic-modern': 'Transform this {roomName} into a rustic modern space featuring reclaimed wood elements, mix of rough and smooth textures, modern furniture with rustic materials, neutral color palette with natural wood tones, industrial-style lighting, minimal accessories, large windows, overall aesthetic blending rugged natural materials with contemporary design.',

  'natural-biophilic': 'Transform this {roomName} into a biophilic haven featuring abundant plants throughout, natural materials like wood, stone, and natural fibers, large windows maximizing natural light, organic shapes and curves, earthy color palette, water features if applicable, living walls or vertical gardens, natural textures, overall design prioritizing connection to nature.',

  'nordic-light': 'Transform this {roomName} into a Nordic light-filled space featuring all-white or pale surfaces, maximized natural light, minimal furniture in light wood, sheer or no window treatments, simple forms, few carefully chosen accessories, candles and soft lighting, overall aesthetic of bright, airy simplicity with focus on light.',

  'urban-modern': 'Transform this {roomName} into an urban modern space featuring sleek contemporary furniture, mix of industrial and refined elements, neutral color palette with bold accents, modern art, metal and glass details, city views if applicable, minimalist approach, overall aesthetic of sophisticated city living.',

  'colorful-contemporary': 'Transform this {roomName} into a colorful contemporary space featuring vibrant color palette used thoughtfully, modern furniture forms, bold artwork, mix of patterns in coordinating colors, contemporary lighting, clean lines with colorful accents, playful yet sophisticated atmosphere.',

  'eclectic': 'Transform this {roomName} into an eclectic mix featuring diverse furniture styles and periods, curated collections, bold colors and patterns mixed skillfully, global influences, vintage and contemporary pieces together, gallery wall, abundant personality, overall aesthetic of collected-over-time individuality.',

  'retro-vintage': 'Transform this {roomName} into a retro vintage space featuring furniture and decor from specific past eras (50s-70s), bold patterns and colors from the period, vintage lighting fixtures, nostalgic accessories, mix of authentic and reproduction pieces, playful atmosphere with period-specific charm.',

  'luxury-glam': 'Transform this {roomName} into a glamorous luxury space featuring rich jewel tones, velvet and silk fabrics, metallic finishes in gold and silver, crystal chandeliers, tufted upholstery, mirrored furniture, luxurious materials, dramatic lighting, overall atmosphere of Hollywood glamour and opulence.',

  'hollywood-regency': 'Transform this {roomName} into a Hollywood Regency showcase featuring bold black and white contrasts, lacquered furniture, mirrored surfaces, chinoiserie elements, animal prints, tufted velvet, geometric patterns, brass and gold accents, dramatic curtains, overall aesthetic of 1940s Hollywood glamour.',

  'victorian-modern': 'Transform this {roomName} into a Victorian modern space featuring traditional Victorian architectural details updated with contemporary furnishings, mix of ornate and simple elements, modern color palette, updated Victorian-era patterns, overall blend of historical character with modern livability.',

  'brutalist': 'Transform this {roomName} into a brutalist space featuring raw concrete surfaces, exposed structural elements, monolithic forms, minimal ornamentation, monochromatic color scheme, industrial materials, dramatic use of light and shadow, bold geometric shapes, overall aesthetic of raw architectural honesty.',

  'boutique-hotel': 'Transform this {roomName} into a boutique hotel-inspired space featuring layered luxury textiles, mix of high and low design, carefully curated art and accessories, statement lighting, rich textures, sophisticated color palette, attention to detail, overall atmosphere of curated hospitality design.',

  'resort-style': 'Transform this {roomName} into a resort-style retreat featuring indoor-outdoor connection, comfortable luxurious furniture, tropical or coastal elements, spa-like qualities, natural materials, calming color palette, lush plants, overall atmosphere of permanent vacation and relaxation.',

  'art-gallery': 'Transform this {roomName} into an art gallery space featuring clean white walls, professional lighting focused on artwork, minimal furniture allowing art to be focal point, neutral floors, simple window treatments, museum-quality presentation, overall aesthetic prioritizing art display.',

  'moroccan': 'Transform this {roomName} into a Moroccan-inspired space featuring rich jewel tones, intricate tile work, carved wood furniture, metal lanterns, layered textiles with geometric patterns, poufs and low seating, arched doorways, brass and copper accents, overall atmosphere of exotic luxury.',

  'asian-fusion': 'Transform this {roomName} into an Asian fusion space featuring mix of Asian design elements (Japanese, Chinese, etc.), low-profile furniture, natural materials like bamboo and stone, paper lanterns, Asian art and calligraphy, neutral color palette with red or gold accents, overall aesthetic of serene East-meets-West harmony.',

  'desert-modern': 'Transform this {roomName} into a desert modern space featuring earthy color palette of terra cotta, sand, and warm neutrals, natural desert materials, adobe-style walls, cacti and succulents, natural wood and leather, Southwestern patterns, large windows framing desert views, overall aesthetic of modern comfort in desert landscape.',

  'english-country': 'Transform this {roomName} into an English country space featuring floral chintz fabrics, antique or reproduction furniture, layered patterns, warm color palette, traditional paintings and prints, cozy textiles, wooden beams if applicable, overall atmosphere of comfortable countryside elegance.',

  'memphis-design': 'Transform this {roomName} into a Memphis Design showcase featuring bold geometric patterns, bright contrasting colors, playful asymmetrical forms, laminate and bright plastics, graphic black and white patterns with color pops, 1980s postmodern aesthetic, overall atmosphere of rebellious playful design.',

  // Special style for spa-like bathrooms
  'spa-like': 'Transform this bathroom into a spa-like sanctuary featuring natural stone or wood elements, soaking tub, rainfall shower, soft neutral color palette, minimalist fixtures, natural textures, ambient lighting, plants, overall atmosphere of tranquil relaxation.',

  // Fallback for playful modern (kids rooms)
  'playful-modern': 'Transform this {roomName} into a playful modern space featuring fun contemporary furniture, bright cheerful colors used thoughtfully, interactive elements, creative storage solutions, durable materials, overall aesthetic of child-friendly modern design that balances fun with style.',
};

// ============================================
// GENERATE TEMPLATES FUNCTION
// ============================================

export function generateAllInteriorTemplates(): GeneratedTemplate[] {
  const templates: GeneratedTemplate[] = [];
  const styleMap = new Map(DESIGN_STYLES.map(s => [s.id, s]));

  // Generate templates for each room-style combination
  for (const [roomType, styleIds] of Object.entries(ROOM_STYLE_MATRIX)) {
    const roomName = roomType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    for (const styleId of styleIds) {
      const style = styleMap.get(styleId);
      if (!style) continue;

      const styleDesc = STYLE_DESCRIPTIONS[styleId] || STYLE_DESCRIPTIONS['contemporary'];
      const fullStyleDesc = styleDesc.replace(/{roomName}/g, roomName);

      const template: GeneratedTemplate = {
        name: `${style.name} ${roomName}`,
        imageUrl: `https://storage.googleapis.com/aistudio-hosting/templates/placeholder-${roomType}-${styleId}.png`,
        prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

${fullStyleDesc}
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
        main_category: 'Interior Design',
        sub_category: 'Design Aesthetics',
        room_type: roomType,
        enabled: true,
        sort_order: style.sortOrder,
        popularity: style.popularity,
      };

      templates.push(template);
    }
  }

  return templates;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTemplatesByPopularity(templates: GeneratedTemplate[]): {
  high: GeneratedTemplate[];
  medium: GeneratedTemplate[];
  low: GeneratedTemplate[];
} {
  return {
    high: templates.filter(t => t.popularity === 'high'),
    medium: templates.filter(t => t.popularity === 'medium'),
    low: templates.filter(t => t.popularity === 'low'),
  };
}

export function getTemplatesByRoom(templates: GeneratedTemplate[]): Record<string, GeneratedTemplate[]> {
  const byRoom: Record<string, GeneratedTemplate[]> = {};
  
  for (const template of templates) {
    const room = template.room_type || 'unknown';
    if (!byRoom[room]) {
      byRoom[room] = [];
    }
    byRoom[room].push(template);
  }

  return byRoom;
}

