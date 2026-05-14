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

export type ImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | '21:9';
export type ImageSizeTier = 'low' | 'medium' | 'high';
