/**
 * Generate SQL import statements for templates
 * This script generates SQL that can be executed via Supabase MCP
 */

// Design Styles (simplified - top 15 high-priority styles for demo)
const DESIGN_STYLES = [
  { id: 'latte-creamy-style', name: 'Latte / Creamy Style', popularity: 'high', sortOrder: 1 },
  { id: 'dopamine-decor', name: 'Dopamine Decor', popularity: 'high', sortOrder: 2 },
  { id: 'organic-modern', name: 'Organic Modern', popularity: 'high', sortOrder: 3 },
  { id: 'quiet-luxury', name: 'Quiet Luxury', popularity: 'high', sortOrder: 4 },
  { id: 'warm-minimalism', name: 'Warm Minimalism', popularity: 'high', sortOrder: 5 },
  { id: 'scandinavian', name: 'Scandinavian', popularity: 'high', sortOrder: 6 },
  { id: 'maximalist', name: 'Maximalist', popularity: 'high', sortOrder: 7 },
  { id: 'japandi', name: 'Japandi', popularity: 'high', sortOrder: 8 },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', popularity: 'high', sortOrder: 9 },
  { id: 'modern-minimalist', name: 'Modern Minimalist', popularity: 'high', sortOrder: 10 },
];

// Room-Style Matrix (simplified - top 5 rooms)
const ROOM_STYLE_MATRIX = {
  'living-room': ['latte-creamy-style', 'dopamine-decor', 'organic-modern', 'quiet-luxury', 'warm-minimalism', 'scandinavian', 'maximalist', 'japandi', 'modern-farmhouse', 'modern-minimalist'],
  'master-bedroom': ['latte-creamy-style', 'warm-minimalism', 'quiet-luxury', 'organic-modern', 'scandinavian', 'japandi'],
  'kitchen': ['modern-farmhouse', 'latte-creamy-style', 'scandinavian', 'organic-modern', 'modern-minimalist'],
  'bathroom': ['organic-modern', 'scandinavian', 'quiet-luxury', 'japandi', 'modern-minimalist'],
  'home-office': ['modern-minimalist', 'scandinavian', 'organic-modern', 'japandi', 'quiet-luxury'],
};

// Base prompt (simplified)
const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings) and existing elements within the input image MUST BE COMPLETELY REPLACED according to the specified style.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions from the user's input image.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail. The image should evoke a sense of sophisticated comfort, suitable for features in leading design publications.

Employ soft, natural, and inviting lighting with ample diffused natural light.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail and vibrant color accuracy.`;

// Style descriptions (simplified)
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
};

// Escape single quotes for SQL
function escapeSql(text) {
  return text.replace(/'/g, "''");
}

// Generate templates
function generateTemplates() {
  const templates = [];
  const styleMap = new Map(DESIGN_STYLES.map(s => [s.id, s]));

  for (const [roomType, styleIds] of Object.entries(ROOM_STYLE_MATRIX)) {
    const roomName = roomType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    for (const styleId of styleIds) {
      const style = styleMap.get(styleId);
      if (!style) continue;

      const styleDesc = STYLE_DESCRIPTIONS[styleId] || '';
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
      });
    }
  }

  return templates;
}

// Generate SQL INSERT statements
function generateSQL() {
  const templates = generateTemplates();
  
  console.log('-- Generated Templates Import SQL');
  console.log('-- Total templates:', templates.length);
  console.log('-- Generated at:', new Date().toISOString());
  console.log('');
  
  console.log('-- First, clear existing Interior Design templates');
  console.log("DELETE FROM public.design_templates WHERE main_category = 'Interior Design';");
  console.log('');
  
  console.log('-- Insert new templates');
  
  for (const template of templates) {
    const sql = `INSERT INTO public.design_templates (name, image_url, prompt, main_category, sub_category, room_type, enabled, sort_order)
VALUES (
  '${escapeSql(template.name)}',
  '${escapeSql(template.imageUrl)}',
  '${escapeSql(template.prompt)}',
  '${escapeSql(template.main_category)}',
  '${escapeSql(template.sub_category)}',
  '${escapeSql(template.room_type)}',
  ${template.enabled},
  ${template.sort_order}
);`;
    
    console.log(sql);
    console.log('');
  }
  
  console.log('-- Import complete!');
  console.log('-- Total templates imported:', templates.length);
}

// Run the generation
generateSQL();

