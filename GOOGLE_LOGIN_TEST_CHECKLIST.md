# ✅ Google登录测试清单

完整的测试流程，确保Google OAuth登录在各种环境下正常工作。

---

## 📋 测试环境

需要在以下三个环境中测试：

1. **本地开发环境** (localhost:3000)
2. **Vercel预览环境** (*.vercel.app)
3. **Vercel生产环境** (your-domain.vercel.app)

---

## 🧪 测试 1: 本地开发环境

### 前置条件

- [ ] 已完成 `GOOGLE_OAUTH_SETUP.md` 中的所有配置
- [ ] `.env` 文件包含正确的Supabase配置
- [ ] `http://localhost:3000` 已添加到Google授权重定向URI

### 测试步骤

1. **启动开发服务器**
   ```bash
   npm run dev
   ```
   - [ ] 服务器成功启动在 http://localhost:3000
   - [ ] 控制台显示 "✅ Supabase config loaded"

2. **打开登录模态框**
   - [ ] 访问 http://localhost:3000
   - [ ] 点击右上角用户图标
   - [ ] 登录模态框成功弹出

3. **点击Google登录按钮**
   - [ ] 点击 "使用 Google 账号登录"
   - [ ] 浏览器控制台显示：
     ```
     🔐 Initiating Google OAuth login...
     📍 Redirect URL: http://localhost:3000
     ```
   - [ ] 页面跳转到Google登录页面

4. **Google授权流程**
   - [ ] Google页面正常加载（无错误）
   - [ ] 选择或输入Google账号
   - [ ] 看到权限授权页面：
     - 应用名称显示正确（MyNook）
     - 请求的权限包括：查看邮箱、基本信息
   - [ ] 点击"允许"授权

5. **重定向回应用**
   - [ ] 自动跳转回 http://localhost:3000
   - [ ] URL中包含 `#access_token=` 参数（短暂显示）
   - [ ] 登录模态框自动关闭

6. **验证登录状态**
   - [ ] 右上角显示用户头像（来自Google）
   - [ ] 显示用户姓名
   - [ ] 显示会员徽章："🆓 FREE"
   - [ ] 显示信用点："💎 10"

7. **检查浏览器控制台**
   ```
   ✅ 应该看到的日志：
   - Auth state changed: SIGNED_IN
   - User profile loaded successfully
   
   ❌ 不应该看到的错误：
   - Google OAuth error
   - Failed to refresh profile
   - Missing Supabase environment variables
   ```

8. **检查数据库记录**
   - [ ] 打开Supabase Dashboard > Table Editor > users
   - [ ] 找到新创建的用户记录
   - [ ] 验证字段值：
     ```
     email: [你的Gmail地址]
     full_name: [从Google获取的姓名]
     avatar_url: [Google头像URL，以https://lh3.googleusercontent.com开头]
     membership_tier: free
     credits: 10
     total_generations: 0
     created_at: [当前时间]
     ```

9. **测试功能访问**
   - [ ] 点击 "My Designs" 可以查看个人作品
   - [ ] 可以访问设计工具
   - [ ] 信用点数显示正确

10. **测试登出**
    - [ ] 点击用户菜单中的 "Sign Out"
    - [ ] 页面刷新，恢复到未登录状态
    - [ ] 用户头像变回默认图标

11. **测试重复登录**
    - [ ] 再次点击Google登录
    - [ ] 应该直接登录（不需要再次授权）
    - [ ] 用户信息正确显示

### 本地环境测试结果

- **测试日期**: ___________
- **测试人员**: ___________
- **结果**: ☐ 通过 ☐ 失败
- **备注**: ___________

---

## 🌐 测试 2: Vercel预览环境

### 前置条件

- [ ] 代码已推送到GitHub
- [ ] Vercel已连接到GitHub仓库
- [ ] Vercel环境变量已配置
- [ ] Vercel域名已添加到Google授权域名

### 测试步骤

1. **触发预览部署**
   ```bash
   git add .
   git commit -m "Test Google OAuth on Vercel"
   git push
   ```
   - [ ] GitHub推送成功
   - [ ] Vercel自动开始构建
   - [ ] 收到Vercel部署成功通知

2. **访问预览URL**
   - [ ] 点击Vercel提供的预览链接（例如：https://mynook-abc123.vercel.app）
   - [ ] 页面正常加载
   - [ ] 没有Supabase配置错误

3. **测试Google登录**
   - [ ] 点击右上角用户图标
   - [ ] 点击 "使用 Google 账号登录"
   - [ ] 检查浏览器控制台的Redirect URL是否为Vercel域名
   - [ ] 跳转到Google授权页面
   - [ ] 选择账号并授权

4. **验证重定向**
   - [ ] 成功跳转回Vercel预览域名
   - [ ] 登录状态正确
   - [ ] 用户信息显示正确

5. **跨设备测试（可选）**
   - [ ] 在手机上访问预览URL
   - [ ] 测试Google登录功能
   - [ ] 验证响应式设计

