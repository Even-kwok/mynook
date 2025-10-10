# 🚀 Google登录配置快速指南

> 这是一个简化版的配置指南，帮助您快速完成Google账号登录设置。
> 
> 📘 完整版指南请查看：[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

---

## ⏱️ 预计时间：15分钟

---

## 第一步：Google Cloud Console 配置

### 1. 创建项目

访问 https://console.cloud.google.com/

1. 点击顶部项目选择器 → **新建项目**
2. 项目名称输入：`MyNook App`
3. 点击 **创建**

### 2. 配置OAuth同意屏幕

左侧菜单：**API和服务** → **OAuth同意屏幕**

1. 用户类型选择：**外部**
2. 填写应用信息：
   ```
   应用名称：MyNook
   用户支持电子邮件：your@email.com
   授权网域：
     - localhost
     - your-domain.vercel.app
   ```
3. 添加作用域：
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`

### 3. 创建OAuth客户端

左侧菜单：**API和服务** → **凭据**

1. 点击 **创建凭据** → **OAuth 客户端 ID**
2. 应用类型：**Web 应用**
3. 授权重定向URI（⚠️ 关键步骤）：
   ```
   http://localhost:3000
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   https://your-domain.vercel.app
   ```
   
   > 💡 **获取 YOUR_PROJECT_REF**：
   > Supabase控制台 → Settings → General → Reference ID

4. 点击 **创建**
5. **复制并保存**：
   - 客户端ID
   - 客户端密钥

---

## 第二步：Supabase 配置

### 1. 启用Google提供商

访问 https://supabase.com/dashboard

1. 选择你的项目
2. **Authentication** → **Providers**
3. 找到 **Google**，开启开关

### 2. 填入凭据

在Google Provider配置页面：

```
Client ID: [粘贴刚才复制的客户端ID]
Client Secret: [粘贴刚才复制的客户端密钥]
```

点击 **Save**

### 3. 复制回调URL

在Supabase的Google Provider页面，找到 **Callback URL**：
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

⚠️ **确认这个URL已添加到Google Cloud Console的授权重定向URI**

---

## 第三步：测试登录

### 本地测试

1. 启动项目：
   ```bash
   npm run dev
   ```

2. 打开 http://localhost:3000

3. 点击右上角用户图标

4. 点击 **"使用 Google 账号登录"**

5. 选择Google账号并授权

6. 应该看到：
   - ✅ 自动跳转回应用
   - ✅ 显示用户头像和姓名
   - ✅ 信用点显示 10
   - ✅ 会员等级显示 FREE

### 验证数据库

Supabase Dashboard → **Table Editor** → **users**

应该看到新用户记录：
```
email: user@gmail.com
full_name: [从Google获取]
avatar_url: [Google头像URL]
membership_tier: free
credits: 10
```

---

## 🎉 完成！

如果测试通过，说明Google登录已经配置成功！

### 下一步

- [ ] 在Vercel预览环境测试
- [ ] 部署到生产环境
- [ ] 按照 [GOOGLE_LOGIN_TEST_CHECKLIST.md](./GOOGLE_LOGIN_TEST_CHECKLIST.md) 完整测试

---

## ❓ 遇到问题？

### 常见错误

**❌ redirect_uri_mismatch**
- 检查Google授权重定向URI是否包含Supabase回调URL

**❌ 点击按钮没反应**
- 打开浏览器控制台查看错误
- 确认Supabase配置已保存

**❌ 登录成功但没有用户记录**
- 检查数据库迁移是否执行
- 查看Supabase Postgres日志

### 获取帮助

1. 查看 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) 的详细排查步骤
2. 运行 [GOOGLE_LOGIN_TEST_CHECKLIST.md](./GOOGLE_LOGIN_TEST_CHECKLIST.md) 中的诊断命令
3. 检查浏览器控制台的错误信息

---

**配置时间**: 2025-10-10  
**适用版本**: MyNook v1.0+  
**支持环境**: 本地开发、Vercel预览、Vercel生产

祝配置顺利！🎊

