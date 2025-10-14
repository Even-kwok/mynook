/**
 * Generate Templates for Other Categories
 * Generates high-quality templates for Exterior, Garden, Festive, Wall Paint, Floor Style
 * Following MyNook-V1.0-Universal format
 */

export interface OtherCategoryTemplate {
  name: string;
  imageUrl: string;
  prompt: string;
  main_category: string;
  sub_category: string;
  room_type: null;
  enabled: boolean;
  sort_order: number;
  popularity: 'high' | 'medium' | 'low';
}

// ============================================
// PROMPT BASE
// ============================================

const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings, exterior facades, landscapes) and existing elements (windows, doors, furniture, decor, vegetation) within the input image MUST BE COMPLETELY REPLACED or newly generated according to the specified style. No original textures, dirt, or unfinished elements from the input image should remain in the final output. The output must represent a fully finished, high-end, and professionally designed space.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions (e.g., windows, doors, key architectural features) from the user's input image. If it's an interior, ensure realistic room proportions. If it's an exterior, maintain the architectural footprint and landscape contours.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail, harmonious composition, and an overall refined and high-end aesthetic. The image should evoke a sense of aspiration and sophisticated comfort, suitable for features in leading design publications like "Architectural Digest," "Elle Decor," or "Ark Journal."

