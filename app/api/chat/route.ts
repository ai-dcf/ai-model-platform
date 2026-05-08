
import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';

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
  try {
    const body = await request.json();
    const { modelConfig, messages, stream } = body;

    if (!modelConfig || !messages) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { modelName, apiKey, baseUrl } = modelConfig;

    const formattedMessages = messages.map((msg: Message) => {
      if (msg.attachments && msg.attachments.length > 0) {
        const imageAttachments = msg.attachments.filter(att => att.type === 'image');
        
        if (imageAttachments.length > 0) {
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

    const llm = new ChatOpenAI({
      model: modelName,
      apiKey,
      configuration: {
        baseURL: baseUrl,
      },
      streaming: stream || false,
    });

    if (stream) {
      const streamIterator = await llm.stream(formattedMessages);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async *start(controller) {
          for await (const chunk of streamIterator) {
            if (chunk && chunk.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '' })}\n\n`));
          controller.close();
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
      const response = await llm.invoke(formattedMessages);
      return NextResponse.json({ content: response.content });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '请求失败' }, { status: 500 });
  }
}
