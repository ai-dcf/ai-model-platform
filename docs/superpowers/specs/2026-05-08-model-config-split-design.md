# 模型配置拆分设计文档

> **创建时间**：2026-05-08
> **功能名称**：模型配置拆分为语言模型与图片模型
> **状态**：待实施

## 1. 功能概述

### 1.1 背景

当前 `lib/storage.ts` 中将模型配置、厂商预设、存储结构和 CRUD 方法集中管理，模型类型使用 `text`、`image`、`video` 三种分类。

现有问题：

- 文本模型与图片模型的厂商预设混放在同一个 `vendorPresets` 中
- 配置页、聊天页、图片页通过字符串字面量区分模型类型，可读性一般
- `video` 类型当前没有实际业务承接，增加了无效复杂度

### 1.2 目标

本次调整的目标是：

- 将模型配置的大类明确为 `language` 和 `image`
- 删除未使用的 `video` 类型
- 将厂商预设按模型能力拆分为语言模型预设和图片模型预设
- 保持 `ModelItem` 数据结构不变，避免过度重构

### 1.3 非目标

本次不包含以下内容：

- 不新增图片模型厂商预设，图片预设先留空
- 不对已有 LocalStorage 旧数据做迁移兼容
- 不拆分 `ModelItem` 为多个接口
- 不调整聊天和图片生成 API 的核心协议

---

## 2. 需求确认

### 2.1 用户确认结论

- `video` 类型直接删除
- 拆分粒度为“仅拆预设，不拆数据结构”
- 图片模型预设先留空占位
- LocalStorage 旧格式数据不做兼容迁移

### 2.2 成功标准

满足以下条件即视为完成：

- 代码中不再出现 `video` 模型类型
- 模型类型统一从 `text`/`image` 调整为 `language`/`image`
- 厂商预设拆分为两个独立文件
- 配置页可以根据当前模型类型读取对应预设
- 聊天页仍可正常读取语言模型
- 图片生成页仍可正常读取图片模型

---

## 3. 方案选择

### 3.1 备选方案

#### 方案 A：同文件内拆分预设

在 `lib/storage.ts` 内部保留所有逻辑，只把预设拆成两个常量。

优点：

- 改动最小
- 无需新增文件

缺点：

- `storage.ts` 职责仍然过重
- 预设和存储逻辑没有物理隔离

#### 方案 B：拆为两个预设文件并由 `storage.ts` 统一导出

新增 `lib/language-vendor-presets.ts` 和 `lib/image-vendor-presets.ts`，由 `storage.ts` 统一导入和导出。

优点：

- 预设与存储逻辑分离，职责更清晰
- 后续补充图片模型预设时修改位置明确
- 对现有调用方影响可控

缺点：

- 比方案 A 多两个文件

#### 方案 C：完全拆为两个独立模型模块

语言模型和图片模型分别维护各自类型、预设和 CRUD。

优点：

- 分离度最高

缺点：

- 与“数据结构不变”的需求不符
- 会产生重复代码，超出本次范围

### 3.2 最终选择

采用方案 B：拆为两个预设文件并由 `storage.ts` 统一导出。

选择理由：

- 满足“仅拆预设”的需求边界
- 保持现有 `ModelItem` 和存储方法的统一性
- 通过物理拆文件提升后续可维护性

---

## 4. 文件设计

### 4.1 新增文件

#### `lib/language-vendor-presets.ts`

职责：

- 存放语言模型厂商预设
- 导出 `languageVendorPresets`
- 导出 `LanguageVendorType`

初始内容来自当前 `vendorPresets` 中的已有模型列表：

- `aliyun`
- `volcengine`
- `volcengine_conding_plan`

#### `lib/image-vendor-presets.ts`

职责：

- 存放图片模型厂商预设
- 导出 `imageVendorPresets`
- 导出 `ImageVendorType`

初始状态：

- 先使用空对象占位
- 后续如需支持图片模型预设，直接在此文件扩展

### 4.2 修改文件

#### `lib/storage.ts`

职责调整：

- 删除内联的 `vendorPresets`
- 导入并合并 `languageVendorPresets` 与 `imageVendorPresets`
- 将存储结构从 `{ text, image, video }` 改为 `{ language, image }`
- 删除所有 `video` 相关类型与默认值

#### `app/config/page.tsx`

职责调整：

- `ModelType` 从 `'text' | 'image' | 'video'` 调整为 `'language' | 'image'`
- 配置页侧边栏删除视频模型入口
- 文案中的“文本模型”统一改为“语言模型”
- 按当前模型类型读取对应预设

#### `app/chat/page.tsx`

职责调整：

- 改为读取 `language` 类型的启用模型

#### `app/image/page.tsx`

职责调整：

- 逻辑保持基本不变
- 继续读取 `image` 类型模型

