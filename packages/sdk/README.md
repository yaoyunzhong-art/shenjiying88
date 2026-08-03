# @m5/sdk — SDK 工具包

> **M5 平台前端 SDK** — 封装平台核心 API 的调用接口和工具函数。提供 **API 客户端** (`ApiClient`)、**运行时治理绑定**、**基础告警管理**、**Actor 头信息构建**等核心能力，供 M5 所有前端应用（admin-web / storefront-web / tob-web / miniapp / mobile）统一使用。

依赖 `@m5/types` 提供的共享类型定义，通过 pnpm workspace 引用。

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈与技术指标](#技术栈与技术指标)
- [安装与引入](#安装与引入)
- [API 客户端 (ApiClient)](#api-客户端-apiclient)
- [API 领域方法大全](#api-领域方法大全)
- [工具函数列表](#工具函数列表)
- [类型说明](#类型说明)
- [使用示例](#使用示例)
- [高级用法](#高级用法)
- [API 文档参考](#api-文档参考)
- [构建与发布](#构建与发布)
- [常见问题](#常见问题)

---

## 项目概述

`@m5/sdk` 是 M5 多租户零售平台的统一前端 SDK，主要职责：

1. **API 封装**: 提供 `ApiClient` 类封装所有后端 API 的访问，统一处理认证、租户上下文、错误透传
2. **工具函数**: 提供 `buildActorHeaders()`、`getDefaultApiBaseUrl()`、`createRuntimeGovernancePanelBindings()` 等开箱即用的工具
3. **错误处理**: 统一 `ApiError` 类，透传后端 `i18nKey`、`code`、`status`，支持前端友好化展示
4. **运行时治理**: 封装运行时治理操作（submit / replay / batch-replay / sync）的完整流程
5. **SSE 流式支持**: 支持 AI Agent 会话的 SSE 流式事件订阅 (`runAgentSessionStream`)

### 适用场景

- 所有 M5 前端应用（admin-web / storefront-web / tob-web / miniapp / mobile）
- 需要访问 M5 后端 API 的任何 Node.js / Browser 环境
- 需要统一 API 错误处理和认证上下文管理

---

## 技术栈与技术指标

| 技术           | 版本    | 说明                              |
|----------------|---------|-----------------------------------|
| TypeScript     | 5.8     | 全量类型声明，strict 模式          |
| tsup           | latest  | 构建工具 (CJS 输出)                |
| @m5/types      | workspace:* | 共享类型定义（workspace 依赖） |
| 运行时         | 无外部运行时依赖 | 纯 TypeScript，零运行时依赖     |

**构建产物**:

| 输出           | 路径               | 说明                           |
|----------------|--------------------|--------------------------------|
| CommonJS       | `dist/index.js`    | 主入口 (package.json main)     |
| 类型声明       | `dist/index.d.ts`  | 全量类型声明 (package.json types) |

---

## 安装与引入

### 安装

已在 pnpm workspace 中作为内部包，通过 workspace protocol 引入：

```json
// package.json
{
  "dependencies": {
    "@m5/sdk": "workspace:*"
  }
}
```

### 引入方式

```ts
// 引入 ApiClient
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

// 引入工具函数
import { buildActorHeaders, createRuntimeGovernancePanelBindings } from '@m5/sdk';

// 引入类型
import type { ApiClientOptions, ActorHeaderOptions, TenantConfigItem } from '@m5/sdk';
```

---

## API 客户端 (ApiClient)

### 构造函数

```ts
const client = new ApiClient({
  baseUrl: 'http://localhost:3001/api/v1',
  tenantId: 'tnt-xxx',
  brandId: 'brd-xxx',
  storeId: 'store-001',
  marketCode: 'CN',
  token: 'bearer-token',
  headers: { 'x-custom': 'value' },
});
```

### 参数说明 (ApiClientOptions)

| 参数        | 类型     | 必填 | 说明                              |
|-------------|----------|------|-----------------------------------|
| `baseUrl`   | string   | 是   | API 基础 URL                     |
| `tenantId`  | string   | 否   | 租户 ID (自动注入请求头)          |
| `brandId`   | string   | 否   | 品牌 ID                           |
| `storeId`   | string   | 否   | 门店 ID                           |
| `marketCode`| string   | 否   | 市场代码                          |
| `token`     | string   | 否   | Bearer Token (自动注入 Authorization) |
| `headers`   | Record   | 否   | 自定义请求头                      |

### 底层 HTTP 方法

```ts
// GET 请求
const result = await client.get<ResponseType>('/path');

// 获取 data 字段（解包 ApiResult）
const data = await client.getData<DataType>('/path');

// POST
const data = await client.postData<DataType>('/path', body);

// PUT
const data = await client.putData<DataType>('/path', body);

// PATCH
const data = await client.patchData<DataType>('/path', body);

// DELETE
const data = await client.deleteData<DataType>('/path');
```

所有方法自动注入:
- 认证头 (`Authorization: Bearer xxx`)
- 租户上下文头 (`x-tenant-id`, `x-brand-id`, `x-store-id`, `x-market-code`)
- 自定义头 (`options.headers`)
- 请求初始化参数 (`init` 参数可覆盖)

---

## API 领域方法大全

### 引导 Bootstrap

| 方法 | 端点 | 说明 |
|------|------|------|
| `getFoundationBootstrap(init?)` | `GET /foundation/bootstrap` | 基础平台引导数据 |
| `getMarketBootstrap(init?)` | `GET /markets/bootstrap` | 市场级配置引导 |
| `getPortalBootstrap(init?)` | `GET /portals/bootstrap` | 门户引导数据 |
| `getPortalDomainGovernanceSummary(init?)` | `GET /portals/domain-governance` | 域名治理摘要 |
| `getWorkbenchBootstrap(init?)` | `GET /workbenches/bootstrap` | 工作台引导数据 |

### 消费者 Consumer

| 方法 | 端点 | 说明 |
|------|------|------|
| `getFoundationConsumer(consumer, init?)` | `GET /foundation/consumers/{consumer}` | 获取消费者描述 |
| `getFoundationModuleDetail(moduleKey, init?)` | `GET /foundation/overview/modules/{moduleKey}` | 模块详细健康数据 |

### 基础告警 Foundation Alert

| 方法 | 端点 | 说明 |
|------|------|------|
| `getFoundationAlertCatalog(init?)` | `GET /foundation/overview/alerts/catalog` | 告警目录 |
| `getFoundationOverview(init?, filter?)` | `GET /foundation/overview` | 运营总览 (含告警) |
| `getFoundationAlertDrilldown(code, init?)` | `GET /foundation/overview/alerts/{code}/drilldown` | 告警下钻 |
| `acknowledgeFoundationAlert(code, body?, init?)` | `POST /foundation/overview/alerts/{code}/ack` | 确认告警 |
| `muteFoundationAlert(code, body?, init?)` | `POST /foundation/overview/alerts/{code}/mute` | 静默告警 |
| `unmuteFoundationAlert(code, body?, init?)` | `POST /foundation/overview/alerts/{code}/unmute` | 取消静默 |

### 运行时治理 Runtime Governance

| 方法 | 端点 | 说明 |
|------|------|------|
| `submitRuntimeGovernanceAction(body, init?)` | `POST /foundation/runtime-governance/actions` | 提交运行时操作 |
| `getRuntimeGovernanceReceipt(receiptCode, init?)` | `GET /foundation/runtime-governance/actions/{receiptCode}` | 查询操作回执 |
| `replayRuntimeGovernanceAction(receiptCode, body, init?)` | `POST /foundation/runtime-governance/actions/{receiptCode}/replay` | 回放运行时操作 |
| `batchReplayRuntimeGovernanceActions(body, init?)` | `POST /foundation/runtime-governance/actions/batch-replay` | 批量回放 |
| `syncRuntimeGovernanceAction(receiptCode, body, init?)` | `POST .../actions/{receiptCode}/sync` | 同步运行时操作 |
| `recordRuntimeGovernanceCallback(receiptCode, body, init?)` | `POST .../actions/{receiptCode}/callback` | 记录 callback |

### 审计追踪 Audit Trail

| 方法 | 端点 | 说明 |
|------|------|------|
| `listAuditRecords(query?, init?)` | `GET /foundation/trust-governance/audit` | 审计记录列表 |
| `summarizeAuditRecords(query?, init?)` | `GET .../audit/summary` | 审计汇总 |
| `getAuditTrail(query?, init?)` | 组合上两个方法 | 审计追踪 (含汇总) |

### 配置治理 Configuration

| 方法 | 端点 | 说明 |
|------|------|------|
| `getConfigurationGovernanceOverview(query?, init?)` | `GET .../configuration-governance/overview` | 配置总览 |
| `listConfigurationFeatureFlags(query?, init?)` | `GET .../feature-flag-records` | Feature Flag 列表 |
| `listConfigurationConfigEntries(query?, init?)` | `GET .../config-entries` | 配置条目列表 |
| `listConfigurationSecrets(init?)` | `GET .../secrets` | Secret 列表 |
| `listConfigurationCertificates(init?)` | `GET .../certificates` | 证书列表 |
| `getConfigurationManagementMetadata(init?)` | `GET .../management-metadata` | 配置管理元数据 |
| `getConfigurationGovernanceSnapshot(query?, init?)` | `GET .../snapshot` | 配置快照 |

### 身份权限 Identity Access

| 方法 | 端点 | 说明 |
|------|------|------|
| `getIdentityAccessContext(query?, init?)` | `GET /identity-access/context` | 身份上下文 |
| `validateIdentityRole(query?, init?)` | `GET .../validate/role` | 角色验证 |
| `validateIdentityPermission(query?, init?)` | `GET .../validate/permission` | 权限验证 |
| `validateIdentityTenantScope(targetTenantId, query?, init?)` | `GET .../validate/tenant/{id}` | 租户作用域验证 |

### 弹性运维 Resilience

| 方法 | 端点 | 说明 |
|------|------|------|
| `getResilienceOperationsOverview(init?)` | `GET .../resilience-operations/overview` | 弹性总览 |
| `listObservabilitySignals(query?, init?)` | `GET .../observability` | 可观测信号列表 |
| `listResilienceRetryPolicies(query?, init?)` | `GET .../retry-policies` | 重试策略列表 |
| `listResilienceRecoveryPlans(query?, init?)` | `GET .../recovery-plans` | 恢复计划列表 |
| `describeResilienceRecoveryPlan(resource, init?)` | `GET .../recovery-plans/{resource}` | 恢复计划详情 |
| `stageResilienceEdgeReplay(body, init?)` | `POST .../edge-replay/stage` | 边缘回放 |

### 集成编排 Integration

| 方法 | 端点 | 说明 |
|------|------|------|
| `listIntegrationWebhookSources(init?)` | `GET .../integration-orchestration/webhooks/sources` | Webhook 源列表 |
| `listIntegrationEventEnvelopes(query?, init?)` | `GET .../events` | 事件信封列表 |
| `listIntegrationIdempotencyRecords(query?, init?)` | `GET .../idempotency-records` | 幂等记录列表 |
| `publishIntegrationEvent(body, init?)` | `POST .../events` | 发布集成事件 |
| `ingestIntegrationWebhook(source, body, init?)` | `POST .../webhooks/{source}/ingest` | Webhook 接收 |
| `getIntegrationOrchestrationWorkspace(query?, init?)` | 组合方法 | 集成编排工作台 |

### 限流配额 Rate Limit

| 方法 | 端点 | 说明 |
|------|------|------|
| `listRateLimitPolicies(query?, init?)` | `GET .../rate-limit/policies` | 限流策略列表 |
| `listQuotaLedgers(query?, init?)` | `GET .../rate-limit/ledgers` | 配额账本 |
| `getRateLimitWorkspace(query?, init?)` | 组合方法 | 限流工作台 |

### AI Agent

| 方法 | 端点 | 说明 |
|------|------|------|
| `listAgentConfigs(init?)` | `GET /agent/configs` | 代理配置列表 |
| `getAgentConfig(id, init?)` | `GET /agent/configs/{id}` | 代理配置详情 |
| `createAgentConfig(body, init?)` | `POST /agent/configs` | 创建代理配置 |
| `updateAgentConfig(id, body, init?)` | `PUT /agent/configs/{id}` | 更新代理配置 |
| `deleteAgentConfig(id, init?)` | `DELETE /agent/configs/{id}` | 删除代理配置 |
| `runAgentSession(body, init?)` | `POST /agent/sessions/run` | 运行 Agent 会话 |
| `runAgentSessionStream(body, init?)` | `POST /agent/sessions/run-stream` | SSE 流式运行 Agent |

---

## 工具函数列表

### `buildActorHeaders(options)`

构建 Actor 头信息，用于跟踪用户操作身份。

```ts
interface ActorHeaderOptions {
  actorId: string;
  actorType?: string;
  actorName?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  roles?: readonly string[];
  permissions?: readonly string[];
  authenticated?: boolean;
}
```

返回的请求头:

| Headers | 值 |
|---------|-----|
| `x-actor-id` | actorId |
| `x-actor-type` | actorType (若提供) |
| `x-actor-roles` | 逗号分隔的角色列表 |
| `x-actor-permissions` | 逗号分隔的权限列表 |
| `x-actor-authenticated` | 认证状态 |
| `x-actor-tenant-id` | tenantId (若提供) |

### `getDefaultApiBaseUrl()`

返回默认 API Base URL（按优先级: `M5_API_BASE_URL` > `NEXT_PUBLIC_M5_API_BASE_URL` > `http://localhost:3001/api/v1`）。

### `createFoundationBootstrapWiringMeta(wiring)`

从 `AppBootstrapWiring` 创建平台引导的连线元数据（scope、degradation、challenge）。

### `createFoundationGovernanceReadModelLoader(clientFactory)`

创建基础治理 ReadModel 加载器，支持 fallback 机制。

### `createFoundationAlertClient(options)`

创建专用于基础告警的 `ApiClient` 实例。

### `createFoundationAlertMutationExecutor(client, options)`

创建告警变更执行器，封装 ack / mute / unmute 操作。

### `createFoundationAlertPanelClientAccess(options)`

创建告警面板客户端访问入口（含 drilldown + mutation）。

### `createWebFoundationAlertPanelClientAccess({ app, ... })`

创建 Web 端告警面板客户端（按 app 预设 ackNote / muteNote）。

### `createRuntimeGovernancePanelClient(options)`

创建运行时治理面板客户端。

### `createRuntimeGovernancePanelBindings({ client, ... })`

创建运行时治理面板绑定，返回 `submitPreset`、`queryReceipt`、`replayReceipt` 方法。

### `buildRuntimeGovernanceSubmitRequest(options)`

构建运行时治理提交请求（含 idempotencyKey）。

### `buildRuntimeGovernanceReplayRequest(options)`

构建运行时治理回放请求。

### `loadFoundationGovernanceReadModel(client, init?)`

加载基础治理 ReadModel（告警目录 + 运营总览），支持 API / fallback 双模式。

### `loadFoundationConsumerDescriptor(client, consumer, init?)`

加载消费者描述，支持 fallback。

### `createFoundationPortalConsumerSnapshotBase({ wiring, bootstrap, consumerDescriptor })`

创建门户消费者快照基础结构。

---

## 类型说明

SDK 导出了丰富的类型定义，用于 API 请求/响应的类型安全：

### 租户配置相关

| 类型 | 说明 |
|------|------|
| `TenantConfigWorkbenchCode` | 三级工作台代码 (`W-S` / `W-T` / `W-B`) |
| `TenantConfigLevel` | 配置级别 (`store` / `tenant` / `brand`) |
| `TenantConfigCategory` | 配置分类 (pos / print / member / marketing / ...) |
| `TenantConfigSensitivity` | 配置敏感度 (`public` / `internal` / `restricted` / `secret`) |
| `TenantConfigValueType` | 配置值类型 (string / number / boolean / json / secret) |
| `TenantConfigEffective` | 生效配置（考虑继承链） |
| `TenantConfigItem` | 单条配置实例（已脱敏） |
| `TenantConfigItemDefinition` | 配置项定义 |
| `TenantConfigAuditLog` | 配置审计日志条目 |
| `TenantConfigBatchInput` | 批量配置输入 |

### API 客户端相关

| 类型 | 说明 |
|------|------|
| `ApiClientOptions` | ApiClient 构造函数参数 |
| `ActorHeaderOptions` | buildActorHeaders 参数 |
| `ApiError` | 统一 API 错误类（含 `status` / `code` / `i18nKey`） |

### 运行时治理相关

| 类型 | 说明 |
|------|------|
| `RuntimeGovernancePresetLike` | 运行时治理预设接口 |
| `BuildRuntimeGovernanceSubmitRequestOptions` | 构建提交请求参数 |
| `BuildRuntimeGovernanceReplayRequestOptions` | 构建回放请求参数 |
| `FoundationGovernanceReadModel` | 治理 ReadModel 结构 |
| `FoundationGovernanceReadModelClient` | 治理客户端类型 |
| `RuntimeGovernancePanelClient` | 运行时治理面板客户端类型 |

### 门店能力

| 类型 | 说明 |
|------|------|
| `LytStoreCapabilityAccessItem` | 门店能力访问项 |
| `LytStoreCapabilityAccessViewResponse` | 门店能力访问视图 |

---

## 使用示例

### 基本用法

```ts
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

// 创建客户端
const client = new ApiClient({
  baseUrl: getDefaultApiBaseUrl(),
  tenantId: 'tnt-demo',
  token: 'eyJhbGci...',
});

// 获取引导数据
async function init() {
  const foundation = await client.getFoundationBootstrap();
  console.log('Bootstrap:', foundation);

  const market = await client.getMarketBootstrap();
  console.log('Market:', market);
}
```

### 查询审计记录

```ts
const records = await client.listAuditRecords({
  tenantId: 'tnt-demo',
  from: '2026-07-01T00:00:00Z',
  to: '2026-07-22T00:00:00Z',
});
```

### 提交运行时治理操作

```ts
const receipt = await client.submitRuntimeGovernanceAction({
  app: { appId: 'admin-web', appVersion: '0.1.0' },
  action: 'member-login',
  riskLevel: 'medium',
  nextStep: 'CHALLENGE',
  requestEndpoint: '/api/v1/members/session/challenge',
  payload: { memberId: 'mem-xxx' },
  payloadSummary: '会员登录挑战',
  recommendedAction: 'PROCEED',
  handlerName: 'member-login-handler',
  idempotencyKey: 'admin-web:member-login:submit:nonce-001',
  actorId: 'admin-001',
  tenantId: 'tnt-demo',
});
```

### SSE 流式 AI Agent 会话

```ts
import { ApiClient } from '@m5/sdk';

const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', token: '...' });

for await (const event of client.runAgentSessionStream({
  configId: 'cfg-sales-001',
  userInput: '分析本月营收趋势',
})) {
  switch (event.type) {
    case 'step_progress':
      console.log(`进度: ${event.step}/${event.maxSteps}`);
      break;
    case 'message_added':
      appendMessage(event.message);
      break;
    case 'session_completed':
      finalize(event.session, event.execution);
      break;
  }
}
```

### 构建 Actor 头信息

```ts
import { buildActorHeaders } from '@m5/sdk';

const headers = buildActorHeaders({
  actorId: 'admin-001',
  actorType: 'admin',
  roles: ['super_admin', 'auditor'],
  tenantId: 'tnt-demo',
});
// 返回:
// {
//   'x-actor-id': 'admin-001',
//   'x-actor-type': 'admin',
//   'x-actor-roles': 'super_admin,auditor',
//   'x-roles': 'super_admin,auditor',
//   'x-actor-tenant-id': 'tnt-demo',
// }
```

### 运行时治理面板绑定

```ts
import { ApiClient, createRuntimeGovernancePanelBindings } from '@m5/sdk';

const client = new ApiClient({ baseUrl: '...', token: '...' });

const bindings = createRuntimeGovernancePanelBindings({
  client,
  buildSubmitRequest: (preset, nonce) => ({
    app: { appId: 'admin-web', appVersion: '0.1.0' },
    action: preset.action,
    nextStep: preset.nextStep,
    riskLevel: preset.riskLevel,
    requestEndpoint: preset.requestEndpoint,
    payload: preset.payload,
    payloadSummary: JSON.stringify(preset.payload),
    recommendedAction: preset.recommendedAction,
    handlerName: preset.handlerName,
    idempotencyKey: `admin-web:${preset.action}:submit:${nonce}`,
    actorId: 'admin-001',
  }),
  buildReplayRequest: (receipt, nonce) => ({
    ledgerKey: receipt.ledger.ledgerKey,
    requestedFrom: 'user',
    ticketCode: receipt.ticket.ticketCode,
    idempotencyKey: `admin-web:${receipt.action}:replay:${nonce}`,
    actorId: 'admin-001',
  }),
});

// 提交预设
await bindings.submitPreset(myPreset, 'nonce-001');

// 查询回执
const receipt = await bindings.queryReceipt(receipt);

// 回放回执
await bindings.replayReceipt(receipt, 'nonce-002');
```

### 告警管理

```ts
import { createWebFoundationAlertPanelClientAccess } from '@m5/sdk';

const alertPanel = createWebFoundationAlertPanelClientAccess({
  app: 'admin-web',
  tenantId: 'tnt-demo',
  token: '...',
});

// 确认告警
await alertPanel.ackAlert('observability-degradation');

// 静默告警 (2小时)
await alertPanel.muteAlert('observability-degradation');

// 取消静默
await alertPanel.unmuteAlert('observability-degradation');

// 告警下钻
const drilldown = await alertPanel.loadDrilldown('observability-degradation');
```

### 错误处理

```ts
import { ApiClient, ApiError } from '@m5/sdk';

try {
  await client.submitRuntimeGovernanceAction({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`[${error.status}] ${error.message}`);
    console.error(`Code: ${error.code}, i18nKey: ${error.i18nKey}`);
    // i18nKey 可用于前端国际化展示
  }
}
```

---

## 高级用法

### 自定义请求初始化

所有 API 方法接受可选的 `RequestInit` 参数，支持覆盖请求配置：

```ts
// 禁用缓存
const data = await client.getAuditTrail(
  { tenantId: 'tnt-demo' },
  { cache: 'no-store' } as RequestInit
);

// 自定义请求头
await client.submitRuntimeGovernanceAction(
  { ... },
  { headers: { 'x-trace-id': 'trace-001' } }
);
```

### 组合工作台查询

SDK 提供了组合多个 API 调用的便捷方法：

```ts
// 审计追踪 (含汇总)
const auditTrail = await client.getAuditTrail({ tenantId: 'tnt-demo' });
// → 返回 records + summary + total

// 限流工作台 (含策略 + 账本 + 统计)
const rateLimitWorkspace = await client.getRateLimitWorkspace({ tenantId: 'tnt-demo' });
// → 返回 policies + ledgers + byPeriod + byScope + totals

// 集成编排工作台
const integrationWorkspace = await client.getIntegrationOrchestrationWorkspace();
// → 返回 sources + events + idempotencyRecords + summary
```

### Fallback 降级

`loadFoundationGovernanceReadModel` 和 `loadFoundationConsumerDescriptor` 支持 API 失败时的 fallback 降级：

```ts
import { loadFoundationGovernanceReadModel } from '@m5/sdk';
import { foundationAlertCatalogFallback } from '@m5/types';

// 即使 API 不可用也返回有效数据
const model = await loadFoundationGovernanceReadModel(client);
// model.deliveryMode === 'api' (正常) 或 'fallback' (降级)
// model.alerts 使用 foundationAlertCatalogFallback 作为兜底
```

---

## API 文档参考

### 完整方法签名

```ts
class ApiClient {
  // 引导
  getFoundationBootstrap(init?: RequestInit): Promise<FoundationBootstrapResponse>
  getMarketBootstrap(init?: RequestInit): Promise<MarketBootstrapResponse>
  getPortalBootstrap(init?: RequestInit): Promise<PortalBootstrapResponse>

  // 审计
  listAuditRecords(query?: AuditTrailQuery, init?: RequestInit): Promise<AuditRecordContract[]>
  getAuditTrail(query?: AuditTrailQuery, init?: RequestInit): Promise<AuditTrailResponse & { summary?: AuditTrailSummary }>

  // 配置
  getConfigurationGovernanceOverview(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<ConfigurationOverview>
  listConfigurationFeatureFlags(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<ConfigurationFeatureFlag[]>
  getConfigurationGovernanceSnapshot(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<{...}>

  // 运行时治理
  submitRuntimeGovernanceAction(body: RuntimeGovernanceSubmitRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>
  replayRuntimeGovernanceAction(receiptCode: string, body: RuntimeGovernanceReplayRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>
  batchReplayRuntimeGovernanceActions(body: RuntimeGovernanceBatchReplayRequest, init?: RequestInit): Promise<RuntimeGovernanceBatchReplayResponse>

  // 身份权限
  getIdentityAccessContext(query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessResolvedContext>
  validateIdentityRole(query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessValidationResult>

  // 限流
  getRateLimitWorkspace(query?: RateLimitWorkspaceQuery, init?: RequestInit): Promise<RateLimitWorkspace>

  // 集成编排
  getIntegrationOrchestrationWorkspace(query?: IntegrationOrchestrationWorkspaceQuery, init?: RequestInit): Promise<IntegrationOrchestrationWorkspace>

  // AI Agent
  listAgentConfigs(init?: RequestInit): Promise<AgentConfig[]>
  runAgentSession(body: CreateSessionRequest, init?: RequestInit): Promise<SessionExecutionResult>
  runAgentSessionStream(body: CreateSessionRequest, init?: RequestInit): AsyncGenerator<AgentSessionEvent>

  // ... 更多方法见 index.ts
}
```

---

## 构建与发布

### 构建命令

```bash
# 构建 CJS + 类型声明
pnpm build       # 使用 tsup 构建到 dist/

# 监听模式增量构建
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 测试
pnpm test
```

### 构建产物

```
packages/sdk/
└── dist/
    ├── index.js       # CJS 构建
    └── index.d.ts     # TypeScript 声明文件
```

### 发布说明

作为 monorepo workspace 内部包，不需要单独发布到 npm registry。其他 package 通过 `"@m5/sdk": "workspace:*"` 引用，构建时自动解析。如果需要在外部项目中使用，只需构建后从 `dist/` 引用。

---

## 常见问题

### Q: ApiClient 初始化时 token 从哪里获取？

token 通常在应用引导阶段获取。前端应用通过登录流程获取 token 后传递给 ApiClient：

```ts
// 在应用引导 (bootstrap) 中
const bootstrap = await client.getFoundationBootstrap();
// 将 bootstrap 中的 token 注入到后续的 ApiClient
const authenticatedClient = new ApiClient({
  ...clientOptions,
  token: bootstrap.auth.token,
});
```

### Q: ApiError 的 i18nKey 如何使用？

`ApiError.i18nKey` 对应后端的国际化错误 key，前端可以使用 i18next 等库展示友好错误信息：

```ts
import { useTranslation } from 'react-i18next';

function ErrorDisplay({ error }: { error: ApiError }) {
  const { t } = useTranslation();
  const msg = error.i18nKey ? t(`errors.${error.i18nKey}`) : error.message;
  return <Alert type="error" message={msg} />;
}
```

### Q: 如何正确处理 SSE 流式事件的错误和重连？

`runAgentSessionStream` 返回 `AsyncGenerator`，使用 `for await...of` 消费。流中断时会抛出异常，建议用 try/catch 包裹：

```ts
try {
  for await (const event of client.runAgentSessionStream(request)) {
    handleEvent(event);
  }
} catch (error) {
  if (error instanceof ApiError) {
    // 根据状态码决定是否重试
    if (error.status >= 500) {
      await retry(3);
    }
  }
}
```
