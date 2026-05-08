# Chat Input UI 重新设计文档

> **创建时间**：2026-05-07
> **功能名称**：对话框和按钮图标 UI 重新设计
> **状态**：已确认

## 1. 设计概述

### 1.1 设计目标
- 优化对话框和按钮图标的布局与视觉设计
- 采用功能分组布局，提升交互清晰度
- 统一按钮风格，保持视觉一致性
- 简洁边框输入框，现代化外观

### 1.2 设计原则
- **功能分组**：将操作按钮按功能分组，左侧上传，右侧语音+发送
- **视觉统一**：所有按钮统一尺寸、圆角、图标大小
- **简洁现代**：细边框、圆角、适当的间距
- **交互反馈**：hover、active 状态有明确的视觉反馈

---

## 2. 布局设计

### 2.1 整体结构

```
┌─────────────────────────────────────────────────────────┐
│  ChatInput Container                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FilePreview (文件预览区)                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Input Area (输入框)                              │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │  Textarea (多行文本输入)                     │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Button Bar (按钮栏)                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │  Upload  │  │   Mic    │  │   Send   │       │   │
│  │  │  (📎)    │  │  (🎤)    │  │  (▶)     │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 布局规范

| 元素 | 位置 | 尺寸 | 间距 |
|------|------|------|------|
| 文件预览区 | 输入框上方 | 自适应高度 | margin-bottom: 12px |
| 输入框 | 中间 | 宽度 100%，高度自适应 | padding: 16px |
| 按钮栏 | 输入框下方 | 宽度 100%，高度 56px | margin-top: 12px |
| 按钮 | 按钮栏内 | 48x48px | gap: 12px |

---

## 3. 组件设计

### 3.1 输入框 (Input Area)

**样式规范：**
- 背景：`bg-white/5` (玻璃态效果)
- 边框：`border border-border/50`
- 圆角：`rounded-2xl` (16px)
- 内边距：`p-4` (16px)
- 最小高度：`min-h-[80px]`
- 最大高度：`max-h-[160px]`

**交互状态：**
- Focus：边框颜色变为主题色，添加轻微阴影
- Hover：边框颜色略微加深
- 过渡：`transition-all duration-200`

**文本样式：**
- 字体大小：`text-base`
- 行高：`leading-relaxed`
- 颜色：`text-text`
- Placeholder：`text-text-dim`

### 3.2 按钮 (Button)

**统一规范：**
- 尺寸：`w-12 h-12` (48x48px)
- 圆角：`rounded-xl` (12px)
- 图标尺寸：`w-5 h-5` (20x20px)

**按钮类型：**

| 按钮 | 图标 | 默认背景 | Hover背景 | Active背景 |
|------|------|----------|-----------|------------|
| 上传 | Upload | `bg-surface-lighter` | `bg-surface-lighter/80` | `bg-primary/10` |
| 语音 | Mic/MicOff | `bg-surface-lighter` | `bg-surface-lighter/80` | `bg-error` (录音时) |
| 发送 | Send | `bg-primary` | `bg-primary-dark` | `bg-primary/80` |

**发送按钮特殊样式：**
- 禁用状态：`bg-surface-lighter cursor-not-allowed`
- 启用状态：`bg-gradient-to-br from-primary to-primary-dark`
- 阴影：`hover:shadow-lg hover:shadow-primary/25`

### 3.3 按钮栏 (Button Bar)

**布局：**
- 显示：`flex items-center justify-between`
- 左侧：上传按钮
- 右侧：语音按钮 + 发送按钮（间距 12px）
- 内边距：`px-1` (按钮栏与容器边缘的间距)

---

## 4. 动效设计

### 4.1 按钮动效

**Hover 效果：**
- Scale：`transform scale-[1.02]`
- 背景色变化
- 过渡：`transition-all duration-200 ease-out`

**Active/Click 效果：**
- Scale：`transform scale-[0.95]`
- 过渡：`transition-transform duration-100`

**录音状态动效：**
- 脉冲动画：`animate-pulse`
- 背景色：红色渐变
- 图标：MicOff 图标

### 4.2 输入框动效

**Focus 效果：**
- 边框：`border-primary`
- 阴影：`shadow-sm shadow-primary/10`
- 过渡：`transition-all duration-200`

### 4.3 文件预览动效

**Hover 效果：**
- 删除按钮：`opacity-0` → `opacity-100`
- 过渡：`transition-opacity duration-200`

---

## 5. 响应式设计

### 5.1 移动端适配

**按钮尺寸：**
- 移动端：`w-11 h-11` (44x44px)
- 桌面端：`w-12 h-12` (48x48px)

**间距：**
- 移动端：按钮间距 `gap-2` (8px)
- 桌面端：按钮间距 `gap-3` (12px)

**输入框：**
- 移动端：内边距 `p-3` (12px)
- 桌面端：内边距 `p-4` (16px)

### 5.2 断点

- 移动端：< 640px
- 平板：640px - 1024px
- 桌面：> 1024px

---

## 6. 颜色规范

### 6.1 主题色

- 主色：`#6366f1` (indigo-500)
- 主色深色：`#4f46e5` (indigo-600)
- 错误色：`#ef4444` (red-500)

