import type { ImageAspectRatio, ImageSizeTier } from '@/types';

type AspectRatioOption = {
  label: ImageAspectRatio;
  width: number;
  height: number;
  icon: string;
};

const DEFAULT_ASPECT_RATIO_KEYS: ImageAspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];

export const ASPECT_RATIO_OPTIONS: Record<ImageAspectRatio, AspectRatioOption> = {
  '1:1': { label: '1:1', width: 1024, height: 1024, icon: '□' },
  '4:3': { label: '4:3', width: 1024, height: 768, icon: '▭' },
  '3:4': { label: '3:4', width: 768, height: 1024, icon: '▯' },
  '16:9': { label: '16:9', width: 1920, height: 1080, icon: '▭' },
  '9:16': { label: '9:16', width: 1080, height: 1920, icon: '▯' },
  '3:2': { label: '3:2', width: 1248, height: 832, icon: '▭' },
  '2:3': { label: '2:3', width: 832, height: 1248, icon: '▯' },
  '21:9': { label: '21:9', width: 1512, height: 648, icon: '▭' },
};

type TieredRatioSizeConfig = {
  sizeStrategy: 'tiered-ratio-table';
  defaultTier: ImageSizeTier;
  supportedTiers: readonly ImageSizeTier[];
  supportedAspectRatios: readonly ImageAspectRatio[];
  sizeTable: Partial<Record<ImageSizeTier, Record<ImageAspectRatio, string>>>;
};

export const imageModelConfigs: Record<string, TieredRatioSizeConfig> = {
  'doubao-seedream-5.0-lite': {
    sizeStrategy: 'tiered-ratio-table',
    defaultTier: '2K',
    supportedTiers: ['2K', '3K', '4K'],
    supportedAspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'],
    sizeTable: {
      '2K': {
        '1:1': '2048x2048',
        '4:3': '2304x1728',
        '3:4': '1728x2304',
        '16:9': '2848x1600',
        '9:16': '1600x2848',
        '3:2': '2496x1664',
        '2:3': '1664x2496',
        '21:9': '3136x1344',
      },
      '3K': {
        '1:1': '3072x3072',
        '4:3': '3456x2592',
        '3:4': '2592x3456',
        '16:9': '4096x2304',
        '9:16': '2304x4096',
        '3:2': '3744x2496',
        '2:3': '2496x3744',
        '21:9': '4704x2016',
      },
      '4K': {
        '1:1': '4096x4096',
        '4:3': '4704x3520',
        '3:4': '3520x4704',
        '16:9': '5504x3040',
        '9:16': '3040x5504',
        '3:2': '4992x3328',
        '2:3': '3328x4992',
        '21:9': '6240x2656',
      },
    },
  },
};

export { DEFAULT_ASPECT_RATIO_KEYS };
