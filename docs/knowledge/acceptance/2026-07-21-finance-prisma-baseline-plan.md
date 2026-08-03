# 2026-07-21 Finance Prisma Baseline Plan

## 背景

- 目标主线: `finance` 持久化主链
- 当前数据库: `postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying`
- 当前 Prisma 迁移目录: `apps/api/prisma/migrations`

## 已验证事实

### 1. Prisma runtime 已打通

- `npm run prisma:generate` 成功
- `npm run prisma:migrate:status` 成功
- `npm run prisma:migrate:deploy` 报 `P3005`

详见:

- [2026-07-21-finance-prisma-runtime-evidence.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-21-finance-prisma-runtime-evidence.md)

### 2. 当前库不是空库，但尚无 Prisma baseline

只读 SQL 实测结果:

```sql
select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = '_prisma_migrations'
) as has_prisma_migrations;
```

结果:

```text
has_prisma_migrations = false
```

```sql
select count(*) as public_table_count
from information_schema.tables
where table_schema = 'public';
```

结果:

```text
public_table_count = 12
```

### 3. 现存表与当前 Prisma 主线并不一致

当前库 `public` 下已有 12 张表:

```text
acceptance_pulses
competitor_venues
daily_briefs
empower_card
empower_card_quote_log
evolution_logs
expert_profiles
knowledge_documents
knowledge_search_log
pattern_records
phase_progress
v21_evening_close_log
```

其中:

- `empower_card`
- `empower_card_quote_log`

已在当前 `schema.prisma` 中存在映射。

其余大部分表来自历史 SQL 迁移而非当前 Prisma migration 主线，例如:

- `apps/api/src/database/migrations/20260711_create_knowledge_tables.sql`
- `apps/api/src/database/migrations/20260712_create_scout_national_tables.sql`
- `apps/api/src/database/migrations/20260712_create_national_venue_competitor_tables.sql`

### 4. finance 核心表当前尚未落到数据库

只读查询结果:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'invoice_v2',
    'finance_ledger',
    'finance_account',
    'finance_settlement',
    'finance_report',
    'finance_report_export'
  )
order by table_name;
```

结果:

```text
(0 rows)
```

结论:

- 当前 finance Prisma 主链的 6 张核心表还没真正落库

## 风险判断

当前库属于混合态:

1. 非空库
2. 无 `_prisma_migrations`
3. 含历史 SQL 建出的业务表
4. 含当前 `schema.prisma` 中的部分表
5. 但不含 finance 关键表

因此不能直接做以下危险动作:

- 直接执行 `prisma migrate deploy`
- 直接把全部 12 条 migration 批量 `resolve --applied`

原因:

- 当前库的既有对象并不等于当前 12 条 migration 已全部真实执行过
- 如果错误地把所有 migration 标记为已应用，`finance_ledger / finance_account / finance_settlement / invoice_v2 / finance_report / finance_report_export` 仍然不会自动出现
- 后续 Prisma 会认为结构已齐，但实际 DB 仍缺关键表，形成更隐蔽的假成功

## 推荐方案

### 方案原则

- 先承认当前库是“历史库”
- 不把“非空”误当成“已完成当前 Prisma 基线”
- 把 baseline 和 finance 落表拆成两个阶段

### 阶段 A: 形成本地 baseline 判定材料

目标:

- 明确哪些现存表属于历史表
- 明确哪些 Prisma 模型已经存在于 DB
- 明确哪些 Prisma 模型尚未落库

本轮已完成:

- 现存库表清点
- `_prisma_migrations` 缺失确认
- finance 核心表缺失确认

### 阶段 B: 设计可执行 baseline 策略

推荐口径:

1. 不直接把所有现有 migration 标记为已应用
2. 先生成 `DB -> schema.prisma` 差异 SQL，确认 Prisma 视角下还缺哪些对象
3. 对当前库中已存在且与 schema 一致的对象，采用审慎 baseline
4. 对 finance 核心缺失对象，保留真实 migration apply 能力

### 阶段 C: finance 落表优先

因为本轮目标是 `finance` 主线，所以更务实的做法是:

1. 先完成 baseline 方案确认
2. 再确保至少以下 migration 能真实落库:
   - `20260721113000_add_finance_report_persistence`
   - `20260721235000_add_finance_core_persistence_tables`
3. 落库后立刻做 finance DB smoke:
   - `finance_report`
   - `finance_report_export`
   - `invoice_v2`
   - `finance_ledger`
   - `finance_account`
   - `finance_settlement`

## 本轮不执行的动作

为了避免误伤，本轮明确未执行:

- 未创建 `_prisma_migrations`
- 未执行 `prisma migrate resolve --applied`
- 未手工写入 migration 元数据
- 未对现有 12 张历史表做删除/改名
- 未对数据库做任何结构写入

## 下一步执行建议

下一枪建议按以下顺序推进:

1. 用 Prisma 官方 diff 能力导出 `当前 DB -> schema.prisma` 差异 SQL
2. 基于 diff 结果，把对象分成三类:
   - 历史库已存在且与 schema 一致
   - 历史库已存在但不在 schema 主线
   - schema 需要但 DB 缺失
3. 单独为 finance 主线制定最小 baseline 策略
4. 再尝试安全落 `finance_report` 与 `finance_core` 两条 migration

## 回滚说明

- 本轮仅执行只读 SQL 和文档归档
- 没有数据库结构变更
- 无需回滚