### 6.2 中性色

- 背景浅色：`#f8fafc` (slate-50)
- 背景深色：`#1e293b` (slate-800)
- 边框色：`#e2e8f0` (slate-200)
- 文字主色：`#0f172a` (slate-900)
- 文字次色：`#64748b` (slate-500)

---

## 7. 实现文件

### 7.1 修改文件

- `components/ChatInput.tsx` - 重构输入组件布局和样式
- `components/FilePreview.tsx` - 优化文件预览样式

### 7.2 关键类名

```css
/* 输入框 */
.input-area {
  @apply bg-white/5 border border-border/50 rounded-2xl p-4 
         min-h-[80px] max-h-[160px] transition-all duration-200
         focus:border-primary focus:shadow-sm focus:shadow-primary/10;
}

/* 按钮 */
.btn-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center
         bg-surface-lighter text-text-muted
         transition-all duration-200 ease-out
         hover:scale-[1.02] hover:bg-surface-lighter/80
         active:scale-[0.95];
}

/* 发送按钮 */
.btn-send {
  @apply w-12 h-12 rounded-xl flex items-center justify-center
         bg-gradient-to-br from-primary to-primary-dark text-white
         transition-all duration-200 ease-out
         hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25
         active:scale-[0.95]
         disabled:bg-surface-lighter disabled:text-text-dim disabled:cursor-not-allowed;
}

/* 按钮栏 */
.button-bar {
  @apply flex items-center justify-between px-1 mt-3 gap-3;
}

/* 按钮组 */
.button-group {
  @apply flex items-center gap-3;
}
```

---

## 8. 交互流程

### 8.1 正常状态

1. 用户看到输入框和按钮栏
2. 输入框有 placeholder 提示
3. 按钮处于默认状态

### 8.2 输入状态

1. 用户在输入框输入文字
2. 发送按钮变为启用状态（渐变背景）
3. 用户点击发送或按 Enter 发送消息

### 8.3 文件上传

1. 用户点击上传按钮
2. 选择文件后显示在预览区
3. 发送按钮变为启用状态
4. 发送时附件随消息一起发送

### 8.4 语音录入

1. 用户按住语音按钮
2. 按钮变为红色，显示脉冲动画
3. 松开按钮，语音转为文字填入输入框
4. 用户编辑后发送

---

## 9. 测试清单

### 9.1 功能测试

- [ ] 输入框可以正常输入文字
- [ ] 发送按钮在有内容时启用，无内容时禁用
- [ ] 上传按钮可以正常选择文件
- [ ] 语音按钮按住录音，松开后转文字
- [ ] 文件预览正常显示，可以删除

### 9.2 视觉测试

- [ ] 按钮样式统一，尺寸一致
- [ ] 输入框边框、圆角符合设计
- [ ] 按钮栏布局正确，左右分组
- [ ] Hover、Active 状态视觉反馈正确

### 9.3 响应式测试

- [ ] 移动端按钮尺寸正确
- [ ] 桌面端按钮尺寸正确
- [ ] 输入框在不同屏幕尺寸下自适应

---

## 10. 设计总结

本次 UI 重新设计主要改进：

1. **布局优化**：采用功能分组布局，左侧上传，右侧语音+发送
2. **视觉统一**：所有按钮统一尺寸（48x48px）、圆角（12px）、图标大小（20px）
3. **输入框简洁**：细边框、圆角、玻璃态效果，现代化外观
4. **交互丰富**：按钮 hover、active 状态有明确的视觉反馈
5. **响应式适配**：移动端和桌面端都有良好的显示效果
