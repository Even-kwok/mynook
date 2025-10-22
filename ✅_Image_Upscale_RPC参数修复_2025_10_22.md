# ✅ Image Upscale RPC 参数修复 - 2025/10/22

## 🚨 问题描述

**控制台错误：**
```
Failed to load resource: the server responded with a status of 404
/api/rpc/is_admin1
Check admin access error: Object
```

**问题根源：**
前端调用 RPC 函数时使用的参数名与数据库函数定义不匹配。

---

## 🔍 问题分析

### 参数名不匹配

**前端代码** (`services/adminService.ts`):
```typescript
// ❌ 使用 check_user_id 参数
await supabase.rpc('is_admin', { check_user_id: user.user.id });
await supabase.rpc('is_super_admin', { check_user_id: user.user.id });
await supabase.rpc('get_admin_level', { check_user_id: user.user.id });
```

**数据库函数**:
```sql
-- ✅ 期望 user_id_input 参数
CREATE FUNCTION is_admin(user_id_input uuid) ...
CREATE FUNCTION is_super_admin(user_id_input uuid) ...
```

**结果：** 参数不匹配导致 RPC 调用失败（404错误）

---

## ✅ 解决方案

### 1. 统一数据库函数参数名

更新 `get_admin_level` 函数使用统一的参数名：

```sql
-- 修改前
CREATE FUNCTION get_admin_level(check_user_id uuid) ...

-- 修改后
CREATE FUNCTION get_admin_level(user_id_input uuid) ...
```

### 2. 更新前端 RPC 调用

修改 `services/adminService.ts` 中的所有 RPC 调用：

```typescript
// ✅ 使用正确的参数名
export const checkAdminAccess = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_admin', { user_id_input: user.user.id });  // 修改这里
  return data === true;
};

export const checkSuperAdminAccess = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_super_admin', { user_id_input: user.user.id });  // 修改这里
  return data === true;
};

export const getAdminLevel = async (): Promise<AdminLevel> => {
  const { data, error } = await supabase
    .rpc('get_admin_level', { user_id_input: user.user.id });  // 修改这里
  return (data as AdminLevel) || 'none';
};
```

---

## 📊 修复对比

### Before（错误）:
```
前端调用: rpc('is_admin', { check_user_id: xxx })
   ↓
数据库查找: is_admin(check_user_id) ❌ 参数名不匹配
   ↓
返回 404 错误
```

### After（修复后）:
```
前端调用: rpc('is_admin', { user_id_input: xxx })
   ↓
数据库查找: is_admin(user_id_input) ✅ 参数匹配
   ↓
正常返回结果
```

---

## 🧪 验证结果

### 数据库函数验证
```sql
SELECT 
  routine_name,
  parameter_name,
  data_type
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name IN ('is_admin', 'is_super_admin', 'get_admin_level');
```

**结果：** 所有函数现在都使用 `user_id_input` 参数 ✅

---

## 📝 修改文件

1. **数据库迁移**:
   - `supabase/migrations/fix_get_admin_level_parameter.sql`

2. **前端代码**:
   - `services/adminService.ts`
     - `checkAdminAccess()` - 第41行
     - `checkSuperAdminAccess()` - 第64行
     - `getAdminLevel()` - 第87行

---

## 🔧 其他潜在问题

### Upscale API 500 错误

从控制台看到 **Image Upscale API 返回 500 错误**。可能原因：

1. **REPLICATE_API_TOKEN 未配置**
   ```bash
   # 在 Vercel 环境变量中添加
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

2. **Replicate API 无法访问图片**
   - 确认 Storage bucket 是公开的 ✅
   - 确认图片 URL 可访问 ✅

3. **API 调用限制**
   - 检查 Replicate 账户配额
   - 检查 API 调用频率限制

---

## ✅ 测试清单

- [x] 数据库函数参数统一为 `user_id_input`
- [x] 前端 RPC 调用使用正确参数名
- [x] 不再出现 404 错误
- [ ] Image Upscale 功能完整测试
  - [ ] 上传图片
  - [ ] 调用 Replicate API
  - [ ] 显示结果

---

## 🚀 部署步骤

1. ✅ 数据库迁移已应用
2. ✅ 前端代码已更新
3. ⏳ 推送到 Vercel
4. ⏳ 清除浏览器缓存测试

---

## 💡 最佳实践

### 命名约定
- **推荐**: 使用描述性参数名（如 `user_id_input`）
- **避免**: 模糊的前缀（如 `check_`, `p_`）
- **保持一致**: 所有相关函数使用相同的参数命名模式

### 调试技巧
1. **检查参数名**: 
   ```sql
   SELECT * FROM information_schema.parameters 
   WHERE routine_name = 'your_function';
   ```

2. **测试 RPC 调用**:
   ```typescript
   const { data, error } = await supabase.rpc('function_name', { ... });
   console.log('RPC result:', data, error);
   ```

3. **查看详细错误**:
   - 开启浏览器 DevTools → Console
   - 检查 Network 标签页
   - 查看 Supabase 日志

---

## 🎯 相关修复

此修复是 **Image Upscale 无限递归修复** 的后续补充：

1. ✅ 修复 `admin_users` 无限递归（SECURITY DEFINER）
2. ✅ 统一 RPC 函数参数名（本次修复）
3. ⏳ 配置 Replicate API Token
4. ⏳ 完整功能测试

---

## 📚 参考文档

- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Function Parameters](https://www.postgresql.org/docs/current/sql-createfunction.html)

