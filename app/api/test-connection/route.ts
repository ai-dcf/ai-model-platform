import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('TestConnection');

interface ModelConfig {
  vendor: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
}

export async function POST(request: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { modelConfig, type } = body as { modelConfig: ModelConfig; type: 'text' | 'image' };

    if (!modelConfig || !modelConfig.apiKey || !modelConfig.baseUrl || !modelConfig.modelName) {
      log.warn(`[${requestId}] 缺少必要的配置信息`, {
        hasApiKey: !!modelConfig?.apiKey,
        hasBaseUrl: !!modelConfig?.baseUrl,
        hasModelName: !!modelConfig?.modelName,
      });
      return NextResponse.json(
        { success: false, message: '缺少必要的配置信息' },
        { status: 400 }
      );
    }

    const { vendor, apiKey, baseUrl, modelName } = modelConfig;

    log.info(`[${requestId}] 连接测试开始`, { vendor, modelName, baseUrl, type });

    const startTimeInner = Date.now();

    if (type === 'image') {
      const testUrl = `${baseUrl}/v1/models`;
      log.debug(`[${requestId}] 图像模型测试 - 请求模型列表`, { url: testUrl });

      const response = await fetch(testUrl, {
        signal: AbortSignal.timeout(30000),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const duration = Date.now() - startTime;
        log.error(`[${requestId}] 图像模型测试失败`, {
          status: response.status,
          duration: `${duration}ms`,
          error: errorData,
        });
        return NextResponse.json({
          success: false,
          message: getErrorMessage(response.status, errorData),
        }, { status: response.status });
      }

      const latency = Date.now() - startTimeInner;
      const duration = Date.now() - startTime;
      log.info(`[${requestId}] 图像模型测试成功`, { latency: `${latency}ms`, duration: `${duration}ms` });
      return NextResponse.json({
        success: true,
        message: '连接成功',
        latency,
      });
    }

    const chatUrl = `${baseUrl}/chat/completions`;
    log.debug(`[${requestId}] 文本模型测试 - 发送测试消息`, { url: chatUrl, model: modelName });

    const chatResponse = await fetch(chatUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: '你好，请回复"连接测试成功"。',
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json().catch(() => ({}));
      const duration = Date.now() - startTime;
      log.error(`[${requestId}] 文本模型测试失败`, {
        status: chatResponse.status,
        duration: `${duration}ms`,
        error: errorData,
      });
      return NextResponse.json({
        success: false,
        message: getErrorMessage(chatResponse.status, errorData),
      }, { status: chatResponse.status });
    }

    const chatData = await chatResponse.json();
    const latency = Date.now() - startTimeInner;

    if (!chatData.choices || !chatData.choices[0]?.message?.content) {
      const duration = Date.now() - startTime;
      log.error(`[${requestId}] 响应格式错误`, {
        latency: `${latency}ms`,
        duration: `${duration}ms`,
        responseKeys: Object.keys(chatData),
        hasChoices: !!chatData.choices,
      });
      return NextResponse.json({
        success: false,
        message: '响应格式错误',
      }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    log.info(`[${requestId}] 文本模型测试成功`, {
      latency: `${latency}ms`,
      duration: `${duration}ms`,
      replyPreview: chatData.choices[0].message.content.substring(0, 50),
    });
    return NextResponse.json({
      success: true,
      message: '连接成功',
      latency,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    log.error(`[${requestId}] 连接测试异常`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });

    if (errorMessage.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: '网络连接失败，请检查网络或Base URL配置',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      message: errorMessage || '测试失败，请稍后重试',
    }, { status: 500 });
  }
}

function getErrorMessage(status: number, errorData: Record<string, unknown>): string {
  const errorMsg = (errorData?.error as { message?: string })?.message || (errorData?.message as string) || '';

  switch (status) {
    case 401:
      return 'API Key无效或已过期';
    case 403:
      return '没有访问权限，请检查API Key权限';
    case 404:
      return '模型不存在或Base URL配置错误';
    case 429:
      return '请求过于频繁，请稍后再试';
    case 400:
      if (errorMsg.includes('model')) {
        return '模型名称不存在';
      }
      return '请求参数错误';
    case 500:
      return '服务器内部错误，请稍后重试';
    default:
      if (errorMsg) {
        return errorMsg;
      }
      return `连接失败 (${status})`;
  }
}
