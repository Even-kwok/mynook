# 🚀 订阅系统部署和测试指南

## ✅ 已完成的开发工作

### 1. 数据库层
- ✅ 创建了 `subscriptions` 表用于记录订阅信息
- ✅ 扩展了 `users` 表添加订阅相关字段
- ✅ 配置了 RLS 安全策略

### 2. 服务层
- ✅ CREEM 支付服务 (`services/creemService.ts`)
- ✅ 订阅管理服务 (`services/subscriptionService.ts`)

### 3. API 端点
- ✅ `/api/create-checkout-session` - 创建支付会话
- ✅ `/api/subscription-webhook` - 处理 CREEM webhook
- ✅ `/api/get-subscription-status` - 获取订阅状态

### 4. 前端组件
- ✅ 更新了 `PricingPage` 组件集成支付流程
- ✅ 创建了 `SubscriptionManager` 组件管理订阅
- ✅ 更新了 `AuthContext` 添加登录模态框控制

---

## 📋 部署前的准备工作

### 步骤 1: 执行数据库迁移

在 Supabase Dashboard 中执行迁移：

1. 进入你的 Supabase 项目
2. 点击 **SQL Editor**
3. 执行 `supabase/migrations/20251010_create_subscriptions_table.sql` 文件的内容

### 步骤 2: 验证 Vercel 环境变量

确保以下环境变量已在 Vercel 配置（你已经完成 ✅）：

```bash
# CREEM 配置
CREEM_API_KEY=your_creem_api_key
CREEM_WEBHOOK_SECRET=your_webhook_secret

# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Gemini AI
GEMINI_API_KEY=your_gemini_key
```

### 步骤 3: 配置 CREEM Webhook

⚠️ **重要：这步必须在部署后完成**

1. 部署代码到 Vercel
2. 获取你的 Vercel 部署 URL（例如：`https://mynook.vercel.app`）
3. 前往 CREEM Dashboard
4. 找到 **Webhooks** 设置
5. 添加 Webhook 端点：
   ```
   https://your-domain.vercel.app/api/subscription-webhook
   ```
6. 选择要监听的事件：
   - `checkout.session.completed`
   - `subscription.created`
   - `subscription.activated`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.expired`
   - `payment.succeeded`
   - `payment.failed`

---

## 🚀 部署流程

### 方法 1: 自动部署（推荐）

```bash
# 1. 提交所有更改
git add .
git commit -m "feat: Add CREEM subscription integration"

# 2. 推送到 GitHub
git push origin feature/subscription

# 3. Vercel 会自动检测并部署
```

### 方法 2: 手动部署

在 Vercel Dashboard:
1. 进入你的项目
2. 点击 **Deployments**
3. 点击 **Deploy** 按钮

---

## 🧪 测试流程

### 测试 1: 数据库迁移验证

在 Supabase SQL Editor 中运行：

```sql
-- 检查 subscriptions 表是否创建成功
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions';

-- 检查 users 表是否添加了新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('creem_customer_id', 'subscription_status', 'subscription_end_date', 'current_subscription_id');
```

### 测试 2: 前端订阅流程

1. **访问 Pricing 页面**
   - URL: `https://your-domain.vercel.app/?page=pricing`
   - 检查三个订阅计划是否显示正确

2. **测试未登录用户**
   - 点击任何 "Subscribe" 按钮
   - 应该弹出登录模态框

3. **测试已登录用户**
   - 登录账户
   - 点击 "Subscribe" 按钮
   - 应该看到 "Processing..." 加载状态
   - 然后跳转到 CREEM 支付页面

4. **完成支付**
   - 在 CREEM 支付页面输入测试信用卡信息
   - 完成支付流程
   - 应该重定向回你的网站

5. **验证订阅激活**
   - 检查用户的会员等级是否更新
   - 检查信用点是否充值
   - 访问订阅管理页面查看订阅详情

### 测试 3: API 端点测试

使用 Postman 或 cURL 测试：

#### 测试创建 Checkout Session

```bash
curl -X POST https://your-domain.vercel.app/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "planType": "premium",
    "billingCycle": "yearly"
  }'
```

预期响应：
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.creem.io/...",
  "sessionId": "cs_..."
}
```

#### 测试获取订阅状态

```bash
curl https://your-domain.vercel.app/api/get-subscription-status \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

