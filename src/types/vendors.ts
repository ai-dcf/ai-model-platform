import { languageVendorPresets } from './language-vendor-type';
import { imageVendorPresets } from './image-vendor-type';

export const vendorPresets = {
  ...languageVendorPresets,
  ...imageVendorPresets,
} as const;

export { languageVendorPresets } from './language-vendor-type';
export { imageVendorPresets } from './image-vendor-type';
