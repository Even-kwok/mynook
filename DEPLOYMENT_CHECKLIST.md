# 🚀 部署清单 - 信用点系统集成

## ✅ 已完成的工作

### 1. **后端服务** ✨
- [x] 创建信用点管理服务 (`api/lib/creditsService.ts`)
  - 用户认证验证
  - 信用点余额查询
  - 信用点扣除和回滚
  - 生成日志记录
  
- [x] 更新图片生成 API (`api/generate-image.ts`)
  - 集成用户认证
  - 生成前检查信用点
  - 成功后扣除 5 点
  - 失败自动回滚
  
- [x] 更新文本生成 API (`api/generate-text.ts`)
  - 集成用户认证
  - 生成前检查信用点
  - 成功后扣除 1 点
  - 失败自动回滚

### 2. **前端服务** 🎨
- [x] 更新 Gemini 服务 (`services/geminiService.ts`)
  - 所有 API 调用添加 Authorization header
  - 自动获取用户 session token
  - 未登录用户友好提示

### 3. **文档** 📚
- [x] 创建集成指南 (`CREDITS_INTEGRATION_GUIDE.md`)
- [x] 创建部署清单 (`DEPLOYMENT_CHECKLIST.md`)

## 🔧 部署前必做事项

### 1. **Vercel 环境变量配置** ⚙️

登录 [Vercel Dashboard](https://vercel.com) 并配置以下环境变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | ⚠️ Supabase 服务端密钥 | Supabase Dashboard → Settings → API → service_role |
| `GEMINI_API_KEY` | Gemini API 密钥 | https://aistudio.google.com/app/apikey |

**配置步骤：**
1. 打开 Vercel 项目
2. 进入 **Settings** → **Environment Variables**
3. 逐个添加上述变量
4. 环境选择：`Production` + `Preview` + `Development`（全选）
5. 点击 **Save**

### 2. **Supabase 数据库验证** 🗄️

确认数据库表结构正确：

```sql
-- 验证 users 表
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users';

-- 验证 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'users';
```

**检查项：**
- [x] `users` 表存在
- [x] 包含 `credits` 和 `total_generations` 字段
- [x] RLS 策略已启用
- [x] 触发器正常工作

### 3. **本地测试** 🧪

在部署前进行本地测试：

```bash
# 1. 安装依赖
npm install

# 2. 设置本地环境变量（创建 .env 文件）
# 复制所需的环境变量

# 3. 启动开发服务器
npm run dev

# 4. 测试场景
# - 未登录用户访问生成功能 → 应提示登录
# - 登录用户生成文本 → 扣除 1 点
# - 登录用户生成图片 → 扣除 5 点
# - 信用点不足 → 显示错误提示
# - 生成失败 → 信用点自动回滚
```

## 📦 部署步骤

### 方式 1: 使用 Git 推送（推荐）

```bash
# 1. 查看改动
git status

# 2. 添加所有文件
git add .

# 3. 提交改动
git commit -m "feat: integrate credits system with generation APIs

- Add creditsService for backend credit management
- Update generate-image API with credit checks
- Update generate-text API with credit checks
- Add auto-refund on generation failure
- Update geminiService to send auth tokens
- Add comprehensive documentation"

# 4. 推送到主分支
git push origin master

# Vercel 将自动检测并部署
```

### 方式 2: 手动部署

```bash
# 使用 Vercel CLI
npm install -g vercel
vercel --prod
```

## ✅ 部署后验证

### 1. **功能测试**

- [ ] 访问部署的网站
- [ ] 注册/登录账户
- [ ] 检查初始信用点（应为 10）
- [ ] 测试文本生成
  - 验证功能正常
  - 验证信用点减少 1
- [ ] 测试图片生成
  - 验证功能正常
  - 验证信用点减少 5
- [ ] 测试信用点不足场景
- [ ] 检查 Business 会员无限使用

### 2. **日志检查**

查看 Vercel 部署日志：
1. 进入 Vercel Dashboard
2. 选择项目 → **Deployments**
3. 点击最新部署 → **Function Logs**
4. 查找信用点相关日志：
   - "✅ Credits deducted for user..."
   - 错误信息（如有）

### 3. **数据库验证**

在 Supabase Dashboard 检查：
```sql
-- 查看用户信用点变化
SELECT id, email, credits, total_generations, updated_at
FROM users
ORDER BY updated_at DESC
LIMIT 10;
```

## 🐛 常见问题排查

### 问题 1: "Authentication required" 错误
**原因**: 
- 用户未登录
- Token 过期
- Authorization header 未正确传递

**解决方案**:
```typescript
// 确保前端调用时获取了 token
const token = await getAuthToken();
if (!token) {
  // 提示用户登录
}
```

### 问题 2: "Unauthorized" 500 错误
**原因**: 
- `SUPABASE_SERVICE_KEY` 未配置或错误

**解决方案**:
1. 检查 Vercel 环境变量
2. 确认 service_role key 正确
3. 重新部署

### 问题 3: 信用点未正确扣除
**原因**:
- 数据库 RLS 策略问题
- Service key 权限不足

**解决方案**:
```sql
-- 验证 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 临时手动更新（测试用）
UPDATE users 
SET credits = credits - 1 
WHERE id = 'user_id';
```

### 问题 4: 生成失败但信用点已扣除
**原因**:
- 回滚逻辑未执行
- 异常处理不当

**解决方案**:
1. 检查服务器日志
2. 手动回滚信用点
3. 报告 bug 以修复回滚逻辑

## 📊 监控建议

### 1. **Vercel Analytics**
- 监控 API 调用频率
- 跟踪错误率
- 分析响应时间

### 2. **Supabase Logs**
- 监控数据库查询
- 检查认证失败
- 追踪 RLS 策略触发

### 3. **自定义指标**
建议添加：
- 每日信用点消耗统计
- 用户生成频率
- 失败率和回滚率
- 不同会员等级使用情况

## 🎯 下一步优化

### 短期（1-2周）
- [ ] 添加信用点充值功能
- [ ] 创建使用历史页面
- [ ] 添加信用点不足通知

### 中期（1-2月）
- [ ] 会员升级系统
- [ ] 生成队列管理
- [ ] 高级分析仪表板

### 长期（3+月）
- [ ] API 速率限制
- [ ] 缓存优化
- [ ] 多语言支持

## 📞 支持

遇到问题？
1. 查看 `CREDITS_INTEGRATION_GUIDE.md` 详细文档
2. 检查 Vercel 和 Supabase 日志
3. 参考本清单的故障排查部分

---

**部署日期**: 2025-01-10
**版本**: 1.0.0
**状态**: ✅ 准备部署

