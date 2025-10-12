-- 删除重复的模板记录，保留最新创建的那个
-- 仅针对其他分类（Exterior, Garden, Festive, Wall Paint, Floor Style）

-- 第一步：查看将要删除的记录
WITH ranked_templates AS (
  SELECT 
    id,
    name,
    main_category,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY name, main_category 
      ORDER BY created_at DESC
    ) as rn
  FROM design_templates
  WHERE main_category IN (
    'Exterior Design', 
    'Garden & Backyard Design', 
    'Festive Decor', 
    'Wall Paint', 
    'Floor Style'
  )
)
SELECT 
  name,
  main_category,
  created_at,
  'WILL BE DELETED' as status
FROM ranked_templates 
WHERE rn > 1
ORDER BY main_category, name;

-- 第二步：实际删除重复记录（取消注释下面的代码来执行删除）
/*
WITH ranked_templates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, main_category 
      ORDER BY created_at DESC
    ) as rn
  FROM design_templates
  WHERE main_category IN (
    'Exterior Design', 
    'Garden & Backyard Design', 
    'Festive Decor', 
    'Wall Paint', 
    'Floor Style'
  )
)
DELETE FROM design_templates
WHERE id IN (
  SELECT id FROM ranked_templates WHERE rn > 1
);
*/

-- 第三步：验证清理结果
-- 确认没有重复记录了
SELECT 
    name,
    main_category,
    COUNT(*) as count
FROM design_templates 
WHERE main_category IN (
    'Exterior Design', 
    'Garden & Backyard Design', 
    'Festive Decor', 
    'Wall Paint', 
    'Floor Style'
)
GROUP BY name, main_category 
HAVING COUNT(*) > 1;

-- 应该返回空结果，表示没有重复了

