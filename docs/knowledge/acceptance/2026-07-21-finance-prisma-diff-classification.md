# 2026-07-21 Finance Prisma Diff Classification

## 目标

- 基于 `DB -> schema.prisma` 的真实 diff 结果，给出对象分流
- 明确哪些对象属于历史遗留，不应直接由本轮 Prisma apply 覆盖
- 明确哪些对象属于 finance 主线缺口，必须真实落库

## 差异导出命令

在 `apps/api` 目录执行:

```bash
export DATABASE_URL='postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying'
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/shenjiying-db-to-schema-diff.sql
```

结果:

- 差异文件已成功生成: `/tmp/shenjiying-db-to-schema-diff.sql`
- 文件规模: `1937` 行

## 关键发现

### 1. 当前 diff 不是 finance 局部差异，而是全量结构差异

diff 文件中同时出现了:

- 大量 `CREATE TYPE`
- 大量 `CREATE TABLE`
- 多张历史表 `DROP TABLE`
- 对 `empower_card / empower_card_quote_log` 的结构重写

这说明当前数据库与 `schema.prisma` 的差异是“全局级”的，不适合直接执行整份 diff。

### 2. Prisma 视角下会删除的历史表

diff 中明确出现:

```sql
DROP TABLE "acceptance_pulses";
DROP TABLE "competitor_venues";
DROP TABLE "daily_briefs";
DROP TABLE "evolution_logs";
DROP TABLE "expert_profiles";
DROP TABLE "knowledge_documents";
DROP TABLE "knowledge_search_log";
DROP TABLE "pattern_records";
DROP TABLE "phase_progress";
DROP TABLE "v21_evening_close_log";
```

这些对象当前明显属于历史 SQL / 知识库链路，不应在 finance baseline 阶段被删除。

### 3. `empower_card` 不是“已对齐”，而是“命名风格不一致”

diff 中出现:

- `ALTER TABLE "empower_card" ...`
- `ALTER TABLE "empower_card_quote_log" ...`
- 字段从 snake_case 向 camelCase 的迁移
- 主键/索引/外键重建

这说明:

- 当前库里虽已有 `empower_card*`
- 但它与当前 Prisma schema 仍未完全同构

因此它不能简单归入“已 baseline 完成”。

### 4. finance 主线缺口是明确且独立的

diff 中 finance 相关新增对象非常清晰:

- `invoice_v2`
- `finance_ledger`
- `finance_account`
- `finance_settlement`
- `finance_report`
- `finance_report_export`

以及对应索引:

- `invoice_v2_*`
- `finance_ledger_*`
- `finance_account_*`
- `finance_settlement_*`
- `finance_report_*`
- `finance_report_export_*`

这些对象在当前数据库中不存在，属于必须真实落库的对象。

## 分流结论

### A 类: 历史遗留对象，禁止在本轮 finance baseline 中直接删除

包括但不限于:

- `acceptance_pulses`
- `competitor_venues`
- `daily_briefs`
- `evolution_logs`
- `expert_profiles`
- `knowledge_documents`
- `knowledge_search_log`
- `pattern_records`
- `phase_progress`
- `v21_evening_close_log`

处理原则:

- 保留现状
- 不纳入本轮 finance apply
- 后续如需收口，应单独做“历史库对象治理”专项

### B 类: schema 已映射但结构仍不一致对象，暂不在本轮处理

包括:

- `empower_card`
- `empower_card_quote_log`

处理原则:

- 识别为“Prisma 已知对象，但当前 DB 结构仍与 schema 有差异”
- 本轮不做字段重命名、不做主键重建、不做外键重建
- 后续单独做兼容迁移或数据修复方案

### C 类: finance 主线必须真实 apply 的对象

包括:

- `finance_report`
- `finance_report_export`
- `invoice_v2`
- `finance_ledger`
- `finance_account`
- `finance_settlement`

对应来源:

- [20260721113000_add_finance_report_persistence/migration.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/prisma/migrations/20260721113000_add_finance_report_persistence/migration.sql)
- [20260721235000_add_finance_core_persistence_tables/migration.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/prisma/migrations/20260721235000_add_finance_core_persistence_tables/migration.sql)

处理原则:

- 这 6 张表不能被“批量 resolve”假装已经存在
- 必须通过真实 SQL 或真实 migration apply 落到 DB
- 落库后才能开展 finance DB smoke

## 当前禁止动作

本轮明确禁止:

1. 执行整份 `/tmp/shenjiying-db-to-schema-diff.sql`
2. 直接删除 diff 中列出的历史表
3. 直接批量把当前 12 条 migration 标记为 `applied`
4. 直接对 `empower_card*` 做结构改写

原因:

- 这些动作会把 finance 目标和历史库治理混在一起
- 风险大、影响面广、回滚复杂

## 推荐最小路径

### 第一步

把 finance 目标严格收敛到 2 条 migration:

- `20260721113000_add_finance_report_persistence`
- `20260721235000_add_finance_core_persistence_tables`

### 第二步

为这 2 条 migration 设计独立 apply 策略，避免要求整库 baseline 一步到位。

### 第三步

落库成功后做最小 smoke:

- finance 表存在性检查
- report/export 读写检查
- ledger/account/settlement 基础写读检查
- invoice_v2 基础写读检查

## 结论

当前最合理的推进方式不是:

- “把当前库强行 baseline 成整个 schema”

而是:

- “承认历史库混合态，隔离历史对象”
- “只为 finance 缺口制定最小可执行落库路径”

## 回滚说明

- 本轮仅导出 diff SQL 并完成文档分流
- 未对数据库做任何写操作
- 无需回滚
