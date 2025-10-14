-- Storage RLS Policies for home-sections bucket
-- 这个脚本需要在 Supabase Dashboard 的 SQL Editor 中执行
-- 因为需要 service_role 权限

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 1. 允许所有人读取 home-sections bucket（公开访问）
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'home-sections');

-- 2. 允许认证用户上传到 home-sections bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'home-sections');

-- 3. 允许认证用户更新自己上传的文件
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'home-sections')
WITH CHECK (bucket_id = 'home-sections');

-- 4. 允许认证用户删除文件
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'home-sections');

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

