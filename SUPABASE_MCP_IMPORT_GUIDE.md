# 📚 Supabase MCP 模板导入指南 (方案B)

**创建日期:** 2025-10-12  
**状态:** ✅ 就绪待执行  
**方法:** 通过编程方式使用 Supabase 客户端 (MCP 风格)

---

## 🎯 概述

此方案使用项目的 Supabase 客户端配置，通过编程方式批量导入模板数据到数据库。这是 MCP (Model Context Protocol) 理念的实现 - 通过代码直接与数据库交互。

**生成的模板数量:** 31 个
**包含房间类型:** 5 种 (Living Room, Master Bedroom, Kitchen, Bathroom, Home Office)
**包含设计风格:** 10 种高优先级风格

---

## 📁 相关文件

### 已创建的脚本

1. **`scripts/supabase-mcp-import.js`** - 主导入脚本 ⭐
   - 完整的模板生成和导入逻辑
   - 批量处理 (每批 10 个模板)
   - 错误处理和进度跟踪
   - 导入验证

2. **`scripts/generate-import-sql.js`** - SQL 生成脚本
   - 生成 SQL INSERT 语句
   - 可选方案：手动执行 SQL

3. **`scripts/import-templates.sql`** - 生成的 SQL 文件
   - 包含 31 个模板的 INSERT 语句
   - 可直接在 Supabase SQL Editor 中执行

---

## 🚀 执行方法

### 方法 1: 使用 Node.js 脚本执行 (推荐) ⭐

#### 步骤 1: 获取 Supabase 凭证

您需要从 Vercel 或 Supabase Dashboard 获取：
- `SUPABASE_URL`: 您的 Supabase 项目 URL
- `SUPABASE_ANON_KEY`: 您的 Supabase anon/public key

**在 Vercel Dashboard 查找:**
1. 登录 Vercel: https://vercel.com
2. 进入您的项目
3. 点击 **Settings** → **Environment Variables**
4. 查找 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

**在 Supabase Dashboard 查找:**
1. 登录 Supabase: https://supabase.com
2. 选择您的项目
3. 点击 **Settings** → **API**
4. 复制 **Project URL** 和 **anon/public key**

#### 步骤 2: 设置环境变量

**在 Windows PowerShell:**
```powershell
$env:VITE_SUPABASE_URL="https://your-project.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

**或者使用命令行参数:**
```powershell
# 不设置环境变量，直接传参数
node scripts/supabase-mcp-import.js "https://your-project.supabase.co" "your-anon-key"
```

#### 步骤 3: 执行导入

```bash
cd C:\Users\USER\Desktop\mynook
node scripts/supabase-mcp-import.js
```

#### 预期输出

```
╔════════════════════════════════════════════════════════════╗
║     MyNook Supabase MCP 模板导入 (方案B - 编程方式)       ║
╚════════════════════════════════════════════════════════════╝

📝 正在生成模板数据...
✅ 已生成 31 个模板

📍 步骤 1/3: 清除现有 Interior Design 模板...
✅ 步骤 1 完成!

📍 步骤 2/3: 批量导入新模板...
   批次 1/4: 导入 10 个模板...
   ✅ 批次导入成功 (10 个模板)
   批次 2/4: 导入 10 个模板...
   ✅ 批次导入成功 (10 个模板)
   ...
✅ 步骤 2 完成!

📍 步骤 3/3: 验证导入结果...
✅ 数据库中共有 31 个模板

╔════════════════════════════════════════════════════════════╗
║                  🎉 导入成功! 🎉                          ║
╚════════════════════════════════════════════════════════════╝

📊 导入统计:
   • 准备导入: 31 个模板
   • 成功导入: 31 个模板
   • 失败: 0 个模板
   • 数据库中总计: 31 个模板
   • 成功率: 100.0%
