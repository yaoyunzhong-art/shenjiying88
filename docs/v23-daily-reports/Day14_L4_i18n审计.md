# Day14 L4 — i18n 国际化审计 + README 完备性

> **日期**：2026-07-26（V23 Day14）  
> **审计范围**：`apps/admin-web/` `apps/tob-web/` `apps/storefront-web/` `docs/`  
> **边界**：❗ 绝不碰 `apps/api/`

---

## 一、i18n / 国际化审计

### 1.1 i18n 资源文件

**结论：三个 Web 应用中没有独立的 i18n JSON 资源文件。**

| 检查项 | 结果 |
|--------|------|
| `locales/` 目录 | ❌ 不存在 |
| `i18n/` 目录 | ❌ 不存在 |
| `translations/` 目录 | ❌ 不存在 |
| 独立语言包（`zh-CN.json`, `en-US.json` 等） | ❌ 不存在 |

唯一发现的翻译资源是 **`apps/tob-web/components/locale-provider.tsx`**，以**代码内嵌对象**形式存储翻译，共支持 9 种语言，约 18 个翻译 key。

### 1.2 i18n 框架使用

| App | i18n 库依赖 | `useTranslation` / `useLocale` 调用 | 路由级多语言 |
|-----|-------------|--------------------------------------|--------------|
| **admin-web** | ❌ 无 i18n 依赖 | 0 处 | ❌ 无中间件 |
| **tob-web** | ❌ 无 i18n 依赖 | 1 处（仅 `i18n-demo/page.tsx`） | ✅ `middleware.ts` 通过 `document-language.ts` 识别 `[marketCode]` |
| **storefront-web** | ❌ 无 i18n 依赖 | 0 处 | ❌ 无中间件，但 `market-bootstrap.ts` 有 `supportedLanguages` 概念 |

**详细分析：**

- **admin-web**：`layout.tsx` 中 `html lang="zh-CN"` 硬编码。OG/Twitter 元数据仅为中文。无动态语言切换机制。
- **tob-web**：拥有最完善的 i18n 基础设施：
  - `locale-provider.tsx` — 9 语言（zh-CN, zh-TW, en-US, ja-JP, ko-KR, th-TH, vi-VN, id-ID, ms-MY）
  - `document-language.ts` — 5 市场语言映射（cn→zh-CN, us→en-US, sg→en-SG, jp→ja-JP, de→de-DE）
  - `middleware.ts` — 自动识别请求语言
  - 但 **仅 `i18n-demo/page.tsx` 一处实际使用**！所有业务页面仍硬编码中文。
- **storefront-web**：`market-bootstrap.ts` 声明 `STOREFRONT_SUPPORTED_LANGUAGES = ['zh-CN', 'en-US']`，但仅用于存储/品牌/租户元数据，**不作用于 UI 文本**。

### 1.3 硬编码中文统计

| App | 硬编码中文行数（非测试文件） | 测试文件中文行 | 合计 |
|-----|-----------------------------|----------------|------|
| **admin-web** | ~228,371 | ~7,474 | **235,845** |
| **tob-web** | ~82,973 | ~0 | **82,973** |
| **storefront-web** | ~142,688 | ~0 | **142,688** |
| **总计** | **~454,032** | **~7,474** | **461,506** |

**中文分布模式：**

| 类型 | 说明 | 占比估算 |
|------|------|----------|
| UI 文本（字符串内中文） | 页面标签、按钮、提示等 | ~60% |
| JSDoc / 行注释（中文） | 验收卡、PRD 注释、功能描述 | ~30% |
| 测试用例描述（`it('...')`） | 中文测试名 | ~5% |
| 其他（import 路径说明等） | 文件头注释 | ~5% |

**硬编码中文最多的非测试文件 TOP 5：**

