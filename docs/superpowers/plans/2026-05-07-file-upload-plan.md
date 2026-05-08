# 文件上传功能实施计划

> **创建时间**：2026-05-07
> **功能名称**：文件上传与附件管理
> **参考设计**：docs/superpowers/specs/2026-05-07-file-upload-design.md

**目标**：为 AI 多模型管理工具添加文件上传功能，支持图片和文档附件上传，用于发送给文本模型分析或作为图像生成参考。

**架构方案**：
- 使用 IndexedDB 存储文件（通过原生 IndexedDB API）
- 前端将文件转为 Base64 存储
- 扩展现有消息体支持附件
- 保持与现有语音录入功能的风格统一

**技术栈**：
- 原生 IndexedDB API（无需第三方库）
- Base64 编码
- React hooks
- TypeScript

---

## 文件结构

### 新建文件

- `lib/attachment.ts` - 附件存储模块（IndexedDB 操作）
- `components/FilePreview.tsx` - 文件预览组件
- `components/ChatInput.tsx` - 整合的输入组件

### 修改文件

- `lib/storage.ts:15-20` - 扩展 ChatMessage 接口添加 attachments 字段
- `app/chat/page.tsx:5` - 添加新图标导入
- `app/chat/page.tsx:56-66` - 添加附件相关状态
- `app/chat/page.tsx:113-238` - 修改 handleSend 函数支持附件
- `app/chat/page.tsx:568-626` - 重构底部输入区域
- `app/api/chat/route.ts:1-56` - 扩展 API 支持附件（保持兼容）

---

## 实施任务

### 任务 1：扩展数据模型

**文件**：
- 修改：`lib/storage.ts:15-20`

- [ ] **Step 1: 修改 ChatMessage 接口**

在 `lib/storage.ts` 的第 15-20 行，找到现有的 ChatMessage 接口并替换为：

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

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  modelName?: string;
  timestamp: string;
  attachments?: Attachment[];
}
```

- [ ] **Step 2: 验证类型修改**

确认 TypeScript 编译无错误：

```bash
npm run build 2>&1 | head -n 20
```

预期：应该只看到 Next.js 正常的构建输出，无 TypeScript 类型错误

- [ ] **Step 3: 提交**

```bash
git add lib/storage.ts
git commit -m "feat: extend ChatMessage with attachments field"
```

---

### 任务 2：创建附件存储模块

**文件**：
- 创建：`lib/attachment.ts`

- [ ] **Step 1: 创建 IndexedDB 存储模块**

创建 `lib/attachment.ts` 文件，内容：

```typescript
const DB_NAME = 'ai-model-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

