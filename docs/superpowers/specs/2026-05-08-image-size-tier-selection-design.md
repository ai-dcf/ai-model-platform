# 图片页分辨率档位选择设计文档

> **创建时间**：2026-05-08
> **功能名称**：图片页增加 `2K / 3K / 4K` 档位选择并与后端联动
> **状态**：待实施

## 1. 功能概述

### 1.1 背景

当前系统已经完成两项能力：

- `lib/image-vendor-presets.ts` 中为 `doubao-seedream-5.0-lite` 建立了模型级配置，包含：
  - `supportedTiers`
  - `supportedAspectRatios`
  - `sizeTable`
- `app/image/page.tsx` 已根据 `supportedAspectRatios` 动态渲染支持的宽高比

但当前前端仍未暴露分辨率档位选择，后端也只会使用模型配置中的 `defaultTier`。这意味着 `supportedTiers` 和 `sizeTable` 的多档位能力尚未真正被使用。

### 1.2 目标

本次调整目标如下：

- 图片页增加 `2K / 3K / 4K` 档位选择
- 仅在模型命中 `imageModelConfigs` 且存在 `supportedTiers` 时展示档位按钮
- 前端把用户选中的档位传给 `/api/image`
- 后端优先使用前端传入的合法档位计算最终 `size`

### 1.3 非目标

本次不包含以下内容：

- 不改造配置页
- 不改造图片页整体视觉样式
- 不增加更多模型的档位配置
- 不支持用户自定义任意像素值

---

## 2. 需求确认

### 2.1 用户确认结论

- 下一步为图片页增加 `2K / 3K / 4K` 档位选择
- 前端与后端需要联动
- 档位能力仅对命中模型级配置的模型生效

### 2.2 成功标准

满足以下条件即视为完成：

- 图片页在 `doubao-seedream-5.0-lite` 下展示档位按钮
- 未命中模型级配置的模型不展示档位按钮
- 选中档位后，请求 `/api/image` 时能携带档位参数
- 后端计算 `size` 时优先使用选中的合法档位

---

## 3. 方案选择

### 3.1 备选方案

#### 方案 A：前端只显示档位，不传后端

优点：

- 前端改动小

缺点：

- 用户选择不会影响实际请求
- 属于伪功能

#### 方案 B：前后端贯通档位选择

前端展示支持档位并传递给后端，后端校验后参与 `sizeTable` 计算。

优点：

- 交互与实际能力一致
- 真正打通 `supportedTiers`
- 结构最完整

缺点：

- 需要同步改前后端

#### 方案 C：后端强制固定 2K，前端不显示档位

优点：

- 实现最简单

缺点：

- 浪费已有模型级配置能力
- 不符合用户当前目标

### 3.2 最终选择

采用方案 B：前后端贯通档位选择。

---

## 4. 前端设计

### 4.1 图片页状态

在 `app/image/page.tsx` 中新增：

- `sizeTier` 状态

其默认值规则：

- 命中模型级配置时，使用 `defaultTier`
- 未命中模型级配置时，值为空或 `undefined`

### 4.2 当前可选档位

新增派生数据，例如 `availableSizeTiers`：

- 若 `selectedModel.modelName` 命中 `imageModelConfigs`
  - 返回该模型的 `supportedTiers`
- 否则返回空数组

### 4.3 档位切换逻辑

当用户切换模型时：

- 若模型命中配置，且当前 `sizeTier` 不在 `supportedTiers` 中
  - 自动回退到 `defaultTier`
- 若模型未命中配置
  - 清空 `sizeTier`

### 4.4 UI 展示

在设置抽屉中新增“分辨率”分组：

- 按钮文案直接使用 `2K`、`3K`、`4K`
- 仅当 `availableSizeTiers.length > 0` 时显示

底部快捷栏中可增加当前档位展示，例如：

- `2K`
- `3K`
- `4K`

如果不想增加底部复杂度，也可仅在设置抽屉中显示。

---

## 5. 后端设计

### 5.1 请求参数

在 `/api/image` 请求体中增加：

```typescript
sizeTier?: '2K' | '3K' | '4K'
```

### 5.2 `route.ts` 逻辑调整

后端在计算模型级 `size` 时：

1. 先读取 `imageModelConfigs[modelName]`
2. 若命中模型级配置：
   - 若前端传入的 `sizeTier` 存在，且在 `supportedTiers` 中，则使用该值
   - 否则回退到 `defaultTier`
3. 再结合匹配到的宽高比，从 `sizeTable[tier][ratio]` 取最终 `size`

### 5.3 兼容性

对于未命中模型级配置的模型：

- 忽略 `sizeTier`
- 继续沿用现有 fallback `size` 映射逻辑

---

## 6. 文件改动设计

### 6.1 修改文件

#### `app/image/page.tsx`

- 增加 `sizeTier` 状态
- 增加 `availableSizeTiers`
- 模型切换时同步 `sizeTier`
- 请求 `/api/image` 时传递 `sizeTier`
- 设置抽屉中新增档位按钮组

#### `app/api/image/route.ts`

- 请求体类型增加 `sizeTier`
- 模型级尺寸解析逻辑支持优先读取传入档位

### 6.2 暂不改动文件

- `lib/image-vendor-presets.ts`
- `app/config/page.tsx`

---

## 7. 风险与处理

### 7.1 风险：切换模型后档位失效

表现：

- 某模型支持 `2K/3K/4K`
- 切到别的模型后当前档位仍保留

处理：

- 在模型切换逻辑中自动重置或回退 `sizeTier`

### 7.2 风险：前端传递非法档位

表现：

- 请求体中出现模型不支持的档位

处理：

- 后端必须再次校验 `sizeTier`
- 非法时回退到 `defaultTier`

### 7.3 风险：UI 变复杂

表现：

- 设置项过多，影响移动端体验

处理：

- 优先把档位选择放在设置抽屉内
- 仅在支持档位的模型下显示

---

## 8. 测试策略

### 8.1 静态检查

- 检查 `app/image/page.tsx` 类型通过
- 检查 `app/api/image/route.ts` 类型通过

### 8.2 功能回归

至少验证以下场景：

- `doubao-seedream-5.0-lite` 展示 `2K / 3K / 4K`
- 切换档位后，生成请求携带正确的 `sizeTier`
- `2K + 16:9` 最终映射到 `2848x1600`
- `3K + 16:9` 最终映射到 `4096x2304`
- 未命中模型级配置的模型不展示档位按钮

---

## 9. 实施范围

本次实施严格限定在以下范围：

- 修改 `app/image/page.tsx`
- 修改 `app/api/image/route.ts`
- 运行类型检查与诊断验证

---

## 10. 验收标准

- 图片页支持动态展示并切换 `2K / 3K / 4K`
- 前端会把选中的档位传给后端
- 后端会优先用合法档位计算 `size`
- 项目通过类型检查
