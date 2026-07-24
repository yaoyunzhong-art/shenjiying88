# finance — shenjiying88 P-38财务冲刺 · 保底续产

> 财务管理模块 — 多租户零售平台 Payment & Refund 全生命周期管控中枢
> Finance Module — Multi-tenant retail platform Payment & Refund lifecycle control center
> 财务管理模块 — 多租户零售平台の Payment & Refund 全生命周期管理ハブ

**日期**: 2026-07-24
**路径**: `apps/admin-web/app/finance/`

---

## 功能概述 (Overview)

财务模块承担 P-38 财务冲刺的核心支付、退款与对账职能。支持多渠道支付接入（Wechat/AliPay/Card/Cash/Balance）、退款审批流程、自动对账引擎、预算与损益分析。

**核心能力**:
- **Payment 全生命周期**: 创建 → PENDING → SUCCESS/FAILED → REFUNDED
- **Refund 审批流**: REQUESTED → APPROVED → COMPLETED / REJECTED
- **幂等键保护**: UUID idempotency-key 防止重复提交
- **乐观锁并发**: version 字段保证写入一致性
- **财务子功能**: Dashboard / 预算 / 发票 / 对账 / 对账规则 / 支出 / 损益

---

## 目录结构 (Directory Structure)

```
finance/
├── [id]/                       # 单笔交易详情页
│   ├── loading.tsx
│   ├── page.test.ts
│   ├── page.test.tsx
│   └── page.tsx
├── budget/                     # 预算管理
│   ├── loading.tsx
│   ├── page.test.ts
│   ├── page.test.tsx
│   └── page.tsx
├── dashboard/                  # 财务概览仪表盘
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── invoices/                   # 发票管理
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── payouts/                    # 支出管理
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── profit-loss/                # 损益分析
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── reconciliation/             # 对账管理
│   ├── discrepancies/
│   │   └── [id]/
│   │       ├── loading.tsx
│   │       ├── page.test.tsx
│   │       └── page.tsx
│   ├── rules/
│   │   ├── loading.tsx
│   │   ├── page.test.tsx
│   │   └── page.tsx
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── rules/                      # 财务规则配置
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── loading.tsx
├── not-found.tsx
├── error.tsx
├── page.tsx                    # 主页: Payment & Refund 列表
├── test/page.test.ts
├── page.test.tsx
├── finance.test.ts
└── README.md                   # ← 本文件
```

---

## 主要组件/页面列表 (Pages & Components)

| 路由             | 组件 | 说明 |
|------------------|------|------|
| `/finance`       | `FinancePage` | Payment & Refund 列表主页, 支持多渠道/多状态筛选 |
| `/finance/dashboard` | `DashboardPage` | 营收/支出/对账完成率等关键指标展示 |
| `/finance/budget` | `BudgetPage` | 预算编制、执行跟踪、偏差分析 |
| `/finance/invoices` | `InvoicesPage` | 发票开具、查询、作废 |
| `/finance/reconciliation` | `ReconciliationPage` | 交易对账、差异定位、批量处理 |
| `/finance/reconciliation/discrepancies/[id]` | `DiscrepancyDetailPage` | 单笔差异深度分析 |
| `/finance/reconciliation/rules` | `ReconciliationRulesPage` | 自动化对账规则配置 |
| `/finance/rules` | `FinanceRulesPage` | 凭证规则、费用规则配置 |
| `/finance/payouts` | `PayoutsPage` | 供应商付款、批量打款 |
| `/finance/profit-loss` | `ProfitLossPage` | 收入/成本/费用分维度展示 |
| `/finance/[id]` | `FinanceDetailPage` | 单笔交易 Payment/Refund 完整记录 |

---

## 依赖关系 (Dependencies)

| 依赖模块/包 | 用途 |
|-------------|------|
| `@m5/ui` | Card, StatusBadge, Tabs, DataTable 等 UI 组件库 |
| `@m5/sdk` | API 客户端 & 幂等键注入 (idempotency-key) |
| `@m5/types` | Payment, Refund 等 TypeScript 业务类型 |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文初始化 |
| `apps/admin-web/app/components` | 通用组件 (DetailActionBar 等) |
| `apps/admin-web/app/alerts` | 异常交易告警联动 |

---

## P-38 财务冲刺中的作用 (Role in P-38 Sprint)

```
┌─────────────────────────────────────────────────────────┐
│                    P-38 财务冲刺                           │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Payment    │  │  Refund      │  │  Reconciliation│  │
│  │  支付收银   │  │  退款审批    │  │  自动对账     │   │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          ▼                              │
│              ┌────────────────────┐                     │
│              │  财务安全基线      │                     │
│              │  (幂等+乐观锁)     │                     │
│              └────────────────────┘                     │
│                                                         │
│  关联模块: orders → 订单支付                             │
│            analytics → 财务数据分析                       │
│            alerts → 异常交易告警                         │
└─────────────────────────────────────────────────────────┘
```

财务模块是 P-38 财务冲刺的**核心交付模块**，提供 Payment/Refund 全生命周期管理，保障交易资金的幂等安全与对账准确率。与 `orders` 模块配合实现"下单 → 支付 → 退款 → 对账"的完整 E2E 链路。

---

## 安全基线 (Security Baseline)

- ✅ 幂等键 (idempotency-key) — 防重复提交
- ✅ 乐观锁 (version) — 并发写入保护
- ✅ 状态机校验 — Payment/Refund 合法状态流转
- ✅ 输入校验 — 金额/渠道白名单
- ✅ 边界处理 — loading / error / not-found 三态覆盖

### 三语言模块边界标注

```tsx
// 中文: 财务模块 — Payment 创建入口, 带幂等键保护
// English: Finance module — Payment creation entry with idempotency-key protection
// 日本語: 財務モジュール — Payment 作成エントリ, idempotency-key 保護付き
function createPayment(amount: number, channel: PaymentChannel, idempotencyKey: string) {
  // ...
}
```

```tsx
// 中文: 退款审批 — 双层校验 (管理员权限 + 乐观锁)
// English: Refund approval — dual validation (admin permission + optimistic lock)
// 日本語: 返金承認 — 二重検証 (管理者権限 + 楽観的ロック)
function approveRefund(refundId: string, version: number) {
  // ...
}
```

---

**安全基线 8/8 · 保底续产巡查**
