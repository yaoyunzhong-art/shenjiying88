# SaaS 计费模块 (SaaSBilling)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块负责 SaaS 多租户计费订阅全生命周期管理:

- **套餐管理** (`GET /saas-billing/plans`, `POST /saas-billing/plans`) — 预定义套餐 + 自定义套餐
- **订阅管理** (`POST /saas-billing/subscribe`, `POST /saas-billing/subscriptions/:tid/change-plan`, `POST /saas-billing/subscriptions/:tid/cancel`, `POST /saas-billing/subscriptions/:tid/renew`) — 订阅、变更套餐、取消、续费
- **配额监控** (`POST /saas-billing/usage`, `POST /saas-billing/check-quota`) — 用量上报与配额检查
- **计费与账单** (`GET /saas-billing/invoices/:tid`, `POST /saas-billing/invoices/:tid/pay`) — 账单生成与支付状态
- **试用管理** (`POST /saas-billing/trial/start`, `GET /saas-billing/trial/:tid`) — 免费试用周期管理
- **超量计费** (`POST /saas-billing/overage/calculate`) — 超出配额自动计费

边界约束:
- ❌ 不处理单次账单计算/折扣策略（见 `billing` 模块）
- ❌ 不处理 BI 报表/多维分析（见 `reports` 模块）
- ❌ 不处理实际资金收付渠道对接
- ✅ 只关注套餐定义、订阅状态机、配额追踪、试用周期

═══════════════════════════════════════
箍二: 依赖关系清单
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 租户多租隔离守卫 |
| 上游依赖 | `nanoid` | 唯一 ID 生成 |
| 上游依赖 | `@nestjs/swagger` | API 文档（`@ApiTags`/`@ApiOperation`） |
| 下游消费 | 外部前端/API 网关 | RESTful API 消费 |
| 下游消费 | 内嵌计费引擎 | `SaaSBillingService` 作为 Provider 供其他模块注入 |

═══════════════════════════════════════
箍三: 领域事件/消息契约
═══════════════════════════════════════

所有操作均为同步 REST API，暂无事件总线消息发布:

| API 端点 | 方法 | 输入 DTO | 返回实体 |
|----------|------|----------|----------|
| `/saas-billing/plans` | GET | — | `PricingPlan[]` |
| `/saas-billing/plans/:planId` | GET | — | `PricingPlan \| null` |
| `/saas-billing/plans` | POST | `CreatePlanDto` | `PricingPlan` |
| `/saas-billing/subscribe` | POST | `SubscribeDto` | `TenantSubscription` |
| `/saas-billing/subscriptions/:tid/change-plan` | POST | `ChangePlanDto` | `TenantSubscription` |
| `/saas-billing/subscriptions/:tid/cancel` | POST | — | `{ success: boolean }` |
| `/saas-billing/subscriptions/:tid/renew` | POST | — | `TenantSubscription` |
| `/saas-billing/usage` | POST | `RecordUsageDto` | `{ success: boolean }` |
| `/saas-billing/check-quota` | POST | `CheckQuotaDto` | `QuotaCheckResult` |
| `/saas-billing/trial/start` | POST | `StartTrialDto` | `TrialStatus` |
| `/saas-billing/trial/:tid` | GET | — | `TrialStatus` |
| `/saas-billing/overage/calculate` | POST | `OverageResponseDto` | 超量费用明细 |
| `/saas-billing/invoices/:tid` | GET | — | `Invoice[]` |
| `/saas-billing/invoices/:tid/pay` | POST | — | `Invoice` |

核心实体类型: `PricingPlan` / `PricingTier` / `TenantSubscription` / `Invoice` / `QuotaUsage` / `QuotaCheckResult` / `TrialStatus` / `BillingCycle` / `QuotaType`

═══════════════════════════════════════
箍四: 配置与环境变量声明
═══════════════════════════════════════

本模块当前使用内存（`Map`）存储定价方案和订阅数据，无持久化依赖。

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 默认套餐 | Starter / Professional / Enterprise | 硬编码于 `initDefaultPlans()` |
| 超量费率 | `api_calls: $0.01` / `storage_gb: $1` / `users: $20` / `transactions: $0.001` / `devices: $5` | `DEFAULT_OVERAGE_RATES` |
| 计费周期折扣 | 月度 1× / 季度 0.9× / 年度 0.8× | `DEFAULT_DISCOUNTS` |

> 后续优化: 应对接数据库存储（如 `PricingPlan` 表）及配置中心管理费率和折扣。

═══════════════════════════════════════
箍五: 测试覆盖承诺与入口指引
═══════════════════════════════════════

```
apps/api/src/modules/saas-billing/
├── saas-billing.controller.ts           — 控制器（6 KB）
├── saas-billing.controller.spec.ts      — 控制器 spec 测试
├── saas-billing.controller.test.ts      — 控制器单测
├── saas-billing.dto.ts                  — DTO 定义
├── saas-billing.dto.test.ts             — DTO 验证测试
├── saas-billing.entity.ts               — 实体定义
├── saas-billing.entity.test.ts          — 实体测试
├── saas-billing.module.ts               — NestJS 模块
├── saas-billing.module.test.ts          — 模块加载测试
├── saas-billing.service.ts              — 服务层（12 KB）
├── saas-billing.service.spec.ts         — 服务层 spec 测试
├── saas-billing.service.test.ts         — 服务层单测
├── saas-billing.ringbeam.test.ts        — 圈梁合规测试
├── saas-billing.role.test.ts            — 角色权限测试
├── saas-billing.role-extended.test.ts   — 角色权限扩展测试
├── saas-billing.role-scenario.test.ts   — 角色场景测试
├── saas-billing.e2e.test.ts             — E2E 端到端测试
├── saas-billing.test.ts                 — 全量聚合测试
└── README.md                            — 本文档
```

运行测试:

```bash
# SaaS 计费模块全量测试
npx jest apps/api/src/modules/saas-billing/saas-billing.service.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.controller.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.e2e.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.ringbeam.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.role.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.role-extended.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.role-scenario.test.ts
npx jest apps/api/src/modules/saas-billing/saas-billing.test.ts
```

覆盖承诺: 分层全覆盖（Module + Controller + Service + DTO + Entity + E2E + Role + Ringbeam），18 个测试文件，覆盖套餐管理、订阅状态机、配额计量、试用周期、超量计费等全场景。
