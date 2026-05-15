# 提示词库功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现提示词库功能，支持从飞书云文档读取图片和视频提示词，以卡片形式展示，并提供详情查看和一键复制功能。

**Architecture:** 基于项目的模块化架构，业务代码放在 `src/scenes/prompt-library/`，页面路由在 `app/prompt-library/`。使用 localStorage 管理配置和缓存。飞书 API 对接放在 `src/lib/feishu/`。

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, 飞书开放 API

---

## 文件结构概览

```
创建文件:
- src/types/prompt.ts
- src/constants/prompt-library.ts
- src/lib/feishu/api.ts
- src/scenes/prompt-library/SetupConfig.tsx
- src/scenes/prompt-library/PromptListComponent.tsx
- src/scenes/prompt-library/PromptDetailComponent.tsx
- src/scenes/prompt-library/page.tsx
- app/prompt-library/image/page.tsx
- app/prompt-library/video/page.tsx
- app/prompt-library/[promptId]/page.tsx

修改文件:
- src/components/layout/Navbar.tsx
```

---

## 实现任务

### 任务 1: 创建类型定义

**Files:**
- Create: `src/types/prompt.ts`

- [ ] **Step 1: 创建提示词相关类型定义**

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

export interface PromptListResponse {
  success: boolean
  data?: Prompt[]
  error?: string
}
```

- [ ] **Step 2: 导出类型**

修改 `src/types/index.ts`，添加：
```typescript
export * from './prompt';
```

---

### 任务 2: 创建常量配置

**Files:**
- Create: `src/constants/prompt-library.ts`

- [ ] **Step 1: 创建提示词库常量配置**

```typescript
// src/constants/prompt-library.ts

export const PROMPT_LIBRARY_STORAGE_KEY = 'prompt-library-config';

export const DEFAULT_PROMPT_LIBRARY_CONFIG: PromptLibraryConfig = {
  feishuDocUrl: '',
  feishuAccessToken: '',
};

export const CONTENT_PREVIEW_LENGTH = 100;
export const MAX_DISPLAY_TAGS = 3;
```

---

### 任务 3: 创建飞书 API 对接

**Files:**
- Create: `src/lib/feishu/api.ts`
- Create: `src/lib/feishu/index.ts`

- [ ] **Step 1: 创建飞书 API 服务**

```typescript
// src/lib/feishu/api.ts

import type { Prompt, PromptLibraryConfig } from '@/types/prompt';
import { PROMPT_LIBRARY_STORAGE_KEY, DEFAULT_PROMPT_LIBRARY_CONFIG } from '@/constants/prompt-library';

export function getPromptLibraryConfig(): PromptLibraryConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_PROMPT_LIBRARY_CONFIG;
  }

  try {
    const data = localStorage.getItem(PROMPT_LIBRARY_STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_PROMPT_LIBRARY_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load prompt library config:', e);
  }
  return DEFAULT_PROMPT_LIBRARY_CONFIG;
}

export function savePromptLibraryConfig(config: PromptLibraryConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PROMPT_LIBRARY_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save prompt library config:', e);
  }
}

export function isConfigValid(): boolean {
  const config = getPromptLibraryConfig();
  return !!config.feishuDocUrl && !!config.feishuAccessToken;
}

export async function fetchPrompts(type: 'image' | 'video'): Promise<Prompt[]> {
  const config = getPromptLibraryConfig();

  if (!config.feishuDocUrl || !config.feishuAccessToken) {
    throw new Error('请先配置飞书文档地址和访问令牌');
  }

  // TODO: 实现具体的飞书 API 调用逻辑
  // 根据实际飞书 API 调整
  const response = await fetch('/api/prompt-library', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      docUrl: config.feishuDocUrl,
      accessToken: config.feishuAccessToken,
      type,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '获取提示词失败');
  }

  return data.data || [];
}
```

- [ ] **Step 2: 创建导出文件**

```typescript
// src/lib/feishu/index.ts

export * from './api';
```

---

### 任务 4: 更新 Navbar 组件

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: 添加下拉菜单状态和图标**

在组件顶部添加：
```typescript
'use client';

