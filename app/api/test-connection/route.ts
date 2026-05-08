import { NextRequest, NextResponse } from 'next/server';

interface ModelConfig {
  vendor: string;
  modelName: string;
  apiKey: string;
  baseUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelConfig, type } = body as { modelConfig: ModelConfig; type: 'text' | 'image' };

    if (!modelConfig || !modelConfig.apiKey || !modelConfig.baseUrl || !modelConfig.modelName) {
      return NextResponse.json(
        { success: false, message: '缺少必要的配置信息' },
        { status: 400 }
      );
    }

    const { apiKey, baseUrl, modelName } = modelConfig;
    const startTime = Date.now();

    if (type === 'image') {
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          message: getErrorMessage(response.status, errorData),
        }, { status: response.status });
      }

      const latency = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: '连接成功',
        latency,
      });
    }

    const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
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
      return NextResponse.json({
        success: false,
        message: getErrorMessage(chatResponse.status, errorData),
      }, { status: chatResponse.status });
    }

    const chatData = await chatResponse.json();
    if (!chatData.choices || !chatData.choices[0]?.message?.content) {
      return NextResponse.json({
        success: false,
        message: '响应格式错误',
      }, { status: 500 });
    }

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      message: '连接成功',
      latency,
    });
  } catch (error) {
    console.error('Connection test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
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
