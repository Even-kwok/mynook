# 主应用设计工具区域和Free Canvas优化计划

## 核心原则
- 所有页面使用统一的山脉背景图+黑色渐变蒙层
- 所有面板使用统一毛玻璃效果：`bg-white/10 backdrop-blur-md border border-white/20`
- 所有输入框、选择器等组件适配深色背景
- 所有文字颜色调整为适合深色背景的颜色

---

## Phase 1: 主应用设计工具区域优化 (App.tsx)

### 1.1 添加统一背景 (renderMainGenerator, 约3072-3073行)

**当前代码** (3073行):
```tsx
<div className="flex-1 flex overflow-hidden">
```

**修改为**:
```tsx
<div className="flex-1 flex overflow-hidden bg-black relative">
    {/* Background Image Layer */}
    <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
            alt="Mountain background" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90" />
    </div>
    {/* 接下来的内容添加 relative z-10 */}
```

### 1.2 左侧边栏毛玻璃效果 (约3074行)

**从**: 
```tsx
<aside className="w-[380px] bg-white px-6 pb-6 pt-24 border-r border-slate-200 flex-shrink-0">
```

**改为**:
```tsx
<aside className="w-[380px] bg-white/10 backdrop-blur-md px-6 pb-6 pt-24 border-r border-white/20 flex-shrink-0 relative z-10">
```

### 1.3 文字颜色调整 (约3077-3080, 3204行)

**所有标题和描述文字**:
- `text-slate-800` → `text-white`
- `text-slate-500` → `text-slate-300`
- `text-slate-400` → `text-slate-400` (保持)

具体位置:
- 3079行: `text-slate-800` → `text-white`
- 3080行: `text-slate-500` → `text-slate-300`
- 3204, 3216行: `text-slate-800` → `text-white`

### 1.4 CustomSelect组件优化 (约1527-1537行)

**按钮背景** (1533-1536行):
- 启用状态: `bg-white/50` → `bg-white/10`
- 禁用状态: `bg-slate-100` → `bg-white/5`
- 边框: `border-slate-300` → `border-white/20`
- 文字: `text-slate-800` → `text-white`
- 禁用文字: `text-slate-400` → `text-slate-500`

**下拉菜单背景** (约1545-1550行):
```tsx
从: bg-white border-slate-200 shadow-xl
改为: bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl
```

**选项文字颜色**:
- `text-slate-700` → `text-white`
- Hover: `bg-indigo-50` → `bg-white/10`

### 1.5 AI Advisor Persona卡片 (约3231行)

**从**:
```tsx
border-slate-200 hover:border-slate-300
border-indigo-500 bg-indigo-50
```

**改为**:
```tsx
border-white/20 hover:border-white/30
border-indigo-400 bg-indigo-500/20
```

**文字颜色** (3235行):
- `text-slate-800` → `text-white`
- `text-slate-500` → `text-slate-400`

### 1.6 Textarea样式 (约3221行)

**从**:
```tsx
bg-white border border-slate-300 text-slate-800 placeholder-slate-400
```

**改为**:
```tsx
bg-white/5 border border-white/20 text-white placeholder-slate-500
```

### 1.7 底部按钮区域 (约3247行)

**从**:
```tsx
<div className="sticky bottom-0 bg-white -mx-6 px-6 pt-4 pb-6 -mb-6 border-t border-slate-200">
```

**改为**:
```tsx
<div className="sticky bottom-0 bg-white/10 backdrop-blur-md -mx-6 px-6 pt-4 pb-6 -mb-6 border-t border-white/20">
```

### 1.8 右侧主内容区域 (约3278行)

**从**:
```tsx
<main className="flex-1 bg-slate-50 overflow-y-auto pt-[72px]">
```

**改为**:
```tsx
<main className="flex-1 overflow-y-auto pt-[72px] relative z-10">
```

（背景已经在外层添加，这里不需要bg-slate-50）

### 1.9 AI Advisor响应气泡 (约3315-3333行)

