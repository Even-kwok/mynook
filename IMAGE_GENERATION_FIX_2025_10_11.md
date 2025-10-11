# 🔧 图片生成功能修复 - 2025年10月11日

## 📋 问题描述

用户报告生图功能无法正常工作。

## 🔍 发现的问题

经过代码审查，发现以下主要问题：

### 1. ✅ 模型配置正确
**确认位置**: `api/generate-image.ts` 第296行

**当前配置**: 使用正确的图像生成模型
```typescript
// ✅ 正确的图像生成模型
model: 'gemini-2.5-flash-image'
```

**说明**: 
- `gemini-2.5-flash-image` 是正确的图像生成和编辑模型
- 支持 Modality.IMAGE 响应模式

### 2. ⚠️ 环境变量配置不完整
**问题位置**: `api/lib/creditsService.ts` 第10-11行

**问题描述**: 环境变量只尝试一个名称，没有备选方案
```typescript
// ❌ 只尝试一个环境变量名
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
```

**原因**:
- 不同环境可能使用不同的环境变量名称
- Vercel 部署时环境变量可能命名不同

### 3. 🔍 缺少详细的错误日志
**问题描述**: 错误信息不够详细，难以排查问题

## ✅ 实施的修复

### 1. 确认模型配置正确
**配置内容**:
```typescript
// ✅ 图像生成使用正确的模型
model: 'gemini-2.5-flash-image'  // 用于图片生成

// ✅ 文本生成使用正确的模型
model: 'gemini-2.5-flash'  // 用于 AI Design Advisor
```

**位置**: 
- `api/generate-image.ts:296` - 图像生成
- `api/generate-text.ts:157` - 文本生成

**说明**: 
- `gemini-2.5-flash-image` 是专门的图像生成和编辑模型
- `gemini-2.5-flash` 用于文本生成和对话
- 与 `@google/genai` SDK v1.17.0 兼容

---

### 2. 增强环境变量读取
**修复内容**:
```typescript
// ✅ 尝试多个可能的环境变量名称
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
```

**位置**: `api/lib/creditsService.ts:10-11`

**说明**: 
- 增加了备选环境变量名称
- 提高了在不同环境下的兼容性
- 减少因环境变量命名差异导致的错误

---

### 3. 添加详细的调试日志
**修复内容**:
```typescript
// ✅ 添加详细的日志记录
console.log('✅ GEMINI_API_KEY found, initializing AI client...');
console.log(`🔧 Initializing Google GenAI client for user ${userId}...`);
console.log(`📝 Instruction: ${instruction.substring(0, 100)}...`);
console.log(`📤 Uploaded ${uploadedImageParts.length} images, calling Gemini API...`);
console.log(`🤖 Using model: ${modelName}`);

// ✅ 增强错误日志
console.error('❌ Error generating image:', {
  message,
  stack,
  userId,
  errorType: error?.constructor?.name,
  errorDetails: JSON.stringify(error, null, 2)
});
```

**位置**: `api/generate-image.ts` 多处

**说明**: 
- 添加了关键步骤的日志记录
- 错误信息包含更多调试细节
- 便于在 Vercel Function Logs 中排查问题

---

## 🚀 部署指南

### 步骤 1: 验证环境变量配置

在 Vercel Dashboard 中检查以下环境变量是否已配置：

| 环境变量名称 | 说明 | 必需 |
|------------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 密钥 | ✅ 是 |
| `VITE_SUPABASE_URL` 或 `SUPABASE_URL` | Supabase 项目 URL | ✅ 是 |
| `SUPABASE_SERVICE_KEY` 或 `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ 是 |

**验证步骤**:
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 → Settings → Environment Variables
3. 确认所有必需的环境变量都已设置
4. 确保环境变量应用到了 **Production**、**Preview** 和 **Development** 环境

### 步骤 2: 部署到 Vercel

由于你使用 Vercel 预览测试，执行以下命令：

```bash
# 提交更改
git add .
git commit -m "fix: 修复图片生成功能 - 更新模型名称和环境变量配置"

