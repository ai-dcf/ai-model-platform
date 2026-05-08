# 文件上传功能设计文档

> **创建时间**：2026-05-07
> **功能名称**：文件上传与附件管理
> **状态**：已确认

## 1. 概述与目标

本功能为 AI 多模型管理工具添加文件上传能力，支持用户上传图片和文档附件，用于：

- 发送给文本模型进行内容分析（问答、总结、翻译等）
- 作为图像生成的参考图

**核心约束**：

- 使用 IndexedDB 存储文件，支持大容量存储
- 支持点击上传和拖拽上传两种交互方式
- 文件保存到历史记录，可随时查看和复用
- 保持与现有语音录入功能的风格统一

---

## 2. 技术架构

### 2.1 技术选型

| 组件 | 技术方案 | 说明 |
|------|---------|------|
| 文件存储 | IndexedDB | 突破 LocalStorage 的 5MB 限制 |
| 存储库 | `idb` | 简化 IndexedDB 操作的 Promise 封装库 |
| 文件处理 | Base64 | 前端将文件转为 Base64 字符串存储 |
| API 传输 | 扩展现有 `/api/chat` | 消息体增加 `attachments` 字段 |

### 2.2 数据流向

```
用户选择文件
    ↓
读取文件内容 → 转为 Base64
    ↓
存储到 IndexedDB（关联会话ID）
    ↓
显示文件预览（缩略图/图标）
    ↓
用户点击发送
    ↓
从 IndexedDB 获取文件数据
    ↓
组装消息体（文本 + 附件）
    ↓
调用 /api/chat 接口
    ↓
模型返回结果 → 更新 UI
```

---

## 3. 数据模型

### 3.1 消息体扩展

**ChatMessage 接口**：

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  modelName?: string;
  timestamp: string;
  attachments?: Attachment[];  // 新增：附件列表
}

interface Attachment {
  id: string;           // 唯一标识
  type: 'image' | 'file';  // 文件类型
  name: string;         // 文件名
  mimeType: string;     // MIME 类型
  size: number;         // 文件大小（字节）
  data: string;         // Base64 数据
  thumbnail?: string;   // 缩略图（仅图片）
}
```

### 3.2 IndexedDB 表设计

**数据库名称**：`ai-model-app-db`

**表：attachments**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (PK) | 唯一标识，格式 `att-{timestamp}-{random}` |
| conversationId | string | 关联的会话ID |
| type | string | `image` 或 `file` |
| name | string | 原始文件名 |
| mimeType | string | 文件 MIME 类型 |
| size | number | 文件大小 |
| data | string | Base64 编码的文件数据 |
| createdAt | string | ISO 时间戳 |

---

## 4. API 设计

### 4.1 扩展 /api/chat 接口

**请求体**：

```json
{
  "modelConfig": {
    "vendor": "aliyun",
    "modelName": "qwen3.5-plus",
    "apiKey": "sk-xxx",
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  },
  "messages": [
    {
      "role": "user",
      "content": "请分析这张图片",
      "attachments": [
        {
          "type": "image",
          "name": "screenshot.png",
          "data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
        }
      ]
    }
  ],
  "stream": true
}
```

**处理逻辑**：

1. 检查 `messages` 中的 `attachments` 字段
2. 如果有附件，根据模型厂商格式化为对应的 API 请求格式
3. 部分模型（如阿里云百炼）支持直接传 Base64 图片
4. 部分模型可能需要先上传到对象存储获取 URL

**兼容性策略**：

- 当前主要对接的阿里云百炼、火山引擎等均支持 Base64 格式
- 如遇不支持的模型，提示用户选择其他模型或转换格式

---

## 5. UI/UX 设计

### 5.1 文件预览区

**位置**：文本输入框上方

**布局**：

```
┌─────────────────────────────────────────────────┐
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │  缩略图 │ │  缩略图 │ │  缩略图 │ │  +3   │     │
│ │  📄    │ │  📄    │ │  📄    │ │       │     │
│ └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                 │
│ [拖拽文件到此处上传]                             │
└─────────────────────────────────────────────────┘
```

**组件规格**：

- 容器：玻璃态卡片，圆角 16px，内边距 12px
- 网格布局：4 列，最小间距 8px
- 文件卡片：
  - 尺寸：80x80px
  - 图片：显示缩略图
  - 其他文件：显示文件图标 + 文件名（最多显示8字符）
  - 删除按钮：右上角红色 X 图标
- 拖拽状态：虚线边框 + 浅蓝色背景
- 最大显示数：9 个文件（超出显示 "+N"）

### 5.2 上传按钮

**位置**：输入框左侧，麦克风按钮右侧

**图标**：上传图标（Upload icon）

**交互**：

- 点击触发文件选择器
- 支持多选：`multiple` 属性
- 接受类型：
  - 图片：`image/jpeg,image/png,image/gif,image/webp`
  - 文档：`application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt`

### 5.3 拖拽上传

**触发区域**：文件预览区容器

**状态**：

- 默认：无特殊样式
- 拖拽进入：虚线边框 + `bg-primary/5` 背景 + 缩放动画
- 拖拽离开：恢复正常

**文件验证**：

- 类型检查：拒绝不支持的文件类型
- 大小限制：单个文件最大 10MB
- 数量限制：单次最多 9 个文件

### 5.4 错误提示

| 错误场景 | 提示文案 |
|---------|---------|
| 文件过大 | 文件 "{filename}" 超过 10MB 限制 |
| 不支持类型 | 不支持 "{filename}" 格式，请上传图片或文档 |
| 上传失败 | 文件上传失败，请重试 |
| 存储空间不足 | 存储空间不足，请清理历史文件 |

---

## 6. 功能模块划分

### 6.1 文件存储模块

**文件**：`/lib/storage.ts`（扩展）

**职责**：

- 初始化 IndexedDB 数据库
- 提供 `saveAttachment()`、`getAttachment()`、`deleteAttachment()` 等方法
- 管理附件与会话的关联关系

**关键函数**：

```typescript
// 初始化数据库
async function initDB(): Promise<IDBDatabase>

