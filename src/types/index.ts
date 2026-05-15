export * from './models';
export * from './conversation';
export * from './image';
export * from './prompt';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppStorage {
  models: {
    language: import('./models').ModelItem[];
    image: import('./models').ModelItem[];
  };
  conversations: {
    activeId: string;
    list: import('./conversation').Conversation[];
  };
  imageConversations: {
    activeId: string;
    list: import('./conversation').Conversation[];
  };
  imageHistory: import('./image').ImageHistoryItem[];
  appToken: string;
  theme: 'minimal-art';
}
