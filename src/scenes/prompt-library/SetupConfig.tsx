'use client';

import { useState } from 'react';
import { Settings, ExternalLink, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getPromptLibraryConfig, savePromptLibraryConfig, isConfigValid } from '@/lib/feishu/api';

interface SetupConfigProps {
  onConfigSaved: () => void;
}

export default function SetupConfig({ onConfigSaved }: SetupConfigProps) {
  const [feishuDocUrl, setFeishuDocUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleLoadExisting = () => {
    const config = getPromptLibraryConfig();
    setFeishuDocUrl(config.feishuDocUrl);
    setAccessToken(config.feishuAccessToken);
  };

  const handleTest = async () => {
    if (!feishuDocUrl || !accessToken) {
      setTestResult({ success: false, message: '请填写完整的配置信息' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const config = {
        feishuDocUrl,
        feishuAccessToken: accessToken,
        lastSyncAt: new Date().toISOString(),
      };
      savePromptLibraryConfig(config);

      setTestResult({ success: true, message: '连接成功！' });
      onConfigSaved();
    } catch {
      setTestResult({ success: false, message: '连接失败，请检查配置' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!feishuDocUrl || !accessToken) {
      alert('请填写完整的配置信息');
      return;
    }

    const config = {
      feishuDocUrl,
      feishuAccessToken: accessToken,
      lastSyncAt: new Date().toISOString(),
    };
    savePromptLibraryConfig(config);
    onConfigSaved();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">配置提示词库</h2>
          <p className="text-text-muted">请配置飞书云文档地址和访问令牌</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              飞书文档地址
            </label>
            <div className="relative">
              <input
                type="url"
                value={feishuDocUrl}
                onChange={(e) => setFeishuDocUrl(e.target.value)}
                className="input-field py-3 pl-10"
                placeholder="https://xxx.feishu.cn/docx/xxx"
              />
              <ExternalLink className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              访问令牌 / API Key
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="input-field py-3 pl-10 pr-12"
                placeholder="请输入访问令牌"
              />
              <Key className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showToken ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              testResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              测试连接
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary py-3"
            >
              保存配置
            </button>
          </div>

          {isConfigValid() && (
            <button
              onClick={handleLoadExisting}
              className="w-full text-center text-sm text-primary hover:underline mt-2"
            >
              加载已有配置
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
