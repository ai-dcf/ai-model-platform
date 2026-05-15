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
