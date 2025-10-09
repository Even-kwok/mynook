# 🔧 快速修复 - 图片生成失败

## 问题原因

你正在使用 `npm run dev`（普通Vite开发服务器）运行项目，但是：
- `/api/generate-image` 和 `/api/generate-text` 是 **Vercel Serverless Functions**
- 普通Vite服务器不知道如何处理这些API请求
- 所以会返回500错误

## ✅ 解决方案

### 选项1：使用Vercel CLI本地开发（推荐）

1. **停止当前服务器**（按 Ctrl+C）

2. **安装依赖**（如果还没安装）
   ```bash
   npm install
   ```

3. **运行Vercel开发服务器**
   ```bash
   npm run dev:vercel
   ```
   
   首次运行会问一些问题，全部按回车使用默认值即可。

4. **刷新浏览器**

这样API端点就能正常工作了！

---

### 选项2：直接在Vercel生产环境测试

如果你已经部署到Vercel：

1. 访问你的Vercel项目URL（例如：`https://your-project.vercel.app`）
2. 直接在生产环境测试图片生成功能

因为你已经在Vercel配置了环境变量，生产环境应该可以正常工作。

---

### 选项3：检查Vercel部署状态

访问：https://vercel.com/dashboard

检查：
- 项目是否已成功部署
- 环境变量 `GEMINI_API_KEY` 是否已配置
- 最新部署是否成功

---

## 🎯 推荐做法

**本地开发时始终使用：**
```bash
npm run dev:vercel
```

**而不是：**
```bash
npm run dev  # ❌ 这个无法处理API端点
```

---

## ❓ 为什么不用npm run dev？

- `npm run dev` = 纯前端开发服务器（Vite）
- `npm run dev:vercel` = 完整的Vercel环境模拟（前端 + Serverless Functions）

你的项目使用了Serverless Functions，所以需要完整环境。

