# Free Canvas 测试清单

**测试时间**: 2025年10月11日  
**版本**: v1.2 - Annotations 优化版

---

## ✅ 测试步骤

### 📋 测试 1: Annotations Only（标注工具单独使用）

**目的**: 验证标注工具不再卡住，AI 能正确理解

1. [ ] 打开 Free Canvas 页面
2. [ ] 上传一张带水印的图片
3. [ ] 选择 **Annotate** 工具
4. [ ] 标注 2 处水印位置（画框）
5. [ ] 在文本框输入：`清理这两处水印`
6. [ ] 点击 **Generate**
7. [ ] **打开浏览器 Console (F12)**
8. [ ] 检查日志：
   ```
   🚀 [Generate] Starting generation process
   📊 [Generate] Images: 1, Paths: 0, Annotations: 2
   🏷️ [Generate] 2 annotations detected:
     1. "1" - rect (150x200)
     2. "2" - rect (180x180)
   📝 [Prompt] Strategy: Annotations
   ✅ [Composite] Annotations drawn in <100ms
   ✅ [Composite] Converted in <3000ms
   ```
9. [ ] 确认**不卡住**，能正常生成
10. [ ] 检查生成的图片：
    - [ ] 水印已被清理
    - [ ] 框和编号已被完全移除

**预期结果**: ✅ 不卡住 + AI 理解并移除标记

---

### 📋 测试 2: Draw + Annotate（组合使用）

**目的**: 验证 Draw 和 Annotate 组合时 AI 的理解

1. [ ] 打开 Free Canvas 页面
2. [ ] 上传一张图片
3. [ ] 选择 **Draw** 工具
4. [ ] 画一些辅助标记（例如：圈出要修改的区域）
5. [ ] 选择 **Annotate** 工具
6. [ ] 标注 2 处需要编辑的位置
7. [ ] 在文本框输入：`根据标记修改图片`
8. [ ] 点击 **Generate**
9. [ ] 检查 Console 日志：
   ```
   📝 [Prompt] Paths: 3, Annotations: 2, Overlays: 0
   📝 [Prompt] Strategy: Combined
   ```
10. [ ] 确认生成的图片：
    - [ ] AI 理解了所有标记
    - [ ] 所有标记（框、画笔）都被移除

**预期结果**: ✅ Strategy: Combined + 所有标记被正确处理

---

### 📋 测试 3: 性能监控

**目的**: 确认性能优化生效

1. [ ] 执行测试 1 或测试 2
2. [ ] 在 Console 中查找以下日志：
   ```
   🏷️ [Composite] Drawing X annotations...
   🏷️ [Composite] Ann 1/2: "1" (rect) at (100, 200)
   ✅ [Composite] Annotations drawn in XXms
   🔄 [Composite] Converting to data URL...
   ✅ [Composite] Converted in XXXms: XXXkb
   ```
3. [ ] 检查时间：
   - [ ] Annotations 绘制 < 100ms ✅
   - [ ] toDataURL 转换 < 3000ms ✅
   - [ ] 如果 > 5000ms，会显示 ⚠️ 警告

**预期结果**: ✅ 性能在合理范围内

---

### 📋 测试 4: 输入验证

**目的**: 验证后端输入验证

#### 4A: 图像数量限制
1. [ ] 尝试上传或添加 **超过 3 张图像**
2. [ ] 点击 Generate
3. [ ] 检查错误信息：
   ```
   Error: Too many images
   Details: Maximum 3 reference images allowed
   ```

**预期结果**: ✅ 返回 400 错误，提示图像数量超限

#### 4B: 图像大小限制
1. [ ] 上传一张 **超过 7MB** 的图像
2. [ ] 点击 Generate
3. [ ] 检查后端日志（Vercel）：
   ```
   ❌ Image 1 too large: 8.5MB (max: 7MB)
   ```
4. [ ] 检查前端错误信息

**预期结果**: ✅ 返回 400 错误，提示图像过大

---

### 📋 测试 5: 错误处理

**目的**: 验证各种错误场景的处理

