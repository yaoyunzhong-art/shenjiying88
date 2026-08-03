# 租户模块 (Tenant)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块为 SaaS 多租户架构的基石，提供完整的租户上下文解析、资源配额管理、生命周期治理和跨租户数据隔离能力:

- **租户上下文解析** — 从请求头/域名/Token 解析 tenantId、brandId、storeId，提供下钻合并规则
- **配额管理** — 基于 Tier 的资源配额体系 (Free/Pro/Enterprise)，支持按租户覆盖
- **生命周期管理** — 状态机驱动: Active → Suspended → Deleted，含操作审计和历史追踪
- **数据隔离守卫** — Token tenantId 与请求路径 tenantId 一致性校验
- **中间件注入** — 在请求管道中将多租户信息注入 `req.tenantContext`
- **自定义装饰器** — `@TenantContext()` 参数装饰器，方便控制器获取租户上下文

边界约束:
- ❌ 不处理用户身份认证（见 `auth` 模块）
- ❌ 不处理角色/权限定义和分配（见 RBAC 策略模块）
- ❌ 不处理实际的 billing 计费扣款（仅定义 Tier 配额层）
- ✅ 聚焦租户上下文 → 配额控制 → 生命周期 → 数据隔离的完整基座

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

### 租户上下文（TenantService）

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 解析租户上下文 | `GET /tenant/resolve` | 从请求中解析完整的租户/演员/治理上下文 | ✅ IMPLEMENTED |

### 配额管理（TenantQuotaService）

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 初始化配额 | `POST /tenant/quota/init` | 按 Tier 初始化租户配额 (Free/Pro/Enterprise) | ✅ IMPLEMENTED |
| 获取配额 | `GET /tenant/quota/:tenantId` | 获取指定租户的配额配置 | ✅ IMPLEMENTED |
| 设置 Tier | `POST /tenant/quota/set-tier` | 升级/降级租户 Tier | ✅ IMPLEMENTED |
| 覆盖配额 | `POST /tenant/quota/override` | 自定义覆盖单租户的配额限制 | ✅ IMPLEMENTED |
| 配额检查 | `POST /tenant/quota/check` | 检查指定资源是否达到上限 | ✅ IMPLEMENTED |
| 配额预留 | `POST /tenant/quota/reserve` | 预留指定资源配额 | ✅ IMPLEMENTED |
| 获取使用量 | `GET /tenant/quota/:tenantId/usage` | 获取当前资源使用量快照 | ✅ IMPLEMENTED |
| 默认配额表 | `GET /tenant/quota/defaults` | 获取各 Tier 默认配额配置 | ✅ IMPLEMENTED |

### 独立配额路由（TenantQuotaController）

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 获取配额 | `GET /tenants/:id/quota` | 独立路径获取租户配额 (404 未初始化) | ✅ IMPLEMENTED |
| 更新配额 | `PUT /tenants/:id/quota` | 更新 Tier + 覆盖字段 | ✅ IMPLEMENTED |
| 获取使用量 | `GET /tenants/:id/quota/usage` | 独立路径获取使用量 (空初始化不回 404) | ✅ IMPLEMENTED |

### 生命周期管理（TenantLifecycleService）

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 初始化生命周期 | `POST /tenant/lifecycle/init` | 创建租户生命周期记录 | ✅ IMPLEMENTED |
| 获取生命周期 | `GET /tenant/lifecycle/:tenantId` | 获取生命周期完整记录 | ✅ IMPLEMENTED |
| 获取状态 | `GET /tenant/lifecycle/:tenantId/status` | 获取当前生命周期状态 | ✅ IMPLEMENTED |
| 暂停租户 | `POST /tenant/lifecycle/suspend` | 暂停租户 (可读不可写) | ✅ IMPLEMENTED |
| 恢复租户 | `POST /tenant/lifecycle/reactivate` | 恢复暂停的租户 | ✅ IMPLEMENTED |
| 软删除租户 | `POST /tenant/lifecycle/delete` | 软删除租户 (终态) | ✅ IMPLEMENTED |
| 活跃租户列表 | `GET /tenant/lifecycle/active` | 获取所有活跃租户列表 | ✅ IMPLEMENTED |
| 已暂停租户列表 | `GET /tenant/lifecycle/suspended` | 获取所有已暂停租户列表 | ✅ IMPLEMENTED |

