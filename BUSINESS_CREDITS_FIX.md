# Business会员信用点系统修复说明

## 问题描述

用户报告：Business权限显示错误，business会员应该按照信用点计算，但系统没有正确连接business用户的信用点数据库。

## 根本原因

系统中有旧的逻辑，将Business会员视为"无限信用点"用户，但根据新的会员系统设计，Business会员应该：
- 拥有25,000信用点（默认配置）
- 需要正常扣除和显示信用点
- 按照信用点消耗规则使用功能

## 已修复的问题

### 1. ✅ 前端显示逻辑 (App.tsx)

**修改位置**：`App.tsx` 第573行

**旧代码**：
```typescript
<span>{user.permissionLevel === 4 ? '∞' : user.credits}</span>
```

**新代码**：
```typescript
<span>{user.credits.toLocaleString()}</span>
```

**说明**：
- 移除了Business会员显示"∞"（无限符号）的特殊逻辑
- 所有会员等级现在都显示实际的信用点数
- 使用`toLocaleString()`格式化数字，改善大数字显示（如25,000）

### 2. ✅ 后端信用点检查逻辑 (api/lib/creditsService.ts)

**修改位置**：`checkCreditsAvailable`函数（第91-104行）

**旧代码**：
```typescript
// Business 会员无限制
if (membershipTier === 'business') {
  return { available: true, currentCredits: credits, membershipTier, error: null };
}

// 其他会员检查余额
const available = credits >= requiredCredits;
return { available, currentCredits: credits, membershipTier, error: null };
```

**新代码**：
```typescript
// 所有会员都需要检查信用点余额
const available = credits >= requiredCredits;
return { available, currentCredits: credits, membershipTier, error: null };
```

**说明**：
- 移除了Business会员的特殊检查逻辑
- 所有会员等级统一按照信用点余额检查

### 3. ✅ 后端信用点扣除逻辑 (api/lib/creditsService.ts)

**修改位置**：`deductCredits`函数（第128-129行）

**旧代码**：
```typescript
// Business 会员不扣除信用点
const newCredits = userData.membership_tier === 'business' 
  ? userData.credits
  : userData.credits - amount;
```

**新代码**：
```typescript
// 所有会员都需要扣除信用点
const newCredits = userData.credits - amount;
```

**说明**：
- Business会员现在正常扣除信用点
- 与其他会员等级使用相同的扣除逻辑

### 4. ✅ 后端信用点回滚逻辑 (api/lib/creditsService.ts)

**修改位置**：`refundCredits`函数（第174行）

**旧代码**：
```typescript
// Business 会员不需要回滚
if (userData.membership_tier === 'business') {
  return { success: true, error: null };
}

const { error: updateError } = await supabaseAdmin
```

**新代码**：
```typescript
// 所有会员都需要回滚信用点
const { error: updateError } = await supabaseAdmin
```

**说明**：
- Business会员在操作失败时也会正常回滚信用点
- 确保信用点扣除的一致性和准确性

## 数据库迁移

### 创建的SQL脚本

文件：`supabase/migrations/fix_business_credits.sql`

**功能**：
1. 查看当前Business用户的信用点情况
2. 更新所有Business用户的信用点为25,000（如果需要）
3. 查看更新后的统计信息
4. 查看所有会员等级的用户分布

### 如何使用

1. **登录Supabase控制台**：
   - 访问 https://supabase.com
   - 选择您的项目

2. **打开SQL编辑器**：
   - 点击左侧菜单的"SQL Editor"
   - 点击"New Query"

3. **执行检查查询**：
   ```sql
   -- 查看当前Business用户的信用点情况
   SELECT 
       id,
       email,
       membership_tier,
       credits,
       total_generations,
       created_at,
       updated_at
   FROM users
   WHERE membership_tier = 'business'
   ORDER BY created_at DESC;
   ```

