# Storage Policy 快速修复指南

## 问题
图片上传失败：`Upload failed. Please try again.`

## 原因
`home-sections` Storage bucket 缺少必要的 RLS 策略，导致认证用户无法上传文件。

## 解决方案

### 方法 1：通过 Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Storage 设置**
   - 左侧菜单选择 `Storage`
   - 点击 `home-sections` bucket
   - 点击右上角的 `Policies` 标签

3. **添加策略**

   **策略 1：公开读取**
   - 点击 `New Policy`
   - Policy Name: `Allow public read access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Policy definition: 
     ```sql
     bucket_id = 'home-sections'
     ```

   **策略 2：认证用户上传**
   - 点击 `New Policy`
   - Policy Name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'home-sections'
     ```

   **策略 3：认证用户更新**
   - 点击 `New Policy`
   - Policy Name: `Allow authenticated updates`
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - USING:
     ```sql
     bucket_id = 'home-sections'
     ```
   - WITH CHECK:
     ```sql
     bucket_id = 'home-sections'
     ```

   **策略 4：认证用户删除**
   - 点击 `New Policy`
   - Policy Name: `Allow authenticated deletes`
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'home-sections'
     ```

### 方法 2：通过 SQL Editor（快速）

1. **登录 Supabase Dashboard**
2. **打开 SQL Editor**
   - 左侧菜单选择 `SQL Editor`
   - 点击 `New Query`

3. **执行以下 SQL**

```sql
-- Storage RLS Policies for home-sections bucket

-- 删除可能存在的旧策略（如果有的话）
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 1. 允许所有人读取
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'home-sections');

-- 2. 允许认证用户上传
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'home-sections');

-- 3. 允许认证用户更新
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'home-sections')
WITH CHECK (bucket_id = 'home-sections');

-- 4. 允许认证用户删除
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'home-sections');

-- 验证策略是否创建成功
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%home-sections%';
```

4. **点击 `Run` 执行**

5. **验证结果**
   - 应该显示 4 条策略记录
   - 如果成功，返回后台尝试再次上传图片

## 验证修复

1. **刷新后台管理页面**
2. **进入 Home Sections 管理**
3. **点击编辑任意 Section**
4. **尝试上传图片**
5. **应该能成功上传**

## 其他可能的问题

### 如果仍然失败，请检查：

1. **用户是否已登录**
   - 确保你已经登录管理员账号
   - 在右上角应该能看到用户头像

2. **浏览器控制台错误**
   - 按 F12 打开开发者工具
   - 查看 Console 标签
   - 查看是否有具体的错误信息
   - 截图发送给我

3. **网络连接**
   - 确保网络正常
   - 检查 Supabase 服务状态

4. **文件大小**
   - 确保图片小于 10MB
   - 推荐使用 800 x 600 px 的图片

## 联系支持

如果以上方法都无法解决，请提供：
1. 浏览器控制台的完整错误信息
2. Supabase Dashboard 中 Storage Policies 的截图
3. 你的 Supabase 项目 URL

