# 🔍 Google OAuth redirect_uri_mismatch 故障排查

**错误**: redirect_uri_mismatch  
**时间**: 2025-10-10

---

## 🎯 立即执行的排查步骤

### 步骤1: 完全清除浏览器数据（最重要！）

**Chrome浏览器**：
1. 按 `Ctrl+Shift+Delete`
2. 时间范围选择：**全部时间**
3. 勾选所有选项：
   - ✅ 浏览历史记录
   - ✅ Cookie 及其他网站数据
   - ✅ 缓存的图像和文件
4. 点击 **清除数据**
5. **关闭浏览器**
6. **重新打开浏览器**

### 步骤2: 检查Vercel部署状态

1. 访问：https://vercel.com/dashboard
2. 找到MyNook项目
3. 查看最新部署：
   - ✅ 状态应该是 "Ready"
   - ✅ 提交ID应该是 `07aec88` 或更新
   - ⏱️ 如果还在Building，等待完成

### 步骤3: 验证Supabase Google Provider配置

访问：https://supabase.com/dashboard

1. 选择MyNook项目
2. **Authentication** → **Providers**
3. 找到 **Google**，点击展开
4. 确认：
   ```
   ✅ Enabled: 开启
   ✅ Client ID: 220827540927-36s05ago0o10sjoilhpcofqtapyuk1ol.apps.googleusercontent.com
   ✅ Client Secret: GOCSPX-xxxxx（已填写）
   ```

### 步骤4: 验证Google Cloud Console配置

访问：https://console.cloud.google.com/apis/credentials

1. 选择MyNook项目
2. 点击OAuth客户端 "MyNook"
3. **已获授权的重定向 URI** 应该只有：
   ```
   ✅ http://localhost:3000
   ✅ https://hlwpxkbthpizyfghwin.supabase.co/auth/v1/callback
   ```
   
   ⚠️ 确认**没有** `https://www.my-nook.ai` 这个URI

---

## 🔧 高级排查

### 检查OAuth流程URL

打开浏览器开发者工具（F12）→ Network标签页

1. 清空网络日志
2. 点击 "使用 Google 账号登录"
3. 查看重定向请求
4. 找到跳转到Google的请求，查看URL参数

**正确的redirect_uri参数应该是**：
```
redirect_uri=https://hlwpxkbthpizyfghwin.supabase.co/auth/v1/callback
```

如果不是这个，说明Supabase配置有问题。

---

## 🎯 最可能的问题

### 问题1: 浏览器缓存
**症状**: 代码已更新但仍显示旧错误  
**解决**: 完全清除浏览器缓存并重启浏览器

### 问题2: Vercel部署未完成
**症状**: 看到旧版本的代码在运行  
**解决**: 等待Vercel部署完成（通常2-3分钟）

### 问题3: Supabase Google Provider未启用
**症状**: OAuth跳转到错误的URL  
**解决**: 确认Supabase中Google Provider已启用并保存

### 问题4: Google配置生效延迟
**症状**: 刚修改完配置就测试  
**解决**: 等待5-10分钟让配置生效

---

## ✅ 测试清单

- [ ] 已完全清除浏览器缓存（包括Cookie）
- [ ] 已重启浏览器
- [ ] Vercel最新部署状态是 "Ready"
- [ ] Supabase Google Provider已启用
- [ ] Google OAuth配置已保存
- [ ] 已等待至少5分钟
- [ ] 使用隐身模式测试（Ctrl+Shift+N）

---

## 🚨 如果还是不行

### 尝试隐身模式测试

1. 按 `Ctrl+Shift+N` 打开隐身窗口
2. 访问 `https://www.my-nook.ai`
3. 尝试Google登录
4. 如果隐身模式可以，说明是缓存问题

### 检查Supabase Site URL

1. Supabase Dashboard → Authentication → URL Configuration
2. 确认 **Site URL** 是：`https://www.my-nook.ai`
3. 确认 **Redirect URLs** 包含：
   ```
   https://www.my-nook.ai/**
   http://localhost:3000/**
   ```

### 等待更长时间

Google OAuth配置可能需要15-30分钟才能完全生效。

---

## 📞 需要的信息

如果问题持续，请提供：

1. **Vercel部署状态截图**
2. **浏览器控制台完整错误**（F12 → Console标签）
3. **Network标签中Google OAuth请求的详细信息**
4. **确认是否已清除所有缓存**

---

**创建时间**: 2025-10-10  
**最后更新**: 2025-10-10

