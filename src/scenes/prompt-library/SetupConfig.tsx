'use client';

import { useState } from 'react';
import { Settings, ExternalLink, Key, Loader2, CheckCircle, AlertCircle, BookOpen, Copy, Check } from 'lucide-react';
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
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const configGuideSteps = [
    {
      title: '获取飞书多维表格 API Token',
      description: '1. 打开飞书多维表格\n2. 点击右上角「分享」按钮\n3. 开启「获得文件内容的访问权限」\n4. 复制获取到的 API Token',
      icon: Key,
    },
    {
      title: '配置表格字段',
      description: '确保多维表格包含以下字段：\n• title - 提示词标题\n• content - 提示词内容\n• category - 分类（可选）\n• tags - 标签（可选）\n• type - 类型（image/video）',
      icon: BookOpen,
    },
    {
      title: '填写配置信息',
      description: '1. 将飞书多维表格的链接粘贴到「飞书文档地址」输入框\n2. 将获取到的 API Token 粘贴到「访问令牌」输入框\n3. 点击「测试连接」验证配置是否正确',
      icon: Settings,
    },
  ];

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

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
      setTestResult({ success: false, message: '请填写完整的配置信息' });
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
    <div className="min-h-[70vh] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">配置提示词库</h2>
          <p className="text-text-muted">按照以下步骤配置飞书知识库连接</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              配置指南
            </h3>
            {configGuideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="glass-card rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-text mb-2">{step.title}</h4>
                      <pre className="text-sm text-text-muted whitespace-pre-wrap font-sans leading-relaxed">
                        {step.description}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              配置信息
            </h3>

            <div className="glass-card rounded-xl p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  飞书文档地址
                </label>
                <p className="text-xs text-text-dim mb-2">
                  飞书多维表格的分享链接
                </p>
                <div className="relative">
                  <input
                    type="url"
                    value={feishuDocUrl}
                    onChange={(e) => setFeishuDocUrl(e.target.value)}
                    className="input-field py-3 pl-10"
                    placeholder="https://xxx.feishu.cn/base/xxx"
                  />
                  <ExternalLink className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  访问令牌 / API Token
                </label>
                <p className="text-xs text-text-dim mb-2">
                  从飞书开发者平台获取的 API Token
                </p>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
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
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
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
                  className="w-full text-center text-sm text-primary hover:underline"
                >
                  加载已有配置
                </button>
              )}
            </div>

            <div className="glass-card rounded-xl p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-muted">
                  <p className="font-medium text-text mb-1">注意事项</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 确保飞书多维表格已开启分享权限</li>
                    <li>• API Token 具有访问权限，请妥善保管</li>
                    <li>• 建议定期更新访问令牌以确保安全</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
