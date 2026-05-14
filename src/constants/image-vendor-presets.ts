export const imageVendorPresets = {
  aliyun: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      'wan2.7-image-pro',
      'wan2.7-image',
      'qwen-image-2.0-pro',
      'qwen-image-2.0',
      'z-image-turbo',
    ],
  },
  volcengine: {
    name: '火山引擎',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-seedream-5-0-lite-260128',
      'doubao-seedream-5-0-260128',
      'doubao-seedream-4-5-251128',
      'doubao-seedream-4-0-250828',
    ],
  },
  volcengine_agent_plan: {
    name: '火山引擎 Agent Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3',
    models: [
      'doubao-seedream-5.0-lite',
    ],
  },
} as const;

export type ImageVendorType = keyof typeof imageVendorPresets;
