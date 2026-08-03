# RLS 模块 · 行级安全 / Row-Level Security

## 概述 / Overview

PostgreSQL Row-Level Security 策略管理与多租户隔离模块。提供 RLS 状态查询、Policy CRUD、一键隔离设置、per-tenant 连接池、租户审计日志、Prisma 中间件自动注入（双保险：数据库 policy + 应用层拦截）。

**Tech Stack:** NestJS · Prisma v6 + `$extends` · PostgreSQL pg_policy · AsyncLocalStorage

## 核心实体 / Core Entities

| Entity | 描述 |
|---|---|
| `RlsStatusEntry` | RLS 启用状态 `{ schemaname, tablename, rowsecurity, forcersequrity }` |
| `PolicyInfo` | Policy 详情 `{ policyname, roles, permissive, cmd, qual, with_check }` |
| `RlsTableInfo` | 表级 RLS 汇总 `{ rlsEnabled, forceRls, policies[] }` |
| `TenantPoolEntry` | 租户连接池 `{ tenantId, createdAt, lastUsedAt, queryCount }` |
| `AuditLogEntry` | 审计日志 `{ tenantId, action, tableName, policyName, details }` |

## API 端点 / Endpoints

Prefix: `/api/rls` (protected by `TenantGuard`)

### RLS 状态与启用
| Method | Path | 说明 |
|--------|------|------|
| GET | `/status` | 查询 RLS 启用状态（全部/指定表） |
| POST | `/enable` | 对指定表启用 RLS |
| POST | `/setup` | 一键设置: 启用 RLS + 创建策略 + Force |

### Policy CRUD
| Method | Path | 说明 |
|--------|------|------|
| POST | `/policy` | 创建 tenantId 过滤策略 |
| GET | `/policy` | 查询指定策略详情 |
| GET | `/policies` | 列出指定表所有策略 |
| PUT | `/policy` | 更新指定策略 |
| DELETE | `/policy` | 删除指定策略 |

### 隔离验证
| Method | Path | 说明 |
|--------|------|------|
| POST | `/verify` | 验证 tenantId 过滤（leakedRows） |
| GET | `/verify/isolation` | 验证所有 tenant-aware 表的 tenantId 列完整性 |

### 连接池与审计
| Method | Path | 说明 |
|--------|------|------|
| POST | `/pool/init` | 初始化租户连接池 |
| POST | `/verify/access` | 验证用户-租户访问权限 |
| GET | `/audit` | 租户审计日志 |
| POST | `/tenant/context` | 设置租户上下文（演示端点） |
| GET | `/tenant/pools` | 查看所有活跃连接池 |
| DELETE | `/tenant/pool` | 释放租户连接池 |

## 使用示例 / Usage

```typescript
// 启用 RLS + 创建策略 + 强制（一键）
POST /api/rls/setup
{ "tableName": "orders", "tenantColumn": "tenantId", "policyName": "tenant_isolation" }

// 验证隔离
POST /api/rls/verify
{ "tableName": "orders", "tenantId": "t-store-a" }

// Prisma 中间件（在 PrismaService 中挂载）
import { createRlsExtension } from './rls/rls.middleware-prisma'
const extClient = prisma.$extends(createRlsExtension())

// Service 层上下文透传
await rlsService.setTenantContext('t-store-a')
const rows = await prisma.order.findMany() // 自动 RLS 过滤
```

## 依赖关系 / Dependencies

- **NestJS** — Controller/Service/Guard 框架
- **PrismaModule** / **PrismaService** — 数据库访问
- **PostgreSQL** — pg_policy / pg_class / information_schema
- **`agent/tenant.guard`** — 多租户保护
- **`common/context/tenant-context`** — AsyncLocalStorage 租户上下文

## 配置项 / Configuration

| 项 | 默认 | 说明 |
|----|------|------|
| `RLS_DEFAULT_TENANT_COLUMN` | `tenant_id` | 默认 tenantId 列名 |
| `RLS_POLICY_PREFIX` | `tenant_isolation_policy` | 策略名前缀 |
| `MAX_ALERTS` (内部) | 100 | 内存告警事件上限 |

### Prisma 中间件白名单
在 `rls.middleware-prisma.ts` 的 `TENANT_AWARE_MODELS` 中配置。当前覆盖 50+ 业务模型（Store, Member, Order, Payment, Ledger 等），包含核心模型（required）和扩展模型（optional）。

SQL 安全所有 SQL 标识符/字面量均经过 `sanitizeTableName` / `sanitizeColumnName` / `sanitizeLiteral` 转义。

## 错误码 / Error Codes

| 场景 | HTTP | 原因 |
|------|------|------|
| 参数校验失败 | 400 | DTO 校验 / 表名/列名非法 |
| 租户隔离拒绝 | 403 | TenantGuard 拒绝 |
| 服务内部错误 | 500 | Prisma raw SQL 执行异常 |
| Policy 不存在 | 404 | getPolicy 未找到策略 |
