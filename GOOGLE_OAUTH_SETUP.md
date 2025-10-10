# 🔐 Google OAuth 登录配置指南

完整的Google账号登录设置教程，适用于MyNook项目。

---

## 📋 配置概览

需要在两个平台完成配置：
1. **Google Cloud Console** - 创建OAuth客户端
2. **Supabase Dashboard** - 配置Google提供商

预计配置时间：**15-20分钟**

---

## 🎯 Part A: Google Cloud Console 配置

### 步骤 1: 创建项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目下拉菜单
3. 点击 **"新建项目"**
4. 输入项目名称，例如：`MyNook App`
5. 点击 **"创建"**

### 步骤 2: 启用Google+ API

1. 在左侧菜单选择 **"API和服务"** > **"库"**
2. 搜索 `Google+ API`
3. 点击 **"启用"**

> 💡 **提示**：如果找不到Google+ API，可以跳过此步骤，直接进行OAuth配置

### 步骤 3: 配置OAuth同意屏幕

1. 在左侧菜单选择 **"API和服务"** > **"OAuth同意屏幕"**
2. 选择用户类型：
   - **外部** - 任何Google账号都可以登录（推荐用于生产环境）
   - **内部** - 仅限组织内部用户（适用于企业）
3. 点击 **"创建"**

4. 填写应用信息：
   ```
   应用名称：MyNook
   用户支持电子邮件：your@email.com
   应用徽标：（可选）上传项目Logo
   应用首页：https://your-domain.vercel.app
   应用隐私政策链接：https://your-domain.vercel.app/privacy（可选）
   应用服务条款链接：https://your-domain.vercel.app/terms（可选）
   授权网域：
   - localhost（本地开发）
   - your-domain.vercel.app（生产环境）
   开发者联系信息：your@email.com
   ```

5. 点击 **"保存并继续"**

6. **作用域设置**（Scopes）：
   - 点击 **"添加或移除作用域"**
   - 勾选以下基础作用域：
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - 点击 **"更新"**
   - 点击 **"保存并继续"**

7. **测试用户**（可选）：
   - 如果选择了"外部"用户类型，可以跳过
   - 如果选择了"内部"，需要添加测试用户邮箱
   - 点击 **"保存并继续"**

8. 查看摘要，点击 **"返回控制台"**

### 步骤 4: 创建OAuth客户端ID

1. 在左侧菜单选择 **"API和服务"** > **"凭据"**
2. 点击顶部 **"创建凭据"** > **"OAuth 客户端 ID"**
3. 应用类型选择：**Web 应用**
4. 填写名称：`MyNook Web Client`

5. **配置授权重定向URI**（最重要！）：

   点击 **"添加URI"**，添加以下所有URI：

   ```
   # 本地开发环境
   http://localhost:3000
   
   # Supabase回调URL（必须！）
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   
   # Vercel生产环境
   https://your-domain.vercel.app
   
   # Vercel预览环境（可选）
   https://your-domain-*.vercel.app
   ```

   > ⚠️ **重要**：将 `YOUR_PROJECT_REF` 替换为你的Supabase项目引用ID
   > 
   > 获取方式：Supabase控制台 > Settings > General > Reference ID

6. 点击 **"创建"**

7. **保存凭据**（非常重要！）：
   ```
   客户端ID: xxxxx.apps.googleusercontent.com
   客户端密钥: GOCSPX-xxxxx
   ```
   
   > 💾 **提示**：立即复制并保存到安全的地方，稍后需要在Supabase中使用

---

## 🎯 Part B: Supabase 配置

### 步骤 1: 启用Google提供商

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** > **Providers**
4. 在列表中找到 **Google**
5. 开启 **"Enable Sign in with Google"** 开关

### 步骤 2: 填入Google凭据

1. 在Google Provider配置页面，填入以下信息：

   ```
   Client ID (for OAuth): 
   [粘贴你从Google Cloud Console复制的客户端ID]
   
   Client Secret (for OAuth):
   [粘贴你从Google Cloud Console复制的客户端密钥]
   ```

2. **可选配置**：
   - **Authorized Client IDs**：留空（除非需要移动端登录）
   - **Skip nonce check**：不勾选（保持安全）

3. 点击 **"Save"** 保存配置

### 步骤 3: 验证回调URL

1. 在Supabase的Google Provider页面，查找 **"Callback URL (for OAuth)"**
2. 复制这个URL，格式应该是：
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. **确认这个URL已经添加到Google Cloud Console的授权重定向URI列表中**
   - 如果没有，回到Google Cloud Console添加

### 步骤 4: 配置电子邮件设置（可选）

1. 进入 **Authentication** > **Email Templates**
2. 可以自定义欢迎邮件模板
3. 或者直接关闭邮箱验证：
   - **Authentication** > **Settings**
   - 取消勾选 **"Enable email confirmations"**
   - 点击 **"Save"**

---

## 🎯 Part C: 环境变量检查

### 确认现有配置

Google OAuth**不需要**额外的环境变量！只需要确保以下Supabase配置正确：

**项目根目录 `.env` 文件**：

```env
# Supabase 配置（已有）
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API（已有）
VITE_GEMINI_API_KEY=your-gemini-api-key
```

> ✅ **好消息**：Google OAuth凭据由Supabase后端管理，不需要暴露到前端！

### Vercel环境变量

