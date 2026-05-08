# 图像模型尺寸配置抽离设计文档

> **创建时间**：2026-05-08
> **功能名称**：将火山图像模型 `size` 规则抽离为模型级配置
> **状态**：待实施

## 1. 功能概述

### 1.1 背景

当前 `app/api/image/route.ts` 中直接维护了图像尺寸映射逻辑，包括：

- 通用宽高比列表
- 推荐像素值映射
- 对 `doubao-seedream-5.0-lite` / `4.5` / `4.0` 的最小尺寸兜底

这导致模型能力与路由逻辑耦合在一起。尤其对火山引擎 `doubao-seedream-5.0-lite` 而言，`size` 并不是一张简单表，而是由“分辨率档位 + 宽高比”共同决定最终像素值。

### 1.2 目标

本次调整目标如下：

- 将 `doubao-seedream-5.0-lite` 的 `size` 规则从 `route.ts` 抽离到 `lib/image-vendor-presets.ts`
- 该规则独立于 `imageVendorPresets` 和 `volcengine_agent_plan`，作为单独的模型级配置区存在
- 用显式配置表达：
  - 支持的分辨率档位
  - 支持的宽高比
  - 不同档位下对应宽高比的推荐像素值
- `route.ts` 只负责查配置、匹配宽高比并取最终 `size`

### 1.3 非目标

本次不包含以下内容：

- 不重构整个 `imageVendorPresets` 的厂商结构
- 不修改配置页 UI 来展示档位或支持比例
- 不为所有火山模型一次性补全模型级配置
- 不扩展为用户在前端手动选择 `2K / 3K / 4K`

---

## 2. 需求确认

### 2.1 用户确认结论

- `size` 规则不放在 `volcengine_agent_plan` 内部
- 规则放在 `lib/image-vendor-presets.ts` 中独立的模型级配置区
- `doubao-seedream-5.0-lite` 的尺寸配置采用“两段式”表达：
  - 分辨率档位：`2K`、`3K`、`4K`
  - 宽高比：`1:1`、`4:3`、`3:4`、`16:9`、`9:16`、`3:2`、`2:3`、`21:9`
- 需要增加显式的“支持的宽高比列表”

### 2.2 成功标准

满足以下条件即视为完成：

- `doubao-seedream-5.0-lite` 的尺寸规则不再硬编码在 `route.ts`
- `lib/image-vendor-presets.ts` 中存在独立的模型级配置导出
- 该模型配置包含：
  - `supportedTiers`
  - `supportedAspectRatios`
  - `sizeTable`
- `route.ts` 命中 `doubao-seedream-5.0-lite` 时，使用该模型级配置生成 `size`
- 其他模型仍可走现有 fallback 逻辑

---

## 3. 方案选择

### 3.1 备选方案

#### 方案 A：挂到 vendor preset 内部

把 `doubao-seedream-5.0-lite` 的尺寸规则挂在 `volcengine_agent_plan` 之下。

优点：

- 结构集中在厂商项里

缺点：

- 模型级规则和厂商级配置混在一起
- 模型以后迁移到其他 vendor 时不易复用
- 不符合“独立到 vendor 外面”的要求

#### 方案 B：独立模型级配置区

在 `lib/image-vendor-presets.ts` 内新增单独导出，例如 `imageModelConfigs`，按模型名索引模型协议能力。

优点：

- 厂商级与模型级职责分离
- 便于表达具体模型的特殊协议能力
- 后续追加 `doubao-seedream-4.5`、`4.0` 时结构自然

缺点：

- 需要为配置文件补充一组新的类型定义

#### 方案 C：只抽取最小档位开关

配置文件只声明该模型“最小使用 2K”，完整尺寸表仍留在 `route.ts`。

优点：

- 改动最小

缺点：

- 没有真正把模型 `size` 规则抽离出去
- 不满足用户希望的模型级配置表达

### 3.2 最终选择

采用方案 B：在 `lib/image-vendor-presets.ts` 中新增独立的模型级配置区。

选择理由：

- 最符合用户要求的配置边界
- 能完整表达“分辨率档位 + 宽高比”的两段式规则
- 有利于后续扩展更多模型的特有协议配置

---

## 4. 配置结构设计

### 4.1 新增导出

在 `lib/image-vendor-presets.ts` 中保留现有 `imageVendorPresets` 的同时，新增：

```typescript
export const imageModelConfigs = {
  'doubao-seedream-5.0-lite': {
    sizeStrategy: 'tiered-ratio-table',
    defaultTier: '2K',
    supportedTiers: ['2K', '3K', '4K'],
    supportedAspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'],
    sizeTable: {
      '2K': { ... },
      '3K': { ... },
      '4K': { ... },
    },
  },
} as const;
```

### 4.2 字段说明

- `sizeStrategy`
  - 当前固定为 `tiered-ratio-table`
  - 用于表达该模型按“分辨率档位 + 宽高比”取值

- `defaultTier`
  - 当前固定为 `2K`
  - 在前端未传档位时，`route.ts` 默认使用这个档位

- `supportedTiers`
  - 显式声明当前模型支持的分辨率档位
  - 当前为 `2K`、`3K`、`4K`

- `supportedAspectRatios`
  - 显式声明当前模型支持的宽高比集合
  - 路由匹配最近比例时只在这个集合中取值

- `sizeTable`
  - 二维映射表
  - 第一维是分辨率档位
  - 第二维是宽高比
  - 值为最终传给 Ark 的像素字符串

### 4.3 `doubao-seedream-5.0-lite` 尺寸表

#### `2K`

- `1:1` -> `2048x2048`
- `4:3` -> `2304x1728`
- `3:4` -> `1728x2304`
- `16:9` -> `2848x1600`
- `9:16` -> `1600x2848`
- `3:2` -> `2496x1664`
- `2:3` -> `1664x2496`
- `21:9` -> `3136x1344`

