
import { imageVendorPresets, type ImageVendorType } from './image-vendor-presets';
import { languageVendorPresets, type LanguageVendorType } from './language-vendor-presets';

export const vendorPresets = {
  ...languageVendorPresets,
  ...imageVendorPresets,
} as const;

export type VendorType = LanguageVendorType | ImageVendorType | 'custom';

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
    language: ModelItem[];
    image: ModelItem[];
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
    language: [],
    image: [],
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

export function getModelsByType(type: 'language' | 'image'): ModelItem[] {
  if (typeof window === 'undefined') return [];
  const storage = getStorage();
  return storage.models[type] || [];
}

export function getEnabledModelsByType(type: 'language' | 'image'): ModelItem[] {
  return getModelsByType(type).filter(m => m.enabled);
}

export function saveModel(type: 'language' | 'image', model: ModelItem): void {
  const storage = getStorage();
  const index = storage.models[type].findIndex(m => m.id === model.id);
  if (index >= 0) {
    storage.models[type][index] = model;
  } else {
    storage.models[type].push(model);
  }
  saveStorage(storage);
}

export function deleteModel(type: 'language' | 'image', modelId: string): void {
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

export interface GroupedConversations {
  label: string;
  items: Conversation[];
}

export function groupConversationsByDate(conversations: Conversation[]): GroupedConversations[] {
  const groups: { [key: string]: Conversation[] } = {
    '今天': [],
    '昨天': [],
    '7天内': [],
    '30天内': [],
    '更早': [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  conversations.forEach(conv => {
    const createdAt = new Date(conv.createdAt);
    if (createdAt >= today) {
      groups['今天'].push(conv);
    } else if (createdAt >= yesterday) {
      groups['昨天'].push(conv);
    } else if (createdAt >= sevenDaysAgo) {
      groups['7天内'].push(conv);
    } else if (createdAt >= thirtyDaysAgo) {
      groups['30天内'].push(conv);
    } else {
      groups['更早'].push(conv);
    }
  });

  return [
    { label: '今天', items: groups['今天'].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) },
    { label: '昨天', items: groups['昨天'].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) },
    { label: '7天内', items: groups['7天内'].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) },
    { label: '30天内', items: groups['30天内'].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) },
    { label: '更早', items: groups['更早'].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) },
  ].filter(group => group.items.length > 0);
}
