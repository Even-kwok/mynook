# 🎨 AI 分类系统扩展指南

**创建日期**: 2025-10-19  
**适用场景**: 将 AI Template Creator 扩展到不同业务领域  

---

## 🌟 系统设计理念

当前 AI Template Creator 采用 **可配置的智能分类系统**：
- ✅ 前端：用户选择允许的分类范围
- ✅ AI：在指定范围内智能识别图片类别
- ✅ 后端：验证 AI 返回的分类是否在允许范围内

这个设计让系统可以轻松适配到**任何需要图片分类的业务场景**！

---

## 📋 当前实现（设计网站）

### 分类结构
```typescript
const ALLOWED_CATEGORIES = [
  'Interior Design',      // 室内设计
  'Exterior Design',      // 室外设计
  'Garden & Backyard Design'  // 花园设计
];
```

### AI 识别逻辑
```
输入：设计图片
AI 分析：识别空间类型、风格、材质、家具等
输出：
- mainCategory: "Interior Design"
- secondaryCategory: "living-room" 
- templateName: "Modern Scandinavian Living Room"
- fullPrompt: 完整的设计提示词
```

---

## 🎯 扩展示例 1：人像摄影网站

### 修改步骤

#### 1️⃣ 修改分类定义
```typescript
// components/AITemplateCreator.tsx
const ALLOWED_CATEGORIES = [
  'Professional Headshots',  // 专业头像
  'Portrait Photography',    // 人像写真
  'Fashion Photography',     // 时尚摄影
  'Family Portrait',         // 家庭照
  'Wedding Photography',     // 婚纱照
];
```

#### 2️⃣ 修改 AI 提示词
```typescript
// api/auto-create-template.ts
const EXTRACTOR_PROMPT = `分析这张人像摄影作品并返回 JSON 格式信息。

返回格式：
{
  "templateName": "简短描述名称（如 'Professional Business Headshot'）",
  "mainCategory": "必须是以下之一: 'Professional Headshots', 'Portrait Photography', 'Fashion Photography', 'Family Portrait', 'Wedding Photography'",
  "secondaryCategory": "进一步细分（如 'Studio Lighting', 'Natural Light', 'Outdoor', 'Indoor'）",
  "styleDescription": "详细描述拍摄风格、光线、构图、情绪",
  "fullPrompt": "完整的摄影提示词，包含拍摄参数、光线设置、后期处理等"
}

**分析要点**：
1. mainCategory - 识别照片类型（头像/写真/时尚/家庭/婚礼）
2. secondaryCategory - 光线类型或拍摄场景
3. styleDescription - 描述光线、构图、色调、情绪
4. fullPrompt - 生成完整的摄影复现提示词

**识别规则**：
- Professional Headshots: 单人、正式着装、专业背景、聚焦面部
- Portrait Photography: 艺术性人像、情绪表达、创意构图
- Fashion Photography: 时尚服装展示、模特摆姿、商业风格
- Family Portrait: 多人家庭合影、温馨自然、互动场景
- Wedding Photography: 婚礼场景、新人主体、浪漫氛围

返回 ONLY valid JSON，no markdown blocks.`;
```

#### 3️⃣ 修改数据库字段映射（可选）
```typescript
// 如果需要不同的字段结构
const { data: templateData } = await supabaseAdmin
  .from('photo_templates')  // 可以用新表
  .insert({
    name: extracted.templateName,
    image_url: publicUrl,
    shooting_prompt: extracted.fullPrompt,  // 改名更贴切
    photo_category: extracted.mainCategory,
    lighting_type: extracted.secondaryCategory,
    enabled: true,
  });
```

---

## 🎯 扩展示例 2：电商产品网站

### 分类定义
```typescript
const ALLOWED_CATEGORIES = [
  'Fashion & Apparel',       // 服装时尚
  'Electronics',             // 电子产品
  'Home & Living',           // 家居生活
  'Beauty & Cosmetics',      // 美妆产品
  'Food & Beverage',         // 食品饮料
];
```

### AI 识别重点
```
识别要点：
- 产品类型
- 拍摄角度（平铺/侧面/45度/手持）
- 背景风格（纯白/场景/lifestyle）
- 光线类型（硬光/柔光/自然光）
```

---

## 🎯 扩展示例 3：房地产网站

### 分类定义
```typescript
const ALLOWED_CATEGORIES = [
  'Residential Property',    // 住宅
  'Commercial Property',     // 商业地产
  'Luxury Real Estate',      // 豪宅
  'Land & Development',      // 土地开发
];
```

### 二级分类示例
```typescript
secondaryCategory 可以是：
- Residential: "Apartment", "Villa", "Townhouse", "Studio"
- Commercial: "Office", "Retail", "Warehouse", "Restaurant"
- Luxury: "Penthouse", "Mansion", "Waterfront", "Golf Course"
```

---

## 🛠️ 通用扩展步骤

