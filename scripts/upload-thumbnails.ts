/**
 * 批量上传缩略图脚本
 * 
 * 功能:
 * 1. 读取 downloaded-images 文件夹中的图片
 * 2. 解析文件名获取元数据
 * 3. 上传到 Supabase Storage
 * 4. 更新 templates 表的 imageUrl 字段
 * 
 * 使用方法:
 * npx tsx scripts/upload-thumbnails.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ========== 配置区域 ==========

// Supabase 配置 (从环境变量读取)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 本地图片文件夹路径
const IMAGES_FOLDER = path.join(process.cwd(), 'downloaded-images');

// Supabase Storage Bucket 名称
const STORAGE_BUCKET = 'template-thumbnails';

// 是否实际上传（false 为测试模式，只解析不上传）
const DRY_RUN = false;

// ========== 类型定义 ==========

interface ParsedFileName {
    type: string;
    roomTypeId: string;
    templateName: string;
    timestamp: string;
    originalName: string;
}

interface UploadResult {
    fileName: string;
    templateId: string;
    success: boolean;
    storageUrl?: string;
    error?: string;
}

// ========== 主要函数 ==========

/**
 * 解析文件名获取元数据
 */
function parseFileName(fileName: string): ParsedFileName | null {
    // 移除扩展名
    const baseName = fileName.replace(/\.png$/i, '');
    
    // 按下划线分割
    const parts = baseName.split('_');
    
    if (parts.length < 4) {
        console.warn(`⚠️  无效的文件名格式: ${fileName}`);
        return null;
    }
    
    return {
        type: parts[0],           // 'style', 'exterior', 'garden', etc.
        roomTypeId: parts[1],     // 'living-room', 'house', 'no-room'
        templateName: parts[2],   // 'modern-minimalist', 'contemporary'
        timestamp: parts[3],      // 时间戳
        originalName: fileName
    };
}

/**
 * 上传单个文件到 Supabase Storage
 */
async function uploadFile(
    supabase: any,
    filePath: string,
    parsed: ParsedFileName,
    templateId: string
): Promise<UploadResult> {
    try {
        // 读取文件
        const fileBuffer = fs.readFileSync(filePath);
        
        // 构建 Storage 路径: {type}/{roomTypeId}/{templateId}.png
        // 使用实际的模板UUID作为文件名，确保唯一性
        const storagePath = `${parsed.type}/${parsed.roomTypeId}/${templateId}.png`;
        
        console.log(`   📤 上传到: ${storagePath}`);
        
        if (DRY_RUN) {
            console.log(`   [测试模式] 跳过实际上传`);
        return {
            fileName: parsed.originalName,
            templateId: templateId,
            success: true,
            storageUrl: `[DRY_RUN] ${storagePath}`
        };
        }
        
        // 上传到 Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                upsert: true // 如果文件已存在则覆盖
            });
        
        if (error) {
            throw error;
        }
        
        // 获取公开 URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);
        
        const publicUrl = urlData.publicUrl;
        
        console.log(`   ✅ 上传成功: ${publicUrl}`);
        
        return {
            fileName: parsed.originalName,
            templateId: templateId,
            success: true,
            storageUrl: publicUrl
        };
        
    } catch (error: any) {
        console.error(`   ❌ 上传失败:`, error.message);
        return {
            fileName: parsed.originalName,
            templateId: templateId,
            success: false,
            error: error.message
        };
    }
}

/**
 * 更新 design_templates 表的 image_url
 */
async function updateTemplateUrl(
    supabase: any,
    templateId: string,
    imageUrl: string
): Promise<boolean> {
    try {
        if (DRY_RUN) {
            console.log(`   [测试模式] 跳过数据库更新`);
            return true;
        }
        
        const { data, error } = await supabase
            .from('design_templates')
            .update({ image_url: imageUrl })
            .eq('id', templateId)
            .select();
        
        if (error) {
            throw error;
        }
        
        if (!data || data.length === 0) {
            console.warn(`   ⚠️  未找到模板: ${templateId}`);
            return false;
        }
        
        console.log(`   ✅ 数据库更新成功: ${data[0].name}`);
        return true;
        
    } catch (error: any) {
        console.error(`   ❌ 数据库更新失败:`, error.message);
        return false;
    }
}

/**
 * 根据 templateName 查找模板ID
 */
