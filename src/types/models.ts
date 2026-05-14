import type { ImageVendorType } from '@/constants';
import type { LanguageVendorType } from '@/constants';

export type VendorType = LanguageVendorType | ImageVendorType | 'custom';
export type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';
export type ModelType = 'language' | 'image' | 'video';

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

export interface AppModels {
  language: ModelItem[];
  image: ModelItem[];
}
