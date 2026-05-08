# 模型配置拆分实施计划

> **创建时间**：2026-05-08
> **功能名称**：模型配置拆分为语言模型与图片模型
> **参考设计**：docs/superpowers/specs/2026-05-08-model-config-split-design.md

**目标**：将当前模型配置从 `text` / `image` / `video` 调整为 `language` / `image` 两大类，拆分语言模型与图片模型厂商预设，删除未使用的 `video` 类型，并保持现有 `ModelItem` 结构不变。

**架构方案**：
- 新增两个独立预设文件，分别维护语言模型和图片模型厂商预设
- 由 `lib/storage.ts` 统一导入并导出预设与类型
- 将存储结构从 `{ text, image, video }` 改为 `{ language, image }`
- 调整配置页、聊天页和连通性测试接口以适配新模型分类

**技术栈**：
- TypeScript
- React hooks
- Next.js App Router
- LocalStorage

---

## 文件结构

### 新建文件

- `lib/language-vendor-presets.ts` - 语言模型厂商预设
- `lib/image-vendor-presets.ts` - 图片模型厂商预设占位文件

### 修改文件

- `lib/storage.ts` - 调整模型分类、存储结构、CRUD 函数签名和预设导出
- `app/config/page.tsx` - 配置页适配 `language` / `image` 两类模型与分离后的预设
- `app/chat/page.tsx` - 聊天页改为读取语言模型
- `app/api/test-connection/route.ts` - 连通性测试接口适配 `language` / `image`

---

## 实施任务

### 任务 1：拆分厂商预设文件

**文件**：
- 创建：`lib/language-vendor-presets.ts`
- 创建：`lib/image-vendor-presets.ts`

- [ ] **Step 1: 创建语言模型预设文件**

创建 `lib/language-vendor-presets.ts`，将当前 `vendorPresets` 中已有语言模型预设迁移进去，保留以下厂商：

- `aliyun`
- `volcengine`
- `volcengine_conding_plan`

同时导出：

```typescript
export const languageVendorPresets = { ... } as const;
export type LanguageVendorType = keyof typeof languageVendorPresets;
```

- [ ] **Step 2: 创建图片模型预设占位文件**

创建 `lib/image-vendor-presets.ts`，内容保持最小可用：

```typescript
export const imageVendorPresets = {} as const;
export type ImageVendorType = keyof typeof imageVendorPresets;
```

- [ ] **Step 3: 验证导出命名清晰一致**

确认以下命名统一：

- `languageVendorPresets`
- `imageVendorPresets`
- `LanguageVendorType`
- `ImageVendorType`

---

### 任务 2：重构 `lib/storage.ts`

**文件**：
- 修改：`lib/storage.ts`

- [ ] **Step 1: 移除内联 `vendorPresets`**

删除当前文件顶部内联定义的 `vendorPresets` 常量，改为从两个新文件导入：

```typescript
import { languageVendorPresets, type LanguageVendorType } from './language-vendor-presets';
import { imageVendorPresets, type ImageVendorType } from './image-vendor-presets';
```

- [ ] **Step 2: 统一导出合并后的预设**

在 `storage.ts` 中保留统一出口：

```typescript
export const vendorPresets = {
  ...languageVendorPresets,
  ...imageVendorPresets,
} as const;
```

并调整 `VendorType`：

```typescript
export type VendorType = LanguageVendorType | ImageVendorType | 'custom';
```

- [ ] **Step 3: 修改模型分类结构**

将以下结构统一替换：

```typescript
'text' | 'image' | 'video'
```

替换为：

```typescript
'language' | 'image'
```

需要同步修改：

- `AppStorage.models`
- `defaultStorage.models`
- `getModelsByType()`
- `getEnabledModelsByType()`
- `saveModel()`
- `deleteModel()`

- [ ] **Step 4: 删除 video 相关定义**

清理 `video` 相关残留，包括：

- 存储默认值中的 `video`
- 各函数签名中的 `video`
- 任何仅为 `video` 服务的分支

- [ ] **Step 5: 检查对话与图片历史相关结构**

确认以下接口无需改动：

- `ModelItem`
- `Conversation`
- `ImageHistoryItem`
- `ChatMessage`

本任务只改模型分类，不改这些结构内容。

---

### 任务 3：改造配置页

**文件**：
- 修改：`app/config/page.tsx`

- [ ] **Step 1: 调整页面内模型类型定义**

将：

```typescript
type ModelType = 'text' | 'image' | 'video';
```

替换为：

```typescript
type ModelType = 'language' | 'image';
```

- [ ] **Step 2: 更新模型类型配置**

调整 `modelTypeConfig`：

- 删除 `video`
- 将 `text` 改为 `language`
- 标签文案从“文本模型”改为“语言模型”

