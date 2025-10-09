# Supabase 设置说明

## 📝 步骤 1: 执行数据库迁移

1. 打开你的 Supabase 项目控制台
2. 进入 **SQL Editor** (左侧菜单)
3. 点击 **New Query**
4. 复制 `migrations/20250109_create_users_auth.sql` 文件的全部内容
5. 粘贴到查询编辑器
6. 点击 **Run** 执行

## 🔐 步骤 2: 配置 Google OAuth（稍后配置）

1. 在 Supabase 控制台，进入 **Authentication** > **Providers**
2. 找到 **Google** 并点击启用
3. 你需要：
   - Google Cloud Console 创建 OAuth 客户端
   - 复制 Client ID 和 Client Secret
   - 填入 Supabase
4. 添加回调 URL：`https://<your-project>.supabase.co/auth/v1/callback`

## 🔑 步骤 3: 获取 Supabase 密钥

1. 在 Supabase 控制台，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

## 🌐 步骤 4: 配置前端环境变量

在项目根目录创建 `.env` 文件（如果还没有）：

```env
# Google Gemini API (已有)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Supabase (新增)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **重要**: 不要提交 `.env` 文件到 Git！

## ✅ 验证

执行完以上步骤后，你应该能看到：
- Supabase 数据库中有一个 `users` 表
- 表中有正确的列和策略
- 环境变量配置完成

如有问题，请参考 [Supabase 官方文档](https://supabase.com/docs)

