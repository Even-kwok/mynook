# 信用点系统集成指南

## 📋 概述

本项目已成功集成信用点系统，用户在使用 AI 生成功能（文本和图片）时会消耗相应的信用点。

## ✨ 功能特点

### 1. **信用点消耗规则**
- 📝 **文本生成**: 1 点/次
- 🖼️ **图片生成**: 5 点/次
- 👑 **Business 会员**: 无限使用

### 2. **会员等级系统**
| 等级 | 初始信用点 | 特权 |
|------|-----------|------|
| 🆓 Free | 10 | 基础功能 |
| ⭐ Pro | 100 | 高级功能 |
| 👑 Premium | 500 | 优先队列 |
| 💼 Business | 无限 | 专属支持 |

### 3. **自动回滚机制**
- ✅ 生成成功：扣除信用点
- ❌ 生成失败：自动回滚信用点
- 🔄 保证用户信用点准确性

## 🔧 环境变量配置

### **必需的环境变量**

在 Vercel 项目设置中添加以下环境变量：

```bash
# Supabase 配置（前端）
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase 配置（后端 - Service Key）
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key
```

### **获取 Service Key**

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制 **service_role key**（⚠️ 这是服务端密钥，切勿暴露在前端）

### **在 Vercel 中设置**

1. 进入 Vercel 项目仪表板
2. 点击 **Settings** → **Environment Variables**
3. 添加上述所有环境变量
4. 选择环境：`Production`, `Preview`, `Development`（全选）
5. 保存并重新部署

## 📁 项目结构

```
mynook/
├── api/
│   ├── lib/
│   │   └── creditsService.ts       # 信用点管理服务
│   ├── generate-image.ts           # 图片生成 API (已集成)
│   └── generate-text.ts            # 文本生成 API (已集成)
├── services/
│   ├── authService.ts              # 认证服务
│   └── geminiService.ts            # Gemini API 调用 (已更新)
├── context/
│   └── AuthContext.tsx             # 用户状态管理
└── types/
    └── database.ts                 # 数据库类型定义
```

## 🔐 API 端点

### **1. 文本生成 API**
```
POST /api/generate-text
Headers: 
  - Authorization: Bearer {user_token}
  - Content-Type: application/json
Body: {
  "instruction": "用户提示词",
  "systemInstruction": "系统指令（可选）",
  "base64Image": "base64图片（可选）"
}
```

**响应示例：**
```json
{
  "text": "生成的文本内容",
  "creditsUsed": 1,
  "creditsRemaining": 99
}
```

### **2. 图片生成 API**
```
POST /api/generate-image
Headers:
  - Authorization: Bearer {user_token}
  - Content-Type: application/json
Body: {
  "instruction": "图片生成指令",
  "base64Images": ["base64图片数组"]
}
```

**响应示例：**
```json
{
  "imageUrl": "data:image/png;base64,...",
  "creditsUsed": 5,
  "creditsRemaining": 95
}
```

## 🚨 错误处理

### **错误代码**

| 代码 | HTTP状态 | 说明 | 处理方式 |
|------|---------|------|---------|
| `AUTH_REQUIRED` | 401 | 缺少认证信息 | 要求用户登录 |
| `AUTH_INVALID` | 401 | 认证信息无效 | 刷新 token 或重新登录 |
| `INSUFFICIENT_CREDITS` | 402 | 信用点不足 | 提示用户充值或升级 |
| `CREDITS_CHECK_FAILED` | 500 | 信用点检查失败 | 稍后重试 |
| `CREDITS_DEDUCT_FAILED` | 500 | 信用点扣除失败 | 稍后重试 |

### **前端错误处理示例**

```typescript
try {
  const result = await generateImage(instruction, images);
  // 成功处理
} catch (error) {
  if (error.message.includes('logged in')) {
    // 提示用户登录
    showLoginModal();
  } else if (error.message.includes('Insufficient credits')) {
    // 提示信用点不足
    showUpgradeModal();
  } else {
    // 其他错误
    showErrorToast(error.message);
  }
}
```

## 📊 数据库表结构

### **users 表**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 用户ID（关联 auth.users） |
| `email` | TEXT | 用户邮箱 |
| `credits` | INTEGER | 剩余信用点 |
| `membership_tier` | TEXT | 会员等级 |
| `total_generations` | INTEGER | 总生成次数 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

## 🔄 工作流程

### **生成请求流程**

```
1. 用户发起生成请求
   ↓
2. 前端获取 Auth Token
   ↓
3. 调用后端 API（带 Authorization header）
   ↓
4. 后端验证 Token
   ↓
5. 检查信用点余额
   ↓
6. 扣除信用点
   ↓
7. 调用 Gemini API 生成内容
   ↓
8. 成功：返回结果 + 剩余信用点
   失败：回滚信用点 + 返回错误
```

## 🧪 测试建议

### **测试场景**

1. ✅ **正常流程测试**
   - 登录用户生成文本/图片
   - 验证信用点正确扣除
   - 验证 total_generations 增加

2. ✅ **边界测试**
   - 信用点不足时的提示
   - Business 会员无限使用
   - 信用点恰好为 0 或 1

3. ✅ **错误处理测试**
   - 未登录用户访问
   - Token 过期
   - 生成失败时信用点回滚
   - 网络错误处理

4. ✅ **并发测试**
   - 多个请求同时发起
   - 验证信用点扣除一致性

## 📝 前端集成示例

### **在组件中使用**

```typescript
import { useAuth } from '../context/AuthContext';
import { generateImage } from '../services/geminiService';

function MyComponent() {
  const { credits, isAuthenticated, refreshProfile } = useAuth();

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      alert('Please log in to use this feature');
      return;
    }

    if (credits < 5) {
      alert('Insufficient credits. Please upgrade your plan.');
      return;
    }

    try {
      const result = await generateImage(instruction, images);
      // 刷新用户信息以更新信用点显示
      await refreshProfile();
      // 处理结果...
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error.message);
    }
  };

  return (
    <div>
      <p>Credits: {credits}</p>
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}
```

## 🎯 下一步建议

1. **添加信用点充值功能**
   - 集成支付系统（Stripe/PayPal）
   - 创建充值套餐页面

2. **创建使用记录页面**
   - 显示历史生成记录
   - 统计信用点使用情况

3. **添加通知系统**
   - 信用点不足提醒
   - 每日/每月使用报告

4. **优化用户体验**
   - 在生成前显示需要的信用点
   - 添加进度条和加载状态
   - 显示预估生成时间

## 🐛 故障排查

### **常见问题**

**Q: API 返回 "Unauthorized" 错误**
- 检查 `SUPABASE_SERVICE_KEY` 是否正确设置
- 验证用户 token 是否有效
- 确认环境变量在 Vercel 中已正确配置

**Q: 信用点没有正确扣除**
- 检查数据库 RLS 策略
- 验证 service key 权限
- 查看服务器日志

**Q: 生成失败但信用点已扣除**
- 检查回滚逻辑是否执行
- 验证错误处理流程
- 手动回滚（使用 Supabase Dashboard）

## 📚 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [Gemini API 文档](https://ai.google.dev/docs)
- [Vercel 环境变量](https://vercel.com/docs/environment-variables)

---

**最后更新**: 2025-01-10
**版本**: 1.0.0

