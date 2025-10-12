/**
 * COMPLETE Template Generation for MyNook
 * Generates ~180-200 Interior Design templates
 * 32 room types × 44 design styles (curated combinations)
 */

// =============================================================================
// DESIGN STYLES (44 styles)
// =============================================================================

const DESIGN_STYLES = [
  // Minimalist & Modern (8 styles)
  { id: 'modern-minimalist', name: 'Modern Minimalist', popularity: 'high', sortOrder: 10 },
  { id: 'warm-minimalism', name: 'Warm Minimalism', popularity: 'high', sortOrder: 5 },
  { id: 'latte-creamy-style', name: 'Latte / Creamy Style', popularity: 'high', sortOrder: 1 },
  { id: 'japandi', name: 'Japandi', popularity: 'high', sortOrder: 8 },
  { id: 'organic-modern', name: 'Organic Modern', popularity: 'high', sortOrder: 3 },
  { id: 'quiet-luxury', name: 'Quiet Luxury', popularity: 'high', sortOrder: 4 },
  { id: 'contemporary', name: 'Contemporary', popularity: 'medium', sortOrder: 15 },
  { id: 'zen-minimalism', name: 'Zen Minimalism', popularity: 'medium', sortOrder: 20 },

  // Nordic & Natural (6 styles)
  { id: 'scandinavian', name: 'Scandinavian', popularity: 'high', sortOrder: 6 },
  { id: 'nordic-light', name: 'Nordic Light', popularity: 'medium', sortOrder: 18 },
  { id: 'coastal', name: 'Coastal', popularity: 'high', sortOrder: 12 },
  { id: 'cottagecore', name: 'Cottagecore', popularity: 'high', sortOrder: 15 },
  { id: 'rustic-modern', name: 'Rustic Modern', popularity: 'medium', sortOrder: 22 },
  { id: 'natural-biophilic', name: 'Natural Biophilic', popularity: 'medium', sortOrder: 25 },

  // Vintage & Classic (8 styles)
  { id: 'mid-century-modern', name: 'Mid-Century Modern', popularity: 'high', sortOrder: 11 },
  { id: 'art-deco', name: 'Art Deco', popularity: 'medium', sortOrder: 16 },
  { id: 'grandmillennial', name: 'Grandmillennial', popularity: 'high', sortOrder: 13 },
  { id: 'transitional', name: 'Transitional', popularity: 'medium', sortOrder: 17 },
  { id: 'traditional', name: 'Traditional', popularity: 'medium', sortOrder: 24 },
  { id: 'parisian-chic', name: 'Parisian Chic', popularity: 'medium', sortOrder: 19 },
  { id: 'hollywood-regency', name: 'Hollywood Regency', popularity: 'low', sortOrder: 30 },
  { id: 'victorian-modern', name: 'Victorian Modern', popularity: 'low', sortOrder: 32 },

  // Bold & Colorful (7 styles)
  { id: 'bohemian', name: 'Bohemian', popularity: 'high', sortOrder: 14 },
  { id: 'maximalist', name: 'Maximalist', popularity: 'high', sortOrder: 7 },
  { id: 'dopamine-decor', name: 'Dopamine Decor', popularity: 'high', sortOrder: 2 },
  { id: 'eclectic', name: 'Eclectic', popularity: 'medium', sortOrder: 21 },
  { id: 'retro-vintage', name: 'Retro Vintage', popularity: 'medium', sortOrder: 26 },
  { id: 'colorful-contemporary', name: 'Colorful Contemporary', popularity: 'medium', sortOrder: 27 },
  { id: 'memphis-design', name: 'Memphis Design', popularity: 'low', sortOrder: 35 },

  // Industrial & Urban (4 styles)
  { id: 'industrial-loft', name: 'Industrial Loft', popularity: 'medium', sortOrder: 23 },
  { id: 'urban-modern', name: 'Urban Modern', popularity: 'medium', sortOrder: 28 },
  { id: 'brutalist', name: 'Brutalist', popularity: 'low', sortOrder: 36 },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', popularity: 'high', sortOrder: 9 },

  // Luxury & Refined (5 styles)
  { id: 'luxury-glam', name: 'Luxury Glam', popularity: 'medium', sortOrder: 29 },
  { id: 'modern-luxury', name: 'Modern Luxury', popularity: 'medium', sortOrder: 31 },
  { id: 'boutique-hotel', name: 'Boutique Hotel', popularity: 'medium', sortOrder: 33 },
  { id: 'resort-style', name: 'Resort Style', popularity: 'medium', sortOrder: 34 },
  { id: 'art-gallery', name: 'Art Gallery', popularity: 'low', sortOrder: 37 },

  // Themed (6 styles)
  { id: 'tropical', name: 'Tropical', popularity: 'medium', sortOrder: 38 },
  { id: 'mediterranean', name: 'Mediterranean', popularity: 'medium', sortOrder: 39 },
  { id: 'moroccan', name: 'Moroccan', popularity: 'low', sortOrder: 40 },
  { id: 'asian-fusion', name: 'Asian Fusion', popularity: 'low', sortOrder: 41 },
  { id: 'desert-modern', name: 'Desert Modern', popularity: 'low', sortOrder: 42 },
  { id: 'english-country', name: 'English Country', popularity: 'low', sortOrder: 43 },
];

