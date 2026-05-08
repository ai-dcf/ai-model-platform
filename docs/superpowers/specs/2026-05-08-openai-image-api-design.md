# OpenAI 兼容协议接入火山引擎图像接口改造设计文档

> **创建时间**：2026-05-08
> **功能名称**：图像生成接口改为 OpenAI 兼容协议调用火山引擎 Ark
> **状态**：待实施

## 1. 功能概述

### 1.1 背景

当前图像生成接口位于 `app/api/image/route.ts`，请求路径使用 `${baseUrl}/images/generations`，但请求体采用了 `negative_prompt`、`width`、`height` 等字段，同时没有传递 `model`，与用户提供的火山引擎 Ark OpenAI 兼容示例不一致。

现有问题：

- 接口行为没有对齐火山引擎 Ark 的 OpenAI 兼容图像生成协议
- 图像模型名称在前端已配置，但后端实际没有使用
- 当前尺寸参数为宽高数值，和示例中的 `size` 字符串不一致
- 当前接口缺少 `output_format`、`response_format` 以及 `extra_body` 这类兼容参数扩展点

### 1.2 目标

本次调整目标如下：

- 将 `app/api/image/route.ts` 改为按 OpenAI 兼容协议调用火山引擎 Ark 图像生成接口
- 使用 `modelConfig.modelName` 作为实际下游模型名
- 将前端传入的 `width` / `height` 映射为火山引擎支持的 `size`
- 支持请求中透传或生成 `output_format`、`response_format` 和 `extra_body.watermark`
- 保留当前接口路由和基本日志结构，降低调用方改动范围

### 1.3 非目标

本次不包含以下内容：

- 不改为调用 OpenAI 官方图像服务
- 不扩展为 OpenAI 官方与火山引擎双模式
- 不重构整个模型配置页为火山引擎专用产品形态
- 不新增图像编辑、局部重绘、参考图等能力

---

## 2. 需求确认

### 2.1 用户确认结论

- 图像接口改造方向为“按 OpenAI 兼容协议接火山引擎 Ark”
- 以用户提供的火山引擎示例作为下游协议参考
- 采用最小必要改动，优先修正接口行为

### 2.2 成功标准

满足以下条件即视为完成：

- 图像接口向火山引擎 Ark 的 `images/generations` 接口发送请求
- 请求体至少包含 `model`、`prompt`、`size`
- 支持生成或透传 `output_format`、`response_format`
- 不再依赖 `negative_prompt`、`width`、`height` 作为下游协议字段
- 返回结果仍能被图片页正常消费
- 项目通过类型检查或构建检查

---

## 3. 方案选择

### 3.1 备选方案

#### 方案 A：仅改后端协议

只修改 `app/api/image/route.ts`，将现有请求体改为火山引擎 Ark OpenAI 兼容字段，前端保持原样传 `width` / `height`。

优点：

- 改动最小
- 风险可控
- 可快速验证火山引擎兼容生成链路

缺点：

- 前端仍保留部分非 Ark 参数语义
- 宽高到尺寸字符串的转换责任集中在后端

#### 方案 B：后端改协议并同步收敛前端语义

在方案 A 基础上，视需要调整前端提示或传参表达，使接口和页面语义更接近火山引擎兼容接口能力。

优点：

- 协议语义更完整
- 后续维护更清晰

缺点：

- 改动范围略大于方案 A

#### 方案 C：全面重做图像模型配置体系

将配置页、预置厂商、图像参数和提示文案全部收敛为火山引擎专用。

优点：

- 产品表达最统一

缺点：

- 超出本次需求
- 会影响较多现有配置与页面逻辑

### 3.2 最终选择

采用方案 B：后端改为火山引擎 Ark OpenAI 兼容协议，同时做最小必要的前端语义收敛。

选择理由：

- 满足用户给出的火山引擎兼容示例要求
- 保留现有路由与调用链，便于快速落地
- 相比只改后端，能减少后续继续误传无效参数的维护成本

---

## 4. 接口设计

### 4.1 输入参数

图片页仍向 `/api/image` 发送请求，但后端按如下方式解释字段：

- `modelConfig.apiKey`：火山引擎 Ark API Key
- `modelConfig.baseUrl`：Ark Base URL，期望为 `https://ark.cn-beijing.volces.com/api/v3`
- `modelConfig.modelName`：火山引擎图像模型名，例如 `doubao-seedream-5-0-260128`
- `prompt`：图像生成提示词
- `width` / `height`：仅作为本地尺寸映射输入，不直接透传给下游
- `n`：生成张数
- `outputFormat`：可选，输出格式，默认 `png`
- `responseFormat`：可选，响应格式，默认 `url`
- `watermark`：可选，是否加水印，默认 `false`

### 4.2 下游请求

后端向 `${baseUrl}/images/generations` 发送 `POST` 请求，请求体结构为：

```typescript
{
  model: modelConfig.modelName,
  prompt,
  size,
  n,
  output_format,
  response_format,
  extra_body: {
    watermark,
  },
}
```

说明：

