# AI平台模块化架构重构 - 实施计划

**版本**: v1.1  
**日期**: 2026-05-14  
**状态**: 待执行  
**基于设计**: docs/superpowers/specs/2026-05-14-modular-architecture-redesign.md

---

## 📊 计划概览

**总工期**: 6 周  
**总任务数**: 15 个主要任务  
**风险等级**: 中等（分阶段，风险可控）

**架构理念**：
- `app/` - 框架层（Next.js 路由、API、全局布局）- 保持稳定
- `src/` - 业务层（所有业务代码）- 持续演进

---

## 🎯 第一阶段：准备阶段（第 1 周）

### 1.1 创建新的目录结构

**任务描述**：
按照设计文档创建完整的目录结构框架（框架层 + 业务层）。

**创建目录**：
```bash
# ============ 框架层（app/）============

# 场景路由映射
mkdir -p app/scenes/llm/{chat,image}
mkdir -p app/scenes/{prompt,design,video}

# 配置页面
mkdir -p app/config

# API 路由
mkdir -p app/api/{llm/{chat,image},prompt,design,config}

# ============ 业务层（src/）============

# 业务场景
mkdir -p src/scenes/llm/{chat,image}/{components,hooks,services,types}
mkdir -p src/scenes/llm/shared
mkdir -p src/scenes/{prompt,design,video}/{components,hooks,services,types}

# 全局共享组件
mkdir -p src/components/{ui,layout,common}

# 业务库
mkdir -p src/lib/{storage/{migrations},utils,constants}

# 共享 hooks
mkdir -p src/hooks

# 全局类型
mkdir -p src/types
```

**验收标准**：
- [ ] 框架层目录创建成功
- [ ] 业务层目录创建成功
- [ ] 目录结构与设计文档一致

---

### 1.2 提取全局类型定义

**任务描述**：
将 `lib/storage.ts` 中的类型定义提取到 `src/types/`。

**文件变更**：

1. **创建 `src/types/models.ts`**
   ```typescript
   export type ModelType = 'language' | 'image' | 'video';
   export type VendorType = 'aliyun' | 'volcengine' | 'custom';
   export type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';
   
   export interface ModelItem {
     id: string;
     vendor: VendorType;
     type: ModelType;
     modelName: string;
     apiKey: string;
     baseUrl: string;
     remark?: string;
     enabled: boolean;
     createdAt: string;
     connectionStatus?: ConnectionStatus;
     lastTestedAt?: string;
   }
   ```

2. **创建 `src/types/conversation.ts`**
   ```typescript
   export interface Conversation {
     id: string;
     name: string;
     modelId: string;
     modelName: string;
     messages: ChatMessage[];
     createdAt: string;
     updatedAt: string;
   }
   
   export interface ChatMessage {
     role: 'system' | 'user' | 'assistant';
     content: string;
     modelName?: string;
     timestamp: string;
     attachments?: Attachment[];
   }
   ```

3. **创建 `src/types/attachment.ts`**
   ```typescript
   export interface Attachment {
     id: string;
     type: 'image' | 'file';
     name: string;
     mimeType: string;
     size: number;
     data: string;
     thumbnail?: string;
   }
   ```

4. **创建 `src/types/index.ts`**
   ```typescript
   export * from './models';
   export * from './conversation';
   export * from './attachment';
   
   export interface ApiResponse<T = any> {
     success: boolean;
     data?: T;
     error?: string;
     message?: string;
   }
   ```

**验收标准**：
- [ ] 新类型文件创建成功
- [ ] TypeScript 编译无错误
- [ ] 原有功能不受影响

---

### 1.3 重构存储层

**任务描述**：
将 `lib/storage.ts` 和 `lib/attachment.ts` 重构到 `src/lib/storage/`。

**文件变更**：

1. **创建 `src/lib/storage/local.ts`**
   - localStorage 操作封装
   - 统一的存储接口