**用户消息气泡**:
- 保持: `bg-indigo-600 text-white` (已经是深色)

**AI响应气泡**:
- 从: `bg-white border border-slate-200 shadow-sm`
- 改为: `bg-white/10 backdrop-blur-md border border-white/20 shadow-lg`
- 文字: `text-slate-800` → `text-white`
- 副文字: `text-slate-600` → `text-slate-300`
- 标签: `text-slate-400` → `text-slate-500`

---

## Phase 2: FreeCanvasPage优化 (components/FreeCanvasPage.tsx)

### 2.1 最外层容器添加背景 (约1544行)

**从**:
```tsx
<div className="flex flex-1 overflow-hidden">
```

**改为**:
```tsx
<div className="flex flex-1 overflow-hidden bg-black relative">
    {/* Background Image Layer */}
    <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
            alt="Mountain background" 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90" />
    </div>
```

### 2.2 左侧边栏毛玻璃效果 (约1545行)

**从**:
```tsx
<aside className="w-[380px] bg-white flex flex-col overflow-hidden flex-shrink-0 border-r border-slate-200">
```

**改为**:
```tsx
<aside className="w-[380px] bg-white/10 backdrop-blur-md flex flex-col overflow-hidden flex-shrink-0 border-r border-white/20 relative z-10">
```

### 2.3 侧边栏文字颜色 (约1549-1550行)

- `text-slate-800` → `text-white`
- `text-slate-500` → `text-slate-300`

### 2.4 工具面板背景 (约1565行)

**从**:
```tsx
<div className="bg-slate-50 rounded-2xl p-4 space-y-4">
```

**改为**:
```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-4">
```

### 2.5 工具面板文字颜色 (约1566行)

- `text-slate-800` → `text-white`
- `text-slate-700` → `text-slate-300`

### 2.6 工具切换按钮 (约1567-1573行)

**背景容器**:
- 从: `bg-slate-200`
- 改为: `bg-white/5`

**按钮样式**:
- 激活: 保持 `bg-white text-indigo-600 shadow-sm`
- 未激活: `text-slate-600 hover:bg-white/70` → `text-white hover:bg-white/20`

### 2.7 画笔设置组件 (约1578-1587行)

**颜色选择器**:
- 边框: `border-slate-300` → `border-white/20`

**滑块**:
- 背景: `bg-slate-200` → `bg-white/10`

**边框线**:
- `border-slate-200` → `border-white/20`

### 2.8 Prompt面板 (约1606行)

**背景**:
- 从: `bg-slate-50`
- 改为: `bg-white/10 backdrop-blur-md border border-white/20`

**Textarea** (1612行):
- 从: `bg-white border border-slate-300 text-slate-800 placeholder-slate-400`
- 改为: `bg-white/5 border border-white/20 text-white placeholder-slate-500`

### 2.9 底部按钮区 (约1617行)

**从**:
```tsx
<div className="p-6 pt-4 border-t border-slate-200">
```

**改为**:
```tsx
<div className="p-6 pt-4 border-t border-white/20">
```

### 2.10 上传进度指示器 (约1560行)

**成功状态**:
- 从: `bg-green-50 text-green-700`
- 改为: `bg-green-500/20 border border-green-400/30 text-green-300`

**加载状态**:
- 从: `bg-blue-50 text-blue-700`
- 改为: `bg-blue-500/20 border border-blue-400/30 text-blue-300`

### 2.11 主画布区域 (约1631行)

**从**:
```tsx
<main className="flex-1 p-8 pt-[104px] flex items-center justify-center bg-slate-50 relative">
```

**改为**:
```tsx
<main className="flex-1 p-8 pt-[104px] flex items-center justify-center relative z-10">
```

### 2.12 画布容器 (约1676行)

**从**:
```tsx
<div className="w-full max-h-full aspect-[4/5] bg-slate-100 border border-slate-200 shadow-inner rounded-3xl relative overflow-hidden">
```

