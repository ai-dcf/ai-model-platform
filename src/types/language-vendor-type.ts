export type LanguageVendorType = 'aliyun' | 'volcengine' | 'volcengine_coding_plan' | 'volcengine_agent_plan';

export interface LanguageVendorPreset {
  name: string;
  baseUrl: string;
  models: string[];
}

export const languageVendorPresets: Record<LanguageVendorType, LanguageVendorPreset> = {
  aliyun: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      'qwen3.5-plus',
      'qwen3-max',
      'qwen3-coder-next',
      'qwen3-coder-plus',
      'kimi-k2.5',
      'glm-5',
      'glm-4.7',
      'minimax-m2.5',
    ],
  },
  volcengine: {
    name: '火山引擎',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'Doubao-Seed-1.6',
      'Doubao-Seed-1.6-flash',
      'Doubao-Seed-1.6-thinking',
      'Doubao-pro-32k',
      'DeepSeek-R1',
      'DeepSeek-V3',
      'Hunyuan-Lite',
      'Hunyuan-Pro',
    ],
  },
  volcengine_coding_plan: {
    name: '火山引擎 Coding Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    models: [
      'doubao-seed-2.0-code'
    ],
  },
  volcengine_agent_plan: {
    name: '火山引擎 Agent Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3',
    models: [
      'doubao-seed-2.0-pro'
    ],
  },
};
