# 🔐 注册登录功能使用指南

## 📋 功能概览

✅ **已完成的功能**：
- ✅ 邮箱 + 密码注册登录
- ✅ Google OAuth 第三方登录
- ✅ 用户会员等级系统（Free, Pro, Premium, Business）
- ✅ 信用点系统和显示
- ✅ 用户状态全局管理
- ✅ 顶部导航栏用户信息展示
- ✅ 安全的行级策略（RLS）

---

## 🚀 快速开始

### 步骤 1: 配置 Supabase 数据库

1. **打开 Supabase 控制台** 
   访问：https://supabase.com/dashboard

2. **执行数据库迁移**
   - 进入 **SQL Editor**
   - 打开文件 `supabase/migrations/20250109_create_users_auth.sql`
   - 复制全部内容并粘贴到 SQL 编辑器
   - 点击 **Run** 执行

3. **配置 Google OAuth**（推荐）
   
   > 📘 **完整配置指南**: 请查看 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
   
   **快速配置步骤**：
   - 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 2.0 客户端
   - 配置授权重定向URI：`https://<your-project>.supabase.co/auth/v1/callback`
   - 复制 Client ID 和 Client Secret
   - 在 Supabase Dashboard > **Authentication** > **Providers** 启用 **Google**
   - 填入 Client ID 和 Client Secret
   - 按照 [测试清单](./GOOGLE_LOGIN_TEST_CHECKLIST.md) 验证功能

### 步骤 2: 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# Google Gemini API（已有）
VITE_GEMINI_API_KEY=your-gemini-api-key

# Supabase 配置（新增）
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取 Supabase 密钥**：
1. 进入 Supabase 控制台 > **Settings** > **API**
2. 复制 **Project URL** 和 **anon public** 密钥

### 步骤 3: 安装依赖并运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 💡 使用说明

### 注册新用户

1. 点击右上角的 **用户图标**
2. 在弹出的模态框中填写：
   - 姓名（可选）
   - 邮箱
   - 密码（至少6个字符）
3. 点击 **注册** 按钮
4. 新用户默认为 **Free** 会员，拥有 **10 个信用点**

### 登录

1. 点击右上角的 **用户图标**
2. 输入邮箱和密码
3. 点击 **登录**
4. 或使用 **Google 账号登录**

### 查看会员信息

登录后，在顶部导航栏可以看到：
- **会员等级徽章**：显示当前等级（FREE/PRO/PREMIUM/BUSINESS）
- **信用点数量**：剩余可用的生成次数
- **用户头像**：点击可查看菜单

---

## 🎨 会员等级说明

| 等级 | 徽章 | 每月信用点 | 特权 |
|------|------|------------|------|
| **Free** | 🆓 FREE | 10 | 基础功能 |
| **Pro** | ⭐ PRO | 100 | 高级功能 |
| **Premium** | 👑 PREMIUM | 500 | 优先队列 |
| **Business** | 💼 BUSINESS | 无限 | 专属支持 |

---

## 📂 项目结构

```
mynook/
├── config/
│   └── supabase.ts              # Supabase 客户端配置
├── context/
│   └── AuthContext.tsx          # 用户认证上下文
├── services/
│   └── authService.ts           # 认证服务函数
├── components/
│   └── LoginModal.tsx           # 登录注册 UI 组件
├── types/
│   └── database.ts              # 数据库类型定义
├── supabase/
│   ├── migrations/              # 数据库迁移脚本
│   │   └── 20250109_create_users_auth.sql
│   └── SETUP_INSTRUCTIONS.md    # 详细设置说明
└── AUTHENTICATION_GUIDE.md      # 本文档
```

---

## 🔧 核心代码说明

### 1. 用户上下文 (`context/AuthContext.tsx`)

提供全局的认证状态和方法：

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const {
    user,              // 当前用户
    profile,           // 用户详细资料
    isAuthenticated,   // 是否已登录
    credits,           // 剩余信用点
    membershipTier,    // 会员等级
    signIn,            // 登录
    signUp,            // 注册
    signOut,           // 登出
    deductCredits,     // 扣除信用点
  } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>欢迎，{user.email}！您有 {credits} 个信用点</p>
      ) : (
        <button onClick={() => signIn({email, password})}>登录</button>
      )}
    </div>
  );
}
```

### 2. 数据库表结构

**users 表**：
```sql
id                UUID        # 用户ID
email             TEXT        # 邮箱
full_name         TEXT        # 姓名
avatar_url        TEXT        # 头像URL
membership_tier   TEXT        # 会员等级
credits           INTEGER     # 信用点
total_generations INTEGER     # 总生成次数
created_at        TIMESTAMP   # 创建时间
updated_at        TIMESTAMP   # 更新时间
```

### 3. 扣除信用点

在生成图片时自动扣除信用点：

```tsx
const handleGenerate = async () => {
  const { success, remainingCredits } = await auth.deductCredits(1);
  
  if (!success) {
    alert('信用点不足，请升级会员！');
    return;
  }
  
  // 继续生成图片...
};
```

---

## 🛡️ 安全特性

### 行级安全策略 (RLS)

- ✅ 用户只能查看和修改自己的数据
- ✅ 密码通过 Supabase Auth 安全存储
- ✅ 自动防止 SQL 注入攻击
- ✅ Token 自动刷新机制

### 最佳实践

1. **不存储明文密码**：所有密码由 Supabase Auth 管理
2. **环境变量**：敏感信息存储在 `.env` 文件
3. **HTTPS**：生产环境强制使用 HTTPS
4. **Token 存储**：使用 localStorage 持久化会话

---

## 🐛 常见问题

### Q1: 提示 "Missing Supabase environment variables"

**解决方案**：检查 `.env` 文件是否正确配置了 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### Q2: Google 登录失败

**解决方案**：
1. 确认已在 Supabase 启用 Google 提供商
2. 检查 Google OAuth 配置是否正确
3. 确认回调 URL 已添加到 Google Cloud Console

### Q3: 注册后收不到验证邮件

**解决方案**：
1. 检查 Supabase Email 配置
2. 开发环境可以关闭邮箱验证：
   - Supabase 控制台 > Authentication > Settings
   - 禁用 "Enable email confirmations"

### Q4: 信用点没有正确扣除

**解决方案**：
1. 检查 RLS 策略是否正确设置
2. 确认用户已登录
3. 查看浏览器控制台的错误信息

---

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Google OAuth 设置](https://developers.google.com/identity/protocols/oauth2)

---

## ✅ 下一步

- [ ] 测试注册登录功能
- [ ] 配置 Google OAuth - **参考**: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- [ ] 运行Google登录测试 - **参考**: [GOOGLE_LOGIN_TEST_CHECKLIST.md](./GOOGLE_LOGIN_TEST_CHECKLIST.md)
- [ ] 实现信用点扣除逻辑
- [ ] 添加会员升级功能
- [ ] 实现密码重置功能

## 📖 相关文档

- **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Google账号登录完整配置指南
- **[GOOGLE_LOGIN_TEST_CHECKLIST.md](./GOOGLE_LOGIN_TEST_CHECKLIST.md)** - Google登录测试清单
- **[DEBUG_GUIDE.md](./DEBUG_GUIDE.md)** - 问题排查指南

---

**开发完成时间**: 2025-01-09  
**开发者**: AI Assistant  
**技术栈**: React + TypeScript + Supabase + Vercel

