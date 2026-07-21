# 2026-07-21 Finance Report Prisma HTTP E2E

## 目标

- 为 `finance/reports` 主链补第一组真实 DB HTTP E2E
- 验证 `FinanceReportController -> FinanceReportService(resolved) -> Prisma -> PostgreSQL`

## 测试文件

- [finance-report.prisma-http.e2e.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance-report.prisma-http.e2e.test.ts)

## 覆盖链路

1. `POST /finance/reports`
2. `GET /finance/reports`
3. `GET /finance/reports/:reportId`
4. `POST /finance/reports/:reportId/export`
5. `GET /finance/reports/exports/:exportId`
6. `DELETE /finance/reports/:reportId`
7. 跨租户隔离:
   - Tenant A 创建
   - Tenant B 列表不可见
   - Tenant B 详情读取返回 `404`

## 执行命令

在 `apps/api` 目录执行:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'
npx vitest run src/modules/finance/finance-report.prisma-http.e2e.test.ts
```

## 结果

命令退出码:

- `0`

Vitest 摘要:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
Duration    1.83s
```

## 关键结论

- `finance_report` 与 `finance_report_export` 已不仅是“表存在”
- 真实 HTTP 请求已能走通:
  - 创建报表
  - 查询报表
  - 导出报表
  - 查询导出结果
  - 删除报表并级联清理导出
- 跨租户读取隔离生效:
  - Tenant B 无法在列表中看到 Tenant A 报表
  - Tenant B 读取 Tenant A 报表详情返回 `404`

## 清理策略

- 测试结束后显式删除测试租户下的 `finance_report_export`
- 再删除测试租户下的 `finance_report`
- 隔离测试中的单条报表在用例尾部显式删除

## 当前边界

本轮已覆盖:

- `finance/reports` 真 DB HTTP 主链

本轮未覆盖:

- `ledger/account/settlement/invoice` 的真 DB HTTP E2E
- `_prisma_migrations` baseline 收口
- 整库 `prisma migrate deploy` 全量通过