1. 访问 Vercel项目设置
2. 进入 **Settings** > **Environment Variables**
3. 确认以下变量已添加到**所有环境**（Production, Preview, Development）：
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_GEMINI_API_KEY
   ```

---

## 🧪 测试Google登录

### 本地测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问：`http://localhost:3000`

3. 点击右上角 **用户图标**

4. 在登录模态框点击 **"使用 Google 账号登录"**

5. 应该会跳转到Google登录页面

6. 选择Google账号并授权

7. 应该自动跳转回应用，并显示已登录状态

### Vercel测试

1. 推送代码到GitHub：
   ```bash
   git add .
   git commit -m "Add Google OAuth login"
   git push
   ```

2. Vercel会自动部署预览版本

3. 访问预览URL测试Google登录

4. 确认登录成功后，检查：
   - 用户头像和名称显示正确
   - 信用点显示为 10（新用户默认）
   - 会员等级为 FREE

---

## 🔍 验证用户创建

登录成功后，检查数据库：

1. Supabase Dashboard > **Table Editor** > **users**
2. 应该看到新创建的用户记录：
   ```
   id: [Google用户的UUID]
   email: user@gmail.com
   full_name: [从Google获取的姓名]
   avatar_url: [Google头像URL]
   membership_tier: free
   credits: 10
   total_generations: 0
   ```

---

## 🐛 常见问题排查

### Q1: 点击Google登录按钮没反应

**可能原因**：
- Supabase配置未保存
- Google OAuth客户端未正确创建

**解决方案**：
1. 打开浏览器控制台（F12）查看错误信息
2. 检查Supabase Provider是否已启用
3. 确认Client ID和Secret填写正确

### Q2: 跳转到Google后显示 "redirect_uri_mismatch" 错误

**原因**：授权重定向URI未正确配置

**解决方案**：
1. 复制错误信息中显示的URI
2. 前往Google Cloud Console > 凭据 > 编辑OAuth客户端
3. 将该URI添加到授权重定向URI列表
4. 点击保存，等待几分钟生效

### Q3: 登录成功但跳转回localhost而非Vercel域名

**原因**：代码中的redirectTo设置问题

**解决方案**：
- 这是正常的！我们的代码使用`window.location.origin`自动检测
- 本地开发会跳回localhost
- Vercel部署会跳回Vercel域名
- 不需要手动配置

### Q4: 用户登录成功但数据库没有创建记录

**原因**：数据库触发器未正确执行

**解决方案**：
1. 检查Supabase日志：**Logs** > **Postgres Logs**
2. 确认触发器已创建：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. 如果触发器不存在，重新执行迁移文件：
   `supabase/migrations/20250109_create_users_auth.sql`

### Q5: 本地可以登录，Vercel上无法登录

**原因**：环境变量未配置或授权域名缺失

**解决方案**：
1. 检查Vercel环境变量是否正确设置
2. 确认Vercel域名已添加到Google授权域名列表
3. 在Vercel重新部署项目

### Q6: 提示 "Access blocked: This app's request is invalid"

**原因**：OAuth同意屏幕配置不完整

**解决方案**：
1. 返回Google Cloud Console > OAuth同意屏幕
2. 确认应用状态不是"需要验证"
3. 检查授权网域是否包含你的部署域名
4. 如果是测试阶段，使用"外部"用户类型 + 添加测试用户

---

## 🔒 安全最佳实践

### ✅ 已实现的安全措施

1. **Client Secret 后端管理**
   - Google凭据存储在Supabase后端
   - 前端代码不包含敏感信息

2. **HTTPS强制**
   - Vercel自动提供HTTPS
   - 所有OAuth流程使用加密连接

3. **行级安全策略 (RLS)**
   - 用户只能访问自己的数据
   - 自动防止数据泄露

4. **Token自动刷新**
   - Supabase自动管理Token生命周期
   - 无需手动处理过期

### 🔐 额外建议

1. **定期检查OAuth审计日志**
   - Google Cloud Console > OAuth同意屏幕 > 审核
   
2. **限制作用域**
   - 只请求必要的用户信息（email, profile）
   
3. **监控异常登录**
   - Supabase Dashboard > Authentication > Users
   - 关注异常登录模式

---

## 📚 相关文档

- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth 指南](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## ✅ 配置完成检查清单

使用此清单确认所有步骤已完成：

**Google Cloud Console**:
- [ ] 创建了Google Cloud项目
- [ ] 配置了OAuth同意屏幕
- [ ] 添加了所需的作用域（email, profile, openid）
- [ ] 创建了OAuth客户端ID
- [ ] 添加了所有必要的授权重定向URI
- [ ] 复制并保存了Client ID和Secret

**Supabase Dashboard**:
- [ ] 启用了Google提供商
- [ ] 填入了Client ID和Secret
- [ ] 验证了回调URL在Google中已授权
- [ ] 测试了本地登录功能
- [ ] 检查了数据库用户记录创建

**部署环境**:
- [ ] Vercel环境变量已配置
- [ ] Vercel域名已添加到Google授权域名
- [ ] 在Vercel预览环境测试了登录
- [ ] 在生产环境测试了登录

---

**配置完成时间**: 2025-10-10  
**维护者**: MyNook Team  
**技术栈**: React + TypeScript + Supabase + Google OAuth 2.0

如果遇到其他问题，请查看 `GOOGLE_LOGIN_TEST_CHECKLIST.md` 或联系开发团队。