**改为**:
```tsx
<div className="w-full max-h-full aspect-[4/5] bg-white/5 border border-white/20 shadow-inner rounded-3xl relative overflow-hidden">
```

### 2.13 画布空状态文字 (约1679-1682行)

- `text-slate-400` → `text-slate-500`
- `text-slate-600` → `text-white`

### 2.14 Clear按钮 (约1663行)

**保持现有样式** (白色背景+悬停变红色是很好的设计)

### 2.15 加载遮罩 (约1633-1634行)

**从**:
```tsx
bg-white/50 backdrop-blur-sm
<div className="... bg-white px-8 py-6 ...">
```

**改为**:
```tsx
bg-black/50 backdrop-blur-sm
<div className="... bg-white/10 backdrop-blur-md border border-white/20 px-8 py-6 ...">
```

**文字颜色**:
- `text-gray-800` → `text-white`
- `text-gray-600` → `text-slate-300`
- `text-gray-500` → `text-slate-400`
- `text-indigo-600` → `text-indigo-400`

### 2.16 Clear确认弹窗 (约397-398行)

**从**:
```tsx
bg-white/90 backdrop-blur-xl border border-slate-200
```

**改为**:
```tsx
bg-white/10 backdrop-blur-xl border border-white/20
```

**文字颜色** (400-402行):
- `text-slate-800` → `text-white`
- `text-slate-600` → `text-slate-300`

### 2.17 右侧图库边栏 (约235行)

**从**:
```tsx
bg-white border-l border-slate-200
```

**改为**:
```tsx
bg-white/10 backdrop-blur-md border-l border-white/20 relative z-10
```

### 2.18 图库边栏文字和组件 (约239-245行)

**标题**:
- `text-slate-800` → `text-white`

**视图切换按钮**:
- 容器: `bg-slate-200` → `bg-white/5`
- 激活: 保持 `bg-white text-indigo-600 shadow-sm`
- 未激活: `text-slate-500 hover:bg-slate-300` → `text-slate-400 hover:bg-white/20`

### 2.19 图库折叠按钮 (约224行)

**从**:
```tsx
bg-white border border-r-0 border-slate-300 hover:bg-slate-100 text-slate-500
```

**改为**:
```tsx
bg-white/20 backdrop-blur-sm border border-r-0 border-white/20 hover:bg-white/30 text-white
```

---

## 修改顺序

1. ✅ App.tsx - renderMainGenerator区域
2. ✅ App.tsx - CustomSelect组件
3. ✅ components/FreeCanvasPage.tsx - 主要区域
4. ✅ components/FreeCanvasPage.tsx - MyDesignsSidebar (右侧图库)

---

## 验证清单

### App.tsx主应用区域
- [ ] 左侧边栏使用毛玻璃效果，所有文字清晰可读
- [ ] CustomSelect下拉菜单使用毛玻璃效果
- [ ] 右侧主区域有山脉背景，内容清晰可见
- [ ] AI Advisor界面文字清晰
- [ ] 所有输入框和选择器适配深色背景

### FreeCanvasPage
- [ ] 左侧工具栏使用毛玻璃效果
- [ ] 右侧图库使用毛玻璃效果
- [ ] 中间画布区域背景适配
- [ ] 所有按钮和控件清晰可见
- [ ] 上传进度提示适配深色背景
- [ ] 加载状态遮罩适配深色背景
- [ ] Clear确认弹窗适配深色背景

---

## 注意事项

1. **渐进式修改**: 先修改App.tsx，测试无误后再修改FreeCanvasPage
2. **保持功能完整**: 只修改样式，不改变任何功能逻辑
3. **文字可读性**: 所有深色背景上的文字使用浅色（white/slate-300）
4. **输入框焦点**: 保持 `focus:ring-2 focus:ring-indigo-400` 效果
5. **按钮状态**: 禁用状态使用 `opacity-50` 或更浅的背景色
6. **Z-index管理**: 确保前景内容的 z-index 大于背景图层