// =============================================================================
// ROOM-STYLE MATRIX (Curated combinations - 32 rooms)
// =============================================================================

const ROOM_STYLE_MATRIX = {
  'living-room': ['latte-creamy-style', 'dopamine-decor', 'organic-modern', 'quiet-luxury', 'warm-minimalism', 'scandinavian', 'maximalist', 'japandi', 'modern-farmhouse', 'modern-minimalist', 'mid-century-modern', 'coastal', 'grandmillennial', 'bohemian', 'contemporary', 'art-deco', 'transitional', 'nordic-light', 'parisian-chic', 'zen-minimalism', 'eclectic', 'rustic-modern', 'industrial-loft', 'traditional', 'natural-biophilic', 'retro-vintage', 'colorful-contemporary', 'urban-modern'],
  
  'master-bedroom': ['latte-creamy-style', 'warm-minimalism', 'quiet-luxury', 'organic-modern', 'scandinavian', 'japandi', 'cottagecore', 'grandmillennial', 'coastal', 'modern-minimalist', 'parisian-chic', 'zen-minimalism', 'bohemian', 'modern-luxury', 'nordic-light', 'transitional', 'resort-style', 'natural-biophilic', 'boutique-hotel', 'traditional', 'contemporary', 'tropical'],
  
  'bedroom': ['latte-creamy-style', 'warm-minimalism', 'scandinavian', 'japandi', 'coastal', 'cottagecore', 'modern-minimalist', 'bohemian', 'grandmillennial', 'nordic-light', 'organic-modern', 'quiet-luxury', 'zen-minimalism', 'natural-biophilic', 'traditional', 'transitional', 'modern-farmhouse', 'contemporary'],
  
  'guest-bedroom': ['latte-creamy-style', 'warm-minimalism', 'scandinavian', 'coastal', 'transitional', 'contemporary', 'modern-minimalist', 'japandi', 'traditional', 'cottagecore', 'nordic-light', 'natural-biophilic'],
  
  'kitchen': ['modern-farmhouse', 'latte-creamy-style', 'scandinavian', 'transitional', 'organic-modern', 'mid-century-modern', 'contemporary', 'industrial-loft', 'mediterranean', 'traditional', 'coastal', 'modern-minimalist', 'urban-modern', 'japandi', 'grandmillennial', 'art-deco', 'modern-luxury', 'asian-fusion', 'english-country', 'rustic-modern'],
  
  'dining-room': ['mid-century-modern', 'art-deco', 'grandmillennial', 'transitional', 'dopamine-decor', 'maximalist', 'hollywood-regency', 'parisian-chic', 'scandinavian', 'modern-farmhouse', 'traditional', 'bohemian', 'contemporary', 'industrial-loft', 'mediterranean', 'coastal', 'latte-creamy-style', 'modern-luxury'],
  
  'bathroom': ['organic-modern', 'scandinavian', 'coastal', 'quiet-luxury', 'japandi', 'modern-minimalist', 'contemporary', 'mediterranean', 'traditional', 'latte-creamy-style', 'zen-minimalism', 'modern-luxury', 'art-deco', 'industrial-loft'],
  
  'master-bathroom': ['organic-modern', 'quiet-luxury', 'modern-luxury', 'resort-style', 'scandinavian', 'japandi', 'latte-creamy-style', 'contemporary', 'zen-minimalism', 'mediterranean', 'coastal', 'boutique-hotel', 'warm-minimalism'],
  
  'powder-room': ['art-deco', 'modern-luxury', 'parisian-chic', 'contemporary', 'bohemian', 'maximalist', 'grandmillennial', 'hollywood-regency', 'mediterranean', 'coastal'],
  
  'home-office': ['modern-minimalist', 'scandinavian', 'mid-century-modern', 'organic-modern', 'industrial-loft', 'urban-modern', 'japandi', 'contemporary', 'quiet-luxury', 'transitional', 'traditional', 'latte-creamy-style', 'zen-minimalism', 'natural-biophilic', 'art-gallery', 'modern-luxury'],
  
  'study-library': ['traditional', 'grandmillennial', 'parisian-chic', 'mid-century-modern', 'art-gallery', 'english-country', 'contemporary', 'modern-minimalist', 'industrial-loft', 'victorian-modern', 'transitional', 'quiet-luxury'],
  
  'kids-room': ['dopamine-decor', 'scandinavian', 'cottagecore', 'colorful-contemporary', 'modern-minimalist', 'natural-biophilic', 'contemporary', 'bohemian', 'nordic-light', 'coastal', 'latte-creamy-style', 'retro-vintage', 'maximalist'],
  
  'nursery': ['latte-creamy-style', 'scandinavian', 'warm-minimalism', 'cottagecore', 'modern-minimalist', 'coastal', 'natural-biophilic', 'organic-modern', 'nordic-light', 'contemporary'],
  
  'teen-room': ['dopamine-decor', 'urban-modern', 'contemporary', 'bohemian', 'industrial-loft', 'colorful-contemporary', 'scandinavian', 'modern-minimalist', 'maximalist', 'eclectic', 'retro-vintage', 'memphis-design'],
  
  'laundry-room': ['modern-farmhouse', 'scandinavian', 'contemporary', 'transitional', 'modern-minimalist', 'coastal', 'industrial-loft', 'organic-modern'],
  
  'mudroom-entryway': ['modern-farmhouse', 'transitional', 'scandinavian', 'contemporary', 'coastal', 'traditional', 'industrial-loft', 'modern-minimalist'],
  
  'walk-in-closet': ['modern-luxury', 'quiet-luxury', 'contemporary', 'parisian-chic', 'scandinavian', 'transitional', 'boutique-hotel', 'modern-minimalist', 'hollywood-regency', 'art-deco'],
  
  'pantry': ['modern-farmhouse', 'scandinavian', 'traditional', 'contemporary', 'coastal', 'transitional', 'modern-minimalist', 'english-country'],
  
  'attic': ['industrial-loft', 'bohemian', 'scandinavian', 'cottagecore', 'contemporary', 'rustic-modern', 'modern-minimalist', 'zen-minimalism', 'natural-biophilic', 'eclectic'],
  
  'basement': ['industrial-loft', 'modern-minimalist', 'contemporary', 'urban-modern', 'traditional', 'mid-century-modern', 'bohemian', 'modern-farmhouse', 'rustic-modern', 'scandinavian'],
  
  'home-theater': ['modern-luxury', 'contemporary', 'hollywood-regency', 'art-deco', 'industrial-loft', 'modern-minimalist', 'urban-modern', 'quiet-luxury', 'brutalist', 'maximalist'],
  
  'game-room': ['dopamine-decor', 'colorful-contemporary', 'industrial-loft', 'urban-modern', 'contemporary', 'retro-vintage', 'memphis-design', 'maximalist', 'eclectic', 'modern-minimalist'],
  
  'home-gym': ['modern-minimalist', 'industrial-loft', 'contemporary', 'urban-modern', 'organic-modern', 'scandinavian', 'zen-minimalism', 'natural-biophilic', 'brutalist', 'modern-luxury'],
  
  'yoga-meditation-room': ['zen-minimalism', 'japandi', 'natural-biophilic', 'organic-modern', 'scandinavian', 'warm-minimalism', 'modern-minimalist', 'coastal', 'asian-fusion', 'resort-style'],
  
  'home-bar': ['art-deco', 'hollywood-regency', 'industrial-loft', 'mid-century-modern', 'modern-luxury', 'urban-modern', 'contemporary', 'maximalist', 'parisian-chic', 'traditional'],
  
  'music-room': ['mid-century-modern', 'bohemian', 'industrial-loft', 'contemporary', 'eclectic', 'scandinavian', 'modern-minimalist', 'art-gallery', 'urban-modern', 'maximalist'],
  
  'craft-hobby-room': ['scandinavian', 'dopamine-decor', 'contemporary', 'cottagecore', 'bohemian', 'colorful-contemporary', 'modern-farmhouse', 'eclectic', 'natural-biophilic', 'nordic-light'],
  
  'hallway-corridor': ['contemporary', 'transitional', 'scandinavian', 'modern-minimalist', 'parisian-chic', 'art-gallery', 'industrial-loft', 'traditional', 'grandmillennial', 'modern-luxury'],
  
  'staircase': ['contemporary', 'modern-minimalist', 'industrial-loft', 'traditional', 'transitional', 'scandinavian', 'art-deco', 'mid-century-modern', 'modern-luxury', 'parisian-chic'],
  
  'sunroom-conservatory': ['coastal', 'tropical', 'natural-biophilic', 'scandinavian', 'cottagecore', 'mediterranean', 'organic-modern', 'bohemian', 'english-country', 'resort-style', 'contemporary', 'modern-farmhouse'],
  
  'balcony-terrace': ['coastal', 'mediterranean', 'tropical', 'scandinavian', 'modern-minimalist', 'contemporary', 'resort-style', 'bohemian', 'urban-modern', 'natural-biophilic'],
  
  'garage': ['industrial-loft', 'urban-modern', 'modern-minimalist', 'contemporary', 'scandinavian', 'brutalist', 'transitional', 'modern-farmhouse'],
};

