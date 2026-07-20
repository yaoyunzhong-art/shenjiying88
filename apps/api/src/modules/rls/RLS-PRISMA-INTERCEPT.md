# Prisma RLS 拦截机制 — 数据库层自动注入

> G5+G8 审计 · 双重防护 · 2026-07-21

## 架构概览

```
HTTP Request
    │
    ▼
NestJS Interceptor (TenantGuard) ─── 应用层 tenantId 校验
    │
    ▼
Prisma Client → $extends createRlsExtension() ─── 数据库层 tenantId 自动注入
    │                                          │
    ▼                                          ▼
Prisma Engine                           Prisma 中间件
    │                                    (rls.middleware-prisma.ts)
    ▼
PostgreSQL ─── RLS Policy ─── PostgreSQL 行级安全强制隔离
```

三层防护：
1. **TenantGuard 中间件** — 应用层校验与上下文注入 (NestJS)
2. **Prisma 中间件** — 在 Prisma query 执行前自动注入 `tenantId` WHERE 条件
3. **PostgreSQL RLS Policy** — 数据库级强制行级隔离

## Prisma 中间件工作原理

文件: `apps/api/src/modules/rls/rls.middleware-prisma.ts`

### 注册

`PrismaService.onModuleInit()` 通过 `this.$extends(createRlsExtension())` 注册。

### 拦截流程

1. 从 `AsyncLocalStorage`（`tenant-context.ts`）获取当前请求的 `tenantId`
2. 检查模型是否在 `TENANT_AWARE_MODELS` 白名单中
3. **创建操作** (`create`/`createMany`/`upsert`): 自动填充 `data.tenantId`
4. **查询/更新/删除操作** (`findMany`/`findFirst`/`update`/`delete` 等): 自动附加 `WHERE tenantId = ?`
5. 用户已显式指定 `tenantId` 条件时不覆盖（允许跨租户查询等合法场景）
6. 无租户上下文时降级为不注入（兼容 CLI 脚本/测试/初始化）

### 白名单管理

`TENANT_AWARE_MODELS` 集合维护所有需要自动注入的模型。从 `schema.prisma` 中识别具有 `tenantId` 字段的业务模型。

### 双保险设计

| 防护层 | 拦截点 | 职责 | 绕过条件 |
|--------|--------|------|----------|
| PostgreSQL RLS | 数据库引擎 | 强制行级隔离 | `SET app.tenant_id` 需正确设置 |
| Prisma 中间件 | 应用层 ORM | query 参数注入 | 显式指定 tenantId 时可覆盖 |
| TenantGuard | HTTP 层 | 上下文校验 | 需正确认证 |

> 避免在 Service/Controller 中单独拼接 `tenantId` 过滤条件 — Prisma 中间件会自动处理。