### 步骤 1：定义业务分类
```typescript
// 1. 确定主分类（mainCategory）
const MAIN_CATEGORIES = ['类别A', '类别B', '类别C'];

// 2. 确定每个主分类的子分类（secondaryCategory）
const SUB_CATEGORIES = {
  '类别A': ['子类A1', '子类A2', '子类A3'],
  '类别B': ['子类B1', '子类B2'],
  // ...
};
```

### 步骤 2：设计 AI 提示词
```typescript
const EXTRACTOR_PROMPT = `
1. 明确告诉 AI 你的业务场景
2. 列出所有可能的分类选项
3. 描述每个分类的识别特征
4. 要求返回结构化的 JSON
5. 提供识别规则和例子
`;
```

### 步骤 3：调整前端 UI
```typescript
// components/AITemplateCreator.tsx
const ALLOWED_CATEGORIES = [...你的分类];

// 可选：添加分类说明
<p className="text-sm text-slate-500">
  📷 人像摄影：上传人物照片，AI 将识别照片类型和拍摄风格
</p>
```

### 步骤 4：测试和优化
1. **小批量测试**（5-10张图片）
2. **检查 AI 识别准确率**
3. **优化提示词**（如果识别不准确）
4. **调整分类粒度**（太细或太粗都不好）

---

## 💡 最佳实践

### 1. 分类数量控制
- ✅ **主分类**：3-7个最佳（太多会降低识别准确率）
- ✅ **子分类**：每个主分类下5-10个
- ❌ 避免：超过10个主分类或过于复杂的层级

### 2. 提示词优化技巧
```typescript
// ✅ 好的提示词
"识别这张照片是 Professional Headshot（单人正式商务照）还是 
Family Portrait（多人家庭温馨照）"

// ❌ 模糊的提示词
"识别照片类型"
```

### 3. 处理边界情况
```typescript
// 在 AI 提示词中添加
"如果图片不属于任何指定分类，返回最接近的类别，
并在 styleDescription 中说明原因。"
```

### 4. 多语言支持
```typescript
// 可以根据用户语言切换提示词
const PROMPTS = {
  zh: "分析这张图片...",
  en: "Analyze this image...",
  ja: "この画像を分析...",
};
```

---

## 📊 不同场景的 AI 模型选择

### Gemini 2.5 Flash（当前使用）
- ✅ 适合：快速识别、大批量处理
- ✅ 成本低、速度快
- ✅ 适用场景：设计、摄影、产品、房地产

### GPT-4 Vision（可选升级）
- ✅ 适合：需要更细致的理解
- ❌ 成本较高、速度较慢
- ✅ 适用场景：艺术品鉴定、医疗影像、复杂场景

### Claude 3 Vision（可选升级）
- ✅ 适合：需要详细的文字描述
- ✅ 理解上下文能力强
- ✅ 适用场景：教育内容、技术图解

---

## 🔄 实际迁移案例

### 从设计网站 → 人像网站

1. **修改分类** (5分钟)
   ```typescript
   // components/AITemplateCreator.tsx
   const ALLOWED_CATEGORIES = [
     'Professional Headshots',
     'Portrait Photography',
     'Fashion Photography',
   ];
   ```

2. **修改 AI 提示词** (15分钟)
   ```typescript
   // api/auto-create-template.ts
   const EXTRACTOR_PROMPT = `...人像识别提示词...`;
   ```

3. **测试上传** (10分钟)
   - 上传 5-10 张测试图片
   - 检查识别准确率
   - 微调提示词

4. **部署上线** (5分钟)
   ```bash
   git commit -m "Migrate to portrait photography platform"
   git push
   ```

**总计时间**: ~35 分钟完成业务转型！🚀

---

## 📈 未来扩展方向

### 1. 自定义分类训练
- 用户上传样本图片
- 系统学习用户特定的分类规则
- 生成个性化的识别提示词

### 2. 多模型融合
- 不同分类使用不同的 AI 模型
- 投票机制提高准确率

### 3. 分类置信度
- AI 返回分类的置信度分数
- 低置信度的自动标记需要人工审核

### 4. 自动分类建议
- 分析已上传的图片
- AI 自动建议新的分类维度

---

## 🎓 总结

当前的 AI Template Creator 系统是一个 **高度灵活的图片智能分类平台**：

1. **✅ 前端可配置** - 复选框选择分类范围
2. **✅ AI 智能识别** - 在指定范围内精准分类
3. **✅ 后端验证** - 确保结果符合业务规则
4. **✅ 易于扩展** - 30分钟完成业务转型

无论你做什么类型的网站，只需要：
1. 定义你的分类
2. 调整 AI 提示词
3. 测试优化

就可以拥有一个强大的 AI 自动分类系统！🎉

---

**维护者**: AI Assistant  
**最后更新**: 2025-10-19  
**相关文档**: 
- [AI_TEMPLATE_CREATOR_SETUP.md](./AI_TEMPLATE_CREATOR_SETUP.md)
- [✅_AI_Template_Creator实现完成_2025_10_19.md](./✅_AI_Template_Creator实现完成_2025_10_19.md)

