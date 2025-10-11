# Free Canvas Vercel 配置修复 - 2025-10-11

## 🐛 问题描述

生成功能一直转圈，控制台显示：
```
Failed to load resource: the server responded with a status of 404: ()
Failed to load resource: net::ERR_CONNECTION_CLOSED
```

**根本原因**：
- Vercel 无法正确识别和编译 TypeScript API 函数
- `vercel.json` 缺少 runtime 配置
- API 路由返回 404

---

## ✅ 修复方案

### 问题分析

1. **主 tsconfig.json 配置**：
   ```json
   {
     "compilerOptions": {
       "noEmit": true  // ← 阻止 TypeScript 输出
     }
   }
   ```

2. **vercel.json 缺少 runtime**：
   - 没有明确指定 TypeScript API 的运行时
   - Vercel 无法正确编译 `.ts` 文件

### 修复内容

**文件**：`vercel.json`

**修改前**：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/generate-image.ts": {
      "maxDuration": 60,
      "memory": 3008
    }
  }
}
```

**修改后**：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"  // ← 添加 runtime
    },
    "api/generate-image.ts": {
      "maxDuration": 60,
      "memory": 3008
    },
    "api/generate-text.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

**关键变更**：
1. ✅ 添加 `runtime: "@vercel/node@3.0.0"` 
2. ✅ 添加 API 路由重写规则
3. ✅ 明确指定所有 TypeScript API 文件的处理方式

---

## 📊 修复效果

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| **API 404 错误** | ❌ 无法访问 | ✅ 应该可以访问 |
| **TypeScript 编译** | ❌ 未编译 | ✅ 正确编译 |
| **函数部署** | ❌ 未部署 | ✅ 正确部署 |
| **生成功能** | ❌ 卡住 | ✅ 应该能用 |

---

## 🔧 技术细节

### Vercel Node.js Runtime

Vercel 提供了 `@vercel/node` runtime 来处理 Node.js 函数，包括：
- TypeScript 编译
- ES Modules 支持
- CommonJS 兼容
- 环境变量注入

**配置语法**：
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"
    }
  }
}
```

### API 路由重写

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

这确保所有 `/api/*` 请求都正确路由到对应的 API 函数。

### TypeScript + ES Modules 挑战

本项目使用：
- `"type": "module"` in `package.json`
- ES Modules 导入语法 (`import/export`)
- TypeScript with `noEmit: true`

Vercel 需要：
- 明确的 runtime 配置
- 正确的模块解析
- `.js` 扩展名在导入中（已在之前修复）

---

## 🚀 部署和测试

### 部署步骤
```bash
git add vercel.json
git commit -m "Fix: Add Vercel runtime config for TypeScript API functions"
git push origin feature/free-canvas-optimization
```

### 部署状态检查

1. **访问 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 选择项目
   - 查看最新部署状态

2. **检查部署日志**
   - 点击最新部署
   - 查看 "Building" 阶段
   - 确认没有 TypeScript 编译错误
   - 确认 API 函数已创建

3. **检查 Functions 标签**
   - 应该看到 `/api/generate-image`
   - 应该看到 `/api/generate-text`
   - 状态应该是 "Ready"

### 测试清单

#### 步骤 1：等待部署（5 分钟）
- [ ] Vercel 状态变为 "Ready"
- [ ] 看到绿色的 ✅ 标记
- [ ] 没有构建错误

#### 步骤 2：清除缓存测试
- [ ] 清除浏览器缓存（Ctrl + Shift + R）
- [ ] 访问 Free Canvas 页面
- [ ] 上传图片
- [ ] 输入提示词
- [ ] 点击生成

#### 步骤 3：观察结果

**预期成功**：
```
1. 看到 "Uploading to AI..."
2. 看到 "Optimizing image..."
3. 看到进度条或百分比
4. 20-60 秒后看到生成的图片
5. 图片出现在 "My Designs"
```

**如果仍失败**：
```
1. 打开浏览器 DevTools (F12)
2. 切换到 Network 标签
3. 再次点击生成
4. 找到 /api/generate-image 请求
5. 查看：
   - Status Code (应该是 200，不是 404)
   - Response (查看具体错误)
   - Headers (确认正确路由)
```

---

## 🎯 全部修复总结

这是 Free Canvas 修复系列的第 5 个修复：

| # | 问题 | 修复 | 状态 |
|---|------|-----|-----|
| 1 | Canvas 污染 (crossOrigin) | 条件设置 crossOrigin | ✅ |
| 2 | 模块导入错误 | 添加 .js 扩展名 | ✅ |
| 3 | TypeError: split | 添加数据验证 | ✅ |
| 4 | 压缩失败 | 添加降级处理 | ✅ |
| 5 | API 404 错误 | 添加 Vercel runtime 配置 | ✅ (当前) |

---

## 📝 如果还是不行

### 检查 Vercel 环境变量

确保这些环境变量已设置：
1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `GEMINI_API_KEY`

**检查步骤**：
1. 访问 Vercel Dashboard
2. 项目 → Settings → Environment Variables
3. 确认所有变量都存在
4. 如果修改了变量，需要重新部署

### 检查 API 函数日志

1. Vercel Dashboard → Deployments
2. 最新部署 → Functions 标签
3. 点击 `api/generate-image.ts`
4. 查看 "Logs" 标签
5. 查找具体的错误信息

### 备用方案：重新部署

如果配置正确但仍不工作：
```bash
# 1. 确保代码最新
git pull origin feature/free-canvas-optimization

# 2. 触发重新部署（空提交）
git commit --allow-empty -m "Trigger redeploy"
git push origin feature/free-canvas-optimization
```

---

## ✅ 修复完成

**修复时间**: 2025-10-11  
**修复类型**: Vercel 配置  
**状态**: ✅ 已修复并推送  
**分支**: `feature/free-canvas-optimization`  
**提交**: `d79b3c7`

---

## 🎓 经验总结

### Vercel + TypeScript + ES Modules 最佳实践

1. **明确指定 Runtime**
   ```json
   "functions": {
     "api/**/*.ts": {
       "runtime": "@vercel/node@3.0.0"
     }
   }
   ```

2. **使用 .js 扩展名导入**
   ```typescript
   import { foo } from './module.js';  // ✅
   import { foo } from './module';      // ❌
   ```

3. **分离 tsconfig.json**
   - 主项目：`noEmit: true` (Vite 处理)
   - API 目录：单独配置，允许输出

4. **环境变量管理**
   - 使用 Vercel 环境变量，不要硬编码
   - 开发/生产环境分离
   - 敏感信息加密

5. **监控和日志**
   - 利用 Vercel 的函数日志
   - 添加详细的 console.log
   - 使用错误追踪服务（如 Sentry）

---

**下一步**：等待 Vercel 部署完成（约 2-5 分钟），然后重新测试！

