# 🐛 注册失败调试指南

## 步骤1: 查看浏览器控制台错误

1. **打开开发者工具**
   - Windows: 按 `F12` 或 `Ctrl + Shift + I`
   - Mac: 按 `Cmd + Option + I`

2. **切换到 Console 标签**

3. **尝试注册**，查看红色错误信息

4. **常见错误类型**：

### 错误A: "Invalid API key" 或 "supabaseUrl is required"
**原因**: 环境变量未正确配置到 Vercel

**解决方案**:
1. 访问 Vercel 控制台
2. 进入你的项目 → Settings → Environment Variables
3. 确认以下变量存在且正确：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **重要**: 修改环境变量后需要 **重新部署**！

### 错误B: "Email rate limit exceeded"
**原因**: Supabase 免费套餐有邮件发送限制

**解决方案**:
1. 进入 Supabase 控制台
2. Authentication → Providers → Email
3. **临时关闭邮箱验证**（开发测试用）:
   - 取消勾选 "Enable email confirmations"
4. 或者等待一段时间后重试

### 错误C: "User already registered"
**原因**: 该邮箱已被注册

**解决方案**:
- 使用不同的邮箱
- 或者进入 Supabase → Authentication → Users 删除测试用户

### 错误D: "Failed to fetch" 或 网络错误
**原因**: Supabase 服务连接失败

**解决方案**:
1. 检查网络连接
2. 确认 Supabase 项目状态正常
3. 检查 VITE_SUPABASE_URL 是否正确

### 错误E: "Invalid email or password"
**原因**: 密码不符合要求

**解决方案**:
- 密码至少 6 个字符
- 建议使用复杂密码（字母+数字）

---

## 步骤2: 检查 Supabase 配置

### 2.1 验证数据库表是否创建
1. 登录 Supabase 控制台
2. 进入 Table Editor
3. 确认 **users** 表存在
4. 检查表结构是否正确

### 2.2 检查 RLS 策略
1. 进入 Table Editor → users 表
2. 点击 "Policies" 标签
3. 应该看到 3 个策略：
   - ✅ Users can view own data
   - ✅ Users can update own data  
   - ✅ Users can insert own data

### 2.3 检查触发器
1. 进入 SQL Editor
2. 运行以下查询：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
3. 应该返回一条记录

---

## 步骤3: 测试 Supabase 连接

在浏览器 Console 中运行：

```javascript
// 检查环境变量
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

---

## 快速修复方案

### 方案1: 重新部署（最常见）
```bash
# 确保环境变量配置后重新部署
git commit --allow-empty -m "redeploy"
git push origin feature/registration
```

### 方案2: 检查 Vercel 环境变量
1. Vercel Dashboard → Settings → Environment Variables
2. 确认变量存在
3. 点击 "Redeploy" 触发重新部署

### 方案3: 临时禁用邮箱验证
Supabase → Authentication → Settings:
- ✅ Disable "Enable email confirmations"（开发环境）

---

## 预期成功的注册流程

1. 填写姓名、邮箱、密码
2. 点击"注册"
3. 弹窗自动关闭
4. 顶部显示用户信息：🆓 FREE | ✨ 10
5. 右上角显示用户头像

---

## 如果还是不行

请提供：
1. 浏览器 Console 的完整错误信息
2. Supabase 控制台 → Logs 的错误日志
3. 截图或错误详情

这样我可以更准确地帮你解决问题！

