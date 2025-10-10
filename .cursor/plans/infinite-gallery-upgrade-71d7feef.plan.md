<!-- 71d7feef-6fcd-4ab5-bf9a-d07581102231 118d94e2-de7b-464a-8f8c-747ef1c697ae -->
# 分类图片墙系统实现方案

## 核心功能

### 1. 移除加载完成提示

- 移除 "All 100 images loaded" 和 "You've reached the end" 提示
- 根据实际图片数量动态加载，加载完自动停止
- 保持加载动画，移除完成提示

### 2. 创建11个分类数据结构

在 `types.ts` 和 `constants.ts` 中添加分类系统：

**分类列表（对应Tools菜单）：**

1. Interior Design (室内设计)
2. Festive Decor (节日装饰) 
3. Exterior Design (外部设计)
4. Wall Paint (墙面涂料)
5. Floor Style (地板风格)
6. Garden & Backyard Design (花园设计)
7. Item Replace (物品替换)
8. Reference Style Match (参考风格匹配)
9. AI Design Advisor (AI设计顾问)
10. Multi-Item Preview (多物品预览)
11. Free Canvas (自由画布)

### 3. 图片数据结构扩展

修改 `GalleryItem` 类型：

```typescript
export interface GalleryItem {
  id: string;
  type: 'image' | 'video';  // 支持MP4视频
  src: string;
  title: string;
  author: string;
  authorAvatarUrl: string;
  width: number;
  height: number;
  category: string;  // 新增：分类ID
  toolPage: string;  // 新增：跳转页面
}
```

### 4. 点击跳转功能

修改 `App.tsx` 中的图片卡片：

- 添加 `onClick` 事件处理
- 点击后调用 `onNavigate(item.toolPage)` 跳转
- 鼠标悬停显示"View in [Category]"提示

### 5. 示例数据生成

为每个分类生成示例数据（图片+视频）：

- 每个分类 8-12 个示例
- 图片使用 Unsplash/Picsum
- 视频使用示例 MP4 URL
- 随机比例保持瀑布流效果

### 6. 视频优化

- 视频自动播放、循环、静音
- 添加 `playsInline` 支持移动端
- 视频也添加 `loading="lazy"` 优化

## 技术实现

**修改文件：**

1. `types.ts` - 扩展 GalleryItem 接口
2. `constants.ts` - 重新生成分类数据
3. `App.tsx` - 添加点击跳转逻辑，移除完成提示

**分类与页面映射：**

```typescript
const CATEGORY_PAGE_MAP = {
  'interior-design': 'Interior Design',
  'festive-decor': 'Festive Decor',
  'exterior-design': 'Exterior Design',
  'wall-paint': 'Wall Paint',
  'floor-style': 'Floor Style',
  'garden-design': 'Garden & Backyard Design',
  // ... 其他分类
}
```

## 用户体验优化

- 悬停时显示分类名称和"点击使用"提示
- 平滑的跳转动画
- 视频循环播放增加视觉吸引力
- 保持瀑布流美学效果

### To-dos

- [ ] 生成100个正方形图片示例数据到constants.ts
- [ ] 在ExplorePage实现无限滚动逻辑（Intersection Observer）
- [ ] 修改图片显示为统一正方形（1:1 aspect ratio）
- [ ] 添加加载状态UI和完成提示
- [ ] 添加原生图片懒加载优化