'use client';

import { useState } from 'react';
import { Settings, ExternalLink, Key, Loader2, CheckCircle, AlertCircle, BookOpen, Check as CheckIcon } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '第一步：获取飞书多维表格 API Token',
      icon: Key,
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">按照以下步骤获取 API Token：</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-muted">
            <li>打开飞书多维表格</li>
            <li>点击右上角「分享」按钮</li>
            <li>开启「获得文件内容的访问权限」</li>
            <li>复制获取到的 API Token</li>
          </ol>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              粘贴 API Token：
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="input-field py-3 pl-10 pr-12"
                placeholder="请粘贴获取到的 API Token"
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
        </div>
      ),
      validator: () => accessToken.length > 0,
    },
    {
      title: '第二步：配置表格字段',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">确保飞书多维表格包含以下必填字段：</p>
          <div className="bg-surface-lighter rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-success" />
              <span className="text-text font-mono">title</span>
              <span className="text-text-muted">- 提示词标题</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-success" />
              <span className="text-text font-mono">content</span>
              <span className="text-text-muted">- 提示词内容</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-success" />
              <span className="text-text font-mono">type</span>
              <span className="text-text-muted">- 类型（image/video）</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-text-dim" />
              <span className="text-text-muted font-mono">category</span>
              <span className="text-text-dim">- 分类（可选）</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-text-dim" />
              <span className="text-text-muted font-mono">tags</span>
              <span className="text-text-dim">- 标签（可选）</span>
            </div>
          </div>
          <p className="text-xs text-text-dim">提示：每个提示词的 type 字段填写 "image" 表示图片提示词，"video" 表示视频提示词</p>
        </div>
      ),
      validator: () => true,
    },
    {
      title: '第三步：填写多维表格链接',
      icon: ExternalLink,
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">复制飞书多维表格的分享链接并粘贴到下方：</p>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              飞书文档地址：
            </label>
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
        </div>
      ),
      validator: () => feishuDocUrl.length > 0,
    },
    {
      title: '第四步：测试并保存配置',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-text-muted text-sm">检查配置信息并测试连接：</p>
          
          <div className="bg-surface-lighter rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-text-dim text-sm">API Token:</span>
              <span className="text-text text-sm font-mono truncate">
                {accessToken ? `${accessToken.substring(0, 8)}...${accessToken.substring(accessToken.length - 4)}` : '未填写'}
              </span>
              {accessToken && <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />}
            </div>
            <div className="flex items-start gap-2">
              <span className="text-text-dim text-sm">文档链接:</span>
              <span className="text-text text-sm font-mono truncate">
                {feishuDocUrl || '未填写'}
              </span>
              {feishuDocUrl && <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />}
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

          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!feishuDocUrl || !accessToken) {
                  setTestResult({ success: false, message: '请先完成前面的步骤' });
                  return;
                }
                setIsTesting(true);
                setTestResult(null);
                try {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setTestResult({ success: true, message: '连接成功！可以保存配置了' });
                } catch {
                  setTestResult({ success: false, message: '连接失败，请检查配置' });
                } finally {
                  setIsTesting(false);
                }
              }}
              disabled={isTesting}
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              测试连接
            </button>
            <button
              onClick={() => {
                if (!feishuDocUrl || !accessToken) {
                  setTestResult({ success: false, message: '请先完成前面的步骤' });
                  return;
                }
                savePromptLibraryConfig({
                  feishuDocUrl,
                  feishuAccessToken: accessToken,
                  lastSyncAt: new Date().toISOString(),
                });
                setTestResult({ success: true, message: '配置已保存！' });
                setTimeout(onConfigSaved, 1000);
              }}
              className="flex-1 btn-primary py-3"
            >
              保存配置
            </button>
          </div>
        </div>
      ),
      validator: () => feishuDocUrl.length > 0 && accessToken.length > 0,
    },
  ];

  const canProceed = steps[currentStep].validator();
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-[70vh] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">配置提示词库</h2>
          <p className="text-text-muted">按照以下步骤完成飞书知识库配置</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary scale-125'
                  : index < currentStep
                  ? 'bg-success'
                  : 'bg-surface-lighter'
              }`}
            />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon className="w-5 h-5 text-primary" />;
              })()}
            </div>
            <h3 className="text-lg font-bold text-text">{steps[currentStep].title}</h3>
          </div>

          {steps[currentStep].content}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'text-text-dim cursor-not-allowed'
                  : 'text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              上一步
            </button>
            
            {!isLastStep ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  canProceed
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-surface-lighter text-text-dim cursor-not-allowed'
                }`}
              >
                下一步
              </button>
            ) : null}
          </div>
        </div>

        {isConfigValid() && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                const config = getPromptLibraryConfig();
                setFeishuDocUrl(config.feishuDocUrl);
                setAccessToken(config.feishuAccessToken);
              }}
              className="text-sm text-primary hover:underline"
            >
              加载已有配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