| 文件 | 行数 |
|------|------|
| `admin-web/app/members-view-model.ts` | 1,762 |
| `tob-web/app/sports-ants/cases/page.tsx` | 1,115 |
| `tob-web/app/sports-ants/page.tsx` | 1,072 |
| `tob-web/app/sports-ants/products/page.tsx` | 1,034 |
| `storefront-web/app/members/loyalty/page.tsx` | 890 |

### 1.4 i18n 成熟度评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 基础设施 | ⭐⭐ | tob-web 有 locale-provider + middleware，但 admin/storefront 无 |
| 翻译资源 | ⭐ | 仅 tob-web 有 18 个内嵌 key，远不足以覆盖业务 |
| 实际采用 | ⭐ | 0 个业务页面使用翻译框架，全硬编码中文 |
| 可扩展性 | ⭐⭐ | tob-web 的 locale-provider 设计可扩展，但技术债深重 |
| 多端一致性 | ⭐ | 三端无统一 i18n 方案，各自为政 |

**核心问题**：项目名义上「多语言」但 **仅 tob-web 有 demo 级实现**，46 万行硬编码中文亟待系统化提取。`sports-ants/` 业务模块（B2B 门户主站）中文密度最高。

---

## 二、README 完备性审计

### 2.1 README 文件统计

| 范围 | 数量 |
|------|------|
| 项目内 README 总数（不含 node_modules） | **253** |
| 根目录 `README.md` | ✅ 存在（254 行） |
| `apps/admin-web/README.md` | ✅ 存在（640 行） |
| `apps/tob-web/README.md` | ✅ 存在（136 行） |
| `apps/storefront-web/README.md` | ✅ 存在（524 行） |
| `docs/` README | 5 个 |
| `apps/api/` 模块 README | 200+ 个（超出审计范围，仅计数） |

### 2.2 根 README 评估

**文件**：`/README.md`（254 行）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 项目名称与定位 | ✅ | 「M5 Platform - 数字运动潮玩平台」，版本 17.0.0 |
| 徽章（version, node, pnpm, license） | ✅ | 4 个 badge |
| 快速开始 | ✅ | 有锚点链接 |
| 核心功能 | ✅ | 有锚点链接 |
| 技术架构 | ✅ | 有锚点链接 |
| 文档 | ✅ | 有锚点链接 |
| 贡献指南 | ✅ | 有锚点链接 |
| i18n / 多语言说明 | ❌ | 无任何提及 |
| 多市场部署说明 | ❌ | 无 |

**评价**：结构完整但内容需验证（锚点链接是否有效）。缺少国际化/多市场说明。

### 2.3 apps/tob-web/README.md 评估

**文件**：`apps/tob-web/README.md`（136 行）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 技术栈 | ✅ | Next.js 15, TypeScript, tRPC, Ant Design |
| 核心功能 | ✅ | 列出多市场多语言、运营监控、会员管理等 9 模块 |
| 目录结构 | ✅ | 树形展示，标注关键文件 |
| 多语言说明 | ✅ | 「多市场多语言」在核心功能首条；`[marketCode]` 路由在目录结构中标注 |
| 架构说明 | ✅ | 多市场路由、Standalone 输出、ViewModel 模式、测试覆盖 |
| 环境变量 | ✅ | 列出 |
| 开发命令 | ✅ | dev/build/start/lint/test |
| 快速开始 | ✅ | 有 |

**评价**：内容紧凑但覆盖全面，i18n 相关描述准确（与代码实现一致）。**136 行略显简短**，缺少 API 集成说明、部署流程、性能指标等细节。

### 2.4 apps/admin-web/README.md 评估

