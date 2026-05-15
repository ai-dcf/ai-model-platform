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
