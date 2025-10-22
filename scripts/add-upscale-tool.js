/**
 * 添加 Image Upscale 工具到数据库
 * 使用方法: node scripts/add-upscale-tool.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量！');
  console.error('请确保 .env 文件中设置了 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImageUpscaleTool() {
  console.log('🚀 开始添加 Image Upscale 工具到数据库...');
  
  try {
    // 检查是否已存在
    const { data: existing, error: checkError } = await supabase
      .from('tools_order')
      .select('*')
      .eq('tool_id', 'image-upscale')
      .single();
    
    if (existing) {
      console.log('ℹ️  Image Upscale 工具已存在，正在更新...');
    } else {
      console.log('➕ 正在添加新工具...');
    }
    
    // 插入或更新数据
    const { data, error } = await supabase
      .from('tools_order')
      .upsert({
        tool_id: 'image-upscale',
        name: 'Image Upscale',
        short_name: 'Upscale',
        emoji: '🔍',
        is_premium: true,
        is_coming_soon: false,
        sort_order: 12,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tool_id'
      });
    
    if (error) {
      console.error('❌ 添加失败:', error);
      process.exit(1);
    }
    
    console.log('✅ 成功添加 Image Upscale 工具！');
    
    // 验证数据
    const { data: allTools, error: verifyError } = await supabase
      .from('tools_order')
      .select('tool_id, name, sort_order')
      .order('sort_order');
    
    if (!verifyError && allTools) {
      console.log('\n📋 当前所有工具:');
      allTools.forEach(tool => {
        console.log(`  ${tool.sort_order}. ${tool.name} (${tool.tool_id})`);
      });
    }
    
    console.log('\n🎉 完成！请刷新浏览器页面并清除缓存。');
    console.log('\n在浏览器控制台运行:');
    console.log('localStorage.removeItem("mynook_tools_order_cache");');
    console.log('localStorage.removeItem("mynook_tools_order_timestamp");');
    console.log('location.reload();');
    
  } catch (err) {
    console.error('❌ 执行出错:', err);
    process.exit(1);
  }
}

// 执行
addImageUpscaleTool();