```

---

### 方法 2: 使用 SQL 直接执行

如果您更喜欢直接执行 SQL：

#### 步骤 1: 打开 Supabase SQL Editor

1. 登录 Supabase Dashboard
2. 选择您的项目
3. 点击左侧菜单的 **SQL Editor**

#### 步骤 2: 执行 SQL

1. 创建新查询
2. 复制 `scripts/import-templates.sql` 的内容
3. 点击 **Run** 执行

**注意:** SQL 文件包含 DELETE 语句，会先清除现有的 Interior Design 模板。

---

## 📊 导入的模板详情

### 设计风格 (10种)

1. **Latte / Creamy Style** - 拿铁奶油风 (sort_order: 1) 🔥🔥🔥
2. **Dopamine Decor** - 多巴胺装饰 (sort_order: 2) 🔥🔥🔥
3. **Organic Modern** - 有机现代 (sort_order: 3) 🔥🔥🔥
4. **Quiet Luxury** - 低调奢华 (sort_order: 4) 🔥🔥🔥
5. **Warm Minimalism** - 温暖极简 (sort_order: 5) 🔥🔥🔥
6. **Scandinavian** - 斯堪的纳维亚 (sort_order: 6) 🔥🔥🔥
7. **Maximalist** - 极繁主义 (sort_order: 7) 🔥🔥🔥
8. **Japandi** - 日式侘寂 (sort_order: 8) 🔥🔥🔥
9. **Modern Farmhouse** - 现代农舍 (sort_order: 9) 🔥🔥🔥
10. **Modern Minimalist** - 现代极简 (sort_order: 10) 🔥🔥🔥

### 房间类型 (5种)

1. **Living Room** (客厅) - 10 个模板
2. **Master Bedroom** (主卧) - 6 个模板
3. **Kitchen** (厨房) - 5 个模板
4. **Bathroom** (浴室) - 5 个模板
5. **Home Office** (家庭办公室) - 5 个模板

**总计:** 31 个高质量模板

---

## ✅ 验证导入结果

### 在 Supabase Dashboard 验证

1. 登录 Supabase Dashboard
2. 进入 **Table Editor**
3. 选择 `design_templates` 表
4. 筛选: `main_category = 'Interior Design'`
5. 检查:
   - ✅ 共有 31 条记录
   - ✅ 所有模板 `enabled = true`
   - ✅ 所有模板有 `room_type` 值
   - ✅ `sort_order` 正确 (1-10)

### 在应用中验证

1. 访问您的应用 (Vercel 部署)
2. 进入 **Admin Panel**
3. 查看 **Template Management**
4. 确认:
   - ✅ Interior Design 分类显示正常
   - ✅ 按房间类型分组显示
   - ✅ 模板按 sort_order 排序

---

## 🔧 故障排查

### 问题 1: "缺少 Supabase 凭证"

**症状:**
```
❌ 缺少 Supabase 凭证！
```

**解决方案:**
- 确保设置了环境变量或传递了命令行参数
- 检查 URL 和 Key 是否正确
- 检查是否有拼写错误

### 问题 2: "Unauthorized" 或 "Permission denied"

**症状:**
```
❌ Error: You do not have permission
```

**解决方案:**
- 检查 RLS (Row Level Security) 策略
- 确保使用的是 `anon` key（不是 service_role key）
- 验证您的用户账号有 admin 权限

### 问题 3: "Batch failed" 批量导入失败

**症状:**
```
❌ 批次失败: duplicate key value
```

**解决方案:**
- 数据库中可能已有相同名称的模板
- 手动删除现有 Interior Design 模板
- 或修改脚本中的模板名称使其唯一

### 问题 4: 网络超时

**症状:**
```
❌ Error: fetch failed / timeout
```

**解决方案:**
- 检查网络连接
- 检查 Supabase 项目是否运行正常
- 增加批次之间的延迟时间

---

## 📝 下一步

导入成功后：

### 1. 生成 CSV 跟踪文件

运行以下命令生成图片跟踪 CSV：
```bash
node scripts/generate-csv-tracker.js
```

这将创建两个文件：
- `templates-image-mapping.csv` - 完整详情
- `templates-image-mapping-simple.csv` - 快速参考

### 2. 生成图片

使用 CSV 文件中的 prompts：
1. 打开 `templates-image-mapping-simple.csv`
2. 按优先级排序 (sort_order 1-10)
3. 使用 Vertex AI 或其他工具生成图片
4. 按照 naming convention 保存图片

详见: `IMAGE_UPLOAD_GUIDE.md`

### 3. 更新图片 URL

生成图片后：
1. 上传到 Google Cloud Storage
2. 获取公开 URL
3. 在 CSV 中更新 URL
4. (未来) 运行批量更新脚本

---

## 🎉 完成标准

- [x] 脚本已创建
- [x] SQL 文件已生成
- [x] 文档已完成
- [ ] **待执行:** 运行导入脚本
- [ ] **待验证:** 检查数据库
- [ ] **待生成:** CSV 跟踪文件

---

## 📞 技术支持

如有问题，请检查：
1. `TEMPLATE_SYSTEM_OVERHAUL_REPORT.md` - 系统概述
2. `TEMPLATE_OVERHAUL_COMPLETE.md` - 完整文档
3. `scripts/README.md` - 脚本说明

---

**文档版本:** 1.0  
**最后更新:** 2025-10-12  
**状态:** ✅ 就绪执行