#### 5A: 无 prompt
1. [ ] 上传图片，不输入 prompt
2. [ ] 点击 Generate
3. [ ] 检查错误提示

#### 5B: 网络错误
1. [ ] 在生成过程中断开网络
2. [ ] 检查错误提示是否友好

#### 5C: 信用点不足
1. [ ] 使用信用点为 0 的账号
2. [ ] 尝试生成
3. [ ] 检查是否提示信用点不足

**预期结果**: ✅ 所有错误都有清晰提示

---

## 🔍 调试检查点

### 如果卡住了

1. **打开 Console (F12)**
2. **找到最后一条日志**：
   - 卡在 `🏷️ [Composite] Drawing annotations...` 之后
     → **原因**: Annotations 绘制
     → **解决**: 检查标注数量和图像大小
   
   - 卡在 `🔄 [Composite] Converting to data URL...` 之后
     → **原因**: toDataURL 转换
     → **解决**: 图像太大，需要压缩
   
   - 卡在 `🔍 [Generate] Step 3: Sending to API...` 之后
     → **原因**: 后端 API 问题
     → **解决**: 查看 Vercel 日志

3. **查看 Vercel 日志**:
   - 登录 Vercel Dashboard
   - 找到 `generate-image` function
   - 查看最新日志
   - 寻找 `❌` 标记的错误

---

## 📊 预期日志示例

### 完整的成功流程日志

```
🚀 [Generate] Starting generation process
📊 [Generate] Images: 1, Paths: 3, Annotations: 2
🏷️ [Generate] 2 annotations detected:
  1. "1" - rect (150x200)
  2. "2" - rect (180x180)
🔍 [Generate] Step 1: Creating composite
✅ [Composite] Base image loaded
✅ [Composite] 0 overlay images loaded
🏷️ [Composite] Drawing 2 annotations...
🏷️ [Composite] Ann 1/2: "1" (rect) at (100, 200)
🏷️ [Composite] Ann 2/2: "2" (rect) at (300, 400)
✅ [Composite] Annotations drawn in 45ms
🔄 [Composite] Converting to data URL...
📊 [Composite] Canvas: 1024x768 = 0.8MP
✅ [Composite] Converted in 1250ms: 850KB
✅ [Generate] Step 1: Complete
📝 [Prompt] Paths: 3, Annotations: 2, Overlays: 0
📝 [Prompt] Strategy: Combined
🔍 [Generate] Step 2: Validating
✅ [Generate] Step 2: Complete
📊 [Generate] Image size: 850KB
🔍 [Generate] Step 3: Sending to API...
✅ [Generate] Step 3: Complete
```

### 后端日志（Vercel）

```
✅ Credits deducted for user xxx: -5 (remaining: 95)
🔧 Initializing Google GenAI client for user xxx...
📝 Instruction: You are an expert inpainting...
📊 Image 1: 0.85MB
📤 Uploaded 1 images, calling Gemini API...
🤖 Using model: gemini-2.5-flash-image
📊 Response size: 1024KB
✅ Image generated successfully for user xxx
```

---

## ✅ 测试通过标准

- [ ] **Annotations Only** 不卡住，AI 正确理解
- [ ] **Draw + Annotate** 组合使用正常，prompt 策略正确
- [ ] **性能监控** 显示合理时间
- [ ] **输入验证** 正确拦截无效输入
- [ ] **错误处理** 提供清晰友好的错误信息
- [ ] **所有标记** 在生成结果中被完全移除

---

## 🐛 问题报告模板

如果发现问题，请提供以下信息：

```
**测试场景**: (测试 1/2/3/4/5)

**问题描述**: 
(描述发生了什么)

**浏览器 Console 日志**:
(复制最后 20 行日志)

**Vercel 日志** (如果有):
(复制后端错误日志)

**截图**:
(如果有视觉问题，提供截图)

**复现步骤**:
1. 
2. 
3. 
```

---

## 🎉 测试完成

所有测试通过后，Free Canvas 功能就完全正常了！🚀

**下一步**: 
- 在真实场景中使用
- 收集用户反馈
- 继续优化用户体验