#### `3K`

- `1:1` -> `3072x3072`
- `4:3` -> `3456x2592`
- `3:4` -> `2592x3456`
- `16:9` -> `4096x2304`
- `9:16` -> `2304x4096`
- `3:2` -> `3744x2496`
- `2:3` -> `2496x3744`
- `21:9` -> `4704x2016`

#### `4K`

- `1:1` -> `4096x4096`
- `4:3` -> `4704x3520`
- `3:4` -> `3520x4704`
- `16:9` -> `5504x3040`
- `9:16` -> `3040x5504`
- `3:2` -> `4992x3328`
- `2:3` -> `3328x4992`
- `21:9` -> `6240x2656`

---

## 5. 路由改造设计

### 5.1 `route.ts` 职责变化

`app/api/image/route.ts` 改造后职责如下：

- 保留请求解析、日志、下游请求与错误处理
- 从 `imageModelConfigs` 中读取模型级 `size` 配置
- 根据当前 `modelName` 决定是否命中特殊模型规则
- 根据前端 `width` / `height` 匹配最近的宽高比
- 结合 `defaultTier` 与 `sizeTable` 生成最终 `size`

### 5.2 尺寸解析流程

当 `modelName === 'doubao-seedream-5.0-lite'` 且命中模型配置时：

1. 从配置中读取：
   - `defaultTier`
   - `supportedAspectRatios`
   - `sizeTable`
2. 根据前端 `width / height` 计算实际宽高比
3. 在 `supportedAspectRatios` 中寻找最接近的比例
4. 使用 `sizeTable[defaultTier][matchedRatio]` 生成最终 `size`

当模型未命中配置时：

- 继续走当前默认 fallback 映射逻辑，避免影响其他模型

### 5.3 Fallback 保留策略

本次不会删除所有默认尺寸映射逻辑，而是改成：

- 特定模型优先走模型级配置
- 通用模型继续使用默认宽高比映射

这样能避免本次改动扩大到所有图像模型。

---

## 6. 类型设计

### 6.1 建议新增类型

在 `lib/image-vendor-presets.ts` 中增加以下类型：

```typescript
export type ImageAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3' | '21:9';
export type ImageSizeTier = '2K' | '3K' | '4K';
```

并为模型级配置定义结构：

```typescript
type TieredRatioSizeConfig = {
  sizeStrategy: 'tiered-ratio-table';
  defaultTier: ImageSizeTier;
  supportedTiers: readonly ImageSizeTier[];
  supportedAspectRatios: readonly ImageAspectRatio[];
  sizeTable: Record<ImageSizeTier, Record<ImageAspectRatio, string>>;
};
```

### 6.2 路由中的类型边界

`route.ts` 不再自行维护 `AspectRatioKey` 的主定义，而应尽量复用配置文件导出的类型，减少重复定义。

若实现上为了避免过多耦合保留少量本地辅助类型，也应保证其与配置文件的导出类型一致。

---

## 7. 风险与处理

### 7.1 风险：路由仍残留旧模型兜底逻辑

表现：

- 新配置已经生效，但 `route.ts` 仍保留针对 `5.0-lite` 的硬编码最小档位逻辑

处理：

- 删除或收敛 `requiresLargeSizePreset()` 一类仅服务于该模型的硬编码逻辑
- 改为优先查模型级配置

### 7.2 风险：支持比例与尺寸表不一致

表现：

- `supportedAspectRatios` 包含某个比例，但 `sizeTable` 中缺对应值

处理：

- 在文档和实现中保持比例列表与尺寸表完整一致
- 需要时增加运行时保护，找不到映射时回退到默认比例

### 7.3 风险：未来前端引入档位选择后接口再次调整

表现：

- 当前只支持 `defaultTier`
- 以后前端想传 `2K / 3K / 4K`

处理：

- 本次先保留 `defaultTier`
- 结构已经为未来扩展 `sizeTier` 请求字段做好准备，无需重构配置结构

---

## 8. 测试策略

### 8.1 静态检查

- 检查 `lib/image-vendor-presets.ts` 类型是否正确
- 检查 `app/api/image/route.ts` 是否通过 TypeScript 校验

### 8.2 功能回归

至少验证以下场景：

- `doubao-seedream-5.0-lite` + `1:1` 生成时，最终 `size` 为 `2048x2048`
- `doubao-seedream-5.0-lite` + `16:9` 生成时，最终 `size` 为 `2848x1600`
- `doubao-seedream-5.0-lite` + `9:16` 生成时，最终 `size` 为 `1600x2848`
- 未命中模型级配置的其他模型仍可正常生成

### 8.3 验收关注点

- 模型级配置是否独立于 vendor preset
- 路由是否真正读取了 `imageModelConfigs`
- `supportedAspectRatios` 是否被实际用于比例匹配

---

## 9. 实施范围

本次实施严格限定在以下范围：

- 修改 `lib/image-vendor-presets.ts`
- 修改 `app/api/image/route.ts`
- 必要时更新相关设计文档
- 运行类型检查与诊断验证

不包含：

- 修改配置页 UI
- 修改图片页交互
- 批量补齐所有图像模型的模型级配置

---

## 10. 验收标准

- `lib/image-vendor-presets.ts` 新增独立的 `imageModelConfigs`
- `doubao-seedream-5.0-lite` 配置包含 `supportedTiers`、`supportedAspectRatios` 和 `sizeTable`
- `app/api/image/route.ts` 不再硬编码该模型的尺寸规则
- 命中该模型时，`size` 由“档位 + 宽高比”配置推导得出
- 项目通过类型检查
