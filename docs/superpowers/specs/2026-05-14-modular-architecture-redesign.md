# AI平台模块化架构重构设计方案

**版本**: v1.1  
**日期**: 2026-05-14  
**状态**: 待审核  
**作者**: AI Assistant

---

## 📋 执行摘要

本设计文档提出将当前 AI 平台项目从扁平化架构重构为**渐进式模块化架构**。通过将业务代码与公共框架代码分离，实现：

- ✅ **职责清晰** - 框架稳定，业务独立
- ✅ **易于扩展** - 业务场景独立，新增功能只需遵循规范
- ✅ **风险可控** - 分阶段迁移，不影响现有业务
- ✅ **团队协作** - 统一开发规范，降低沟通成本
- ✅ **长期可维护** - 便于未来拆分为 monorepo

---

## 📊 架构核心理念：代码分离

### 设计原则

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 项目                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │   app/           │    │   src/            │      │
│  │   (框架层)        │    │   (业务层)        │      │
│  ├──────────────────┤    ├──────────────────┤      │
│  │ 页面路由映射      │    │ 业务组件         │      │
│  │ API 路由         │    │ 业务逻辑         │      │
│  │ 全局布局         │    │ 业务 hooks       │      │
│  │                  │    │ 共享类型         │      │
│  │ 【保持稳定】      │    │ 存储层           │      │
│  │                  │    │ 工具函数         │      │
│  └──────────────────┘    └──────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 分层职责

| 层级 | 目录 | 职责 | 变更频率 |
|------|------|------|----------|
| **框架层** | `app/` | Next.js 路由、页面映射、API 路由、全局布局 | 低 |
| **业务层** | `src/` | 所有业务代码：组件、hooks、services、类型、工具 | 高 |

---

## 📁 重构目标目录结构

### 整体架构

```
/workspace
├── app/                              # 框架层（Next.js App Router）
│   ├── /scenes                      # 场景路由
│   │   ├── /llm
│   │   │   ├── chat/page.tsx       # 路由映射 → src/scenes/llm/chat
│   │   │   ├── image/page.tsx      # 路由映射 → src/scenes/llm/image
│   │   │   └── layout.tsx          # 场景布局
│   │   ├── /prompt/page.tsx        # 路由映射 → src/scenes/prompt
│   │   ├── /design/page.tsx        # 路由映射 → src/scenes/design
│   │   └── /video/page.tsx         # 路由映射 → src/scenes/video（未来）
│   ├── /config/page.tsx            # 配置页面
│   ├── layout.tsx                   # 根布局
│   └── page.tsx                     # 首页
│
├── src/                             # 业务层（所有业务代码）
    ├── /scenes                     # 业务场景
    ├── /components                 # 共享组件
    ├── /lib                        # 业务库
    ├── /hooks                      # 共享 hooks
    └── /types                      # 全局类型

```
app/
├── /scenes                      # 场景路由映射
│   ├── /llm
│   │   ├── chat/page.tsx       # → import from '@/scenes/llm/chat'
│   │   ├── image/page.tsx      # → import from '@/scenes/llm/image'
│   │   └── layout.tsx          # LLM 场景布局（导航）
│   ├── /prompt/page.tsx        # → import from '@/scenes/prompt'
│   ├── /design/page.tsx        # → import from '@/scenes/design'
│   └── /video/page.tsx         # → import from '@/scenes/video'（未来）
│
├── /config/page.tsx            # 模型配置页面
├── layout.tsx                   # 根布局（Navbar 等）
├── page.tsx                     # 首页
└── api/                        # API 路由（保持在 app/ 下）
    ├── /llm
    │   ├── chat/route.ts
    │   └── image/route.ts
    ├── /prompt/route.ts
    ├── /design/route.ts
    └── /config/route.ts