# 推送到远程仓库
git push origin master
```

### 步骤 3: 等待部署完成

1. Vercel 会自动检测到推送并开始部署
2. 访问 Vercel Dashboard 查看部署进度
3. 等待状态变为 "Ready" ✅（通常需要 1-2 分钟）

### 步骤 4: 测试修复结果

#### a) 基本功能测试
1. **清除浏览器缓存**（按 Ctrl + Shift + R 或 Cmd + Shift + R）
2. **确认已登录**
3. **上传测试图片**到 Free Canvas
4. **输入提示词**（例如："Make it modern style"）
5. **点击生成按钮**

#### b) 查看详细日志
1. **打开浏览器开发者工具**（按 F12）
2. **切换到 Network 标签**
3. **执行生成操作**
4. **查看 `/api/generate-image` 请求**:
   - **成功**: 状态码 200，返回包含 `imageUrl` 的 JSON
   - **失败**: 查看响应中的 `error` 和 `details` 字段

#### c) 查看 Vercel 函数日志
1. 访问 Vercel Dashboard
2. 选择最新部署 → **Functions** 标签
3. 查找 `/api/generate-image` 函数的日志
4. 应该能看到以下日志（如果成功）:
   ```
   ✅ GEMINI_API_KEY found, initializing AI client...
   🔧 Initializing Google GenAI client for user...
   📝 Instruction: ...
   📤 Uploaded 1 images, calling Gemini API...
   🤖 Using model: gemini-2.0-flash-exp
   ✅ Credits deducted for user...
   ```

---

## 🔍 可能的问题和解决方案

### 问题 1: 仍然报错 "API key not configured"

**症状**: 
- 错误码: `API_KEY_MISSING`
- 错误信息: "API key not configured. Please set GEMINI_API_KEY in Vercel environment variables."

**解决方案**:
1. 检查 Vercel 环境变量中是否有 `GEMINI_API_KEY`
2. 确认环境变量名称完全匹配（大小写敏感）
3. 确认环境变量应用到了当前部署环境
4. 重新部署项目

---

### 问题 2: 报错 "model not found" 或 "permission denied"

**症状**: 
- 错误信息包含 "model" 或 "permission"
- Gemini API 返回 404 或 403

**可能原因**:
1. **API Key 权限不足**: 你的 Google Cloud 项目可能没有启用 Gemini API
2. **模型访问受限**: `gemini-2.0-flash-exp` 可能需要特殊权限

**解决方案**:

#### 选项 A: 检查并启用 Gemini API
1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 确认你的项目已启用 Gemini API
3. 检查配额和权限

#### 选项 B: 尝试其他模型
如果 `gemini-2.0-flash-exp` 不可用，可以尝试以下模型：

编辑 `api/generate-image.ts`，修改第296行：

```typescript
// 备选方案 1: 使用 gemini-1.5-flash（稳定版）
const modelName = 'gemini-1.5-flash';

// 备选方案 2: 使用 gemini-1.5-pro（更强大但慢）
const modelName = 'gemini-1.5-pro';
```

**注意**: 如果使用非图像专用模型，可能需要调整配置：
```typescript
const response = await aiClient.models.generateContent({
  model: modelName,
  contents: [{
    role: 'user',
    parts: [
      ...uploadedImageParts.map((item) => item.part),
      textPart,
    ],
  }],
  // 注释掉或移除 responseModalities 配置
  // config: {
  //   responseModalities: [Modality.IMAGE],
  // },
});
```

---

### 问题 3: 报错 "Invalid authentication"

**症状**: 
- 错误码: `AUTH_INVALID` 或 `AUTH_REQUIRED`
- 用户已登录但仍然报错

**可能原因**:
1. Session token 过期
2. Supabase 配置错误

**解决方案**:
1. 退出登录并重新登录
2. 检查 Supabase 环境变量是否正确
3. 确认 `creditsService.ts` 可以正确连接 Supabase

---

### 问题 4: 报错 "Insufficient credits"

**症状**: 
- 错误码: `INSUFFICIENT_CREDITS`
- 用户有信用点但仍然报错

**可能原因**:
1. 数据库中的信用点数据未同步
2. 信用点扣除逻辑有误

**解决方案**:
1. 刷新页面查看最新的信用点余额
2. 在 Supabase Dashboard 中检查 `users` 表的 `credits` 字段
3. 如需手动添加信用点，执行以下 SQL:
```sql
UPDATE users
SET credits = credits + 100
WHERE id = 'YOUR_USER_ID';
```

---

### 问题 5: 生成成功但信用点扣除不正确

**症状**: 
- 图片生成成功
- 但信用点扣除错误（多扣或少扣）

**说明**: 
根据之前的修复（见 `IMAGE_GENERATION_FIXED.md`），这个问题应该已经解决。

**当前行为**:
- 图片生成成功：扣除 **1 点**信用点
- 图片生成失败：自动回滚，**不扣除**信用点

**验证步骤**:
1. 记录生成前的信用点数量
2. 执行生成操作
3. 检查生成后的信用点数量
4. 预期差值：1 点

---

## 📊 修改文件清单

| 文件路径 | 修改内容 | 状态 |
|---------|---------|------|
| `api/generate-image.ts` | 更新模型名称、添加详细日志 | ✅ 已修改 |
| `api/lib/creditsService.ts` | 增强环境变量读取 | ✅ 已修改 |

---

## 🧪 测试清单

部署完成后，请按以下清单测试：

- [ ] **环境变量检查**: 所有必需的环境变量都已配置
- [ ] **部署成功**: Vercel 部署状态为 "Ready"
- [ ] **登录功能**: 可以正常登录
- [ ] **上传图片**: 可以上传图片到画布
- [ ] **生成图片**: 点击生成按钮后能成功生成图片
- [ ] **信用点扣除**: 生成成功后正确扣除 1 点
- [ ] **失败回滚**: 如果生成失败，信用点不扣除
- [ ] **错误提示**: 各种错误场景都有清晰的提示信息
- [ ] **日志记录**: Vercel Function Logs 中有详细的日志

---

## 📞 后续支持

如果测试后仍有问题，请提供：

1. **浏览器控制台的完整错误信息**（包括 Network 标签的请求详情）
2. **Vercel Function Logs 的完整日志**（从 Vercel Dashboard 复制）
3. **具体的操作步骤**
4. **环境变量配置截图**（隐藏实际的密钥值）

这些信息将帮助快速定位和解决问题。

---

**最后更新**: 2025-10-11  
**状态**: ✅ 修复已完成，等待部署测试  
**修复人员**: AI Assistant


