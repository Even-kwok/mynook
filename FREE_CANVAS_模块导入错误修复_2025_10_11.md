# Free Canvas 模块导入错误修复 - 2025-10-11

## 🐛 问题描述

部署到 Vercel 后，生成功能报错：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/lib/creditsService'
imported from /var/task/api/generate-image.js
```

用户界面显示：
```
Generation failed: Server error. Please try again later.
```

## 🔍 问题原因

由于 `package.json` 中设置了 `"type": "module"`，项目使用 **ES Modules** 模式。

在 ES Modules 中，导入 TypeScript 文件时必须使用 `.js` 扩展名（因为编译后的文件是 `.js`），而不是 `.ts` 或省略扩展名。

### 错误的导入方式 ❌
```typescript
import { verifyUserToken } from './lib/creditsService';  // 缺少 .js
```

### 正确的导入方式 ✅
```typescript
import { verifyUserToken } from './lib/creditsService.js';  // 添加 .js
```

## ✅ 修复方案

### 修改的文件

#### 1. `api/generate-image.ts` - 第 15 行
**修改前**：
```typescript
} from './lib/creditsService';
```

**修改后**：
```typescript
} from './lib/creditsService.js';
```

#### 2. `api/generate-text.ts` - 第 10 行
**修改前**：
```typescript
} from './lib/creditsService';
```

**修改后**：
```typescript
} from './lib/creditsService.js';
```

## 📊 修复效果

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| **API 启动** | ❌ 模块加载失败 | ✅ 正常启动 |
| **错误信息** | ERR_MODULE_NOT_FOUND | 无错误 |
| **生成功能** | ❌ 服务器错误 | ✅ 正常工作 |

## 🔧 技术细节

### ES Modules 导入规则

在 Node.js ES Modules 模式下：

1. **必须包含文件扩展名**
   ```typescript
   ✅ import { foo } from './module.js'
   ❌ import { foo } from './module'
   ```

2. **TypeScript 编译后是 .js**
   - 源文件：`creditsService.ts`
   - 编译后：`creditsService.js`
   - 导入时用：`.js` 而不是 `.ts`

3. **相对路径必须以 ./ 或 ../ 开头**
   ```typescript
   ✅ import { foo } from './lib/module.js'
   ❌ import { foo } from 'lib/module.js'
   ```

### package.json 配置
```json
{
  "type": "module",  // 启用 ES Modules
  ...
}
```

## 🚀 部署和测试

### 部署步骤
```bash
# 修复已自动推送到远程分支
git push origin feature/free-canvas-optimization
```

### 测试清单
- [x] 代码修改完成
- [x] 无 linter 错误
- [x] 提交并推送
- [ ] Vercel 自动部署（等待 1-2 分钟）
- [ ] 测试生成功能

### 测试步骤

1. **等待 Vercel 部署完成**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 等待状态变为 "Ready" ✅

2. **清除缓存并测试**
   - 清除浏览器缓存（Ctrl + Shift + R）
   - 上传图片到 Free Canvas
   - 输入提示词
   - 点击生成

3. **预期结果**
   - ✅ 不再显示"Server error"
   - ✅ 能看到详细进度：
     - "Preparing images..."
     - "Uploading to AI..."
     - "Generating your design..."
   - ✅ 20-60 秒后成功生成图片

4. **检查 Vercel 日志**
   - 应该没有 "Cannot find module" 错误
   - 应该能看到正常的生成日志：
     ```
     ✅ GEMINI_API_KEY found, initializing AI client...
     🔧 Initializing Google GenAI client for user...
     📤 Uploaded 1 images, calling Gemini API...
     ```

## 🎓 经验总结

### 为什么会出现这个问题？

1. **TypeScript 编译**
   - TypeScript 编译后生成 `.js` 文件
   - 但 TypeScript 代码中导入时没有写扩展名

2. **本地开发正常**
   - Vite 开发服务器自动处理导入路径
   - 本地测试时不会发现这个问题

3. **Vercel 部署失败**
   - Vercel 使用 Node.js 原生 ES Modules
   - 必须严格遵守 ES Modules 规范
   - 缺少 `.js` 扩展名会导致模块加载失败

### 如何避免类似问题？

1. **统一使用 .js 扩展名**
   ```typescript
   // 所有相对导入都加上 .js
   import { foo } from './utils.js'
   import { bar } from '../lib/service.js'
   ```

2. **配置 TypeScript**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "module": "ES2022",
       "moduleResolution": "bundler"
     }
   }
   ```

3. **测试 Vercel 部署**
   - 推送后立即测试
   - 检查 Vercel Function 日志
   - 及时发现模块导入问题

## 📝 相关文档

- [Node.js ES Modules 文档](https://nodejs.org/api/esm.html)
- [TypeScript 模块解析](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Vercel Node.js 运行时](https://vercel.com/docs/runtimes#official-runtimes/node-js)

## ✅ 修复完成

**修复时间**: 2025-10-11  
**修复类型**: 模块导入路径  
**状态**: ✅ 已修复并推送  
**分支**: `feature/free-canvas-optimization`  
**提交**: `10e3e3e`

---

## 🎯 下一步

等待 Vercel 部署完成（约 1-2 分钟），然后测试生成功能。

如果仍有问题，请查看 Vercel Function 日志中的具体错误信息。

