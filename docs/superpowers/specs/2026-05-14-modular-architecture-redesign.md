# AI平台模块化架构重构设计方案

**版本**: v1.0  
**日期**: 2026-05-14  
**状态**: 待审核  
**作者**: AI Assistant

---

## 📋 执行摘要

本设计文档提出将当前 AI 平台项目从扁平化架构重构为**渐进式模块化架构**。通过按业务域划分模块，实现：

- ✅ **职责清晰** - 每个模块高度内聚，边界明确
- ✅ **易于扩展** - 新增功能只需遵循规范创建模块
- ✅ **风险可控** - 分阶段迁移，不影响现有业务
- ✅ **团队协作** - 统一开发规范，降低沟通成本

---

## 📊 当前状态分析

### 现有架构问题

#### 1. 目录结构扁平化

```
/app
├── /chat/page.tsx        # 对话页面
├── /image/page.tsx       # 图像生成
├── /config/page.tsx      # 模型配置
├── /api/chat/route.ts    # 聊天API
├── /api/image/route.ts   # 图像API
├── /lib/storage.ts       # 存储逻辑
├── /lib/attachment.ts    # 附件逻辑
├── /lib/logger.ts        # 日志
└── /components/          # 全局组件
```

**问题**：
- 页面和业务逻辑混杂
- 类型定义与存储逻辑耦合
- API 路由包含业务逻辑
- 组件复用性低

#### 2. 核心类型分散

```typescript
// 当前：types 散落在 lib/storage.ts 中
interface ModelItem { ... }
interface Conversation { ... }
interface ChatMessage { ... }
interface Attachment { ... }
```

#### 3. 模块间耦合

- 页面直接调用 localStorage
- 缺少统一的业务逻辑层
- 组件直接处理数据请求

---

## 🎯 重构目标架构

### 目标目录结构

