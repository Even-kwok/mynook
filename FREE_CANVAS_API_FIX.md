# ✅ Free Canvas API 路由问题已修复

## 修复时间
2025年10月11日

## 问题描述
Free Canvas 页面无法生成图片，用户点击生成按钮后没有响应。

## 根本原因
`vercel.json` 配置文件中的路由规则有误，导致所有请求（包括 API 请求）都被重定向到 `/index.html`，使得后端 API 端点无法被正确访问。

### 原配置（错误）
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

这个配置会将 `/api/generate-image` 等 API 请求也重定向到前端页面。

## 解决方案

### 修改后的配置（正确）
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 配置说明
1. **第一条规则**：确保所有 `/api/*` 开头的请求都路由到对应的 API 端点
2. **第二条规则**：其他所有请求路由到前端应用的 `index.html`（用于 SPA 路由）

## Free Canvas 图片生成流程

### 1. 前端调用 (FreeCanvasPage.tsx)
```typescript
// Line 1208-1209
const imageForApiData = imageForApi.split(',')[1]; // 去掉 data:image 前缀
const generatedUrl = await generateImage(finalPrompt, [imageForApiData]);
```

### 2. Service 层 (geminiService.ts)
```typescript
// Line 146-156
const token = await getAuthToken(); // 获取用户认证 token
const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
        instruction,
        base64Images, // 不含前缀的 base64 图片数据
    }),
});
```

### 3. 后端 API (api/generate-image.ts)
处理流程：
1. **身份验证**（Line 174-188）- 验证 JWT token
2. **信用点检查**（Line 192-211）- 检查用户是否有足够的信用点（需要 5 credits）
3. **扣除信用点**（Line 215-223）- 扣除 5 个信用点
4. **图片生成**（Line 228-393）：
   - 上传图片到 Gemini Files API
   - 调用 `gemini-2.5-flash-image` 模型
   - 生成新图片
   - 清理临时文件
5. **失败回滚**：如果生成失败，自动退还信用点

### 信用点使用
- **图片生成**：5 credits/次
- **文本生成**：1 credit/次

## 部署步骤

### 1. 提交代码
```bash
git add vercel.json
git commit -m "fix: 修复 API 路由配置，解决 Free Canvas 无法生成图片的问题"
git push
```

### 2. Vercel 自动部署
- Vercel 会自动检测到代码变更并重新部署
- 部署完成后，API 路由会正常工作

### 3. 验证步骤
1. 打开 Free Canvas 页面
2. 上传或绘制图片
3. 输入提示词
4. 点击生成按钮
5. 检查：
   - 是否扣除了 5 个信用点
   - 是否成功生成图片
   - 生成的图片是否符合预期

## 技术细节

### Vercel Serverless Functions
- API 文件位置：`/api/*.ts`
- Vercel 自动将这些文件转换为 serverless functions
- 每个文件导出一个 `handler` 函数处理请求

### 环境变量要求
确保在 Vercel 项目设置中配置了以下环境变量：
- `GEMINI_API_KEY` - Google Gemini API 密钥
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥（用于后端验证）

## 相关文件
- `/vercel.json` - Vercel 配置文件（已修复）
- `/components/FreeCanvasPage.tsx` - Free Canvas 前端组件
- `/services/geminiService.ts` - Gemini API 服务封装
- `/api/generate-image.ts` - 图片生成 API 端点
- `/api/lib/creditsService.ts` - 信用点管理服务

## 测试检查清单
- [ ] API 路由是否正确工作
- [ ] 图片生成是否成功
- [ ] 信用点是否正确扣除
- [ ] 失败时是否正确回滚信用点
- [ ] 错误消息是否友好清晰
- [ ] 生成历史是否正确保存

## 注意事项
1. **本地测试**：由于项目配置为仅在 Vercel 预览，本地无需运行
2. **认证要求**：必须登录才能使用图片生成功能
3. **信用点消耗**：每次生成消耗 5 credits，请确保账户有足够余额
4. **API 限制**：受 Gemini API 限制和配额约束

## 相关文档
- [IMAGE_GENERATION_FIXED.md](./IMAGE_GENERATION_FIXED.md) - 之前的图片生成修复记录
- [TEMPLATE_SYSTEM_GUIDE.md](./TEMPLATE_SYSTEM_GUIDE.md) - 模板系统指南
- [CREDITS_INTEGRATION_GUIDE.md](./CREDITS_INTEGRATION_GUIDE.md) - 信用点系统指南

