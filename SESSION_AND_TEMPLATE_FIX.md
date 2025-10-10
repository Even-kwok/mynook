# 🔧 模板和Session问题修复说明

## ✅ 已修复的问题

### 1. **模板被清除的问题**
**问题描述**：后台只显示一个"Test Template"，其他所有默认模板都不见了。

**原因**：
- 当你点击"Import Default Templates"按钮时，只导入了部分模板到数据库
- 前端加载模板时，会用数据库中的模板**完全替换**硬编码的默认模板
- 导致未导入的模板都消失了

**修复方案**：
- ✅ 修改了 `App.tsx` 中的模板加载逻辑
- ✅ 现在采用**智能合并**策略：
  - 如果数据库中有某个分类的模板，使用数据库版本
  - 如果数据库中没有某个分类的模板，保留硬编码的默认模板
  - 这样确保用户始终能看到所有可用的模板

**效果**：
```
修复前：数据库只有1个模板 → 前端只显示1个模板 ❌
修复后：数据库只有1个模板 → 前端显示1个数据库模板 + 所有默认模板 ✅
```

---

### 2. **登录自动登出的问题**
**问题描述**：登录后台后，过一会儿就自动退出登录。

**可能的原因**：
- Supabase session默认过期时间较短
- Token刷新机制没有正常工作
- 浏览器可能清除了localStorage

**修复方案**：
- ✅ 在 `config/supabase.ts` 中启用 `flowType: 'pkce'`
  - PKCE (Proof Key for Code Exchange) 是更安全的认证流程
  - 提供更好的token刷新机制
- ✅ 确保 `autoRefreshToken: true` 和 `persistSession: true` 正常工作

**还需要做的**（在Supabase后台）：
1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Settings** → **Auth**
4. 找到 **JWT Expiry**（JWT过期时间）
5. 建议设置：
   - Access Token Lifetime: `3600` (1小时)
   - Refresh Token Lifetime: `2592000` (30天)
6. 点击 **Save** 保存

---

## 🚀 如何测试修复

### 测试模板功能：

1. **刷新页面**（Ctrl + F5 强制刷新）
2. 进入任意设计页面（如 Interior Design）
3. 检查是否能看到所有默认模板风格
4. 进入 **Admin Panel** → **Templates**
5. 检查所有分类的模板是否都显示正常

**预期结果**：
- ✅ 前端显示所有默认模板
- ✅ 后台Admin Panel显示合并后的模板
- ✅ 数据库中的自定义模板优先显示

---

### 测试登录Session：

1. **登录后台** (Admin Panel)
2. 等待 **15-30分钟**
3. 刷新页面或点击其他菜单
4. 检查是否仍然保持登录状态

**预期结果**：
- ✅ 15-30分钟后仍然保持登录
- ✅ 1小时内不会自动登出
- ✅ Token会在过期前自动刷新

**如果还是登出**：
- 打开浏览器开发者工具 (F12)
- 查看 Console 是否有错误信息
- 检查 Network 标签，看是否有 401 错误
- 检查 Application → Local Storage，确认 `supabase.auth.token` 存在

---

## 📝 技术细节

### 模板合并逻辑

```typescript
// 旧逻辑（问题）
if (数据库有模板) {
    使用数据库模板 // ❌ 会丢失未导入的默认模板
}

// 新逻辑（修复）
if (数据库有模板) {
    合并数据库模板 + 默认模板 // ✅ 保留所有模板
    // 如果同名，数据库模板优先
}
```

### Session管理改进

**之前**：
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
}
```

**现在**：
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce', // ✅ 新增：更安全的认证流程
}
```

---

## 🔍 排查步骤

### 如果模板还是有问题：

1. **清除浏览器缓存**：
   - Chrome: Ctrl + Shift + Delete
   - 选择"缓存的图片和文件"
   - 点击清除数据

2. **检查数据库**：
   ```sql
   -- 在Supabase SQL Editor中运行
   SELECT main_category, sub_category, name, enabled 
   FROM design_templates 
   ORDER BY main_category, sub_category;
   ```

3. **查看控制台日志**：
   - 打开浏览器开发者工具 (F12)
   - 查看 Console 标签
   - 应该看到 `✅ Templates loaded and merged from database`

---

### 如果Session还是有问题：

1. **检查Supabase项目状态**：
   - 确保项目没有暂停
   - 确保没有超出免费额度

2. **检查网络连接**：
   - Token刷新需要网络连接
   - 检查是否有防火墙/代理阻止

3. **查看Auth错误**：
   ```sql
   -- 在Supabase SQL Editor中运行
   SELECT * FROM auth.audit_log_entries 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

4. **重新部署**（如果在Vercel）：
   - 可能需要重新部署以应用新的supabase配置
   - 在Vercel Dashboard中点击 "Redeploy"

---

## 📚 相关文档

- [Supabase Auth文档](https://supabase.com/docs/guides/auth)
- [JWT配置指南](https://supabase.com/docs/guides/auth/sessions)
- [PKCE认证流程](https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr)

---

## ⚠️ 注意事项

1. **不要删除数据库中的模板**
   - 数据库模板会覆盖同名的默认模板
   - 如果需要恢复默认，先删除数据库中的对应模板

2. **Session设置不要太长**
   - 虽然可以设置很长时间，但不安全
   - 建议 Access Token: 1小时，Refresh Token: 30天

3. **定期检查Supabase日志**
   - 如果有异常登出，检查 Auth Logs
   - 可能是密码被修改或账号被禁用

---

## 🎯 下一步

1. ✅ 代码修改已完成
2. ⏳ 刷新页面测试模板功能
3. ⏳ 在Supabase后台调整JWT过期时间
4. ⏳ 测试15-30分钟后是否还保持登录

**预计修复时间**: 5分钟  
**测试时间**: 30分钟（等待session测试）

---

**如果还有问题，请提供**：
1. 浏览器Console的错误信息（截图）
2. Supabase Auth Logs（截图）
3. 具体登出的时间间隔

我会继续帮你排查！🚀

