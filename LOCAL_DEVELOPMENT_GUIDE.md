# 🚀 本地开发指南 (Local Development Guide)

## ❌ 当前问题 (Current Issue)

如果你看到图片生成失败的错误：
```
Error generating image with Gemini: Error: Failed to get response from server
Failed to load resource: the server responded with a status of 500 () /api/generate-image.js
```

这是因为 `/api/generate-image` 和 `/api/generate-text` 是 **Vercel Serverless Functions**，在本地开发时需要特殊配置才能运行。

---

## ✅ 解决方案 (Solutions)

### 方法 1: 使用 Vercel CLI 运行项目（推荐）

这是最简单和最可靠的方法，因为它可以完全模拟 Vercel 生产环境。

#### 步骤：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   
   在项目根目录创建 `.env` 文件（已经创建好模板文件 `.env.example`）：
   ```bash
   # 复制模板文件
   copy .env.example .env
   ```
   
   然后编辑 `.env` 文件，填入你的API密钥：
   ```env
   # Gemini API Key
   # 从这里获取: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=你的_gemini_api_key

   # Supabase Configuration
   # 从你的 Supabase 项目设置中获取
   VITE_SUPABASE_URL=你的_supabase_url
   VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
   ```

3. **登录 Vercel（首次使用）**
   ```bash
   npx vercel login
   ```
   按照提示完成登录。

4. **运行开发服务器**
   ```bash
   npm run dev:vercel
   ```
   
   首次运行时，Vercel CLI 会询问一些问题：
   - Set up and develop "..."? **[Y]**
   - Which scope? 选择你的账户
   - Link to existing project? **[N]** (如果是新项目)
   - What's your project's name? 输入项目名称或直接回车使用默认名称
   - In which directory is your code located? **[./]** (直接回车)

5. **访问应用**
   
   打开浏览器访问显示的本地地址（通常是 `http://localhost:3000`）

---

### 方法 2: 使用普通 Vite 开发服务器（不推荐，需要额外配置）

如果你想使用 `npm run dev`，你需要：

1. 在部署到 Vercel 后使用生产环境的 API
2. 或者将 API 函数迁移到 Vite 开发服务器可以处理的本地 API 端点

**注意**: 这种方法需要更多的配置工作，不推荐用于本地开发。

---

## 🔑 获取 API 密钥

### Gemini API Key
1. 访问: https://aistudio.google.com/app/apikey
2. 使用你的 Google 账户登录
3. 点击 "Create API Key" 创建新密钥
4. 复制密钥并粘贴到 `.env` 文件中

### Supabase 配置
1. 访问你的 Supabase 项目: https://supabase.com/dashboard
2. 进入项目设置 (Settings) > API
3. 复制以下信息到 `.env` 文件：
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

---

## 📝 常见问题 (FAQ)

### Q: 为什么不能直接用 `npm run dev`？
**A**: 因为 Vite 开发服务器不知道如何处理 `/api/*` 路径的请求。这些请求需要由 Vercel 的 serverless 函数处理，所以需要使用 `vercel dev`。

### Q: 我可以在生产环境部署吗？
**A**: 可以！在 Vercel 上部署后，所有 API 端点会自动工作。只需要在 Vercel 项目设置中配置环境变量。

### Q: `.env` 文件会被提交到 Git 吗？
**A**: 不会。`.env` 文件已经添加到 `.gitignore` 中，不会被提交。但是 `.env.example` 会被提交，作为配置模板。

### Q: Vercel CLI 做了什么？
**A**: Vercel CLI 会：
- 启动本地开发服务器
- 模拟 Vercel 的 serverless 函数环境
- 处理 `/api/*` 路径的请求
- 自动加载 `.env` 文件中的环境变量

---

## 🚀 部署到 Vercel

1. **推送代码到 Git**
   ```bash
   git add .
   git commit -m "Setup local development"
   git push
   ```

2. **在 Vercel 上导入项目**
   - 访问: https://vercel.com/new
   - 选择你的 Git 仓库
   - Vercel 会自动检测配置

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量：
     - `GEMINI_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **部署**
   - Vercel 会自动构建并部署你的项目

---

## 📚 相关文档

- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)
- [Supabase 文档](https://supabase.com/docs)

---

## 💡 开发建议

1. **始终使用 `npm run dev:vercel`** 进行本地开发，以确保与生产环境一致
2. **不要将 `.env` 文件提交到 Git**
3. **在 Vercel 项目设置中同步环境变量**
4. **定期检查 API 密钥的使用限额**

---

如有问题，请查看项目中的其他文档：
- `README.md` - 项目概述
- `SETUP.md` - 初始设置指南
- `DEBUG_GUIDE.md` - 调试指南
- `AUTHENTICATION_GUIDE.md` - 认证配置指南