export interface StoredAttachment {
  id: string;
  conversationId: string;
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  size: number;
  data: string;
  thumbnail?: string;
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function saveAttachment(
  conversationId: string,
  file: File
): Promise<StoredAttachment> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const attachment: StoredAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conversationId,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: reader.result as string,
        createdAt: new Date().toISOString(),
      };

      const request = store.add(attachment);

      request.onsuccess = () => resolve(attachment);
      request.onerror = () => reject(request.error);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getAttachmentsByConversation(
  conversationId: string
): Promise<StoredAttachment[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('conversationId');

    const request = index.getAll(conversationId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(attachmentId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAttachmentsByConversation(
  conversationId: string
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('conversationId');

    const request = index.getAllKeys(conversationId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

export function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 2: 验证文件创建**

确认文件已创建：

```bash
ls -la lib/attachment.ts
```

预期：文件存在

- [ ] **Step 3: 提交**

```bash
git add lib/attachment.ts
git commit -m "feat: add IndexedDB attachment storage module"
```

---

### 任务 3：创建文件预览组件

**文件**：
- 创建：`components/FilePreview.tsx`

- [ ] **Step 1: 创建 FilePreview 组件**

创建 `components/FilePreview.tsx` 文件，内容：

```typescript
'use client';

import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { StoredAttachment } from '../lib/attachment';

interface FilePreviewProps {
  attachments: StoredAttachment[];
  onRemove: (attachmentId: string) => void;
}

export default function FilePreview({ attachments, onRemove }: FilePreviewProps) {
  if (attachments.length === 0) return null;

  const maxDisplay = 9;
  const displayAttachments = attachments.slice(0, maxDisplay);
  const remainingCount = attachments.length - maxDisplay;

  return (
    <div className="glass-card rounded-xl p-3 mb-3">
      <div className="grid grid-cols-4 gap-2">
        {displayAttachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative group rounded-lg overflow-hidden bg-surface-lighter border border-border"
          >
            {attachment.type === 'image' ? (
              <div className="aspect-square">
                <img
                  src={attachment.data}
                  alt={attachment.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center p-2">
                <FileText className="w-8 h-8 text-text-muted mb-1" />
                <span className="text-xs text-text-muted truncate w-full text-center">
                  {attachment.name.length > 8
                    ? attachment.name.substring(0, 8) + '...'
                    : attachment.name}
                </span>
              </div>
            )}

            <button
              onClick={() => onRemove(attachment.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="aspect-square rounded-lg bg-surface-lighter border border-border flex items-center justify-center">
            <span className="text-sm text-text-muted">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证组件创建**

```bash
ls -la components/FilePreview.tsx
```

预期：文件存在

- [ ] **Step 3: 提交**

```bash
git add components/FilePreview.tsx
git commit -m "feat: add FilePreview component"
```

---

### 任务 4：创建 ChatInput 组件

**文件**：
- 创建：`components/ChatInput.tsx`

- [ ] **Step 1: 创建 ChatInput 组件**

创建 `components/ChatInput.tsx` 文件，内容：

```typescript
'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Upload, Mic, MicOff } from 'lucide-react';
import FilePreview from './FilePreview';
import { StoredAttachment } from '../lib/attachment';
import { saveAttachment, deleteAttachment } from '../lib/attachment';

interface ChatInputProps {
  value: string;
  attachments: StoredAttachment[];
  isLoading: boolean;
  isRecording: boolean;
  conversationId: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ChatInput({
  value,
  attachments,
  isLoading,
  isRecording,
  conversationId,
  onChange,
  onSend,
  onRemoveAttachment,
  onStartRecording,
  onStopRecording,
}: ChatInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError('');

      const validFiles: File[] = [];
      const newErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`"${file.name}" 超过 10MB 限制`);
          continue;
        }

        const isImage = file.type.startsWith('image/');
        const isAccepted =
          isImage ||
          file.type === 'application/pdf' ||
          ACCEPTED_TYPES.includes(`.${file.name.split('.').pop()?.toLowerCase()}`);

        if (!isAccepted) {
          newErrors.push(`不支持 "${file.name}" 格式`);
          continue;
        }

        validFiles.push(file);
      }

      if (newErrors.length > 0) {
        setError(newErrors[0]);
        setTimeout(() => setError(''), 3000);
      }

      for (const file of validFiles) {
        try {
          await saveAttachment(conversationId, file);
        } catch (err) {
          console.error('Failed to save attachment:', err);
          setError('文件上传失败，请重试');
          setTimeout(() => setError(''), 3000);
        }
      }

      window.dispatchEvent(new CustomEvent('attachment-added'));
    },
    [conversationId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const canSend = (value.trim() || attachments.length > 0) && !isLoading;

  return (
    <div
      className={`relative transition-all duration-200 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {error && (
        <div className="absolute -top-10 left-0 right-0 text-sm text-error text-center bg-error/10 py-1 rounded-lg">
          {error}
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-xl flex items-center justify-center z-10">
          <span className="text-primary font-medium">拖拽文件到此处上传</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FilePreview
          attachments={attachments}
          onRemove={onRemoveAttachment}
        />

        <div className="flex items-end gap-3">
          <div className="flex-1 glass-card rounded-xl p-3">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) onSend();
                }
              }}
              placeholder="输入消息..."
              className="w-full bg-transparent border-none outline-none resize-none text-text placeholder:text-text-dim max-h-32"
              rows={1}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-lighter hover:bg-surface-lighter/80 transition-colors"
              title="上传文件"
            >
              <Upload className="w-5 h-5 text-text-muted" />
            </button>

            {isRecording && (
              <span className="text-xs text-error animate-pulse hidden sm:inline">
                松开发送
              </span>
            )}

            <button
              onMouseDown={onStartRecording}
              onMouseUp={onStopRecording}
              onTouchStart={(e) => {
                e.preventDefault();
                onStartRecording();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onStopRecording();
              }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 touch-none select-none ${
                isRecording
                  ? 'bg-error hover:bg-error/80'
                  : 'bg-surface-lighter hover:bg-surface-lighter/80'
              }`}
              title={isRecording ? '松开发送' : '按住说话'}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-text-muted" />
              )}
            </button>

            <button
              onClick={onSend}
              disabled={!canSend}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                canSend
                  ? 'bg-gradient-to-br from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25'
                  : 'bg-surface-lighter text-text-dim cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证组件创建**

```bash
ls -la components/ChatInput.tsx
```

预期：文件存在

- [ ] **Step 3: 提交**

```bash
git add components/ChatInput.tsx
git commit -m "feat: add ChatInput component with file upload"
```

---

### 任务 5：集成到 Chat 页面

**文件**：
- 修改：`app/chat/page.tsx`

- [ ] **Step 1: 修改 chat/page.tsx**

需要修改以下部分：

1. 第 5 行：添加 Upload 图标导入
```typescript
import { Send, Plus, Trash2, RefreshCw, Copy, MoreHorizontal, Menu, X, Mic, MicOff, Upload } from 'lucide-react';
```

2. 第 56-66 行附近：在状态声明区域添加附件状态
```typescript
const [attachments, setAttachments] = useState<StoredAttachment[]>([]);
const messagesEndRef = useRef<HTMLDivElement>(null);
```

3. 添加附件加载和监听逻辑（在 useEffect 中）：
```typescript
useEffect(() => {
  // 加载附件
  const loadAttachments = async () => {
    if (activeConversation) {
      const atts = await getAttachmentsByConversation(activeConversation.id);
      setAttachments(atts);
    }
  };
  
  loadAttachments();

  // 监听附件添加事件
  const handleAttachmentAdded = () => {
    loadAttachments();
  };

  window.addEventListener('attachment-added', handleAttachmentAdded);
  return () => window.removeEventListener('attachment-added', handleAttachmentAdded);
}, [activeConversation?.id]);
```

4. 修改 handleSend 函数（大约在第 113-238 行）：在发送前获取附件数据

5. 修改底部输入区域（大约在第 568-626 行）：用 ChatInput 组件替换

```typescript
// 替换原来的 footer 部分为：
<footer className="p-4 glass-card border-t border-border">
  <ChatInput
    value={message}
    attachments={attachments}
    isLoading={isLoading}
    isRecording={isRecording}
    conversationId={activeConversation?.id || ''}
    onChange={setMessage}
    onSend={handleSend}
    onRemoveAttachment={handleRemoveAttachment}
    onStartRecording={startRecording}
    onStopRecording={stopRecording}
  />
</footer>
```

6. 添加 handleRemoveAttachment 函数：
```typescript
const handleRemoveAttachment = async (attachmentId: string) => {
  await deleteAttachment(attachmentId);
  setAttachments(attachments.filter(a => a.id !== attachmentId));
};
```

- [ ] **Step 2: 验证构建**

```bash
npm run build 2>&1 | tail -n 30
```

预期：构建成功，无错误

- [ ] **Step 3: 提交**

```bash
git add app/chat/page.tsx
git commit -m "feat: integrate file upload into chat page"
```

---

### 任务 6：扩展 API 支持附件

**文件**：
- 修改：`app/api/chat/route.ts`

- [ ] **Step 1: 查看当前 API 实现**

```bash
cat app/api/chat/route.ts
```

预期：显示当前的 chat API 代码

- [ ] **Step 2: 扩展 API 处理附件**

在现有的消息处理逻辑中，扩展支持 attachments 字段。当检测到消息包含 attachments 时，将其格式化为模型 API 支持的格式。

具体实现需要根据实际使用的 AI API 调整：
- 阿里云百炼支持直接传 Base64 图片
- 火山引擎部分模型支持多模态输入

基本框架：
```typescript
// 在构建 messages 数组时处理附件
const formattedMessages = messages.map(msg => {
  if (msg.attachments && msg.attachments.length > 0) {
    // 将附件格式化为模型支持格式
    // 例如：添加 image_url 字段
    return {
      ...msg,
      // 根据模型要求格式化附件
    };
  }
  return msg;
});
```

- [ ] **Step 3: 验证构建**

```bash
npm run build 2>&1 | tail -n 20
```

预期：构建成功

- [ ] **Step 4: 提交**

```bash
git add app/api/chat/route.ts
git commit -m "feat: extend chat API to support attachments"
```

---

### 任务 7：添加消息中的附件显示

**文件**：
- 修改：`app/chat/page.tsx`（消息展示部分）

- [ ] **Step 1: 在消息中显示附件**

在消息展示区域（约第 500-548 行），找到消息内容显示的位置，在 `<p className="whitespace-pre-wrap">{msg.content}</p>` 后面添加附件显示逻辑：

```typescript
{msg.attachments && msg.attachments.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {msg.attachments.map((att, idx) => (
      <div
        key={idx}
        className="rounded-lg overflow-hidden bg-surface-lighter border border-border"
      >
        {att.type === 'image' ? (
          <img
            src={att.data}
            alt={att.name}
            className="max-w-[200px] max-h-[200px] object-cover"
          />
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            <FileText className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">{att.name}</span>
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: 验证构建**

```bash
npm run build 2>&1 | tail -n 20
```

预期：构建成功

- [ ] **Step 3: 提交**

```bash
git add app/chat/page.tsx
git commit -m "feat: display attachments in chat messages"
```

---

### 任务 8：移动端适配

**文件**：
- 修改：`components/FilePreview.tsx`
- 修改：`components/ChatInput.tsx`

- [ ] **Step 1: 优化移动端布局**

在 `FilePreview.tsx` 中，将网格列数从 4 改为 3：
```typescript
<div className="grid grid-cols-3 md:grid-cols-4 gap-2">
```

在 `ChatInput.tsx` 中，调整按钮尺寸和间距：
```typescript
<button className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ...">
```

- [ ] **Step 2: 验证构建**

```bash
npm run build 2>&1 | tail -n 20
```

预期：构建成功

- [ ] **Step 3: 提交**

```bash
git add components/FilePreview.tsx components/ChatInput.tsx
git commit -m "feat: optimize file upload for mobile devices"
```

---

### 任务 9：整体测试

- [ ] **Step 1: 功能测试**

手动测试清单：
- [ ] 点击上传按钮选择单个文件
- [ ] 点击上传按钮选择多个文件
- [ ] 拖拽单个文件上传
- [ ] 拖拽多个文件上传
- [ ] 上传图片文件并查看缩略图
- [ ] 上传 PDF 文件并查看图标
- [ ] 删除单个文件
- [ ] 发送带附件的消息
- [ ] AI 返回结果正确显示
- [ ] 刷新页面后附件仍存在
- [ ] 切换会话后附件正确加载

- [ ] **Step 2: 移动端测试**

在移动设备或浏览器开发者工具中测试：
- [ ] 点击上传按钮正常工作
- [ ] 拖拽上传在触摸设备上可用
- [ ] 文件预览正确显示
- [ ] 布局适配正确

- [ ] **Step 3: 错误处理测试**

- [ ] 上传超大文件（>10MB）应有错误提示
- [ ] 上传不支持的文件类型应有错误提示
- [ ] 网络错误应有重试提示

- [ ] **Step 4: 提交最终版本**

```bash
git add -A
git commit -m "feat: complete file upload feature with attachments support"
```

---

## 实施总结

完成所有任务后，项目将具备以下功能：

1. **文件上传**：支持点击和拖拽上传图片和文档
2. **文件存储**：使用 IndexedDB 持久化存储附件
3. **预览管理**：文件预览、删除、多文件支持
4. **消息集成**：附件与消息一起发送给 AI 模型
5. **历史记录**：附件保存在会话中，可随时查看
6. **移动端适配**：响应式设计，支持触摸操作

---

## 执行选项

**计划完成并保存至**：`docs/superpowers/plans/2026-05-07-file-upload-plan.md`

**两种执行方式**：

1. **Subagent-Driven（推荐）** - 每个任务由新的子代理执行，任务间进行审查，快速迭代

2. **Inline Execution** - 在当前会话中执行任务，带检查点的批量执行

**您希望采用哪种方式？**