Employ soft, natural, and inviting lighting. For interiors, envision ample diffused natural light from large windows, supplemented by warm, well-placed accent lighting. For exteriors, aim for golden hour or clear daylight with balanced shadows. The atmosphere should be serene, pure, and enhance the specified style.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail, vibrant color accuracy, and exceptional dynamic range. Rendered with V-Ray or Corona Renderer.`;

// ============================================
// EXTERIOR DESIGN TEMPLATES
// ============================================

export const EXTERIOR_TEMPLATES: OtherCategoryTemplate[] = [
  // Architectural Styles
  {
    name: 'Modern Contemporary Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-modern-contemporary.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a stunning modern contemporary masterpiece featuring clean geometric forms with sharp horizontal and vertical lines, large expanses of floor-to-ceiling glass windows with minimal black or bronze frames, smooth facade materials including white or light gray stucco, natural wood accent panels in warm tones, polished concrete or large-format porcelain tile cladding, flat or low-slope roof with hidden drainage, recessed lighting under roof overhangs, minimalist landscaping with architectural plantings like ornamental grasses and sculptural evergreens, concrete or natural stone pathways with geometric patterns, integrated outdoor lighting with modern fixtures, monochromatic color palette emphasizing whites, grays, blacks, and natural wood tones, cantilevered elements creating dramatic shadows, seamless indoor-outdoor connection, overall aesthetic of sophisticated simplicity with bold architectural statements and refined materials.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 1,
    popularity: 'high'
  },
  {
    name: 'Traditional Colonial Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-colonial.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a classic colonial revival featuring symmetrical facade with central entrance flanked by evenly spaced windows, white or cream painted wood siding or brick in red or warm tones, black or dark green shutters on all windows, columned front porch with classical details, multi-pane double-hung windows with traditional proportions, steep-pitched gable roof with asphalt or slate shingles, dormer windows adding character to the roofline, prominent front door with pediment or transom window above, decorative crown molding and trim details, manicured foundation plantings with boxwoods and flowering shrubs, brick or stone walkway leading to entrance, traditional lantern-style lighting fixtures, attached garage with matching architectural details, formal landscaping with lawn, trees, and seasonal flowers, color palette of whites, creams, reds, blacks, and natural tones, overall aesthetic of timeless American elegance with historical accuracy and refined traditional craftsmanship.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 5,
    popularity: 'medium'
  },
  {
    name: 'Mediterranean Villa Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-mediterranean.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a luxurious Mediterranean villa featuring warm stucco walls in cream, terracotta, or soft yellow tones with textured finish, red clay barrel tile roof with generous overhangs, arched windows and doorways with decorative iron grilles or wooden shutters, wrought iron balconies with ornate railings, exposed wooden beam ends (vigas) protruding from walls, decorative tile work around doors and windows in colorful Mediterranean patterns, fountain or water feature in courtyard, stone or terracotta tile pathways, columned portico or loggia creating shaded outdoor spaces, climbing vines like bougainvillea or jasmine on walls and pergolas, potted citrus trees and terra cotta planters with herbs and flowers, outdoor dining area with pergola covered in vines, warm ambient lighting with wrought iron fixtures, natural stone accents and steps, color palette of warm earth tones, terracotta reds, creamy whites, and vibrant accents, overall aesthetic of European coastal elegance with old-world charm and resort-like ambiance.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 8,
    popularity: 'medium'
  },
  {
    name: 'Craftsman Bungalow Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-craftsman.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a charming craftsman bungalow featuring low-pitched gable roof with wide eaves and exposed rafters, mixed exterior materials including natural wood siding, shingles, and stone, prominent front porch with thick tapered columns on stone pedestals, multi-pane windows with divided lights in upper sash, decorative brackets and knee braces under eaves, stone chimney with detailed masonry work, built-in window boxes with seasonal plantings, natural color palette of earth tones, greens, browns, and warm wood stains, stone or brick front porch steps and foundation, handcrafted details showing quality workmanship, horizontal emphasis in design, integrated garage with matching materials, native plantings and established gardens, pathway with natural stone or brick pavers, period-appropriate light fixtures with amber glass, overall aesthetic of arts and crafts movement ideals with emphasis on natural materials, honest construction, and connection to nature creating warm and inviting curb appeal.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 12,
    popularity: 'medium'
  },
  {
    name: 'Modern Farmhouse Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-modern-farmhouse.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a stylish modern farmhouse featuring white or light-colored board-and-batten or horizontal siding, steep-pitched metal roof in charcoal or black, large black-framed windows in modern proportions, wraparound porch or covered entry with simple square columns, mix of traditional farmhouse elements with contemporary clean lines, stone or brick accent walls adding texture, modern garage doors with windows, minimalist trim and details, board-and-batten shutters in black or dark color, cupola or weathervane as traditional accent, metal roof with standing seams, professional landscaping with native grasses and perennials, stone or concrete pathways, modern outdoor lighting with farmhouse styling, neutral color palette of whites, blacks, grays, and natural wood accents, large sliding barn door as design element, balance of rustic charm and contemporary sophistication, overall aesthetic of updated American farmhouse with Instagram-worthy curb appeal combining country roots with modern sensibility.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 3,
    popularity: 'high'
  },
  {
    name: 'Scandinavian Minimalist Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-scandinavian.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a serene Scandinavian minimalist design featuring crisp white or light gray painted wood siding with vertical or horizontal orientation, simple pitched roof with dark gray or black roofing material, large windows with thin black or dark gray frames maximizing natural light, natural wood accents around entrance or as cladding panels in light pine or spruce, minimal ornamentation emphasizing clean lines and functional beauty, single-color exterior with one or two accent materials at most, modern front door in natural wood or black, subtle outdoor lighting integrated into architecture, native landscaping with evergreens and ornamental grasses, gravel or simple paver pathways, emphasis on connection between interior and exterior spaces, wood storage shed or carport with matching aesthetic, neutral color palette of whites, grays, blacks, and natural wood tones, functional design elements serving as decoration, overall aesthetic of Nordic simplicity with focus on quality materials, sustainability, and harmony with nature creating peaceful sophisticated exterior embodying hygge lifestyle principles.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 2,
    popularity: 'high'
  },
  {
    name: 'French Country Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-french-country.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a charming French country estate featuring cream or soft beige stucco walls with rustic texture, steeply pitched roof with slate or clay tiles in gray or terracotta, asymmetrical facade with varied rooflines and dormers, stone accents around windows, doors, and corners, arched windows and doorways with divided lights, wooden shutters in soft blue, gray, or natural wood, climbing vines on walls and around entrance, copper gutters and downspouts with patina, vintage-style outdoor lighting with lantern shapes, manicured gardens with lavender, roses, and boxwood hedges, gravel courtyard or driveway, iron fencing with decorative details, stone or brick pathways with irregular patterns, window boxes overflowing with flowers, classical proportions with rustic materials, soft romantic color palette of creams, grays, blues, and natural stone, overall aesthetic of European countryside elegance with weathered charm and timeless sophistication evoking French provincial estates and countryside chateaux.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 10,
    popularity: 'medium'
  },
  {
    name: 'Mid-Century Modern Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-midcentury.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a classic mid-century modern home featuring low-slung horizontal profile with flat or gently sloped roofline, large walls of windows bringing outdoors in, mix of materials including wood siding in natural finish, brick, and smooth stucco, prominent breezeway or covered carport integrated into design, clerestory windows adding light and architectural interest, geometric design elements and clean lines, minimal decorative details focusing on form and function, natural wood or painted accent walls in period colors like burnt orange, avocado, or mustard, sliding glass doors opening to patio or deck, stone chimney or accent wall, desert or drought-tolerant landscaping with succulents and native plants, concrete or aggregate pathways and driveways, period-appropriate lighting with starburst or atomic designs, flat-faced cabinets on garage, address numbers in mid-century modern font, color palette of earth tones with bold accent colors, overall aesthetic of optimistic modernism celebrating indoor-outdoor living, integration with landscape, and honest use of materials creating iconic design that remains fresh and relevant decades later.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 7,
    popularity: 'medium'
  },
  {
    name: 'English Tudor Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-tudor.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a charming English Tudor featuring distinctive decorative half-timbering with dark wood beams creating patterns against white or cream stucco walls, steeply pitched cross-gabled roof with slate or cedar shake shingles, tall narrow multi-pane casement windows with diamond or rectangular patterns, massive stone or brick chimney as prominent feature, arched doorway with heavy wooden door and iron hardware, stone or brick facade on lower level or accent walls, asymmetrical facade creating storybook appearance, decorative bargeboard trim on gable ends, small paned windows grouped in twos or threes, climbing ivy or other vines on portions of walls, cottage-style landscaping with English garden plantings, stone walkway leading to entrance, copper or wrought iron light fixtures with lantern styling, window boxes with colorful flowers, mix of textures including stone, stucco, and timber, warm earthy color palette with dark wood contrast, overall aesthetic of old-world European charm with romantic storybook quality creating distinctive character-filled home that stands out in neighborhood with timeless Tudor style.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 15,
    popularity: 'low'
  },
  {
    name: 'Coastal Beach House Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-exterior-coastal.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this building exterior into a breezy coastal beach house featuring light color palette of whites, soft blues, sandy beiges, and seafoam greens, horizontal or shingle siding in weathered or painted finish suggesting seaside location, large windows and glass doors maximizing ocean or water views and natural light, wraparound porch or multiple covered decks with white railings, metal or standing seam roof in light color for heat reflection, raised foundation or pilings if in flood zone creating characteristic elevated appearance, outdoor shower area for rinsing off sand, nautical-inspired details like rope railings or ship lap siding, hurricane shutters in coordinating colors, coastal landscaping with native grasses, palms, and salt-tolerant plants, sandy or shell pathways, outdoor living spaces with ceiling fans and comfortable seating, white or light wood decking, weathered wood accents suggesting driftwood, coastal lighting fixtures in brushed nickel or bronze, relaxed casual aesthetic, colors that complement sky and sea, overall aesthetic of easy beach living with laid-back elegance creating perfect vacation home or permanent coastal residence that embraces seaside lifestyle and natural surroundings.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Exterior Design',
    sub_category: 'Architectural Styles',
    room_type: null,
    enabled: true,
    sort_order: 6,
    popularity: 'high'
  },
];

// ============================================
// GARDEN & BACKYARD TEMPLATES
// ============================================

export const GARDEN_TEMPLATES: OtherCategoryTemplate[] = [
  {
    name: 'English Cottage Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-english-cottage.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a romantic English cottage garden featuring informal mixed plantings with abundant flowers in soft pastels and vibrant colors, climbing roses on arches, trellises, and walls, meandering gravel or stone pathways edged with lavender or catmint, traditional perennials including delphiniums, hollyhocks, foxgloves, peonies, and lupines, herbs mixed with ornamental plants, weathered wooden bench or vintage garden furniture, rustic arbor or pergola covered in climbing plants like clematis or wisteria, birdbath or small water feature as focal point, dense layered plantings with no bare soil visible, self-seeding plants creating natural informality, traditional edging plants like lady's mantle or geraniums, picket fence or hedge boundary, terra cotta pots with spillers and fillers, garden tools as decorative elements, abundant texture and foliage variety, cottage-style birdhouses and garden ornaments, overall aesthetic of romantic abundance with controlled chaos, timeless English countryside charm, and continuous seasonal interest creating an enchanting hideaway garden.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 2,
    popularity: 'high'
  },
  {
    name: 'Japanese Zen Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-zen.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a serene Japanese zen garden featuring raked gravel or sand representing water with carefully created patterns, strategically placed natural stones and boulders in odd-numbered groupings, minimalist plant selection with Japanese maples, bamboo, pines, and moss, stone lanterns (tōrō) providing focal points and lighting, stepping stone pathways with irregular natural stones, koi pond or water basin (tsukubai) with bamboo fountain, wooden bridge or deck element in natural finish, carefully pruned trees and shrubs following cloud pruning techniques, evergreen groundcovers and ferns for year-round interest, bamboo fencing or screening for privacy, stone water basin for ritual cleansing, meditation seating area with simple bench or platforms, asymmetrical balance and odd numbers following wabi-sabi philosophy, restrained color palette of greens, grays, browns, and natural stone, minimal ornamentation emphasizing natural beauty, overall aesthetic of contemplative tranquility with each element thoughtfully placed to create harmony, balance, and connection to nature following Japanese garden principles.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 5,
    popularity: 'medium'
  },
  {
    name: 'Modern Minimalist Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-modern-minimalist.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a sleek modern minimalist garden featuring clean geometric lines and strong architectural forms, limited plant palette with repetition of species for unified look, structural plants like ornamental grasses, bamboo, and architectural evergreens, hardscaping with poured concrete, large-format pavers, or composite decking in neutral tones, raised planting beds with steel, concrete, or wood edging in contemporary design, integrated LED lighting for dramatic nighttime effects, water feature with modern design like linear fountain or reflecting pool, outdoor furniture with minimalist design in weather-resistant materials, privacy screening with modern slatted fencing or living walls, gravel or decomposed granite ground cover in designated areas, specimen plants as focal points against neutral backgrounds, built-in seating and planters as architectural elements, monochromatic or limited color palette emphasizing texture and form, precise maintenance with sharp edges and clean surfaces, sustainable materials and water-wise plantings, overall aesthetic of sophisticated restraint with every element purposefully chosen, creating outdoor living space that extends modern interior design principles into the landscape with emphasis on simplicity, functionality, and geometric beauty.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 1,
    popularity: 'high'
  },
  {
    name: 'Mediterranean Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-mediterranean.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a sun-drenched Mediterranean garden featuring warm terracotta tile pathways and patio areas, drought-tolerant plants like lavender, rosemary, olive trees, and ornamental grasses, vibrant bougainvillea cascading over walls and pergolas, terra cotta pots in various sizes filled with herbs, citrus trees, and colorful flowers, wrought iron furniture with comfortable cushions in warm tones, pergola or arbor covered in climbing vines providing dappled shade, stone walls or stucco walls in warm cream or ochre tones, decorative tile work with blue and white patterns, gravel pathways between planted areas, central fountain or water feature with Mediterranean styling, outdoor dining area perfect for al fresco meals, fragrant plants like jasmine and citrus providing sensory experience, sun-loving succulents and cacti in decorative arrangements, weathered wood accents and rustic details, warm color palette of terracottas, ochres, blues, and greens, overall aesthetic of European coastal living with emphasis on outdoor entertaining, relaxation, and connection to warm climate gardening traditions creating vacation-like atmosphere.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 4,
    popularity: 'high'
  },
  {
    name: 'Tropical Paradise Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-tropical.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a lush tropical paradise featuring large-leafed plants like banana trees, bird of paradise, and elephant ears creating jungle effect, vibrant flowering tropicals including hibiscus, plumeria, and heliconias in bold colors, layered plantings with varying heights from ground covers to tall palms, natural stone or wood pathways winding through dense vegetation, water feature like pond or waterfall adding sound and humidity, tropical hardwoods for decking and furniture, thatched roof cabana or pergola for shade, colorful outdoor textiles with tropical patterns, tiki torches or tropical-style lighting for ambiance, hanging baskets with trailing tropical vines, bamboo fencing or screening for privacy, rich mulch or bark covering soil between plants, moisture-loving ferns and bromeliads in shaded areas, bold color palette of greens, reds, oranges, pinks, and purples, hammock or swing for relaxation, overall aesthetic of exotic resort living with emphasis on lush abundant plantings creating private jungle retreat that transports you to tropical destinations with year-round summer vibes.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 7,
    popularity: 'medium'
  },
  {
    name: 'Desert Xeriscape Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-desert.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into a stunning desert xeriscape garden featuring diverse collection of drought-tolerant plants including various cacti species from tall saguaros to round barrel cacti, colorful agaves in blue-green and variegated varieties, sculptural yuccas and desert spoons creating architectural interest, vibrant flowering desert plants like prickly pear, ocotillo, and desert marigold providing seasonal color, decomposed granite or gravel ground cover in natural desert tones, large boulders and rock formations as focal points and natural elements, pathway of flagstone or concrete pavers, raised planter beds with excellent drainage, minimal water features like bubbling rock fountain, modern or rustic metal sculptures as artistic accents, decorative colored glass mulch in select areas, native desert shrubs like brittlebush and creosote, strategic lighting highlighting sculptural plants at night, seating area with southwestern-style furniture under shade structure, color palette of greens, grays, rust, and terracotta, overall aesthetic of low-maintenance sustainable beauty celebrating desert ecology with water-wise design creating striking landscape that thrives in arid conditions while providing year-round interest and dramatic southwestern character.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 9,
    popularity: 'medium'
  },
  {
    name: 'French Potager Kitchen Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-garden-potager.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this outdoor space into an elegant French potager kitchen garden featuring formal geometric layout with symmetrical beds divided by gravel or brick pathways, mix of vegetables, herbs, and flowers in decorative arrangements combining beauty with productivity, boxwood or lavender hedges edging beds in traditional French style, central focal point like sundial, fountain, or ornamental feature, raised beds with stone or wood edging, climbing vegetables like beans and tomatoes on decorative obelisks or tuteurs, espaliered fruit trees on walls or fences, herb garden near entrance with thyme, rosemary, sage, and parsley in ornamental patterns, cutting garden section with flowers for bouquets including zinnias, dahlias, and sunflowers, antique or vintage garden tools displayed as decoration, traditional terracotta pots with seasonal plantings, rustic wooden garden benches for enjoying the space, gravel pathways wide enough for wheelbarrow and comfortable strolling, berry bushes and small fruit trees, season-extending cold frames or cloches, overall aesthetic of productive French garden combining elegant formal design with practical vegetable cultivation creating beautiful edible landscape that is both ornamental and functional following centuries-old tradition.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Garden & Backyard Design',
    sub_category: 'Garden Styles',
    room_type: null,
    enabled: true,
    sort_order: 10,
    popularity: 'medium'
  },
];

// ============================================
// FESTIVE DECOR TEMPLATES
// ============================================

export const FESTIVE_TEMPLATES: OtherCategoryTemplate[] = [
  {
    name: 'Christmas Winter Wonderland',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-christmas.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a magical Christmas winter wonderland featuring a beautifully decorated Christmas tree as the focal point with white and gold ornaments, twinkling warm white lights, and elegant ribbon garlands, mantel decorated with fresh evergreen garland interwoven with fairy lights and white pillar candles, hung stockings in coordinating patterns, wreath with red berries and pine cones above fireplace, additional greenery arrangements on surfaces with white flowers and silver accents, hurricane candles in various heights creating warm ambient glow, wrapped gift boxes in metallic papers under tree and scattered throughout, white and cream color scheme with touches of gold, silver, and red, luxurious velvet throw pillows in holiday colors, plaid blanket draped over seating, dining table set with elegant holiday dinnerware and crystal glasses, centerpiece of evergreen branches with white roses and gold candles, ambient lighting creating cozy intimate atmosphere, frosted window decorations, seasonal flowers like white poinsettias and amaryllis, overall aesthetic of sophisticated festive elegance with timeless Christmas charm creating magazine-worthy holiday decor that feels both luxurious and warmly inviting.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Christmas & Winter Holidays',
    room_type: null,
    enabled: true,
    sort_order: 1,
    popularity: 'high'
  },
  {
    name: 'Halloween Spooky Chic',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-halloween.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a stylishly spooky Halloween setting featuring sophisticated black and orange color palette with metallic accents, elegant black candelabras with dripping black candles, vintage-inspired Halloween decorations including mercury glass pumpkins and ravens, dark floral arrangements with black roses, dark dahlias, and fall foliage, atmospheric lighting with amber and purple LED candles, gauzy black fabric draped artistically creating ethereal effect, apothecary jars filled with Halloween treats and curiosities, framed silhouettes and vintage Halloween prints, decorative skulls and skeletons as tasteful accents, cobweb decorations applied sparingly for atmosphere, carved pumpkins with intricate designs lit from within, black lace table runners and velvet cushions, spell books and vintage bottles as props, dark wood furniture and gothic-inspired accessories, moody lighting creating dramatic shadows, fall elements like wheat stalks and dried leaves in dark tones, overall aesthetic of grown-up Halloween sophistication that is spooky yet elegant, avoiding cartoonish elements in favor of gothic romance and vintage charm creating an enchanting atmosphere perfect for adult Halloween entertaining.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Halloween & Autumn',
    room_type: null,
    enabled: true,
    sort_order: 8,
    popularity: 'medium'
  },
  {
    name: 'Spring Easter Celebration',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-easter.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a fresh spring Easter celebration featuring pastel color palette of soft pinks, blues, yellows, and mint greens with white as base, abundant fresh spring flowers including tulips, daffodils, hyacinths, and ranunculus in various vessels, Easter egg decorations in coordinating pastels displayed in bowls and baskets, bunny figurines and rabbit-themed accessories in ceramic or natural materials, table setting with floral-patterned china and pastel-colored linens, centerpiece of mixed spring flowers with decorative eggs nestled among blooms, white painted branches in tall vases creating vertical interest, vintage-inspired Easter cards and prints in frames, woven baskets filled with moss and decorated eggs, spring wreath on door or wall with eggs and ribbons, touches of gold or brass for subtle elegance, sheer white curtains letting in bright natural light, lightweight throws in pastel hues, decorative nest with speckled eggs, carrot-themed accents as playful touches, overall aesthetic of fresh renewal and spring awakening with soft romantic touches creating light and airy atmosphere that celebrates the season with sophisticated charm perfect for Easter brunch or spring gatherings.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Easter & Spring',
    room_type: null,
    enabled: true,
    sort_order: 12,
    popularity: 'medium'
  },
  {
    name: 'Thanksgiving Harvest',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-thanksgiving.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a warm Thanksgiving harvest celebration featuring rich autumn color palette of deep oranges, burgundy, gold, and bronze with cream and brown accents, table set for festive dinner with layered place settings in fall colors, centerpiece of mixed autumn elements including pumpkins, gourds, wheat stalks, and fall flowers like chrysanthemums and dahlias, garland of autumn leaves and berries draping mantel or table runner, decorative cornucopia overflowing with seasonal fruits and vegetables, candles in amber and gold tones creating warm glow, plaid or buffalo check textiles in fall colors, natural wood serving pieces and rustic chargers, mason jars filled with wheat stalks or fall branches, burlap and linen textures adding rustic elegance, vintage-inspired Thanksgiving signs and prints, small pumpkins and gourds scattered throughout as accents, warm lighting creating cozy intimate atmosphere, layered rugs and throws in autumn tones, overall aesthetic of abundant harvest and grateful gathering with sophisticated rustic charm creating welcoming environment perfect for family celebration and expressing gratitude.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Thanksgiving & Autumn',
    room_type: null,
    enabled: true,
    sort_order: 10,
    popularity: 'medium'
  },
  {
    name: 'Fourth of July Patriotic',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-july4.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a festive Fourth of July celebration featuring classic red, white, and blue color scheme with stars and stripes motifs, outdoor entertaining setup with patriotic table settings including navy blue tablecloth, white dinnerware, and red napkins, centerpiece of white hydrangeas, blue delphiniums, and red roses arranged in mason jars or galvanized containers, American flag displayed prominently, bunting garland in red, white, and blue stripes, string lights or lanterns for evening ambiance, casual seating with striped cushions and pillows in patriotic colors, picnic-style table with checkered details, decorative stars in various sizes as accents, glass beverage dispensers with fresh fruit, vintage-inspired Americana decor and signs, firework-inspired decorations or motifs, fresh summer flowers in patriotic color scheme, casual relaxed atmosphere perfect for outdoor gathering, BBQ setup with patriotic accessories, natural summer setting with lawn or deck, overall aesthetic of cheerful American celebration combining patriotic pride with summer entertaining ease creating perfect environment for Independence Day festivities with family and friends.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Summer Holidays',
    room_type: null,
    enabled: true,
    sort_order: 15,
    popularity: 'low'
  },
  {
    name: 'Christmas Rustic Farmhouse',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-christmas-rustic.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a cozy rustic farmhouse Christmas featuring natural Christmas tree decorated with burlap ribbons, wooden ornaments, pinecones, and warm white lights, reclaimed wood accents throughout space, plaid flannel throws in red and black buffalo check, galvanized metal containers holding fresh evergreen branches, vintage wooden crates displaying wrapped presents, mantel adorned with fresh pine garland and mercury glass candles, rustic wooden signs with holiday messages, mason jar vases with winter berries and evergreens, white ceramic pitchers filled with cinnamon sticks and holly, farmhouse-style dining table set with natural linen runners, wooden chargers, and simple white dishes, centerpiece of mixed greenery in dough bowl, candles in lanterns and hurricane holders, distressed white furniture creating contrast with natural wood tones, woven baskets holding cozy blankets, string of wooden bead garland on tree, vintage sleds and skates as wall decor, neutral color palette of whites, creams, naturals with pops of red and green, overall aesthetic of warm country Christmas with authentic farmhouse charm creating inviting family-friendly holiday atmosphere that celebrates simplicity and natural materials.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Christmas & Winter Holidays',
    room_type: null,
    enabled: true,
    sort_order: 2,
    popularity: 'high'
  },
  {
    name: 'Christmas Modern Minimalist',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-christmas-modern.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a sleek modern minimalist Christmas featuring sparse but impactful decorations, single-color ornament scheme on tree in metallic silver or matte black, simple LED light strings with consistent spacing, monochromatic color palette of whites, blacks, and one metallic accent, clean-lined Christmas tree either real or high-quality artificial in perfect conical shape, minimal but high-quality decorations on mantel with geometric candleholders, contemporary wreath with modern materials like metal hoops or preserved eucalyptus, gifts wrapped uniformly in same paper creating visual consistency, Scandinavian-inspired wooden stars and simple natural elements, no visual clutter with each element purposefully placed, modern furniture remaining as focal points without holiday overwhelm, single statement decoration piece like oversized ornament or contemporary nativity, architectural evergreen arrangements in modern vessels, subtle metallic accents in brass or copper, crisp white or neutral background allowing decorations to stand out, geometric patterns in textiles if any, overall aesthetic of sophisticated restraint celebrating holiday with contemporary elegance and intentional design where less is more creating calm refined Christmas atmosphere perfect for modern homes.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Christmas & Winter Holidays',
    room_type: null,
    enabled: true,
    sort_order: 3,
    popularity: 'high'
  },
  {
    name: 'New Year Glamorous Party',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-newyear.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a glamorous New Year celebration featuring luxurious metallic color palette of gold, silver, and champagne with black accents, abundant metallic balloons in clusters and garlands, sequined table runners and glittering chargers, champagne bar setup with gold rimmed glasses and ice bucket, confetti scattered artistically on surfaces, elegant black and gold party hats and noisemakers as decor, oversized clock decoration or countdown display, string lights or fairy lights creating magical ambiance, mirrored or metallic disco balls catching and reflecting light, high-gloss black furniture or tables, gold cutlery and luxe dinnerware, centerpieces with metallic branches or feathers in tall vases, velvet cushions in jewel tones adding richness, bar cart styled with crystal decanters and gold accessories, photo backdrop area with metallic fringe or sequin wall, number balloons for the new year, sophisticated lighting with dimmers set for evening glamour, metallic paper fans or rosettes on walls, overall aesthetic of upscale celebration with Hollywood glam influences creating party-ready environment that sparkles and shines perfect for ringing in new year with style and sophistication.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Christmas & Winter Holidays',
    room_type: null,
    enabled: true,
    sort_order: 4,
    popularity: 'medium'
  },
  {
    name: 'Valentine Romantic',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-valentine.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a romantic Valentine celebration featuring sophisticated color palette of deep reds, soft pinks, whites, and touches of gold, abundant fresh roses in various shades from deep red to blush pink arranged in elegant vases, rose petals scattered on surfaces creating romantic touch, candles in multiple heights creating intimate warm glow, heart-shaped decorations in tasteful modern designs avoiding childish motifs, luxurious velvet and silk textiles in romantic colors, table set for intimate dinner with fine china and crystal wine glasses, romantic lighting with dimmed overhead and warm accent lights, soft throw blankets and plush pillows creating cozy atmosphere, romantic artwork or prints with love themes in elegant frames, champagne or wine setup with romantic presentation, chocolates or sweets displayed in beautiful containers, fresh flowers beyond roses including peonies, ranunculus, and tulips, subtle Valentine themed pillows with elegant designs, sheer curtains creating soft filtered light, romantic music playlist cues visible in styled entertainment area, personal touches like framed photos or love letters as decor, overall aesthetic of grown-up romance with sophisticated elegance avoiding cliché creating intimate luxurious atmosphere perfect for celebrating love with refined taste and genuine sentiment.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Valentine & Romance',
    room_type: null,
    enabled: true,
    sort_order: 6,
    popularity: 'medium'
  },
  {
    name: 'St Patrick Day Irish Charm',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-stpatrick.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a charming St Patrick Day celebration featuring sophisticated green color palette from sage to emerald with cream and gold accents, fresh greenery arrangements with shamrocks, bells of Ireland, and green hydrangeas, elegant Irish-inspired decorations avoiding cartoonish leprechauns in favor of Celtic patterns, natural elements like moss, green apples, and herbs in displays, table setting with green-hued linens and white dishes, shamrock motifs in subtle elegant applications, rustic wooden elements suggesting Irish countryside, vintage-inspired Irish blessing prints or Celtic knot artwork, green candles in brass or gold holders, wheat stalks and barley suggesting Irish harvest traditions, cream-colored lace doilies or runners adding delicate touch, green velvet or linen throw pillows, copper accents referencing Irish heritage, potted plants and ferns bringing natural green indoors, white flowers mixed with greenery for contrast, subtle rainbow element in artwork or textiles, traditional Irish music playing creating ambiance, cozy seating arrangement suggesting pub-style gathering, overall aesthetic of Irish elegance with heritage and charm celebrating culture with sophistication and avoiding stereotypes creating warm inviting atmosphere for March celebration.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Spring Holidays',
    room_type: null,
    enabled: true,
    sort_order: 7,
    popularity: 'low'
  },
  {
    name: 'Autumn Harvest Celebration',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-autumn.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a warm autumn harvest celebration featuring rich color palette of burnt orange, golden yellow, deep burgundy, and warm browns, abundant pumpkins and gourds in various sizes and colors including white, orange, and blue varieties, dried corn stalks and wheat bundles adding height and texture, fall flowers including sunflowers, chrysanthemums, and dahlias in copper and ceramic vessels, autumn leaf garlands in realistic colors draping mantels and doorways, plaid throws and pillows in fall colors, natural wood slice chargers and rustic serving pieces, candles in amber glass or surrounded by fall leaves, wreaths made from natural materials like dried leaves, berries, and pinecones, burlap and linen textiles adding rustic texture, mason jars filled with seasonal elements like acorns and cinnamon sticks, vintage wooden crates displaying seasonal produce, warm lighting creating cozy amber glow, layered rugs in warm tones, autumn-scented candles suggesting apple cider and cinnamon, blackboard signs with harvest messages, natural elements like branches and twigs in arrangements, overall aesthetic of abundant harvest celebration with organic natural style creating welcoming cozy atmosphere that captures essence of fall season perfect for gatherings throughout autumn months.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Halloween & Autumn',
    room_type: null,
    enabled: true,
    sort_order: 9,
    popularity: 'medium'
  },
  {
    name: 'Dia de los Muertos Colorful',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-festive-diadelosmuertos.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space into a vibrant Dia de los Muertos celebration featuring bold color palette of hot pink, orange, purple, yellow, and turquoise, decorative sugar skull displays in various sizes with intricate colorful patterns, marigold flowers (cempasúchil) in abundant arrangements as traditional offering flowers, papel picado (decorative cut paper banners) strung overhead in multiple colors and patterns, ofrenda (altar) setup with photos, candles, flowers, and traditional offerings, decorated skulls and skeleton figurines in festive poses, bright Mexican textiles including serapes and embroidered tablecloths, candles in glass votives creating warm intimate lighting, fresh fruit displays including oranges, apples, and pan de muerto (bread of the dead), traditional Mexican pottery and ceramic pieces, vibrant artwork celebrating life and honoring deceased, papel flowers in bright colors, copal incense burners for authentic atmosphere, mix of traditional and modern interpretations of Day of Dead aesthetics, colorful papel picado placemats and runners, skeleton mariachi musicians or catrina figures as elegant decorations, marigold petal trails and arrangements, overall aesthetic of joyful celebration of life and death with authentic Mexican cultural elements creating colorful meaningful tribute that honors tradition while creating visually stunning sophisticated environment for this important cultural celebration.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Festive Decor',
    sub_category: 'Halloween & Autumn',
    room_type: null,
    enabled: true,
    sort_order: 11,
    popularity: 'medium'
  },
];

// ============================================
// WALL PAINT TEMPLATES
// ============================================

export const WALL_PAINT_TEMPLATES: OtherCategoryTemplate[] = [
  {
    name: 'Warm Terracotta Walls',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-terracotta.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with warm terracotta wall paint in rich clay-inspired tones ranging from soft peachy terracotta to deeper burnt orange hues, creating an enveloping warm atmosphere, walls in matte or eggshell finish showing subtle texture and depth of color, trim and moldings painted in crisp white or cream for contrast, complementary furnishings in natural materials like rattan, jute, and light wood tones, textile accents in cream, mustard, sage green, and rust tones, decorative elements including ceramic vases, woven baskets, and dried pampas grass, artwork with warm tones and natural subjects, brass or gold-toned light fixtures and hardware, plants in terra cotta pots adding to earthy theme, layered textures with linen curtains, wool throws, and leather accents, natural fiber area rug grounding the space, abundant natural light warming the terracotta tones, touches of blue or teal as accent colors for balance, overall aesthetic of Mediterranean warmth meets modern bohemian style with the terracotta walls creating a cozy sophisticated backdrop that feels both current and timeless, perfect for creating inviting living spaces with personality.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Warm Tones',
    room_type: null,
    enabled: true,
    sort_order: 5,
    popularity: 'high'
  },
  {
    name: 'Sage Green Tranquility',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-sage.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with sophisticated sage green wall paint in soft muted green with gray undertones creating calming atmosphere, walls in matte finish emphasizing the subtle complexity of the color, white or off-white trim creating clean contrast, natural wood furniture in light oak or walnut tones, textile layers in cream, soft pink, terracotta, and additional green tones, botanical artwork and nature-inspired prints, mixed metal finishes including brass, gold, and black accents, abundant greenery with various houseplants in ceramic pots, linen curtains in natural or white allowing soft light filtration, rattan or cane furniture pieces adding organic texture, marble or stone accents on surfaces, warm wood flooring or natural fiber rugs, vintage or antique accessories for character, soft ambient lighting with warm-toned bulbs, touches of blush pink or dusty rose as accent colors, overall aesthetic of modern organic elegance with the sage green walls creating a serene sophisticated environment that connects to nature while maintaining contemporary refinement, perfect for bedrooms, living rooms, or any space seeking peaceful ambiance.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Cool Tones',
    room_type: null,
    enabled: true,
    sort_order: 2,
    popularity: 'high'
  },
  {
    name: 'Classic White Elegance',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-white.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with timeless white wall paint in warm white with subtle undertones (not stark white) creating bright and airy foundation, walls in matte or eggshell finish with flawless smooth application, trim, moldings, and ceiling in same white or slightly brighter white for seamless look, varied textures preventing monotony including linen upholstery, wool throws, smooth leather, rough stone, and polished wood, layered neutrals in beige, gray, taupe, and cream adding depth, strategic pops of color through artwork, pillows, or accessories, mixed materials including natural wood, metal, glass, and organic fibers, statement lighting fixtures as sculptural elements, architectural details like moldings or paneling emphasized by white backdrop, large windows maximizing natural light, mirrors strategically placed to amplify brightness, greenery adding life and color contrast, high-quality furnishings with clean lines, carefully curated accessories avoiding clutter, texture-rich textiles in various whites and creams, overall aesthetic of sophisticated simplicity with white walls creating versatile canvas for any style while maintaining sense of calm elegance and light-filled spaciousness, perfect for showcasing architectural features and allowing flexibility in decor changes.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Neutral Tones',
    room_type: null,
    enabled: true,
    sort_order: 1,
    popularity: 'high'
  },
  {
    name: 'Navy Blue Drama',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-navy.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with dramatic navy blue wall paint in deep sophisticated blue with slight gray undertones creating moody elegant atmosphere, walls in matte or flat finish emphasizing richness and depth of color, bright white trim and moldings providing striking contrast, adequate lighting to prevent space feeling too dark including layered lighting with ambient, task, and accent sources, brass, gold, or bronze metallic accents adding warmth and luxury, lighter-toned furnishings in cream, white, light gray, or natural wood preventing heaviness, mirrors with decorative frames reflecting light and adding dimension, artwork with white matting and gold frames standing out against dark walls, textile layers in velvet, silk, and linen adding textural interest, strategic use of white or light-colored large furniture pieces anchoring space, patterned accessories incorporating navy with lighter colors, crystal or glass elements adding sparkle, white or light-colored ceiling maintaining openness, natural fiber rugs in lighter tones, greenery in white or metallic planters, overall aesthetic of sophisticated drama with the navy walls creating intimate cocooning effect perfect for dining rooms, libraries, bedrooms, or accent walls, balancing boldness with enough contrast and light to maintain inviting refined atmosphere.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Bold Colors',
    room_type: null,
    enabled: true,
    sort_order: 8,
    popularity: 'medium'
  },
  {
    name: 'Warm Beige Neutrality',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-beige.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with versatile warm beige wall paint in soft greige (gray-beige blend) or classic beige with warm undertones creating cozy welcoming foundation, walls in eggshell or satin finish providing subtle sheen and durability, trim in crisp white or cream creating gentle contrast, complements virtually any furniture style and color, layered neutrals in taupes, browns, creams adding depth and sophistication, natural materials like wood, rattan, jute, and linen enhancing organic warmth, artwork and accessories in any color palette looking harmonious, brass, gold, or bronze metallic accents adding subtle luxury, plants and greenery popping against neutral backdrop, textured elements preventing flatness including woven baskets, chunky knits, and nubby fabrics, varied lighting creating warmth with warm-toned bulbs, natural light enhancing warm tones during day, color-changing ability adapting to different lights and times of day, works beautifully in any room from bedrooms to living spaces, creates cohesive flow when used throughout home, overall aesthetic of timeless versatility with warm beige walls providing perfect neutral canvas that makes spaces feel larger, brighter, and more sophisticated while maintaining warm inviting quality suitable for traditional and contemporary interiors alike.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Neutral Tones',
    room_type: null,
    enabled: true,
    sort_order: 3,
    popularity: 'high'
  },
  {
    name: 'Blush Pink Softness',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-blush.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with delicate blush pink wall paint in soft dusty rose or pale pink with gray undertones avoiding overly sweet or childish tones, walls in matte finish emphasizing sophisticated subtlety, white or cream trim maintaining lightness, creates romantic yet modern atmosphere, pairs beautifully with brass, gold, and copper metallic accents, furniture in white, natural wood, or gray tones preventing overwhelming sweetness, layered textiles in complementary colors including gray, cream, sage green, and deeper rose tones, velvet and linen textures adding luxury, botanical prints and greenery providing fresh contrast, marble or stone accents adding elegance, warm-toned lighting enhancing pink undertones, works well in bedrooms, dressing rooms, or feminine home offices, strategic use preventing space feeling too themed, modern art and geometric patterns balancing softness, black accents adding contemporary edge, natural light showing color's complexity changing throughout day, overall aesthetic of grown-up romance with blush walls creating Instagram-worthy backdrop that is both trendy and timeless, perfect for creating serene feminine space with sophistication and restraint that appeals to modern sensibilities.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Accent Colors',
    room_type: null,
    enabled: true,
    sort_order: 10,
    popularity: 'medium'
  },
  {
    name: 'Charcoal Gray Modern',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-charcoal.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with sophisticated charcoal gray wall paint in deep cool-toned gray creating modern dramatic backdrop, walls in matte finish emphasizing depth and richness, bright white trim and ceiling preventing space from feeling cave-like, layered lighting essential including ambient ceiling lights, task lighting, and warm-toned accent lights, metallic accents in brass, copper, or rose gold adding warmth against cool gray, light-colored furniture in cream, white, or light gray providing contrast, mirrors strategically placed to reflect light and open space, artwork with colorful accents standing out dramatically against dark walls, textured textiles in lighter tones including chunky knits and linen, large windows or glass doors bringing in natural light, indoor plants adding life and green contrast, modern geometric patterns in accessories, warm wood tones preventing space from feeling too cool, strategic use of white or light-colored large elements anchoring room, sleek modern furniture with clean lines complementing contemporary aesthetic, overall aesthetic of urban sophistication with charcoal walls creating gallery-like atmosphere perfect for showcasing art and creating bold modern statement while maintaining livable comfort through careful balance of light and contrasting elements.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Bold Colors',
    room_type: null,
    enabled: true,
    sort_order: 9,
    popularity: 'medium'
  },
  {
    name: 'Soft Gray Versatility',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-wall-softgray.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with versatile soft gray wall paint in light to medium gray with warm or cool undertones depending on room's natural light, walls in eggshell finish providing subtle sheen and easy maintenance, white or matching gray trim creating cohesive seamless look, neutral foundation working with any decor style from traditional to contemporary, layered textures preventing space from feeling flat including varied fabrics, woods, and metals, works as perfect backdrop for colorful artwork and accessories, furniture in any color or style coordinating beautifully, natural wood tones adding warmth, white accents keeping space bright and fresh, pops of color through pillows, throws, and decor standing out against neutral background, metallic accents in any finish looking elegant, abundant natural light bringing out gray's complexity, artificial lighting in warm tones creating cozy atmosphere, greenery and plants providing organic color contrast, creates calm sophisticated atmosphere, updates easily with changing decor trends, overall aesthetic of modern neutrality with soft gray walls offering timeless versatility that adapts to any style while maintaining contemporary refinement perfect for those seeking flexible backdrop that will remain relevant through years and design changes.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Wall Paint',
    sub_category: 'Neutral Tones',
    room_type: null,
    enabled: true,
    sort_order: 4,
    popularity: 'high'
  },
];

// ============================================
// FLOOR STYLE TEMPLATES
// ============================================

export const FLOOR_TEMPLATES: OtherCategoryTemplate[] = [
  {
    name: 'Wide Plank Oak Hardwood',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-oak.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with beautiful wide plank white oak hardwood flooring featuring planks 7-10 inches wide and random lengths creating modern clean look, natural wood grain visible with cathedral and straight grain patterns, finish in natural light tone or subtle whitewash showing wood character, matte or low-sheen finish for contemporary aesthetic, tight seams with minimal gaps between boards, color variation adding natural interest from plank to plank, warm honey tones or cooler gray-toned finish based on stain choice, smooth surface with hand-scraped or wire-brushed texture options, complements various interior styles from modern to traditional, furniture ranging from light to dark wood tones working harmoniously, area rugs in natural fibers or modern patterns defining spaces, floor as neutral backdrop allowing furnishings and decor to shine, natural light highlighting wood grain and color variation, durable finish suitable for high-traffic areas, slight imperfections and knots adding authentic wood character, overall aesthetic of timeless elegance with wide plank oak flooring adding warmth, value, and organic beauty to the space while providing versatile foundation for any design direction.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Hardwood',
    room_type: null,
    enabled: true,
    sort_order: 1,
    popularity: 'high'
  },
  {
    name: 'Herringbone Pattern Flooring',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-herringbone.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with stunning herringbone pattern flooring featuring rectangular planks laid at 45-degree angles creating distinctive V-shaped pattern, classic design adding sophistication and visual interest, planks in medium width (3-5 inches) showing pattern clearly, material options including oak, walnut, or engineered wood in warm to cool tones, consistent finish across all planks emphasizing pattern geometry, precision installation with tight seams and perfect alignment, pattern drawing eye and making space appear larger, works beautifully in formal areas like living rooms, dining rooms, or entryways, finish in matte or satin sheen, subtle color variation within wood adding depth while maintaining pattern visibility, furniture placement respecting and showcasing floor pattern, area rugs used sparingly to not hide intricate design, pattern creating sense of movement and flow, complements both traditional and contemporary interiors, statement floor becoming focal point of room, border or transition to different pattern at room edges, overall aesthetic of timeless luxury with herringbone floor pattern elevating the entire space with its classic elegance and meticulous craftsmanship creating high-end designer look.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Pattern Styles',
    room_type: null,
    enabled: true,
    sort_order: 5,
    popularity: 'high'
  },
  {
    name: 'Large Format Porcelain Tile',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-porcelain.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with contemporary large format porcelain tile flooring featuring tiles 24x48 inches or larger creating seamless modern look, minimal grout lines contributing to sleek appearance, rectified edges allowing for tight grout joints (1/16 inch), color options from neutral whites and grays to warmer beiges and taupes, surface finish in matte or honed for sophisticated subtle texture, optional marble or concrete look-alike patterns, consistent color throughout for uniform appearance or subtle variation mimicking natural stone, thin grout lines in matching or slightly contrasting color, tiles in consistent pattern (straight lay, brick, or minimal offset), works perfectly in modern, minimalist, or contemporary spaces, suitable for kitchens, bathrooms, living areas, or entire open floor plans, seamless transition between rooms maintaining flow, easy maintenance and extreme durability, underfloor heating compatible, cool surface balanced with area rugs in living spaces, reflective quality enhancing natural light, overall aesthetic of refined modernism with large format tiles creating gallery-like backdrop emphasizing clean lines and uncluttered spaces with commercial-grade quality for residential luxury.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Tile & Stone',
    room_type: null,
    enabled: true,
    sort_order: 3,
    popularity: 'high'
  },
  {
    name: 'Luxury Vinyl Plank',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-lvp.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with high-quality luxury vinyl plank (LVP) flooring featuring realistic wood-look design nearly indistinguishable from real hardwood, wide planks (7-9 inches) in varied lengths mimicking natural wood installation, embossed texture synchronized with printed grain pattern for authentic feel, color options from light whitewashed oak to rich walnut tones, matte finish reducing shine and enhancing realism, tight click-lock seams creating seamless appearance, minimal or micro-beveled edges between planks, waterproof and scratch-resistant surface ideal for active households, suitable for all rooms including kitchens and bathrooms, consistent color and texture throughout installation, slight variation between planks replicating natural wood, complements any decor style from modern to traditional, works with underfloor heating, easy maintenance requiring only sweeping and occasional mopping, sound-absorbing underlayment reducing noise, cost-effective alternative to hardwood without sacrificing aesthetic, durable wear layer protecting against daily traffic, overall aesthetic of practical luxury with LVP providing perfect balance of beauty, durability, and affordability creating designer look that withstands real life while maintaining sophisticated high-end appearance.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Vinyl & Laminate',
    room_type: null,
    enabled: true,
    sort_order: 7,
    popularity: 'medium'
  },
  {
    name: 'Dark Walnut Hardwood',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-walnut.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with luxurious dark walnut hardwood flooring featuring rich chocolate brown to deep espresso tones with subtle reddish undertones, medium to wide planks (5-8 inches) showcasing natural grain patterns, satin or semi-gloss finish adding subtle sheen and protection, dramatic color variation from plank to plank creating visual interest, straight grain and swirling cathedral patterns visible, creates elegant sophisticated foundation for room, contrasts beautifully with light-colored walls and furnishings, works well with both traditional and contemporary styles, area rugs in lighter tones or colorful patterns standing out against dark floors, shows dust less than light floors, requires adequate lighting to prevent space feeling too dark, metallic accents in brass, gold, or silver popping against dark background, white or cream furniture creating stunning contrast, natural wood tones in lighter shades adding warmth, strategic placement of light sources highlighting floor beauty, timeless appeal with high-end luxury feel, overall aesthetic of dramatic elegance with dark walnut floors adding depth, richness, and sophisticated ambiance while creating perfect backdrop for making furniture and decor stand out beautifully.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Hardwood',
    room_type: null,
    enabled: true,
    sort_order: 2,
    popularity: 'high'
  },
  {
    name: 'Marble Look Tile',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-marble.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with stunning marble-look porcelain tile flooring featuring realistic veining patterns mimicking natural marble in Carrara white, Calacatta gold, or gray marble varieties, large format tiles (24x24 inches or larger) reducing grout lines for seamless appearance, rectified edges allowing minimal grout joints, polished finish creating elegant shine or honed finish for subtle matte sophistication, book-matched or vein-matched installation creating dramatic continuous pattern, thin grout lines in matching or contrasting color, cool elegant color palette of whites, grays, with gold or gray veining, works beautifully in bathrooms, kitchens, entryways, or formal living areas, radiant floor heating enhancing comfort, easier maintenance than real marble without etching or staining concerns, pairs with chrome, brushed nickel, or brass fixtures, furniture in dark wood or upholstered pieces providing contrast, area rugs defining spaces and adding warmth, overall aesthetic of timeless luxury with marble-look floors creating spa-like sophistication and European elegance while offering practical benefits of porcelain durability making luxury accessible and maintenance-friendly.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Tile & Stone',
    room_type: null,
    enabled: true,
    sort_order: 4,
    popularity: 'high'
  },
  {
    name: 'Chevron Pattern Wood',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-chevron.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with sophisticated chevron pattern wood flooring featuring planks cut at precise angles (typically 45 or 60 degrees) meeting at point to create continuous zigzag pattern, creates sense of movement and visual drama, narrower planks (3-5 inches) showing pattern more distinctly, hardwood in oak, walnut, or engineered wood with consistent stain color, point-to-point installation requiring expert craftsmanship, uniform finish across all pieces emphasizing geometric design, works beautifully in formal spaces like dining rooms, master bedrooms, or entryways, pattern making room appear wider or longer depending on orientation, luxurious high-end aesthetic associated with European design, furniture placement respecting and showcasing floor pattern without hiding it, neutral area rugs allowing pattern to shine through, complements both contemporary and traditional interiors, statement floor becoming room's focal point, consistent color throughout or subtle variation adding depth, overall aesthetic of architectural elegance with chevron pattern elevating entire space through its geometric precision and visual impact creating museum-quality flooring that showcases refined taste and attention to detail.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Pattern Styles',
    room_type: null,
    enabled: true,
    sort_order: 6,
    popularity: 'medium'
  },
  {
    name: 'Reclaimed Wood Rustic',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-reclaimed.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with characterful reclaimed wood flooring featuring planks salvaged from old barns, warehouses, or structures showing authentic age and history, varied plank widths from narrow to wide creating organic irregular look, rich patina developed over decades visible in wood's surface, nail holes, saw marks, and weathering adding authentic character, mixed wood species creating color variation from honey tones to deep browns, hand-scraped or distressed texture emphasizing rustic quality, matte or low-sheen finish protecting wood while maintaining natural appearance, slight gaps or imperfections between boards adding to authentic reclaimed aesthetic, works beautifully in farmhouse, rustic, industrial, or eclectic interiors, each plank unique with its own story and character marks, complements both modern and traditional furniture styles, sustainable eco-friendly choice reusing quality materials, durable hardwood standing test of time, warm inviting atmosphere created by aged wood, pairs with industrial metals, natural textiles, and vintage accessories, overall aesthetic of authentic heritage with reclaimed floors adding soul and history to space creating one-of-a-kind foundation that celebrates craftsmanship and sustainability while providing lasting beauty with genuine character.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Hardwood',
    room_type: null,
    enabled: true,
    sort_order: 8,
    popularity: 'medium'
  },
  {
    name: 'Terrazzo Modern Classic',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder-floor-terrazzo.png',
    prompt: `---[ 提示词开始 / PROMPT START ]---