// =============================================================================
// STYLE DESCRIPTIONS (Simplified for brevity)
// =============================================================================

const STYLE_DESCRIPTIONS = {
  'latte-creamy-style': 'Transform this {roomName} into a dreamy latte-style sanctuary featuring walls in warm cream or latte tones with smooth matte plaster finish, light natural oak flooring, furniture with soft rounded edges in plush boucle fabric in rich caramel and oatmeal tones, layered textures, warm ambient lighting, creating an Instagram-worthy cocoon of warmth.',
  'dopamine-decor': 'Transform this {roomName} into a joyful dopamine-boosting paradise featuring walls painted in cheerful colors like soft coral, sunny yellow, or fresh sage green, furniture with vibrant upholstery mixing happy colors, colorful accessories, playful wall art, creating a vibrant energizing atmosphere.',
  'organic-modern': 'Transform this {roomName} into an organic modern sanctuary featuring natural stone or warm plaster walls, wide-plank wood flooring, furniture in natural wood with organic curved forms, sculptural lighting, abundant plants, creating a serene spa-like atmosphere.',
  'quiet-luxury': 'Transform this {roomName} into a quiet luxury haven featuring sophisticated neutral tones, wide-plank hardwood or plush carpet, elegant furniture in bouclé or premium linen, exquisite textiles, refined hardware, creating understated elegance through superior quality.',
  'warm-minimalism': 'Transform this {roomName} into a warm minimalist retreat featuring soft warm white walls, wide-plank light oak flooring, furniture with clean lines in natural materials, sparse intentional decor, creating sophisticated simplicity with inviting warmth.',
  'scandinavian': 'Transform this {roomName} into a Scandinavian hygge haven with crisp white walls, light oak flooring, functional furniture with clean lines, cozy textiles, minimal Nordic decor, abundant natural light, creating warmth and effortless comfort.',
  'maximalist': 'Transform this {roomName} into a bold maximalist showcase featuring dramatic wallpaper or rich colors, layered furniture and textiles, gallery walls, statement lighting, abundant decorative accessories, creating abundant personality and visual richness.',
  'japandi': 'Transform this {roomName} into a Japandi haven featuring smooth walls in soft neutral tones, bamboo or oak flooring, minimalist furniture with clean lines, Japanese-inspired elements, neutral palette with matte black accents, creating focused calm and mindfulness.',
  'modern-farmhouse': 'Transform this {roomName} into a modern farmhouse masterpiece featuring white painted surfaces, natural wood elements, shiplap walls, wide-plank hardwood, modern fixtures in matte black or brass, creating rustic warmth with clean functionality.',
  'modern-minimalist': 'Transform this {roomName} into a modern minimalist sanctuary featuring smooth white or gray walls, rich wood flooring, furniture with clean geometric lines, minimal decor, creating sophisticated calm through simplicity.',
  'mid-century-modern': 'Transform this {roomName} into a mid-century modern showcase with organic shapes, tapered legs, teak or walnut wood, statement lighting, pops of color in mustard yellow or burnt orange, geometric patterns, functional elegance with retro charm.',
  'coastal': 'Transform this {roomName} into a coastal retreat with crisp white walls, light weathered oak flooring, natural linen or white cotton upholstery, rattan accent pieces, soft blue and white textiles, natural jute rug, creating light airy breezy seaside atmosphere.',
  'contemporary': 'Transform this {roomName} into a sleek contemporary space featuring clean lines, neutral palette, mix of textures, modern furniture with simple forms, minimal accessories, quality materials, current design trends executed with restraint.',
  'traditional': 'Transform this {roomName} into a classic traditional space featuring rich wood furniture, formal symmetrical arrangements, detailed moldings, traditional patterns, classic color palette, elegant lighting, timeless elegance.',
  'cottagecore': 'Transform this {roomName} into a charming cottagecore retreat featuring delicate floral patterns, soft colors, vintage-inspired furniture, lace curtains, dried flowers, woven baskets, romantic pastoral aesthetic.',
  'transitional': 'Transform this {roomName} into a refined transitional space blending traditional and contemporary elements, neutral walls, mix of classic and modern furniture, balanced lines, simple window treatments, comfortable elegance.',
  'bohemian': 'Transform this {roomName} into a bohemian paradise with warm earthy tones, layered vintage rugs, colorful patterned cushions, mix of vintage and handcrafted furniture, macramé wall hangings, abundant plants, relaxed free-spirited atmosphere.',
  'grandmillennial': 'Transform this {roomName} into a charming grandmillennial sanctuary featuring delicate floral wallpaper, classic furniture with skirted slipcovers, vintage chandelier, blue and white porcelain, embroidered linens, fresh flowers, elegant with youthful interpretation.',
  'industrial-loft': 'Transform this {roomName} into an industrial loft with exposed brick walls, polished concrete flooring, exposed metal pipes, tall windows with black frames, distressed leather furniture, reclaimed wood tables, vintage factory lighting, raw urban aesthetic.',
  'art-deco': 'Transform this {roomName} into an Art Deco masterpiece featuring rich colors with metallic accents, geometric patterns, luxurious materials like velvet and marble, metallic finishes in gold and brass, symmetrical layouts, 1920s glamorous elegance.',
  'parisian-chic': 'Transform this {roomName} into a Parisian chic retreat featuring Haussmann-style details, herringbone wood floors, French antique furniture, tufted upholstery, ornate gilt-frame mirrors, crystal chandeliers, soft palette of whites and creams, effortless elegance.',
  'tropical': 'Transform this {roomName} into a tropical paradise featuring natural materials like rattan and bamboo, lush greenery with large-leaf plants, vibrant natural colors, natural fiber rugs, light airy fabrics, tropical prints, vacation-like relaxation.',
  'mediterranean': 'Transform this {roomName} into a Mediterranean retreat featuring textured walls in warm whites or terra cotta, terracotta tile or natural stone flooring, arched doorways, wrought iron details, blue and white ceramics, warm rustic elegance.',
  'zen-minimalism': 'Transform this {roomName} into a Zen sanctuary featuring smooth neutral walls, natural wood or stone flooring, low-profile dark wood furniture, minimal decor, natural elements like stones and bamboo, soft diffused lighting, atmosphere of meditation and peace.',
  'rustic-modern': 'Transform this {roomName} into a rustic modern space featuring reclaimed wood elements, mix of rough and smooth textures, modern furniture with rustic materials, neutral palette with natural wood tones, industrial-style lighting, rugged natural materials with contemporary design.',
  'natural-biophilic': 'Transform this {roomName} into a biophilic haven featuring abundant plants, natural materials like wood and stone, large windows maximizing natural light, organic shapes, earthy color palette, overall design prioritizing connection to nature.',
  'nordic-light': 'Transform this {roomName} into a Nordic light-filled space featuring all-white or pale surfaces, maximized natural light, minimal furniture in light wood, sheer or no window treatments, simple forms, candles, bright airy simplicity with focus on light.',
  'urban-modern': 'Transform this {roomName} into an urban modern space featuring sleek contemporary furniture, mix of industrial and refined elements, neutral palette with bold accents, modern art, metal and glass details, sophisticated city living.',
  'colorful-contemporary': 'Transform this {roomName} into a colorful contemporary space featuring vibrant color palette used thoughtfully, modern furniture forms, bold artwork, mix of coordinating patterns, contemporary lighting, playful yet sophisticated atmosphere.',
  'eclectic': 'Transform this {roomName} into an eclectic mix featuring diverse furniture styles from different periods, curated collections, bold colors and patterns skillfully mixed, global influences, vintage and contemporary pieces together, collected-over-time individuality.',
  'retro-vintage': 'Transform this {roomName} into a retro vintage space featuring furniture from 50s-70s, bold patterns and period colors, vintage lighting fixtures, nostalgic accessories, mix of authentic and reproduction pieces, period-specific playful charm.',
  'luxury-glam': 'Transform this {roomName} into a glamorous luxury space featuring rich jewel tones, velvet and silk fabrics, metallic finishes in gold and silver, crystal chandeliers, tufted upholstery, mirrored furniture, dramatic lighting, Hollywood glamour and opulence.',
  'modern-luxury': 'Transform this {roomName} into a modern luxury showcase featuring high-end materials like marble and exotic woods, designer furniture, custom millwork, statement lighting, sophisticated neutral palette with metallic accents, cutting-edge technology, contemporary opulence.',
  'boutique-hotel': 'Transform this {roomName} into a boutique hotel-inspired space featuring layered luxury textiles, mix of high and low design, carefully curated art, statement lighting, rich textures, sophisticated palette, curated hospitality design.',
  'resort-style': 'Transform this {roomName} into a resort-style retreat featuring indoor-outdoor connection, comfortable luxurious furniture, tropical or coastal elements, spa-like qualities, natural materials, calming palette, lush plants, permanent vacation atmosphere.',
  'art-gallery': 'Transform this {roomName} into an art gallery space featuring clean white walls, professional lighting focused on artwork, minimal furniture allowing art as focal point, neutral floors, simple treatments, museum-quality presentation.',
  'moroccan': 'Transform this {roomName} into a Moroccan-inspired space featuring rich jewel tones, intricate tile work, carved wood furniture, metal lanterns, layered textiles with geometric patterns, poufs and low seating, arched doorways, brass and copper accents, exotic luxury.',
  'asian-fusion': 'Transform this {roomName} into an Asian fusion space featuring mix of Asian design elements, low-profile furniture, natural materials like bamboo and stone, paper lanterns, Asian art and calligraphy, neutral palette with red or gold accents, serene East-meets-West harmony.',
  'desert-modern': 'Transform this {roomName} into a desert modern space featuring earthy color palette of terra cotta and sand, natural desert materials, adobe-style walls, cacti and succulents, natural wood and leather, Southwestern patterns, modern comfort in desert landscape.',
  'english-country': 'Transform this {roomName} into an English country space featuring floral chintz fabrics, antique or reproduction furniture, layered patterns, warm colors, traditional paintings, cozy textiles, wooden beams, comfortable countryside elegance.',
  'memphis-design': 'Transform this {roomName} into a Memphis Design showcase featuring bold geometric patterns, bright contrasting colors, playful asymmetrical forms, laminate and bright plastics, graphic black and white patterns with color pops, 1980s postmodern rebellious playful design.',
  'hollywood-regency': 'Transform this {roomName} into a Hollywood Regency showcase featuring bold black and white contrasts, lacquered furniture, mirrored surfaces, chinoiserie elements, animal prints, tufted velvet, geometric patterns, brass and gold accents, 1940s Hollywood glamour.',
  'victorian-modern': 'Transform this {roomName} into a Victorian modern space featuring traditional Victorian architectural details updated with contemporary furnishings, mix of ornate and simple elements, modern color palette, updated Victorian-era patterns, historical character with modern livability.',
  'brutalist': 'Transform this {roomName} into a brutalist space featuring raw concrete surfaces, exposed structural elements, monolithic forms, minimal ornamentation, monochromatic color scheme, industrial materials, dramatic light and shadow, bold geometric shapes, raw architectural honesty.',
};