```

**框架层特点**：
- ✅ **页面组件只是路由映射**，导入实际组件
- ✅ **API 路由保持独立**，处理请求/响应
- ✅ **全局布局统一管理**
- ✅ **变更频率极低**

### 业务层详细结构（`src/`）

```
src/
├── /scenes                          # 业务场景（核心）
│   ├── /llm                        # 大模型场景
│   │   ├── /chat
│   │   │   ├── index.tsx          # 对话场景入口
│   │   │   ├── components/
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ConversationItem.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useConversations.ts
│   │   │   │   ├── useChatStream.ts
│   │   │   │   └── useSpeechRecognition.ts
│   │   │   ├── services/
│   │   │   │   └── chat.service.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   ├── /image
│   │   │   ├── index.tsx
│   │   │   ├── components/
│   │   │   │   ├── ImagePromptInput.tsx
│   │   │   │   ├── AspectRatioSelector.tsx
│   │   │   │   ├── ImageGrid.tsx
│   │   │   │   ├── ImageCard.tsx
│   │   │   │   └── ImagePreview.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useImageGeneration.ts
│   │   │   │   └── useImageHistory.ts
│   │   │   ├── services/
│   │   │   │   └── image.service.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   └── shared/                # LLM 场景共享组件
│   │       └── SceneHeader.tsx
│   │
│   ├── /prompt                    # 提示词场景
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── PromptList.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   ├── PromptCategory.tsx
│   │   │   └── PromptPreview.tsx
│   │   ├── hooks/
│   │   │   ├── usePromptTemplates.ts
│   │   │   └── usePromptCategories.ts
│   │   ├── services/
│   │   │   └── prompt.service.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── /design                    # 设计稿场景
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── DesignList.tsx
│   │   │   ├── DesignUploader.tsx
│   │   │   ├── DesignViewer.tsx
│   │   │   └── DesignMetadata.tsx
│   │   ├── hooks/
│   │   │   ├── useDesigns.ts
│   │   │   └── useDesignUpload.ts
│   │   ├── services/
│   │   │   └── design.service.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── /video                     # 视频生成场景（未来）
│       └── ...
│
├── /components                     # 全局共享组件
│   ├── /ui                       # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Select.tsx
│   │   └── ...
│   │
│   ├── /layout                   # 布局组件
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   │
│   └── /common                   # 通用业务组件
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── /lib                           # 业务库
│   ├── /storage                   # 存储层
│   │   ├── index.ts
│   │   ├── local.ts              # localStorage 封装
│   │   ├── indexeddb.ts          # IndexedDB 封装
│   │   └── migrations/            # 数据迁移脚本
│   │
│   ├── /utils                    # 工具函数
│   │   ├── logger.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   │
│   └── /constants                 # 常量定义
│       ├── vendors.ts             # AI 厂商配置
│       └── routes.ts              # 路由常量
│
├── /hooks                         # 共享 hooks
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── ...
│
└── /types                         # 全局类型
    ├── index.ts
    ├── models.ts                  # 模型配置类型
    ├── conversation.ts            # 会话类型
    ├── attachment.ts              # 附件类型
    └── api.ts                     # API 通用类型
```

**业务层特点**：
- ✅ **所有业务代码集中管理**
- ✅ **按场景和功能模块化**
- ✅ **变更频率高，但不影响框架层**
- ✅ **便于提取为独立包**
```

---

## 📐 场景开发规范

### 1. 场景结构模板

每个新业务场景必须包含以下目录结构（在 `src/scenes/` 下）：

```
/src/scenes/module-name
├── index.tsx                   # 场景入口（必须）
├── components/                 # 场景组件目录
│   ├── ComponentA.tsx         # 功能组件
│   └── ComponentB.tsx
├── hooks/                      # 场景自定义 Hooks
│   ├── useFeatureA.ts         # 业务 Hook
│   └── useFeatureB.ts
├── services/                   # 场景业务逻辑层
│   └── module.service.ts      # 服务文件
└── types/                     # 场景类型定义
    └── index.ts               # 导出所有类型
```

