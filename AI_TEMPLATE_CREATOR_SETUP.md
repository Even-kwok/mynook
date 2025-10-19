# AI Template Creator 设置指南

## 功能概述

AI自动模板创建功能允许管理员批量上传图片（最多70张），系统会自动：
1. 使用Gemini 2.5 Flash提取模板名称、分类和完整提示词
2. 在本地裁切压缩图片为360×360px缩略图
3. 上传缩略图到Supabase Storage
4. 创建模板记录到数据库
5. 支持并发9处理，失败重试

## Supabase Storage 配置

### 1. 创建 Storage Bucket

在Supabase Dashboard中执行以下SQL：

```sql
-- 创建 template-thumbnails bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-thumbnails', 'template-thumbnails', true)
ON CONFLICT (id) DO NOTHING;
```

或者通过Supabase Dashboard UI创建：
1. 进入 Storage 页面
2. 点击 "New bucket"
3. Bucket name: `template-thumbnails`
4. Public bucket: ✅ (勾选)
5. 点击 "Create bucket"

### 2. 配置 RLS 策略

允许管理员上传图片到该bucket：

```sql
-- 允许管理员上传模板缩略图
CREATE POLICY "Admin can upload template thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-thumbnails' 
  AND (SELECT permission FROM users WHERE id = auth.uid()) >= 3
);

-- 允许所有人读取（因为bucket是public）
CREATE POLICY "Anyone can view template thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'template-thumbnails');
```

### 3. 验证配置

在Supabase Dashboard的Storage页面：
1. 检查 `template-thumbnails` bucket是否存在
2. 检查bucket是否标记为Public
3. 尝试手动上传一张测试图片
4. 获取公开URL，确保可访问

## 环境变量配置

确保在Vercel或本地`.env.local`中配置了以下环境变量：

```env
# Gemini API Key（用于AI提取）
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase（用于存储和数据库）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 可选：用于Zapier等自动化工具的API Key
ADMIN_API_KEY=your_admin_api_key_for_zapier
```

## 使用说明

### 基本使用流程

1. **登录Admin Panel**
   - 确保用户权限 >= 3（管理员）
   - 点击左侧导航栏的 "AI Template Creator"

2. **选择允许的分类范围**
   - 勾选允许创建的主分类
   - AI提取的分类必须在选中范围内
   - 默认全部选中：Interior Design, Exterior Design, Garden & Backyard Design

3. **上传图片**
   - 点击"选择图片"按钮
   - 可一次选择最多70张图片
   - 系统会自动开始处理

4. **监控进度**
   - 实时显示：总计、成功、失败、处理中
   - 进度条显示完成百分比
   - 每张图片显示状态（成功✓/失败✗/处理中⟳）

5. **处理失败**
   - 失败的图片会显示错误原因
   - 点击"重试失败项"一键重试
   - 或清空结果重新上传

6. **查看结果**
   - 成功创建的模板会在详细表格中显示
   - 包含：模板名称、主分类、二级分类、文件名
   - 可在Template Management标签查看完整模板

### 分类映射规则

AI提取的secondaryCategory会根据mainCategory自动映射：

**Interior Design:**
- `living-room` → room_type: "living-room", sub_category: "Modern Minimalist"
- `bedroom` → room_type: "bedroom", sub_category: "Modern Minimalist"
- `kitchen` → room_type: "kitchen", sub_category: "Modern Minimalist"
- 其他房间类型同理

**Exterior Design / Garden & Backyard Design:**
- 提取的风格名直接作为 sub_category
- room_type 为 null

## Zapier 集成

### API Key 认证

为支持自动化工具（如Zapier），API支持API Key认证：

```bash
# 请求示例
curl -X POST https://your-domain.com/api/auto-create-template \
  -H "x-api-key: your_admin_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "originalImage": "data:image/png;base64,iVBORw0KGgo...",
    "thumbnailImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "allowedCategories": ["Interior Design", "Exterior Design"]
  }'
```

### Zapier Workflow 示例

1. **Trigger**: Google Drive - New File in Folder
2. **Action**: Webhooks by Zapier - POST Request
   - URL: `https://your-domain.com/api/auto-create-template`
   - Headers: 
     - `x-api-key`: Your Admin API Key
     - `Content-Type`: `application/json`
   - Body:
     ```json
     {
       "originalImage": "{{file_base64}}",
       "thumbnailImage": "{{file_base64}}",
       "allowedCategories": ["Interior Design"]
     }
     ```

## 故障排查

### 问题：上传失败 "Failed to upload thumbnail"

**原因：** Storage bucket未配置或RLS策略限制

**解决：**
1. 检查bucket `template-thumbnails` 是否存在
2. 检查RLS策略是否正确
3. 验证SUPABASE_SERVICE_ROLE_KEY是否配置

### 问题：提取失败 "Empty response from Gemini"

**原因：** Gemini API Key未配置或配额用尽

**解决：**
1. 检查 GEMINI_API_KEY 是否设置
2. 验证API Key是否有效
3. 检查Gemini API配额

### 问题：分类不在允许范围

**原因：** AI提取的分类与勾选的不匹配

**解决：**
1. 扩大允许的分类范围
2. 或使用更符合分类的图片
3. 查看返回的extracted字段了解AI判断的分类

### 问题：权限不足 "Admin permission required"

**原因：** 用户权限 < 3

**解决：**
1. 在Users管理页面提升用户权限至3或更高
2. 或使用管理员账号登录

## 技术细节

### 并发控制

- **并发数：** 9（避免Gemini API限流）
- **处理方式：** 分批处理，每批9张
- **错误隔离：** 单个失败不影响其他

### 图片处理

- **裁切方式：** 居中裁切为正方形
- **目标尺寸：** 360×360px
- **格式/质量：** JPEG 85%
- **平均大小：** 约20-40KB

### AI提取Prompt

参考了 `tiqu tool` 项目的提取方式：
- 模型：Gemini 2.5 Flash
- 返回格式：JSON
- 包含字段：templateName, mainCategory, secondaryCategory, styleDescription, fullPrompt

### 存储路径结构

```
template-thumbnails/
├── Interior Design/
│   ├── living-room/
│   │   ├── 1729123456789-abc123.jpg
│   │   └── 1729123567890-def456.jpg
│   └── bedroom/
│       └── 1729123678901-ghi789.jpg
├── Exterior Design/
│   └── Modern/
│       └── 1729123789012-jkl012.jpg
└── Garden & Backyard Design/
    └── Landscaping/
        └── 1729123890123-mno345.jpg
```

## 性能优化建议

1. **批量上传大小：** 建议每次20-30张，避免一次性处理过多
2. **图片质量：** 上传前确保图片清晰，避免AI误判
3. **网络环境：** 稳定的网络连接确保上传成功率
4. **监控配额：** 定期检查Gemini API使用量

## 后续优化方向

- [ ] 添加批量编辑功能（统一修改分类/名称）
- [ ] 图片相似度检测（避免重复上传）
- [ ] 支持自定义提取Prompt
- [ ] 导出/导入模板配置
- [ ] 更详细的日志记录