${PROMPT_BASE}

Transform this space with stunning terrazzo flooring featuring composite material of marble, quartz, granite, or glass chips set in concrete or epoxy binder, polished smooth surface showing multicolored aggregate creating speckled pattern, modern terrazzo in trending color combinations like white base with gray and pink chips or charcoal with brass and marble chips, seamless installation with minimal joints creating expansive look, available in tiles or poured-in-place for custom application, works beautifully in modern, mid-century, or contemporary spaces, durable low-maintenance surface suitable for high-traffic areas, cool surface perfect for warm climates, custom color combinations possible to match any design scheme, geometric inlay patterns or borders adding design interest, pairs with modern furniture and clean-lined decor, metallic chips adding subtle sparkle and dimension, suitable for both residential and commercial applications, water-resistant making it perfect for bathrooms and kitchens, overall aesthetic of artistic modernism with terrazzo floors making bold sophisticated statement while providing practical benefits creating designer look that references mid-century classic while feeling completely contemporary and fresh in today's interiors.
${PROMPT_FOOTER}
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook  // 项目：MyNook
// Recipe Version: MyNook-V1.0-Universal`,
    main_category: 'Floor Style',
    sub_category: 'Tile & Stone',
    room_type: null,
    enabled: true,
    sort_order: 10,
    popularity: 'high'
  },
];

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export function generateAllOtherCategoryTemplates(): OtherCategoryTemplate[] {
  return [
    ...EXTERIOR_TEMPLATES,
    ...GARDEN_TEMPLATES,
    ...FESTIVE_TEMPLATES,
    ...WALL_PAINT_TEMPLATES,
    ...FLOOR_TEMPLATES,
  ];
}

// For CLI execution
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const templates = generateAllOtherCategoryTemplates();
  console.log(`Generated ${templates.length} templates for other categories`);
  console.log(JSON.stringify(templates, null, 2));
}

