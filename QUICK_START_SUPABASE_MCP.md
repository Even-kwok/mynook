# 🚀 Supabase MCP 模板导入 - 快速开始

**方案 B - 5 分钟快速导入指南**

---

## ⚡ 快速执行步骤

### 步骤 1: 获取凭证 (1 分钟)

访问 **Vercel Dashboard** 或 **Supabase Dashboard**，获取:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 步骤 2: 运行导入 (3 分钟)

在 PowerShell 中:

```powershell
# 进入项目目录
cd C:\Users\USER\Desktop\mynook

# 执行导入 (替换为你的实际凭证)
node scripts/supabase-mcp-import.js "你的_SUPABASE_URL" "你的_ANON_KEY"
```

### 步骤 3: 验证结果 (1 分钟)

1. 登录 [Supabase Dashboard](https://supabase.com)
2. 进入 `design_templates` 表
3. 确认有 **31 条** `Interior Design` 记录

---

## ✅ 完成！

你已成功导入 31 个高质量模板！

**包含内容:**
- 🎨 10 种设计风格 (全部高优先级)
- 🏠 5 种房间类型
- ✨ 完整的 MyNook-V1.0-Universal 提示词

---

## 📝 下一步

1. **查看跟踪文件:** `templates-tracking.csv`
2. **生成图片:** 使用 CSV 中的提示词
3. **更新 URL:** 上传图片后更新数据库

---

## 📚 详细文档

需要更多信息？查看:
- `SUPABASE_MCP_IMPORT_GUIDE.md` - 完整使用指南
- `SUPABASE_MCP_EXECUTION_SUMMARY.md` - 执行摘要
- `templates-tracking.csv` - 图片跟踪表

---

## 🆘 遇到问题？

**常见问题:**
1. **缺少凭证:** 从 Vercel 或 Supabase 获取
2. **Permission denied:** 检查是否有 admin 权限
3. **网络错误:** 确认网络连接正常

更多帮助请查看 `SUPABASE_MCP_IMPORT_GUIDE.md` 的故障排查部分。

---

**准备好了？开始吧！** 🚀

```powershell
node scripts/supabase-mcp-import.js
```

