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
