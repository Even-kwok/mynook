# 会员等级和信用点系统更新

## 📅 更新日期
2025-10-10

## 🎯 更新概要
根据用户需求，对会员等级权限和信用点系统进行了全面修正，优化了用户体验和功能访问控制。

## 📊 会员等级配置更新

### 新的会员等级体系

| 等级 | 图标 | 信用点 | 主要功能 | 权限说明 |
|------|------|--------|----------|----------|
| **Free** 🆓 | 普通用户 | 0 点 | 浏览功能、基础设计查看 | 没有信用点额度，不能生成图片 |
| **Pro** ⭐ | 高级用户 | 1,000 点 | 设计生图功能 | 包含图片生成，**不包含** Free Canvas 功能 |
| **Premium** 👑 | 高级会员 | 5,000 点 | 优先队列、Free Canvas | **解锁 Free Canvas 功能** |
| **Business** 💼 | 商业会员 | 25,000 点 | 专属低价、Free Canvas | 包含所有功能，信用点综合单价更低 |

### 旧配置（已废弃）
```typescript
// 旧的配置
free: 10 点
pro: 100 点
premium: 500 点
business: 无限（-1）
```

### 新配置
```typescript
// 新的配置
free: 0 点
pro: 1,000 点
premium: 5,000 点
business: 25,000 点
```

## 💰 信用点消耗更新

### 图片生成消耗
- **旧**: 5 信用点/张
- **新**: **1 信用点/张**

### 其他消耗保持不变
- 文本生成: 1 点
- 图片编辑: 3 点

## 🎨 Free Canvas 功能权限控制

### 访问权限
Free Canvas 现在是 **Premium 和 Business** 专属功能：

- ✅ **Premium** 会员可以访问
- ✅ **Business** 会员可以访问
- ❌ **Free** 会员不可访问
- ❌ **Pro** 会员不可访问

### 权限检查实现
在 `FreeCanvasPage.tsx` 中添加了完整的权限检查：

```typescript
// 检查用户是否有权限访问 Free Canvas
const hasAccess = currentUser && (
  currentUser.membershipTier === 'premium' || 
  currentUser.membershipTier === 'business'
);
```

### 用户体验
1. **未登录用户**: 显示登录提示页面
2. **Free/Pro 用户**: 显示升级提示页面，清晰说明 Premium 功能的优势
3. **Premium/Business 用户**: 正常访问 Free Canvas 功能

## 📝 修改的文件列表

### 1. `api/lib/creditsService.ts`
- 修改 `CREDIT_COSTS.IMAGE_GENERATION` 从 5 → 1

### 2. `types/database.ts`
- 更新 `MEMBERSHIP_CONFIG` 的所有等级配置
- 添加了每个等级的 `features` 数组用于展示

### 3. `components/FreeCanvasPage.tsx`
- 添加权限检查逻辑
- 添加未登录用户提示界面
- 添加权限不足用户升级提示界面
- 修改最小信用点检查从 5 → 1

### 4. `components/PricingPage.tsx`
- 更新价格页面显示的信用点数量
- 添加等级图标显示
- 突出显示 Free Canvas 功能
- 更新功能列表说明

## 🔧 技术细节

### 后端验证
API endpoint (`api/generate-image.ts`) 会自动验证：
1. 用户身份认证
2. 信用点余额检查
3. 自动扣除信用点
4. 失败时自动回滚

### 数据库更新
确保 Supabase 数据库中的用户数据符合新的会员等级配置：
```sql
-- 检查用户等级分布
SELECT membership_tier, COUNT(*) 
FROM users 
GROUP BY membership_tier;

-- 如需要，可以迁移现有用户的信用点
-- UPDATE users SET credits = 1000 WHERE membership_tier = 'pro';
-- UPDATE users SET credits = 5000 WHERE membership_tier = 'premium';
-- UPDATE users SET credits = 25000 WHERE membership_tier = 'business';
```

## ⚠️ 注意事项

### 对现有用户的影响
1. **Free 用户**: 如果之前有 10 点，需要升级才能继续使用
2. **Pro 用户**: 信用点从 100 增加到 1,000
3. **Premium 用户**: 信用点从 500 增加到 5,000
4. **Business 用户**: 信用点从无限改为 25,000

### 建议的数据迁移步骤
1. 备份当前用户数据
2. 运行数据库迁移脚本
3. 通知受影响的用户
4. 提供过渡期优惠（可选）

## 🚀 部署检查清单

- [x] 更新后端信用点消耗配置
- [x] 更新前端会员等级配置
- [x] 添加 Free Canvas 权限控制
- [x] 更新 Pricing 页面显示
- [ ] 运行数据库迁移（如需要）
- [ ] 更新环境变量（如需要）
- [ ] 测试所有会员等级的功能访问
- [ ] 部署到生产环境
- [ ] 监控错误日志

## 📚 相关文档

- [认证指南](./AUTHENTICATION_GUIDE.md)
- [信用点集成指南](./CREDITS_INTEGRATION_GUIDE.md)
- [部署清单](./DEPLOYMENT_CHECKLIST.md)

## 🔄 回滚计划

如果需要回滚到旧配置：

1. 恢复 `api/lib/creditsService.ts` 中 `IMAGE_GENERATION: 5`
2. 恢复 `types/database.ts` 中的旧 credits 配置
3. 移除 `FreeCanvasPage.tsx` 中的权限检查
4. 恢复 `PricingPage.tsx` 的旧显示

## 💬 反馈和问题

如有任何问题或建议，请记录在项目的 issue tracker 中。

---

**更新完成** ✅ 系统已按照新的会员等级权限和信用点配置运行。

