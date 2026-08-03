# 2026-07-21 Finance Minimal Apply Runtime Evidence

## 背景

- 目标: 在本地混合库中仅补 finance 主线缺失表
- 使用 SQL 包:
  - [finance-minimal-apply.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/finance-minimal-apply.sql)
  - [finance-minimal-verify.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/finance-minimal-verify.sql)
  - [rollback-finance-minimal.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/rollback/rollback-finance-minimal.sql)

数据库:

- `postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying`

## 执行命令

在 `apps/api` 目录执行:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/finance-minimal-verify.sql

npx prisma db execute \
  --url "$DATABASE_URL" \
  --file ../../infra/sql/local-db/finance-minimal-apply.sql

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/finance-minimal-verify.sql
```

## 运行证据

### 1. apply 前 verify

关键结果:

- `_prisma_migrations` 不存在
- `public_table_count = 12`
- finance 6 张表均不存在
- finance 索引不存在
- `finance_report_export_reportId_fkey` 不存在

### 2. apply 成功

命令输出:

```text
Script executed successfully.
```

结论:

- finance 最小 SQL 包已成功执行

### 3. apply 后 verify

关键结果:

```text
public_table_count = 18
```

finance 目标表:

```text
finance_account
finance_ledger
finance_report
finance_report_export
finance_settlement
invoice_v2
```

索引统计结果:

- 共识别 `27` 个 finance 相关索引/主键索引

关键外键:

```text
finance_report_export_reportId_fkey | finance_report_export
```

结论:

- finance 6 张表已真实落库
- 核心索引已落库
- `finance_report_export -> finance_report` 外键已落库

### 4. 事务级写读 smoke

执行方式:

- 在事务内向 6 张表各插入 1 条最小记录
- 再查询计数
- 最后执行 `ROLLBACK`

事务内计数结果:

```text
report_count            = 1
report_export_count     = 1
invoice_count           = 1
account_count           = 1
ledger_count            = 1
settlement_count        = 1
```

回滚后计数结果:

```text
report_count_after_rollback  = 0
invoice_count_after_rollback = 0
```

结论:

- 6 张 finance 表具备最小写入能力
- 外键链路可用
- 事务回滚正常
- 本轮 smoke 未留下脏数据

## 风险边界

- 本轮未写入 `_prisma_migrations`
- 本轮未解决整库 Prisma baseline
- 本轮未触碰历史知识库表
- 本轮未改写 `empower_card / empower_card_quote_log`

## 本轮净结果

已真实完成:

1. finance 6 张核心表落库
2. finance 核心索引落库
3. report/export 外键落库
4. 事务级最小写读 smoke

未完成:

1. Prisma baseline 正式收口
2. `prisma migrate deploy` 全量通过
3. FinanceService / FinanceReportService 应用层真实 DB E2E

## 回滚说明

- 本轮事务级 smoke 已回滚，无测试脏数据残留
- 若需回滚本次结构性落库，可使用:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/rollback/rollback-finance-minimal.sql
```

- 仅在确认 finance 表仍为空业务表时使用上述回滚
