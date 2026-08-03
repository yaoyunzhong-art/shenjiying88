# 数据库基础设施文档

## 概览

M5 平台使用 PostgreSQL 16 作为主业务数据库，采用分库分阶段迁移策略。数据库管理涵盖 schema 定义、迁移脚本、回滚方案、备份恢复与连接池配置。所有数据库操作通过 Prisma ORM 与原生 SQL 脚本协同完成。

## 核心概念

### 数据库架构

```text
┌─────────────────────────────────────────────────────────────┐
│                    M5 PostgreSQL:5432                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                     m5 Database                       │   │
│  │                                                       │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │  Foundation   │ │  Master Data │ │  Domain      │  │   │
│  │  │  (核心基础)    │ │  (主数据)    │ │  (业务域)    │  │   │
│  │  │               │ │              │ │              │  │   │
│  │  │  • Enums      │ │  • Market    │ │  • Member    │  │   │
│  │  │  • 组织架构    │ │  • Tenant    │ │  • Finance   │  │   │
│  │  │  • 身份认证    │ │  • Brand     │ │  • Regional  │  │   │
│  │  │  • 权限策略    │ │  • Store     │ │  • Ops/Audit│  │   │
│  │  │  • 配置管理    │ │  • User      │ │  • Portal   │  │   │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │   │
│  │         │                 │                 │          │   │
│  │         └─────────────────┴─────────────────┘          │   │
│  │                    Rollback 脚本库                       │   │
│  │         ┌────────────────────────────────────┐          │   │
│  │         │ rollback-phase-{a/b/c/d}.sql       │          │   │
│  │         │ rollback-foundation-wave{0..3}.sql │          │   │
│  │         │ rollback-all.sql                   │          │   │
│  │         └────────────────────────────────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  本地数据库 (local-db)                 │   │
│  │  ┌────────────────┐ ┌────────────────────────────┐   │   │
│  │  │ 基础 schema     │ │ Finance-minimal 测试数据    │   │   │
│  │  └────────────────┘ └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 分阶段迁移策略

采用增量式 Wave 迁移模式，每个阶段都是独立的 Schema 变更，支持按顺序执行和回滚：

| 阶段 | 文件名 | 内容 | 可回滚 |
|------|--------|------|--------|
| **Foundation Wave 0** | `foundation-wave0.sql` | 共享枚举类型、基础类型定义 | ✅ |
| **Foundation Wave 1** | `foundation-wave1.sql` | 核心 Schema：组织架构、身份、权限 | ✅ |
| **Foundation Wave 2-3** | `foundation-wave2-wave3.sql` | 配置管理、事件通知、Schema 扩展 | ✅ |
| **Foundation Verify** | `foundation-verify.sql` | 基础 Schema 验证脚本 | — |
| **Phase A** | `phase-a-master-data.sql` | 市场、租户、品牌、店铺、用户主数据 | ✅ |
| **Phase B** | `phase-b-regional-portal.sql` | 区域门户相关表 | ✅ |
| **Phase C** | `phase-c-member-domain.sql` | 会员业务域 | ✅ |
| **Phase D** | `phase-d-ops-audit.sql` | 运营与审计日志 | ✅ |
| **Remaining Wave 0** | `remaining-wave0.sql` | 剩余基础能力补全 | ✅ |
| **Remaining Verify** | `remaining-verify.sql` | 全量验证 | — |

### 回滚机制

每个迁移阶段对应一个回滚脚本，存放在 `prod-db/rollback/` 目录：

```bash
# 回滚全部
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/rollback/rollback-all.sql

