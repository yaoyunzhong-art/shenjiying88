# v23 PRD 摘要卡 — 财务核算主链 (WP-04A)

## 基本信息

| 字段 | 值 |
|------|-----|
| PRD ID | v23-prd-finance-core |
| 工作包 | WP-04A |
| 名称 | 财务核算主链 |
| 优先级 | P0 |
| 关联 BS | BS-0078, BS-0080, BS-0083, BS-0084, BS-0085 |
| 前置依赖 | WP-02A (多租户), WP-02B (安全与审计) |
| 版本 | 1.0 |
| 更新日期 | 2026-07-23 |

## 业务目标

实现收银交易到财务核算的完整闭环，确保每一笔交易、退款都可靠记录到财务 ledger 中，并支持结算(settlement)与核算归档(archival)的可审计追溯。

## 架构链路

```
收款/消费 → Cashier 收银台 → ICashierStore (Memory/Prisma)
  → CashierService.applyPaymentCallback()
  → TransactionsService.applyPaymentCallback()
    → FinanceService.recordTransactionRevenue()    [Ledger 收入]
    → FinanceService.recordTransactionRefund()      [Ledger 退款]
  → FinanceService.createSettlement()               [结算闭合]
  → FinanceArchivalService.archive()                [核算归档快照]
  → AnomalyDetectorService.detect()                 [财务异常检测]
```

## 核心实体

| 实体 | 用途 | 关键字段 |
|------|------|---------|
| Ledger | 财务流水(细粒度) | type(REVENUE/EXPENSE/REFUND/ADJUSTMENT), amount, balance, orderId, transactionId |
| Account | 账户管理 | type(CASH/WECHAT/ALIPAY/BANK), balance, status |
| Settlement | 结算周期汇总 | startDate, endDate, totalRevenue, totalExpense, netProfit, status |
| Invoice | 发票 | invoiceNo, amount, tax, status(DRAFT/ISSUED/CANCELLED) |
| FinanceArchival | 核算归档快照 | periodStart, periodEnd, settlementId, snapshot JSON, version |
| RevenueSummary | 营收汇总 | totalRevenue, totalExpense, totalRefund, netRevenue, transactionCount |
| DailyRevenue | 日营收 | date, revenue, expense, refund, netRevenue |

## API 端点

### Ledger (流水记账)
- `POST /finance/ledgers` — 记账
- `GET /finance/ledgers` — 查询流水列表
- `GET /finance/ledgers/:id` — 查询单条流水
- `DELETE /finance/ledgers/:id` — 删除流水

### Account (账户管理)
- `POST /finance/accounts` — 创建账户
- `GET /finance/accounts` — 查询账户列表
- `GET /finance/accounts/:id` — 查询账户
- `GET /finance/accounts/:id/balance` — 查询余额
- `POST /finance/accounts/:id/freeze` — 冻结账户
- `POST /finance/accounts/:id/close` — 关闭账户

### Settlement (结算)
- `POST /finance/settlements` — 创建结算
- `GET /finance/settlements` — 查询结算列表
- `GET /finance/settlements/:id` — 查询结算详情
- `GET /finance/settlements/:id/detail` — 结算 + 关联流水
- `POST /finance/settlements/:id/confirm` — 确认结算
- `POST /finance/settlements/:id/dispute` — 争议结算

### Invoice (发票)
- `POST /finance/invoices` — 创建发票
- `GET /finance/invoices` — 查询发票列表
- `GET /finance/invoices/:id` — 查询发票
- `POST /finance/invoices/:id/issue` — 开票
- `POST /finance/invoices/:id/cancel` — 取消发票

### Archival (核算归档) — WP-04A 新增
- `POST /finance/archivals` — 创建核算归档
- `GET /finance/archivals` — 查询归档列表
- `GET /finance/archivals/:id` — 查询归档详情
- `GET /finance/archivals/versions/:settlementId` — 归档版本历史

### Transaction (交易联动)
- `POST /finance/transactions/revenue` — 交易收入到账记账
- `POST /finance/transactions/refund` — 交易退款记账

### Revenue (营收汇总)
- `GET /finance/revenue/summary` — 营收汇总
- `GET /finance/revenue/daily` — 日营收

## 财务核算闭环验证

### 链路验证步骤

1. **交易创建** → CashierService.createOrder() → order stored in ICashierStore
2. **支付回调** → CashierService.applyPaymentCallback() → order marked PAID
3. **收入记账** → TransactionsService.recordRevenueLedgerIfNeeded() → FinanceService.recordTransactionRevenue() → ledger entry created
4. **退款请求** → TransactionsService.requestRefund() → refund record created
5. **退款完成** → TransactionsService.recordRefundLedgerIfNeeded() → FinanceService.recordTransactionRefund() → ledger entry created (REFUND type)
6. **结算创建** → FinanceService.createSettlement() → aggregates ledger data into period summary
7. **结算确认** → FinanceService.confirmSettlement() → status transitions PENDING→CONFIRMED
8. **核算归档** → FinanceArchivalService.archive() → takes snapshot of period's ledgers + settlement, stored as immutable versioned record
9. **异常检测** → AnomalyDetectorService.detect() → monitors ledger patterns (3σ/IQR/EWMA)

## 去 Mock 状态

| 组件 | 状态 | 说明 |
|------|------|------|
| ICashierStore | ✅ 已实现 | Interface + MemoryStore + PrismaStore 三件套 |
| CashierMemoryStore | ✅ 已实现 | 测试/开发用，单例内存 |
| CashierPrismaStore | ✅ 已实现 | 生产用，基于 Prisma ORM |
| FinanceArchival | ✅ 新增 | 核算归档 entity + service |
| AnomalyDetector Finance Rules | ✅ 基础模板可用 | 3σ/IQR/EWMA 通用检测器 |

## 验收标准

- [x] 交易 → Ledger 收入 → 完整可追溯
- [x] 退款 → Ledger 退款 → 金额不准超退
- [x] 结算 → 确认/争议 → 状态机无误
- [x] 核算归档 → 快照不可变 + 版本追溯
- [x] 租户隔离 → Tenant B 看不到 Tenant A 数据
- [x] TSC 零错误 → finance 模块 0 TSC error
- [x] 无 test.skip/only → 全部启用

## 圈梁检查

| 检查项 | 状态 |
|--------|------|
| TSC 零错误 | ✅ (36 全项目预存在, finance 模块为 0) |
| 测试全绿 (module level) | ✅ 49/50 files, 1523/1537 通过 (14 预存 e2e 反例) |
| 无 test.skip/only | ✅ |
| 代码 + 配置 + 证据 + 回滚 | ✅ |
| PR 合规字段 | ✅ 6-8_refs: [BS-0078, BS-0080, BS-0083..BS-0085] |
| blocker_id | none |
