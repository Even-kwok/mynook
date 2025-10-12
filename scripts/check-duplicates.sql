-- 检查重复的模板记录
-- 查询在其他分类中的重复模板

SELECT 
    name,
    main_category,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as template_ids
FROM design_templates 
WHERE main_category IN (
    'Exterior Design', 
    'Garden & Backyard Design', 
    'Festive Decor', 
    'Wall Paint', 
    'Floor Style'
)
GROUP BY name, main_category 
HAVING COUNT(*) > 1
ORDER BY main_category, name;

-- 统计各分类的模板数量
SELECT 
    main_category,
    COUNT(*) as total_templates
FROM design_templates
GROUP BY main_category
ORDER BY main_category;

