# 2026-07-21 Finance Prisma Runtime Evidence

## 背景

- 目标主线: `finance` 持久化主链
- 目标任务:
  - 验证 `Prisma Client` 是否可生成
  - 验证 `prisma migrate status` 是否可连通本地数据库
  - 验证 `prisma migrate deploy` 当前是否可直接落表

## 执行命令

在 `apps/api` 目录执行:

```bash
npm run prisma:generate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

## 运行证据

### 1. Prisma Client 生成成功

```text
> @m5/api@0.1.0 prisma:generate
> prisma generate --schema prisma/schema.prisma

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.3) to ./../../node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client in 310ms
```

结论:

- `schema.prisma` 可被 Prisma 正常解析
- `@prisma/client` 已成功生成
- `FinanceService / FinanceReportService / PrismaService` 当前依赖的 Prisma Client 主链具备运行基础

### 2. migrate status 成功连通数据库

```text
> @m5/api@0.1.0 prisma:migrate:status
> prisma migrate status --schema prisma/schema.prisma

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "shenjiying", schema "public" at "127.0.0.1:5432"

12 migrations found in prisma/migrations
Following migrations have not yet been applied:
20260612173000_baseline_foundation
20260612193000_add_governance_approval
20260612203000_expand_governance_approval_lifecycle
20260612220000_add_foundation_alert_acknowledgement
20260614123000_add_lyt_member_snapshot
20260614142000_add_lyt_order_payment_snapshots
20260614154000_extend_lyt_order_snapshot_for_loyalty
20260615121000_persist_member_operations
20260717131500_add_config_instance_tables
20260718112000_add_custom_domain_tables
20260721113000_add_finance_report_persistence
20260721235000_add_finance_core_persistence_tables
```

结论:

- 本地 PostgreSQL 可连接
- Prisma migration 目录已被正确识别
- 新增的 `20260721235000_add_finance_core_persistence_tables` 已进入待应用队列

### 3. migrate deploy 被基线问题阻塞

```text
> @m5/api@0.1.0 prisma:migrate:deploy
> prisma migrate deploy --schema prisma/schema.prisma

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "shenjiying", schema "public" at "127.0.0.1:5432"

12 migrations found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

结论:

- 当前数据库不是空库
- 当前库尚未完成 Prisma baseline 建档
- `prisma migrate deploy` 尚未真正应用任何 migration
- 阻塞点不是 finance migration SQL 本身，而是整库的 Prisma baseline 缺失

## 影响判断

- 正向:
  - `Prisma Client` 已可生成
  - 本地 DB 联通已验证
  - finance 核心 migration 已被 Prisma 识别
- 阻塞:
  - 无法直接用 `prisma migrate deploy` 落当前 12 条 migration
  - finance 真 DB 回归要先解决 baseline

## 风险边界

- 本次未成功执行任何 migration
- 因 `P3005` 提前失败，当前数据库结构未被本轮命令修改
- 本次运行证据不能等价替代真实 migration apply 成功证据

## 下一步

1. 先为当前非空数据库制定 Prisma baseline 方案
2. 明确 `_prisma_migrations` 初始化策略，避免把历史对象重复建表
3. baseline 完成后重新执行:

```bash
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

4. migration 应用完成后，再补 finance 真实 DB 回归:
   - ledger
   - account
   - settlement
   - invoice_v2
   - finance_report / finance_report_export

## 回滚说明

- `npm run prisma:generate` 只生成客户端，无数据库副作用
- `npm run prisma:migrate:status` 只读，无数据库副作用
- `npm run prisma:migrate:deploy` 因 `P3005` 失败提前退出，无需回滚
