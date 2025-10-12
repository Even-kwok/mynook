# Free Canvas 超时问题修复 - 2025年10月12日

## 问题描述
用户反馈：Free Canvas第三次生成图片时，一直卡在"Calling API..."状态，等待了几分钟都没有响应。

## 问题原因

### 1. 超时时间过长
- **前端超时**: 110秒
- **后端超时**: 100秒  
- **Vercel函数**: 120秒
- **重试机制**: 最多2次尝试（1次初始 + 1次重试）

**问题**：如果触发重试，总等待时间 = 110秒 + 2秒 + 110秒 = 222秒（约3.7分钟）

### 2. Promise.race 可能未正确触发
后端的Promise.race超时控制可能在某些情况下未能正确中断Vertex AI调用。

### 3. 缺少详细的超时日志
无法追踪到底是哪个环节卡住了。

## 解决方案

### 1. 优化超时配置

#### Vercel配置 (vercel.json)
```json
{
  "functions": {
    "api/generate-image.ts": {
      "maxDuration": 100,  // 从120秒减少到100秒
      "memory": 3008
    }
  }
}
```

#### 前端配置 (services/geminiService.ts)
```typescript
const MAX_RETRIES = 0;      // 暂时禁用重试，避免长时间卡住
const TIMEOUT = 100000;     // 100秒超时
const RETRY_DELAY = 2000;   // 2秒延迟
```

#### 后端配置 (api/generate-image.ts)
```typescript
// Vertex AI超时设置为90秒
const requestTimeout = new Promise<never>((_, reject) => {
  setTimeout(() => {
    console.error('⏱️ Vertex AI timeout triggered after 90 seconds');
    reject(new Error('Vertex AI request timeout after 90 seconds'));
  }, 90000);
});
```

### 2. 超时层级设计

```
用户等待 (最多100秒)
  └─> 前端Fetch (100秒超时)
        └─> Vercel函数 (100秒强制终止)
              └─> Vertex AI调用 (90秒超时)
```

**优势**：
- 每一层都有明确的超时保护
- 内层超时先触发，避免外层强制中断
- 确保用户最多等待100秒就能看到结果或错误

### 3. 增强日志追踪

#### 前端日志
```typescript
console.log(`[API Call] Attempt ${attempt + 1}/${MAX_RETRIES + 1}, Timeout: ${TIMEOUT}ms`);
console.log(`[API Call] Starting fetch at ${startTime}`);
console.log(`[API Call] Fetch completed in ${fetchTime}ms`);
console.error(`[API Call] Request timed out after ${TIMEOUT}ms`);
```

#### 后端日志
```typescript
console.log(`📡 [${apiStartTime}] Starting Vertex AI API call...`);
console.log(`✅ Vertex AI responded in ${apiTime}ms (${(apiTime/1000).toFixed(1)}s)`);
console.error(`⏱️ Vertex AI timeout triggered after 90 seconds`);
```

### 4. 优化Promise.race实现

**修改前**：
```typescript
const requestTimeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('timeout')), 100000);
});
const response = await Promise.race([generateRequest, requestTimeout]) as any;
```

**修改后**：
```typescript
const requestTimeout = new Promise<never>((_, reject) => {
  setTimeout(() => {
    console.error('⏱️ Vertex AI timeout triggered after 90 seconds');
    reject(new Error('Vertex AI request timeout after 90 seconds'));
  }, 90000);
});

const generateRequest = aiClient.models.generateContent({...})
  .then(res => {
    const apiTime = Date.now() - apiStartTime;
    console.log(`✅ Vertex AI responded in ${apiTime}ms`);
    return res;
  });

const response = await Promise.race([generateRequest, requestTimeout]);
```

**改进点**：
- 明确Promise.race的类型为`Promise<never>`，确保类型安全
- 添加成功响应的日志追踪
- 添加超时触发的明确日志

## 预期效果

### 正常情况（30-60秒）
```
[API Call] Attempt 1/1, Timeout: 100000ms
[API Call] Starting fetch at 1728745200000
📡 [1728745200000] Starting Vertex AI API call...
✅ Vertex AI responded in 45000ms (45.0s)
[API Call] Fetch completed in 45500ms
✅ Image generated successfully in 46000ms (46.0s)
```

### 超时情况（90秒）
```
[API Call] Attempt 1/1, Timeout: 100000ms
[API Call] Starting fetch at 1728745200000
📡 [1728745200000] Starting Vertex AI API call...
⏱️ Vertex AI timeout triggered after 90 seconds
[API Call] Request timed out after 100000ms
❌ Error: Vertex AI request timeout after 90 seconds
💰 Refunded 5 credits to user XXX
```

## 用户体验改进

### 修改前
- ❌ 第一次失败：等待110秒
- ❌ 延迟2秒重试
- ❌ 第二次失败：再等110秒
- ❌ 总计：222秒（约3.7分钟）无任何反馈

### 修改后
- ✅ 单次尝试：最多等待100秒
- ✅ 不重试：失败立即提示
- ✅ 明确错误信息："Request timeout after 100s"
- ✅ 自动退款：失败时信用点自动返还

## 部署步骤

1. **提交代码**
```bash
git add .
git commit -m "修复Free Canvas超时问题：优化超时配置和错误处理"
git push
```

2. **Vercel自动部署**
   - 等待Vercel构建完成
   - 新配置会自动生效

3. **测试验证**
   - 测试正常生成（应在30-60秒完成）
   - 测试超时情况（如果网络慢，应在90秒左右看到错误）
   - 检查控制台日志，确认详细追踪信息

## 监控指标

部署后在控制台观察：

### 成功生成
```
✅ Vertex AI responded in XXXXXms (XX.Xs)
✅ Image generated successfully in XXXXXms (XX.Xs)
```

### 超时错误
```
⏱️ Vertex AI timeout triggered after 90 seconds
💰 Refunded 5 credits to user XXX
```

### 前端错误提示
```
Request timeout after 100s. The AI service is taking too long. Please try again.
```

## 后续优化建议

### 1. 渐进式超时提示
在等待过程中给用户更多反馈：
- 30秒：正常处理中...
- 60秒：处理时间较长，请稍候...
- 90秒：即将超时，准备重试...

### 2. 智能重试机制
```typescript
// 只在特定错误时重试（网络错误、5xx错误）
// 不在超时、认证错误时重试
if (shouldRetry(error) && attempt < MAX_RETRIES) {
  await wait(RETRY_DELAY);
  continue;
}
```

### 3. 请求队列
- 实现请求队列，避免多个请求同时调用
- 显示队列位置："您的请求排在第3位..."

### 4. 预估时间
- 基于历史数据预估生成时间
- 显示进度条："预计还需30秒..."

## 相关文件

- ✅ `vercel.json` - Vercel函数超时配置
- ✅ `api/generate-image.ts` - 后端超时控制和日志
- ✅ `services/geminiService.ts` - 前端超时配置和错误处理

## 状态

✅ **已完成** - 2025年10月12日

修复已完成，等待部署验证。用户现在最多等待100秒就会看到明确的错误提示，不会再无限卡住。

