# 模型连通性测试功能设计文档

> **创建时间**：2026-05-07
> **功能名称**：模型连通性测试
> **状态**：待实施

## 1. 功能概述

### 1.1 需求描述
在模型配置页面，为每个已配置的模型提供连通性测试功能，用户可以手动验证模型的 API Key 是否有效以及能否正常对话。

### 1.2 测试策略
采用双重验证策略：
1. **API Key 有效性验证** - 发送轻量级请求验证凭证
2. **对话能力测试** - 发送简单测试消息验证实际对话能力

---

## 2. 数据模型设计

### 2.1 ModelItem 扩展

```typescript
interface ModelItem {
  id: string;
  type: 'text' | 'image' | 'video';
  modelName: string;
  vendor: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  connectionStatus: ConnectionStatus;  // 新增
  lastTestedAt?: string;              // 新增
}

type ConnectionStatus = 'untested' | 'testing' | 'success' | 'failed';
```

### 2.2 默认状态
- 新增模型：`connectionStatus: 'untested'`
- 从 LocalStorage 加载：保持原有状态

---

## 3. API 设计

### 3.1 测试请求接口

**端点**：`POST /api/test-connection`

**请求体**：
```json
{
  "modelConfig": {
    "vendor": "aliyun",
    "modelName": "qwen-turbo",
    "apiKey": "sk-xxxx",
    "baseUrl": "https://dashscope.aliyuncs.com"
  },
  "type": "text" | "image"
}
```

**响应体**：
```json
{
  "success": true,
  "message": "连接成功",
  "latency": 1234
}
```

或失败响应：
```json
{
  "success": false,
  "message": "API Key 无效或已过期",
  "error": "invalid_api_key"
}
```

### 3.2 测试流程

1. **发送 API Key 验证请求**
   - 文本模型：调用 `/v1/models` 或发送简单对话
   - 图像模型：调用模型列表接口

2. **发送测试消息**（可选，用于验证对话能力）
   - 文本模型：发送 "你好" 并等待响应
   - 图像模型：跳过此步

3. **汇总结果**
   - 任一步骤失败则整体失败
   - 所有步骤成功则标记为成功

---

## 4. UI/UX 设计

### 4.1 状态图标规范

| 状态 | 图标 | 颜色 | 位置 |
|------|------|------|------|
| 未测试 | 空心圆 (Circle) | `text-text-dim` | 模型名称左侧 |
| 测试中 | 旋转圆环 (Loader2 + animate-spin) | `text-primary` | 模型名称左侧 |
| 成功 | 对勾圆圈 (CheckCircle) | `text-success` | 模型名称左侧 |
| 失败 | 叉号圆圈 (XCircle) | `text-error` | 模型名称左侧 |

### 4.2 测试按钮

**位置**：模型卡片右上角

**样式**：
- 图标：Zap (闪电)
- 文字：测试
- 圆角：rounded-lg
- 背景：`bg-primary/10`
- Hover：`bg-primary/20`

**状态**：
| 状态 | 样式 |
|------|------|
| 正常 | Zap 图标 + "测试" 文字 |
| 测试中 | Loader2 旋转图标 + "测试中..." 文字，按钮禁用 |
| 已成功 | Zap 图标 + "重测" 文字 |
| 已失败 | Zap 图标 + "重测" 文字 |

### 4.3 模型卡片布局

```
┌────────────────────────────────────────────────────────────┐
│  [状态图标] 模型名称                      [闪电图标 测试]  │
│                                                            │
│  供应商: 阿里云百炼                                         │
│  模型: qwen-turbo                                          │
│  API Key: ••••••••••••                                    │
│  Base URL: https://api.dashscope.com                       │
└────────────────────────────────────────────────────────────┘
```

### 4.4 交互流程

```
用户点击 "测试" 按钮
    ↓
按钮变为 "测试中..." 状态（禁用）
状态图标变为旋转加载
    ↓
发送验证请求
    ↓
┌─────────────────────────────────────┐
│ 成功                                 │
│   状态图标变为 对勾 (绿色)            │
│   按钮变为 "重测"                    │
│   显示成功提示（toast）              │
│   保存状态到 LocalStorage            │
└─────────────────────────────────────┘
    ↓ 或
┌─────────────────────────────────────┐
│ 失败                                 │
│   状态图标变为 叉号 (红色)            │
│   按钮变为 "重测"                    │
│   显示错误原因（toast）              │
│   保存状态到 LocalStorage            │
└─────────────────────────────────────┘
```

### 4.5 Toast 提示

| 类型 | 内容 | 颜色 |
|------|------|------|
| 成功 | "✓ 连接成功" | `bg-success` |
| 失败 | "✗ 连接失败：{错误原因}" | `bg-error` |

---

## 5. 实施计划

### 5.1 文件修改清单

1. **lib/storage.ts**
   - 扩展 ModelItem 接口
   - 更新 getModels() 返回默认状态
   - 更新 saveModel() 保存状态

2. **app/api/test-connection/route.ts** (新建)
   - 处理连通性测试请求
   - 验证 API Key
   - 发送测试消息

3. **app/config/page.tsx**
   - 显示状态图标
   - 添加测试按钮
   - 实现测试逻辑
   - 更新卡片布局

### 5.2 测试用例

1. **成功场景**
   - 配置有效 API Key → 点击测试 → 显示 成功

2. **失败场景**
   - 配置无效 API Key → 点击测试 → 显示 失败
   - 网络错误 → 显示 失败

3. **重复测试**
   - 首次成功 → 修改 API Key → 重测 → 显示新结果

---

## 6. 技术实现细节

### 6.1 文本模型测试

```typescript
// 验证 API Key
const response = await fetch(`${baseUrl}/v1/models`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// 测试对话能力
const chatResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: modelName,
    messages: [{ role: 'user', content: '你好' }]
  })
});
```

### 6.2 图像模型测试

```typescript
// 验证 API Key
const response = await fetch(`${baseUrl}/v1/models`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### 6.3 错误处理

| 错误类型 | 错误消息 |
|----------|----------|
| 401 Unauthorized | API Key 无效或已过期 |
| 403 Forbidden | 没有访问权限 |
| 404 Not Found | 模型不存在 |
| 429 Rate Limited | 请求过于频繁，请稍后再试 |
| 500 Server Error | 服务器内部错误 |
| Network Error | 网络连接失败 |

---

## 7. 性能考虑

- **超时设置**：请求超时 10 秒
- **并发限制**：禁止同时测试同一模型
- **缓存结果**：保存测试结果，避免重复测试
- **清理机制**：API Key 变更时自动重置状态

---

## 8. 总结

本次设计提供：
- ✓ 手动触发连通性测试
- ✓ 双重验证策略（API Key + 对话能力）
- ✓ 清晰的图标状态展示
- ✓ 闪电图标测试按钮
- ✓ Toast 提示反馈
- ✓ 状态持久化存储
