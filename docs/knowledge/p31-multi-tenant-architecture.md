# P-31 多租户架构设计

> 版本: v1.0 · 最后更新: 2026-07-14 03:32 · 签发人: 🦞 龙虾哥
> 对接PRD: prd-tenant-p31.md · 技术审核: E44 周技术

## 1. 设计目标

- 每个门店/品牌数据隔离，互不可见
- 平台管理员可跨租户查询
- 现有系统零代码入侵
- 运行时性能开销 < 5%

## 2. 架构全景

```
请求 → TenantMiddleware → IdentityAccessGuard → Controller/Service → DB
         (注入上下文)        (隔离校验)
```

**四层保护**:
1. **Middleware层**: 从请求头提取 x-tenant-id/brand/store → 注入 `request.tenantContext`
2. **Guard层**: TenantGuard 校验 header 必须存在，IdentityAccessGuard 校验权限
3. **Util层**: `canAccessTenant/assertSameTenant/assertIsolation` 三级校验（tenant→brand→store）
4. **数据层**: 当前手动过滤，后续通过 Prisma interceptor 自动 WHERE tenantId=

## 3. 系统组件

### 3.1 TenantMiddleware
- 文件: `apps/api/src/modules/tenant/tenant.middleware.ts`
- 职责: 从请求头读取并组装 tenant/governance/actor 三层上下文
- 头列表: `x-tenant-id`, `x-brand-id`, `x-store-id`, `x-market-code`, `x-actor`, `x-request-id`
- 缺省值: `tenant-demo` (tenant), `us-default` (market), `randomUUID()` (requestId)

### 3.2 TenantGuard
- 文件: `apps/api/src/modules/agent/tenant.guard.ts`
- 职责: 强制 `x-tenant-id` header 存在，缺失抛 401
- 应用方式: `@UseGuards(TenantGuard)` 在 Controller 上

### 3.3 TenantIsolationUtil (核心隔离引擎)
- 文件: `apps/api/src/modules/tenant/tenant-isolation.util.ts`
- 函数矩阵:

| 函数 | 层级 | 作用 |
|------|------|------|
| `canAccessTenant` | Tenant级 | 校验 actor 能否访问目标 tenant 资源 |
| `assertSameTenant` | Tenant级 | 校验同租户，否则抛 TenantIsolationViolation |
| `canAccessBrand` | Brand级 | 校验 actor 在 brand 范围内 |
| `canAccessStore` | Store级 | 校验 actor 在 store 范围内 |
| `assertIsolation` | 三层合一 | 一次校验 tenant+brand+store | 
| `filterByTenantIsolation` | 批量过滤 | 列表查询后过滤不属于 actor tenant 的资源 |

### 3.4 TenantLifecycleService
- 职责: 租户生命周期（创建→激活/暂停→逻辑删除）
- 状态: `ACTIVE` → `SUSPENDED` / `SOFT_DELETED`
- 方法: `initialize`, `suspend`, `reactivate`, `softDelete`, `getStatus`

### 3.5 TenantQuotaService
- 职责: 租户配额管理（积分池、门店数、用户数等）
- 方法: `initQuota`, `setTier`, `overrideLimit`, `checkConstraint`, `reserve`

### 3.6 TenantService
- 职责: 租户基础 CRUD
- 端点: 解析(Get)、Quota(CRUD+设置+检查)、Lifecycle(初始化+挂起+恢复+删除+查询)

## 4. RBAC 权限体系

```
User → ActorType (platform-user / tenant-user / brand-user / store-user / employee-user / service-account)
     → Roles (role name)
     → Permissions (resource:action 格式)
```

**超级管理员**: 拥有 `platform:admin` permission → 绕过全部三层隔离

## 5. 数据流示例

```
请求: POST /api/orders
Headers: x-tenant-id: tens-arcade-01, x-store-id: store-01

TenantMiddleware:
  → tenantContext = { tenantId: "tens-arcade-01", storeId: "store-01" }
  → actorContext = { ... } (从 x-actor 或 x-actor-id header)

TenantGuard:
  → x-tenant-id 存在 √ → 写入 request.tenantId

Service/Controller:
  → assertSameTenant(actorTenantId, resource.tenantId, 'order')
  → 通过 → 正常 CRUD
  → 失败 → TenantIsolationViolation → 403
```

## 6. 跨租户查询

```typescript
// 超级管理员: canAccessTenant 返回 true (permissions 含 platform:admin)
// 包含平台级 admin permission 即可跨租户

// 列表过滤 (service 层):
const filtered = filterByTenantIsolation(actorTenantId, allResults, actorPermissions)
```

## 7. RQ-31 验收卡对照

| RQ | 状态 | 说明 |
|:---|:----:|:-----|
| RQ-31-01 TenantID注入 | ✅ | TenantMiddleware + TenantGuard |
| RQ-31-02 数据过滤 | ✅ | canAccessTenant + filterByTenantIsolation |
| RQ-31-03 租户管理 | ✅ | Controller CRUD + Lifecycle |
| RQ-31-04 跨租户查询 | ✅ | platform:admin bypass |
| RQ-31-05 迁移工具 | ⚠️ | 手动脚本, 待自动化 |

## 8. 部署约束

- TenantModule 是 `@Global()` 注册
- TenantGuard 已在 cashier 模块全覆盖
- 其他模块迁移: 逐步在各 controller 追加 `@UseGuards(TenantGuard)`
- DB 迁移: `20260712_create_national_venue_competitor_tables.sql` 包含 tenant_id 字段

## 9. 测试覆盖

| 测试文件 | 行数 | 覆盖内容 |
|----------|:----:|----------|
| tenant.phase-p31.test.ts | 308 | 缓存隔离/跨租户场景/隔离测试引擎 |
| tenant.role.test.ts | 300+ | 各角色权限隔离 |
| tenant.middleware.test.ts | 200+ | 头解析/边界条件 |
| tenant-quota.service.test.ts | 150+ | 配额校验/超限/设置 |
| tenant-lifecycle.service.test.ts | 150+ | 生命周期切换 |
| tenant-isolation.util.test.ts | 100+ | 隔离函数单元 |

## 10. 路线图

- V18: Prisma interceptor 自动 WHERE tenantId= (零代码入侵数据层)
- V18: 迁移工具自动化 (现有数据 + tenant_id 分配)
- V18: 所有 Controller 统一 @UseGuards(TenantGuard)
- V19: 性能基准测试 (跨租户 < 5% 开销)
