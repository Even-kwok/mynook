# 🔧 Image Upscale 数据库添加指南 - 2025/10/22

## 📋 问题描述

Image Upscale 功能代码已部署，但在工具栏和 Admin Panel 都看不到，原因是数据库中的 `tools_order` 表缺少这个工具的数据。

## ✅ 解决方案

需要在 Supabase 数据库中添加 Image Upscale 工具的记录。

### 方法1：使用 Supabase SQL Editor（推荐，最快）

1. 登录 https://supabase.com
2. 选择你的项目（mynook）
3. 点击左侧 **SQL Editor**
4. 点击 **New Query**
5. 复制粘贴以下 SQL 并执行：

```sql
-- 添加 Image Upscale 工具到 tools_order 表
INSERT INTO tools_order (tool_id, name, short_name, emoji, is_premium, is_coming_soon, sort_order) 
VALUES ('image-upscale', 'Image Upscale', 'Upscale', '🔍', true, false, 12)
ON CONFLICT (tool_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  emoji = EXCLUDED.emoji,
  is_premium = EXCLUDED.is_premium,
  is_coming_soon = EXCLUDED.is_coming_soon,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
```

6. 点击 **Run** 执行
7. 看到 "Success. No rows returned" 表示成功

### 方法2：使用迁移文件（长期方案）

迁移文件已创建：`supabase/migrations/20251022_add_image_upscale_tool.sql`

在本地运行迁移：
```bash
# 需要安装 Supabase CLI
npx supabase db push
```

## 🔍 验证步骤

执行 SQL 后，验证数据是否已添加：

```sql
-- 查询所有工具
SELECT tool_id, name, short_name, emoji, is_premium, sort_order 
FROM tools_order 
ORDER BY sort_order;
```

应该看到 12 行数据，最后一行是：
```
tool_id: image-upscale
name: Image Upscale
short_name: Upscale
emoji: 🔍
is_premium: true
sort_order: 12
```

## 🔄 刷新前端

数据库更新后，需要清除前端缓存：

### 在浏览器控制台（F12）运行：
```javascript
localStorage.removeItem('mynook_tools_order_cache');
localStorage.removeItem('mynook_tools_order_timestamp');
location.reload();
```

或者硬刷新：`Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)

## 📊 预期结果

### 1. 左侧工具栏显示

```
🛋️ Interior
🏠 Exterior  
🎨 Wall
🟫 Floor
🌳 Garden
🎄 Festive
➕ Replace (👑)
🖼️ Style Match (👑)
💬 AI Advisor (🔜)
📦 Multi Item (🔜)
✏️ Canva (👑)
🔍 Upscale (👑) ← 新增
```

### 2. Admin Panel 功能排序

在 Admin Panel → Tools Order 中会看到：

```
1. Interior Design (ID: interior)
2. Exterior Design (ID: exterior)
...
12. Image Upscale (ID: image-upscale) ← 新增
```

可以通过拖拽调整顺序。

## 🔧 工具配置说明

| 字段 | 值 | 说明 |
|-----|-----|------|
| tool_id | image-upscale | 唯一标识符 |
| name | Image Upscale | 完整名称 |
| short_name | Upscale | 按钮显示名称 |
| emoji | 🔍 | 图标（放大镜） |
| is_premium | true | 付费功能（Pro+） |
| is_coming_soon | false | 已上线可用 |
| sort_order | 12 | 显示顺序（最后） |

## ⚠️ 常见问题

### Q1: 执行 SQL 后还是看不到？
**A**: 清除浏览器缓存后刷新页面。

### Q2: 工具显示顺序不对？
**A**: 在 Admin Panel → Tools Order 中手动调整排序。

### Q3: 需要重新部署吗？
**A**: 不需要，这只是数据库数据更新。

## 📝 技术说明

### 数据流程

1. **数据库** (`tools_order` 表)
   ↓
2. **API 调用** (`api/toolsOrder.ts::getToolsOrderFromDB()`)
   ↓
3. **前端服务** (`services/toolsOrderService.ts::getToolsOrder()`)
   ↓
4. **缓存** (localStorage, 5分钟有效期)
   ↓
5. **左侧工具栏** (`components/LeftToolbar.tsx`)

### 为什么需要手动添加？

数据库迁移文件（`supabase/migrations/*.sql`）只在第一次创建表时执行。后续添加新工具需要：
- 创建新的迁移文件
- 或在 SQL Editor 中手动执行

## 📦 相关文件

- **迁移脚本**: `supabase/migrations/20251022_add_image_upscale_tool.sql`
- **API**: `api/toolsOrder.ts`
- **服务**: `services/toolsOrderService.ts`
- **组件**: `components/LeftToolbar.tsx`
- **页面**: `components/ImageUpscalePage.tsx`

## ✨ 完成后

执行 SQL → 清除缓存 → 刷新页面 → 即可看到 Image Upscale 功能！

如有问题，检查：
1. Supabase 数据库连接是否正常
2. 用户是否有管理员权限（查看 Admin Panel）
3. 浏览器控制台是否有错误

