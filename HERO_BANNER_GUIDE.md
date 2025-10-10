# Hero Banner 管理指南
## 首页横幅图片上传与管理

### 📋 功能说明

现在你可以在管理后台上传和管理首页的 Hero Banner（英雄横幅）图片了！

### ✨ 主要特性

1. **动态横幅** - 首页顶部的横幅图片从数据库动态加载
2. **后台管理** - 在 Admin Panel > Gallery 可以上传和管理 Hero Banner
3. **自动更新** - 上传后，首页会自动显示最新激活的 Hero Banner
4. **独立加载** - Hero Banner 和 Gallery 图片分开加载，互不影响

---

## 🚀 如何使用

### 第一步：进入管理后台

1. 登录你的管理员账号
2. 点击顶部导航栏的用户头像
3. 选择 "Admin Panel"
4. 在左侧菜单点击 "Gallery"

### 第二步：上传 Hero Banner

1. 在 **Upload New Images** 区域，拖拽或点击选择图片
2. 推荐尺寸：**1920x1080** 或 **16:9** 比例的横幅图片
3. 在上传表单中：
   - **Title**: 输入横幅标题（如：Effortless Design Banner）
   - **Category**: 选择 **"Hero Banner / 首页横幅"**
   - **Author**: 输入作者名（默认：MyNook Team）
4. 点击 **Upload All** 按钮上传

### 第三步：管理 Hero Banner

在 **Manage Gallery Items** 区域：
1. 使用分类筛选器选择 "Hero Banner / 首页横幅"
2. 你可以看到所有已上传的 Hero Banner
3. **激活/禁用**：点击图片左上角的绿色/灰色按钮切换激活状态
4. **删除**：鼠标悬停在图片上，点击右上角的红色删除按钮

### 第四步：查看效果

1. 返回首页（点击导航栏的 "MyNook.AI" 或 "Tools"）
2. 首页顶部的 Hero Banner 会自动显示你上传的第一张激活的图片

---

## 📐 建议规格

### 图片尺寸
- **推荐尺寸**: 1920x1080 px (16:9)
- **最小尺寸**: 1280x720 px
- **最大尺寸**: 3840x2160 px (4K)

### 文件格式
- **支持格式**: JPG, PNG, WebP
- **文件大小**: 建议小于 2MB（以确保快速加载）

### 设计建议
- 使用高质量、有冲击力的室内设计图片
- 确保图片中心区域有足够空间显示文字
- 图片应该能够支持深色或浅色文字叠加
- 避免过于复杂或杂乱的背景

---

## 🔧 技术细节

### 文件存储
- 图片存储在 Supabase Storage 的 `gallery-images` bucket
- 分类路径：`hero-banner/`

### 数据库表
- 表名：`gallery_items`
- 分类字段：`category = 'hero-banner'`
- 激活状态：`is_active = true`

### 前端显示逻辑
- Hero Banner 和 Gallery 图片分别加载
- 首页会自动获取第一张激活的 Hero Banner
- 如果没有上传的 Hero Banner，会显示默认图片
- 默认图片：`interior-japandi.png`

---

## 🎨 更新内容

### 新增功能
1. ✅ 在 `constants.ts` 添加了 `hero-banner` 分类
2. ✅ 后台 Gallery Manager 自动支持 Hero Banner 上传
3. ✅ 首页动态读取并显示 Hero Banner
4. ✅ Hero Banner 和 Gallery 独立加载，互不影响
5. ✅ 支持切换多个 Hero Banner（激活/禁用）

### 修改文件
- `constants.ts` - 添加 Hero Banner 分类定义
- `App.tsx` - 添加独立的 Hero Banner 加载逻辑（不影响 Gallery）

---

## ❓ 常见问题

**Q: 我上传了多个 Hero Banner，哪一个会显示？**  
A: 首页会显示第一个激活状态的 Hero Banner。如果要更换，可以禁用当前的，激活新的。

**Q: 上传后首页没有更新？**  
A: 刷新首页（F5）即可看到新的 Hero Banner。

**Q: Hero Banner 会影响 Gallery 图片加载吗？**  
A: 不会！Hero Banner 和 Gallery 图片是分开加载的，互不影响。

**Q: 可以上传视频作为 Hero Banner 吗？**  
A: 目前支持视频上传，但首页暂时只支持图片背景。视频功能可以后续添加。

**Q: Hero Banner 图片会压缩吗？**  
A: Supabase Storage 会保持原图质量。建议上传前手动优化图片大小。

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 图片是否已上传成功（在 Gallery 页面查看）
2. Hero Banner 是否处于激活状态（绿色勾选图标）
3. 分类是否正确选择为 "Hero Banner / 首页横幅"
4. 浏览器是否有缓存（尝试硬刷新 Ctrl+F5）

---

**更新日期**: 2025-10-10  
**版本**: v1.1 (修复版 - 保留 Gallery 动态加载)

