-- Home Sections System Migration
-- 为首页 Section 2-5 创建可管理的内容系统

-- 创建 home_sections 表
CREATE TABLE home_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 2 AND 5),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'comparison')),
  comparison_before_url TEXT,  -- 对比图：改造前
  comparison_after_url TEXT,   -- 对比图：改造后
  button_text TEXT NOT NULL,
  button_link TEXT NOT NULL,
  layout_direction TEXT NOT NULL CHECK (layout_direction IN ('left-image', 'right-image')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT comparison_urls_check CHECK (
    (media_type = 'comparison' AND comparison_before_url IS NOT NULL AND comparison_after_url IS NOT NULL) OR
    (media_type != 'comparison')
  )
);

-- 唯一约束：每个 section_number 只能有一条记录
CREATE UNIQUE INDEX idx_home_sections_section_number ON home_sections(section_number);

-- 创建索引以优化查询
CREATE INDEX idx_home_sections_active ON home_sections(is_active, sort_order);

-- RLS 策略
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

-- 公开读取已激活的 sections
CREATE POLICY "Public read access" ON home_sections 
  FOR SELECT 
  TO public 
  USING (is_active = true);

-- 管理员完全访问权限
CREATE POLICY "Admin full access" ON home_sections 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.permission_level = 5
    )
  );

-- 插入默认数据（当前首页的 Section 2-5）
INSERT INTO home_sections (section_number, title, subtitle, media_url, media_type, button_text, button_link, layout_direction, sort_order) VALUES
(2, 'Instant Design
Variations at
Your Fingertips', 'Our advanced AI technology analyzes your space and creates multiple design options in seconds. Choose your favorite style and let the magic happen.', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop', 'image', 'Get Started', 'Interior Design', 'left-image', 1),

(3, 'Perfect Wall Colors
for Every Room', 'Transform your space with AI-powered color recommendations. Get personalized paint suggestions that match your style and lighting conditions.', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=2000&auto=format&fit=crop', 'image', 'Get Started', 'Wall Paint', 'right-image', 2),

(4, 'Stunning Flooring
Options & Styles', 'Discover the perfect flooring for your space. From hardwood to tile, our AI helps you visualize different materials and patterns instantly.', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2000&auto=format&fit=crop', 'image', 'Get Started', 'Floor Style', 'left-image', 3),

(5, 'Beautiful Gardens
& Outdoor Spaces', 'Transform your backyard into a stunning oasis. Get AI-powered landscaping ideas and garden designs tailored to your outdoor space.', 'https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=2000&auto=format&fit=crop', 'image', 'Get Started', 'Garden & Backyard Design', 'right-image', 4);

-- 添加注释说明
COMMENT ON TABLE home_sections IS '首页 Section 2-5 的内容管理';
COMMENT ON COLUMN home_sections.section_number IS 'Section 编号 (2-5)';
COMMENT ON COLUMN home_sections.title IS '主标题';
COMMENT ON COLUMN home_sections.subtitle IS '副标题';
COMMENT ON COLUMN home_sections.media_url IS '媒体 URL（图片/视频）';
COMMENT ON COLUMN home_sections.media_type IS '媒体类型：image, video, comparison';
COMMENT ON COLUMN home_sections.comparison_before_url IS '对比图：改造前图片 URL';
COMMENT ON COLUMN home_sections.comparison_after_url IS '对比图：改造后图片 URL';
COMMENT ON COLUMN home_sections.button_text IS '按钮文字';
COMMENT ON COLUMN home_sections.button_link IS '按钮链接（功能页面名称）';
COMMENT ON COLUMN home_sections.layout_direction IS '布局方向：left-image（左图右文）, right-image（右图左文）';
COMMENT ON COLUMN home_sections.is_active IS '是否激活显示';
COMMENT ON COLUMN home_sections.sort_order IS '排序顺序';

