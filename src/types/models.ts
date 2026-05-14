import type { ImageVendorType } from './image-vendor-type';
import type { LanguageVendorType } from './language-vendor-type';

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

export interface AppModels {
  language: ModelItem[];
  image: ModelItem[];
}
