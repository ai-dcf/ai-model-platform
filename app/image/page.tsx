'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Image as ImageIcon, Download, RotateCcw, History, X, Check, Plus, Wand2, Maximize2, Sparkles } from 'lucide-react';
import {
  getEnabledModelsByType,
  getImageHistory,
  saveImageHistory,
  type ModelItem,
  type ImageHistoryItem,
} from '../../lib/storage';
import { imageModelConfigs, type ImageAspectRatio, type ImageSizeTier } from '../../lib/image-vendor-presets';

type AspectRatioOption = {
  label: ImageAspectRatio;
  width: number;
  height: number;
  icon: string;
};

const DEFAULT_ASPECT_RATIO_KEYS: ImageAspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];

const ASPECT_RATIO_OPTIONS: Record<ImageAspectRatio, AspectRatioOption> = {
  '1:1': { label: '1:1', width: 1024, height: 1024, icon: '□' },
  '4:3': { label: '4:3', width: 1024, height: 768, icon: '▭' },
  '3:4': { label: '3:4', width: 768, height: 1024, icon: '▯' },
  '16:9': { label: '16:9', width: 1920, height: 1080, icon: '▭' },
  '9:16': { label: '9:16', width: 1080, height: 1920, icon: '▯' },
  '3:2': { label: '3:2', width: 1248, height: 832, icon: '▭' },
  '2:3': { label: '2:3', width: 832, height: 1248, icon: '▯' },
  '21:9': { label: '21:9', width: 1512, height: 648, icon: '▭' },
};

