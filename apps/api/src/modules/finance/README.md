# 财务模块 (Finance)

## 模块概述

核心财务引擎，提供 SaaS 多租户隔离下的全链路财务管理能力。涵盖总账、账户、结算、对账、发票、报表、成本分析、现金流追踪及数据归档。集成 SSE 实时事件推送、AI 辅助记账、T+1 自动对账（微信/支付宝渠道）、损益分析、月度对账报表与 CSV 导出。

## 功能范围

| 功能域 | 说明 |
|--------|------|
| 总账管理 (Ledger) | 收支流水记录、按类型/门店/时间范围查询、删除 |
| 账户管理 (Account) | 账户开立/冻结/关闭、余额查询、门店级账户管理 |
| 结算管理 (Settlement) | 创建/查询/确认/争议/终审结算单，含详细明细 |
| 发票管理 (Invoice) | 发票创建/开具/取消、发票列表与明细查询 |
| 收入汇总 (Revenue) | 日/周期收入汇总聚合、每日流水明细查询 |
| 应收账款 (Transaction Revenue) | 收入/退款交易分录记录 |
| 数据归档 (Archival) | 财务数据归档管理 |
| 对账管理 (Reconciliation) | T+1 自动对账（微信 + 支付宝渠道）、对账报告、CSV 导出 |
| 成本分析 (Cost Analysis) | 费用分类统计、环比/同比分析 |
| 现金流追踪 (Cash Flow) | 资金流入/流出记录、日余额曲线 |
| 损益分析 (P&L) | 门店级损益、品牌级损益报表 |
| SSE 事件推送 | 实时财务事件推送，支持 Last-Event-ID 重连 |
| 自动调度 | SettlementCron / ReconciliationCron T+1 自动执行 |

## 目录结构

```
finance/
├── finance.module.ts                                  — NestJS 模块（导入 PrismaModule）
├── finance.controller.ts                             — 主控制器（Ledger/Account/Settlement/Invoice/Revenue/Archival）
├── finance.controller.spec.ts                        — 控制器单测
├── finance.controller.test.ts                        — 控制器功能测试
├── finance.service.ts                                — 核心服务（Prisma CRUD）
├── finance.entity.ts                                 — TypeScript 类型定义 + 枚举
├── finance.dto.ts                                    — 请求/响应 DTO
├── finance.sse.ts                                    — SSE 实时事件流（3 端点）
├── finance-archival.service.ts                       — 数据归档服务
├── finance-archival.service.test.ts                  — 归档服务测试
├── finance-invoice.service.ts                        — 发票处理服务
├── finance-invoice.service.test.ts                   — 发票服务测试
├── finance-report.service.ts                         — 报表服务
├── finance-report.service.test.ts                    — 报表服务测试
├── finance-dashboard.service.ts                      — 损益分析（StorePAndLService / BrandPAndLService）
├── finance-dashboard.test.ts                         — 损益分析测试
├── finance-cost-cash-flow.service.ts                 — 成本分析 + 现金流追踪
├── finance-payment.entity.test.ts                    — 支付实体测试
├── finance-reconciliation.controller.spec.ts         — 对账控制单测
├── finance-reconciliation.service.spec.ts            — 对账服务单测
├── finance-reconciliation.service.test.ts            — 对账服务功能测试
├── finance-reconciliation.query.test.ts              — 对账查询测试
├── finance-settlement.controller.ts                  — 结算控制器
├── finance-settlement.controller.spec.ts             — 结算控制单测
├── finance-settlement.cron.ts                        — 结算 Cron 调度
├── finance-health-dashboard.controller.ts            — 仪表盘 API（成本/现金流）
├── finance-core.prisma-http.e2e.test.ts              — E2E 测试
├── finance.e2e-supplement.test.ts                    — E2E 补充测试
│
├── dto/                                              — 子 DTO 模块
│   ├── index.ts
│   ├── create-report.dto.ts
│   ├── create-reconciliation.dto.ts
│   └── response.dto.ts
│
└── reconciliation/                                   — 对账引擎
    ├── index.ts
    ├── reconciliation.port.ts                        — 渠道适配器接口
    ├── reconciliation.service.ts                     — 对账核心服务
    ├── reconciliation.cron.ts                        — T+1 自动对账 Cron
    ├── reconciliation.test.ts                        — 对账测试
    ├── wechat-reconciliation.adapter.ts              — 微信对账适配器
    ├── alipay-reconciliation.adapter.ts              — 支付宝对账适配器
    ├── finance-reconciliation-report.service.ts      — 月度对账报表 + CSV 导出
    └── finance-reconciliation-report.test.ts         — 报表测试
```

## 核心数据实体

| 实体 | 说明 |
|------|------|
| Ledger | 收支流水：类型(income/expense/transfer)、金额(分)、关联订单/交易 |
| Account | 财务账户：类型(cash/bank/alipay/wechat/credit_card)、状态(active/frozen/closed) |
| Settlement | 结算单：门店/品牌级、状态(pending/confirmed/disputed/finalized) |
| Invoice | 发票：类型(tax/simple)、状态(draft/issued/cancelled) |
| Archival | 数据归档记录 |

