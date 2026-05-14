# AI平台模块化架构重构 - 实施计划

**版本**: v1.0  
**日期**: 2026-05-14  
**状态**: 待执行  
**基于设计**: docs/superpowers/specs/2026-05-14-modular-architecture-redesign.md

---

## 📊 计划概览

**总工期**: 6 周  
**总任务数**: 15 个主要任务  
**风险等级**: 中等（分阶段，风险可控）

---

## 🎯 第一阶段：准备阶段（第 1 周）

### 1.1 创建新的目录结构

**任务描述**：
按照设计文档创建完整的目录结构框架，不包含实际代码文件。

**创建目录**：
```bash
# 场景目录
mkdir -p app/scenes/llm/{chat,image}/{components,hooks,services,types,api}
mkdir -p app/scenes/{prompt,design,video}/{components,hooks,services,types,api}
mkdir -p app/config/{components,hooks,services,types,api}

# 全局组件目录
mkdir -p components/{ui,layout,common}

# 全局库目录
mkdir -p lib/{storage,types,utils,constants,config}

# API 目录
mkdir -p api/scenes/{llm/{chat,image,video},prompt,design,config}

# 存储迁移目录
mkdir -p lib/storage/migrations
```

**验收标准**：
- [ ] 所有目录创建成功
- [ ] 目录结构与设计文档一致
- [ ] 可以通过 `tree` 命令查看完整结构

---

### 1.2 提取全局类型定义

**任务描述**：
将 `lib/storage.ts` 中的类型定义提取到独立文件。

**文件变更**：

1. **创建 `lib/types/models.ts`**
   ```typescript
   // 从 lib/storage.ts 提取
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

2. **创建 `lib/types/conversation.ts`**
   ```typescript
   // 从 lib/storage.ts 提取
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

3. **创建 `lib/types/attachment.ts`**
   ```typescript
   // 从 lib/storage.ts 提取
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

4. **创建 `lib/types/index.ts`**
   ```typescript
   // 统一导出
   export * from './models';
   export * from './conversation';
   export * from './attachment';
   
   // 通用 API 类型
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
将 `lib/storage.ts` 和 `lib/attachment.ts` 重构为独立的存储层。

**文件变更**：

1. **创建 `lib/storage/local.ts`**
   - 将 localStorage 操作封装
   - 提供统一的存储接口
   - 支持数据类型验证

2. **创建 `lib/storage/indexeddb.ts`**
   - 将 IndexedDB 操作封装
   - 提供 Promise 化的 API

3. **创建 `lib/storage/index.ts`**
   - 导出统一的存储接口
   - 提供存储初始化逻辑

**验收标准**：
- [ ] 存储层重构完成
- [ ] 数据持久化正常
- [ ] 性能无明显下降

---

### 1.4 创建共享组件库框架

**任务描述**：
创建全局 UI 组件库基础结构。

**创建文件**：

1. **基础 UI 组件** (`components/ui/`)
   - Button.tsx
   - Input.tsx
   - Modal.tsx
   - Toast.tsx
   - Select.tsx

2. **布局组件** (`components/layout/`)
   - Navbar.tsx（重构）
   - Sidebar.tsx
   - PageHeader.tsx

3. **通用组件** (`components/common/`)
   - EmptyState.tsx
   - LoadingSpinner.tsx
   - ErrorBoundary.tsx

**验收标准**：
- [ ] 组件库基础结构创建
- [ ] 组件可正常导入使用
- [ ] TypeScript 类型正确

---

## 🎯 第二阶段：场景模块重构（第 2-3 周）

### 2.1 创建场景模块布局

**任务描述**：
创建 `/app/scenes/llm/layout.tsx`，作为 chat 和 image 的共享布局。

**文件**：`app/scenes/llm/layout.tsx`

**功能**：
- 提供场景模块侧边栏
- 统一的场景导航（LLM、提示词、设计稿等）
- 响应式布局支持

**验收标准**：
- [ ] 布局组件正常工作
- [ ] 可以切换 chat 和 image
- [ ] 响应式显示正确

---

### 2.2 迁移对话功能

**任务描述**：
将 `app/chat/page.tsx` 迁移到 `app/scenes/llm/chat/`。

**迁移步骤**：

1. **复制并重构页面** (`app/scenes/llm/chat/page.tsx`)
   - 提取组件到 `components/`
   - 提取 hooks 到 `hooks/`
   - 提取服务到 `services/`
   - 提取类型到 `types/`

2. **创建组件** (`app/scenes/llm/chat/components/`)
   - ChatMessage.tsx
   - ChatInput.tsx
   - ConversationList.tsx
   - ConversationItem.tsx
   - TypingIndicator.tsx

3. **创建 Hooks** (`app/scenes/llm/chat/hooks/`)
   - useConversations.ts
   - useChatStream.ts
   - useSpeechRecognition.ts

4. **创建服务** (`app/scenes/llm/chat/services/`)
   - chat.service.ts