2. **创建 `src/lib/storage/indexeddb.ts`**
   - IndexedDB 操作封装
   - Promise 化 API

3. **创建 `src/lib/storage/index.ts`**
   - 导出统一的存储接口
   - 提供存储初始化逻辑

**验收标准**：
- [ ] 存储层重构完成
- [ ] 数据持久化正常
- [ ] 性能无明显下降

---

### 1.4 迁移共享组件到 src/

**任务描述**：
将现有的 `components/` 迁移到 `src/components/`。

**文件变更**：

1. **移动到 `src/components/ui/`**（基础 UI）
   - Button.tsx
   - Input.tsx
   - Modal.tsx
   - Toast.tsx
   - Select.tsx

2. **移动到 `src/components/layout/`**（布局）
   - Navbar.tsx（重构）
   - Sidebar.tsx
   - PageHeader.tsx

3. **移动到 `src/components/common/`**（通用）
   - EmptyState.tsx
   - LoadingSpinner.tsx
   - ErrorBoundary.tsx

**验收标准**：
- [ ] 组件迁移成功
- [ ] 导入路径更新
- [ ] 功能正常

---

## 🎯 第二阶段：场景模块重构（第 2-3 周）

### 2.1 创建 LLM 场景布局

**任务描述**：
创建 `/app/scenes/llm/layout.tsx`，作为 chat 和 image 的共享布局。

**文件**：`app/scenes/llm/layout.tsx`

**功能**：
- 提供场景模块侧边栏
- 统一的场景导航
- 响应式布局支持

**验收标准**：
- [ ] 布局组件正常工作
- [ ] 可以切换 chat 和 image
- [ ] 响应式显示正确

---

### 2.2 迁移对话功能到业务层

**任务描述**：
将 `app/chat/page.tsx` 迁移到 `src/scenes/llm/chat/`。

**迁移步骤**：

1. **创建场景入口** (`src/scenes/llm/chat/index.tsx`)
   - 从现有 `app/chat/page.tsx` 重构
   - 提取组件到 `components/`
   - 提取 hooks 到 `hooks/`
   - 提取服务到 `services/`

2. **创建组件** (`src/scenes/llm/chat/components/`)
   - ChatMessage.tsx
   - ChatInput.tsx
   - ConversationList.tsx
   - ConversationItem.tsx
   - TypingIndicator.tsx

3. **创建 Hooks** (`src/scenes/llm/chat/hooks/`)
   - useConversations.ts
   - useChatStream.ts
   - useSpeechRecognition.ts

4. **创建服务** (`src/scenes/llm/chat/services/`)
   - chat.service.ts

5. **创建类型** (`src/scenes/llm/chat/types/`)
   - index.ts

6. **创建路由映射** (`app/scenes/llm/chat/page.tsx`)
   ```typescript
   export { default } from '@/scenes/llm/chat';
   ```

7. **重构 API 路由** (`app/api/llm/chat/route.ts`)
   - 从 `app/api/chat/route.ts` 重构

**验收标准**：
- [ ] 对话功能完整可用
- [ ] 历史记录正常保存
- [ ] 流式响应正常工作

---

### 2.3 迁移图像生成功能到业务层

**任务描述**：
将 `app/image/page.tsx` 迁移到 `src/scenes/llm/image/`。

**迁移步骤**：

1. **创建场景入口** (`src/scenes/llm/image/index.tsx`)
2. **创建组件** (`src/scenes/llm/image/components/`)
   - ImagePromptInput.tsx
   - AspectRatioSelector.tsx
   - ImageGrid.tsx
   - ImageCard.tsx
   - ImagePreview.tsx
3. **创建 Hooks** (`src/scenes/llm/image/hooks/`)
   - useImageGeneration.ts
   - useImageHistory.ts
4. **创建服务** (`src/scenes/llm/image/services/`)
   - image.service.ts
