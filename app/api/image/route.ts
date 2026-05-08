
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelConfig, prompt, negativePrompt, width, height, n } = body;

    if (!modelConfig || !prompt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { apiKey, baseUrl } = modelConfig;

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        n: n || 1,
        response_format: 'url',
      }),
    });

    const data = await response.json();

    if (response.ok && data.data) {
      const images = data.data.map((item: { url: string }) => item.url);
      return NextResponse.json({ success: true, images });
    } else {
      return NextResponse.json({ success: false, message: data.error?.message || '生成失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json({ success: false, message: '请求失败' }, { status: 500 });
  }
}