**注意**：API 路由保持在 `app/api/` 下，场景不直接包含 API 路由。

### 2. 路由映射规范

在 `app/scenes/` 下创建路由映射文件：

```
/app/scenes/module-name/page.tsx
```

```typescript
// app/scenes/module-name/page.tsx
export { default } from '@/scenes/module-name';
```

### 3. 类型定义规范

#### 必须导出标准接口

```typescript
// types/index.ts

// 模块特定类型
export interface ModuleData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// API 请求/响应类型
export interface ModuleRequest {
  param: string;
}

export interface ModuleResponse {
  success: boolean;
  data?: ModuleData;
  error?: string;
}

// 组件 Props 类型
export interface ModuleComponentProps {
  data: ModuleData;
  onAction: (id: string) => void;
}
```

### 3. 服务层规范

```typescript
// services/module.service.ts

import type { ModuleRequest, ModuleResponse } from '../types';

export class ModuleService {
  // 业务方法
  async fetchData(request: ModuleRequest): Promise<ModuleResponse> {
    try {
      const response = await fetch('/api/module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// 导出单例
export const moduleService = new ModuleService();
```

### 4. Hooks 规范

```typescript
// hooks/useModule.ts

import { useState, useCallback } from 'react';
import { moduleService } from '../services/module.service';
import type { ModuleData } from '../types';

export function useModule() {
  const [data, setData] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await moduleService.fetchData({});
    if (result.success && result.data) {
      setData(Array.isArray(result.data) ? result.data : [result.data]);
    } else {
      setError(result.error || 'Failed to fetch');
    }
    
    setLoading(false);
  }, []);

  return { data, loading, error, fetchData };
}
```

### 5. API 路由规范

```typescript
// api/route.ts

import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import type { ModuleRequest } from '../types';

const log = createLogger('ModuleAPI');

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    const body = (await request.json()) as ModuleRequest;
    
    // 业务逻辑
    log.info(`[${requestId}] Processing request`, body);
    
    return NextResponse.json({
      success: true,
      data: { /* response data */ }
    });
  } catch (error) {
    log.error(`[${requestId}] Request failed`, error);
    return NextResponse.json(
      { success: false, error: 'Request failed' },
      { status: 500 }
    );
  }
}
```

---

## 🔧 全局类型定义重构

### 新结构

```
src/types/
├── index.ts              # 统一导出
├── models.ts            # 模型配置类型
├── conversation.ts      # 会话类型
├── attachment.ts        # 附件类型
└── api.ts              # API 通用类型
```

### 类型定义示例

```typescript
// src/types/models.ts

export type ModelType = 'language' | 'image' | 'video';
export type VendorType = 'aliyun' | 'volcengine' | 'custom';

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

export type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

// src/types/conversation.ts

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

// src/types/attachment.ts

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

---

## 📁 存储层重构

### 目录结构

```
src/lib/storage/
├── index.ts              # 统一导出
├── local.ts             # localStorage 操作
├── indexeddb.ts         # IndexedDB 操作
└── migrations/          # 数据迁移脚本
    └── v1-to-v2.ts     # 版本迁移
```

### 统一存储接口

```typescript
// lib/storage/index.ts

