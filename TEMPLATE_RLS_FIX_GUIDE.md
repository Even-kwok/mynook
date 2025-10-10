# 模板系统修复指南

## 📋 问题说明

已修复以下问题：
1. ✅ **无限递归错误**：RLS 策略循环依赖导致数据库查询失败
2. ✅ **字段缺失默认值**：`created_by` 和 `updated_by` 字段未设置可选
3. ✅ **安全隐患**：普通用户可以在前端看到模板的 prompt 内容

## 🔒 新的安全机制

### 权限分级

| 用户类型 | 可见字段 | 可操作 |
|---------|---------|--------|
| **普通用户** | id, name, image_url, category | 查看模板、选择模板 |
| **系统后台** | 完整 prompt | 获取 prompt 用于 AI 生成 |
| **管理员** | 所有字段 | 完整的增删改查 |

### 实现方式

1. **公共视图** (`design_templates_public`)：只暴露基本信息
2. **安全函数** (`get_template_prompt`)：使用 SECURITY DEFINER 获取 prompt
3. **RLS 策略**：使用独立函数检查权限，避免递归

## 🚀 执行步骤

### 1. 在 Supabase 中执行迁移

**方式 A：通过 Supabase 控制台（推荐）**

1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 选择您的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query** 创建新查询
5. 复制 `supabase/migrations/20251010_fix_template_rls.sql` 的全部内容
6. 粘贴到查询编辑器
7. 点击 **Run** 执行

**方式 B：通过 Supabase CLI**

```bash
# 如果还没安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目（替换为您的项目 ID）
supabase link --project-ref your-project-id

# 执行迁移
supabase db push
```

### 2. 验证迁移成功

在 SQL Editor 中运行以下查询验证：

```sql
-- 检查函数是否创建成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_template_prompt', 'get_template_prompts');

-- 应该返回 3 行

-- 检查视图是否创建成功
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'design_templates_public';

-- 应该返回 1 行

-- 检查字段是否已修改为可选
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'design_templates' 
AND column_name IN ('created_by', 'updated_by');

-- created_by 和 updated_by 的 is_nullable 应该都是 'YES'
```

### 3. 测试功能

#### 测试 1: 管理员保存模板

1. 使用管理员账号登录
2. 进入 Admin Panel → Templates
3. 尝试编辑现有模板或创建新模板
4. 点击 "Save Template"
5. **预期结果**：保存成功，不再出现错误

#### 测试 2: 普通用户查看模板

1. 使用普通用户账号登录（或未登录）
2. 进入任意设计页面（如 Interior Design）
3. 打开浏览器开发者工具（F12）→ Network 标签
4. 刷新页面，查看对 `design_templates_public` 的请求
5. **预期结果**：
   - 能看到模板列表
   - 响应数据中**没有** `prompt` 字段
   - 只有 id, name, image_url 等基本字段

#### 测试 3: 图片生成仍然正常

1. 使用任意账号登录
2. 上传一张房间图片
3. 选择一个或多个设计模板
4. 点击 "Generate"
5. **预期结果**：
   - 图片生成成功
   - 生成的图片符合所选模板的风格
   - 说明系统成功在后台获取了 prompt

## 🔍 安全验证

### 验证 Prompt 已被保护

在浏览器控制台运行：

```javascript
// 尝试直接查询 design_templates 表
const { data, error } = await supabase
  .from('design_templates')
  .select('prompt')
  .limit(1);

console.log('Direct query:', data, error);
// 普通用户应该能看到数据（因为有 RLS 策略允许）

// 但通过公共视图查询
const { data: publicData, error: publicError } = await supabase
  .from('design_templates_public')
  .select('*')
  .limit(1);

console.log('Public view:', publicData, publicError);
// 返回的数据中不应包含 prompt 字段
```

## 📊 技术细节

### 新增的数据库对象

1. **函数 `is_admin()`**
   - 检查当前用户是否为管理员
   - 使用 SECURITY DEFINER 避免 RLS 递归

2. **视图 `design_templates_public`**
   - 只包含：id, name, image_url, categories, enabled, sort_order
   - 不包含：prompt, created_by, updated_by

3. **函数 `get_template_prompt(uuid)`**
   - 根据模板 ID 获取 prompt
   - 使用 SECURITY DEFINER 绕过 RLS

4. **函数 `get_template_prompts(uuid[])`**
   - 批量获取多个模板的 prompt
   - 性能优化版本

### 代码变更

1. **services/templateService.ts**
   - 新增 `getAllTemplatesPublic()`：获取不含 prompt 的模板
   - 新增 `getTemplatePrompt()`：获取单个模板 prompt
   - 新增 `getTemplatePrompts()`：批量获取 prompts

2. **App.tsx**
   - 模板加载使用 `getAllTemplatesPublic()`
   - 生成图片时动态调用 `getTemplatePrompts()` 获取 prompt

## ⚠️ 注意事项

1. **执行迁移前备份**：虽然此迁移是非破坏性的，但建议先备份数据库
2. **生产环境测试**：在生产环境执行前，建议在开发环境充分测试
3. **监控性能**：批量获取 prompts 的性能应该很好，但请监控实际使用情况
4. **缓存考虑**：如果模板很多，可以考虑在前端缓存 prompt 结果

## 🐛 故障排除

### 问题：执行迁移时出现 "function does not exist" 错误

**解决方案**：确保先执行了 `20251010_create_templates_system.sql` 迁移

### 问题：管理员无法保存模板

**检查步骤**：
1. 确认用户在 `admin_users` 表中
2. 确认 `is_active = true`
3. 在 SQL Editor 测试：
   ```sql
   SELECT public.is_admin();  -- 应该返回 true
   ```

### 问题：普通用户生成图片时出错

**检查步骤**：
1. 查看浏览器控制台错误信息
2. 确认 `get_template_prompts` 函数权限正确：
   ```sql
   SELECT grantor, grantee, privilege_type 
   FROM information_schema.routine_privileges 
   WHERE routine_name = 'get_template_prompts';
   ```

## ✅ 完成检查清单

- [ ] 迁移文件已在 Supabase 中执行
- [ ] 验证查询显示函数和视图已创建
- [ ] 管理员可以保存模板
- [ ] 普通用户看不到 prompt 字段
- [ ] 图片生成功能正常工作
- [ ] 前端控制台没有错误

## 📝 后续优化建议

1. **添加 prompt 版本管理**：跟踪 prompt 的历史变更
2. **实现 prompt 缓存**：减少数据库查询
3. **添加 prompt 模板变量**：如 `{room_type}`, `{style}` 等
4. **监控 API 调用**：统计 prompt 获取频率

---

**需要帮助？** 如果遇到任何问题，请检查：
- Supabase 项目日志
- 浏览器控制台错误
- Network 标签中的 API 请求响应


