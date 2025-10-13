/**
 * 测试上传缩略图脚本
 * 用于上传 upload 文件夹中的图片到 Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase 配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 本地图片文件夹路径
const IMAGES_FOLDER = path.join(process.cwd(), 'upload');

// Supabase Storage Bucket 名称
const STORAGE_BUCKET = 'template-thumbnails';

// 文件到模板的映射
const FILE_TO_TEMPLATE_MAP: Record<string, { templateId: string; templateName: string }> = {
    'Latte___Creamy_Style_Living_Room_1760359717742.png': {
        templateId: '1df50169-533c-4745-9157-902b9e55ffe8',
        templateName: 'Latte / Creamy Style Living Room'
    },
    'style_living-room_latte-creamy-style-living-room_1760360118928.png': {
        templateId: '1df50169-533c-4745-9157-902b9e55ffe8',
        templateName: 'Latte / Creamy Style Living Room'
    },
    'style_living-room_organic-modern-living-room_1760360118928.png': {
        templateId: '18f2c806-f0f5-435c-acea-e3036c6a16ac',
        templateName: 'Organic Modern Living Room'
    }
};

async function main() {
    console.log('\n🚀 测试上传缩略图工具\n');
    
    // 检查环境变量
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ 错误: 缺少 Supabase 配置');
        console.error('请设置以下环境变量:');
        console.error('- VITE_SUPABASE_URL');
        console.error('- SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }
    
    // 检查文件夹
    if (!fs.existsSync(IMAGES_FOLDER)) {
        console.error(`❌ 错误: 文件夹不存在: ${IMAGES_FOLDER}`);
        process.exit(1);
    }
    
    // 创建 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Supabase 客户端创建成功\n');
    
    // 读取文件
    const files = fs.readdirSync(IMAGES_FOLDER).filter(f => f.endsWith('.png'));
    console.log(`📊 找到 ${files.length} 个图片文件\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const mapping = FILE_TO_TEMPLATE_MAP[fileName];
        
        if (!mapping) {
            console.log(`[${i + 1}/${files.length}] ⚠️  跳过: ${fileName} (无映射)`);
            failCount++;
            continue;
        }
        
        console.log(`\n[${i + 1}/${files.length}] 处理: ${fileName}`);
        console.log(`   📋 模板: ${mapping.templateName}`);
        console.log(`   🔑 ID: ${mapping.templateId}`);
        
        try {
            // 读取文件
            const filePath = path.join(IMAGES_FOLDER, fileName);
            const fileBuffer = fs.readFileSync(filePath);
            
            // 构建 Storage 路径
            const storagePath = `style/living-room/${mapping.templateId}.png`;
            console.log(`   📤 上传到: ${storagePath}`);
            
            // 上传到 Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });
            
            if (uploadError) {
                throw uploadError;
            }
            
            // 获取公开 URL
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(storagePath);
            
            const publicUrl = urlData.publicUrl;
            console.log(`   ✅ 上传成功: ${publicUrl}`);
            
            // 更新数据库
            const { error: dbError } = await supabase
                .from('design_templates')
                .update({ image_url: publicUrl })
                .eq('id', mapping.templateId);
            
            if (dbError) {
                throw dbError;
            }
            
            console.log(`   ✅ 数据库更新成功`);
            successCount++;
            
        } catch (error: any) {
            console.error(`   ❌ 失败:`, error.message);
            failCount++;
        }
        
        // 延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 输出统计
    console.log('\n\n📊 上传统计\n');
    console.log(`总文件数: ${files.length}`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failCount}`);
    
    console.log('\n✨ 完成!\n');
}

main().catch(error => {
    console.error('\n❌ 发生错误:', error);
    process.exit(1);
});