## REST 接口

### 总账 (Ledger)

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/finance/ledgers` | 记录流水 |
| `GET` | `/api/finance/ledgers` | 流水列表（按类型/门店/时间过滤） |
| `GET` | `/api/finance/ledgers/:id` | 查询单条流水 |
| `DELETE` | `/api/finance/ledgers/:id` | 删除流水 |

### 账户 (Account)

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/finance/accounts` | 创建账户 |
| `GET` | `/api/finance/accounts` | 账户列表 |
| `GET` | `/api/finance/accounts/:id` | 查询单个账户 |
| `GET` | `/api/finance/accounts/:id/balance` | 查询余额 |
| `POST` | `/api/finance/accounts/:id/freeze` | 冻结账户 |
| `POST` | `/api/finance/accounts/:id/close` | 关闭账户 |

### 结算 (Settlement)

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/finance/settlements` | 创建结算单 |
| `GET` | `/api/finance/settlements` | 结算单列表 |
| `GET` | `/api/finance/settlements/:id` | 查询结算单 |
| `GET` | `/api/finance/settlements/:id/detail` | 结算单明细 |
| `POST` | `/api/finance/settlements/:id/confirm` | 确认结算 |
| `POST` | `/api/finance/settlements/:id/dispute` | 争议结算 |
| `POST` | `/api/finance/settlements/:id/finalize` | 终审结算 |

### 发票 (Invoice)

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/finance/invoices` | 创建发票 |
| `GET` | `/api/finance/invoices` | 发票列表 |
| `GET` | `/api/finance/invoices/:id` | 查询发票 |
| `POST` | `/api/finance/invoices/:id/issue` | 开具发票 |
| `POST` | `/api/finance/invoices/:id/cancel` | 作废发票 |

### 收入与交易

| 方法 | 路由 | 说明 |
|------|------|------|
| `GET` | `/api/finance/revenue/summary` | 收入汇总 |
| `GET` | `/api/finance/revenue/daily` | 每日收入 |
| `POST` | `/api/finance/transactions/revenue` | 记录收入交易 |
| `POST` | `/api/finance/transactions/refund` | 记录退款交易 |

### 数据归档

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/finance/archivals` | 创建归档 |
| `GET` | `/api/finance/archivals` | 归档列表 |
| `GET` | `/api/finance/archivals/:id` | 查询归档 |

### SSE 事件流

| 方法 | 路由 | 说明 |
|------|------|------|
| `SSE` | `/api/finance/events` | 财务全事件流 |
| `SSE` | `/api/finance/reconciliation/events` | 对账进度事件流 |
| `SSE` | `/api/finance/reports/events` | 报表生成进度事件流 |

支持事件类型: ledger.created, account.created/frozen/closed, settlement.created/confirmed/disputed, invoice.created/issued/cancelled, reconciliation.started/progress/completed/mismatch, report.generating/completed。

## 使用示例

### 记录收入流水

```bash
curl -X POST http://localhost:3000/api/finance/ledgers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"type": "income", "amount": 10000, "description": "扫码支付收入", "category": "retail"}'
```

### 创建结算单

```bash
curl -X POST http://localhost:3000/api/finance/settlements \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"storeId": "store-001", "periodStart": "2026-07-01", "periodEnd": "2026-07-15"}'
```

### 订阅 SSE 财务事件

```bash
curl -N http://localhost:3000/api/finance/events \
  -H "x-tenant-id: tenant-demo"
```

## 依赖关系

| 依赖 | 说明 |
|------|------|
| NestJS | 框架基础 |
| PrismaModule | Prisma ORM 持久化 |
| RxJS | SSE 事件流实现 |
| `class-validator` / `class-transformer` | DTO 验证 |
| `agent/tenant.guard` | 多租户守卫 |
| `@m5/types` (PaymentMethod) | 支付渠道类型 |

## 运行测试

```bash
# 控制器测试
npx jest apps/api/src/modules/finance/finance.controller.spec.ts
npx jest apps/api/src/modules/finance/finance.controller.test.ts

# 服务层测试
npx jest apps/api/src/modules/finance/finance-archival.service.test.ts
npx jest apps/api/src/modules/finance/finance-invoice.service.test.ts
npx jest apps/api/src/modules/finance/finance-report.service.test.ts

# 对账测试
npx jest apps/api/src/modules/finance/finance-reconciliation.service.spec.ts
npx jest apps/api/src/modules/finance/finance-reconciliation.service.test.ts
npx jest apps/api/src/modules/finance/reconciliation/reconciliation.test.ts
npx jest apps/api/src/modules/finance/reconciliation/finance-reconciliation-report.test.ts

# 仪表板/成本/现金流测试
npx jest apps/api/src/modules/finance/finance-dashboard.test.ts

# E2E 测试
npx jest apps/api/src/modules/finance/finance-core.prisma-http.e2e.test.ts
npx jest apps/api/src/modules/finance/finance.e2e-supplement.test.ts
```