### 数据隔离（TenantIsolationService）

| 功能 | 方法 | 描述 |
|------|------|------|
| 租户校验 | `verifyTenant()` | 校验 token tenantId 与路径 tenantId 一致 |
| 跨租户集成测试 | `runCrossTenantIntegrationTest()` | 自动化测试跨租户隔离有效性 |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/tenant/
├── tenant.module.ts                   — 全局 NestJS 模块, 导出 3 个 Service
├── tenant.controller.ts               — 租户 REST 控制器 (20 端点)
├── tenant-quota.controller.ts         — 独立配额路由控制器 (3 端点)
├── tenant.service.ts                   — 租户上下文解析服务
├── tenant-quota.service.ts             — 配额管理服务 (Tier + override)
├── tenant-lifecycle.service.ts         — 生命周期状态机服务
├── tenant-isolation.service.ts         — 跨租户数据隔离校验服务
├── tenant.middleware.ts                — 请求管道中间件 (注入 tenantContext)
├── tenant.decorator.ts                 — @TenantContext() 参数装饰器
├── tenant.types.ts                     — 类型定义 (ActorType/Request/Ctx)
├── tenant.dto.ts                       — 请求/响应 DTO
├── tenant-quota.dto.ts                 — 配额管理 DTO (class-validator)
├── tenant.entity.ts                    — 租户实体 (待迁移 TypeORM)
├── tenant-lifecycle.entity.ts          — 生命周期状态机实体/枚举/转换矩阵
├── tenant-quota.entity.ts              — 配额实体/Tier默认值/资源种类/检查函数
├── tenant-isolation.util.ts            — 跨租户隔离工具函数
├── tenant-isolation.lint.ts            — 隔离 lint 规则
├── tenant-quota-enforcement.util.ts    — 配额强制实施工具
│
├── tenant.controller.test.ts           — 控制器测试
├── tenant.controller.spec.ts           — 控制器 spec
├── tenant.service.test.ts              — 服务层测试
├── tenant.service.spec.ts              — 服务层 spec
├── tenant.dto.test.ts                  — DTO 校验测试
├── tenant.types.test.ts                — 类型测试
├── tenant.entity.test.ts               — 实体测试
├── tenant.contract.test.ts             — 合约测试
├── tenant.module.test.ts               — 模块测试
├── tenant.middleware.test.ts            — 中间件测试
├── tenant.decorator.test.ts            — 装饰器测试
├── tenant.e2e.test.ts                  — E2E 端到端测试
├── tenant-multitenant.e2e.test.ts      — 多租户 E2E 测试
├── tenant.role.test.ts                 — 角色权限测试
├── tenant.role-extended.test.ts        — 角色权限扩展测试
├── tenant.ringbeam.test.ts             — RingBeam 集成测试
├── tenant.simulator.test.ts            — 模拟器测试
├── tenant.phase-p31.test.ts            — Phase-31 测试
├── tenant.phase-p46.test.ts            — Phase-46 测试
├── tenant-quota.service.test.ts        — 配额服务测试
├── tenant-quota.controller.spec.ts     — 配额控制器 spec
├── tenant-quota.entity.test.ts         — 配额实体测试
├── tenant-quota-integration.e2e.test.ts— 配额集成 E2E 测试
├── tenant-lifecycle.service.test.ts    — 生命周期服务测试
├── tenant-lifecycle.entity.test.ts     — 生命周期实体测试
├── tenant-isolation.service.test.ts    — 隔离服务测试
├── tenant-isolation.service.spec.ts    — 隔离服务 spec
├── tenant-isolation.util.test.ts       — 隔离工具测试
└── tenant-isolation.e2e.test.ts        — 隔离 E2E 测试
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| GET | `/tenant/resolve` | TenantGuard | 解析租户上下文 |
| POST | `/tenant/quota/init` | TenantGuard | 初始化配额 |
| GET | `/tenant/quota/:tenantId` | TenantGuard | 获取租户配额 |
| POST | `/tenant/quota/set-tier` | TenantGuard | 设置 Tier |
| POST | `/tenant/quota/override` | TenantGuard | 覆盖配额 |
| POST | `/tenant/quota/check` | TenantGuard | 配额检查 |
| POST | `/tenant/quota/reserve` | TenantGuard | 配额预留 |
| GET | `/tenant/quota/:tenantId/usage` | TenantGuard | 获取使用量 |
| GET | `/tenant/quota/defaults` | TenantGuard | 默认配额表 |
| POST | `/tenant/lifecycle/init` | TenantGuard | 初始化生命周期 |
| GET | `/tenant/lifecycle/:tenantId` | TenantGuard | 获取生命周期 |
| GET | `/tenant/lifecycle/:tenantId/status` | TenantGuard | 获取状态 |
| POST | `/tenant/lifecycle/suspend` | TenantGuard | 暂停租户 |
| POST | `/tenant/lifecycle/reactivate` | TenantGuard | 恢复租户 |
| POST | `/tenant/lifecycle/delete` | TenantGuard | 软删除租户 |
| GET | `/tenant/lifecycle/active` | TenantGuard | 活跃租户列表 |
| GET | `/tenant/lifecycle/suspended` | TenantGuard | 已暂停租户列表 |
| GET | `/tenants/:id/quota` | TenantGuard | 独立路径获取配额 |
| PUT | `/tenants/:id/quota` | TenantGuard | 独立路径更新配额 |
| GET | `/tenants/:id/quota/usage` | TenantGuard | 独立路径获取使用量 |

