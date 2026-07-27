# 📦 Packages — 共享包目录

> 神机营 M5 平台 monorepo 的核心共享库集合，为 `apps/` 下的所有终端应用提供统一的基础能力。
>
> 每个子包通过 pnpm workspace `"workspace:*"` 协议相互引用，由 Turborepo 编排构建与缓存。

---

## 目录

- [模块概述](#模块概述)
- [包速览](#包速览)
- [包间依赖关系](#包间依赖关系)
- [各包详解](#各包详解)
  - [@m5/types](#m5types--公共类型定义)
  - [@m5/domain](#m5domain--领域层)
  - [@m5/sdk](#m5sdk--sdk-工具包)
  - [@m5/ui](#m5ui--ui-组件库)
  - [@m5/config-typescript](#m5config-typescript--typescript-配置共享)
- [构建与发布](#构建与发布)
- [开发约定](#开发约定)

---

## 模块概述

`packages/` 目录下共 5 个共享包，按层级分为三类：

1. **类型层** — `@m5/types`：纯 TypeScript 类型声明，零运行时
2. **领域层** — `@m5/domain`：领域枚举、实体接口、Mock 服务
3. **应用层** — `@m5/sdk` (API 客户端)、`@m5/ui` (UI 组件库)、`@m5/config-typescript` (TS 配置)

所有包均使用 pnpm workspace 协议，无需单独发布到 npm registry。

---

## 包速览

| 包名 | 路径 | 类型 | 构建工具 | 依赖 | 核心职责 |
|------|------|------|----------|------|----------|
| `@m5/types` | `packages/types` | 纯类型 | tsup (CJS + DTS) | 无 | 共享 TS 接口/类型 |
| `@m5/domain` | `packages/domain` | 领域模型 | tsup (CJS + ESM + DTS) | `@m5/types` | 实体、枚举、Mock |
| `@m5/sdk` | `packages/sdk` | 工具库 | tsup (CJS + DTS) | `@m5/types` | API 客户端、工具函数 |
| `@m5/ui` | `packages/ui` | UI 组件 | tsup (CJS + ESM + DTS) | `@m5/types`, antd, react | 200+ 可复用组件 |
| `@m5/config-typescript` | `packages/config-typescript` | 配置 | 无构建 | 无 | tsconfig 预设 |

---

## 包间依赖关系

```
@m5/types ────────────────────────────────────────── (底层类型)
    │
    ├── @m5/domain ─── 领域模型依赖类型定义
    │
    ├── @m5/sdk ─────── API 客户端依赖类型定义
    │
    ├── @m5/ui ──────── UI 组件依赖类型 + antd + react
    │
    └── 消费方:
        ├── apps/admin-web     → types + domain + sdk + ui
        ├── apps/storefront-web→ types + domain + sdk + ui
        ├── apps/tob-web       → types + domain + sdk + ui
        ├── apps/mobile        → types + sdk
        ├── apps/miniapp       → types + sdk
        └── apps/api           → types + domain

@m5/config-typescript ─────── 独立提供 tsconfig 预设，不参与运行时依赖
    └── 消费方: 所有 apps 和各 packages
```

---

## 各包详解

### @m5/types — 公共类型定义

**路径**: `packages/types/`

纯类型包，包含所有业务领域的 TypeScript 接口与类型别名。

**核心领域**:

| 领域 | 关键类型 |
|------|----------|
| 基础治理 (Foundation) | 告警目录、告警时间线、系统概览、消费者描述符 |
| 运行时治理 | Receipt、Callback、Replay、Rate Limit、Ticket、Stall 检测 |
| 基础引导 (Bootstrap) | 能力规则、客户端应用、Feature Flag、脱敏策略、租户作用域 |
| 订单与支付 | Order、Payment、Refund、OrderEvent、退款输入 |
| AI 大模型配置 | LLMProvider、TenantLLMConfig、调用统计、调用日志 |
| 全球化 | GeoContext、SupportedLanguage、SupportedCurrency |
| 通用工具 | PaginationInput、PaginationMeta、ApiResult\<T\> |

**使用示例**:

```typescript
import type { ApiResult, PaginationInput, Order } from '@m5/types';

const result: ApiResult<Order[]> = await api.get('/orders');
const pagination: PaginationInput = { page: 1, pageSize: 20 };
```

**构建命令**:

```bash
pnpm --filter @m5/types build   # 构建 CJS + .d.ts
pnpm --filter @m5/types test    # 运行测试
```

---

### @m5/domain — 领域层

**路径**: `packages/domain/`

领域模型包，定义核心业务实体接口、全局枚举，并提供开发阶段的 Mock 服务。

**核心实体**:

| 分类 | 实体 |
|------|------|
| 门户与市场 | MarketProfile、BasePortal、StorePortal、TobPortal、RegionalConfigOverride |
| 身份与访问控制 | UserRole (10 种角色)、IdentityAccount、OrganizationNode、AccessPolicy |
| 运行时治理 | FoundationAlert、RuntimeOperation、RuntimeReceipt、EdgeNode |
| 配置与特性 | ConfigEntry、ConfigRevision、SecretAsset、FeatureFlag、RateLimitPolicy |
| 安全与合规 | AuditTrailRecord、PiiPolicy、BackupSnapshot |
| 消息与通知 | DomainEvent、WebhookSubscription、NotificationTemplate |
| AI 能力 | AiModelConfig、AiPromptTemplate、AiExecutionRecord |

**Mock 服务**:

```typescript
import { fetchOperations, fetchAlerts } from '@m5/domain';

// 获取分页运行时操作列表
const ops = await fetchOperations(1, 10);

// 带过滤条件查询告警
const alerts = await fetchAlerts({ severity: 'error', status: 'open', page: 1 });
```

**目录结构**:

```
packages/domain/
├── src/
│   ├── index.ts                 # 入口导出
│   ├── service-types.ts         # Mock 服务类型
│   ├── runtime-service.ts       # 运行时操作 Mock
│   ├── alert-service.ts         # 告警 Mock
│   ├── index.test.ts            # 入口测试
│   ├── index.d.ts               # 类型补充
│   ├── domain-deep.test.ts      # 深度领域模型测试
│   └── ...
├── dist/                        # 构建产物
├── package.json
├── tsconfig.json
└── README.md
```

---

### @m5/sdk — SDK 工具包

**路径**: `packages/sdk/`

统一前端 SDK，封装 M5 平台所有后端 API 的访问客户端和工具函数。

**核心能力**:

| 能力 | 说明 |
|------|------|
| ApiClient | 统一 HTTP 客户端，自动注入认证头、租户上下文、错误处理 |
| 领域 API | 引导、告警、运行时治理、审计、配置、身份验证、限流、AI Agent |
| SSE 流式 | `runAgentSessionStream()` — 支持 AI Agent 会话的 SSE 事件流 |
| 工具函数 | `buildActorHeaders()`、`createRuntimeGovernancePanelBindings()` 等 |
| 错误处理 | `ApiError` 类，透传后端 `i18nKey`、`code`、`status` |
| Fallback | 降级模式，API 不可用时返回兜底数据 |

**ApiClient 用法**:

```typescript
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

const client = new ApiClient({
  baseUrl: getDefaultApiBaseUrl(),
  tenantId: 'tnt-demo',
  token: 'eyJhbGci...',
});

// GET 请求
const bootstrap = await client.getFoundationBootstrap();

// POST 请求
const receipt = await client.submitRuntimeGovernanceAction({
  app: { appId: 'admin-web', appVersion: '0.1.0' },
  action: 'member-login',
  riskLevel: 'medium',
  nextStep: 'CHALLENGE',
  payload: { memberId: 'mem-xxx' },
});

// SSE 流式
for await (const event of client.runAgentSessionStream({
  configId: 'cfg-sales-001',
  userInput: '分析本月营收趋势',
})) {
  console.log(event.type, event);
}
```

**构建命令**:

```bash
pnpm --filter @m5/sdk build       # tsup → dist/index.js + dist/index.d.ts
pnpm --filter @m5/sdk test        # 运行测试
```

---

### @m5/ui — UI 组件库

**路径**: `packages/ui/`

统一前端 UI 组件库，提供 200+ 可复用组件与业务模块，覆盖门店运营、后台管理、AI 智能分析等场景。

**组件分类**:

| 分类 | 数量 | 示例 |
|------|------|------|
| 基础组件 | 80+ | Button、Input、Select、Table、Modal、Form、Card、Tabs |
| 数据展示 | 30+ | DataTable、Chart、GaugeChart、ProgressRing、SparklineChart |
| 业务仪表盘 | 40+ | StoreManagerDashboard、AIAnalysisInsightsPanel、CashierPanel |
| AI 智能组件 | 25+ | AIAgentChatPanel、AIDecisionPanel、AIScenarioSimulator |
| 告警监控 | 10+ | Alert、AnomalyAlertPanel、AlertCorrelationDashboard |
| 安全治理 | 10+ | AuditTimeline、ConfigurationPosturePanel、RuntimeGovernancePanel |

**使用示例**:

```tsx
import { Button, DataTable, AIAnalysisInsightsPanel } from '@m5/ui';

function MyPage() {
  return (
    <div>
      <Button variant="primary">保存</Button>
      <DataTable columns={columns} dataSource={data} />
      <AIAnalysisInsightsPanel insights={insights} />
    </div>
  );
}
```

**目录结构**:

```
packages/ui/
├── src/
│   ├── index.tsx                  # 入口，导出全部组件
│   ├── components/                # 150+ 组件目录 (每个组件独立文件夹)
│   ├── providers/                 # React Context Provider
│   ├── canary-control/            # 灰度控制模块
│   ├── sso-config/                # SSO 配置模块
│   ├── license/                   # 许可证管理模块
│   ├── webhook-config/            # Webhook 配置模块
│   ├── monitoring-dashboard/      # 监控仪表盘
│   ├── three-level-config/        # 三级配置 (门店/租户/品牌)
│   └── ...
├── dist/                          # 构建产物
└── package.json
```

---

### @m5/config-typescript — TypeScript 配置共享

**路径**: `packages/config-typescript/`

统一 TypeScript 编译配置预设包，提供三种预设：

| 预设文件 | 适用场景 | 关键配置 |
|----------|----------|----------|
| `base.json` | 基础库 (packages) | declaration, sourceMap, outDir |
| `next.json` | Next.js 应用 | ESNext 模块, Bundler 解析, noEmit |
| `nest.json` | NestJS 服务 | CommonJS 模块, Node 解析, 装饰器 |

**使用示例**:

```jsonc
// apps/admin-web/tsconfig.json
{
  "extends": "@m5/config-typescript/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@m5/ui": ["../../packages/ui/src"]
    }
  },
  "include": ["src"]
}
```

**包特点**:

- 纯 JSON 配置，零运行时依赖
- 通过 `extends` 链实现配置继承 (base → next/nest)
- 全仓库 TypeScript 配置一致性保证

---

## 构建与发布

### 批处理命令

```bash
# 构建所有 packages
pnpm --filter "./packages/*" build

# 全部类型检查
pnpm --filter "./packages/*" typecheck

# 全部测试
pnpm --filter "./packages/*" test
```

### 各包构建速查

| 包 | 构建命令 | 产出 | 耗时 |
|----|----------|------|------|
| `@m5/types` | `pnpm build` | `dist/index.js` + `dist/index.d.ts` | ~2s |
| `@m5/domain` | `pnpm build` | `dist/index.js` + `dist/index.mjs` + `dist/index.d.ts` | ~3s |
| `@m5/sdk` | `pnpm build` | `dist/index.js` + `dist/index.d.ts` | ~2s |
| `@m5/ui` | `pnpm build` | `dist/index.js` + `dist/index.mjs` + `dist/index.d.ts` | ~5s |
| `@m5/config-typescript` | 无需构建 | 直接引用 JSON | — |

### 发布策略

所有包均为 monorepo 内部包，不单独发布到 npm registry。消费方通过 workspace protocol 引用：

```json
{
  "dependencies": {
    "@m5/types": "workspace:*",
    "@m5/sdk": "workspace:*"
  }
}
```

---

## 开发约定

### 1. 分层依赖原则

```
types ← domain ← sdk
types ← domain ← ui
```

- 底层包不能依赖上层包（如 `domain` 不能依赖 `sdk` 或 `ui`）
- 应用层包可以依赖多个底层包

### 2. 纯类型包原则 (`@m5/types`)

- 仅包含 `interface` / `type` / `function` 声明
- 不包含运行时副作用
- 所有类型统一在 `src/index.ts` 导出

### 3. 向后兼容原则

- 新增字段使用可选属性 (`?`)
- 不删除已导出的类型
- 修改枚举值时提供映射函数

### 4. 测试覆盖原则

- 每个包至少有一个入口测试文件 (`src/index.test.ts`)
- 核心逻辑单元需独立测试
- Mock 服务覆盖边界场景

### 5. 构建前校验

```bash
# 提交前运行
pnpm --filter "./packages/*" typecheck  # 类型检查
pnpm --filter "./packages/*" test        # 单元测试
pnpm --filter "./packages/*" lint        # 代码风格
```

---

## 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| 根 README | `/README.md` | 项目整体说明 |
| Apps 概览 | `/apps/README.md` | 应用模块说明 |
| E2E 测试 | `/e2e/README.md` | 端到端测试策略 |
| 类型定义详细 | `/packages/types/README.md` | @m5/types |
| 领域模型详细 | `/packages/domain/README.md` | @m5/domain |
| SDK 详细 | `/packages/sdk/README.md` | @m5/sdk |
| UI 组件库详细 | `/packages/ui/README.md` | @m5/ui |
| TS 配置详细 | `/packages/config-typescript/README.md` | @m5/config-typescript |