// =============================================================================
// PROMPT TEMPLATE
// =============================================================================

const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings) and existing elements within the input image MUST BE COMPLETELY REPLACED according to the specified style.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions from the user's input image.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail. The image should evoke a sense of sophisticated comfort, suitable for features in leading design publications.

Employ soft, natural, and inviting lighting with ample diffused natural light.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail and vibrant color accuracy.`;

// =============================================================================
// TEMPLATE GENERATION
// =============================================================================

function generateTemplates() {
  const templates = [];
  const styleMap = new Map(DESIGN_STYLES.map(s => [s.id, s]));

  for (const [roomType, styleIds] of Object.entries(ROOM_STYLE_MATRIX)) {
    const roomName = roomType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    for (const styleId of styleIds) {
      const style = styleMap.get(styleId);
      if (!style) continue;

      const styleDesc = STYLE_DESCRIPTIONS[styleId] || STYLE_DESCRIPTIONS['contemporary'];
      const fullStyleDesc = styleDesc.replace(/{roomName}/g, roomName);

      const prompt = `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

${fullStyleDesc}
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook
// Recipe Version: MyNook-V1.0-Universal`;

      templates.push({
        name: `${style.name} ${roomName}`,
        imageUrl: `https://storage.googleapis.com/aistudio-hosting/templates/placeholder-${roomType}-${styleId}.png`,
        prompt: prompt,
        main_category: 'Interior Design',
        sub_category: 'Design Aesthetics',
        room_type: roomType,
        enabled: true,
        sort_order: style.sortOrder,
        popularity: style.popularity,
      });
    }
  }

  return templates;
}