预期结果：

```typescript
const modelTypeConfig = {
  language: { icon: MessageSquare, label: '语言模型', color: 'primary' },
  image: { icon: Image, label: '图像模型', color: 'secondary' },
};
```

- [ ] **Step 3: 调整页面状态默认值与计数**

同步修改：

- `useState<ModelType>('text')` -> `useState<ModelType>('language')`
- 模型计数字段删除 `video`
- 所有 `getModelsByType('text')` 改为 `getModelsByType('language')`

- [ ] **Step 4: 接入分离后的预设**

配置页不再假设所有模型共享同一套预设，需要根据当前 `modelType` 读取：

- 语言模型：`languageVendorPresets`
- 图片模型：`imageVendorPresets`

需要保证：

- 当图片预设为空时，不报错
- 仍可使用 `custom`
- 切换厂商时 `baseUrl` 自动填充逻辑仍然成立

- [ ] **Step 5: 清理 UI 中的视频模型入口**

删除：

- 侧边栏视频模型项
- 视频模型数量展示
- 任何 `Film` 图标仅为分类切换服务的引用

---

### 任务 4：改造聊天页

**文件**：
- 修改：`app/chat/page.tsx`

- [ ] **Step 1: 调整语言模型加载逻辑**

将：

```typescript
const textModels = getEnabledModelsByType('text');
```

改为：

```typescript
const languageModels = getEnabledModelsByType('language');
```

- [ ] **Step 2: 同步变量命名**

若局部变量仍使用 `textModels`，一并改为更准确的命名，例如：

- `languageModels`

以保证语义一致。

- [ ] **Step 3: 验证默认会话模型选择**

确认以下逻辑仍成立：

- 有激活会话时使用会话的模型 ID
- 无激活会话时，默认选中第一个已启用语言模型

---

### 任务 5：改造连通性测试接口

**文件**：
- 修改：`app/api/test-connection/route.ts`

- [ ] **Step 1: 调整请求体类型**

将接口中：

```typescript
type: 'text' | 'image'
```

替换为：

```typescript
type: 'language' | 'image'
```

- [ ] **Step 2: 保持测试分支语义正确**

验证当前逻辑：

- `type === 'image'` 走图片模型测试
- 其余情况走语言模型对话测试

在类型调整后仍然满足需求，无需重写整体流程。

- [ ] **Step 3: 检查日志文案**

确保日志中如果出现“文本模型”字样，视需要改为“语言模型”，避免新旧概念混用。

---

### 任务 6：全局清理与验证

**文件**：
- 全项目搜索相关引用

- [ ] **Step 1: 全局搜索遗留字面量**

全局检查并清理以下内容：

- `'text'`
- `'video'`
- “文本模型”
- “视频模型”

注意区分业务无关文本，避免误删聊天内容或历史文档引用。

- [ ] **Step 2: 运行类型检查或构建**

执行项目验证命令，例如：

```bash
npm run build
```

或至少执行：

```bash
npx tsc --noEmit
```

目标：

- 无 TypeScript 类型错误
- 无因模型类型调整导致的编译失败

- [ ] **Step 3: 检查编辑文件诊断**

对以下文件运行诊断并修复问题：

- `lib/storage.ts`
- `app/config/page.tsx`
- `app/chat/page.tsx`
- `app/api/test-connection/route.ts`
- `lib/language-vendor-presets.ts`
- `lib/image-vendor-presets.ts`

- [ ] **Step 4: 手动回归验证**

至少验证以下场景：

- 配置页可切换语言模型和图像模型
- 语言模型可新增、编辑、删除
- 图像模型可新增、编辑、删除
- 聊天页能加载语言模型
- 图片页能加载图像模型
- 连通性测试可对两类模型正常发起请求

---

## 风险与处理

### 风险 1：配置页仍依赖统一预设结构

**表现**：
- 图片模型页面切换厂商时报错
- 模型列表为空时 UI 异常

**处理**：
- 在配置页增加“当前类型对应预设”的中间变量
- 对空预设场景做显式兜底

### 风险 2：遗留代码仍引用 `text` 或 `video`

**表现**：
- 编译报错
- 某些页面数据加载为空

**处理**：
- 全局搜索关键字并逐处确认
- 重点检查类型定义、初始状态、计数逻辑和接口请求体

### 风险 3：旧 localStorage 数据不可用

**表现**：
- 升级后页面看不到旧模型

**处理**：
- 本次按需求不做迁移
- 作为已知行为接受

---

## 建议提交拆分

建议按以下粒度提交，便于回滚和审查：

1. `refactor: split vendor presets into dedicated files`
2. `refactor: rename text model type to language and remove video`
3. `refactor: update config and chat pages for new model categories`
4. `chore: verify model config split and clean remaining references`
