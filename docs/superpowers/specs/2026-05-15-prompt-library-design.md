# 提示词库功能设计文档

## 概述

提示词库是一个基于飞书云文档知识库的提示词管理功能，支持查看图片提示词和视频提示词。

## 需求回顾

- **数据结构**：标准 - 标题 + 内容 + 分类 + 标签 + 创建时间 + 类型
- **接入方式**：仅展示（只读模式），从飞书读取数据
- **卡片展示**：网格布局
- **详情页功能**：仅查看内容 + 一键复制
- **配置方式**：填写访问地址 + 访问令牌/API Key
- **导航结构**：
  - 首页
  - 大模型（下拉菜单）
    - 文本对话
    - 图片生成
  - 提示词（下拉菜单）
    - 图片提示词
    - 视频提示词
  - 配置

## 架构设计

### 导航栏架构

更新顶部导航栏，支持下拉菜单。

### 模块结构

```
src/
├── components/layout/Navbar.tsx          ← 更新为带下拉菜单
├── scenes/
│   ├── llm/                              ← 保持不变
│   ├── config/                           ← 保持不变
│   └── prompt-library/
│       ├── ImagePromptsComponent.tsx     ← 图片提示词列表
│       ├── VideoPromptsComponent.tsx     ← 视频提示词列表
│       ├── PromptDetailComponent.tsx     ← 提示词详情
│       ├── SetupConfig.tsx               ← 配置引导页面
│       └── page.tsx
├── lib/feishu/
│   └── api.ts                            ← 飞书 API 对接
├── types/prompt.ts                       ← 提示词相关类型
└── constants/prompt-library.ts           ← 常量配置

app/
├── prompt-library/
│   ├── image/page.tsx
│   ├── video/page.tsx
│   └── [promptId]/page.tsx
└── layout.tsx                            ← 更新为新导航
```

## 数据结构定义

```typescript
// src/types/prompt.ts
export interface Prompt {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  type: 'image' | 'video'
}

export interface PromptLibraryConfig {
  feishuDocUrl: string
  feishuAccessToken: string
  lastSyncAt?: string
}
```

## 组件设计

### 1. Navbar 组件（更新）

**功能**：
- 支持下拉菜单
- 大模型下拉：文本对话、图片生成
- 提示词下拉：图片提示词、视频提示词

**路径**：`src/components/layout/Navbar.tsx`

### 2. 提示词列表组件

**功能**：
- 网格布局展示提示词卡片
- 加载状态
- 配置未设置时显示配置引导
- 点击卡片进入详情页

**卡片内容**：
- 标题
- 分类（标签样式）
- 标签列表
- 内容预览（截断）
- 创建时间

**路径**：
- `src/scenes/prompt-library/ImagePromptsComponent.tsx`
- `src/scenes/prompt-library/VideoPromptsComponent.tsx`

### 3. 提示词详情组件

**功能**：
- 完整内容展示
- 一键复制按钮
- 返回列表按钮

**路径**：`src/scenes/prompt-library/PromptDetailComponent.tsx`

### 4. 配置引导组件

**功能**：
- 输入飞书文档地址
- 输入访问令牌/API Key
- 保存配置
- 测试连接按钮

**路径**：`src/scenes/prompt-library/SetupConfig.tsx`

## 飞书 API 对接

### 功能设计

1. **配置管理**
   - 存储飞书文档地址和访问令牌
   - 使用 localStorage 存储

2. **数据读取**
   - 从飞书云文档读取提示词数据
   - 解析为 Prompt 数组
   - 按 type 过滤（image/video）

3. **缓存机制**
   - 本地缓存读取到的提示词数据
   - 避免频繁请求
   - 可手动刷新

### 飞书 API 接入（待确定）

**注意**：需要确认具体使用飞书的哪个产品/API（多维表格、云文档、知识库等）以及具体的 API 格式。当前设计假设可以通过 API 获取结构化的提示词数据。

## 状态管理

使用 localStorage 管理：
- 提示词库配置
- 提示词缓存数据

## 用户流程

1. 首次访问提示词库
2. 显示配置引导页面
3. 用户填写飞书文档地址和访问令牌
4. 测试连接并保存配置
5. 加载并显示提示词列表
6. 点击卡片查看详情
7. 在详情页可以一键复制提示词内容

## 样式设计

保持与项目现有风格一致：
- 使用现有的 `glass-card`、`btn-primary` 等类名
- 网格布局响应式设计
- 卡片悬停效果
