# 🚀 快速添加 Image Upscale 工具 - 2分钟完成

## 📝 操作步骤

### 第1步：登录 Supabase（30秒）

1. 打开浏览器访问：https://supabase.com
2. 登录你的账号
3. 选择项目：**mynook**

### 第2步：执行 SQL（30秒）

1. 点击左侧菜单 **SQL Editor** (数据库图标)
2. 点击右上角 **New Query** 按钮
3. 复制以下 SQL 代码：

```sql
-- 添加 Image Upscale 工具
INSERT INTO tools_order (tool_id, name, short_name, emoji, is_premium, is_coming_soon, sort_order) 
VALUES ('image-upscale', 'Image Upscale', 'Upscale', '🔍', true, false, 12)
ON CONFLICT (tool_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  emoji = EXCLUDED.emoji,
  is_premium = EXCLUDED.is_premium,
  is_coming_soon = EXCLUDED.is_coming_soon,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
```

4. 粘贴到编辑器
5. 点击右下角绿色 **Run** 按钮
6. 看到 "Success. No rows returned" ✅

### 第3步：验证数据（可选，15秒）

在 SQL Editor 运行查询确认：

```sql
SELECT tool_id, name, short_name, emoji, is_premium, sort_order 
FROM tools_order 
ORDER BY sort_order;
```

应该看到 12 行数据，最后一行是 Image Upscale。

### 第4步：清除前端缓存（30秒）

1. 打开你的网站
2. 按 **F12** 打开浏览器控制台
3. 在 Console 标签页粘贴并回车：

```javascript
localStorage.removeItem('mynook_tools_order_cache');
localStorage.removeItem('mynook_tools_order_timestamp');
location.reload();
```

或者直接按：
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## ✅ 完成！

现在刷新页面，你应该能看到：

### 左侧工具栏
```
✏️ Canva       (👑)
🔍 Upscale     (👑) ← 新增！
```

### Admin Panel → Tools Order
```
12. Image Upscale
    ID: image-upscale
    Premium 功能
```

## 🎯 一键复制区

### SQL 命令
```sql
INSERT INTO tools_order (tool_id, name, short_name, emoji, is_premium, is_coming_soon, sort_order) VALUES ('image-upscale', 'Image Upscale', 'Upscale', '🔍', true, false, 12) ON CONFLICT (tool_id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name, emoji = EXCLUDED.emoji, is_premium = EXCLUDED.is_premium, is_coming_soon = EXCLUDED.is_coming_soon, sort_order = EXCLUDED.sort_order, updated_at = now();
```

### JavaScript 缓存清除
```javascript
localStorage.removeItem('mynook_tools_order_cache');localStorage.removeItem('mynook_tools_order_timestamp');location.reload();
```

## 📸 截图参考

### Supabase SQL Editor 位置
```
Supabase Dashboard
├── Project: mynook
├── [选择左侧菜单]
│   ├── 🏠 Home
│   ├── 📊 Table Editor
│   ├── 🔍 SQL Editor ← 点这里
│   ├── ...
```

### 成功提示
执行 SQL 后看到：
```
Success. No rows returned
Rows: 0
Time: 123ms
```

## ⚠️ 故障排查

### 问题1：找不到 tools_order 表
**解决**: 运行迁移脚本创建表
```sql
-- 检查表是否存在
SELECT * FROM tools_order LIMIT 1;
```

### 问题2：权限错误
**解决**: 确保你是项目 Owner 或有数据库写入权限

### 问题3：执行后仍看不到
**解决**: 确保清除了浏览器缓存并刷新页面

### 问题4：Admin Panel 重置失败不再报错
**解决**: 数据库已有数据，重置功能会正常工作

## 🎉 测试功能

添加成功后，测试步骤：

1. ✅ 点击左侧 🔍 Upscale 按钮
2. ✅ 进入 Image Upscale 页面
3. ✅ 上传一张图片
4. ✅ 选择放大倍数（2x/4x/8x）
5. ✅ 点击 Upscale 按钮
6. ✅ 等待处理完成
7. ✅ 下载放大后的图片

## 📞 需要帮助？

如果遇到问题：
1. 检查 Supabase Dashboard 是否正常
2. 确认项目名称是 mynook
3. 验证 SQL 执行成功
4. 清除浏览器缓存
5. 检查控制台是否有错误

---

**预计完成时间**: 2-3 分钟
**难度**: ⭐ 简单
**需要权限**: Supabase 项目 Owner

