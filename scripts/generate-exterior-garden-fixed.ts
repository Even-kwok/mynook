/**
 * 重新生成 Exterior Design 和 Garden & Backyard 模板
 * 
 * Exterior Design: 按建筑类型分类，每个建筑类型有多个风格选项
 * Garden & Backyard: 按花园功能或区域分类
 */

export interface FixedTemplate {
  name: string;
  imageUrl: string;
  prompt: string;
  main_category: string;
  sub_category: string; // 对Exterior是建筑类型，对Garden是功能区域
  room_type: null;
  enabled: boolean;
  sort_order: number;
}

const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.`;

// ============================================
// EXTERIOR DESIGN - 按建筑类型分类
// ============================================

export const EXTERIOR_TEMPLATES: FixedTemplate[] = [
  
  // ========== MODERN HOUSE ==========
  {
    name: 'Modern House - Contemporary Minimalist',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-modern-house-contemporary.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this modern house exterior into a contemporary minimalist masterpiece featuring clean geometric forms with sharp lines and cubic volumes, floor-to-ceiling glass windows with minimal black aluminum frames maximizing natural light, smooth white or light gray stucco facade creating crisp modern appearance, flat or low-slope roof with hidden drainage and roofline lighting, cantilevered second floor creating dramatic overhang and covered entry, polished concrete driveway and walkways, modern landscaping with architectural plants like ornamental grasses and sculptural evergreens in linear arrangements, integrated outdoor lighting with recessed LED strips and modern fixtures, minimalist house numbers in contemporary font, single front door in natural wood or black metal with concealed hardware, no decorative elements or ornamentation, monochromatic color scheme emphasizing form over decoration, seamless indoor-outdoor connection visible through large windows, overall aesthetic of sophisticated simplicity with bold architectural statements.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Modern House',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Modern House - Scandinavian Style',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-modern-house-scandinavian.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this modern house exterior into Scandinavian-inspired design featuring white or light gray painted wood siding in vertical or horizontal orientation, simple pitched roof in dark gray or black, large windows with thin black frames bringing abundant natural light, natural wood accents around entrance and as decorative cladding in light pine or spruce tones, minimal ornamentation emphasizing functional beauty and honest materials, single-color facade with one accent material, modern entrance with natural wood door, subtle integrated lighting, native landscaping with evergreen trees and low-maintenance plants, gravel or stone pathways in natural tones, connection between interior and exterior spaces, optional wood storage area or carport with matching aesthetic, neutral color palette of whites, grays, blacks and natural wood, sustainable materials and energy-efficient design, overall aesthetic of Nordic simplicity emphasizing quality craftsmanship, natural materials, and harmony with nature creating peaceful sophisticated home embodying hygge lifestyle principles.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Modern House',
    room_type: null,
    enabled: true,
    sort_order: 2
  },
  {
    name: 'Modern House - Industrial Modern',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-modern-house-industrial.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this modern house exterior into industrial modern style featuring mix of materials including cor-ten steel panels showing rust patina, smooth concrete walls, and large expanses of glass with black metal frames, exposed steel beams and structural elements as design features, metal roof in standing seam or corrugated profile, large industrial-style windows and sliding doors, concrete block or poured concrete as primary materials, visible bolts and metal fasteners as decorative elements, minimal landscaping with drought-tolerant plants and gravel beds, concrete pathways and driveways showing formwork marks, metal stairs and railings with cable or mesh infill, Edison bulb style outdoor lighting or industrial cage fixtures, house numbers in metal letters or stenciled on concrete, flat or slightly angled rooflines, raw and honest material expression, color palette of grays, blacks, rust tones and natural concrete, overall aesthetic of urban industrial chic with warehouse-inspired design creating bold contemporary statement celebrating raw materials and structural honesty.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Modern House',
    room_type: null,
    enabled: true,
    sort_order: 3
  },

  // ========== BEACH HOUSE ==========
  {
    name: 'Beach House - Coastal Contemporary',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-beach-house-contemporary.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this beach house into coastal contemporary style featuring crisp white or light gray horizontal siding, large windows and sliding glass doors maximizing ocean views, modern flat or low-pitch roof in light color, elevated foundation or pilings showing underneath, wraparound deck or multiple balconies with glass or cable railings, outdoor shower with modern fixtures, nautical details expressed through clean lines rather than literal motifs, modern metal roof for durability, hurricane-rated windows and doors, coastal landscaping with native grasses, palms and salt-tolerant plants, sandy or shell pathways, modern outdoor furniture on decks, white or light wood decking material, contemporary lighting with marine-grade finishes, minimalist house numbers, storage for beach equipment integrated into design, light reflecting surfaces, colors complementing beach environment with whites, light blues, sandy beiges, overall aesthetic of modern coastal living with sophisticated restraint celebrating ocean views and beach lifestyle through contemporary lens.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Beach House',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Beach House - Traditional Coastal',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-beach-house-traditional.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this beach house into traditional coastal style featuring weathered wood shingle siding in soft gray or natural cedar tones, white trim around windows and doors, pitched roof with asphalt or cedar shingles, covered front porch with white columns or posts, traditional multi-pane windows with white frames, decorative shutters in coordinating colors, white picket fence or simple wooden fence, raised foundation with lattice skirting, outdoor shower with traditional fixtures and wood surround, rope details on railings, ship lap siding in protected areas, coastal landscaping with beach roses, hydrangeas and ornamental grasses, natural stone or wood plank walkways, weathered wood or wicker furniture on porch, traditional lantern-style lighting, nautical accents like oars or anchors as subtle decorations, soft color palette of weathered grays, whites, soft blues and natural wood tones, overall aesthetic of classic New England or Hamptons beach cottage with timeless charm and relaxed elegance celebrating traditional seaside architecture.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Beach House',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== MEDITERRANEAN VILLA ==========
  {
    name: 'Mediterranean Villa - Classic Style',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-mediterranean-villa-classic.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this villa into classic Mediterranean style featuring warm cream or soft yellow stucco walls with subtle texture, red clay barrel tile roof with generous overhangs, arched windows and doorways with decorative iron grilles, wrought iron balconies with ornate scrollwork patterns, massive stone or brick chimney, carved wooden doors with iron hardware and studs, decorative tile work around entrances and windows in traditional patterns, stone or brick lower facade or accent walls, climbing bougainvillea or jasmine vines on walls and pergolas, courtyard with fountain as focal point, terra cotta tile pathways and patios, columned portico or loggia providing shade, terracotta planters with citrus trees and herbs, outdoor dining area under vine-covered pergola, warm copper or wrought iron light fixtures in lantern shapes, stone stairs and terraces, aged copper gutters and downspouts, warm earthy color palette of terracottas, creams, ochres, overall aesthetic of old-world Mediterranean elegance evoking Italian or Spanish coastal villas with romantic timeless appeal.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Mediterranean Villa',
    room_type: null,
    enabled: true,
    sort_order: 1
  },

  {
    name: 'Mediterranean Villa - Modern Interpretation',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-mediterranean-villa-modern.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this villa into modern Mediterranean style featuring clean-lined stucco walls in warm white or light beige, simplified red clay tile roof with minimal overhang, large contemporary windows and sliding glass doors, minimalist arched details without excessive ornamentation, sleek wrought iron railings with simple geometric patterns, natural stone accent walls in limestone or travertine, modern outdoor spaces with concrete and stone paving, sculptural olive trees and lavender in contemporary planters, water feature with modern design, outdoor kitchen with clean lines, pergola with simple straight beams, climbing plants controlled and manicured, modern lighting fixtures in bronze or copper finish, glass railings on balconies mixed with traditional elements, updated color palette remaining warm and inviting, overall aesthetic of Mediterranean tradition meeting contemporary design creating fresh sophisticated interpretation of classic style with emphasis on light, outdoor living and connection to landscape while maintaining modern sensibility.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Mediterranean Villa',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== FARMHOUSE ==========
  {
    name: 'Farmhouse - Modern Farmhouse',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-farmhouse-modern.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this farmhouse into modern farmhouse style featuring white or light gray board-and-batten siding or horizontal lap siding, steep-pitched metal roof in charcoal or black with standing seams, large black-framed windows in modern proportions, wraparound porch with square white columns or posts, mix of traditional and contemporary elements, stone or brick accent walls, modern garage doors with windows, clean simple trim without excessive detail, black or dark-colored shutters as accents, metal roof extending over porch, professional landscaping with mix of formal and informal plantings, boxwoods, ornamental grasses and perennials, stone or concrete pathways, modern outdoor lighting with farmhouse aesthetic, neutral color palette emphasizing black and white contrast, large sliding barn door as statement element, balance of rustic charm and modern sophistication, overall aesthetic of Instagram-worthy modern farmhouse with fresh updated take on traditional American farm architecture creating approachable luxury perfect for contemporary families.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Farmhouse',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Farmhouse - Traditional Country',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-farmhouse-traditional.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this farmhouse into traditional country style featuring white or cream painted wood siding, classic gable roof with asphalt shingles, full-width front porch with white columns and railings, multi-pane double-hung windows with functional shutters, red or white painted front door with screen door, metal roof over porch in traditional profile, stone or brick chimney, practical mudroom entrance, attached garage or detached barn in matching style, foundation plantings with traditional shrubs and flowers, split-rail or white picket fence sections, gravel or dirt driveway, mature shade trees, vegetable garden visible, traditional barn-style light fixtures, window boxes with seasonal flowers, weathervane or cupola details, classic colors of white, cream with black or dark green trim, overall aesthetic of authentic American farmhouse with working farm heritage, practical design meeting family needs while maintaining historical character creating welcoming home with genuine rural charm.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Farmhouse',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== COTTAGE ==========
  {
    name: 'Cottage - English Cottage',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-cottage-english.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this cottage into charming English cottage style featuring stone or stucco exterior in cream or warm white, steep-pitched roof with slate or clay tiles showing weathering, small multi-pane casement windows with flower boxes overflowing with blooms, heavy wooden door with iron hardware, climbing roses and vines covering portions of walls, stone chimney with traditional design, uneven roofline suggesting additions over time, cottage garden surrounding home with mixed perennials, stone pathway meandering to entrance, low stone wall or hedge boundary, wooden gate with climbing plants, thatched roof elements if appropriate, dormers with decorative trim, shutters in soft colors, traditional lantern lighting, irregular stone or brick walkway, mature plantings giving established feel, color palette of natural stone, weathered wood, soft greens and flower colors, overall aesthetic of storybook cottage with romantic English countryside charm, slightly irregular and imperfect adding to authentic character creating fairytale-like dwelling that feels centuries old.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Cottage',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Cottage - Coastal Cottage',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-cottage-coastal.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this cottage into coastal cottage style featuring weathered wood shingle siding in soft gray or white, pitched roof with cedar shakes or asphalt shingles, small scale and compact footprint, covered porch with simple posts, white or light-colored trim, traditional windows with white frames, decorative shutters in soft blue or green, white picket fence or natural wood fence, beach-appropriate landscaping with native grasses, hydrangeas and roses, sandy or shell pathways, nautical details like rope accents or ship lap, outdoor shower, weathered wood or wicker furniture on porch, lantern-style lighting, window boxes with trailing plants, charming small-scale details, relaxed casual aesthetic, soft color palette of weathered grays, whites, soft blues reflecting beach environment, overall aesthetic of unpretentious beach retreat with cozy intimate scale and relaxed seaside charm perfect for summer getaways creating welcoming cottage that celebrates simple pleasures of coastal living.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Cottage',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== VICTORIAN HOUSE ==========
  {
    name: 'Victorian House - Classic Victorian',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-victorian-classic.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this house into classic Victorian style featuring asymmetrical facade with varied rooflines and decorative gables, ornate trim work including gingerbread details and decorative brackets, wrap-around porch with turned posts and spindle railings, bay windows and turret if appropriate, painted in multiple coordinating colors highlighting architectural details (painted lady style), fish scale or decorative shingle patterns on gables, tall narrow windows with decorative headers, ornamental iron cresting on roof peaks, stained glass accent windows, elaborate front door with carved details and sidelights, decorative corbels under eaves, variety of textures on facade, period-appropriate landscaping with Victorian-era plants, iron fence with decorative posts, gas-lamp style lighting fixtures, intricate color scheme of 3-5 coordinating colors, overall aesthetic of ornate Victorian elegance with attention to architectural detail and craftsmanship representing height of Victorian era design with romantic historical character.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Victorian House',
    room_type: null,
    enabled: true,
    sort_order: 1
  },

  // ========== COLONIAL HOUSE ==========
  {
    name: 'Colonial House - Traditional Colonial',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-colonial-traditional.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this house into traditional colonial style featuring symmetrical facade with central entrance, evenly spaced multi-pane windows on either side, white or cream painted wood siding or brick in red or warm tones, black shutters on all windows, columned front entry with pediment or portico, steep-pitched gable roof with minimal overhang, central chimney or symmetrical chimneys, paneled front door painted black or dark color with brass hardware, transom window or sidelights flanking door, simple classical trim details, formal landscaping with foundation plantings of boxwoods and symmetrical arrangements, brick or stone walkway centered on entrance, traditional lantern lighting flanking door, attached garage set back from main facade, dormers in roof maintaining symmetry, white painted trim contrasting with main color, historically appropriate color palette, overall aesthetic of American colonial elegance with historical accuracy, formal symmetry and classical proportions representing traditional colonial architecture with timeless appeal and dignified presence.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Colonial House',
    room_type: null,
    enabled: true,
    sort_order: 1
  },

  // ========== RANCH HOUSE ==========
  {
    name: 'Ranch House - Mid-Century Ranch',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-ranch-midcentury.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this house into mid-century ranch style featuring long low horizontal profile with single story design, low-pitched or flat roofline with wide overhangs, large picture windows and sliding glass doors, mixed materials including brick, wood, and stone, attached garage integrated into facade, breezeway connecting spaces, clerestory windows adding light, minimal decorative details with emphasis on clean lines, natural materials and their honest expression, stone or brick accent wall, horizontal wood siding in natural or painted finish, post-and-beam construction visible, open carport or covered entry, period-appropriate landscaping with native plants and geometric beds, concrete or aggregate pathways, modern desert or California ranch aesthetic, large windows bringing outdoors in, color palette of earth tones with period accent colors, overall aesthetic of classic American ranch house from 1950s-60s celebrating indoor-outdoor living, casual family lifestyle and connection to landscape with optimistic mid-century modern sensibility.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Ranch House',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
];

// ============================================
// GARDEN & BACKYARD - 按功能区域分类
// ============================================

export const GARDEN_TEMPLATES: FixedTemplate[] = [
  
  // ========== 前院 / Front Yard ==========
  {
    name: 'Front Yard - Modern Minimalist',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-front-modern.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this front yard into modern minimalist design featuring clean geometric lines and architectural plantings, limited plant palette with repetition of 2-3 species for unified look, structural evergreens like boxwood spheres or columnar junipers in symmetrical arrangements, hardscaping with large-format concrete pavers or poured concrete in neutral tones, linear raised planting beds with steel or concrete edging, ornamental grasses in organized groups, gravel or decomposed granite ground cover in designated areas, integrated LED pathway lighting, modern house numbers and mailbox design, simple straight pathway from street to entrance, minimal lawn area or no lawn with alternative ground covers, statement tree as focal point, mulch in dark charcoal or natural wood tone, no decorative elements or garden ornaments, monochromatic color palette emphasizing texture and form, precise maintenance with sharp edges, overall aesthetic of sophisticated restraint with front yard as extension of modern architecture creating impressive curb appeal through simplicity and thoughtful design.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Front Yard',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Front Yard - Traditional Cottage',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-front-cottage.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this front yard into charming cottage garden style featuring white picket fence with gate, meandering brick or stone pathway lined with flowers, mixed perennial borders overflowing with blooms in soft pastels including roses, lavender, delphiniums, peonies, and foxgloves, climbing roses on arbor over gate or porch, foundation plantings with boxwoods and flowering shrubs, window boxes filled with seasonal flowers, bird bath or small fountain as focal point, vintage-inspired mailbox and house numbers, traditional lantern-style pathway lights, small lawn area with natural edges, self-seeding plants creating informal look, mix of heights and textures, seasonal bulbs in spring, continuous blooming schedule, decorative elements like vintage watering can or garden sign, natural mulch, romantic color palette of soft pinks, blues, purples, whites with green foliage, overall aesthetic of welcoming cottage charm with abundance and informal elegance creating fairytale-like entrance that feels lived-in and loved.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Front Yard',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== 后院 / Backyard ==========
  {
    name: 'Backyard - Entertainment Patio',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-backyard-entertainment.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this backyard into entertainment-focused patio space featuring large paved patio area with porcelain tile or natural stone in modern finish, built-in outdoor kitchen with grill, counter space and storage, pergola or covered structure for shade with retractable sun shade or louvered roof, comfortable outdoor seating area with sectional sofa or built-in benches with weather-resistant cushions, outdoor dining table for 8-10 people, fire pit or outdoor fireplace as focal point with surrounding seating, ambient string lights overhead creating magical evening atmosphere, landscape lighting highlighting key features and plantings, outdoor bar cart or beverage station, modern outdoor heaters for cool evenings, surround sound speakers integrated into design, large planters with tropical or architectural plants, privacy screening with modern slat fencing or living walls, minimal lawn area with artificial grass or paving, connection to indoor living space through large sliding doors, overall aesthetic of resort-style outdoor living creating perfect entertaining space for gatherings year-round.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Backyard',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Backyard - Family Play Area',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-backyard-family.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this backyard into family-friendly play space featuring large open lawn area with healthy thick grass for active play, wooden play structure with swings, slide and climbing features, rubber mulch or safety surfacing under play equipment, sandbox with cover or built-in sandbox area, outdoor storage shed for toys and equipment in coordinating style, designated patio area with outdoor dining set for family meals, comfortable seating for parent supervision, low garden beds with child-safe plants and herbs, simple pathway with stepping stones, water feature like small fountain safely designed, vegetable garden area with raised beds at kid-friendly height, chalkboard or art wall on fence, shade trees providing relief on hot days, string lights for evening enjoyment, privacy fencing ensuring safety, low-maintenance plantings around perimeter, designated sports area for basketball hoop or soccer goals, overall aesthetic of safe practical family outdoor space balancing fun play areas with adult entertaining and gardening spaces creating backyard that serves entire family.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Backyard',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== 侧院 / Side Yard ==========
  {
    name: 'Side Yard - Zen Path',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-side-zen.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this side yard into serene zen pathway featuring natural stone stepping stones in irregular shapes set in raked gravel or moss, bamboo plants creating privacy screen along fence, Japanese maples providing seasonal color and dappled shade, low stone lanterns (tōrō) along pathway, small water basin (tsukubai) with bamboo fountain, river rocks and larger boulders strategically placed, ferns and hostas in shaded areas, simple wood fence in dark stain or bamboo screening, minimal flowering plants with emphasis on foliage and form, evergreen ground covers like mondo grass or Asian jasmine, simple bench or meditation spot midway through path, subtle solar pathway lighting, clean lines and asymmetrical balance, restrained color palette of greens, grays and natural wood tones, raked patterns in gravel suggesting flowing water, overall aesthetic of peaceful transition space following Japanese garden principles creating contemplative journey from front to back yard with emphasis on natural beauty and tranquility.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Side Yard',
    room_type: null,
    enabled: true,
    sort_order: 1
  },

  // ========== 泳池区 / Pool Area ==========
  {
    name: 'Pool Area - Resort Style',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-pool-resort.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this pool area into resort-style oasis featuring modern rectangular or geometric pool with infinity edge or raised spa, light-colored porcelain tile or natural stone pool deck, multiple luxury lounge chairs with weather-resistant cushions, large outdoor umbrellas or sail shades for sun protection, outdoor shower with contemporary fixtures and privacy screen, poolside bar or beverage station with seating, cabana or pergola structure with outdoor curtains and ceiling fan, tropical landscaping with palms, bird of paradise and flowering plants, large planters with architectural plants, built-in fire features or fire bowls, ambient pool lighting with LED color-changing options, privacy screening with modern fencing or tropical vegetation, outdoor sound system, towel storage and pool equipment concealed, modern pool furniture in neutral colors with accent pillows, overall aesthetic of five-star resort luxury creating vacation-like atmosphere at home with emphasis on comfort, style and entertainment perfect for relaxation and pool parties.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Pool Area',
    room_type: null,
    enabled: true,
    sort_order: 1
  },

  {
    name: 'Front Yard - Xeriscape Desert Style',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-front-xeriscape.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this front yard into xeriscape desert landscape featuring drought-tolerant plants including various cacti, agaves, yuccas and succulents, decomposed granite or colored gravel ground cover, large boulders and rock formations as focal points and natural elements, curved pathways with flagstone or concrete pavers, sculptural desert plants creating architectural interest, native flowering plants providing seasonal color, no traditional lawn requiring minimal water, raised planter beds with excellent drainage, modern or rustic metal accent pieces, decorative rock mulch in earth tones, strategic lighting highlighting specimen plants at night, low-maintenance design perfect for arid climates, natural desert color palette of grays, browns, greens, terra cotta, modern house numbers on boulder or metal post, overall aesthetic of sustainable water-wise landscaping celebrating desert ecology creating striking low-maintenance front yard.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Front Yard',
    room_type: null,
    enabled: true,
    sort_order: 3
  },

  // ========== 后院 / Backyard ==========
  {
    name: 'Backyard - Zen Meditation Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-backyard-zen.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this backyard into serene zen meditation garden featuring large area of raked gravel representing water with patterns suggesting flow, carefully placed natural stones and boulders in odd-numbered groupings, minimalist plant selection with Japanese maples, bamboo, pines and moss, stone lanterns (tōrō) providing focal points and ambient lighting, koi pond or simple water basin (tsukubai) with bamboo fountain, meditation platform or simple deck area, stone pathways with irregular natural stepping stones, bamboo fencing or natural wood screening for privacy, evergreen plants providing year-round structure, carefully pruned trees following cloud pruning techniques, dry stream bed with river rocks, minimal color with emphasis on greens, grays and natural materials, asymmetrical balance following wabi-sabi principles, tea house or meditation pavilion, overall aesthetic of peaceful contemplation with each element thoughtfully placed following Japanese garden philosophy creating tranquil retreat for meditation and reflection.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Backyard',
    room_type: null,
    enabled: true,
    sort_order: 3
  },
  {
    name: 'Backyard - English Cottage Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-backyard-english.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this backyard into romantic English cottage garden featuring informal mixed plantings with abundant flowers, climbing roses on arches, arbors and fences, meandering gravel or stone pathways, traditional perennials including delphiniums, hollyhocks, foxgloves, peonies and lavender, herbs mixed with ornamental plants, weathered wooden benches and vintage furniture, rustic arbor or pergola covered in climbing plants like clematis or wisteria, birdbath or small fountain as focal point, dense layered plantings with no bare soil visible, self-seeding plants creating natural informality, traditional edging plants, white picket fence sections or hedge boundaries, terra cotta pots with spillers and fillers, garden tools as decorative elements, cottage-style birdhouses and ornaments, abundant texture and foliage variety, overall aesthetic of romantic abundance with controlled chaos creating enchanting hideaway garden with continuous seasonal interest and timeless English charm.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Backyard',
    room_type: null,
    enabled: true,
    sort_order: 4
  },
  {
    name: 'Backyard - Modern Outdoor Living',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-backyard-modern-living.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this backyard into contemporary outdoor living space featuring large paved terrace with porcelain tile or concrete pavers, modern covered structure with flat or angled roof and integrated lighting, built-in outdoor kitchen with sleek cabinetry and high-end appliances, linear fire pit with modern design, comfortable sectional outdoor furniture with weather-resistant cushions, minimalist plantings with architectural plants and ornamental grasses, privacy screening with modern slat fencing or living green walls, ambient and task lighting throughout, outdoor sound system integrated into design, minimal lawn or artificial grass, raised planter beds with clean lines, water feature with contemporary design, outdoor heaters for year-round use, seamless connection to indoor space through large sliding doors, monochromatic or neutral color scheme, overall aesthetic of sophisticated modern outdoor room extending living space into landscape creating resort-style entertaining area.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Backyard',
    room_type: null,
    enabled: true,
    sort_order: 5
  },

  // ========== 侧院 / Side Yard ==========
  {
    name: 'Side Yard - Utility Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-side-utility.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this side yard into functional utility garden featuring organized storage for garbage bins, recycling containers and yard tools screened with attractive fencing or plant screening, air conditioning unit screening with louvered panels or dense evergreen plantings, pathway with durable pavers or gravel for equipment access, herb garden or small vegetable beds utilizing available sunlight, rain barrel or water collection system, compost bin area with easy access, narrow flower beds along fence with low-maintenance plants, simple lighting for nighttime access, hose storage and spigot area, firewood storage if needed, bicycle storage, potting bench or work area, shade-tolerant plants for areas with limited sun, functional yet attractive design making necessary utilities accessible while maintaining visual appeal, overall aesthetic of practical organization maximizing utility of narrow space while maintaining tidy appearance.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Side Yard',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== 泳池区 / Pool Area ==========
  {
    name: 'Pool Area - Mediterranean Pool',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-pool-mediterranean.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this pool area into Mediterranean-style oasis featuring classic rectangular or curved pool with mosaic tile accents, terra cotta or natural stone pool deck in warm tones, columned pergola or covered cabana with Mediterranean details, comfortable lounge furniture with patterned cushions in warm colors, large terra cotta planters with citrus trees, bougainvillea and lavender, outdoor shower with decorative tile, stone or stucco walls with climbing vines, wrought iron details on furniture and gates, outdoor dining area under vine-covered pergola, water features like wall fountains with tile detail, ambient lighting with lantern-style fixtures, privacy screening with stucco walls or Mediterranean plants, warm color palette of terracottas, creams, blues and greens, decorative tile details around pool, overall aesthetic of European resort luxury evoking Italian or Spanish coastal villas creating warm inviting pool environment perfect for relaxation and entertaining.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Pool Area',
    room_type: null,
    enabled: true,
    sort_order: 2
  },

  // ========== 菜园 / Vegetable Garden ==========
  {
    name: 'Vegetable Garden - Raised Bed Modern',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-vegetable-raised.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into modern raised bed vegetable garden featuring multiple raised beds in cedar, composite or cor-ten steel with height 24-30 inches for easy access, organized layout with wide gravel or decomposed granite pathways between beds allowing wheelbarrow access, drip irrigation system with timer for water efficiency, mix of vegetables and herbs in companion planting arrangements, vertical growing structures including trellises for tomatoes, cucumbers and beans, fruit-bearing shrubs and small fruit trees as edible hedges, herb garden section near house for easy kitchen access, compost bin area screened with attractive fencing, tool shed or storage for gardening supplies, seating area with bench for rest and enjoyment, season-extending features like cold frames or row covers, modern greenhouse or high tunnel, attractive fencing keeping out animals while adding design interest, pathways wide enough for comfortable working, organized with labeled sections, mix of productive and ornamental plants, overall aesthetic of beautiful productive garden combining efficiency with sophisticated design creating edible landscape that is both functional and visually appealing.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Vegetable Garden',
    room_type: null,
    enabled: true,
    sort_order: 1
  },
  {
    name: 'Vegetable Garden - Traditional In-Ground',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-vegetable-traditional.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into traditional in-ground vegetable garden featuring organized rows of vegetables in rectangular beds, paths between rows wide enough for comfortable access and weeding, mix of vegetable varieties including tomatoes, peppers, squash, beans, lettuce and root vegetables, crop rotation planning visible in layout, companion planting strategies with flowers mixed in like marigolds and nasturtiums, simple wooden stakes and cages for support, hand watering or soaker hose system, compost area for organic fertilization, tool shed or simple storage, scarecrow or bird netting protecting crops, heritage varieties and heirloom plants, vertical growing on simple structures, herb border around perimeter, simple fence keeping out larger animals, rustic charm with practical function, traditional methods honored, seasonal succession planting visible, overall aesthetic of authentic vegetable garden honoring traditional gardening methods creating productive space connecting to agricultural heritage while providing fresh homegrown produce.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Vegetable Garden',
    room_type: null,
    enabled: true,
    sort_order: 2
  },
];

export function generateAllFixedTemplates(): FixedTemplate[] {
  return [
    ...EXTERIOR_TEMPLATES,
    ...GARDEN_TEMPLATES,
  ];
}

// For CLI execution
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const templates = generateAllFixedTemplates();
  console.log(`Generated ${templates.length} fixed templates`);
  console.log(JSON.stringify(templates, null, 2));
}

