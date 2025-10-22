-- Fix admin_users policies to avoid recursion and allow template thumbnail uploads

-- Drop existing admin policies to replace them with function-based checks
DROP POLICY IF EXISTS "Super admins can view all admins" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view own record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can create admins" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admins" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admin_users;

DROP POLICY IF EXISTS "Super admins can view all logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can view own logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;

-- Re-create helper functions with security definer to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = check_user_id
      AND au.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = check_user_id
      AND au.admin_level = 'super_admin'
      AND au.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_level(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT admin_level::TEXT
      FROM public.admin_users au
      WHERE au.user_id = check_user_id
        AND au.is_active = true
      LIMIT 1
    ),
    'none'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_level(UUID) TO authenticated, service_role, anon;

-- Recreate RLS policies using helper functions
CREATE POLICY "Admins can view own record"
  ON public.admin_users
  FOR SELECT
  USING (user_id = auth.uid() AND is_active = true);

CREATE POLICY "Super admins can view admins"
  ON public.admin_users
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Super admins can create admins"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can update admins"
  ON public.admin_users
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete admins"
  ON public.admin_users
  FOR DELETE
  USING (public.is_super_admin());

CREATE POLICY "Super admins can view all logs"
  ON public.admin_logs
  FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Admins can view own logs"
  ON public.admin_logs
  FOR SELECT
  USING (user_id = auth.uid() AND public.is_admin());

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Storage policies for template-thumbnails bucket
CREATE POLICY "Public read template thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'template-thumbnails');

CREATE POLICY "Authenticated upload template thumbnails"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'template-thumbnails' AND auth.uid() = owner);

CREATE POLICY "Authenticated update template thumbnails"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'template-thumbnails' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'template-thumbnails' AND auth.uid() = owner);

CREATE POLICY "Authenticated delete template thumbnails"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'template-thumbnails' AND auth.uid() = owner);
