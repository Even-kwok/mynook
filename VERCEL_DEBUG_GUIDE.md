# 🐛 Vercel生产环境调试指南

## 检查步骤

### 1️⃣ 查看Vercel Function日志

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Logs** 或 **Deployment Details**
4. 查看Runtime Logs，找到 `/api/generate-image` 的错误信息

**常见错误类型：**
- `GEMINI_API_KEY is not configured` → 环境变量未设置
- `API key not valid` → API key无效
- `Quota exceeded` → API配额用完
- `Failed to get response from server` → Gemini API响应失败

### 2️⃣ 检查环境变量配置

1. 进入项目 → **Settings** → **Environment Variables**
2. 确认 `GEMINI_API_KEY` 已添加
3. 检查是否应用到了正确的环境：
   - ✅ Production
   - ✅ Preview
   - ✅ Development

**重要**：修改环境变量后需要重新部署！

### 3️⃣ 验证API Key是否有效

访问 https://aistudio.google.com/app/apikey

- 检查API key是否存在
- 确认没有被删除或过期
- 检查API配额是否用完

### 4️⃣ 测试API端点

在浏览器开发者工具中：

1. 打开 **Console** 标签
2. 运行以下代码测试：

```javascript
fetch('/api/generate-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instruction: 'Say hello',
    systemInstruction: '',
    base64Image: null
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

如果返回错误，查看具体错误信息。

### 5️⃣ 强制重新部署

有时候环境变量更新后需要重新部署：

1. 在Vercel Dashboard
2. 点击 **Deployments**
3. 找到最新的部署
4. 点击 **Redeploy**

或者：
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### 6️⃣ 检查Gemini API模型

确认你的API key支持 `gemini-2.0-flash-exp` 模型：

- 这是一个实验性模型
- 可能需要特定的API访问权限
- 如果不支持，可以改用 `gemini-1.5-flash` 或 `gemini-1.5-pro`

## 🔧 常见问题修复

### 问题1：环境变量未生效

**原因**：Vercel缓存了旧的环境变量

**解决**：
1. 更新环境变量
2. 重新部署项目
3. 清除浏览器缓存

### 问题2：API Key无效

**原因**：API key可能有空格或特殊字符

**解决**：
1. 重新复制API key（确保没有多余空格）
2. 直接在Vercel输入，不要粘贴
3. 或者用引号包裹值

### 问题3：Quota exceeded

**原因**：免费配额用完

**解决**：
1. 访问 https://aistudio.google.com/
2. 检查使用量
3. 等待配额重置或升级计划

### 问题4：CORS错误

**原因**：跨域请求被阻止

**解决**：已经在代码中处理，不应该出现此问题

## 📝 调试代码

如果上述方法都不行，可以临时添加调试日志：

编辑 `api/generate-image.ts`，在第97行后添加：

```typescript
console.log('Environment check:', {
  hasApiKey: !!apiKey,
  apiKeyLength: apiKey?.length,
  apiKeyPrefix: apiKey?.substring(0, 10)
});
```

然后重新部署，查看Vercel日志中的输出。

## 🆘 需要更多帮助？

提供以下信息：
1. Vercel项目URL
2. 控制台的完整错误信息
3. Vercel Function Logs中的错误
4. 环境变量配置截图（隐藏实际的key值）