export default function ImagePage() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(ASPECT_RATIO_OPTIONS['1:1']);
  const [sizeTier, setSizeTier] = useState<ImageSizeTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    const imageModels = getEnabledModelsByType('image');
    setModels(imageModels);
    if (imageModels.length > 0) {
      setSelectedModel(imageModels[0]);
    }
    
    const hist = getImageHistory();
    setHistory(hist);
  }, []);

  useEffect(() => {
    if (availableAspectRatios.length === 0) {
      return;
    }

    const currentSupported = availableAspectRatios.some((ratio) => ratio.label === aspectRatio.label);
    if (!currentSupported) {
      setAspectRatio(availableAspectRatios[0]);
    }
  }, [availableAspectRatios, aspectRatio.label]);

  useEffect(() => {
    if (availableSizeTiers.length === 0) {
      if (sizeTier !== null) {
        setSizeTier(null);
      }
      return;
    }

    const currentSupported = sizeTier ? availableSizeTiers.includes(sizeTier) : false;
    if (!currentSupported) {
      setSizeTier(currentModelConfig?.defaultTier ?? availableSizeTiers[0]);
    }
  }, [availableSizeTiers, currentModelConfig, sizeTier]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedModel || isLoading) return;

    setIsLoading(true);
    setResults([]);

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
          prompt: prompt.trim(),
          width: aspectRatio.width,
          height: aspectRatio.height,
          sizeTier,
          n: 4,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.images) {
        setResults(data.images);
        setSelectedResultIndex(0);
        
        const historyItem: ImageHistoryItem = {
          id: `img-${Date.now()}`,
          modelId: selectedModel.id,
          modelName: selectedModel.modelName,
          prompt: prompt.trim(),
          width: aspectRatio.width,
          height: aspectRatio.height,
          images: data.images,
          createdAt: new Date().toISOString(),
        };
        
        saveImageHistory(historyItem);
        setHistory([historyItem, ...history]);
      } else {
        throw new Error(data.message || '生成失败');
      }
    } catch (error) {
      console.error('生成图像失败:', error);
      alert('生成图像失败，请检查您的模型配置');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${Date.now()}.png`;
    link.click();
  };

  const handleReuse = (item: ImageHistoryItem) => {
    setPrompt(item.prompt);
    const model = models.find(m => m.id === item.modelId);
    if (model) {
      setSelectedModel(model);
    }

    const modelConfig = model?.modelName
      ? imageModelConfigs[model.modelName]
      : undefined;
    const candidateTiers = modelConfig?.supportedTiers ?? [];
    setSizeTier(candidateTiers.length > 0 ? modelConfig?.defaultTier ?? candidateTiers[0] : null);
    
    const configuredRatios = modelConfig?.supportedAspectRatios;
    const candidateRatios = (configuredRatios && configuredRatios.length > 0
      ? configuredRatios
      : DEFAULT_ASPECT_RATIO_KEYS)
      .map((key) => ASPECT_RATIO_OPTIONS[key])
      .filter((ratio): ratio is AspectRatioOption => !!ratio);

    const matchingRatio = candidateRatios.find(r => r.width === item.width && r.height === item.height);
    setAspectRatio(matchingRatio || candidateRatios[0] || ASPECT_RATIO_OPTIONS['1:1']);
    
    setShowHistory(false);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  if (models.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center glass-card rounded-3xl p-10 max-w-md w-full">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-text mb-3">暂无可用模型</h2>
          <p className="text-text-muted mb-8 text-lg">请先配置至少一个图像模型</p>
          <button
            onClick={() => window.location.href = '/config'}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
          >
            去配置模型
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col w-full">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-light/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="p-2 rounded-xl hover:bg-surface-lighter transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
          <h1 className="text-lg font-semibold text-text">创作</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2.5 rounded-xl hover:bg-surface-lighter transition-colors"
          >
            <History className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </header>

      {/* 主内容区 - 结果展示 */}
      <main className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="p-4 space-y-4">
            {/* 大图预览 */}
            <div className="relative rounded-2xl overflow-hidden bg-surface-lighter">
              <img
                src={results[selectedResultIndex]}
                alt="生成的图像"
                className="w-full aspect-square object-cover"
              />
              {/* 操作按钮 */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                <button
                  onClick={() => handleDownload(results[selectedResultIndex])}
                  className="flex-1 py-3 bg-surface-lighter/90 backdrop-blur-xl rounded-xl text-text font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>

            {/* 缩略图网格 */}
            <div className="grid grid-cols-4 gap-2">
              {results.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedResultIndex(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-square ${
                    selectedResultIndex === idx ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img
                    src={img}
                    alt={`结果 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* 重新编辑 / 再次生成 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => inputRef.current?.focus()}
                className="flex-1 py-3.5 bg-surface-lighter rounded-xl text-text font-medium flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                重新编辑
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-surface-lighter rounded-xl text-text font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                再次生成
              </button>
            </div>

            {/* 生成信息 */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-muted mb-2">
                图片生成 | 来自创作: {prompt.slice(0, 30)}...
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-surface-lighter rounded-lg text-xs text-text-muted">
                  {selectedModel?.modelName}
                </span>
                <span className="px-3 py-1.5 bg-surface-lighter rounded-lg text-xs text-text-muted">
                  {aspectRatio.label}
                </span>
                {sizeTier && (
                  <span className="px-3 py-1.5 bg-surface-lighter rounded-lg text-xs text-text-muted">
                    {sizeTier}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6">
              <ImageIcon className="w-12 h-12 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">开始创作</h3>
            <p className="text-text-muted text-center">在下方输入描述，让AI为您生成图像</p>
          </div>
        )}
      </main>

      {/* 底部操作栏 - 即梦AI风格 */}
      <div className="border-t border-border bg-surface-light/80 backdrop-blur-xl">
        {/* 参考图上传 */}
        <div className="px-4 py-3 border-b border-border/50">
          <button className="flex items-center gap-3 text-text-muted hover:text-text transition-colors">
            <div className="w-12 h-12 rounded-xl bg-surface-lighter flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm">添加参考</span>
          </button>
        </div>

        {/* 提示词输入 */}
        <div className="px-4 py-3">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="请描述你想要生成的图片，例如：生成像素风格插画"
            className="w-full bg-transparent text-text placeholder-text-dim resize-none outline-none text-base"
            rows={2}
          />
        </div>

        {/* 快捷参数栏 */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          {/* 模型选择 */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-lighter rounded-full text-sm text-text whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {selectedModel?.modelName.slice(0, 8)}...
          </button>

          {/* 比例选择 */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-lighter rounded-full text-sm text-text whitespace-nowrap"
          >
            <Maximize2 className="w-4 h-4" />
            {aspectRatio.label}
          </button>

          {availableSizeTiers.length > 0 && sizeTier && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-lighter rounded-full text-sm text-text whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              {sizeTier}
            </button>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className={`ml-auto px-6 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
              prompt.trim() && !isLoading
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25'
                : 'bg-surface-lighter text-text-dim cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                生成中
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成
              </>
            )}
          </button>
        </div>
      </div>

      {/* 设置抽屉 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div className="relative w-full bg-surface-light rounded-t-3xl max-h-[80vh] overflow-hidden animate-slide-up">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text">生成设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-xl hover:bg-surface-lighter"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* 抽屉内容 */}
            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(80vh-70px)]">
              {/* 模型选择 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text">选择模型</h4>
                <div className="grid grid-cols-1 gap-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                        selectedModel?.id === model.id
                          ? 'bg-primary/20 border border-primary/40'
                          : 'bg-surface-lighter border border-border'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-text font-medium">{model.modelName}</span>
                        <span className="text-text-dim text-xs">{model.vendor}</span>
                      </div>
                      {selectedModel?.id === model.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {availableSizeTiers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-text">选择分辨率</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSizeTiers.map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSizeTier(tier)}
                        className={`py-3 rounded-xl transition-all text-sm font-medium ${
                          sizeTier === tier
                            ? 'bg-primary text-white'
                            : 'bg-surface-lighter text-text-muted'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 比例选择 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text">选择生成比例</h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableAspectRatios.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                        aspectRatio.label === ratio.label
                          ? 'bg-primary text-white'
                          : 'bg-surface-lighter text-text-muted'
                      }`}
                    >
                      <span className="text-lg">{ratio.icon}</span>
                      <span className="text-xs">{ratio.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录弹窗 */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-light rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-text">历史记录</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-3 rounded-xl hover:bg-surface-lighter"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <History className="w-16 h-16 text-text-dim mx-auto mb-4" />
                  <p className="text-text-muted text-lg">暂无历史记录</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleReuse(item)}
                      className="bg-surface-lighter rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      {item.images[0] && (
                        <div className="aspect-square relative">
                          <img
                            src={item.images[0]}
                            alt="历史预览"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="text-text text-sm font-medium truncate mb-1">
                          {item.prompt.substring(0, 40)}...
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-dim">
                          <span>{item.modelName}</span>
                          <span>{item.width}×{item.height}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