### 核心数据结构

```typescript
// 租户上下文解析结果
interface ResolvedActorContext {
  authenticated: boolean
  actor: RequestActorContext | null
  tenantContext: RequestTenantContext
  effectiveTenantId: string
  effectiveBrandId?: string
  effectiveStoreId?: string
  effectiveMarketCode: string
  roles: string[]
  permissions: string[]
}

// 合并规则: effectiveTenantId = actor > tenant > 'tenant-demo'
//           effectiveBrandId/StoreId = actor > tenant

// 演员类型
type ActorType =
  | 'platform-user' | 'tenant-user' | 'brand-user'
  | 'store-user' | 'employee-user' | 'service-account'

// 生命周期状态机
enum TenantLifecycleStatus { Active = 'ACTIVE', Suspended = 'SUSPENDED', Deleted = 'DELETED' }
enum TenantStatusReason { Created, AdminSuspend, AdminReactivate, QuotaExceeded, BillingOverdue, PolicyViolation, AdminDelete, UserRequest }

// 状态转换规则:
//   Active ──→ Suspended ──→ Active  (可来回)
//   Active ──→ Deleted (终态)
//   Suspended ──→ Deleted (终态)

// 订阅 Tier
enum TenantTier { Free = 'FREE', Pro = 'PRO', Enterprise = 'ENTERPRISE' }

// 配额可约束资源
enum QuotaResourceKind { Brand, Store, Member, Campaign, ApiCall, Coupon }

// 默认配额表
//   Free:       1 Brand,    5 Stores,    100 Members,   10 Campaigns,  1k API/day,   200 Coupon/mo
//   Pro:       10 Brands, 100 Stores,  10k Members,  500 Campaigns, 100k API/day,  20k Coupon/mo
//   Enterprise: 1k Brands, 10k Stores, 1M Members, 100k Campaigns,  10M API/day,   2M Coupon/mo
```

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 默认值 | 说明 |
|------|--------|------|
| 默认租户 ID | `tenant-demo` | 无请求头时降级租户 |
| 默认市场 | `us-default` | 无市场代码时降级 |
| Free Tier 配额 | 1 Brand / 5 Stores / 100 Members / 10 Campaigns / 1k API | 免费层级上限 |
| Pro Tier 配额 | 10 Brands / 100 Stores / 10k Members / 500 Campaigns / 100k API | 专业层级上限 |
| Enterprise Tier 配额 | 1000 Brands / 10k Stores / 1M Members / 100k Campaigns / 10M API | 企业层级上限 |
| `-1` 配额值 | 无限制 | 配额上限为 -1 表示不限制 |

