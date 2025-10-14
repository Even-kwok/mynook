/**
 * Generate Simple CSV Tracker for Template Images
 * 为 31 个模板生成简单的 CSV 跟踪文件
 */

// 导入数据 (与 supabase-mcp-import.js 保持一致)
const DESIGN_STYLES = [
  { id: 'latte-creamy-style', name: 'Latte / Creamy Style', sortOrder: 1 },
  { id: 'dopamine-decor', name: 'Dopamine Decor', sortOrder: 2 },
  { id: 'organic-modern', name: 'Organic Modern', sortOrder: 3 },
  { id: 'quiet-luxury', name: 'Quiet Luxury', sortOrder: 4 },
  { id: 'warm-minimalism', name: 'Warm Minimalism', sortOrder: 5 },
  { id: 'scandinavian', name: 'Scandinavian', sortOrder: 6 },
  { id: 'maximalist', name: 'Maximalist', sortOrder: 7 },
  { id: 'japandi', name: 'Japandi', sortOrder: 8 },
  { id: 'modern-farmhouse', name: 'Modern Farmhouse', sortOrder: 9 },
  { id: 'modern-minimalist', name: 'Modern Minimalist', sortOrder: 10 },
];

const ROOM_STYLE_MATRIX = {
  'living-room': ['latte-creamy-style', 'dopamine-decor', 'organic-modern', 'quiet-luxury', 'warm-minimalism', 'scandinavian', 'maximalist', 'japandi', 'modern-farmhouse', 'modern-minimalist'],
  'master-bedroom': ['latte-creamy-style', 'warm-minimalism', 'quiet-luxury', 'organic-modern', 'scandinavian', 'japandi'],
  'kitchen': ['modern-farmhouse', 'latte-creamy-style', 'scandinavian', 'organic-modern', 'modern-minimalist'],
  'bathroom': ['organic-modern', 'scandinavian', 'quiet-luxury', 'japandi', 'modern-minimalist'],
  'home-office': ['modern-minimalist', 'scandinavian', 'organic-modern', 'japandi', 'quiet-luxury'],
};

// 生成模板数据
function generateTemplates() {
  const templates = [];
  const styleMap = new Map(DESIGN_STYLES.map(s => [s.id, s]));

  for (const [roomType, styleIds] of Object.entries(ROOM_STYLE_MATRIX)) {
    const roomName = roomType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    for (const styleId of styleIds) {
      const style = styleMap.get(styleId);
      if (!style) continue;

      templates.push({
        room_type: roomType,
        room_name: roomName,
        style_id: styleId,
        style_name: style.name,
        full_name: `${style.name} ${roomName}`,
        sort_order: style.sortOrder,
        image_url: `https://storage.googleapis.com/aistudio-hosting/templates/placeholder-${roomType}-${styleId}.png`,
        image_status: 'Pending',
        notes: ''
      });
    }
  }

  // 按 sort_order 排序
  templates.sort((a, b) => a.sort_order - b.sort_order);

  return templates;
}

// 生成 CSV 内容
function generateCSV() {
  const templates = generateTemplates();

  // CSV Header
  let csv = 'Room Type,Room Name,Style ID,Style Name,Full Template Name,Sort Order,Priority,Image URL,Image Status,Notes\n';

  // 根据 sort_order 判断优先级
  const getPriority = (sortOrder) => {
    if (sortOrder <= 5) return 'High 🔥🔥🔥';
    if (sortOrder <= 8) return 'High 🔥🔥🔥';
    return 'High 🔥🔥🔥'; // 所有都是高优先级风格
  };

  // CSV Rows
  for (const t of templates) {
    const priority = getPriority(t.sort_order);
    csv += `"${t.room_type}","${t.room_name}","${t.style_id}","${t.style_name}","${t.full_name}",${t.sort_order},"${priority}","${t.image_url}","${t.image_status}","${t.notes}"\n`;
  }

  return csv;
}

// 输出 CSV
console.log(generateCSV());

// 统计信息
const templates = generateTemplates();
console.error(`\n========================================`);
console.error(`CSV Generation Complete`);
console.error(`========================================`);
console.error(`Total templates: ${templates.length}`);
console.error(`By room type:`);

const byRoom = {};
templates.forEach(t => {
  byRoom[t.room_name] = (byRoom[t.room_name] || 0) + 1;
});

Object.entries(byRoom).forEach(([room, count]) => {
  console.error(`  - ${room}: ${count} templates`);
});

console.error(`\nFile saved as: templates-tracking.csv`);
console.error(`========================================\n`);