- `size` 为火山引擎支持的尺寸字符串
- 不再发送 `negative_prompt`
- 不再发送 `width` 与 `height`
- `output_format` 默认发送 `png`
- `response_format` 默认发送 `url`
- `extra_body.watermark` 默认发送 `false`

---

## 5. 尺寸映射设计

### 5.1 映射原则

火山引擎 Ark 的 OpenAI 兼容图像生成接口使用 `size` 字符串，而当前页面使用数值宽高。为尽量不改动页面结构，后端负责做宽高到 `size` 的映射。

### 5.2 映射规则

优先支持以下两种映射策略之一：

- 严格按平台枚举值传递，例如 `2K`
- 兼容按宽高比收敛到预设尺寸档位

基于用户示例，本次优先推荐使用平台枚举值，默认规则如下：

- `width === height` -> `1K`
- `width > height` -> `2K`
- `width < height` -> `2K`

这样可以先覆盖当前页面中的：

- `1:1`
- `4:3`
- `3:4`
- `16:9`
- `9:16`

其中 `4:3`、`16:9`、`3:4`、`9:16` 会统一收敛到较高分辨率档位，后续如需更精细控制，再单独扩展映射表。

### 5.3 设计取舍

- 不因前端传入非平台原生尺寸而直接报错
- 通过统一收敛规则保证页面仍可使用现有比例按钮
- 在日志中记录最终映射后的 `size`，便于排查生成结果与页面比例不完全一致的问题

---

## 6. 文件改动设计

### 6.1 修改文件

#### `app/api/image/route.ts`

职责调整：

- 从 `modelConfig` 中读取 `modelName`
- 构造火山引擎 Ark OpenAI 兼容请求体
- 增加宽高到 `size` 的映射函数
- 调整日志内容，记录 `model`、`size`、`output_format`、`response_format`
- 保持现有成功返回结构 `{ success: true, images }`

#### `app/image/page.tsx`

职责调整：

- 保持当前调用 `/api/image` 的主流程不变
- 视实现需要增加 `outputFormat`、`responseFormat` 和 `watermark` 的可选默认值
- 若无需额外改动，则继续保留现有 `width` / `height` 作为页面输入参数

### 6.2 暂不改动文件

以下文件本次不做强制调整：

- `app/config/page.tsx`
- `app/api/test-connection/route.ts`

说明：

- 本次目标是修正图像生成接口，不扩大到配置体系重构
- 但后续若要让“火山引擎 Ark OpenAI 兼容接入”在配置页层面表达更准确，可单独追加改造

---

## 7. 错误处理设计

### 7.1 参数校验

继续保留以下必要校验：

- `modelConfig` 存在
- `prompt` 非空
- `modelConfig.apiKey` 非空
- `modelConfig.baseUrl` 非空
- `modelConfig.modelName` 非空

缺失时返回 `400`，并给出明确提示。

### 7.2 下游错误透传

当火山引擎 Ark 返回错误时：

- 优先读取 `data.error.message`
- 无明确消息时回退为 `生成失败`
- 日志中保留状态码、耗时和错误体摘要

### 7.3 网络与异常处理

沿用当前 `try/catch` 结构：

- 网络错误返回 `500`
- 非预期异常返回 `500`
- 返回文案保持简洁，避免将堆栈直接暴露给前端

---

## 8. 测试策略

### 8.1 静态检查

- 检查 `app/api/image/route.ts` 的 TypeScript 类型是否通过
- 如有必要，检查 `app/image/page.tsx` 的类型与引用是否保持一致

### 8.2 功能回归

至少验证以下场景：

- 配置为火山引擎 Ark API Key、Ark Base URL、有效图像模型名后可成功生成图片
- 正方形比例可正常生成
- 横图比例可正常生成
- 竖图比例可正常生成
- 当 API Key、Base URL 或模型名缺失时可返回明确错误
- 默认 `output_format=png`、`response_format=url`、`watermark=false` 时可正常生成

### 8.3 风险点

- 当前配置页仍允许填写任意 Base URL，可能导致用户配置错误
- 某些图像模型可能对 `n` 或尺寸支持范围更严格，需要依赖真实接口反馈
- 页面比例按钮与实际生成尺寸不完全一致时，用户可能感知到输出尺寸被收敛

---

## 9. 实施范围

本次实施严格限定在以下范围：

- 改造 `app/api/image/route.ts` 为火山引擎 Ark OpenAI 兼容图像生成调用
- 必要时同步微调 `app/image/page.tsx`
- 进行类型检查、诊断和最小回归验证

不包含：

- 配置页产品化重构
- OpenAI 官方与火山引擎双协议并存
- 图像模型连通性测试接口重写
- 新增图片编辑类 API

---

## 10. 验收标准

- `app/api/image/route.ts` 下游请求体使用火山引擎 Ark OpenAI 兼容核心字段
- 图像模型名称真正参与下游调用
- 宽高输入能够稳定映射到平台支持的 `size`
- 默认请求包含 `output_format`、`response_format` 与 `extra_body.watermark`
- 图片页仍可消费返回的图片 URL 列表
- 项目通过类型检查或构建验证
