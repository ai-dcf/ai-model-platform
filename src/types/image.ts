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