预期响应：
```json
{
  "success": true,
  "subscription": {
    "id": "...",
    "plan_type": "premium",
    "status": "active",
    ...
  },
  "user": {
    "membershipTier": "premium",
    "credits": 5000,
    ...
  }
}
```

### 测试 4: Webhook 测试

1. **使用 CREEM 测试 Webhook**
   - 在 CREEM Dashboard 找到 Webhook 测试功能
   - 发送测试事件到你的端点

2. **检查日志**
   - 在 Vercel Dashboard 查看 Function Logs
   - 搜索 "Received webhook event"
   - 确认 webhook 被正确接收和处理

3. **验证数据库更新**
   - 在 Supabase 检查 `subscriptions` 表
   - 确认订阅状态正确更新

---

## ⚠️ 重要注意事项

### CREEM API URL 配置

**需要你更新的文件：** `services/creemService.ts`

当前代码中使用了占位符 API URL：
```typescript
const CREEM_API_BASE_URL = 'https://api.creem.io/v1'; // 请更新为实际的 CREEM API URL
```

**你需要：**
1. 查看 CREEM 官方文档获取正确的 API Base URL
2. 更新 `services/creemService.ts` 中的 `CREEM_API_BASE_URL` 常量
3. 重新部署

### Webhook 签名验证

当前代码使用了 HMAC SHA256 进行签名验证。如果 CREEM 使用不同的签名方法，需要更新 `verifyWebhookSignature` 函数。

---

## 🐛 常见问题排查

### 问题 1: 支付按钮点击后没反应

**可能原因：**
- 用户未登录
- API 端点返回错误
- CREEM API 配置错误

**排查步骤：**
1. 打开浏览器控制台查看错误信息
2. 检查 Vercel Function Logs
3. 确认环境变量配置正确

### 问题 2: Webhook 未触发

**可能原因：**
- Webhook URL 配置错误
- Webhook 签名验证失败
- CREEM 端配置问题

**排查步骤：**
1. 检查 CREEM Dashboard 中的 Webhook 配置
2. 查看 Webhook 发送历史和响应
3. 检查 Vercel Function Logs

### 问题 3: 订阅状态未更新

**可能原因：**
- Webhook 处理失败
- 数据库更新失败
- RLS 策略阻止更新

**排查步骤：**
1. 检查 `subscriptions` 表是否有记录
2. 检查 `users` 表的 `membership_tier` 和 `credits` 字段
3. 查看 Vercel Function Logs 中的错误信息

---

## 📊 监控和维护

### 建议监控指标

1. **支付成功率**
   - 监控 checkout session 创建成功率
   - 跟踪支付完成率

2. **Webhook 可靠性**
   - 监控 webhook 接收率
   - 跟踪处理失败的 webhook

3. **订阅活跃度**
   - 跟踪活跃订阅数量
   - 监控取消率和流失率

### 日常维护任务

1. **每周检查**
   - 查看 Vercel Function Logs 中的错误
   - 检查失败的支付和 webhook

2. **每月检查**
   - 审核订阅数据一致性
   - 验证信用点发放正确

3. **定期更新**
   - 关注 CREEM API 更新
   - 更新依赖包版本

---

## 📝 下一步开发建议

### 短期改进

1. **取消订阅功能**
   - 实现 `SubscriptionManager` 中的取消按钮功能
   - 调用 CREEM API 取消订阅

2. **订阅升级/降级**
   - 允许用户更改订阅计划
   - 处理按比例退款

3. **发票管理**
   - 显示历史发票
   - 提供下载功能

### 长期优化

1. **订阅分析**
   - 添加订阅统计图表
   - 收入预测

2. **优惠券系统**
   - 集成促销码
   - 首月折扣

3. **企业功能**
   - 团队订阅
   - 批量购买

---

## 🎉 部署检查清单

部署前确保：

- [ ] 数据库迁移已执行
- [ ] Vercel 环境变量已配置
- [ ] CREEM API Base URL 已更新
- [ ] 代码已推送到 GitHub
- [ ] Vercel 自动部署成功

部署后确保：

- [ ] CREEM Webhook 已配置
- [ ] Pricing 页面显示正常
- [ ] 登录/注册流程正常
- [ ] 可以创建 checkout session
- [ ] Webhook 能正常接收
- [ ] 订阅状态正确更新

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 Vercel Function Logs
2. 检查 Supabase Logs
3. 查看 CREEM Dashboard 的 Webhook 日志
4. 参考 CREEM 官方文档

Happy deploying! 🚀