// 保存附件
async function saveAttachment(conversationId: string, file: File): Promise<Attachment>

// 获取会话的所有附件
async function getAttachmentsByConversation(conversationId: string): Promise<Attachment[]>

// 删除附件
async function deleteAttachment(attachmentId: string): Promise<void>

// 清理会话的所有附件
async function clearAttachmentsByConversation(conversationId: string): Promise<void>
```

### 6.2 文件预览组件

**文件**：`/components/FilePreview.tsx`（新建）

**职责**：

- 显示已上传文件的预览
- 处理文件删除操作
- 管理拖拽上传的交互状态

**Props**：

```typescript
interface FilePreviewProps {
  attachments: Attachment[];
  onRemove: (attachmentId: string) => void;
}
```

### 6.3 输入框组件

**文件**：`/components/ChatInput.tsx`（新建）

**职责**：

- 整合文本输入、文件上传、语音录入功能
- 处理文件选择和拖拽
- 管理附件状态

**Props**：

```typescript
interface ChatInputProps {
  value: string;
  attachments: Attachment[];
  isLoading: boolean;
  isRecording: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}
```

### 6.4 消息展示组件

**文件**：扩展 `/app/chat/page.tsx`

**职责**：

- 在消息中显示附件预览（图片直接显示，文件显示图标）
- 支持点击预览大图

---

## 7. 实现计划

### 阶段一：基础设施

1. 安装 `idb` 依赖
2. 扩展 `lib/storage.ts` 添加 IndexedDB 操作
3. 扩展 `lib/storage.ts` 添加 Attachment 相关类型

### 阶段二：UI 组件

4. 创建 `FilePreview.tsx` 组件
5. 创建 `ChatInput.tsx` 组件
6. 集成到 `app/chat/page.tsx`

### 阶段三：功能完善

7. 扩展消息体支持附件
8. 更新 API 调用逻辑
9. 添加错误处理和提示
10. 移动端适配优化

### 阶段四：测试与优化

11. 功能测试
12. 移动端测试
13. 性能优化（图片压缩、懒加载等）

---

## 8. 测试用例

### 8.1 文件上传测试

- [ ] 点击上传按钮选择单个文件
- [ ] 点击上传按钮选择多个文件
- [ ] 拖拽单个文件上传
- [ ] 拖拽多个文件上传
- [ ] 上传图片文件
- [ ] 上传 PDF 文件
- [ ] 上传不支持的文件类型（应有错误提示）

### 8.2 文件预览测试

- [ ] 上传后显示文件缩略图/图标
- [ ] 删除单个文件
- [ ] 图片显示正确缩略图
- [ ] 文件名过长时正确截断

### 8.3 消息发送测试

- [ ] 发送带附件的消息
- [ ] 发送纯文本消息（不受影响）
- [ ] 发送时清空已上传的附件
- [ ] AI 返回结果正确显示

### 8.4 历史记录测试

- [ ] 刷新页面后附件仍存在
- [ ] 切换会话后附件正确加载
- [ ] 删除会话后附件正确清理

---

## 9. 已知限制

1. **Base64 大小**：部分 AI API 对 Base64 编码的大小有限制，建议单张图片不超过 4MB
2. **浏览器兼容性**：IndexedDB 在所有现代浏览器中都支持，无需担心
3. **移动端性能**：大文件在移动端可能处理较慢，考虑添加进度提示

---

## 10. 未来扩展

- 支持文件下载功能
- 支持文件夹上传
- 支持粘贴截图上传（Ctrl+V）
- 支持直接拖拽图片到聊天区域
- 添加图片压缩选项
