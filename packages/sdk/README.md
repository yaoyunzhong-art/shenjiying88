# @m5/sdk — SDK / 软件开发工具包

**@m5/sdk** 是 M5 平台对外提供的 SDK 包，封装了平台核心 API 的调用接口，包括基础告警治理、运行时治理、身份权限、配置管理、弹性运维、集成编排、AI Agent 等多个领域。依赖 `@m5/types` 提供的类型定义。

---

## 技术栈 Tech Stack

| 技术       | 说明                         |
|------------|------------------------------|
| TypeScript | 全量类型声明，编译为 CJS     |
| tsup       | 构建工具                      |
| @m5/types  | 共享类型定义（workspace:*）   |

---

## 目录结构 Directory Structure

```
packages/sdk/
├── src/
│   ├── index.ts               # 入口文件，导出全部 API
│   └── index.test.ts          # 单元测试
├── dist/                       # 构建产物
├── package.json
├── tsconfig.json
└── README.md                   # 本文件
```

---

## 使用示例 Usage Example

```ts
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type { ApiClientOptions } from '@m5/sdk';

// 创建 API 客户端
const client = new ApiClient({
  baseUrl: getDefaultApiBaseUrl(),
  tenantId: 'tnt-xxx',
  token: 'bearer-token',
});

// 加载基础引导数据
const foundation = await client.getFoundationBootstrap();
console.log('Foundation:', foundation);

// 获取告警目录
const alerts = await client.getFoundationAlertCatalog();
console.log('Alerts:', alerts);

// 查询审计记录
const auditRecords = await client.listAuditRecords({
  tenantId: 'tnt-xxx',
  from: '2026-07-01T00:00:00Z',
});

// 提交运行时治理操作
const receipt = await client.submitRuntimeGovernanceAction({
  app: { appId: 'admin-web', appVersion: '0.1.0' },
  action: 'member-login',
  riskLevel: 'medium',
  // ...
});

// 使用 SSE 流式执行 AI Agent 会话
for await (const event of client.runAgentSessionStream({
  configId: 'cfg-xxx',
  userInput: '分析本月营收趋势',
})) {
  console.log('Event:', event.type, event);
}
```

### 构建 Actor 头信息

```ts
import { buildActorHeaders } from '@m5/sdk';

const headers = buildActorHeaders({
  actorId: 'user-001',
  actorType: 'admin',
  roles: ['super_admin', 'auditor'],
  tenantId: 'tnt-xxx',
});
// → { 'x-actor-id': 'user-001', 'x-actor-roles': 'super_admin,auditor', ... }
```

### 创建运行时治理面板绑定

```ts
import { createRuntimeGovernancePanelBindings } from '@m5/sdk';

const bindings = createRuntimeGovernancePanelBindings({
  client,
  buildSubmitRequest: (preset, nonce) => ({ ... }),
  buildReplayRequest: (receipt, nonce) => ({ ... }),
});

await bindings.submitPreset(myPreset, nonce);
```

---

## API 领域概览 API Domains

| 领域                              | 核心方法                                                                    |
|-----------------------------------|-----------------------------------------------------------------------------|
| 引导 Bootstrap                    | `getFoundationBootstrap`, `getMarketBootstrap`, `getPortalBootstrap`         |
| 消费者 Consumer                   | `getFoundationConsumer`, `getFoundationModuleDetail`                         |
| 基础告警 Foundation Alert         | `getFoundationAlertCatalog`, `getFoundationOverview`, `acknowledgeFoundationAlert`, `muteFoundationAlert`, `unmuteFoundationAlert` |
| 运行时治理 Runtime Governance      | `submitRuntimeGovernanceAction`, `replayRuntimeGovernanceAction`, `batchReplayRuntimeGovernanceActions`, `syncRuntimeGovernanceAction` |
| 审计追踪 Audit Trail              | `listAuditRecords`, `summarizeAuditRecords`, `getAuditTrail`                 |
| 配置治理 Configuration             | `getConfigurationGovernanceOverview`, `listConfigurationFeatureFlags`, `listConfigurationConfigEntries`, `listConfigurationSecrets` |
| 身份权限 Identity Access          | `getIdentityAccessContext`, `validateIdentityRole`, `validateIdentityPermission` |
| 弹性运维 Resilience               | `getResilienceOperationsOverview`, `listObservabilitySignals`, `listResilienceRecoveryPlans`, `stageResilienceEdgeReplay` |
| 集成编排 Integration              | `listIntegrationWebhookSources`, `listIntegrationEventEnvelopes`, `publishIntegrationEvent`, `ingestIntegrationWebhook` |
| 限流配额 Rate Limit               | `listRateLimitPolicies`, `listQuotaLedgers`, `getRateLimitWorkspace`         |
| AI Agent                          | `listAgentConfigs`, `runAgentSession`, `runAgentSessionStream` (SSE 流式)    |

---

## Scripts 说明

| 命令                    | 说明                         |
|------------------------|------------------------------|
| `pnpm build`           | 使用 tsup 构建 CJS + 类型声明 |
| `pnpm dev`             | 监听模式增量构建              |
| `pnpm lint`            | ESLint 代码检查               |
| `pnpm typecheck`       | TypeScript 类型检查           |
| `pnpm test`            | 运行单元测试                  |

---

## 依赖说明 Dependencies

- **@m5/types** — M5 平台共享类型定义（workspace:*）

🔄 此文件由保底续产机器人自动生成 — 2026-07-22
