# 管理员系统使用指南

## 📋 目录

1. [系统概述](#系统概述)
2. [创建首个管理员](#创建首个管理员)
3. [访问管理后台](#访问管理后台)
4. [权限级别说明](#权限级别说明)
5. [功能说明](#功能说明)
6. [添加更多管理员](#添加更多管理员)
7. [安全注意事项](#安全注意事项)

---

## 系统概述

管理员系统提供了完整的后台管理功能，包括：
- ✅ 图片墙内容管理（Gallery Manager）
- ✅ 用户管理
- ✅ 模板管理
- ✅ 生成历史查看
- ✅ 操作日志记录

### 权限系统架构

```
数据库层 (admin_users表)
    ↓
权限服务层 (adminService.ts)
    ↓
前端权限检查 (App.tsx)
    ↓
功能组件 (AdminPage, GalleryManager, etc)
```

---

## 创建首个管理员

### 步骤 1: 注册账号

1. 打开你的网站前端
2. 点击右上角头像图标
3. 注册一个新账号（这将是你的管理员账号）

### 步骤 2: 执行数据库迁移

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧 **SQL Editor**
4. 点击 **New Query**
5. 复制并执行 `supabase/migrations/20250111_create_admin_system.sql` 文件内容

### 步骤 3: 创建超级管理员

1. 打开 `supabase/migrations/create_first_super_admin.sql`
2. 修改第 14 行的邮箱地址：
   ```sql
   v_admin_email TEXT := 'your-email@example.com'; -- 改为你的邮箱
   ```
3. 在 Supabase SQL 编辑器中执行此脚本
4. 看到成功提示：✅ 超级管理员创建成功！

---

## 访问管理后台

### 方法 1: URL 访问（推荐）

直接在浏览器地址栏输入：
```
https://your-domain.com/#admin
```

### 方法 2: 键盘快捷键

登录后按下：
- **Windows**: `Ctrl + Shift + A`
- **Mac**: `Cmd + Shift + A`

### 方法 3: 直接修改URL Hash

在任何页面，修改浏览器地址栏的 hash 部分为 `#admin`

---

## 权限级别说明

### 1. Super Admin (超级管理员)

**权限：** 完全控制

**功能：**
- ✅ 访问所有管理功能
- ✅ 创建/删除其他管理员
- ✅ 修改系统配置
- ✅ 查看所有操作日志
- ✅ 管理用户、Gallery、模板

**适用人群：** 系统所有者、技术负责人

### 2. Content Admin (内容管理员)

**权限：** 内容管理

**功能：**
- ✅ 管理 Gallery 图片墙
- ✅ 上传/删除图片
- ✅ 管理模板
- ✅ 查看用户数据（只读）
- ❌ 不能修改用户
- ❌ 不能管理其他管理员

**适用人群：** 内容编辑、设计师

### 3. Support Admin (客服管理员)

**权限：** 用户支持

**功能：**
- ✅ 查看用户信息
- ✅ 修改用户会员等级
- ✅ 查看生成历史
- ✅ 查看操作日志
- ❌ 不能管理 Gallery
- ❌ 不能管理其他管理员

**适用人群：** 客服人员、运营人员

---

## 功能说明

### Dashboard (仪表板)

- **总用户数**：注册用户总数
- **生成次数**：AI 生成图片总数
- **活跃订阅**：付费会员数量
- **月度收入**：当月收入统计
- **最近活动**：用户注册和生成活动

### Users (用户管理)

- 查看所有用户列表
- 编辑用户信息
- 修改会员等级
- 删除用户（慎用）
- 查看用户生成历史

### Designs (生成历史)

- 查看所有AI生成记录
- 按类型筛选（室内、室外等）
- 删除生成记录

### Templates (模板管理)

- 管理设计模板
- 上传新模板
- 编辑模板信息
- 调整模板顺序

### Gallery (图片墙管理) ⭐ 新功能

- **批量上传**：拖拽或选择最多20张图片
- **自动优化**：自动压缩和调整尺寸
- **分类管理**：按11个工具分类组织
- **实时编辑**：标题、分类、作者
- **激活控制**：显示/隐藏图片
- **预览管理**：查看所有已上传图片

---

## 添加更多管理员

### 通过超级管理员账号

1. 登录超级管理员账号
2. 访问 `#admin`
3. 进入 **Users** 标签
4. 找到目标用户
5. 点击"Set as Admin"按钮
6. 选择管理员级别：
   - Super Admin（慎重）
   - Content Admin（推荐）
   - Support Admin（客服）
7. 确认创建

### 通过 SQL 直接创建

```sql
-- 创建内容管理员
INSERT INTO public.admin_users (user_id, admin_level, is_active, permissions)
SELECT 
  id, 
  'content_admin', 
  true,
  '["manage_gallery", "upload_images", "delete_images", "manage_templates", "view_users"]'::jsonb
FROM public.users 
WHERE email = 'editor@example.com';

-- 创建客服管理员
INSERT INTO public.admin_users (user_id, admin_level, is_active, permissions)
SELECT 
  id, 
  'support_admin', 
  true,
  '["view_users", "edit_users", "change_user_tier", "view_logs"]'::jsonb
FROM public.users 
WHERE email = 'support@example.com';
```

---

## 安全注意事项

### ✅ 最佳实践

1. **最小权限原则**
   - 只赋予必要的权限
   - 优先使用 Content Admin 和 Support Admin
   - Super Admin 只给核心团队成员

2. **定期审查**
   - 定期检查管理员列表
   - 移除离职员工的管理员权限
   - 查看操作日志发现异常

3. **密码安全**
   - 管理员账号使用强密码
   - 启用双因素认证（如果支持）
   - 定期更换密码

4. **访问控制**
   - 不要在公开页面显示管理后台入口
   - 不要分享 `#admin` URL 给非管理员
   - 注意屏幕分享时的隐私

5. **操作日志**
   - 所有管理操作都会被记录
   - 定期检查 admin_logs 表
   - 发现异常及时调查

### ⚠️ 禁止操作

1. ❌ **不要**在前端导航菜单添加管理后台链接
2. ❌ **不要**将管理员密码写在代码中
3. ❌ **不要**给所有人 Super Admin 权限
4. ❌ **不要**在生产环境使用弱密码
5. ❌ **不要**分享管理员账号

### 🔒 撤销管理员权限

如果需要撤销某人的管理员权限：

```sql
-- 方法1：停用管理员
UPDATE public.admin_users
SET is_active = false
WHERE user_id = 'user-uuid-here';

-- 方法2：完全删除管理员记录
DELETE FROM public.admin_users
WHERE user_id = 'user-uuid-here';
```

---

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 使用 Supabase 的密码重置功能，或通过 SQL 重置。

### Q: 如何查看操作日志？
A: 
```sql
SELECT * FROM public.admin_logs
ORDER BY created_at DESC
LIMIT 100;
```

### Q: 访问 #admin 显示"访问被拒绝"？
A: 检查：
1. 是否已登录
2. `admin_users` 表中是否有记录
3. `is_active` 是否为 true

### Q: Gallery 管理器无法上传图片？
A: 检查：
1. Storage buckets 是否创建成功
2. RLS 策略是否正确
3. 是否有管理员权限

### Q: 如何添加新的权限？
A: 修改 `services/adminService.ts` 中的 `PERMISSIONS` 常量。

---

## 技术支持

如有问题，请：
1. 检查 Supabase Dashboard 的日志
2. 查看浏览器控制台错误
3. 检查数据库表结构
4. 联系技术团队

---

## 更新日志

### 2025-01-11
- ✅ 创建管理员系统
- ✅ 实现三级权限控制
- ✅ 添加操作日志功能
- ✅ 实现 URL Hash 访问
- ✅ 添加键盘快捷键
- ✅ 集成 Gallery 管理功能

