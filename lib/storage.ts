
export const vendorPresets = {
  aliyun: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      'qwen3.5-plus',
      'qwen3-max',
      'qwen3-coder-next',
      'qwen3-coder-plus',
      'kimi-k2.5',
      'glm-5',
      'glm-4.7',
      'minimax-m2.5',
    ],
  },
  volcengine: {
    name: '火山引擎',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/text/chat',
    models: [
      'Doubao-Seed-1.6',
      'Doubao-Seed-1.6-flash',
      'Doubao-Seed-1.6-thinking',
      'Doubao-pro-32k',
      'DeepSeek-R1',
      'DeepSeek-V3',
      'Hunyuan-Lite',
      'Hunyuan-Pro',
    ],
  },
  volcengine_conding_plan: {
    name: '火山引擎 Conding Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    models: [
      'doubao-seed-2.0-code',
      'doubao-seed-2.0-pro',
      'doubao-seed-2.0-lite',
      'doubao-seed-code',
      'minimax-m2.7',
      'glm-5.1',
      'glm-4.7',
      'deepseek-v3.2',
      'kimi-k2.6',
      'kimi-k2.5',
    ],
  },
} as const;

export type VendorType = keyof typeof vendorPresets | 'custom';

export type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';

export interface ModelItem {
  id: string;
  vendor: VendorType;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  remark?: string;
  enabled: boolean;
  createdAt: string;
  connectionStatus?: ConnectionStatus;
  lastTestedAt?: string;
}

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

export interface Conversation {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageHistoryItem {
  id: string;
  modelId: string;
  modelName: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  images: string[];
  createdAt: string;
}

export interface AppStorage {
  models: {
    text: ModelItem[];
    image: ModelItem[];
    video: ModelItem[];
  };
  conversations: {
    activeId: string;
    list: Conversation[];
  };
  imageHistory: ImageHistoryItem[];
  appToken: string;
  theme: 'minimal-art';
}

const STORAGE_KEY = 'ai-model-management-app';

const defaultStorage: AppStorage = {
  models: {
    text: [],
    image: [],
    video: [],
  },
  conversations: {
    activeId: '',
    list: [],
  },
  imageHistory: [],
  appToken: generateToken(),
  theme: 'minimal-art',
};

export function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function getStorage(): AppStorage {
  if (typeof window === 'undefined') {
    return { ...defaultStorage };
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load storage:', e);
  }
  return { ...defaultStorage };
}

export function saveStorage(storage: AppStorage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error('Failed to save storage:', e);
  }
}

export function getModelsByType(type: 'text' | 'image' | 'video'): ModelItem[] {
  if (typeof window === 'undefined') return [];
  const storage = getStorage();
  return storage.models[type] || [];
}

export function getEnabledModelsByType(type: 'text' | 'image' | 'video'): ModelItem[] {
  return getModelsByType(type).filter(m => m.enabled);
}

export function saveModel(type: 'text' | 'image' | 'video', model: ModelItem): void {
  const storage = getStorage();
  const index = storage.models[type].findIndex(m => m.id === model.id);
  if (index >= 0) {
    storage.models[type][index] = model;
  } else {
    storage.models[type].push(model);
  }
  saveStorage(storage);
}

export function deleteModel(type: 'text' | 'image' | 'video', modelId: string): void {
  const storage = getStorage();
  storage.models[type] = storage.models[type].filter(m => m.id !== modelId);
  saveStorage(storage);
}

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  const storage = getStorage();
  return storage.conversations.list || [];
}

export function getActiveConversation(): Conversation | null {
  if (typeof window === 'undefined') return null;
  const storage = getStorage();
  if (!storage.conversations.activeId) return null;
  return storage.conversations.list.find(c => c.id === storage.conversations.activeId) || null;
}

export function saveConversation(conversation: Conversation): void {
  const storage = getStorage();
  const index = storage.conversations.list.findIndex(c => c.id === conversation.id);
  if (index >= 0) {
    storage.conversations.list[index] = conversation;
  } else {
    storage.conversations.list.push(conversation);
  }
  storage.conversations.activeId = conversation.id;
  saveStorage(storage);
}

export function setActiveConversation(conversationId: string): void {
  const storage = getStorage();
  storage.conversations.activeId = conversationId;
  saveStorage(storage);
}

export function deleteConversation(conversationId: string): void {
  const storage = getStorage();
  storage.conversations.list = storage.conversations.list.filter(c => c.id !== conversationId);
  if (storage.conversations.activeId === conversationId) {
    storage.conversations.activeId = storage.conversations.list[0]?.id || '';
  }
  saveStorage(storage);
}

export function createNewConversation(modelId: string, modelName: string): Conversation {
  return {
    id: `conv-${Date.now()}`,
    name: '未命名会话',
    modelId,
    modelName,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getImageHistory(): ImageHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const storage = getStorage();
  return storage.imageHistory || [];
}

export function saveImageHistory(item: ImageHistoryItem): void {
  const storage = getStorage();
  storage.imageHistory.unshift(item);
  if (storage.imageHistory.length > 50) {
    storage.imageHistory = storage.imageHistory.slice(0, 50);
  }
  saveStorage(storage);
}

export function getAppToken(): string {
  if (typeof window === 'undefined') return 'server-token';
  const storage = getStorage();
  return storage.appToken;
}
