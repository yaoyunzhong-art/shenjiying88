# 2026-07-21 Finance Core Prisma HTTP E2E

## 目标

- 为 `ledger/account/settlement/invoice/revenue` 主链补真实 DB HTTP E2E
- 验证 `FinanceController -> FinanceService(resolved/write-through) -> Prisma -> PostgreSQL`

## 测试文件

- [finance-core.prisma-http.e2e.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance-core.prisma-http.e2e.test.ts)

## 覆盖链路

### Ledger / Account / Settlement / Revenue

1. `POST /finance/ledgers`
2. `GET /finance/ledgers?type=REVENUE`
3. `POST /finance/accounts`
4. `POST /finance/accounts/:accountId/freeze`
5. `POST /finance/accounts/:accountId/close`
6. `POST /finance/settlements`
7. `GET /finance/settlements/:settlementId/detail`
8. `POST /finance/settlements/:settlementId/confirm`
9. `GET /finance/revenue/summary`
10. `GET /finance/revenue/daily`

### Invoice

1. `POST /finance/invoices`
2. `GET /finance/invoices/:invoiceId`
3. `POST /finance/invoices/:invoiceId/issue`
4. `POST /finance/invoices/:invoiceId/cancel`
5. `GET /finance/invoices?status=CANCELLED`
6. 跨租户隔离:
   - Tenant B 列表不可见
   - Tenant B 详情读取返回 `404`

## 执行命令

在 `apps/api` 目录执行:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'
npx vitest run src/modules/finance/finance-core.prisma-http.e2e.test.ts
```

## 结果

命令退出码:

- `0`

Vitest 摘要:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
Duration    830ms
```

## 关键结论

- `finance_ledger` 真 DB 写链可用:
  - 收入 / 支出 / 退款三类流水均可创建
  - 余额计算正确
  - 列表过滤可用

- `finance_account` 真 DB 状态流转可用:
  - 创建后为 `ACTIVE`
  - 可冻结为 `FROZEN`
  - 可关闭为 `CLOSED`

- `finance_settlement` 真 DB 聚合链可用:
  - 能根据指定区间 ledger 自动聚合
  - `totalRevenue / totalExpense / netProfit` 计算正确
  - 结算详情能回读关联 ledger
  - 确认后状态变为 `CONFIRMED`

- `revenue summary / daily` 真 DB 查询可用:
  - 汇总口径与 ledger 落库数据一致
  - 日营收查询可回读指定日期数据

- `invoice_v2` 真 DB 状态流转可用:
  - 创建后为 `DRAFT`
  - 可签发为 `ISSUED`
  - 可作废为 `CANCELLED`
  - 状态过滤查询可用

- 租户隔离有效:
  - Tenant B 看不到 Tenant A 的发票
  - Tenant B 读取 Tenant A 发票详情返回 `404`

## 清理策略

测试结束后按依赖顺序清理:

1. `invoice_v2`
2. `finance_settlement`
3. `finance_account`
4. `finance_ledger`

清理范围仅限测试租户:

- `tenant-finance-core-a`
- `tenant-finance-core-b`

## 当前边界

本轮已覆盖:

- `finance/reports` 真 DB HTTP E2E
- `ledger/account/settlement/invoice/revenue` 真 DB HTTP E2E

本轮未覆盖:

- `_prisma_migrations` baseline 收口
- `prisma migrate deploy` 全量通过
- H5 payment 浏览器 smoke
