# 订阅功能 500 错误诊断指南

## 🔍 当前问题

错误信息：`FUNCTION_INVOCATION_FAILED cle1:lclz5-176016322172?-3fcbe67094df`
HTTP 状态：500 Internal Server Error

## 🎯 最可能的原因

**Vercel 环境变量未配置或配置错误**

订阅 API (`/api/create-checkout-session`) 需要以下环境变量才能运行：

```bash
SUPABASE_URL              # Supabase 项目 URL
SUPABASE_SERVICE_KEY      # Supabase Service Role Key（不是 anon key！）
```

如果这些变量缺失，API 会在第 39-44 行返回 500 错误。

---

## ✅ 解决步骤

### 步骤 1：检查 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 `mynook`
3. 进入 **Settings** → **Environment Variables**
4. 检查是否存在以下变量：

| 变量名 | 值示例 | 说明 |
|--------|--------|------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Service Role Key（长密钥） |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | 前端用（可选） |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 前端用（可选） |

### 步骤 2：获取 Supabase 密钥

#### 方法 A：从 Supabase Dashboard 获取

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下内容：
   - **Project URL** → 用作 `SUPABASE_URL`
   - **service_role key** → 用作 `SUPABASE_SERVICE_KEY`（⚠️ 注意保密！）

#### 方法 B：从本地 .env 文件获取

如果你本地有 `.env` 文件，可以直接复制其中的值。

### 步骤 3：添加环境变量到 Vercel

在 Vercel 环境变量页面：

1. 点击 **Add New**
2. 输入变量名：`SUPABASE_URL`
3. 输入值：你的 Supabase URL
4. 选择环境：**Production**, **Preview**, **Development** 都勾选
5. 点击 **Save**

重复以上步骤添加 `SUPABASE_SERVICE_KEY`

### 步骤 4：重新部署

添加环境变量后，需要重新部署：

**方法 A：在 Vercel Dashboard**
1. 进入 **Deployments**
2. 找到最新的部署
3. 点击右侧的 **⋯** 菜单
4. 选择 **Redeploy**

**方法 B：推送新提交（触发自动部署）**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## 🧪 验证步骤

### 测试 1：访问诊断 API

部署完成后，在浏览器打开：
```
https://你的域名.vercel.app/api/test-connection
```

**预期结果（成功）：**
```json
{
  "status": "ok",
  "message": "API is working",
  "timestamp": "2025-01-10T...",
  "checks": {
    "api": "✅ API responding",
    "env": "✅ All env vars present",
    "supabase": "✅ Supabase connected"
  }
}
```

**如果失败：**
```json
{
  "error": "Server configuration error",
  "message": "Database credentials not configured"
}
```
→ 说明环境变量仍未正确配置

### 测试 2：使用调试工具

访问：
```
https://你的域名.vercel.app/debug-subscription.html
```

点击 **"运行测试"**，查看详细的诊断结果。

### 测试 3：测试订阅按钮

1. 登录你的账户
2. 访问 Pricing 页面
3. 点击 **Subscribe** 按钮
4. 查看浏览器控制台

**成功的响应示例：**
```json
{
  "success": true,
  "checkoutUrl": "https://...",
  "message": "✅ Subscription system is being configured...",
  "debug": {
    "userId": "...",
    "email": "...",
    "requestedPlan": "premium",
    "canProceed": true
  }
}
```

---

## ⚠️ 重要提示

### Service Role Key vs Anon Key

**Service Role Key (服务端密钥)：**
- ✅ 用于 API 函数
- ✅ 绕过 RLS（行级安全）
- ⚠️ 必须保密，不能暴露给前端
- 长度：约 200+ 字符

**Anon Key (公开密钥)：**
- ✅ 用于前端（浏览器）
- ✅ 受 RLS 保护
- ✅ 可以公开
- 长度：约 200+ 字符

**在 Vercel 环境变量中：**
- API 函数使用 `SUPABASE_SERVICE_KEY`
- 前端代码使用 `VITE_SUPABASE_ANON_KEY`

---

## 🔧 其他可能的问题

### 1. Vercel 部署未完成

检查 Vercel Dashboard → Deployments，确保最新部署状态为 **Ready**

### 2. API 路由未生效

确认 `vercel.json` 配置正确：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Node.js 版本问题

确认 Vercel 使用的 Node.js 版本：
- 进入 Settings → General → Node.js Version
- 建议使用 **18.x** 或 **20.x**

---

## 📊 查看详细日志

### 在 Vercel Dashboard：

1. 进入项目
2. 点击 **Functions**
3. 找到 `/api/create-checkout-session`
4. 查看执行日志

日志中应该能看到具体的错误信息，例如：
```
❌ Missing Supabase credentials
```

---

## 💡 快速解决方案

如果你急需测试其他功能，可以暂时跳过订阅集成：

1. 直接在数据库中手动升级用户权限
2. 使用我之前创建的测试工具
3. 等 CREEM 支付配置完成后再集成真实支付

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决，请提供：

1. **Vercel Function 日志截图**（Settings → Functions → create-checkout-session）
2. **浏览器控制台完整错误信息**
3. **访问 `/api/test-connection` 的返回结果**

我会根据这些信息提供更具体的解决方案。