export interface StorageAPI {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

// 具体实现
export { localStorageAPI } from './local';
export { indexedDBAPI } from './indexeddb';
```

---

## 🏗️ 组件设计规范

### 1. 全局共享组件位置

```
/components/
├── /ui                    # 基础 UI（Button, Input, Modal 等）
├── /layout               # 布局组件（Navbar, Sidebar）
└── /common               # 通用业务组件
```

### 2. 模块专用组件位置

每个模块的组件放在模块目录下：

```
/llm/chat/
├── components/
│   ├── ChatMessage.tsx    # 只在对话模块使用
│   └── ...
```

### 3. 组件设计原则

- ✅ 单一职责 - 每个组件只做一件事
- ✅ Props 类型化 - 使用 TypeScript 严格类型
- ✅ 可复用性 - 优先放在全局目录
- ✅ 纯展示组件 - 业务逻辑通过 Hooks 注入

---

## 🚀 迁移策略

### Phase 1: 准备阶段（第 1 周）

**任务**：
1. 创建新目录结构
2. 提取全局类型定义到 `/lib/types/`
3. 重构存储层到 `/lib/storage/`
4. 创建共享组件库

**交付物**：
- ✅ 新的目录结构
- ✅ 全局类型定义
- ✅ 统一存储接口

### Phase 2: 场景模块重构（第 2-3 周）

**任务**：
1. 创建 `/app/scenes/` 场景目录
2. 创建 `/app/scenes/llm/` 大模型场景结构
3. 迁移 `/app/chat/` 到 `/app/scenes/llm/chat/`
4. 迁移 `/app/image/` 到 `/app/scenes/llm/image/`
5. 重构 API 路由到 `/api/scenes/llm/`
6. 创建场景模块共享组件

**交付物**：
- ✅ `/app/scenes/` 场景目录完整
- ✅ 对话和图像功能正常工作
- ✅ 新目录结构稳定

### Phase 3: 提示词场景开发（第 4 周）

**任务**：
1. 创建 `/app/scenes/prompt/` 提示词场景
2. 实现提示词模板管理
3. 开发提示词 API

**交付物**：
- ✅ 提示词管理功能上线

### Phase 4: 设计稿场景开发（第 5 周）

**任务**：
1. 创建 `/app/scenes/design/` 设计稿场景
2. 实现设计稿上传和管理
3. 开发设计稿 API

**交付物**：
- ✅ 设计稿管理功能上线

### Phase 5: 视频生成场景框架（第 6 周）

**任务**：
1. 创建 `/app/scenes/video/` 视频生成场景框架
2. 定义场景模块结构规范
3. 预留 API 路由

**交付物**：
- ✅ 视频场景开发规范
- ✅ 可随时开始开发

---

## ⚠️ 风险控制

### 1. 功能回归风险

**措施**：
- 每个阶段完成后进行完整功能测试
- 保留旧路由作为 fallback
- 使用 Feature Toggle 控制功能开关

### 2. 数据迁移风险

**措施**：
- 实现数据迁移脚本
- 迁移前备份 localStorage
- 支持数据回滚

### 3. 用户体验中断风险

**措施**：
- 保持 URL 结构兼容或提供重定向
- 分阶段部署，逐步切换
- 监控用户反馈

---

## ✅ 验证步骤

### 1. 代码质量验证

```bash
# 类型检查
npm run typecheck

# ESLint 检查
npm run lint

# 构建测试
npm run build
```

### 2. 功能验证清单

- [ ] 首页正常加载
- [ ] 对话功能完整可用
- [ ] 图像生成功能完整可用
- [ ] 模型配置功能正常
- [ ] 数据持久化正常
- [ ] 响应式布局正常

### 3. 性能验证

- [ ] Lighthouse 性能评分 > 90
- [ ] 页面加载时间 < 2s
- [ ] API 响应时间 < 500ms

---

## 📊 成功标准

1. **可扩展性** - 新增视频生成模块 < 1 天
2. **可维护性** - 代码重复率 < 5%
3. **类型安全** - TypeScript 严格模式无错误
4. **测试覆盖** - 核心业务逻辑测试覆盖 > 80%

---

## 🔄 后续规划

1. **监控和日志** - 完善错误监控和性能监控
2. **CI/CD** - 自动化测试和部署流程
3. **文档** - 自动生成 API 文档和组件文档
4. **性能优化** - 按需加载和代码分割

---

**下一步行动**：

1. ✅ 审核并批准本设计方案
2. 📝 确认迁移优先级和时间表
3. 🚀 开始 Phase 1 实施

---

**文档版本历史**：

- v1.0 (2026-05-14) - 初始版本
