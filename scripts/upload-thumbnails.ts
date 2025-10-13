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
    templateId: string;
    batchId: string;
    imageId: string;
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
    
    if (parts.length < 5) {
        console.warn(`⚠️  无效的文件名格式: ${fileName}`);
        return null;
    }
    
    return {
        type: parts[0],           // 'style', 'exterior', 'garden', etc.
        roomTypeId: parts[1],     // 'living-room', 'house', 'no-room'
        templateId: parts[2],     // 'modern-minimalist', 'contemporary'
        batchId: parts[3],        // 时间戳
        imageId: parts[4],        // 图片ID
        originalName: fileName
    };
}

/**
 * 上传单个文件到 Supabase Storage
 */
async function uploadFile(
    supabase: any,
    filePath: string,
    parsed: ParsedFileName
): Promise<UploadResult> {
    try {
        // 读取文件
        const fileBuffer = fs.readFileSync(filePath);
        
        // 构建 Storage 路径: {type}/{roomTypeId}/{templateId}_{batchId}.png
        const storagePath = `${parsed.type}/${parsed.roomTypeId}/${parsed.templateId}_${parsed.batchId}.png`;
        
        console.log(`📤 上传: ${parsed.originalName} → ${storagePath}`);
        
        if (DRY_RUN) {
            console.log(`   [测试模式] 跳过实际上传`);
            return {
                fileName: parsed.originalName,
                templateId: parsed.templateId,
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
            templateId: parsed.templateId,
            success: true,
            storageUrl: publicUrl
        };
        
    } catch (error: any) {
        console.error(`   ❌ 上传失败:`, error.message);
        return {
            fileName: parsed.originalName,
            templateId: parsed.templateId,
            success: false,
            error: error.message
        };
    }
}

/**
 * 更新 templates 表
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
        
        // 根据 templateId 查找模板（id 字段可能就是 templateId）
        // 如果你的模板 ID 存储方式不同，需要调整查询条件
        const { data, error } = await supabase
            .from('templates')
            .update({ imageUrl: imageUrl })
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
        console.log(`      - 模板ID: ${parsed.templateId}`);
        
        // 上传文件
        const filePath = path.join(IMAGES_FOLDER, fileName);
        const uploadResult = await uploadFile(supabase, filePath, parsed);
        results.push(uploadResult);
        
        if (uploadResult.success) {
            uploadSuccess++;
            
            // 更新数据库
            if (uploadResult.storageUrl) {
                const dbSuccess = await updateTemplateUrl(
                    supabase,
                    parsed.templateId,
                    uploadResult.storageUrl
                );
                
                if (dbSuccess) {
                    dbUpdateSuccess++;
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

