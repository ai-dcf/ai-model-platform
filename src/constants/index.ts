import { languageVendorPresets, type LanguageVendorType } from './language-vendor-presets';
import { imageVendorPresets, type ImageVendorType } from './image-vendor-presets';

export const vendorPresets = {
  ...languageVendorPresets,
  ...imageVendorPresets,
} as const;

export type VendorType = LanguageVendorType | ImageVendorType | 'custom';

export { languageVendorPresets, ImageVendorType, imageVendorPresets, LanguageVendorType };
