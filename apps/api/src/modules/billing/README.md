# 计费模块 (Billing)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块负责多租户计费结算核心能力:
- **账单计算** (`POST /api/billing/calculate`) — 根据用量和套餐计算费用
- **折扣策略** (coupon/阶梯折扣) — 自动应用优惠策略
- **发票管理** (`POST/GET /api/billing/invoices`) — 生成、查询生命周期
- **支付状态查询** (`GET /api/billing/payments/:invId`) — 支付回调状态跟踪
- **计费统计** (`GET /api/billing/stats`) — 计费维度汇总

边界约束:
- ❌ 不处理 SaaS 套餐/订阅管理（见 `saas-billing` 模块）
- ❌ 不处理实际资金支付渠道对接（对外只暴露 Invoice 状态）
- ❌ 不处理财务记账/报表（见 `reports` 模块）
- ✅ 聚焦 用量→费用 → Invoice → 支付状态 的闭环

═══════════════════════════════════════
箍二: 依赖关系清单
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 租户多租隔离守卫，所有端点强制 `@UseGuards(TenantGuard)` |
| 上游依赖 | NestJS 核心 | `@Controller`/`@Module`/`@Injectable` 等框架装饰器 |
| 下游消费 | `api.billing.*` | 外部调用方通过 BillingController REST API 消费 |
| 下游消费 | 模块间注入 | `BillingService` 通过模块 exports 供其他 NestJS 模块注入 |

═══════════════════════════════════════
箍三: 领域事件/消息契约
═══════════════════════════════════════

本模块无独立事件总线消息发布。对外接口均为同步 REST API:

| 事件/操作 | 触发点 | 语义 |
|-----------|--------|------|
| 账单计算 | `POST /api/billing/calculate` | 输入 usage + tier → 返回 BillResult |
| 生成发票 | `POST /api/billing/invoices` | 创建 Invoice → 返回完整 Invoice 对象 |
| 支付发票 | `POST /api/billing/invoices/:id/pay` | 标记 Invoice 为 paid |
| 支付回调查询 | `GET /api/billing/payments/:invId` | 返回 PaymentStatus |

类型契约:
- `PricingTier`: `'free' | 'basic' | 'pro' | 'enterprise'`
- `Currency`: `'CNY' | 'USD' | 'EUR'`
- `InvoiceStatus`: `'draft' | 'issued' | 'paid' | 'cancelled'`
- `PaymentStatus`: `'unpaid' | 'paid' | 'overdue' | 'cancelled' | 'refunded'`

═══════════════════════════════════════
箍四: 配置与环境变量声明
═══════════════════════════════════════

本模块目前无独立环境变量，使用隐式定价表（hardcoded in `billing.service.ts`）:

- `PRICING_TABLE`: 三层定价基准（free/basic/pro/enterprise）
- `DISCOUNT_TABLE`: 阶梯折扣策略
- `TAX_RATE`: 税率（默认 0%）

> 后续优化: 应迁移至数据库/配置中心管理定价表，支持动态定价。

═══════════════════════════════════════
箍五: 测试覆盖承诺与入口指引
═══════════════════════════════════════

```
apps/api/src/modules/billing/
├── billing.controller.test.ts       — 控制器单测（5 KB）
├── billing.service.spec.ts          — 服务层 spec（11 KB）
├── billing.service.test.ts          — 服务层单测（11 KB）
├── billing.service.full.test.ts     — 服务层全量测试（20 KB）
├── billing.service-extra.spec.ts    — 服务层扩展测试（11 KB）
├── billing.service.edge.test.ts     — 服务层边界测试（9 KB）
├── billing.e2e.test.ts              — E2E 端到端测试（20 KB）
├── billing.role-extended.test.ts    — 角色权限扩展测试（18 KB）
├── billing.controller.ts            — 控制器（4 KB）
├── billing.module.ts                — NestJS 模块定义
├── billing.service.ts               — 服务层（11 KB）
└── README.md                        — 本文档
```

运行测试:

```bash
# 计费模块全量测试
npx jest apps/api/src/modules/billing/billing.service.test.ts
npx jest apps/api/src/modules/billing/billing.service.spec.ts
npx jest apps/api/src/modules/billing/billing.controller.test.ts
npx jest apps/api/src/modules/billing/billing.e2e.test.ts
npx jest apps/api/src/modules/billing/billing.role-extended.test.ts
npx jest apps/api/src/modules/billing/billing.service-extra.spec.ts
npx jest apps/api/src/modules/billing/billing.service.edge.test.ts
npx jest apps/api/src/modules/billing/billing.service.full.test.ts
```

覆盖承诺: 分层全覆盖（Controller + Service + E2E + Role + Edge），9 个测试文件，总约 110 KB。
