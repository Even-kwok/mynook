# 🔑 Replicate API Token 配置指南 - 2025/10/22

## 🚨 当前问题

**错误信息：**
```
Failed to load resource: the server responded with a status of 500
Upscale error: Error: 图片放大失败
```

**原因：** `REPLICATE_API_TOKEN` 环境变量未配置

---

## ✅ 解决步骤

### 步骤 1：获取 Replicate API Token（5分钟）

#### 1.1 访问 Replicate 网站
- 🔗 访问：[https://replicate.com](https://replicate.com)
- 点击右上角 **Sign In** 或 **Sign Up**

#### 1.2 登录或注册账户
- **选项 A**：使用 GitHub 账户登录（推荐）
- **选项 B**：使用邮箱注册

#### 1.3 获取 API Token
1. 登录后，点击右上角头像
2. 选择 **Dashboard** 或 **Settings**
3. 找到 **API tokens** 或 **Account settings** → **API tokens**
4. 点击 **Create Token** 或显示现有 Token
5. 复制 Token（格式：`r8_xxxxxxxxxxxxxxxxxxxxxx`）

**⚠️ 注意：**
- Token 以 `r8_` 开头
- 只显示一次，请妥善保存
- 不要分享给他人

---

### 步骤 2：在 Vercel 配置环境变量（3分钟）

#### 2.1 访问 Vercel Dashboard
1. 🔗 访问：[https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 找到并点击 **mynook** 项目

#### 2.2 进入环境变量设置
1. 点击顶部 **Settings** 标签
2. 左侧菜单选择 **Environment Variables**

#### 2.3 添加 REPLICATE_API_TOKEN
1. 点击 **Add New** 按钮
2. 填写信息：

| 字段 | 值 |
|------|-----|
| **Key** | `REPLICATE_API_TOKEN` |
| **Value** | 你的 Replicate Token（以 `r8_` 开头） |
| **Environments** | ✅ Production<br>✅ Preview<br>✅ Development |

3. 点击 **Save** 保存

#### 2.4 重新部署（自动）
- Vercel 会自动触发重新部署
- 或者手动点击 **Deployments** → 最新部署 → **Redeploy**

---

### 步骤 3：验证配置（2分钟）

#### 等待部署完成
- 在 Vercel Dashboard 查看部署状态
- 通常需要 2-3 分钟

#### 测试 Image Upscale 功能
1. **清除浏览器缓存**
   - Chrome: `Ctrl + Shift + R`（强制刷新）
   - 或在 DevTools → Network → 勾选 "Disable cache"

2. **测试上传**
   - 访问 Image Upscale 页面
   - 上传一张测试图片
   - 选择放大倍数（2x, 4x, 8x）
   - 点击 "Upscale" 按钮

3. **预期结果**
   - ✅ 图片上传成功
   - ✅ Replicate API 调用成功
   - ✅ 显示放大后的图片
   - ✅ 可以下载结果

---

## 📊 完整环境变量列表

确保 Vercel 中已配置以下所有环境变量：

### 核心配置 ✅
```bash
# Supabase 配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 前端 Supabase 配置
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replicate API（新增）⭐
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 可选配置
```bash
# Google Vertex AI（如果使用）
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# 支付系统（如果使用）
CREEM_API_KEY=creem_live_xxxxxxxx
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

---

## 💰 Replicate 定价说明

### 免费额度
- 新账户通常有一定的免费额度
- 可以进行有限次数的测试

### 付费模式
- **按使用量计费**（Pay-as-you-go）
- Real-ESRGAN 模型价格：约 $0.0023 - $0.01 每次（取决于图片大小和放大倍数）

### 费用示例
| 操作 | 原图大小 | 放大倍数 | 预估费用 |
|------|---------|---------|---------|
| Upscale | 512×512 | 2x | ~$0.003 |
| Upscale | 1024×1024 | 2x | ~$0.005 |
| Upscale | 512×512 | 4x | ~$0.006 |
| Upscale | 1024×1024 | 4x | ~$0.010 |

**💡 建议**：
- 先使用免费额度测试
- 设置预算提醒（Billing Alerts）
- 监控使用量

---

## 🔍 常见问题

### Q1: 找不到 API Token 入口？
**A:** 
1. 确保已登录 Replicate
2. 访问：[https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. 直接访问该链接

### Q2: Token 格式是什么？
**A:** 
- 正确格式：`r8_` + 30-40 位字符
- 示例：`r8_abc123def456ghi789jkl012mno345pqr678`

### Q3: 配置后还是失败？
**A:** 检查以下几点：
1. ✅ Token 是否正确复制（没有多余空格）
2. ✅ 环境变量名是否正确：`REPLICATE_API_TOKEN`
3. ✅ 是否选择了所有环境（Production/Preview/Development）
4. ✅ 是否重新部署了项目
5. ✅ 是否清除了浏览器缓存

### Q4: 如何查看 API 使用情况？
**A:** 
1. 登录 Replicate Dashboard
2. 进入 **Usage** 或 **Billing**
3. 查看调用次数和费用

### Q5: 可以使用其他 Upscale 模型吗？
**A:** 
当前使用的是 `nightmareai/real-esrgan` 模型。
如果想更换：
1. 访问 [Replicate Models](https://replicate.com/collections/super-resolution)
2. 选择其他模型
3. 修改 `api/upscale-image.ts` 中的模型 ID

---

## 🎯 快速检查清单

配置完成后，按此清单检查：

- [ ] 已注册 Replicate 账户
- [ ] 已获取 API Token（以 `r8_` 开头）
- [ ] 已在 Vercel 添加 `REPLICATE_API_TOKEN` 环境变量
- [ ] 已选择所有环境（Production/Preview/Development）
- [ ] 已保存环境变量
- [ ] Vercel 已完成重新部署（约 2-3 分钟）
- [ ] 已清除浏览器缓存
- [ ] Image Upscale 功能测试成功

---

## 📞 需要帮助？

如果配置后仍然有问题，请检查：

1. **Vercel 部署日志**
   - Dashboard → Deployments → 最新部署 → Functions Logs
   - 查找 `upscale-image` 相关错误

2. **浏览器控制台**
   - DevTools → Console
   - 查看详细错误信息

3. **Replicate Dashboard**
   - 查看是否有 API 调用记录
   - 检查账户状态

---

## 🎉 配置完成！

完成以上步骤后，Image Upscale 功能应该可以正常工作了。

**测试建议：**
- 使用小图片测试（512×512 左右）
- 先测试 2x 放大
- 确认功能正常后再使用大图和高倍数

祝使用愉快！🚀