**文件**：`apps/admin-web/README.md`（640 行）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 项目概述 | ✅ | 角色定位、功能域划分清晰 |
| 技术栈 | ✅ | Next.js 15, TypeScript 5.8, Ant Design 6, Playwright |
| 模块架构 | ✅ | 15 个模块分类，含图标和表格 |
| 路由说明 | ✅ | 安全/配置/运营/AI 四组路由 |
| 开发指南 | ✅ | 前置条件、快速开始、脚本、ViewModel 模式 |
| 多租户/ABAC/运行时治理 | ✅ | 详细说明 |
| 测试体系 | ✅ | 工具、结构、覆盖范围 |
| 环境变量/构建部署 | ✅ | 本地/Docker/部署架构 |
| i18n / 多语言 | ❌ | 无任何说明 |
| 目录结构 | ✅ | 树形展示 |

**评价**：**质量最高的 README**，结构完善、内容详实。唯一缺失是 i18n 说明。

### 2.5 apps/storefront-web/README.md 评估

**文件**：`apps/storefront-web/README.md`（524 行）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 项目概述 | ✅ | 门店终端定位、角色、一站式功能 |
| 技术栈 | ✅ | Next.js 15, TypeScript 5.8, Ant Design 6 |
| 功能模块 | ✅ | 收银/会员/商品/订单等 8 模块 |
| 目录结构 | ✅ | 树形展示 |
| 多端适配 | ✅ | 适配原则、检测方式 |
| 市场配置引导 | ✅ | MarketBootstrap 说明（含语言/货币/税率） |
| 安全设计 | ✅ | Token、运行时治理、审计 |
| 测试体系 | ✅ | Vitest + Playwright |
| 环境变量/构建部署 | ✅ | 全面 |
| i18n / 多语言 | ⚠️ | 仅在 MarketBootstrap 一节提及「配置 Ant Design 多语言」，无独立节 |

**评价**：完善的 README，i18n 提及但不充分。

### 2.6 README 完备性总评

| App README | 行数 | 覆盖率 | i18n 提及 | 总体评分 |
|------------|------|--------|-----------|----------|
| **根 README** | 254 | 中等 | ❌ | ⭐⭐⭐ |
| **admin-web** | 640 | 高 | ❌ | ⭐⭐⭐⭐ |
| **tob-web** | 136 | 中低 | ✅ | ⭐⭐⭐ |
| **storefront-web** | 524 | 高 | ⚠️ | ⭐⭐⭐⭐ |

**共性改进建议**：
1. 三个 app README 都需要补充 **独立的 i18n / 多语言章节**（tob-web 虽有提及但未独立成章）
2. 根 README 需要添加 **多市场部署 & 国际化支持** 说明
3. tob-web README 行数偏少（136 行 vs admin-web 640 行），应补充 API 集成、部署流程等

---

## 三、TSC 编译验证

| App | TSC `--noEmit` | 结果 |
|-----|----------------|------|
| `apps/admin-web` | ✅ 0 errors | 全绿 |
| `apps/tob-web` | ✅ 0 errors | 全绿 |
| `apps/storefront-web` | ✅ 0 errors | 全绿 |

---

## 四、综合结论与优先级

| 优先级 | 问题 | 影响范围 | 建议 |
|--------|------|----------|------|
| 🔴 P0 | 46 万行硬编码中文 | 三端全部业务页面 | 系统化 i18n 提取 + 翻译框架统一 |
| 🟡 P1 | admin-web / storefront-web 无 i18n 基础设施 | 2/3 应用 | 对齐 tob-web 的 locale-provider 模式 |
| 🟡 P1 | `locale-provider.tsx` 仅 18 个 key，非 JSON 文件 | tob-web | 迁移为独立 JSON 语言包（可被 CI 校验） |
| 🟢 P2 | 根 README 缺少 i18n 说明 | 文档 | 新增多语言/多市场章节 |
| 🟢 P2 | tob-web README 偏短（136 行） | 文档 | 补充 API 集成、部署、性能指标 |
| 🟢 P2 | admin-web README 缺少 i18n 章节 | 文档 | 新增 |

---

**审计完成** ✅  
**无破坏性变更，跳过 git 提交（无文件变更）。**