5. **创建类型** (`src/scenes/llm/image/types/`)
6. **创建路由映射** (`app/scenes/llm/image/page.tsx`)
7. **重构 API 路由** (`app/api/llm/image/route.ts`)

**验收标准**：
- [ ] 图像生成功能正常
- [ ] 历史记录正常
- [ ] 预览和下载正常

---

### 2.4 迁移配置页面到业务层

**任务描述**：
重构 `app/config/page.tsx` 到 `src/config/`。

**文件变更**：
- `src/config/index.tsx` - 场景入口
- `src/config/components/` (新建)
- `src/config/hooks/` (新建)
- `src/config/services/` (新建)
- `src/config/types/` (新建)
- `app/scenes/config/page.tsx` - 路由映射
- `app/api/config/test-connection/route.ts` - API

**验收标准**：
- [ ] 模型配置功能正常
- [ ] 连接测试正常
- [ ] 导入导出正常

---

## 🎯 第三阶段：提示词场景开发（第 4 周）

### 3.1 创建提示词场景框架

**任务描述**：
创建完整的提示词模板管理场景。

**文件结构**：
```
src/scenes/prompt/
├── index.tsx
├── components/
│   ├── PromptList.tsx
│   ├── PromptEditor.tsx
│   ├── PromptCategory.tsx
│   └── PromptPreview.tsx
├── hooks/
│   ├── usePromptTemplates.ts
│   └── usePromptCategories.ts
├── services/
│   └── prompt.service.ts
└── types/
    └── index.ts
```

**路由映射**：
```
app/scenes/prompt/page.tsx → export from '@/scenes/prompt'
app/api/prompt/route.ts → API 路由
```

**功能**：
- 提示词模板 CRUD
- 分类管理
- 模板搜索和过滤
- 模板收藏

**验收标准**：
- [ ] 模板创建成功
- [ ] 模板编辑正常
- [ ] 分类管理正常

---

### 3.2 开发提示词 API

**任务描述**：
创建提示词相关的 API 路由。

**API 端点**：
- `POST /api/prompt` - 创建模板
- `GET /api/prompt` - 获取模板列表
- `PUT /api/prompt/[id]` - 更新模板
- `DELETE /api/prompt/[id]` - 删除模板

**验收标准**：
- [ ] API 正常工作
- [ ] 数据持久化
- [ ] 错误处理正确

---

## 🎯 第四阶段：设计稿场景开发（第 5 周）

### 4.1 创建设计稿场景框架

**任务描述**：
创建设计稿文件管理场景。

**文件结构**：
```
src/scenes/design/
├── index.tsx
├── components/
│   ├── DesignList.tsx
│   ├── DesignUploader.tsx
│   ├── DesignViewer.tsx
│   └── DesignMetadata.tsx
├── hooks/
│   ├── useDesigns.ts
│   └── useDesignUpload.ts
├── services/
│   └── design.service.ts
└── types/
    └── index.ts
```

**路由映射**：
```
app/scenes/design/page.tsx → export from '@/scenes/design'
app/api/design/route.ts → API 路由
```

**功能**：
- 设计稿上传
- 文件列表管理
- 元数据编辑
- 预览功能

**验收标准**：
- [ ] 文件上传成功
- [ ] 文件列表显示正常
- [ ] 元数据编辑正常

---

### 4.2 开发设计稿 API

**任务描述**：
创建设计稿相关的 API 路由。

**API 端点**：
- `POST /api/design/upload` - 上传文件
- `GET /api/design` - 获取文件列表
- `GET /api/design/[id]` - 获取文件详情
- `DELETE /api/design/[id]` - 删除文件

**验收标准**：
- [ ] 文件上传正常
- [ ] 文件下载正常
- [ ] 文件删除正常

---

## 🎯 第五阶段：视频生成场景框架（第 6 周）

### 5.1 创建视频场景框架

**任务描述**：
创建视频生成场景的目录结构和基础文件。

