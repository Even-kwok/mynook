-- ============================================
-- 分类排序和使用统计系统
-- ============================================
-- 创建时间: 2025-10-13
-- 描述: 添加主分类排序配置表和使用统计表，支持手动排序和未来的自动排序功能
-- ============================================

-- ============================================
-- 第 1 部分: 创建主分类排序配置表
-- ============================================

CREATE TABLE IF NOT EXISTS public.main_category_order (
  main_category TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_manual_sort BOOLEAN DEFAULT true, -- true=手动排序优先，false=使用统计自动排序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.main_category_order IS '主分类排序配置表，控制前端显示顺序';
COMMENT ON COLUMN public.main_category_order.sort_order IS '排序顺序，数字越小越靠前';
COMMENT ON COLUMN public.main_category_order.is_manual_sort IS '是否使用手动排序（true）还是自动排序（false）';

-- ============================================
-- 第 2 部分: 创建模板使用统计表（为未来功能预留）
-- ============================================

CREATE TABLE IF NOT EXISTS public.template_usage_stats (
  template_id UUID PRIMARY KEY REFERENCES public.design_templates(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.template_usage_stats IS '模板使用统计表，记录每个模板被使用的次数';
COMMENT ON COLUMN public.template_usage_stats.usage_count IS '模板被用户选择生成图片的次数';
COMMENT ON COLUMN public.template_usage_stats.last_used_at IS '最后一次使用时间';

-- ============================================
-- 第 3 部分: 创建分类使用统计表（为未来功能预留）
-- ============================================

CREATE TABLE IF NOT EXISTS public.category_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(main_category, sub_category)
);

COMMENT ON TABLE public.category_usage_stats IS '分类使用统计表，记录每个分类下模板被使用的总次数';
COMMENT ON COLUMN public.category_usage_stats.usage_count IS '该分类下所有模板被使用的总次数';

-- ============================================
-- 第 4 部分: 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_main_category_order_sort ON public.main_category_order(sort_order);
CREATE INDEX IF NOT EXISTS idx_template_usage_stats_count ON public.template_usage_stats(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_category_usage_stats_main ON public.category_usage_stats(main_category);
CREATE INDEX IF NOT EXISTS idx_category_usage_stats_count ON public.category_usage_stats(usage_count DESC);

-- ============================================
-- 第 5 部分: 创建更新时间触发器
-- ============================================

CREATE TRIGGER update_main_category_order_updated_at
  BEFORE UPDATE ON public.main_category_order
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_usage_stats_updated_at
  BEFORE UPDATE ON public.template_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_usage_stats_updated_at
  BEFORE UPDATE ON public.category_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 第 6 部分: 启用 RLS
-- ============================================

ALTER TABLE public.main_category_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_usage_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第 7 部分: RLS 策略
-- ============================================

-- 所有用户可以查看分类排序配置
CREATE POLICY "Anyone can view category order"
  ON public.main_category_order
  FOR SELECT
  USING (true);

-- 管理员可以管理分类排序
CREATE POLICY "Admins can manage category order"
  ON public.main_category_order
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 所有用户可以查看统计数据
CREATE POLICY "Anyone can view template usage stats"
  ON public.template_usage_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view category usage stats"
  ON public.category_usage_stats
  FOR SELECT
  USING (true);

-- 系统可以更新统计数据（通过服务账号）
CREATE POLICY "Service can update template usage stats"
  ON public.template_usage_stats
  FOR ALL
  USING (true);

CREATE POLICY "Service can update category usage stats"
  ON public.category_usage_stats
  FOR ALL
  USING (true);

-- ============================================
-- 第 8 部分: 辅助函数 - 更新主分类排序
-- ============================================

CREATE OR REPLACE FUNCTION public.update_main_category_sort_order(
  p_category TEXT,
  p_new_order INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.main_category_order (main_category, sort_order, is_manual_sort)
  VALUES (p_category, p_new_order, true)
  ON CONFLICT (main_category) 
  DO UPDATE SET 
    sort_order = p_new_order,
    is_manual_sort = true,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_main_category_sort_order IS '更新主分类的排序顺序';

-- ============================================
-- 第 9 部分: 辅助函数 - 批量更新主分类排序
-- ============================================

CREATE OR REPLACE FUNCTION public.reorder_main_categories(
  p_categories TEXT[]
)
RETURNS VOID AS $$
DECLARE
  v_category TEXT;
  v_index INTEGER;
BEGIN
  -- 遍历数组并更新每个分类的排序
  FOR v_index IN 1..array_length(p_categories, 1) LOOP
    v_category := p_categories[v_index];
    
    INSERT INTO public.main_category_order (main_category, sort_order, is_manual_sort)
    VALUES (v_category, v_index - 1, true)
    ON CONFLICT (main_category) 
    DO UPDATE SET 
      sort_order = v_index - 1,
      is_manual_sort = true,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reorder_main_categories IS '批量更新主分类排序（数组顺序即为显示顺序）';

-- ============================================
-- 第 10 部分: 辅助函数 - 批量更新子分类排序
-- ============================================

CREATE OR REPLACE FUNCTION public.reorder_sub_categories(
  p_main_category TEXT,
  p_sub_categories TEXT[]
)
RETURNS VOID AS $$
DECLARE
  v_sub_category TEXT;
  v_index INTEGER;
BEGIN
  -- 遍历数组并更新每个子分类中模板的排序
  FOR v_index IN 1..array_length(p_sub_categories, 1) LOOP
    v_sub_category := p_sub_categories[v_index];
    
    -- 更新该子分类下所有模板的 sort_order
    -- 使用主分类和子分类的组合来定位
    UPDATE public.design_templates
    SET sort_order = v_index - 1,
        updated_at = NOW()
    WHERE main_category = p_main_category
      AND (sub_category = v_sub_category OR room_type = v_sub_category);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reorder_sub_categories IS '批量更新子分类排序（通过更新该子分类下所有模板的sort_order）';

-- ============================================
-- 第 11 部分: 辅助函数 - 批量更新模板排序
-- ============================================

CREATE OR REPLACE FUNCTION public.reorder_templates(
  p_template_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_template_id UUID;
  v_index INTEGER;
BEGIN
  -- 遍历数组并更新每个模板的排序
  FOR v_index IN 1..array_length(p_template_ids, 1) LOOP
    v_template_id := p_template_ids[v_index];
    
    UPDATE public.design_templates
    SET sort_order = v_index - 1,
        updated_at = NOW()
    WHERE id = v_template_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reorder_templates IS '批量更新模板排序';

-- ============================================
-- 第 12 部分: 辅助函数 - 增加模板使用次数（为未来功能预留）
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_template_usage(
  p_template_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.template_usage_stats (template_id, usage_count, last_used_at)
  VALUES (p_template_id, 1, NOW())
  ON CONFLICT (template_id)
  DO UPDATE SET 
    usage_count = public.template_usage_stats.usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW();
    
  -- 同时更新分类统计
  INSERT INTO public.category_usage_stats (main_category, sub_category, usage_count, last_used_at)
  SELECT main_category, sub_category, 1, NOW()
  FROM public.design_templates
  WHERE id = p_template_id
  ON CONFLICT (main_category, sub_category)
  DO UPDATE SET 
    usage_count = public.category_usage_stats.usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_template_usage IS '增加模板使用次数（用于未来的自动排序功能）';

-- ============================================
-- 第 13 部分: 初始化现有分类的排序数据
-- ============================================

-- 从现有的 design_templates 表中获取所有主分类并初始化排序
-- 修复：先用子查询获取 DISTINCT 的主分类，再计算 ROW_NUMBER
INSERT INTO public.main_category_order (main_category, sort_order, is_manual_sort)
SELECT 
  main_category,
  (ROW_NUMBER() OVER (ORDER BY main_category) - 1) as sort_order,
  true as is_manual_sort
FROM (
  SELECT DISTINCT main_category 
  FROM public.design_templates
) AS categories
ON CONFLICT (main_category) DO NOTHING;

-- ============================================
-- 完成！
-- ============================================

-- 使用说明：
-- 1. 管理员通过 Admin 后台调用排序函数来手动排序
-- 2. 使用 reorder_main_categories(['Interior Design', 'Exterior Design', ...]) 批量排序主分类
-- 3. 使用 reorder_sub_categories('Interior Design', ['Living Room', 'Bedroom', ...]) 批量排序子分类
-- 4. 使用 reorder_templates([uuid1, uuid2, ...]) 批量排序模板
-- 5. 未来可以调用 increment_template_usage(uuid) 来记录模板使用次数
-- 6. 可以基于 usage_count 实现自动排序推荐功能