// =============================================================================
// SQL GENERATION
// =============================================================================

function escapeSql(text) {
  return text.replace(/'/g, "''");
}

function generateSQL() {
  const templates = generateTemplates();
  
  console.error('╔════════════════════════════════════════════════════════════╗');
  console.error('║      MyNook COMPLETE Template System SQL Generation       ║');
  console.error('╚════════════════════════════════════════════════════════════╝\n');
  console.error(`📊 Total templates: ${templates.length}\n`);
  
  // Statistics
  const byRoom = {};
  const byPopularity = { high: 0, medium: 0, low: 0 };
  templates.forEach(t => {
    byRoom[t.room_type] = (byRoom[t.room_type] || 0) + 1;
    byPopularity[t.popularity]++;
  });
  
  console.error('📈 By room type:');
  Object.entries(byRoom).sort(([,a], [,b]) => b - a).forEach(([room, count]) => {
    console.error(`   ${room}: ${count}`);
  });
  console.error('');
  console.error('🔥 By priority:');
  console.error(`   High: ${byPopularity.high}`);
  console.error(`   Medium: ${byPopularity.medium}`);
  console.error(`   Low: ${byPopularity.low}\n`);
  
  // SQL Header
  console.log('-- =================================================================');
  console.log('-- MyNook COMPLETE Template System Import');
  console.log(`-- Total Templates: ${templates.length}`);
  console.log(`-- Room Types: ${Object.keys(byRoom).length}`);
  console.log(`-- Design Styles: ${DESIGN_STYLES.length}`);
  console.log('-- Generated:', new Date().toISOString());
  console.log('-- =================================================================\n');
  
  console.log('-- Step 1: Clear existing Interior Design templates');
  console.log("DELETE FROM public.design_templates WHERE main_category = 'Interior Design';\n");
  
  console.log('-- Step 2: Insert all templates');
  console.log(`-- Total: ${templates.length} templates\n`);
  
  // Generate INSERT statements
  templates.forEach((t, i) => {
    const sql = `INSERT INTO public.design_templates (name, image_url, prompt, main_category, sub_category, room_type, enabled, sort_order)
VALUES (
  '${escapeSql(t.name)}',
  '${escapeSql(t.imageUrl)}',
  '${escapeSql(t.prompt)}',
  '${escapeSql(t.main_category)}',
  '${escapeSql(t.sub_category)}',
  '${escapeSql(t.room_type)}',
  ${t.enabled},
  ${t.sort_order}
);`;
    
    console.log(sql);
    console.log('');
    
    if ((i + 1) % 50 === 0) {
      console.log(`-- Progress: ${i + 1}/${templates.length} (${((i + 1) / templates.length * 100).toFixed(1)}%)\n`);
    }
  });
  
  console.log('-- =================================================================');
  console.log(`-- Import Complete! Total: ${templates.length} templates`);
  console.log('-- =================================================================');
  
  console.error('\n✅ SQL file generated!');
  console.error(`📄 File: scripts/complete-import.sql`);
  console.error(`📊 Size: ${templates.length} templates`);
  console.error('\n📝 Next steps:');
  console.error('   1. Open Supabase SQL Editor');
  console.error('   2. Copy and paste the SQL above');
  console.error('   3. Execute');
  console.error('   4. Verify in Table Editor\n');
}

// Run
generateSQL();

