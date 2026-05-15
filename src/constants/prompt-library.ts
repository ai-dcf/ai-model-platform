import type { PromptLibraryConfig } from '@/types/prompt';

export const PROMPT_LIBRARY_STORAGE_KEY = 'prompt-library-config';

export const DEFAULT_PROMPT_LIBRARY_CONFIG: PromptLibraryConfig = {
  feishuDocUrl: '',
  feishuAccessToken: '',
};

export const CONTENT_PREVIEW_LENGTH = 100;
export const MAX_DISPLAY_TAGS = 3;
