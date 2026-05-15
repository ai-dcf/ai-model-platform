import { NextResponse } from 'next/server';
import type { Prompt } from '@/types/prompt';

const mockImagePrompts: Prompt[] = [
  {
    id: 'img-001',
    title: '摄影风格人物肖像',
    content: '生成一张高质量的人像摄影作品，主体是一位年轻女性，背景简洁，使用柔和的自然光，呈现温暖的色调。人物表情自然放松，穿着简约时尚的服装。照片采用电影感色调，具有艺术感和故事性。',
    category: '人物摄影',
    tags: ['人像', '摄影', '自然光'],
    createdAt: '2024-01-15',
    type: 'image',
  },
  {
    id: 'img-002',
    title: '赛博朋克城市夜景',
    content: '描绘一幅未来主义的赛博朋克城市夜景，高楼大厦林立，霓虹灯闪烁，空中有飞行汽车穿梭。画面色调以深蓝和紫色为主，点缀着霓虹粉色和青色。加入一些烟雾和雨滴效果，增强氛围感。',
    category: '场景设计',
    tags: ['赛博朋克', '科幻', '城市'],
    createdAt: '2024-01-14',
    type: 'image',
  },
  {
    id: 'img-003',
    title: '水彩风格风景画',
    content: '用传统水彩画风格绘制一幅宁静的乡村风景画，包含绿色的田野、一条小溪流过，远处有连绵的山丘。天空中有几朵白云，整体色调柔和温暖，充满诗意和宁静感。',
    category: '风景',
    tags: ['水彩', '风景', '乡村'],
    createdAt: '2024-01-13',
    type: 'image',
  },
  {
    id: 'img-004',
    title: '卡通可爱动物',
    content: '创作一个可爱的卡通动物角色，可以是一只拟人化的猫咪或者狗狗。角色设计简洁可爱，色彩鲜艳，适合作为吉祥物或表情包使用。背景可以是简单的渐变色或卡通场景。',
    category: '角色设计',
    tags: ['卡通', '可爱', '动物'],
    createdAt: '2024-01-12',
    type: 'image',
  },
  {
    id: 'img-005',
    title: '抽象艺术作品',
    content: '创作一幅抽象艺术作品，使用大胆的色彩和几何形状。画面应该充满动感和能量，可以包含流动的线条和对比强烈的色块。风格可以参考现代抽象表现主义。',
    category: '抽象艺术',
    tags: ['抽象', '艺术', '现代'],
    createdAt: '2024-01-11',
    type: 'image',
  },
];

const mockVideoPrompts: Prompt[] = [
  {
    id: 'vid-001',
    title: '自然风景延时摄影',
    content: '拍摄一段自然风景的延时摄影视频，内容包括日出或日落的过程，云层的流动，或者星空的移动。视频节奏舒缓，配以自然音效或轻柔的背景音乐。画面构图优美，色彩丰富。',
    category: '自然风光',
    tags: ['延时摄影', '自然', '风景'],
    createdAt: '2024-01-15',
    type: 'video',
  },
  {
    id: 'vid-002',
    title: '产品展示动画',
    content: '制作一段产品展示视频，产品在画面中央旋转展示各个角度。背景简洁，突出产品本身。可以加入一些光效和粒子效果增加视觉吸引力。视频时长约30秒，适合社交媒体传播。',
    category: '商业广告',
    tags: ['产品展示', '商业', '动画'],
    createdAt: '2024-01-14',
    type: 'video',
  },
  {
    id: 'vid-003',
    title: '动态文字动画',
    content: '创建一段动态文字动画，文字以优雅的方式出现和消失。可以使用渐变色和阴影效果增加层次感。动画节奏可以配合音乐节拍，适合作为视频开场或社交媒体帖子。',
    category: '文字动画',
    tags: ['文字', '动画', '动态'],
    createdAt: '2024-01-13',
    type: 'video',
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'image') {
      return NextResponse.json({
        success: true,
        data: mockImagePrompts,
      });
    } else if (type === 'video') {
      return NextResponse.json({
        success: true,
        data: mockVideoPrompts,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '无效的类型参数',
      });
    }
  } catch {
    return NextResponse.json({
      success: false,
      error: '请求处理失败',
    });
  }
}