#### `app/api/test-connection/route.ts`

职责调整：

- 请求体中的 `type` 从 `'text' | 'image'` 调整为 `'language' | 'image'`
- 语言模型走聊天测试分支，图片模型走模型列表测试分支

---

## 5. 数据模型设计

### 5.1 厂商预设类型

```typescript
export const languageVendorPresets = {
  aliyun: {
    name: '阿里云百炼',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [...],
  },
  volcengine: {
    name: '火山引擎',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [...],
  },
  volcengine_conding_plan: {
    name: '火山引擎 Conding Plan',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
    models: [...],
  },
} as const;

export const imageVendorPresets = {} as const;
```

### 5.2 VendorType 设计

`VendorType` 保持统一导出，但来源改为两套预设的联合类型：

```typescript
type VendorType = LanguageVendorType | ImageVendorType | 'custom';
```

说明：

- `custom` 仍然保留，用于手动输入 Base URL 与模型名
- 当 `imageVendorPresets` 为空时，图片模型默认通过 `custom` 配置

### 5.3 AppStorage 结构

调整前：

```typescript
models: {
  text: ModelItem[];
  image: ModelItem[];
  video: ModelItem[];
}
```

调整后：

```typescript
models: {
  language: ModelItem[];
  image: ModelItem[];
}
```

### 5.4 CRUD 函数签名

统一修改以下函数的类型参数：

```typescript
getModelsByType(type: 'language' | 'image'): ModelItem[]
getEnabledModelsByType(type: 'language' | 'image'): ModelItem[]
saveModel(type: 'language' | 'image', model: ModelItem): void
deleteModel(type: 'language' | 'image', modelId: string): void
```

---

## 6. 页面与交互设计

### 6.1 配置页

#### 模型类型标签

调整前：

- 文本模型
- 图像模型
- 视频模型

调整后：

- 语言模型
- 图像模型

#### 预设读取规则

- 当前类型为 `language` 时，读取 `languageVendorPresets`
- 当前类型为 `image` 时，读取 `imageVendorPresets`
- 当当前预设为空时，仅允许用户选择 `custom`

#### 表单行为

- 选择厂商时，若不是 `custom`，自动带出对应 `baseUrl`
- 若该厂商存在模型列表，则可供选择模型名
- 图片模型预设为空时，用户需手动填写 `baseUrl` 和模型名

### 6.2 聊天页

- 页面初始化改为从 `getEnabledModelsByType('language')` 加载模型
- 其他逻辑不变

### 6.3 图片页

- 页面继续从 `getEnabledModelsByType('image')` 加载模型
- 其他逻辑不变

---

## 7. 错误处理与兼容性

### 7.1 不做旧数据迁移的影响

由于本次明确不处理 LocalStorage 旧结构迁移，因此升级后的行为如下：

- 若浏览器中仍保存旧的 `text` / `video` 结构，运行时不会自动转换
- 新代码只认 `language` / `image` 结构
- 用户可能需要重新配置模型

这是一个已确认接受的行为，不在本次实现中兜底处理。

### 7.2 空图片预设处理

由于 `imageVendorPresets` 为空，配置页必须保证：

- 图片模型配置时仍能选择 `custom`
- 不依赖预设列表非空
- 不出现访问空预设导致的运行时错误

---

## 8. 测试策略

### 8.1 类型与编译检查

- 确认所有 `'text'` 字面量已替换为 `'language'`
- 确认所有 `'video'` 字面量已删除
- 确认 TypeScript 类型检查通过

### 8.2 功能回归

- 配置页可切换“语言模型 / 图像模型”
- 配置页新增、编辑、删除语言模型正常
- 配置页新增、编辑、删除图像模型正常
- 聊天页能读取并使用语言模型
- 图片页能读取并使用图像模型
- 连接测试接口对语言模型和图像模型都能正常工作

### 8.3 重点风险

- 配置页仍假设所有模型类型都共享同一套预设，导致图片模型页面异常
- 某些遗留代码仍写死 `'text'` 或 `'video'`
- 计数、标签或默认状态遗漏同步更新

---

## 9. 实施范围

本次实施应严格限定在以下范围：

- 新增两个预设文件
- 修改 `storage.ts`、配置页、聊天页、连接测试接口
- 清理 `video` 相关 UI 和类型引用

不包含：

- 旧数据迁移
- 新增图片模型厂商预设
- 进一步抽象 `ModelItem`
- 重构聊天和图片 API 协议

---

## 10. 验收标准

- `lib/storage.ts` 不再内联维护全部厂商预设
- 项目中不再使用 `text` 与 `video` 作为模型分类
- 配置页只展示语言模型和图像模型两类
- 聊天页使用语言模型分类
- 图片页使用图像模型分类
- 项目可正常通过构建或类型检查
