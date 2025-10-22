# ✅ Image Upscale 无限递归修复 - 2025/10/22

## 🚨 问题描述

**错误信息：**
```
上传失败: insert into "objects" ... - infinite recursion detected in policy for relation "admin_users"
```

**问题根源：**
`admin_users` 表的 RLS 策略存在循环引用，导致无限递归。

## 🔍 根本原因

### 旧策略（有问题）：
```sql
-- ❌ 这个策略在检查时又去查询 admin_users 表，形成死循环
CREATE POLICY "Super admins can view all admins" ON admin_users
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users  -- ⚠️ 查询 admin_users 表
  WHERE user_id = auth.uid()  -- 触发 admin_users 的 SELECT 策略
  AND admin_level = 'super_admin'  -- 又触发 admin_users 查询
  AND is_active = true  -- 🔄 无限循环！
));
```

### 递归链路：
1. Storage 策略检查 → 查询 `admin_users` 表
2. `admin_users` SELECT 策略触发 → 又查询 `admin_users` 表
3. 再次触发 `admin_users` SELECT 策略 → 🔄 无限循环

---

## ✅ 解决方案

### 使用 SECURITY DEFINER 函数打破循环

**核心原理：**
- `SECURITY DEFINER` 函数以函数定义者（通常是超级用户）的权限运行
- **绕过 RLS 策略检查**，不会触发递归

### 实现步骤：

#### 1. 创建 Security Definer 函数

```sql
-- 检查用户是否是管理员（任何级别）
CREATE FUNCTION public.is_admin(user_id_input uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- ⭐ 关键：绕过 RLS
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = user_id_input
    AND is_active = true
  );
$$;

-- 检查用户是否是超级管理员
CREATE FUNCTION public.is_super_admin(user_id_input uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- ⭐ 关键：绕过 RLS
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = user_id_input
    AND admin_level = 'super_admin'
    AND is_active = true
  );
$$;
```

#### 2. 更新策略使用新函数

```sql
-- ✅ 新策略：使用 security definer 函数，不会触发递归
CREATE POLICY "Super admins can view all admins" ON admin_users
FOR SELECT
USING (is_super_admin(auth.uid()));  -- 直接调用函数，不触发 RLS

CREATE POLICY "Super admins can create admins" ON admin_users
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update admins" ON admin_users
FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete admins" ON admin_users
FOR DELETE
USING (is_super_admin(auth.uid()));
```

#### 3. 修复相关 Storage 策略

```sql
-- 修复 template-thumbnails bucket 策略
CREATE POLICY "Authenticated admins can upload template thumbnails" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'template-thumbnails' 
  AND is_admin(auth.uid())  -- 使用 security definer 函数
);
```

---

## 📊 修复对比

### Before（有问题）：
```
Storage Policy
  ↓ 检查权限
admin_users 表 RLS
  ↓ 查询 admin_users
admin_users 表 RLS
  ↓ 又查询 admin_users
  🔄 无限循环！
```

### After（修复后）：
```
Storage Policy
  ↓ 检查权限
is_admin() function (SECURITY DEFINER)
  ↓ 绕过 RLS
admin_users 表数据
  ✅ 返回结果
```

---

## 🧪 验证结果

### 函数验证：
```sql
SELECT routine_name, security_type
FROM information_schema.routines 
WHERE routine_name IN ('is_admin', 'is_super_admin');

-- 结果：
-- is_admin         | DEFINER ✅
-- is_super_admin   | DEFINER ✅
```

### 策略验证：
所有 `admin_users` 表策略已更新为使用 `is_admin()` 或 `is_super_admin()` 函数。

---

## 📝 迁移文件

- `supabase/migrations/fix_admin_users_infinite_recursion_v4.sql`
- `supabase/migrations/fix_image_upscale_storage_policy.sql`

---

## 🚀 部署步骤

1. ✅ 数据库迁移已应用
2. ✅ 策略已更新
3. ⏳ 推送到 Vercel
4. ⏳ 测试 Image Upscale 功能

---

## 💡 技术要点

### SECURITY DEFINER 的优势：
1. **绕过 RLS**：以函数定义者权限运行，不触发策略检查
2. **打破递归**：避免策略中查询同一表导致的循环
3. **性能优化**：减少策略检查层数，提升查询速度

### 注意事项：
1. **谨慎使用**：SECURITY DEFINER 绕过安全检查，需确保函数逻辑安全
2. **最小权限**：函数内只查询必要的数据
3. **STABLE 标记**：标记为 STABLE 以优化性能（同一事务内结果不变）

---

## ✅ 测试清单

- [ ] Image Upscale 页面正常加载
- [ ] 可以成功上传图片
- [ ] 不再出现无限递归错误
- [ ] Replicate API 调用成功
- [ ] 显示放大后的结果
- [ ] 临时文件自动清理

---

## 🎯 相关文件

- `components/ImageUpscalePage.tsx` - 功能页面
- `api/upscale-image.ts` - 后端 API
- `services/imageUpscaleService.ts` - 服务层
- `supabase/migrations/fix_admin_users_infinite_recursion_v4.sql` - 数据库修复

---

## 📚 参考资料

- [Supabase RLS Security Definer Functions](https://supabase.com/docs/guides/database/postgres/row-level-security#security-definer-functions)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

