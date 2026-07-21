# 2026-07-21 Finance Minimal Apply Plan

## 目标

- 在不触碰历史知识库表和 `empower_card*` 结构的前提下
- 只为本地混合数据库补齐 finance 主线缺失的 6 张表

目标对象:

- `finance_report`
- `finance_report_export`
- `invoice_v2`
- `finance_ledger`
- `finance_account`
- `finance_settlement`

## 产物

- Apply SQL:
  - [finance-minimal-apply.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/finance-minimal-apply.sql)
- Verify SQL:
  - [finance-minimal-verify.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/finance-minimal-verify.sql)
- Rollback SQL:
  - [rollback-finance-minimal.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/local-db/rollback/rollback-finance-minimal.sql)

## 适用前提

仅适用于当前本地混合库场景:

1. 数据库非空
2. `_prisma_migrations` 尚不存在
3. 历史知识库表已存在
4. finance 6 张表尚未落库

不适用于:

- 生产库
- 已存在 finance 业务数据的环境
- 需要一次性对齐整个 `schema.prisma` 的场景

## 执行原则

- 不执行整份 `DB -> schema` diff
- 不删除历史 SQL 表
- 不改写 `empower_card / empower_card_quote_log`
- 只补 finance 主线缺口
- 先 verify，再 apply，再 verify

## 建议命令

在 `apps/api` 目录执行:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/finance-minimal-verify.sql

npx prisma db execute \
  --url "$DATABASE_URL" \
  --file ../../infra/sql/local-db/finance-minimal-apply.sql

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/finance-minimal-verify.sql
```

## 成功判定

执行完成后，至少应满足:

1. `information_schema.tables` 中可见 6 张 finance 表
2. `pg_indexes` 中可见 finance 索引
3. `finance_report_export_reportId_fkey` 存在

## 停止条件

出现以下任一情况立即停止，不继续下一步:

1. verify 已发现 finance 表部分存在且结构不一致
2. apply 过程中出现主键/索引/外键重名冲突
3. apply 后 verify 显示表存在但关键索引或外键缺失

## 回滚命令

仅在确认 finance 表为空表时使用:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ../../infra/sql/local-db/rollback/rollback-finance-minimal.sql
```

## 风险边界

- 本方案不会解决整个 Prisma baseline 问题
- 本方案不会写入 `_prisma_migrations`
- 本方案不会让整库进入“Prisma migrate fully managed”状态
- 本方案只解决 finance 主线缺表问题，为后续 DB smoke 和功能验收创造前提

## 下一步

本方案执行成功后:

1. 补 finance DB smoke SQL / 用例
2. 验证 `FinanceReportService` 和 `FinanceService` 的真实 DB 读写链
3. 再决定是否补 `_prisma_migrations` 基线收口方案
