import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { imageModelConfigs, type ImageAspectRatio, type ImageSizeTier } from '@/lib/image-vendor-presets';

const log = createLogger('ImageAPI');

interface ModelConfig {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

interface ImageRequestBody {
  modelConfig?: ModelConfig;
  prompt?: string;
  width?: number;
  height?: number;
  sizeTier?: ImageSizeTier;
  n?: number;
  outputFormat?: string;
  responseFormat?: 'url' | 'b64_json';
  watermark?: boolean;
}

type SizePreset = {
  small: string;
  large: string;
};

const DEFAULT_ASPECT_RATIOS: Array<{ key: ImageAspectRatio; value: number }> = [
  { key: '1:1', value: 1 },
  { key: '4:3', value: 4 / 3 },
  { key: '3:4', value: 3 / 4 },
  { key: '16:9', value: 16 / 9 },
  { key: '9:16', value: 9 / 16 },
  { key: '3:2', value: 3 / 2 },
  { key: '2:3', value: 2 / 3 },
  { key: '21:9', value: 21 / 9 },
];

const DEFAULT_SIZE_PRESETS: Record<ImageAspectRatio, SizePreset> = {
  '1:1': { small: '1024x1024', large: '2048x2048' },
  '4:3': { small: '1152x864', large: '2304x1728' },
  '3:4': { small: '864x1152', large: '1728x2304' },
  '16:9': { small: '1280x720', large: '2848x1600' },
  '9:16': { small: '720x1280', large: '1600x2848' },
  '3:2': { small: '1248x832', large: '2496x1664' },
  '2:3': { small: '832x1248', large: '1664x2496' },
  '21:9': { small: '1512x648', large: '3136x1344' },
};

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  try {
    const body = (await request.json()) as ImageRequestBody;
    const {
      modelConfig,
      prompt,
      width,
      height,
      sizeTier,
      n,
      outputFormat,
      responseFormat = 'url',
      watermark = false,
    } = body;

    if (!modelConfig || !prompt?.trim()) {
      log.warn(`[${requestId}] 缺少必要参数`, { hasModelConfig: !!modelConfig, hasPrompt: !!prompt?.trim() });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { apiKey, baseUrl, modelName } = modelConfig;

    if (!apiKey || !baseUrl || !modelName) {
      log.warn(`[${requestId}] 缺少模型配置`, {
        hasApiKey: !!apiKey,
        hasBaseUrl: !!baseUrl,
        hasModelName: !!modelName,
      });
      return NextResponse.json({ success: false, message: '缺少模型配置' }, { status: 400 });
    }

    const normalizedPrompt = prompt.trim();
    const size = mapSize(width, height, modelName, sizeTier);
    const imageCount = clampImageCount(n);

    log.info(`[${requestId}] 图像生成请求开始`, {
      baseUrl,
      modelName,
      prompt: normalizedPrompt.substring(0, 100),
      width,
      height,
      sizeTier: sizeTier || 'default',
      size,
      requestedCount: n,
      imageCount,
      responseFormat,
      outputFormat: outputFormat || 'default',
      watermark,
    });

    const requestUrl = `${baseUrl}/images/generations`;
    log.debug(`[${requestId}] 请求地址`, { url: requestUrl });

    const requestBody: Record<string, unknown> = {
      model: modelName,
      prompt: normalizedPrompt,
      size,
      response_format: responseFormat,
      watermark,
    };

    if (outputFormat) {
      requestBody.output_format = outputFormat;
    }

    if (imageCount > 1) {
      requestBody.sequential_image_generation = 'auto';
      requestBody.sequential_image_generation_options = {
        max_images: imageCount,
      };
    } else {
      requestBody.sequential_image_generation = 'disabled';
    }

    log.debug(`[${requestId}] 请求参数`, {
      ...requestBody,
      prompt: normalizedPrompt.substring(0, 100),
    });

    const response = await fetch(requestUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(60000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json().catch(() => ({}));
    const duration = Date.now() - startTime;

    if (response.ok && Array.isArray(data.data)) {
      const images = data.data
        .map((item: { url?: string }) => item.url)
        .filter((url: string | undefined): url is string => typeof url === 'string' && url.length > 0);

      if (images.length === 0 && responseFormat === 'url') {
        log.error(`[${requestId}] 图像生成返回格式异常`, {
          duration: `${duration}ms`,
          responseKeys: Object.keys(data),
        });
        return NextResponse.json({ success: false, message: '未返回图片地址' }, { status: 500 });
      }

      log.info(`[${requestId}] 图像生成成功`, {
        imageCount: images.length,
        duration: `${duration}ms`,
        size,
      });
      return NextResponse.json({ success: true, images });
    } else {
      log.error(`[${requestId}] 图像生成失败`, {
        status: response.status,
        duration: `${duration}ms`,
        error: data.error || data,
      });
      return NextResponse.json({ success: false, message: data.error?.message || '生成失败' }, { status: 500 });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`[${requestId}] 请求异常`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    return NextResponse.json({ success: false, message: '请求失败' }, { status: 500 });
  }
}

function clampImageCount(count?: number) {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return 1;
  }

  return Math.min(Math.max(Math.floor(count), 1), 15);
}

function mapSize(width?: number, height?: number, modelName?: string, sizeTier?: ImageSizeTier) {
  const configuredSize = mapConfiguredModelSize(width, height, modelName, sizeTier);
  if (configuredSize) {
    return configuredSize;
  }

  if (!isPositiveNumber(width) || !isPositiveNumber(height)) {
    return DEFAULT_SIZE_PRESETS['1:1'].small;
  }

  const closestRatio = findClosestAspectRatio(width / height, DEFAULT_ASPECT_RATIOS);
  const preset = DEFAULT_SIZE_PRESETS[closestRatio];
  const useLargePreset = Math.max(width, height) > 1400;
  return useLargePreset ? preset.large : preset.small;
}

function mapConfiguredModelSize(
  width?: number,
  height?: number,
  modelName?: string,
  sizeTier?: ImageSizeTier,
) {
  if (!modelName) {
    return null;
  }

  const config = imageModelConfigs[modelName];
  if (!config || config.sizeStrategy !== 'tiered-ratio-table') {
    return null;
  }

  const ratio = isPositiveNumber(width) && isPositiveNumber(height)
    ? findClosestAspectRatio(
      width / height,
      config.supportedAspectRatios.map((key) => ({ key, value: aspectRatioToNumber(key) })),
    )
    : config.supportedAspectRatios[0];

  const resolvedTier = sizeTier && config.supportedTiers.includes(sizeTier)
    ? sizeTier
    : config.defaultTier;

  return config.sizeTable[resolvedTier][ratio];
}

function isPositiveNumber(value?: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function findClosestAspectRatio(
  target: number,
  candidates: Array<{ key: ImageAspectRatio; value: number }>,
) {
  return candidates.reduce((best, current) => {
    const bestDistance = Math.abs(best.value - target);
    const currentDistance = Math.abs(current.value - target);
    return currentDistance < bestDistance ? current : best;
  }).key;
}

function aspectRatioToNumber(aspectRatio: ImageAspectRatio) {
  const [width, height] = aspectRatio.split(':').map(Number);
  return width / height;
}
