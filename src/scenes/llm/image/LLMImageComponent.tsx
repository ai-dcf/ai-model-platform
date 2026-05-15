'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Plus, Trash2, Copy, PanelLeftClose, PanelLeftOpen, ImageIcon, Download, RotateCcw, Maximize2, Sparkles } from 'lucide-react';
import {
  getEnabledModelsByType,
  getImageConversations,
  getActiveImageConversation,
  saveImageConversation,
  setActiveImageConversation,
  deleteImageConversation,
  createNewConversation,
  groupConversationsByDate,
} from '@/lib/storage/main';
import type { ChatMessage, Conversation, ModelItem } from '@/types';
import { imageModelConfigs, ASPECT_RATIO_OPTIONS, DEFAULT_ASPECT_RATIO_KEYS } from './constants';
import type { ImageAspectRatio, ImageSizeTier } from '@/types';

type AspectRatioOption = {
  label: ImageAspectRatio;
  width: number;
  height: number;
  icon: string;
};

export default function LLMImageComponent() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('image-sidebar-open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(ASPECT_RATIO_OPTIONS['1:1']);
  const [sizeTier, setSizeTier] = useState<ImageSizeTier | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId) || null, [models, selectedModelId]);

  const currentModelConfig = selectedModel?.modelName
    ? imageModelConfigs[selectedModel.modelName]
    : undefined;

  const availableAspectRatios = useMemo(() => {
    const configuredRatios = currentModelConfig?.supportedAspectRatios;

    const ratioKeys = configuredRatios && configuredRatios.length > 0
      ? configuredRatios
      : DEFAULT_ASPECT_RATIO_KEYS;

    return ratioKeys
      .map((key) => ASPECT_RATIO_OPTIONS[key])
      .filter((ratio): ratio is AspectRatioOption => !!ratio);
  }, [currentModelConfig]);

  const availableSizeTiers = useMemo(
    () => currentModelConfig?.supportedTiers ?? [],
    [currentModelConfig],
  );

  const groupedTasks = useMemo(() => {
    if (!activeConversation) return [];
    const tasks: { prompt: ChatMessage; response?: ChatMessage; aspectRatio?: AspectRatioOption }[] = [];
    let currentTask: { prompt: ChatMessage; response?: ChatMessage; aspectRatio?: AspectRatioOption } | null = null;

    for (const msg of activeConversation.messages) {
      if (msg.role === 'user') {
        if (currentTask) tasks.push(currentTask);
        currentTask = { prompt: msg };
      } else if (msg.role === 'assistant' && currentTask) {
        currentTask.response = msg;

        // Extract aspect ratio from assistant message content
        const ratioMatch = msg.content.match(/尺寸: ([\d:]+)/);
        if (ratioMatch && ratioMatch[1]) {
          const ratioKey = ratioMatch[1] as ImageAspectRatio;
          if (ASPECT_RATIO_OPTIONS[ratioKey]) {
            currentTask.aspectRatio = ASPECT_RATIO_OPTIONS[ratioKey];
          }
        }

        tasks.push(currentTask);
        currentTask = null;
      }
    }
    if (currentTask) tasks.push(currentTask);

    return tasks;
  }, [activeConversation?.messages]);

  useEffect(() => {
    const imageModels = getEnabledModelsByType('image');
    setModels(imageModels);

    const convs = getImageConversations();
    setConversations(convs);

    const active = getActiveImageConversation();
    setActiveConversationState(active);
    if (active) {
      setSelectedModelId(active.modelId);
    } else if (imageModels.length > 0) {
      setSelectedModelId(imageModels[0].id);
    }

    const savedSidebar = localStorage.getItem('image-sidebar-open');
    if (savedSidebar !== null) {
      setShowSidebar(savedSidebar === 'true');
    } else if (window.innerWidth < 768) {
      setShowSidebar(false);
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('image-sidebar-open', String(showSidebar));
  }, [showSidebar]);

  useEffect(() => {
    if (availableAspectRatios.length === 0) return;
    const currentSupported = availableAspectRatios.some((ratio) => ratio.label === aspectRatio.label);
    if (!currentSupported) {
      setAspectRatio(availableAspectRatios[0]);
    }
  }, [availableAspectRatios, aspectRatio.label]);

  useEffect(() => {
    if (availableSizeTiers.length === 0) {
      if (sizeTier !== null) setSizeTier(null);
      return;
    }
    const currentSupported = sizeTier ? availableSizeTiers.includes(sizeTier) : false;
    if (!currentSupported) {
      setSizeTier(currentModelConfig?.defaultTier ?? availableSizeTiers[0]);
    }
  }, [availableSizeTiers, currentModelConfig, sizeTier]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !activeConversation || !selectedModel || isLoading) return;

    const newMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedConversation: Conversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, newMessage],
      updatedAt: new Date().toISOString(),
    };

    setActiveConversationState(updatedConversation);
    saveImageConversation(updatedConversation);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelConfig: {
            vendor: selectedModel.vendor,
            modelName: selectedModel.modelName,
            apiKey: selectedModel.apiKey,
            baseUrl: selectedModel.baseUrl,
          },
          prompt: newMessage.content,
          width: aspectRatio.width,
          height: aspectRatio.height,
          sizeTier,
          n: 4,
        }),
      });

      const data = await response.json();

      if (data.success && data.images) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: `尺寸: ${aspectRatio.label} | 分辨率: ${aspectRatio.width}x${aspectRatio.height}${sizeTier ? ` | 质量: ${sizeTier}` : ''}`,
          modelName: selectedModel.modelName,
          timestamp: new Date().toISOString(),
          attachments: data.images.map((img: string, idx: number) => ({
            id: `img-${Date.now()}-${idx}`,
            type: 'image',
            name: `生成图像 ${idx + 1}`,
            mimeType: 'image/png',
            size: 0,
            data: img,
          })),
        };

        const finalConversation: Conversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        };

        setActiveConversationState(finalConversation);
        saveImageConversation(finalConversation);
      } else {
        throw new Error(data.message || '生成失败');
      }
    } catch (error) {
      console.error('生成图像失败:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，生成图像失败，请检查您的模型配置。',
        modelName: selectedModel.modelName,
        timestamp: new Date().toISOString(),
      };

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date().toISOString(),
      };
      setActiveConversationState(finalConversation);
      saveImageConversation(finalConversation);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    if (models.length === 0) return;

    const initialModel = models.find(m => m.id === selectedModelId) || models[0];
    const newConv = createNewConversation(initialModel.id, initialModel.modelName);
    saveImageConversation(newConv);
    setConversations([newConv, ...conversations]);
    setActiveConversationState(newConv);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationState(conv);
    setActiveImageConversation(conv.id);
    setSelectedModelId(conv.modelId);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleDeleteConversation = (convId: string) => {
    deleteImageConversation(convId);
    setConversations(conversations.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        setActiveConversationState(remaining[0]);
        setActiveImageConversation(remaining[0].id);
      } else {
        setActiveConversationState(null);
      }
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${Date.now()}.png`;
    link.click();
  };

  if (models.length === 0) {
    return (
      <div className="min-h-[70vh] bg-surface flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-2xl p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">暂无可用模型</h2>
          <p className="text-text-muted mb-6">请先配置至少一个图像模型</p>
          <button
            onClick={() => window.location.href = '/config'}
            className="btn-primary"
          >
            去配置模型
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface flex w-full overflow-hidden">
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside className={`
        fixed md:relative top-0 bottom-0 left-0 z-40 md:z-auto flex flex-col h-full
        glass-card border-r border-border
        transform transition-all duration-300 ease-in-out flex-shrink-0
        ${showSidebar ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none opacity-0 md:opacity-100'}
      `}>
        <div className="p-4 border-b border-border w-64 md:w-72">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>图像生成历史</span>
            </h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-lighter transition-colors text-text-muted"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 font-medium"
          >
            <Plus className="w-5 h-5" />
            开启新创作
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 w-64 md:w-72">
          {groupConversationsByDate(conversations).map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-3 mb-2 text-xs font-medium text-text-dim">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      activeConversation?.id === conv.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-lighter text-text'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{conv.name}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-3 left-3 z-10 w-11 h-11 flex items-center justify-center rounded-xl bg-surface-lighter/80 hover:bg-surface-lighter border border-border/50 text-text-muted hover:text-text transition-all duration-200 backdrop-blur-sm"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}

        {activeConversation ? (
          <>
            <header className="p-3 md:p-4 glass-card border-b border-border flex-shrink-0">
              <div className={`flex items-center gap-3 ${!showSidebar ? 'pl-14' : ''}`}>
                <select
                  value={selectedModelId || models[0]?.id || ''}
                  onChange={(e) => {
                    const model = models.find(m => m.id === e.target.value);
                    if (model) {
                      setSelectedModelId(model.id);
                      if (activeConversation) {
                        const updated: Conversation = {
                          ...activeConversation,
                          modelId: model.id,
                          modelName: model.modelName,
                        };
                        setActiveConversationState(updated);
                        saveImageConversation(updated);
                      }
                    }
                  }}
                  className="input-field text-sm py-1.5 px-3 min-w-[140px] flex-shrink-0"
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.modelName}
                    </option>
                  ))}
                </select>

                <div className="h-4 w-[1px] bg-border mx-2"></div>

                <input
                  type="text"
                  value={activeConversation.name}
                  onChange={(e) => {
                    const updated: Conversation = {
                      ...activeConversation,
                      name: e.target.value,
                    };
                    setActiveConversationState(updated);
                    saveImageConversation(updated);
                  }}
                  className="bg-transparent border-none outline-none font-medium text-text placeholder:text-text-dim flex-1 min-w-0"
                  placeholder="会话名称"
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 bg-surface-light">
              {groupedTasks.map((task, index) => (
                <div key={index} className="glass-card rounded-2xl overflow-hidden border border-border/50 animate-fade-in bg-surface">
                  {/* Prompt Area */}
                  <div className="p-4 md:p-5 bg-surface-lighter border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-text font-medium leading-relaxed whitespace-pre-wrap flex-1 text-sm md:text-base">
                        {task.prompt.content}
                      </p>
                      <button
                        onClick={() => setPrompt(task.prompt.content)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-primary/10 text-primary transition-colors text-sm font-medium flex-shrink-0 border border-border"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>复用</span>
                      </button>
                    </div>
                  </div>

                  {/* Images Area */}
                  <div className="p-4 md:p-5">
                    {task.response ? (
                      <>
                        {task.response.attachments && task.response.attachments.length > 0 ? (
                          <div className={`grid gap-3 max-w-[600px] ${
                            task.response.attachments.length === 1 ? 'grid-cols-1 sm:w-1/2 md:w-[280px]' :
                              task.response.attachments.length === 2 ? 'grid-cols-2' :
                                'grid-cols-2 md:grid-cols-4'
                          }`}>
                            {task.response.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-xl overflow-hidden bg-surface-lighter border border-border cursor-pointer"
                                style={{
                                  aspectRatio: task.aspectRatio
                                    ? `${task.aspectRatio.width}/${task.aspectRatio.height}`
                                    : '1/1'
                                }}
                                onClick={() => setPreviewImage(att.data)}
                              >
                                <img
                                  src={att.data}
                                  alt={att.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(att.data);
                                    }}
                                    className="p-2.5 rounded-xl bg-white/20 hover:bg-primary text-white backdrop-blur-md transition-all hover:scale-110"
                                    title="下载"
                                  >
                                    <Download className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(att.data);
                                    }}
                                    className="p-2.5 rounded-xl bg-white/20 hover:bg-primary text-white backdrop-blur-md transition-all hover:scale-110"
                                    title="查看大图"
                                  >
                                    <Maximize2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-8 bg-surface-lighter rounded-xl text-text-muted text-sm">
                            {task.response.content}
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-text-dim">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 font-medium">
                              <ImageIcon className="w-3.5 h-3.5 text-primary" />
                              {task.response.modelName || 'Unknown Model'}
                            </span>
                            {task.response.content && !task.response.content.includes('抱歉') && (
                              <span className="hidden md:inline-block px-2 py-0.5 rounded border border-border bg-surface-lighter">
                                {task.response.content}
                              </span>
                            )}
                          </div>
                          <span>{new Date(task.response.timestamp).toLocaleString('zh-CN', { hour12: false })}</span>
                        </div>
                      </>
                    ) : (
                      /* Loading State */
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-primary">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                        </div>
                        <p className="text-text-muted font-medium text-sm">正在生成精彩图像...</p>
                        <p className="text-xs text-text-dim mt-2">预计需要十几秒时间</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-3 md:p-4 glass-card border-t border-border flex flex-col gap-3">
              {/* Settings selectors */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                <div className="relative">
                  <select
                    value={aspectRatio.label}
                    onChange={(e) => {
                      const ratio = availableAspectRatios.find(r => r.label === e.target.value);
                      if (ratio) setAspectRatio(ratio);
                    }}
                    className="input-field text-sm py-1.5 pl-8 pr-6 appearance-none bg-surface-lighter"
                  >
                    {availableAspectRatios.map(ratio => (
                      <option key={ratio.label} value={ratio.label}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                  <Maximize2 className="w-4 h-4 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {availableSizeTiers.length > 0 && sizeTier && (
                  <div className="relative">
                    <select
                      value={sizeTier}
                      onChange={(e) => setSizeTier(e.target.value as ImageSizeTier)}
                      className="input-field text-sm py-1.5 pl-8 pr-6 appearance-none bg-surface-lighter"
                    >
                      {availableSizeTiers.map(tier => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                    <Sparkles className="w-4 h-4 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="relative flex items-end gap-2 bg-surface-lighter rounded-2xl border border-border p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="描述你想要生成的图片..."
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-sm text-text placeholder:text-text-dim"
                  rows={1}
                />

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading}
                  className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">选择一个会话开始创作</h3>
              <p className="text-text-muted mb-6">或者创建一个新的创作会话</p>
              <button onClick={handleNewConversation} className="btn-primary">
                开启新创作
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Full Screen Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              关闭
            </button>
            <img
              src={previewImage}
              alt="预览大图"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(previewImage);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>下载原图</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const w = window.open();
                  w?.document.write(`<img src="${previewImage}" style="max-width:100%;" />`);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span>在新标签页打开</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