**文件结构**：
```
src/scenes/video/
├── index.tsx
├── components/
│   ├── VideoPromptInput.tsx
│   ├── VideoPreview.tsx
│   └── VideoSettings.tsx
├── hooks/
│   ├── useVideoGeneration.ts
│   └── useVideoHistory.ts
├── services/
│   └── video.service.ts
└── types/
    └── index.ts
```

**路由映射**：
```
app/scenes/video/page.tsx → export from '@/scenes/video'
app/api/video/route.ts → API 路由（预留）
```

**验收标准**：
- [ ] 目录结构创建
- [ ] 页面框架可用
- [ ] 可随时填充业务逻辑

---

### 5.2 创建场景开发规范文档

**任务描述**：
编写视频场景开发规范，方便未来快速开发。

**文档内容**：
- 场景模块结构规范
- 组件命名规范
- API 设计规范
- 测试规范

**验收标准**：
- [ ] 规范文档完整
- [ ] 团队成员可按规范开发

---

## 🔧 技术任务

### T1: TypeScript 配置优化

**任务**：
优化 TypeScript 配置，支持路径别名。

**文件**：`tsconfig.json`

**变更**：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/scenes/*": ["src/scenes/*"],
      "@/components/*": ["src/components/*"],
      "@/lib/*": ["src/lib/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

---

### T2: 更新现有导入路径

**任务**：
更新所有现有文件的导入路径，从 `lib/` 改为 `src/`。

**命令**：
```bash
# 批量替换导入路径
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from '\''@/lib/|from '\''@/src/lib/|g'
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from '\''../lib/|from '\''../src/lib/|g'
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from '\''./lib/|from '\''./src/lib/|g'
```

**验收标准**：
- [ ] 所有导入路径更新
- [ ] TypeScript 无错误
- [ ] 功能正常

---

## ✅ 质量保证

### 测试策略

1. **单元测试**
   - 核心业务逻辑测试
   - 工具函数测试
   - 目标覆盖率 > 80%

2. **集成测试**
   - API 端点测试
   - 存储层测试

3. **E2E 测试**
   - 关键用户流程测试
   - 使用 Playwright

### 代码审查

- 所有 PR 必须经过代码审查
- 审查清单：
  - [ ] 代码符合规范
  - [ ] 有适当的测试
  - [ ] 文档已更新
  - [ ] TypeScript 无错误

---

## 📅 详细时间表

| 周次 | 阶段 | 任务 | 交付物 |
|------|------|------|--------|
| 第1周 | 准备阶段 | 1.1-1.4 | 目录结构、全局类型、存储层、组件迁移 |
| 第2周 | 场景重构 | 2.1-2.2 | 场景布局、对话迁移 |
| 第3周 | 场景重构 | 2.3-2.4 | 图像迁移、配置迁移 |
| 第4周 | 提示词场景 | 3.1-3.2 | 提示词功能完整 |
| 第5周 | 设计稿场景 | 4.1-4.2 | 设计稿功能完整 |
| 第6周 | 视频场景 | 5.1-5.2 | 视频场景框架 + 规范 |

---

## 🚨 风险缓解

### 风险1：功能回归
**措施**：
- 保持旧路由可访问
- 完整功能测试
- Feature Toggle

### 风险2：性能下降
**措施**：
- 使用 React.memo 优化
- 懒加载组件
- 监控 Lighthouse 分数

### 风险3：团队适应
**措施**：
- 编写开发规范文档
- 组织团队培训
- 提供代码示例

---

## 📊 成功指标

- ✅ 所有阶段按时完成
- ✅ TypeScript 零错误
- ✅ Lighthouse 性能 > 90
- ✅ 代码覆盖率 > 80%
- ✅ 团队满意度 > 90%

---

## 🔄 下一步行动

1. **审核本计划**
2. **确认时间表**
3. **分配资源**
4. **开始 Phase 1**

---

**计划制定日期**: 2026-05-14  
**计划版本**: v1.1
