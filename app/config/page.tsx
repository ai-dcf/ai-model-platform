'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Copy, Download, Upload, Check, X, List, LayoutGrid, MessageSquare, Image, Film, Menu, Zap, Circle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  getModelsByType,
  saveModel,
  deleteModel,
  vendorPresets,
  type ModelItem,
  type VendorType,
  type ConnectionStatus,
} from '../../lib/storage';

type ModelType = 'text' | 'image' | 'video';

const modelTypeConfig = {
  text: { icon: MessageSquare, label: '文本模型', color: 'primary' },
  image: { icon: Image, label: '图像模型', color: 'secondary' },
  video: { icon: Film, label: '视频模型', color: 'accent' },
};

function ConnectionStatusIcon({ status, size = 'md' }: { status?: ConnectionStatus; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  switch (status) {
    case 'testing':
      return <Loader2 className={`${sizeClass} text-primary animate-spin`} />;
    case 'success':
      return <CheckCircle className={`${sizeClass} text-success`} />;
    case 'failed':
      return <XCircle className={`${sizeClass} text-error`} />;
    default:
      return <Circle className={`${sizeClass} text-text-dim`} />;
  }
}

export default function ConfigPage() {
  const [modelType, setModelType] = useState<ModelType>('text');
  const [models, setModels] = useState<ModelItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    vendor: 'aliyun' as VendorType,
    modelName: '',
    apiKey: '',
    baseUrl: '',
    remark: '',
    enabled: true,
  });
  const [modelCounts, setModelCounts] = useState({
    text: 0,
    image: 0,
    video: 0
  });

  const loadModels = useCallback(() => {
    const data = getModelsByType(modelType);
    setModels(data);
  }, [modelType]);

  useEffect(() => {
    loadModels();
    setModelCounts({
      text: getModelsByType('text').length,
      image: getModelsByType('image').length,
      video: getModelsByType('video').length
    });
  }, [loadModels]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTestConnection = async (model: ModelItem) => {
    if (testingModelId) return;
    
    setTestingModelId(model.id);
    setModels(prev => prev.map(m => 
      m.id === model.id ? { ...m, connectionStatus: 'testing' as ConnectionStatus } : m
    ));

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelConfig: {
            vendor: model.vendor,
            modelName: model.modelName,
            apiKey: model.apiKey,
            baseUrl: model.baseUrl,
          },
          type: modelType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedModel = {
          ...model,
          connectionStatus: 'success' as ConnectionStatus,
          lastTestedAt: new Date().toISOString(),
        };
        saveModel(modelType, updatedModel);
        setModels(prev => prev.map(m => m.id === model.id ? updatedModel : m));
        showToast('连接成功', 'success');
      } else {
        const updatedModel = {
          ...model,
          connectionStatus: 'failed' as ConnectionStatus,
          lastTestedAt: new Date().toISOString(),
        };
        saveModel(modelType, updatedModel);
        setModels(prev => prev.map(m => m.id === model.id ? updatedModel : m));
        showToast(`连接失败：${data.message}`, 'error');
      }
    } catch {
      const updatedModel = {
        ...model,
        connectionStatus: 'failed' as ConnectionStatus,
        lastTestedAt: new Date().toISOString(),
      };
      saveModel(modelType, updatedModel);
      setModels(prev => prev.map(m => m.id === model.id ? updatedModel : m));
      showToast('网络错误，请检查网络连接', 'error');
    } finally {
      setTestingModelId(null);
    }
  };

  const handleOpenModal = (model?: ModelItem) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        vendor: model.vendor,
        modelName: model.modelName,
        apiKey: model.apiKey,
        baseUrl: model.baseUrl,
        remark: model.remark || '',
        enabled: model.enabled,
      });
    } else {
      setEditingModel(null);
      setFormData({
        vendor: 'aliyun',
        modelName: '',
        apiKey: '',
        baseUrl: vendorPresets.aliyun.baseUrl,
        remark: '',
        enabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
  };

  const handleVendorChange = (vendor: VendorType) => {
    setFormData(prev => ({
      ...prev,
      vendor,
      baseUrl: vendor === 'custom' ? '' : vendorPresets[vendor]?.baseUrl || '',
      modelName: '',
    }));
  };

  const handleSave = () => {
    if (!formData.modelName || !formData.apiKey) {
      alert('请填写模型名称和API密钥');
      return;
    }

    const model: ModelItem = {
      id: editingModel?.id || `model-${Date.now()}`,
      vendor: formData.vendor,
      modelName: formData.modelName,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      remark: formData.remark || undefined,
      enabled: formData.enabled,
      createdAt: editingModel?.createdAt || new Date().toISOString(),
      connectionStatus: editingModel?.connectionStatus || 'untested',
      lastTestedAt: editingModel?.lastTestedAt,
    };

    if (editingModel?.apiKey !== formData.apiKey) {
      model.connectionStatus = 'untested';
      model.lastTestedAt = undefined;
    }

    saveModel(modelType, model);
    loadModels();
    setModelCounts({
      text: getModelsByType('text').length,
      image: getModelsByType('image').length,
      video: getModelsByType('video').length
    });
    handleCloseModal();
  };

  const handleDelete = (modelId: string) => {
    if (confirm('确定要删除这个模型吗？')) {
      deleteModel(modelType, modelId);
      loadModels();
      setModelCounts({
        text: getModelsByType('text').length,
        image: getModelsByType('image').length,
        video: getModelsByType('video').length
      });
    }
  };

  const handleToggleEnabled = (model: ModelItem) => {
    saveModel(modelType, { ...model, enabled: !model.enabled });
    loadModels();
  };

  const handleExport = () => {
    const data = getModelsByType(modelType);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelType}-models.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedModels = JSON.parse(event.target?.result as string);
        importedModels.forEach((model: ModelItem) => {
          saveModel(modelType, model);
        });
        loadModels();
        alert('导入成功');
      } catch {
        alert('导入失败，请确保文件格式正确');
      }
    };
    reader.readAsText(file);
  };

  const currentConfig = modelTypeConfig[modelType];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-surface">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-slide-in-left ${
          toast.type === 'success' ? 'bg-success' : 'bg-error'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}
      
      <div className="flex h-screen">
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" />
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64
          glass-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-bold gradient-text">模型配置</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-surface-lighter md:hidden"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {(Object.keys(modelTypeConfig) as ModelType[]).map((type) => {
              const config = modelTypeConfig[type];
              const Icon = config.icon;
              const count = modelCounts[type];
              const isActive = modelType === type;

              return (
                <button
                  key={type}
                  onClick={() => {
                    setModelType(type);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? `bg-${config.color}/10 text-${config.color} border border-${config.color}/20`
                      : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{config.label}</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-surface-lighter">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border space-y-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-lighter text-text-muted hover:text-text hover:bg-surface-light transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">导出配置</span>
            </button>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-lighter text-text-muted hover:text-text hover:bg-surface-light transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="text-sm">导入配置</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="p-3 md:p-4 glass-card border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-surface-lighter hover:bg-surface-light transition-colors md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className={`w-10 h-10 rounded-xl bg-${currentConfig.color}/10 flex items-center justify-center flex-shrink-0`}>
                <CurrentIcon className={`w-5 h-5 text-${currentConfig.color}`} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-text truncate">{currentConfig.label}</h2>
                <p className="text-xs md:text-sm text-text-muted">{models.length} 个模型已配置</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}
                className="p-2 rounded-lg bg-surface-lighter hover:bg-surface-light transition-colors"
              >
                {viewMode === 'list' ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新增模型</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            {models.length > 0 ? (
              viewMode === 'list' ? (
                <div className="glass-card rounded-xl overflow-hidden">
                  <table className="w-full hidden md:table">
                    <thead className="border-b border-border">
                      <tr className="text-left text-sm text-text-muted">
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">厂商</th>
                        <th className="px-4 py-3 font-medium">模型名称</th>
                        <th className="px-4 py-3 font-medium">备注</th>
                        <th className="px-4 py-3 font-medium">启用</th>
                        <th className="px-4 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((model) => (
                        <tr key={model.id} className="border-b border-border last:border-b-0 hover:bg-surface-lighter/50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTestConnection(model)}
                              disabled={testingModelId === model.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                testingModelId === model.id
                                  ? 'bg-primary/10 text-primary cursor-not-allowed'
                                  : model.connectionStatus === 'success'
                                  ? 'bg-success/10 text-success hover:bg-success/20'
                                  : model.connectionStatus === 'failed'
                                  ? 'bg-error/10 text-error hover:bg-error/20'
                                  : 'bg-surface-lighter text-text-muted hover:bg-surface-light hover:text-text'
                              }`}
                            >
                              {testingModelId === model.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  测试中...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4" />
                                  {model.connectionStatus === 'success' || model.connectionStatus === 'failed' ? '重测' : '测试'}
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {model.vendor === 'custom' ? '自定义' : vendorPresets[model.vendor].name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ConnectionStatusIcon status={model.connectionStatus} />
                              <span className="font-medium text-text">{model.modelName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-sm">{model.remark || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleEnabled(model)}
                              className={`relative w-11 h-6 rounded-full transition-colors ${
                                model.enabled ? 'bg-primary' : 'bg-surface-lighter'
                              }`}
                            >
                              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                model.enabled ? 'left-6' : 'left-1'
                              }`} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(model)}
                                className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(model.id)}
                                className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="md:hidden space-y-3 p-3">
                    {models.map((model) => (
                      <div key={model.id} className="glass-card glass-card-hover rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ConnectionStatusIcon status={model.connectionStatus} size="sm" />
                            <span className="font-bold text-text text-base">{model.modelName}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            model.enabled ? 'bg-success/10 text-success' : 'bg-text-dim/10 text-text-dim'
                          }`}>
                            {model.enabled ? '已启用' : '已禁用'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            {model.vendor === 'custom' ? '自定义' : vendorPresets[model.vendor].name}
                          </span>
                          <button
                            onClick={() => handleTestConnection(model)}
                            disabled={testingModelId === model.id}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              testingModelId === model.id
                                ? 'bg-primary/10 text-primary'
                                : model.connectionStatus === 'success'
                                ? 'bg-success/10 text-success'
                                : model.connectionStatus === 'failed'
                                ? 'bg-error/10 text-error'
                                : 'bg-surface-lighter text-text-muted'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {testingModelId === model.id ? '测试中' : model.connectionStatus === 'success' || model.connectionStatus === 'failed' ? '重测' : '测试'}
                          </button>
                        </div>

                        {model.remark && (
                          <p className="text-sm text-text-muted mb-3">{model.remark}</p>
                        )}

                        <p className="text-xs text-text-dim truncate mb-3 pb-3 border-b border-border">
                          {model.baseUrl}
                        </p>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleToggleEnabled(model)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              model.enabled 
                                ? 'bg-warning/10 text-warning hover:bg-warning/20' 
                                : 'bg-success/10 text-success hover:bg-success/20'
                            }`}
                          >
                            {model.enabled ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            {model.enabled ? '禁用' : '启用'}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenModal(model)}
                              className="p-2 rounded-lg bg-surface-lighter text-text-muted hover:text-text hover:bg-surface-light transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(model.id)}
                              className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {models.map((model) => (
                    <div key={model.id} className="glass-card glass-card-hover rounded-xl p-4 md:p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ConnectionStatusIcon status={model.connectionStatus} />
                          <h3 className="font-bold text-text">{model.modelName}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          model.enabled ? 'bg-success/10 text-success' : 'bg-text-dim/10 text-text-dim'
                        }`}>
                          {model.enabled ? '已启用' : '已禁用'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {model.vendor === 'custom' ? '自定义' : vendorPresets[model.vendor].name}
                        </span>
                        <button
                          onClick={() => handleTestConnection(model)}
                          disabled={testingModelId === model.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            testingModelId === model.id
                              ? 'bg-primary/10 text-primary'
                              : model.connectionStatus === 'success'
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : model.connectionStatus === 'failed'
                              ? 'bg-error/10 text-error hover:bg-error/20'
                              : 'bg-surface-lighter text-text-muted hover:bg-surface-light hover:text-text'
                          }`}
                        >
                          {testingModelId === model.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              测试中
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              {model.connectionStatus === 'success' || model.connectionStatus === 'failed' ? '重测' : '测试'}
                            </>
                          )}
                        </button>
                      </div>

                      {model.remark && (
                        <p className="text-sm text-text-muted mb-4">{model.remark}</p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-text-dim truncate flex-1 mr-2 md:mr-4">
                          {model.baseUrl}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(model)}
                            className="p-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(model.id)}
                            className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleEnabled(model)}
                            className={`p-2 rounded-lg transition-colors ${
                              model.enabled ? 'hover:bg-warning/10 text-text-muted hover:text-warning' : 'hover:bg-success/10 text-text-muted hover:text-success'
                            }`}
                          >
                            {model.enabled ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted text-center px-4">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-${currentConfig.color}/10 flex items-center justify-center mb-4`}>
                  <CurrentIcon className={`w-8 h-8 md:w-10 md:h-10 text-${currentConfig.color}`} />
                </div>
                <p className="text-lg mb-2">暂无{currentConfig.label}</p>
                <p className="text-sm mb-6">点击上方按钮添加您的第一个模型</p>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  新增模型
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-text">
                {editingModel ? '编辑模型' : '新增模型'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-surface-lighter transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">厂商</label>
                <select
                  value={formData.vendor}
                  onChange={(e) => handleVendorChange(e.target.value as VendorType)}
                  className="input-field py-3"
                >
                  <option value="aliyun">阿里云百炼</option>
                  <option value="volcengine">火山引擎</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">模型名称</label>
                <select
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                  className="input-field py-3"
                >
                  <option value="">请选择模型</option>
                  {formData.vendor !== 'custom' && vendorPresets[formData.vendor]?.models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="input-field py-3 pr-12"
                    placeholder="sk-xxxxxxxx..."
                  />
                  <button
                    onClick={() => {
                      if (formData.apiKey) {
                        navigator.clipboard.writeText(formData.apiKey);
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">API地址</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="input-field py-3"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">备注（可选）</label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="input-field py-3"
                  placeholder="模型用途说明..."
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-muted">启用状态</span>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    formData.enabled ? 'bg-primary' : 'bg-surface-lighter'
                  }`}
                >
                  <span className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    formData.enabled ? 'left-8' : 'left-1.5'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-2">
              <button
                onClick={handleCloseModal}
                className="flex-1 btn-secondary py-3"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 btn-primary py-3"
              >
                {editingModel ? '保存修改' : '添加模型'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