```
/app
├── /scenes                               # 场景目录（所有业务场景）
│   ├── /llm                             # 大模型场景
│   │   ├── /chat
│   │   │   ├── page.tsx                 # 页面入口
│   │   │   ├── components/              # 对话专用组件
│   │   │   │   ├── ChatMessage.tsx      # 消息气泡
│   │   │   │   ├── ChatInput.tsx        # 输入框
│   │   │   │   ├── ConversationList.tsx # 会话列表
│   │   │   │   ├── ConversationItem.tsx # 会话项
│   │   │   │   └── TypingIndicator.tsx  # 打字动画
│   │   │   ├── hooks/
│   │   │   │   ├── useConversations.ts  # 会话管理
│   │   │   │   ├── useChatStream.ts     # 流式对话
│   │   │   │   └── useSpeechRecognition.ts # 语音识别
│   │   │   ├── services/
│   │   │   │   └── chat.service.ts      # 聊天业务逻辑
│   │   │   ├── types/
│   │   │   │   └── index.ts             # 模块类型定义
│   │   │   └── api/
│   │   │       └── route.ts             # API 路由
│   │   │
│   │   ├── /image
│   │   │   ├── page.tsx                 # 页面入口
│   │   │   ├── components/
│   │   │   │   ├── ImagePromptInput.tsx # 提示词输入
│   │   │   │   ├── AspectRatioSelector.tsx # 尺寸选择
│   │   │   │   ├── ImageGrid.tsx        # 图像网格
│   │   │   │   ├── ImageCard.tsx        # 图像卡片
│   │   │   │   └── ImagePreview.tsx     # 大图预览
│   │   │   ├── hooks/
│   │   │   │   ├── useImageGeneration.ts # 图像生成
│   │   │   │   └── useImageHistory.ts    # 生成历史
│   │   │   ├── services/
│   │   │   │   └── image.service.ts     # 图像业务逻辑
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── api/
│   │   │       └── route.ts
│   │   │
│   │   └── layout.tsx                   # LLM 模块布局（侧边栏）
│   │
│   ├── /prompt                          # 提示词场景
│   │   ├── page.tsx
│   │   ├── components/
│   │   │   ├── PromptList.tsx          # 模板列表
│   │   │   ├── PromptEditor.tsx        # 模板编辑器
│   │   │   ├── PromptCategory.tsx      # 分类管理
│   │   │   └── PromptPreview.tsx        # 模板预览
│   │   ├── hooks/
│   │   │   ├── usePromptTemplates.ts    # 模板管理
│   │   │   └── usePromptCategories.ts   # 分类管理
│   │   ├── services/
│   │   │   └── prompt.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── api/
│   │       └── route.ts
│   │
│   ├── /design                          # 设计稿场景
│   │   ├── page.tsx
│   │   ├── components/
│   │   │   ├── DesignList.tsx          # 设计列表
│   │   │   ├── DesignUploader.tsx       # 上传组件
│   │   │   ├── DesignViewer.tsx         # 设计查看器
│   │   │   └── DesignMetadata.tsx       # 元数据编辑
│   │   ├── hooks/
│   │   │   ├── useDesigns.ts
│   │   │   └── useDesignUpload.ts
│   │   ├── services/
│   │   │   └── design.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── api/
│   │       └── route.ts
│   │
│   └── /video                           # 视频生成场景（未来）
│       └── ...
│
├── /config                              # 模型配置（独立模块）
│   ├── page.tsx
│   ├── components/
│   │   ├── ModelList.tsx              # 模型列表
│   │   ├── ModelForm.tsx              # 模型表单
│   │   ├── ModelCard.tsx              # 模型卡片
│   │   ├── ConnectionTest.tsx         # 连接测试
│   │   └── VendorSelector.tsx         # 厂商选择
│   ├── hooks/
│   │   ├── useModels.ts
│   │   └── useConnectionTest.ts
│   ├── services/
│   │   └── config.service.ts
│   ├── types/
│   │   └── index.ts
│   └── api/
│       └── /test-connection/route.ts   # 连接测试 API
│
├── layout.tsx                          # 根布局
├── page.tsx                             # 首页
│
├── /api                                # API 路由（统一组织）
│   ├── /scenes
│   │   ├── /llm
│   │   │   ├── /chat/route.ts          # 聊天 API
│   │   │   ├── /image/route.ts         # 图像 API
│   │   │   └── /video/route.ts         # 视频 API（未来）
│   │   ├── /prompt/route.ts            # 提示词 API
│   │   └── /design/route.ts            # 设计稿 API
│   └── /config/route.ts                # 配置 API
│
├── /components                         # 全局共享组件
│   ├── /ui                            # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   ├── /layout                        # 布局组件
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   └── /common                        # 通用业务组件
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
└── /lib                                # 全局库
    ├── /storage                        # 存储层
    │   ├── index.ts
    │   ├── local.ts                   # localStorage 封装
    │   ├── indexeddb.ts               # IndexedDB 封装
    │   └── migrations/                # 数据迁移
    ├── /types                         # 全局类型定义
    │   ├── index.ts
    │   ├── models.ts                  # 模型相关类型
    │   ├── conversation.ts            # 会话相关类型
    │   └── api.ts                     # API 相关类型
    ├── /utils                         # 工具函数
    │   ├── logger.ts
    │   ├── format.ts
    │   └── validation.ts
    ├── /constants                     # 常量定义
    │   ├── vendors.ts                 # AI 厂商配置
    │   └── routes.ts                  # 路由常量
    └── /config                        # 框架配置
        └── index.ts
```

---

## 📐 模块开发规范

### 1. 模块结构模板

每个新功能模块必须包含以下目录结构：

```
/module-name
├── page.tsx                    # 页面入口（必须）
├── layout.tsx                  # 模块布局（如需要）
├── components/                 # 组件目录
│   ├── ComponentA.tsx         # 功能组件
│   └── ComponentB.tsx
├── hooks/                      # 自定义 Hooks
│   ├── useFeatureA.ts         # 业务 Hook
│   └── useFeatureB.ts
├── services/                   # 业务逻辑层
│   └── module.service.ts       # 服务文件
├── types/                      # 类型定义
│   └── index.ts               # 导出所有类型
└── api/                        # API 路由（如需要）
    └── route.ts
```

### 2. 类型定义规范

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
/lib/types/
├── index.ts              # 统一导出
├── models.ts            # 模型配置类型
├── conversation.ts      # 会话类型
├── attachment.ts        # 附件类型
└── api.ts              # API 通用类型
```

### 类型定义示例

```typescript
// lib/types/models.ts

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

// lib/types/conversation.ts

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

// lib/types/attachment.ts

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
/lib/storage/
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
