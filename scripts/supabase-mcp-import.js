/**
 * Supabase MCP Import Script (方案B)
 * 使用项目的 Supabase 配置通过编程方式导入模板
 */

import { createClient } from '@supabase/supabase-js';

// 从命令行或环境变量获取配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.argv[2];
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.argv[3];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 缺少 Supabase 凭证！');
  console.error('');
  console.error('用法 1 - 使用环境变量:');
  console.error('  在 Windows PowerShell:');
  console.error('    $env:VITE_SUPABASE_URL="your_url"');
  console.error('    $env:VITE_SUPABASE_ANON_KEY="your_key"');
  console.error('    node scripts/supabase-mcp-import.js');
  console.error('');
  console.error('用法 2 - 使用命令行参数:');
  console.error('    node scripts/supabase-mcp-import.js <SUPABASE_URL> <SUPABASE_ANON_KEY>');
  process.exit(1);
}

console.log('✅ Supabase 配置已加载');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${'*'.repeat(20)}...${SUPABASE_ANON_KEY.slice(-4)}\n`);

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 设计风格定义
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

// 房间-风格矩阵
const ROOM_STYLE_MATRIX = {
  'living-room': ['latte-creamy-style', 'dopamine-decor', 'organic-modern', 'quiet-luxury', 'warm-minimalism', 'scandinavian', 'maximalist', 'japandi', 'modern-farmhouse', 'modern-minimalist'],
  'master-bedroom': ['latte-creamy-style', 'warm-minimalism', 'quiet-luxury', 'organic-modern', 'scandinavian', 'japandi'],
  'kitchen': ['modern-farmhouse', 'latte-creamy-style', 'scandinavian', 'organic-modern', 'modern-minimalist'],
  'bathroom': ['organic-modern', 'scandinavian', 'quiet-luxury', 'japandi', 'modern-minimalist'],
  'home-office': ['modern-minimalist', 'scandinavian', 'organic-modern', 'japandi', 'quiet-luxury'],
};

// Prompt 模板
const PROMPT_BASE = `Crucial Command: This is a TOTAL space transformation project. The user's input image is for layout, structural, and perspective reference ONLY. ALL visible surfaces (walls, floors, ceilings) and existing elements within the input image MUST BE COMPLETELY REPLACED according to the specified style.

Strictly retain the spatial structure, camera perspective, lighting direction, and main elements' positions from the user's input image.

The final output must be a professional-grade photograph, photorealistic, with exceptional attention to detail. The image should evoke a sense of sophisticated comfort, suitable for features in leading design publications.

Employ soft, natural, and inviting lighting with ample diffused natural light.`;

const PROMPT_FOOTER = `

The final image must be of Hasselblad quality, photorealistic, with extreme detail and vibrant color accuracy.`;

// 风格描述
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

// 生成模板函数
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
        image_url: `https://storage.googleapis.com/aistudio-hosting/templates/placeholder-${roomType}-${styleId}.png`,
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

// 主导入函数
async function importTemplates() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     MyNook Supabase MCP 模板导入 (方案B - 编程方式)       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 生成模板数据
    console.log('📝 正在生成模板数据...');
    const templates = generateTemplates();
    console.log(`✅ 已生成 ${templates.length} 个模板\n`);

    // 步骤 1: 清除现有模板
    console.log('📍 步骤 1/3: 清除现有 Interior Design 模板...\n');
    
    const { error: deleteError } = await supabase
      .from('design_templates')
      .delete()
      .eq('main_category', 'Interior Design');

    if (deleteError) {
      console.error('❌ 删除失败:', deleteError.message);
      throw deleteError;
    }

    console.log('✅ 步骤 1 完成!\n');

    // 步骤 2: 批量导入新模板
    console.log('📍 步骤 2/3: 批量导入新模板...\n');
    
    const batchSize = 10;
    let imported = 0;
    let failed = 0;
    const totalBatches = Math.ceil(templates.length / batchSize);

    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      console.log(`   批次 ${batchNum}/${totalBatches}: 导入 ${batch.length} 个模板...`);

      const { data, error } = await supabase
        .from('design_templates')
        .insert(batch)
        .select();

      if (error) {
        console.error(`   ❌ 批次失败:`, error.message);
        failed += batch.length;
      } else {
        console.log(`   ✅ 批次导入成功 (${data.length} 个模板)`);
        imported += data.length;
      }

      // 批次间延迟
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n✅ 步骤 2 完成!\n');

    // 步骤 3: 验证导入
    console.log('📍 步骤 3/3: 验证导入结果...\n');

    const { data: verifyData, error: verifyError, count } = await supabase
      .from('design_templates')
      .select('id, name, room_type, sort_order', { count: 'exact' })
      .eq('main_category', 'Interior Design')
      .order('sort_order')
      .limit(10);

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
      throw verifyError;
    }

    console.log(`✅ 数据库中共有 ${count} 个模板`);
    console.log('\n前 10 个模板样本:');
    verifyData.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (${t.room_type}, 排序: ${t.sort_order})`);
    });

    console.log('\n✅ 步骤 3 完成!\n');

    // 最终统计
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  🎉 导入成功! 🎉                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 导入统计:');
    console.log(`   • 准备导入: ${templates.length} 个模板`);
    console.log(`   • 成功导入: ${imported} 个模板`);
    console.log(`   • 失败: ${failed} 个模板`);
    console.log(`   • 数据库中总计: ${count} 个模板`);
    console.log(`   • 成功率: ${((imported / templates.length) * 100).toFixed(1)}%\n`);

    console.log('📝 下一步:');
    console.log('   1. 在 Supabase Dashboard 中验证模板');
    console.log('   2. 使用 CSV 文件生成图片');
    console.log('   3. 更新图片 URL\n');

    console.log('✨ Supabase MCP 方法导入完成!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║                    ❌ 导入失败 ❌                          ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error('💥 错误:', error.message);
    console.error('\n请检查:');
    console.error('   1. Supabase URL 和 Key 是否正确');
    console.error('   2. 网络连接是否正常');
    console.error('   3. 数据库表是否存在');
    console.error('   4. RLS 策略是否正确配置\n');
    process.exit(1);
  }
}

// 执行导入
importTemplates();