### Vercel预览环境测试结果

- **测试日期**: ___________
- **预览URL**: ___________
- **结果**: ☐ 通过 ☐ 失败
- **备注**: ___________

---

## 🚀 测试 3: Vercel生产环境

### 前置条件

- [ ] 预览环境测试已通过
- [ ] 已合并到主分支
- [ ] 生产域名已配置
- [ ] 生产域名已添加到Google授权域名列表

### 测试步骤

1. **部署到生产**
   ```bash
   git checkout main
   git merge feature-branch
   git push origin main
   ```
   - [ ] 生产环境部署成功
   - [ ] 访问生产域名正常

2. **完整功能测试**
   - [ ] 重复"本地开发环境"中的所有测试步骤
   - [ ] 使用不同的Google账号测试
   - [ ] 验证所有功能正常

3. **性能测试**
   - [ ] Google登录跳转速度正常（< 2秒）
   - [ ] 重定向回应用速度正常（< 3秒）
   - [ ] 用户信息加载速度正常（< 1秒）

4. **多用户测试**
   - [ ] 邀请团队成员测试
   - [ ] 至少3个不同的Google账号成功登录
   - [ ] 所有用户数据隔离正确

### 生产环境测试结果

- **测试日期**: ___________
- **生产URL**: ___________
- **结果**: ☐ 通过 ☐ 失败
- **备注**: ___________

---

## 🔍 功能集成测试

### 信用点系统

- [ ] 新用户注册后有10个信用点
- [ ] 生成图片后信用点正确扣除
- [ ] 信用点不足时显示升级提示
- [ ] Business会员信用点无限制

### 会员系统

- [ ] 新用户默认为Free会员
- [ ] 会员徽章显示正确
- [ ] 不同会员等级权限隔离正确

### 用户资料

- [ ] Google头像正确显示
- [ ] 姓名正确显示
- [ ] 邮箱正确保存
- [ ] 用户可以更新资料

### 持久化登录

- [ ] 刷新页面后仍保持登录状态
- [ ] 关闭浏览器重新打开后仍登录（24小时内）
- [ ] Token过期自动刷新

---

## 🐛 问题排查清单

遇到问题时，按以下顺序检查：

### 检查点 1: 环境配置
```bash
# 验证环境变量
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```
- [ ] 环境变量存在且格式正确
- [ ] Supabase URL以 https:// 开头
- [ ] Anon Key是完整的JWT token

### 检查点 2: Google配置
- [ ] Google OAuth客户端状态为"已发布"
- [ ] 所有必需的重定向URI已添加
- [ ] Client ID和Secret在Supabase中填写正确

### 检查点 3: Supabase配置
- [ ] Google Provider已启用
- [ ] Callback URL在Google中已授权
- [ ] RLS策略正确配置

### 检查点 4: 浏览器控制台
```javascript
// 在控制台运行此命令检查Supabase连接
supabase.auth.getSession().then(console.log)
```
- [ ] 没有CORS错误
- [ ] 没有认证错误
- [ ] Session存在或为null（取决于登录状态）

### 检查点 5: 网络请求
- [ ] 打开开发者工具 > Network
- [ ] 过滤"supabase"和"google"
- [ ] 检查OAuth相关请求的状态码
- [ ] 所有请求应该是200或302（重定向）

---

## 📊 测试报告模板

```markdown
# Google OAuth登录测试报告

**测试日期**: 2025-10-10
**测试人员**: [你的名字]
**项目版本**: [Git commit hash]

## 测试环境

| 环境 | URL | 状态 |
|-----|-----|------|
| 本地开发 | http://localhost:3000 | ✅ 通过 |
| Vercel预览 | https://mynook-abc123.vercel.app | ✅ 通过 |
| Vercel生产 | https://your-domain.vercel.app | ✅ 通过 |

## 测试结果汇总

- 总测试用例: 45
- 通过: 45
- 失败: 0
- 跳过: 0

## 发现的问题

1. [如有问题，在此列出]

## 建议

1. [如有改进建议，在此列出]

## 结论

☐ 已准备好发布到生产环境
☐ 需要修复问题后重新测试
```

---

## 🎯 快速验证命令

在浏览器控制台运行这些命令快速验证状态：

```javascript
// 检查当前用户
await supabase.auth.getUser()

// 检查会话
await supabase.auth.getSession()

// 检查用户资料
await supabase.from('users').select('*').single()

// 测试Google登录（会打开新窗口）
await supabase.auth.signInWithOAuth({ provider: 'google' })

// 登出
await supabase.auth.signOut()
```

---

## 📚 相关文档

- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - 配置指南
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - 认证系统总览
- [DEBUG_GUIDE.md](./DEBUG_GUIDE.md) - 调试指南

---

**文档版本**: 1.0  
**最后更新**: 2025-10-10  
**维护者**: MyNook Team

祝测试顺利！🎉

