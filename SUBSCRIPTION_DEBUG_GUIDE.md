# 订阅功能诊断指南

## 📋 实施完成的内容

根据**方案A**，我们已经完成了以下简化和诊断工作：

### ✅ 已创建/修改的文件

1. **`api/test-connection.ts`** - 诊断测试端点
   - 测试 API 响应
   - 验证环境变量
   - 测试 Supabase 连接
   - 验证用户认证

2. **`api/create-checkout-session.ts`** - 简化版订阅 API
   - 移除了 CREEM 集成（临时）
   - 移除了 subscriptionService 依赖
   - 添加了详细的步骤日志
   - 返回模拟响应用于测试

---

## 🧪 测试步骤

### 测试 1：诊断 API - 验证基础设施

这个测试会检查所有必需的环境变量和数据库连接是否正常。

#### 在 Vercel 部署后测试

1. **打开浏览器，访问你的应用**
2. **打开浏览器开发者工具 (F12)**
3. **切换到 Console 标签**
4. **如果已登录，运行以下代码：**

```javascript
// 获取当前用户的 token
const { data: { session } } = await supabase.auth.getSession();

// 调用诊断 API
fetch('/api/test-connection', {
  headers: { 
    'Authorization': `Bearer ${session.access_token}` 
  }
})
.then(r => r.json())
.then(result => {
  console.log('诊断结果:', result);
  console.table(result.checks);
});
```

5. **如果未登录，运行这个简化版本（测试环境变量和 Supabase）：**

```javascript
fetch('/api/test-connection')
.then(r => r.json())
.then(result => {
  console.log('诊断结果:', result);
  console.table(result.checks);
});
```

#### ✅ 预期结果

所有检查项应该显示 ✅：

```json
{
  "status": "ok",
  "checks": {
    "api": "✅ API responding",
    "env": "✅ All env vars present",
    "supabase": "✅ Supabase connected",
    "auth": "✅ User authenticated"
  },
  "user": {
    "id": "...",
    "email": "...",
    "membership_tier": "...",
    "subscription_status": "..."
  }
}
```

#### ❌ 如果出现问题

- **`❌ Missing: VARIABLE_NAME`** → 在 Vercel 环境变量中添加缺失的变量
- **`❌ Supabase connection failed`** → 检查 `VITE_SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正确
- **`❌ Invalid token`** → 尝试重新登录

---

### 测试 2：简化订阅 API - 验证业务逻辑

这个测试会验证订阅检查逻辑是否正常工作，但**不会真正调用 CREEM 支付**。

#### 测试场景 A：Free 用户订阅

1. 确保你用 **Free 账户**登录
2. 访问 Pricing 页面
3. 点击任意计划的 "Subscribe" 按钮
4. 观察结果：

**预期行为：**
- ✅ 页面会重定向回 `/pricing?message=subscription-pending&plan=...&cycle=...`
- ✅ 没有 500 错误
- ✅ Vercel 日志显示详细的步骤日志

#### 测试场景 B：Business 用户订阅同等级

1. 确保你用 **Business 账户**登录
2. 访问 Pricing 页面
3. 点击 "Business Plan" 的 "Subscribe" 按钮
4. 观察结果：

**预期行为：**
- ✅ 显示错误消息："You already have an active business subscription"
- ✅ 没有崩溃
- ✅ 错误消息显示在页面上

#### 测试场景 C：未登录用户

1. 确保已登出
2. 访问 Pricing 页面
3. 点击任意 "Subscribe" 按钮
4. 观察结果：

**预期行为：**
- ✅ 登录模态框出现
- ✅ 没有错误

---

## 📊 查看 Vercel 日志

### 如何查看日志

1. 访问 [Vercel Dashboard](https://vercel.com/)
2. 选择你的项目
3. 点击 "Functions" 或 "Logs" 标签
4. 找到 `/api/create-checkout-session` 的执行记录

### ✅ 正常日志应该显示

```
========== Step 1: Validating request ==========
✅ Method is POST
========== Step 2: Authenticating user ==========
✅ Authorization header present
========== Step 3: Initializing Supabase ==========
✅ Supabase credentials found
✅ Supabase client created
========== Step 4: Verifying user token ==========
✅ User authenticated: 550e8400-e29b-41d4-a716-446655440000
========== Step 5: Validating input ==========
Request body: { planType: 'pro', billingCycle: 'monthly' }
✅ Input validated
========== Step 6: Checking existing subscription ==========
✅ User data retrieved: { ... }
✅ User has no active subscription, can proceed
========== Step 7: Returning mock response ==========
⚠️ CREEM integration pending - returning mock checkout URL
✅ Mock response prepared: { ... }
```

### ❌ 如果崩溃了

日志会显示具体在哪一步出错：

```
========== Step 3: Initializing Supabase ==========
❌ Missing Supabase credentials
```

或

```
========== UNEXPECTED ERROR ==========
Error type: TypeError
Error message: Cannot read property 'getUser' of undefined
```

---

## 🎯 成功标准

完成测试后，以下条件应该全部满足：

- [ ] 诊断 API 返回所有 ✅
- [ ] Free 用户点击订阅 → 重定向回 pricing 页面（带 message 参数）
- [ ] Business 用户点击相同计划 → 显示"已有订阅"错误
- [ ] 未登录用户点击订阅 → 显示登录模态框
- [ ] **没有 500 错误**
- [ ] Vercel 日志显示完整的步骤日志，没有崩溃

---

## 🔄 下一步计划

### 当所有测试通过后

**阶段 2A：分析结果**
- 检查 Vercel 日志中的所有步骤
- 确认每个步骤都正常执行
- 记录任何警告或异常

**阶段 2B：集成 CREEM API**
- 恢复 `createCheckoutSession` 调用
- 测试 CREEM 连接
- 实现真实的支付流程

**阶段 3：完整功能**
- 添加订阅记录创建
- 实现 Webhook 处理
- 测试完整的支付流程

---

## 🚨 如果测试失败

### 问题：诊断 API 显示环境变量缺失

**解决方案：**
1. 访问 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 添加缺失的变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `CREEM_API_KEY`
   - `CREEM_WEBHOOK_SECRET`
3. 重新部署项目

### 问题：Supabase 连接失败

**解决方案：**
1. 检查 `SUPABASE_SERVICE_KEY` 是否是 **service_role key**（不是 anon key）
2. 检查 `VITE_SUPABASE_URL` 格式是否正确（`https://xxx.supabase.co`）
3. 确认 Supabase 项目正在运行

### 问题：仍然出现 500 错误

**解决方案：**
1. 检查 Vercel 日志，找到具体崩溃的步骤
2. 截图日志信息
3. 告诉我具体是哪一步出错了
4. 我们会进一步诊断和修复

---

## 💡 提示

- **测试顺序很重要**：先运行诊断 API，确保基础设施正常，再测试订阅流程
- **查看日志是关键**：Vercel 日志会告诉我们具体在哪里出问题
- **模拟响应是临时的**：当前不会真正创建支付，这是为了先确保基础功能正常
- **一步一步来**：不要急于集成 CREEM，先确保简化版本工作正常

---

## 📞 需要帮助？

测试时遇到问题，请提供：
1. 诊断 API 的完整输出
2. Vercel 日志的截图或文本
3. 你执行的具体操作步骤
4. 看到的错误消息

这样我可以快速定位问题并提供解决方案！