async function findTemplateByName(
    supabase: any,
    templateName: string,
    roomTypeId: string
): Promise<{ id: string; name: string; hasImage: boolean } | null> {
    try {
        // 将文件名格式转回正常格式用于查询
        // 例如: 'modern-minimalist' -> 'Modern Minimalist'
        const searchName = templateName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        const { data, error } = await supabase
            .from('design_templates')
            .select('id, name, image_url, room_type')
            .ilike('name', `%${searchName}%`)
            .limit(5);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return null;
        }
        
        // 如果有多个结果，尝试精确匹配或使用第一个
        const exactMatch = data.find((t: any) => 
            t.name.toLowerCase().replace(/\s+/g, '-') === templateName
        );
        
        const template = exactMatch || data[0];
        
        return {
            id: template.id,
            name: template.name,
            hasImage: !!template.image_url
        };
        
    } catch (error: any) {
        console.error(`   ❌ 查询模板失败:`, error.message);
        return null;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('\n🚀 批量上传缩略图工具\n');
    console.log(`📁 图片文件夹: ${IMAGES_FOLDER}`);
    console.log(`🗄️  Storage Bucket: ${STORAGE_BUCKET}`);
    console.log(`${DRY_RUN ? '🧪 测试模式（不会实际上传）' : '✅ 生产模式'}\n`);
    
    // 检查环境变量
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ 错误: 缺少 Supabase 配置');
        console.error('   请设置以下环境变量:');
        console.error('   - VITE_SUPABASE_URL');
        console.error('   - SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }
    
    // 检查图片文件夹
    if (!fs.existsSync(IMAGES_FOLDER)) {
        console.error(`❌ 错误: 图片文件夹不存在: ${IMAGES_FOLDER}`);
        console.error('   请创建文件夹并放入下载的图片');
        process.exit(1);
    }
    
    // 创建 Supabase 客户端
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log('✅ Supabase 客户端创建成功\n');
    
    // 读取所有 PNG 文件
    const files = fs.readdirSync(IMAGES_FOLDER)
        .filter(f => f.endsWith('.png'));
    
    if (files.length === 0) {
        console.error(`❌ 错误: 文件夹中没有 PNG 图片`);
        process.exit(1);
    }
    
    console.log(`📊 找到 ${files.length} 个图片文件\n`);
    
    // 统计
    const results: UploadResult[] = [];
    let uploadSuccess = 0;
    let uploadFailed = 0;
    let dbUpdateSuccess = 0;
    let dbUpdateFailed = 0;
    let skipped = 0;
    
    // 追踪已处理的模板ID，避免重复上传
    const processedTemplates = new Map<string, string>(); // templateId -> fileName
    
    // 处理每个文件
    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        console.log(`\n[${i + 1}/${files.length}] 处理: ${fileName}`);
        
        // 解析文件名
        const parsed = parseFileName(fileName);
        if (!parsed) {
            uploadFailed++;
            results.push({
                fileName,
                templateId: 'unknown',
                success: false,
                error: '文件名格式无效'
            });
            continue;
        }
        
        console.log(`   📋 元数据:`);
        console.log(`      - 功能类型: ${parsed.type}`);
        console.log(`      - 房间类型: ${parsed.roomTypeId}`);
        console.log(`      - 模板名称: ${parsed.templateName}`);
        
        // 查找模板ID
        console.log(`   🔍 查找模板...`);
        const template = await findTemplateByName(supabase, parsed.templateName, parsed.roomTypeId);
        
        if (!template) {
            console.log(`   ⚠️  未找到匹配的模板，跳过`);
            uploadFailed++;
            results.push({
                fileName,
                templateId: parsed.templateName,
                success: false,
                error: '未找到匹配的模板'
            });
            continue;
        }
        
        console.log(`   ✅ 找到模板: ${template.name} (ID: ${template.id})`);
        
        // 检查是否已处理过该模板
        if (processedTemplates.has(template.id)) {
            const previousFile = processedTemplates.get(template.id);
            console.log(`   ⏭️  跳过: 该模板已被处理 (使用文件: ${previousFile})`);
            skipped++;
            results.push({
                fileName,
                templateId: template.id,
                success: true,
                error: `跳过：模板已处理 (${previousFile})`
            });
            continue;
        }
        
        // 显示是否会覆盖现有图片
        if (template.hasImage) {
            console.log(`   🔄 将覆盖现有缩略图`);
        } else {
            console.log(`   🆕 将创建新缩略图`);
        }
        
        // 上传文件
        const filePath = path.join(IMAGES_FOLDER, fileName);
        const uploadResult = await uploadFile(supabase, filePath, parsed, template.id);
        results.push(uploadResult);
        
        if (uploadResult.success) {
            uploadSuccess++;
            
            // 更新数据库
            if (uploadResult.storageUrl) {
                const dbSuccess = await updateTemplateUrl(
                    supabase,
                    template.id,
                    uploadResult.storageUrl
                );
                
                if (dbSuccess) {
                    dbUpdateSuccess++;
                    // 标记该模板已处理
                    processedTemplates.set(template.id, fileName);
                } else {
                    dbUpdateFailed++;
                }
            }
        } else {
            uploadFailed++;
        }
        
        // 稍微延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 输出统计
    console.log('\n\n📊 上传统计\n');
    console.log(`总文件数: ${files.length}`);
    console.log(`✅ 上传成功: ${uploadSuccess}`);
    console.log(`⏭️  跳过（重复）: ${skipped}`);
    console.log(`❌ 上传失败: ${uploadFailed}`);
    console.log(`✅ 数据库更新成功: ${dbUpdateSuccess}`);
    console.log(`❌ 数据库更新失败: ${dbUpdateFailed}`);
    
    // 显示失败的文件
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        console.log('\n\n⚠️  失败的文件:\n');
        failed.forEach(f => {
            console.log(`   ${f.fileName}: ${f.error}`);
        });
    }
    
    console.log('\n✨ 完成!\n');
}

// 运行主函数
main().catch(error => {
    console.error('\n❌ 发生错误:', error);
    process.exit(1);
});

