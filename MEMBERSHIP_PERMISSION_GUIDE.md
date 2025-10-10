# 会员权限控制系统 - 使用指南

## 概述

本系统实现了友好的会员权限控制，允许用户查看高级功能页面，但在尝试使用时会显示升级提示。

## 核心组件

### 1. UpgradeModal 组件

位置：`components/UpgradeModal.tsx`

**功能**：
- 显示友好的会员升级提示弹窗
- 展示所需会员等级和相关权益
- 引导用户升级会员
- 支持自定义功能名称和所需等级

**使用方式**：
```tsx
import { UpgradeModal } from './components/UpgradeModal';

<UpgradeModal 
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  featureName="Free Canvas"  // 功能名称
  requiredTier="premium"     // 需要的会员等级：premium 或 business
  onUpgrade={handleUpgrade}  // 点击升级按钮的回调
/>
```

**Props**：
- `isOpen`: boolean - 控制弹窗显示/隐藏
- `onClose`: () => void - 关闭弹窗的回调
- `featureName`: string - 功能名称，如 "Free Canvas"
- `requiredTier`: 'premium' | 'business' - 需要的会员等级
- `onUpgrade`: () => void - 点击升级按钮的回调（可选）

### 2. Button 组件更新

位置：`components/Button.tsx`

**新增功能**：
- 支持 `locked` 属性，显示锁定状态
- 锁定时显示锁图标
- 点击锁定按钮触发 `onLockedClick` 回调

**使用方式**：
```tsx
<Button
  primary
  locked={!hasPermission}
  onLockedClick={() => setShowUpgradeModal(true)}
>
  生成图片
</Button>
```

**新增 Props**：
- `locked`: boolean - 是否锁定按钮
- `onLockedClick`: () => void - 锁定状态下点击的回调

## 实现流程

### 在功能页面中集成权限控制

以 `FreeCanvasPage` 为例：

#### 1. 检查用户权限
```tsx
// 检查用户是否有权限使用功能
const hasGeneratePermission = currentUser && 
  (currentUser.membershipTier === 'premium' || 
   currentUser.membershipTier === 'business');
```

#### 2. 添加状态管理
```tsx
const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
```

#### 3. 在按钮中使用 locked 属性
```tsx
<Button 
  onClick={handleGenerate} 
  disabled={isLoading || !prompt}
  primary 
  locked={!hasGeneratePermission}
  onLockedClick={() => setIsPermissionModalOpen(true)}
>
  <IconSparkles className="w-5 h-5" />
  Generate (1 Credit)
</Button>
```

#### 4. 添加 UpgradeModal
```tsx
<UpgradeModal 
  isOpen={isPermissionModalOpen}
  onClose={() => setIsPermissionModalOpen(false)}
  featureName="Free Canvas"
  requiredTier="premium"
  onUpgrade={onUpgrade}
/>
```

#### 5. 在父组件中提供导航回调
```tsx
// 在 App.tsx 中
<FreeCanvasPage 
  // ... 其他 props
  onUpgrade={() => setActivePage('Pricing')}
/>
```

## 用户体验流程

1. **用户进入功能页面** → 允许访问，可以查看界面
2. **用户看到生成按钮** → 显示锁图标（如果权限不足）
3. **用户点击锁定按钮** → 弹出友好的升级提示弹窗
4. **弹窗显示**：
   - 当前会员等级
   - 所需会员等级
   - 会员权益列表
   - 价格信息
5. **用户选择**：
   - 点击"立即升级" → 跳转到定价页面
   - 点击"稍后再说" → 关闭弹窗，继续浏览

## 会员等级配置

### Premium (高级会员)
- 图标：👑
- 价格：$42/月
- 主要权益：
  - 5,000 积分/月
  - 解锁 Free Canvas 功能
  - 优先处理队列
  - 同时生成最多 9 个设计
  - 商业使用授权

### Business (商业会员)
- 图标：💼
- 价格：$142/月
- 主要权益：
  - 25,000 积分/月
  - 所有 Premium 功能
  - 同时生成最多 18 个设计
  - 最快响应速度
  - 优先体验新功能

## 如何为其他功能添加权限控制

### 步骤：

1. **导入所需组件**
```tsx
import { UpgradeModal } from './UpgradeModal';
```

2. **添加状态管理**
```tsx
const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
```

3. **检查用户权限**
```tsx
const hasPermission = currentUser && 
  (currentUser.membershipTier === 'premium' || 
   currentUser.membershipTier === 'business');
```

4. **修改功能按钮**
```tsx
<Button
  primary
  locked={!hasPermission}
  onLockedClick={() => setIsUpgradeModalOpen(true)}
>
  功能按钮
</Button>
```

5. **添加升级弹窗**
```tsx
<UpgradeModal 
  isOpen={isUpgradeModalOpen}
  onClose={() => setIsUpgradeModalOpen(false)}
  featureName="功能名称"
  requiredTier="premium"  // 或 "business"
  onUpgrade={handleNavigateToPricing}
/>
```

## 注意事项

1. **权限检查**：始终在前端和后端都进行权限检查
2. **用户体验**：允许用户浏览功能页面，只在实际使用时提示升级
3. **清晰提示**：弹窗中明确显示当前会员等级和所需等级
4. **引导转化**：提供清晰的升级路径和会员权益说明

## 相关文件

- `components/UpgradeModal.tsx` - 升级提示弹窗组件
- `components/Button.tsx` - 带锁定状态的按钮组件
- `components/FreeCanvasPage.tsx` - 权限控制实现示例
- `App.tsx` - 页面导航配置
- `context/AuthContext.tsx` - 用户认证和会员信息

## 更新日志

- **2025-10-10**：初始实现会员权限控制系统
  - 创建 UpgradeModal 组件
  - 更新 Button 组件支持锁定状态
  - 在 FreeCanvasPage 中集成权限控制

