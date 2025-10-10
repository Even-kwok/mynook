# 模板系统集成指南

## 📋 概述

现在前后台模板系统已经完全连接！Admin后台可以管理模板，前端会自动显示这些修改。

## 🔄 数据流程

```
Admin管理员 → 编辑模板 → 保存到数据库 → 前端自动读取 → 用户看到最新模板
```

## 🚀 部署步骤

### 1. 运行数据库迁移

首先需要在Supabase中执行数据库迁移脚本：

```sql
-- 在Supabase SQL Editor中运行
-- 文件: supabase/migrations/20251010_create_templates_system.sql
```

这将创建：
- `design_templates` 表 - 存储所有模板
- `template_categories` 表 - 存储分类配置
- 相关的RLS策略和辅助函数

### 2. 导入默认模板

有两种方式导入现有的模板数据：

#### 方式A: 通过Admin后台（推荐）

1. 以管理员身份登录应用
2. 访问 Admin Panel → Templates 页面
3. 点击右上角的 **"Import Default Templates"** 按钮
4. 确认导入
5. 等待导入完成后，页面会自动刷新

#### 方式B: 使用脚本（开发者选项）

在浏览器控制台运行：
```javascript
import { importTemplates } from './scripts/import-templates';
await importTemplates();
```

### 3. 验证功能

导入完成后，验证以下功能：

#### ✅ Admin后台功能
- [ ] 可以查看所有模板
- [ ] 可以编辑模板（名称、图片、提示词）
- [ ] 可以添加新模板
- [ ] 可以删除模板
- [ ] 可以启用/禁用子分类

#### ✅ 前端功能
- [ ] Interior Design 页面显示正确的模板
- [ ] Exterior Design 页面显示正确的模板
- [ ] Wall Paint 页面显示正确的模板
- [ ] Floor Style 页面显示正确的模板
- [ ] Garden 页面显示正确的模板
- [ ] Festive Decor 页面显示正确的模板

## 📖 使用说明

### 管理员操作

#### 添加新模板
1. 进入 Admin Panel → Templates
2. 找到对应的主分类和子分类
3. 点击 "+" 按钮
4. 填写模板信息：
   - **名称**: 模板显示名称
   - **图片**: 上传或输入图片URL
   - **提示词**: AI生成时使用的详细描述
5. 点击 "Save Template"

#### 编辑模板
1. 在模板缩略图上悬停
2. 点击编辑按钮（铅笔图标）
3. 修改信息
4. 保存

#### 删除模板
1. 在模板缩略图上悬停
2. 点击删除按钮（垃圾桶图标）
3. 确认删除

#### 启用/禁用分类
- 点击子分类旁边的开关按钮
- 禁用后，该分类下的所有模板不会在前端显示

### 用户体验

1. **实时更新**: Admin修改模板后，用户刷新页面即可看到最新内容
2. **自动加载**: 应用启动时自动从数据库加载最新模板
3. **降级支持**: 如果数据库加载失败，会使用硬编码的默认模板

## 🗄️ 数据库结构

### design_templates 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 模板名称 |
| image_url | TEXT | 图片URL |
| prompt | TEXT | AI提示词 |
| main_category | TEXT | 主分类 |
| sub_category | TEXT | 子分类 |
| enabled | BOOLEAN | 是否启用 |
| sort_order | INTEGER | 排序 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| created_by | UUID | 创建者 |
| updated_by | UUID | 更新者 |

### template_categories 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| main_category | TEXT | 主分类 |
| sub_category | TEXT | 子分类 |
| display_name | TEXT | 显示名称 |
| enabled | BOOLEAN | 是否启用 |
| sort_order | INTEGER | 排序 |

## 🔐 权限说明

### Admin权限
- 查看所有模板（包括未启用的）
- 创建新模板
- 编辑现有模板
- 删除模板
- 管理分类

### 普通用户权限
- 只能查看已启用的模板
- 不能修改模板

## 🔧 开发说明

### API服务 (services/templateService.ts)

提供以下功能：

```typescript
// 获取所有模板
getAllTemplates(): Promise<ManagedTemplateData>

// 获取指定分类的模板
getTemplatesByMainCategory(category: string): Promise<ManagedPromptTemplateCategory[]>

// 创建模板
createTemplate(template): Promise<DesignTemplate>

// 更新模板
updateTemplate(id, updates): Promise<DesignTemplate>

// 删除模板
deleteTemplate(id): Promise<void>

// 批量导入
batchImportTemplates(templates[]): Promise<DesignTemplate[]>

// 切换启用状态
toggleTemplateEnabled(id, enabled): Promise<void>
```

### 组件集成

**App.tsx**:
- 在启动时调用 `getAllTemplates()` 加载模板
- 将模板数据存储在 `adminTemplateData` state中
- 传递给相应的页面组件

**AdminPage.tsx**:
- 显示模板管理界面
- 调用templateService API进行CRUD操作
- 提供"Import Default Templates"功能

## ⚠️ 注意事项

1. **数据库迁移**: 必须先执行数据库迁移，否则会报错
2. **管理员权限**: 只有admin用户才能管理模板
3. **图片存储**: 建议使用稳定的图片托管服务（如Google Cloud Storage）
4. **提示词质量**: 提示词的质量直接影响AI生成效果
5. **刷新问题**: Admin保存模板后会自动刷新页面以获取新的UUID

## 🐛 故障排除

### 问题: 前端不显示模板

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 确认数据库迁移已执行
3. 确认已导入模板数据
4. 检查模板是否已启用（`enabled = true`）

### 问题: Admin无法保存模板

**解决方案**:
1. 确认用户有admin权限
2. 检查Supabase RLS策略
3. 查看浏览器控制台和网络请求错误

### 问题: 图片无法显示

**解决方案**:
1. 确认图片URL可访问
2. 检查CORS设置
3. 尝试使用base64编码的图片

## 📊 监控建议

建议监控以下指标：
- 模板加载时间
- 模板CRUD操作成功率
- 数据库查询性能
- 图片加载失败率

## 🎯 未来优化

- [ ] 添加模板拖拽排序功能
- [ ] 支持模板批量编辑
- [ ] 添加模板版本历史
- [ ] 实现模板预览功能
- [ ] 添加模板使用统计
- [ ] 支持模板导出/导入功能

## 📞 支持

如有问题，请查看：
1. 浏览器控制台错误信息
2. Supabase日志
3. 项目的其他文档