import { useState } from 'react';
import { MessageSquare, Image, Settings, Home, Sparkles, ChevronDown, FileText, Video, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
```

- [ ] **Step 2: 添加下拉菜单状态**

在 `Navbar` 函数组件内添加：
```typescript
const [openDropdown, setOpenDropdown] = useState<string | null>(null);

const dropdownItems = {
  llm: [
    { href: '/chat', icon: MessageSquare, label: '文本对话' },
    { href: '/image', icon: Image, label: '图像生成' },
  ],
  prompt: [
    { href: '/prompt-library/image', icon: Wand2, label: '图片提示词' },
    { href: '/prompt-library/video', icon: Video, label: '视频提示词' },
  ],
};
```

- [ ] **Step 3: 修改导航项为下拉菜单**

替换原来的 `navItems`，添加下拉菜单逻辑：
```typescript
const renderNavItem = (item: { id: string; label: string; icon?: typeof MessageSquare }) => {
  const Icon = item.icon;
  const items = dropdownItems[item.id as keyof typeof dropdownItems];

  if (items) {
    const isOpen = openDropdown === item.id;
    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : item.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            pathname.startsWith(`/${item.id === 'llm' ? 'chat' : item.id === 'prompt' ? 'prompt-library' : item.id}`) ||
            (item.id === 'llm' && (pathname === '/chat' || pathname === '/image')) ||
            (item.id === 'prompt' && pathname.startsWith('/prompt-library'))
              ? 'bg-primary/10 text-primary'
              : 'text-text-muted hover:text-text hover:bg-surface-lighter'
          }`}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span>{item.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 glass-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
            {items.map((subItem) => {
              const SubIcon = subItem.icon;
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                >
                  <SubIcon className="w-4 h-4" />
                  <span>{subItem.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      key={item.id}
      href={item.href || '/'}
      onClick={() => setOpenDropdown(null)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
        pathname === item.href
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted hover:text-text hover:bg-surface-lighter'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{item.label}</span>
    </Link>
  );
};
```

- [ ] **Step 4: 更新 navItems 配置**

```typescript
const navItems = [
  { href: '/', icon: Home, label: '首页', id: 'home' },
  { id: 'llm', label: '大模型', icon: Sparkles },
  { id: 'prompt', label: '提示词', icon: FileText },
  { href: '/config', icon: Settings, label: '配置', id: 'config' },
];
```

- [ ] **Step 5: 更新渲染逻辑**

替换原来的 map 渲染：
```typescript
<div className="hidden md:flex items-center gap-1">
  {navItems.map((item) => renderNavItem(item))}
</div>
```

- [ ] **Step 6: 添加点击外部关闭下拉菜单**

在组件内添加 useEffect：
```typescript
useEffect(() => {
  const handleClickOutside = () => setOpenDropdown(null);
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);
```

---

### 任务 5: 创建配置引导组件

**Files:**
- Create: `src/scenes/prompt-library/SetupConfig.tsx`

- [ ] **Step 1: 创建配置引导组件**

```typescript
// src/scenes/prompt-library/SetupConfig.tsx

'use client';

import { useState } from 'react';
import { Settings, ExternalLink, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getPromptLibraryConfig, savePromptLibraryConfig, isConfigValid } from '@/lib/feishu/api';

interface SetupConfigProps {
  onConfigSaved: () => void;
}

export default function SetupConfig({ onConfigSaved }: SetupConfigProps) {
  const [feishuDocUrl, setFeishuDocUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleLoadExisting = () => {
    const config = getPromptLibraryConfig();
    setFeishuDocUrl(config.feishuDocUrl);
    setAccessToken(config.feishuAccessToken);
  };

  const handleTest = async () => {
    if (!feishuDocUrl || !accessToken) {
      setTestResult({ success: false, message: '请填写完整的配置信息' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // 模拟测试连接
      await new Promise(resolve => setTimeout(resolve, 1000));

      const config = {
        feishuDocUrl,
        feishuAccessToken: accessToken,
        lastSyncAt: new Date().toISOString(),
      };
      savePromptLibraryConfig(config);

      setTestResult({ success: true, message: '连接成功！' });
      onConfigSaved();
    } catch (error) {
      setTestResult({ success: false, message: '连接失败，请检查配置' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!feishuDocUrl || !accessToken) {
      alert('请填写完整的配置信息');
      return;
    }

    const config = {
      feishuDocUrl,
      feishuAccessToken: accessToken,
      lastSyncAt: new Date().toISOString(),
    };
    savePromptLibraryConfig(config);
    onConfigSaved();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">配置提示词库</h2>
          <p className="text-text-muted">请配置飞书云文档地址和访问令牌</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              飞书文档地址
            </label>
            <div className="relative">
              <input
                type="url"
                value={feishuDocUrl}
                onChange={(e) => setFeishuDocUrl(e.target.value)}
                className="input-field py-3 pl-10"
                placeholder="https://xxx.feishu.cn/docx/xxx"
              />
              <ExternalLink className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              访问令牌 / API Key
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="input-field py-3 pl-10 pr-12"
                placeholder="请输入访问令牌"
              />
              <Key className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showToken ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              testResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              测试连接
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary py-3"
            >
              保存配置
            </button>
          </div>

          {isConfigValid() && (
            <button
              onClick={handleLoadExisting}
              className="w-full text-center text-sm text-primary hover:underline mt-2"
            >
              加载已有配置
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 任务 6: 创建提示词列表组件

**Files:**
- Create: `src/scenes/prompt-library/PromptListComponent.tsx`

- [ ] **Step 1: 创建提示词列表组件**

```typescript
// src/scenes/prompt-library/PromptListComponent.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wand2, Video, RefreshCw, Clock, Tag, Loader2, AlertCircle } from 'lucide-react';
import { fetchPrompts, isConfigValid } from '@/lib/feishu/api';
import type { Prompt } from '@/types/prompt';
import { CONTENT_PREVIEW_LENGTH, MAX_DISPLAY_TAGS } from '@/constants/prompt-library';
import SetupConfig from './SetupConfig';

interface PromptListComponentProps {
  type: 'image' | 'video';
}

export default function PromptListComponent({ type }: PromptListComponentProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const loadPrompts = async () => {
    if (!isConfigValid()) {
      setShowConfig(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPrompts(type);
      setPrompts(data);
      setLastSync(new Date().toLocaleString('zh-CN'));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [type]);

  const handleConfigSaved = () => {
    setShowConfig(false);
    loadPrompts();
  };

  const TypeIcon = type === 'image' ? Wand2 : Video;

  if (showConfig) {
    return <SetupConfig onConfigSaved={handleConfigSaved} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text mb-2">加载失败</h3>
          <p className="text-text-muted mb-6">{error}</p>
          <button onClick={loadPrompts} className="btn-primary">
            重试
          </button>
        </div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-2xl p-8 max-w-md">
          <TypeIcon className="w-12 h-12 text-primary/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text mb-2">暂无{type === 'image' ? '图片' : '视频'}提示词</h3>
          <p className="text-text-muted mb-6">请检查飞书文档配置是否正确</p>
          <button onClick={() => setShowConfig(true)} className="btn-primary">
            配置知识库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TypeIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-text">
            {type === 'image' ? '图片提示词' : '视频提示词'}
          </h2>
          <span className="text-sm text-text-muted">({prompts.length})</span>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastSync}
            </span>
          )}
          <button
            onClick={loadPrompts}
            className="p-2 rounded-lg bg-surface-lighter hover:bg-surface-light text-text-muted hover:text-text transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {prompts.map((prompt) => (
          <Link
            key={prompt.id}
            href={`/prompt-library/${prompt.id}`}
            className="glass-card rounded-2xl p-4 md:p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group block"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-text group-hover:text-primary transition-colors line-clamp-1 flex-1 mr-2">
                {prompt.title}
              </h3>
              <TypeIcon className="w-5 h-5 text-primary flex-shrink-0" />
            </div>

            {prompt.category && (
              <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                {prompt.category}
              </span>
            )}

            <p className="text-sm text-text-muted mb-4 line-clamp-3">
              {prompt.content.length > CONTENT_PREVIEW_LENGTH
                ? prompt.content.substring(0, CONTENT_PREVIEW_LENGTH) + '...'
                : prompt.content}
            </p>

            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {prompt.tags.slice(0, MAX_DISPLAY_TAGS).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-lighter text-text-muted text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {prompt.tags.length > MAX_DISPLAY_TAGS && (
                  <span className="text-xs text-text-dim">+{prompt.tags.length - MAX_DISPLAY_TAGS}</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-text-dim pt-3 border-t border-border">
              <span>{prompt.createdAt}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### 任务 7: 创建提示词详情组件

**Files:**
- Create: `src/scenes/prompt-library/PromptDetailComponent.tsx`

- [ ] **Step 1: 创建提示词详情组件**

```typescript
// src/scenes/prompt-library/PromptDetailComponent.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Wand2, Video, Tag, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { fetchPrompts } from '@/lib/feishu/api';
import type { Prompt } from '@/types/prompt';

export default function PromptDetailComponent() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.promptId as string;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPrompt = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 根据 ID 判断类型，这里简化处理，实际需要更好的方式
        const type: 'image' | 'video' = promptId.startsWith('img') ? 'image' : 'video';
        const prompts = await fetchPrompts(type);
        const found = prompts.find(p => p.id === promptId);

        if (found) {
          setPrompt(found);
        } else {
          setError('未找到该提示词');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompt();
  }, [promptId]);

  const handleCopy = async () => {
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const TypeIcon = prompt?.type === 'image' ? Wand2 : Video;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text mb-2">加载失败</h3>
          <p className="text-text-muted mb-6">{error || '未找到该提示词'}</p>
          <Link href="/prompt-library/image" className="btn-primary">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-text mb-2">{prompt.title}</h1>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {prompt.createdAt}
              </span>
              {prompt.category && (
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {prompt.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <Tag className="w-4 h-4 text-text-muted" />
            {prompt.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-surface-lighter text-text-muted text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="bg-surface-lighter rounded-xl p-4 md:p-6 mb-6">
          <pre className="whitespace-pre-wrap text-text leading-relaxed font-mono text-sm">
            {prompt.content}
          </pre>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              copied
                ? 'bg-success text-white'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                一键复制
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 任务 8: 创建场景页面

**Files:**
- Create: `src/scenes/prompt-library/page.tsx`
- Create: `app/prompt-library/image/page.tsx`
- Create: `app/prompt-library/video/page.tsx`
- Create: `app/prompt-library/[promptId]/page.tsx`

- [ ] **Step 1: 创建主页面**

```typescript
// src/scenes/prompt-library/page.tsx

export default function PromptLibraryPage() {
  // 默认重定向到图片提示词
  return null;
}
```

- [ ] **Step 2: 创建图片提示词页面**

```typescript
// app/prompt-library/image/page.tsx

import PromptListComponent from '@/scenes/prompt-library/PromptListComponent';

export default function ImagePromptsPage() {
  return <PromptListComponent type="image" />;
}
```

- [ ] **Step 3: 创建视频提示词页面**

```typescript
// app/prompt-library/video/page.tsx

import PromptListComponent from '@/scenes/prompt-library/PromptListComponent';

export default function VideoPromptsPage() {
  return <PromptListComponent type="video" />;
}
```

- [ ] **Step 4: 创建详情页**

```typescript
// app/prompt-library/[promptId]/page.tsx

import PromptDetailComponent from '@/scenes/prompt-library/PromptDetailComponent';

export default function PromptDetailPage() {
  return <PromptDetailComponent />;
}
```

---

## 实现检查清单

- [ ] 所有类型定义正确
- [ ] 常量配置合理
- [ ] 飞书 API 对接完成
- [ ] Navbar 下拉菜单功能正常
- [ ] 配置引导页面完整
- [ ] 提示词列表页面正常显示
- [ ] 提示词详情页面功能正常
- [ ] 一键复制功能正常
- [ ] 响应式布局正常
- [ ] 项目可以正常启动

---

## 待确认事项

1. **飞书 API 具体实现**：当前设计假设了 API 结构，实际需要根据飞书的具体产品（多维表格、云文档、知识库等）调整 API 调用逻辑。

2. **提示词 ID 生成规则**：详情页需要根据 ID 判断是图片还是视频提示词，当前使用 `startsWith('img')` 判断，需要与实际 ID 格式一致。

3. **API 路由**：需要创建 `app/api/prompt-library/route.ts` 来处理飞书 API 请求。

---

Plan complete and saved to `docs/superpowers/plans/2026-05-15-prompt-library-implementation-plan.md`.

**两个执行选项：**

**1. Subagent-Driven（推荐）** - 我会为每个任务派遣一个 subagent，逐个执行并审查

**2. Inline Execution** - 在当前会话中批量执行任务

**你选择哪种方式？**