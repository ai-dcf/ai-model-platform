import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('ImageAPI');

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { modelConfig, prompt, negativePrompt, width, height, n } = body;

    if (!modelConfig || !prompt) {
      log.warn(`[${requestId}] 缺少必要参数`, { hasModelConfig: !!modelConfig, hasPrompt: !!prompt });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { apiKey, baseUrl } = modelConfig;

    log.info(`[${requestId}] 图像生成请求开始`, {
      baseUrl,
      prompt: prompt.substring(0, 100),
      negativePrompt: negativePrompt?.substring(0, 50) || 'none',
      width,
      height,
      n: n || 1,
    });

    const requestUrl = `${baseUrl}/images/generations`;
    log.debug(`[${requestId}] 请求地址`, { url: requestUrl });

    const requestBody = {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      n: n || 1,
      response_format: 'url',
    };
    log.debug(`[${requestId}] 请求参数`, { ...requestBody, prompt: prompt.substring(0, 100) });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (response.ok && data.data) {
      const images = data.data.map((item: { url: string }) => item.url);
      log.info(`[${requestId}] 图像生成成功`, {
        imageCount: images.length,
        duration: `${duration}ms`,
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
