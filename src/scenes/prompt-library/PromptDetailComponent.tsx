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
        const type: 'image' | 'video' = promptId.startsWith('img') ? 'image' : 'video';
        const prompts = await fetchPrompts(type);
        const found = prompts.find(p => p.id === promptId);

        if (found) {
          setPrompt(found);
        } else {
          const otherType: 'image' | 'video' = type === 'image' ? 'video' : 'image';
          const otherPrompts = await fetchPrompts(otherType);
          const otherFound = otherPrompts.find(p => p.id === promptId);
          if (otherFound) {
            setPrompt(otherFound);
          } else {
            setError('未找到该提示词');
          }
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