4. **如果需要更新**，取消注释并执行更新语句：
   ```sql
   UPDATE users 
   SET 
       credits = 25000,
       updated_at = NOW()
   WHERE membership_tier = 'business'
     AND (credits IS NULL OR credits != 25000);
   ```

## 会员等级配置（确认）

根据`types/database.ts`，当前配置正确：

| 等级 | 图标 | 默认信用点 | 每次生成图片数 | 主要权限 |
|------|------|-----------|----------------|----------|
| Free 🆓 | 免费用户 | 0 点 | 0 | 只能浏览 |
| Pro ⭐ | 高级用户 | 1,000 点 | 1 | 设计生图 |
| Premium 👑 | 高级会员 | 5,000 点 | 9 | Free Canvas + 优先队列 |
| Business 💼 | 商业会员 | **25,000 点** | 18 | 所有功能 + 最低单价 |

## 信用点消耗规则

根据`api/lib/creditsService.ts`：
- 文本生成：1 信用点/次
- 图片生成：1 信用点/张
- 图片编辑：3 信用点/次

## 测试建议

### 1. 前端显示测试
- [x] 检查Business用户登录后，顶部是否正确显示信用点数（如"25,000"）
- [x] 确认不再显示"∞"符号

### 2. 功能测试
- [ ] Business用户生成图片后，信用点应该减少1点
- [ ] 当Business用户信用点耗尽时，应该无法继续生成
- [ ] 数字显示格式应该清晰（如25,000而不是25000）

### 3. 数据库测试
- [ ] 在Supabase中检查Business用户的credits字段
- [ ] 确认新注册的Business用户默认获得25,000点
- [ ] 确认生成图片后credits正确扣除

## 文件修改清单

1. ✅ `App.tsx` - 修复信用点显示逻辑
2. ✅ `api/lib/creditsService.ts` - 修复信用点检查、扣除、回滚逻辑
3. ✅ `supabase/migrations/fix_business_credits.sql` - 创建数据库检查和更新脚本
4. ✅ `BUSINESS_CREDITS_FIX.md` - 本说明文档

## 后续步骤

### 必要步骤（用户需要操作）

1. **检查Supabase数据库**：
   - 执行`fix_business_credits.sql`中的查询
   - 检查现有Business用户的信用点
   - 如有需要，执行更新语句

2. **测试应用**：
   - 使用Business账户登录
   - 检查信用点显示是否正确
   - 生成图片测试信用点扣除

3. **部署更新**：
   - 提交代码更改
   - 部署到Vercel（如果正在使用）
   - 在生产环境验证

### 可选步骤

1. **监控日志**：
   - 关注信用点扣除的错误日志
   - 检查是否有异常情况

2. **用户通知**：
   - 如果有现有Business用户，可能需要通知他们信用点系统的变更
   - 解释新的信用点规则

## 技术细节

### 会员等级映射

系统中使用两种方式表示会员等级：

1. **permissionLevel**（旧系统）：
   - 1 = Free
   - 2 = Pro
   - 3 = Premium
   - 4 = Business

2. **membership_tier**（新系统）：
   - 'free'
   - 'pro'
   - 'premium'
   - 'business'

两种方式在代码中都有使用，并通过`getUserMembershipTier()`函数进行转换。

### 数据流

1. **用户登录** → AuthContext获取profile
2. **profile.credits** → 显示在App.tsx顶部
3. **生成图片** → 调用API → creditsService.deductCredits
4. **更新数据库** → 返回新的credit余额
5. **刷新前端** → 更新显示

## 总结

本次修复确保了Business会员的信用点系统与其他会员等级保持一致：
- ✅ 正确显示实际信用点数
- ✅ 正确扣除信用点
- ✅ 正确检查信用点余额
- ✅ 提供数据库检查和更新工具

Business会员仍然保持其优势（25,000点是最高配额），但现在遵循统一的信用点管理规则。

---

**修复日期**：2025-10-10  
**状态**：✅ 已完成并就绪  
**测试状态**：⏳ 待用户验证

