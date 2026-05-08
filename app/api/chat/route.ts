import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { createLogger } from '@/lib/logger';

const log = createLogger('ChatAPI');

interface Attachment {
  type: 'image' | 'file';
  name: string;
  data: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { modelConfig, messages, stream } = body;

    if (!modelConfig || !messages) {
      log.warn(`[${requestId}] 缺少必要参数`, { hasModelConfig: !!modelConfig, hasMessages: !!messages });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { modelName, apiKey, baseUrl } = modelConfig;

    log.info(`[${requestId}] 请求开始`, {
      model: modelName,
      baseUrl,
      stream,
      messageCount: messages.length,
      hasAttachments: messages.some((m: Message) => (m.attachments?.length ?? 0) > 0),
    });

    const formattedMessages = messages.map((msg: Message) => {
      if (msg.attachments && msg.attachments.length > 0) {
        const imageAttachments = msg.attachments.filter(att => att.type === 'image');

        if (imageAttachments.length > 0) {
          log.debug(`[${requestId}] 处理图片附件`, {
            role: msg.role,
            imageCount: imageAttachments.length,
            fileNames: imageAttachments.map(a => a.name),
          });

          const imageContents = imageAttachments.map(att => ({
            type: 'image_url',
            image_url: {
              url: att.data,
            },
          }));

          const textContent = msg.content || '';

          return {
            role: msg.role,
            content: [
              { type: 'text', text: textContent },
              ...imageContents,
            ],
          };
        }
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });

    log.debug(`[${requestId}] 初始化 ChatOpenAI`, { model: modelName, baseUrl, stream });

    const llm = new ChatOpenAI({
      model: modelName,
      apiKey,
      configuration: {
        baseURL: baseUrl,
      },
      streaming: stream || false,
      timeout: 60000,
    });

    if (stream) {
      log.info(`[${requestId}] 调用 llm.stream()...`);
      const streamIterator = await llm.stream(formattedMessages);
      log.info(`[${requestId}] llm.stream() 返回，开始读取流数据`);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          let chunkCount = 0;
          let fullContent = '';
          try {
            for await (const chunk of streamIterator) {
              if (chunk && chunk.content) {
                chunkCount++;
                fullContent += chunk.content;
                log.debug(`[${requestId}] 收到流式分片`, {
                  chunkCount,
                  chunkContent: chunk.content,
                });
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '' })}\n\n`));
            controller.close();
            const duration = Date.now() - startTime;
            log.info(`[${requestId}] 流式响应完成`, { chunkCount, duration: `${duration}ms`, content: fullContent });
          } catch (streamError) {
            log.error(`[${requestId}] 流式响应中断`, streamError);
            throw streamError;
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      log.info(`[${requestId}] 调用 llm.invoke()...`);
      const response = await llm.invoke(formattedMessages);
      const duration = Date.now() - startTime;
      const contentLength = typeof response.content === 'string' ? response.content.length : 0;
      log.info(`[${requestId}] 非流式请求完成`, { duration: `${duration}ms`, contentLength });
      return NextResponse.json({ content: response.content });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`[${requestId}] 请求失败`, {
      duration: `${duration}ms`,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    return NextResponse.json({ error: '请求失败' }, { status: 500 });
  }
}
