'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus, Trash2, Copy, FileText, PanelLeftClose, PanelLeftOpen, MessageSquare } from 'lucide-react';
import {
  getEnabledModelsByType,
  getConversations,
  getActiveConversation,
  saveConversation,
  setActiveConversation,
  deleteConversation,
  createNewConversation,
  groupConversationsByDate,
  type ChatMessage,
  type Conversation,
  type ModelItem,
} from '../../lib/storage';
import {
  getAttachmentsByConversation,
  deleteAttachment,
  type StoredAttachment,
} from '../../lib/attachment';
import ChatInput from '../../components/ChatInput';

type SpeechRecognitionEvent = {
  results: {
    length: number;
    [index: number]: {
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionError = {
  error: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export default function ChatPage() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-sidebar-open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<StoredAttachment[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textModels = getEnabledModelsByType('text');
    setModels(textModels);
    
    const convs = getConversations();
    setConversations(convs);
    
    const active = getActiveConversation();
    setActiveConversationState(active);
    if (active) {
      setSelectedModelId(active.modelId);
    } else if (textModels.length > 0) {
      setSelectedModelId(textModels[0].id);
    }
    
    const savedSidebar = localStorage.getItem('chat-sidebar-open');
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
    localStorage.setItem('chat-sidebar-open', String(showSidebar));
  }, [showSidebar]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (activeConversation) {
        const atts = await getAttachmentsByConversation(activeConversation.id);
        setAttachments(atts);
      } else {
        setAttachments([]);
      }
    };

    loadAttachments();

    const handleAttachmentAdded = () => {
      loadAttachments();
    };

    window.addEventListener('attachment-added', handleAttachmentAdded);
    return () => window.removeEventListener('attachment-added', handleAttachmentAdded);
  }, [activeConversation]);

  const handleRemoveAttachment = async (attachmentId: string) => {
    await deleteAttachment(attachmentId);
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || !activeConversation || isLoading) return;

    const newMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      attachments: attachments.map(({ id, type, name, mimeType, size, data }) => ({
        id,
        type,
        name,
        mimeType,
        size,
        data,
      })),
    };

    const updatedConversation: Conversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, newMessage],
      updatedAt: new Date().toISOString(),
    };

    setActiveConversationState(updatedConversation);
    saveConversation(updatedConversation);
    setMessage('');
    setAttachments([]);
    setIsLoading(true);

    const model = models.find(m => m.id === activeConversation.modelId);
    if (!model) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelConfig: {
            vendor: model.vendor,
            modelName: model.modelName,
            apiKey: model.apiKey,
            baseUrl: model.baseUrl,
          },
          messages: updatedConversation.messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessageContent += data.content;
                
                const updatedWithAssistant: Conversation = {
                  ...updatedConversation,
                  messages: [
                    ...updatedConversation.messages.slice(0, -1),
                    newMessage,
                    {
                      role: 'assistant',
                      content: assistantMessageContent,
                      modelName: model.modelName,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                };
                
                setActiveConversationState(updatedWithAssistant);
              }
            } catch (e) {
              console.error('解析错误:', e);
            }
          }
        }
      }

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [
          ...updatedConversation.messages,
          {
            role: 'assistant',
            content: assistantMessageContent,
            modelName: model.modelName,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setActiveConversationState(finalConversation);
      saveConversation(finalConversation);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Conversation = {
        ...updatedConversation,
        messages: [
          ...updatedConversation.messages,
          {
            role: 'assistant',
            content: '抱歉，无法完成请求，请检查您的模型配置。',
            modelName: model.modelName,
            timestamp: new Date().toISOString(),
          },
        ],
        updatedAt: new Date().toISOString(),
      };
      setActiveConversationState(errorMessage);
      saveConversation(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    if (models.length === 0) return;
    
    const selectedModel = models.find(m => m.id === selectedModelId) || models[0];
    const newConv = createNewConversation(selectedModel.id, selectedModel.modelName);
    saveConversation(newConv);
    setConversations([newConv, ...conversations]);
    setActiveConversationState(newConv);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversationState(conv);
    setActiveConversation(conv.id);
    setSelectedModelId(conv.modelId);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleDeleteConversation = (convId: string) => {
    deleteConversation(convId);
    setConversations(conversations.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        setActiveConversationState(remaining[0]);
        setActiveConversation(remaining[0].id);
      } else {
        setActiveConversationState(null);
      }
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const startRecording = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.error('浏览器不支持语音识别');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      console.error('语音识别错误:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  if (models.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-2xl p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">暂无可用模型</h2>
          <p className="text-text-muted mb-6">请先配置至少一个文本模型</p>
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
    <div className="h-[calc(100vh-4rem)] bg-surface flex w-full overflow-hidden">
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside className={`
        fixed md:relative top-16 md:top-0 bottom-0 left-0 z-40 md:z-auto flex flex-col h-full
        glass-card border-r border-border
        transform transition-all duration-300 ease-in-out flex-shrink-0
        ${showSidebar ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none opacity-0 md:opacity-100'}
      `}>
        <div className="p-4 border-b border-border w-64 md:w-72">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>对话历史</span>
            </h2>
            <button 
              onClick={() => setShowSidebar(false)} 
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-lighter transition-colors text-text-muted"
              title="折叠侧边栏"
              aria-label="折叠历史对话侧边栏"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleNewConversation} 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 font-medium"
          >
            <Plus className="w-5 h-5" />
            开启新对话
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
                      title="删除对话"
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

      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] min-w-0 transition-all duration-300 relative">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-3 left-3 z-10 w-11 h-11 flex items-center justify-center rounded-xl bg-surface-lighter/80 hover:bg-surface-lighter border border-border/50 text-text-muted hover:text-text transition-all duration-200 backdrop-blur-sm hover:shadow-md hover:shadow-primary/5 animate-fade-in"
            title="展开侧边栏"
            aria-label="展开历史对话侧边栏"
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
                        saveConversation(updated);
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
                    saveConversation(updated);
                  }}
                  className="bg-transparent border-none outline-none font-medium text-text placeholder:text-text-dim flex-1 min-w-0"
                  placeholder="会话名称"
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-primary/20'
                      : 'bg-gradient-to-br from-primary to-secondary'
                  }`}>
                    <span className="text-white text-sm font-medium">
                      {msg.role === 'user' ? 'You' : 'AI'}
                    </span>
                  </div>
                  <div className={`max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary/10 text-text rounded-br-md'
                        : 'bg-surface-lighter text-text rounded-bl-md'
                    }`}>
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg overflow-hidden bg-surface-lighter border border-border"
                            >
                              {att.type === 'image' ? (
                                <img
                                  src={att.data}
                                  alt={att.name}
                                  className="max-w-[150px] max-h-[150px] object-cover"
                                />
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <FileText className="w-4 h-4 text-text-muted" />
                                  <span className="text-sm text-text-muted">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {msg.role === 'assistant' && msg.modelName && (
                        <span className="text-xs text-text-dim">{msg.modelName}</span>
                      )}
                      <span className="text-xs text-text-dim">
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyMessage(msg.content)}
                            className="p-1 rounded hover:bg-surface-lighter text-text-dim hover:text-text transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                  <div className="bg-surface-lighter rounded-2xl px-4 py-3 rounded-bl-md">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 md:p-4 glass-card border-t border-border">
              <ChatInput
                value={message}
                attachments={attachments}
                isLoading={isLoading}
                isRecording={isRecording}
                conversationId={activeConversation.id}
                onChange={setMessage}
                onSend={handleSend}
                onRemoveAttachment={handleRemoveAttachment}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">选择一个会话开始聊天</h3>
              <p className="text-text-muted mb-6">或者创建一个新的会话</p>
              <button onClick={handleNewConversation} className="btn-primary">
                新建会话
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