# 回滚指定阶段
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/rollback/rollback-phase-a.sql
```

回滚操作 **不可逆** —— 执行前务必确认当前数据库状态。

### 分库原则

当前采用单库多 Schema 模式（未做物理分库）。未来扩展时可考虑：

1. **按 domain 拆分**：Finance、Member、Ops 各一个物理库
2. **读写分离**：主库写入 + 从库查询
3. **Citus 分布式**：水平分表（按 tenant_id 哈希）

## 配置项

### 数据库连接配置

| 参数 | 开发环境值 | 生产建议 |
|------|-----------|---------|
| `POSTGRES_HOST` | `localhost` | RDS 内网地址 |
| `POSTGRES_PORT` | `5432` | `5432` |
| `POSTGRES_USER` | `m5` | 专用低权限用户 |
| `POSTGRES_PASSWORD` | `m5_dev_password` | AWS Secrets Manager |
| `POSTGRES_DB` | `m5` | `m5_prod` |
| `DATABASE_URL` | `postgresql://m5:m5_dev_password@localhost:5432/m5` | Prisma 连接字符串 |

### 连接池配置（Prisma + PgBouncer）

```ini
# 开发环境
DATABASE_URL="postgresql://m5:m5_dev_password@localhost:5432/m5?connection_limit=10&pool_timeout=10"

# 生产环境（通过 PgBouncer 事务池）
DATABASE_URL="postgresql://m5:m5_prod_password@pgbouncer:6432/m5?pgbouncer=true&connection_limit=20&pool_timeout=30"
```

## 快速开始

### 本地数据库初始化

```bash
# 1. 启动 PostgreSQL
pnpm docker:up

# 2. 按顺序执行迁移脚本
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/foundation-wave0.sql
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/foundation-wave1.sql
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/foundation-wave2-wave3.sql
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/phase-a-master-data.sql

# 3. 验证基础结构
psql -h localhost -U m5 -d m5 -f infra/sql/prod-db/foundation-verify.sql
```

### 使用 Prisma 迁移（推荐）

```bash
# Prisma 自动检测 schema 变更并生成迁移
pnpm prisma migrate dev --name init

# 查看迁移状态
pnpm prisma migrate status

# 重置数据库
pnpm prisma migrate reset
```

### 日常管理命令

```bash
# 连接到数据库
psql -h localhost -U m5 -d m5

# 列出所有表
\dt

# 查看表结构
\d+ "MarketProfile"

# 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

# 查看慢查询
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;
```

### 备份与恢复

```bash
# 备份（pg_dump）
pg_dump -h localhost -U m5 -d m5 -Fc -f m5_backup_$(date +%Y%m%d).dump

# 恢复（pg_restore）
pg_restore -h localhost -U m5 -d m5 -c m5_backup_20260724.dump

# 备份特定 Schema
pg_dump -h localhost -U m5 -d m5 -n public -Fc -f m5_public_backup.dump
```

## FAQ

### Q1: 迁移脚本执行顺序是什么？

严格按阶段编号执行：`foundation-wave0` → `foundation-wave1` → `foundation-wave2-wave3` → `foundation-verify` → `phase-a` → `phase-b` → `phase-c` → `phase-d` → `remaining-wave0` → `remaining-verify`。Foundation Wave 先建枚举类型和基础 Schema，后续阶段依赖这些基础结构。

### Q2: 如何准备回滚方案？

每个迁移阶段都有对应的 `rollback-{phase}.sql` 脚本。回滚时先执行 `rollback-all.sql` 清理全量，或按逆序执行指定阶段回滚。**强烈建议在回滚前做一次完整数据库备份**。

### Q3: 连接池如何配置？

开发环境直接在 `DATABASE_URL` 中设置 `connection_limit` 和 `pool_timeout`。生产环境推荐使用 PgBouncer 的事务池模式作为 Prisma 与 PostgreSQL 之间的中间层，建议池大小 20-50，超时时间 30s。

### Q4: 本地开发数据库和测试数据库如何隔离？

使用不同的 database name 即可：
- 开发：`m5_dev`
- 测试：`m5_test`
- 本地最小数据：`infra/sql/local-db/` 提供独立测试数据集

### Q5: 如何验证数据库迁移正确？

每个迁移阶段都包含验证脚本（如 `foundation-verify.sql`、`remaining-verify.sql`），执行后检查输出是否有错误或缺失表。也可通过 Prisma 的 `prisma migrate status` 确认 migration 状态一致性。