> 当前配额存储使用内存 Map, 生产应接 Redis + 定期持久化。
> Tier 与 Billing 系统解耦, 暂不处理计费逻辑。

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 多租户守卫, 所有端点使用 |
| 上游依赖 | `saas-advanced/domain-resolution.service` | 可选的域名→租户解析服务 (TenantMiddleware 使用) |
| 上游依赖 | `class-validator` / `class-transformer` | DTO 校验 (whitelist + transform) |
| 内部依赖 | `TenantService` | 上下文解析/合并 |
| 内部依赖 | `TenantQuotaService` | Tier 配额/检查/使用量 |
| 内部依赖 | `TenantLifecycleService` | 生命周期状态机 |
| 内部依赖 | `TenantIsolationService` | 跨租户隔离校验 |
| 下游消费 | 全局中间件 | 通过 `TenantMiddleware` 注入 `req.tenantContext` |
| 下游消费 | `@TenantContext()` | 装饰器供各控制器直接注入租户上下文 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### 解析租户上下文

```bash
curl http://localhost:3000/api/tenant/resolve \
  -H "x-tenant-id: tenant-a" \
  -H "x-brand-id: brand-001" \
  -H "x-store-id: store-001"
```

### 初始化租户配额

```bash
curl -X POST http://localhost:3000/api/tenant/quota/init \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"tenantId": "tenant-a", "tier": "PRO"}'
```

### 升级租户 Tier

```bash
curl -X POST http://localhost:3000/api/tenant/quota/set-tier \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"tenantId": "tenant-a", "tier": "ENTERPRISE"}'
```

### 检查配额

```bash
curl -X POST http://localhost:3000/api/tenant/quota/check \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"tenantId": "tenant-a", "resource": "BRAND"}'
```

### 暂停租户

```bash
curl -X POST http://localhost:3000/api/tenant/lifecycle/suspend \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"tenantId": "tenant-a", "reason": "BILLING_OVERDUE", "note": "欠费超过30天"}'
```

### 恢复租户

```bash
curl -X POST http://localhost:3000/api/tenant/lifecycle/reactivate \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"tenantId": "tenant-a", "note": "已缴费"}'
```

### 独立配额路由

```bash
# 获取配额
curl http://localhost:3000/api/tenants/tenant-a/quota \
  -H "x-tenant-id: admin"

# 更新配额
curl -X PUT http://localhost:3000/api/tenants/tenant-a/quota \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: admin" \
  -d '{"maxStores": 50, "maxMembers": 5000}'

# 获取使用量
curl http://localhost:3000/api/tenants/tenant-a/quota/usage \
  -H "x-tenant-id: admin"
```

### 代码中注入

```typescript
@Injectable()
export class SomeService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly quotaService: TenantQuotaService,
    private readonly lifecycleService: TenantLifecycleService,
  ) {}

  async onboardNewTenant(tenantId: string) {
    // 1. 初始化配额 (Free tier)
    this.quotaService.initialize(tenantId, TenantTier.Free)

    // 2. 初始化生命周期
    this.lifecycleService.initialize(tenantId)

    // 3. 检查配额是否允许创建品牌
    const result = this.quotaService.check(tenantId, QuotaResourceKind.Brand)
    if (!result.allowed) {
      throw new Error(`Brand quota exceeded for tenant ${tenantId}`)
    }
  }
}
```

### 装饰器使用

```typescript
@Controller('example')
export class ExampleController {
  @Get('ctx')
  getContext(@TenantContext() ctx: RequestTenantContext) {
    return ctx // 自动注入请求中的租户上下文
  }
}
```

### 运行测试

```bash
# 租户模块全量测试
npx jest apps/api/src/modules/tenant/tenant.controller.test.ts
npx jest apps/api/src/modules/tenant/tenant.service.test.ts
npx jest apps/api/src/modules/tenant/tenant.dto.test.ts
npx jest apps/api/src/modules/tenant/tenant.middleware.test.ts
npx jest apps/api/src/modules/tenant/tenant.e2e.test.ts
npx jest apps/api/src/modules/tenant/tenant-quota.service.test.ts
npx jest apps/api/src/modules/tenant/tenant-lifecycle.service.test.ts
npx jest apps/api/src/modules/tenant/tenant-isolation.service.test.ts
npx jest apps/api/src/modules/tenant/tenant-isolation.e2e.test.ts
npx jest apps/api/src/modules/tenant/tenant.ringbeam.test.ts
```