5. **创建类型** (`app/scenes/llm/chat/types/`)
   - index.ts

6. **创建 API 路由** (`app/scenes/llm/chat/api/route.ts`)
   - 从 `app/api/chat/route.ts` 重构

**验收标准**：
- [ ] 对话功能完整可用
- [ ] 历史记录正常保存
- [ ] 流式响应正常工作
- [ ] 语音识别功能正常

---

### 2.3 迁移图像生成功能

**任务描述**：
将 `app/image/page.tsx` 迁移到 `app/scenes/llm/image/`。

**迁移步骤**：

1. **复制并重构页面** (`app/scenes/llm/image/page.tsx`)
2. **创建组件** (`app/scenes/llm/image/components/`)
   - ImagePromptInput.tsx
   - AspectRatioSelector.tsx
   - ImageGrid.tsx
   - ImageCard.tsx
   - ImagePreview.tsx
3. **创建 Hooks** (`app/scenes/llm/image/hooks/`)
   - useImageGeneration.ts
   - useImageHistory.ts
4. **创建服务** (`app/scenes/llm/image/services/`)
   - image.service.ts
5. **创建类型** (`app/scenes/llm/image/types/`)
6. **创建 API 路由** (`app/scenes/llm/image/api/route.ts`)

**验收标准**：
- [ ] 图像生成功能正常
- [ ] 历史记录正常
- [ ] 预览和下载正常

---

### 2.4 重构 API 路由

**任务描述**：
将 API 路由重构到 `/api/scenes/llm/` 目录。

**文件变更**：

1. **创建 `/api/scenes/llm/chat/route.ts`**
   - 从 `/api/chat/route.ts` 重构
   - 添加统一的日志和错误处理

2. **创建 `/api/scenes/llm/image/route.ts`**
   - 从 `/api/image/route.ts` 重构

3. **创建 `/api/scenes/llm/video/route.ts`**
   - 预留视频生成 API

**验收标准**：
- [ ] API 路由重构完成
- [ ] 请求响应正常
- [ ] 错误处理正确

---

### 2.5 配置页面重构

**任务描述**：
重构 `app/config/page.tsx` 到新结构。

**文件变更**：
- `app/config/page.tsx`
- `app/config/components/` (新建)
- `app/config/hooks/` (新建)
- `app/config/services/` (新建)
- `app/config/types/` (新建)
- `app/config/api/test-connection/route.ts`

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
app/scenes/prompt/
├── page.tsx
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
├── types/
│   └── index.ts
└── api/
    └── route.ts
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
- [ ] 搜索过滤正常

---

### 3.2 开发提示词 API

**任务描述**：
创建提示词相关的 API 路由。

**API 端点**：
- `POST /api/scenes/prompt` - 创建模板
- `GET /api/scenes/prompt` - 获取模板列表
- `PUT /api/scenes/prompt/[id]` - 更新模板
- `DELETE /api/scenes/prompt/[id]` - 删除模板

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
app/scenes/design/
├── page.tsx
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
├── types/
│   └── index.ts
└── api/
    └── route.ts
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
- `POST /api/scenes/design/upload` - 上传文件
- `GET /api/scenes/design` - 获取文件列表
- `GET /api/scenes/design/[id]` - 获取文件详情
- `DELETE /api/scenes/design/[id]` - 删除文件

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
app/scenes/video/
├── page.tsx
├── components/
│   ├── VideoPromptInput.tsx
│   ├── VideoPreview.tsx
│   └── VideoSettings.tsx
├── hooks/
│   ├── useVideoGeneration.ts
│   └── useVideoHistory.ts
├── services/
│   └── video.service.ts
├── types/
│   └── index.ts
└── api/
    └── route.ts
```

**验收标准**：
- [ ] 目录结构创建
- [ ] 页面框架可用
- [ ] 可随时填充业务逻辑

---

### 5.2 创建开发规范文档

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
优化 TypeScript 配置，支持更严格的类型检查。

**文件**：`tsconfig.json`

**变更**：
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

### T2: ESLint 规则优化

**任务**：
添加项目特定的 ESLint 规则。

**文件**：
- `.eslintrc.json`
- `.eslintignore`

**规则**：
- 强制组件文件命名规范
- 强制函数返回值类型
- 禁止 any 类型

---

### T3: Git Hooks 配置

**任务**：
配置 pre-commit hooks 进行代码检查。

**工具**：Husky + lint-staged

**验收标准**：
- [ ] commit 前自动运行 lint
- [ ] TypeScript 检查通过

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
| 第1周 | 准备阶段 | 1.1-1.4 | 目录结构、全局类型、存储层、组件库 |
| 第2周 | 场景重构 | 2.1-2.3 | 场景布局、对话迁移、图像迁移 |
| 第3周 | 场景重构 | 2.4-2.5 | API重构、配置重构 |
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
**计划版本**: v1.0
