# P-31 多租户架构详细设计文档

## 1. 架构概述

M5 Platform V17 采用**三层级多租户架构**，实现平台级、租户级、品牌级、门店级的资源隔离与数据安全。

### 1.1 架构层级

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM 平台层                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  全局配置 · 平台运营 · 跨租户分析 · 系统监控                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│      TENANT 租户A        │ │      TENANT 租户B        │ │      TENANT 租户C        │
│   ┌─────────────────┐   │ │   ┌─────────────────┐   │ │   ┌─────────────────┐   │
│   │   租户级配置     │   │ │   │   租户级配置     │   │ │   │   租户级配置     │   │
│   │   用户管理      │   │ │   │   用户管理      │   │ │   │   用户管理      │   │
│   │   数据隔离      │   │ │   │   数据隔离      │   │ │   │   数据隔离      │   │
│   └─────────────────┘   │ │   └─────────────────┘   │ │   └─────────────────┘   │
│           │             │ │           │             │ │           │             │
│     ┌─────┴─────┐       │ │     ┌─────┴─────┐       │ │     ┌─────┴─────┐       │
│     ▼           ▼       │ │     ▼           ▼       │ │     ▼           ▼       │
│  ┌──────┐   ┌──────┐    │ │  ┌──────┐   ┌──────┐    │ │  ┌──────┐   ┌──────┐    │
│  │Brand1│   │Brand2│    │ │  │Brand3│   │Brand4│    │ │  │Brand5│   │Brand6│    │
│  └──┬───┘   └──┬───┘    │ │  └──┬───┘   └──┬───┘    │ │  └──┬───┘   └──┬───┘    │
│     │          │        │ │     │          │        │ │     │          │        │
│  ┌──┴──┐    ┌─┴───┐    │ │  ┌──┴──┐    ┌─┴───┐    │ │  ┌──┴──┐    ┌─┴───┐    │
│  │S1   │    │S3   │    │ │  │S5   │    │S7   │    │ │  │S9   │    │S11  │    │
│  │S2   │    │S4   │    │ │  │S6   │    │S8   │    │ │  │S10  │    │S12  │    │
│  └─────┘    └─────┘    │ │  └─────┘    └─────┘    │ │  └─────┘    └─────┘    │
│   STORE 门店层          │ │                         │ │                         │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

### 1.2 隔离层级定义

| 层级 | 英文 | 标识符 | 数据隔离范围 | 典型用途 |
|------|------|--------|-------------|----------|
| **平台** | Platform | `platform` | 全局配置、跨租户统计 | 运营后台、系统监控 |
| **租户** | Tenant | `tenantId` | 租户内所有数据 | 企业/品牌方账户 |
| **品牌** | Brand | `brandId` | 品牌下所有门店 | 多品牌集团 |
| **门店** | Store | `storeId` | 单店数据 | 具体经营场所 |

### 1.3 请求上下文传播

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HTTP Request Headers                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐            │
│  │  x-tenant-id    │  │  x-brand-id     │  │  x-store-id     │            │
│  │  租户标识        │  │  品牌标识        │  │  门店标识        │            │
│  │  必填           │  │  可选           │  │  可选           │            │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘            │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐            │
│  │ x-market-code     │  │  x-actor-id     │  │  x-actor-type   │            │
│  │ 市场区域码        │  │  执行者ID        │  │  执行者类型      │            │
│  │ 默认:us-default   │  │  (可选)          │  │  (可选)          │            │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TenantMiddleware (NestJS)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 读取 Headers → 解析 tenantContext                                      │
│     { tenantId, brandId, storeId, marketCode }                              │
│                                                                             │
│  2. 解析 actorContext (可选, 用于身份识别)                                   │
│     { actorId, actorType, tenantId, brandId, storeId, roles, permissions }  │
│                                                                             │
│  3. 创建 governanceContext                                                  │
│     { requestId, startedAt }                                                  │
│                                                                             │
│  4. 挂载到 req 对象供后续使用                                                │
│     req.tenantContext / req.actorContext / req.governanceContext           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TenantService.resolveTenantContext()                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  优先级合并规则 (高 → 低):                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  effectiveTenantId                                                  │    │
│  │   = actor.tenantId > tenantContext.tenantId > 'tenant-demo'       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  effectiveBrandId / effectiveStoreId                              │    │
│  │   = actor.brandId/storeId > tenantContext.brandId/storeId           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  输出: ResolvedActorContext (包含 effective* 字段的最终上下文)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 核心组件实现

### 2.1 类型定义

```typescript
// tenant.types.ts

/** Actor 类型定义 */
export type ActorType =
  | 'platform-user'      // 平台运营用户
  | 'tenant-user'        // 租户管理员
  | 'brand-user'         // 品牌管理员
  | 'store-user'         // 门店员工
  | 'employee-user'      // 企业员工
  | 'service-account'    // 服务账号

/** 请求租户上下文 */
export interface RequestTenantContext {
  tenantId: string      // 租户ID
  brandId?: string      // 品牌ID（可选）
  storeId?: string      // 门店ID（可选）
  marketCode?: string   // 市场区域码
}

/** 请求 Actor 上下文 */
export interface RequestActorContext {
  actorId: string
  actorType: ActorType | string
  actorName?: string
  tenantId?: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
  authenticated: boolean
  source: 'headers'
}

/** 治理上下文 */
export interface RequestGovernanceContext {
  requestId: string
  startedAt: number
  rateLimit?: {
    applied: boolean
    scopeKey?: string
    allowed?: boolean
    retryAfterSeconds?: number
  }
}

/** 解析后的 Actor 上下文 */
export interface ResolvedActorContext {
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

/** 租户感知请求 */
export interface TenantAwareRequest extends Request {
  tenantContext: RequestTenantContext
  actorContext?: RequestActorContext
  governanceContext?: RequestGovernanceContext
}
```

### 2.2 中间件实现

```typescript
// tenant.middleware.ts

import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

const DEFAULT_TENANT_ID = 'tenant-demo'
const DEFAULT_MARKET = 'us-default'

@Injectable()
export class TenantMiddleware {
  use(req: any, _res: any, next: () => void): void {
    // 1. 解析 tenantContext
    const tenantId = this.readHeader(req, 'x-tenant-id') ?? DEFAULT_TENANT_ID
    const brandId = this.readHeader(req, 'x-brand-id')
    const storeId = this.readHeader(req, 'x-store-id')
    const marketCode = this.readHeader(req, 'x-market-code') ?? DEFAULT_MARKET
    
    req.tenantContext = { tenantId, brandId, storeId, marketCode }

    // 2. 解析 governanceContext
    const requestId = this.readHeader(req, 'x-request-id') ?? randomUUID()
    req.governanceContext = { requestId, startedAt: Date.now() }

    // 3. 解析 actorContext (可选)
    const actor = this.buildActorContext(req)
    if (actor) {
      req.actorContext = actor
    }

    next()
  }

  private readHeader(req: any, name: string): string | undefined {
    const raw = req.header?.(name)
    if (raw === undefined || raw === null) return undefined
    const trimmed = String(raw).trim()
    return trimmed === '' ? undefined : trimmed
  }

  private buildActorContext(req: any): any | undefined {
    // 实现从 headers 解析 actor 信息的逻辑
    // 支持 x-actor, x-actor-id, x-actor-type, x-roles, x-permissions 等
    // ...
    return undefined // 如果没有 identity headers 返回 undefined
  }
}
```

### 2.3 租户上下文服务

```typescript
// tenant.service.ts

import type {
  RequestActorContext,
  RequestGovernanceContext,
  RequestTenantContext,
  ResolvedActorContext
} from './tenant.types'

/**
 * 多租户上下文解析服务
 * 
 * 优先级规则：
 * - effectiveTenantId: actor.tenantId > tenantContext.tenantId > 'tenant-demo'
 * - effectiveBrandId: actor.brandId > tenantContext.brandId
 * - effectiveStoreId: actor.storeId > tenantContext.storeId
 */
export class TenantService {
  resolveTenantContext(
    tenantContext: RequestTenantContext,
    actorContext?: RequestActorContext,
    _governanceContext?: RequestGovernanceContext
  ): ResolvedActorContext {
    // 优先级合并
    const effectiveTenantId =
      actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo'

    const effectiveBrandId = actorContext?.brandId ?? tenantContext?.brandId
    const effectiveStoreId = actorContext?.storeId ?? tenantContext?.storeId
    const effectiveMarketCode = tenantContext?.marketCode ?? 'default'

    const actor = actorContext ?? null
    const isAuthenticated = actor?.authenticated ?? false

    return {
      authenticated: isAuthenticated,
      actor: actor
        ? {
            actorId: actor.actorId,
            actorType: actor.actorType,
            actorName: actor.actorName ?? undefined,
            tenantId: actor.tenantId ?? undefined,
            brandId: actor.brandId ?? undefined,
            storeId: actor.storeId ?? undefined,
            roles: actor.roles ?? [],
            permissions: actor.permissions ?? [],
            authenticated: actor.authenticated,
            source: actor.source
          }
        : null,
      tenantContext,
      effectiveTenantId,
      effectiveBrandId,
      effectiveStoreId,
      effectiveMarketCode,
      roles: actorContext?.roles ?? [],
      permissions: actorContext?.permissions ?? []
    }
  }
}
```

## 3. 数据隔离策略

### 3.1 数据库隔离模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL 数据库                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         全局表 (Global)                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Platform   │  │   Feature    │  │   AuditLog   │              │   │
│  │  │   Config     │  │   Flags      │  │   (全局)      │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      租户隔离表 (Tenant-Scoped)                      │   │
│  │                                                                     │   │
│  │  租户A (tenant-a)                                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │   │
│  │  │  User    │ │  Order   │ │  Product │ │ Inventory│                │   │
│  │  │ 租户内用户│ │ 订单     │ │ 商品     │ │ 库存     │                │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │   │
│  │                                                                     │   │
│  │  租户B (tenant-b)                                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │   │
│  │  │  User    │ │  Order   │ │  Product │ │ Inventory│                │   │
│  │  │ 租户内用户│ │ 订单     │ │ 商品     │ │ 库存     │                │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 行级安全（RLS）策略

```sql
-- 为所有租户隔离表启用 RLS
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问其租户的数据
CREATE POLICY tenant_isolation_policy ON "Order"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- 设置当前租户ID（在应用层执行）
SET app.current_tenant_id = 'tenant-a';
```

### 3.3 Prisma 中间件实现

```typescript
// prisma-tenant.middleware.ts

import { PrismaClient } from '@prisma/client'

/**
 * Prisma 租户隔离中间件
 * 
 * 功能：
 * 1. 自动为所有查询添加 tenantId 过滤
 * 2. 自动为所有创建操作注入 tenantId
 * 3. 防止跨租户数据访问
 */
export function createTenantPrismaMiddleware(
  getCurrentTenantId: () => string | undefined
) {
  return async function tenantMiddleware(
    params: any,
    next: (params: any) => Promise<any>
  ): Promise<any> {
    const tenantId = getCurrentTenantId()
    
    if (!tenantId) {
      // 没有租户上下文，允许操作全局表
      return next(params)
    }

    const { model, action, args = {} } = params

    // 为查询操作自动添加 tenantId 过滤
    if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(action)) {
      return next({
        ...params,
        args: {
          ...args,
          where: {
            AND: [
              args.where || {},
              { tenantId }
            ]
          }
        }
      })
    }

    // 为创建操作自动注入 tenantId
    if (['create', 'createMany', 'upsert'].includes(action)) {
      const dataWithTenant = injectTenantId(args.data, tenantId)
      return next({
        ...params,
        args: {
          ...args,
          data: dataWithTenant
        }
      })
    }

    // 为更新/删除操作确保只能操作当前租户数据
    if (['update', 'updateMany', 'delete', 'deleteMany'].includes(action)) {
      return next({
        ...params,
        args: {
          ...args,
          where: {
            AND: [
              args.where || {},
              { tenantId }
            ]
          }
        }
      })
    }

    return next(params)
  }
}

function injectTenantId(data: any, tenantId: string): any {
  if (Array.isArray(data)) {
    return data.map(item => injectTenantId(item, tenantId))
  }
  if (data && typeof data === 'object') {
    return { ...data, tenantId }
  }
  return data
}
```

## 4. Header 传播机制

### 4.1 Header 定义

| Header | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `x-tenant-id` | 是 | 租户唯一标识 | `tenant-001` |
| `x-brand-id` | 否 | 品牌唯一标识 | `brand-abc` |
| `x-store-id` | 否 | 门店唯一标识 | `store-xyz` |
| `x-market-code` | 否 | 市场区域码 | `us-west`, `cn-east` |
| `x-actor-id` | 否 | 执行者ID | `user-123` |
| `x-actor-type` | 否 | 执行者类型 | `tenant-user` |
| `x-roles` | 否 | 角色列表 | `admin,manager` |
| `x-permissions` | 否 | 权限列表 | `read,write,delete` |
| `x-request-id` | 否 | 请求追踪ID | `req-uuid-123` |

### 4.2 Header 解析流程

```typescript
// 完整的 Header 解析流程

class HeaderParser {
  parseTenantHeaders(req: Request): RequestTenantContext {
    return {
      tenantId: this.readHeader(req, 'x-tenant-id') ?? 'tenant-demo',
      brandId: this.readHeader(req, 'x-brand-id'),
      storeId: this.readHeader(req, 'x-store-id'),
      marketCode: this.readHeader(req, 'x-market-code') ?? 'us-default'
    }
  }

  parseActorHeaders(req: Request): RequestActorContext | undefined {
    const actorId = this.readHeader(req, 'x-actor-id')
    
    // 如果没有 actor 相关 headers，返回 undefined
    if (!actorId && !this.readHeader(req, 'x-actor')) {
      return undefined
    }

    return {
      actorId: actorId ?? 'anonymous',
      actorType: this.readHeader(req, 'x-actor-type') ?? 'unknown',
      actorName: this.readHeader(req, 'x-actor-name'),
      tenantId: this.readHeader(req, 'x-actor-tenant-id'),
      brandId: this.readHeader(req, 'x-actor-brand-id'),
      storeId: this.readHeader(req, 'x-actor-store-id'),
      roles: this.parseArrayHeader(req, 'x-roles', 'x-role'),
      permissions: this.parseArrayHeader(req, 'x-permissions', 'x-permission'),
      authenticated: true,
      source: 'headers'
    }
  }

  private readHeader(req: Request, name: string): string | undefined {
    const raw = req.header?.(name)
    if (raw === undefined || raw === null) return undefined
    const trimmed = String(raw).trim()
    return trimmed === '' ? undefined : trimmed
  }

  private parseArrayHeader(
    req: Request, 
    pluralName: string, 
    singularName?: string
  ): string[] {
    const value = this.readHeader(req, pluralName) ?? 
                  (singularName ? this.readHeader(req, singularName) : undefined)
    
    if (!value) return []
    
    return Array.from(
      new Set(
        value.split(',').map(s => s.trim()).filter(Boolean)
      )
    )
  }
}
```

## 5. 使用示例

### 5.1 Controller 中使用

```typescript
import { Controller, Get, Headers, Req } from '@nestjs/common'
import type { TenantAwareRequest } from './tenant.types'

@Controller('orders')
export class OrderController {
  @Get()
  async listOrders(
    @Req() req: TenantAwareRequest,
    @Headers('x-tenant-id') tenantId: string
  ) {
    // 方式1: 直接从请求对象获取
    const { tenantContext } = req
    console.log('Tenant:', tenantContext.tenantId)
    console.log('Brand:', tenantContext.brandId)
    console.log('Store:', tenantContext.storeId)

    // 方式2: 从 header 直接获取
    console.log('Tenant from header:', tenantId)

    // 方式3: 获取 Actor 信息
    if (req.actorContext) {
      console.log('Actor:', req.actorContext.actorId)
      console.log('Roles:', req.actorContext.roles)
    }

    // 方式4: 获取治理上下文
    console.log('Request ID:', req.governanceContext?.requestId)

    return { orders: [] }
  }
}
```

### 5.2 Service 层使用

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { RequestTenantContext } from './tenant.types'

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findOrders(tenantContext: RequestTenantContext) {
    const { tenantId, brandId, storeId } = tenantContext

    // 构建查询条件
    const where: any = { tenantId }
    if (brandId) where.brandId = brandId
    if (storeId) where.storeId = storeId

    return this.prisma.order.findMany({ where })
  }

  async createOrder(
    tenantContext: RequestTenantContext,
    data: { customerId: string; items: any[] }
  ) {
    const { tenantId, brandId, storeId } = tenantContext

    return this.prisma.order.create({
      data: {
        ...data,
        tenantId,
        brandId,
        storeId,
        status: 'pending'
      }
    })
  }
}
```

### 5.3 装饰器封装

```typescript
// tenant.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * 获取完整的租户上下文
 */
export const TenantContext = createParamDecorator(
  (data: keyof import('./tenant.types').RequestTenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const tenantContext = request.tenantContext
    
    return data ? tenantContext?.[data] : tenantContext
  }
)

/**
 * 获取 Actor 上下文
 */
export const ActorContext = createParamDecorator(
  (data: keyof import('./tenant.types').RequestActorContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const actorContext = request.actorContext
    
    return data ? actorContext?.[data] : actorContext
  }
)

/**
 * 获取治理上下文
 */
export const GovernanceContext = createParamDecorator(
  (data: keyof import('./tenant.types').RequestGovernanceContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const governanceContext = request.governanceContext
    
    return data ? governanceContext?.[data] : governanceContext
  }
)

/**
 * 获取有效的租户ID（已合并优先级）
 */
export const EffectiveTenantId = createParamDecorator(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    // 优先使用已解析的有效租户ID
    return request.effectiveTenantId ?? request.tenantContext?.tenantId ?? 'tenant-demo'
  }
)
```

**使用示例：**

```typescript
import { Controller, Get } from '@nestjs/common'
import { TenantContext, ActorContext, EffectiveTenantId } from './tenant.decorator'

@Controller('products')
export class ProductController {
  @Get()
  async list(
    @TenantContext() tenantContext: RequestTenantContext,
    @TenantContext('tenantId') tenantId: string,  // 直接获取字段
    @ActorContext('roles') roles: string[],       // 直接获取角色
    @EffectiveTenantId() effectiveTenantId: string
  ) {
    console.log('Tenant Context:', tenantContext)
    console.log('Tenant ID:', tenantId)
    console.log('User Roles:', roles)
    console.log('Effective Tenant:', effectiveTenantId)
    
    return { products: [] }
  }
}
```

## 6. 测试策略

### 6.1 单元测试

```typescript
// tenant.service.spec.ts

import { describe, it, expect } from 'vitest'
import { TenantService } from './tenant.service'

describe('TenantService', () => {
  const service = new TenantService()

  describe('resolveTenantContext', () => {
    it('should use tenantContext.tenantId when no actor', () => {
      const result = service.resolveTenantContext(
        { tenantId: 'tenant-a', marketCode: 'us' },
        undefined
      )
      expect(result.effectiveTenantId).toBe('tenant-a')
    })

    it('should prioritize actor.tenantId over tenantContext', () => {
      const result = service.resolveTenantContext(
        { tenantId: 'tenant-a', marketCode: 'us' },
        {
          actorId: 'user-1',
          actorType: 'tenant-user',
          tenantId: 'tenant-b',
          roles: [],
          permissions: [],
          authenticated: true,
          source: 'headers'
        }
      )
      expect(result.effectiveTenantId).toBe('tenant-b')
    })

    it('should use default tenant when no context provided', () => {
      const result = service.resolveTenantContext(
        { tenantId: undefined as any, marketCode: 'us' },
        undefined
      )
      expect(result.effectiveTenantId).toBe('tenant-demo')
    })

    it('should merge brandId and storeId from actor and tenant', () => {
      const result = service.resolveTenantContext(
        { tenantId: 'tenant-a', brandId: 'brand-a', storeId: 'store-a' },
        {
          actorId: 'user-1',
          actorType: 'brand-user',
          tenantId: 'tenant-b',
          brandId: 'brand-b',
          storeId: 'store-b',
          roles: [],
          permissions: [],
          authenticated: true,
          source: 'headers'
        }
      )
      
      // Actor 优先级更高
      expect(result.effectiveTenantId).toBe('tenant-b')
      expect(result.effectiveBrandId).toBe('brand-b')
      expect(result.effectiveStoreId).toBe('store-b')
    })
  })
})
```

### 6.2 中间件测试

```typescript
// tenant.middleware.spec.ts

import { describe, it, expect, vi } from 'vitest'
import { TenantMiddleware } from './tenant.middleware'

describe('TenantMiddleware', () => {
  const middleware = new TenantMiddleware()

  it('should extract tenant context from headers', () => {
    const req = {
      header: vi.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-tenant-id': 'tenant-001',
          'x-brand-id': 'brand-001',
          'x-store-id': 'store-001',
          'x-market-code': 'cn-east'
        }
        return headers[name]
      })
    }
    const res = {}
    const next = vi.fn()

    middleware.use(req as any, res as any, next)

    expect(req.tenantContext).toEqual({
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001',
      marketCode: 'cn-east'
    })
    expect(next).toHaveBeenCalled()
  })

  it('should use default values when headers are missing', () => {
    const req = {
      header: vi.fn(() => undefined)
    }
    const res = {}
    const next = vi.fn()

    middleware.use(req as any, res as any, next)

    expect(req.tenantContext).toEqual({
      tenantId: 'tenant-demo',
      brandId: undefined,
      storeId: undefined,
      marketCode: 'us-default'
    })
  })

  it('should trim whitespace from header values', () => {
    const req = {
      header: vi.fn(() => '  tenant-001  ')
    }
    const res = {}
    const next = vi.fn()

    middleware.use(req as any, res as any, next)

    expect(req.tenantContext.tenantId).toBe('tenant-001')
  })

  it('should handle actor headers when present', () => {
    const req = {
      header: vi.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-tenant-id': 'tenant-001',
          'x-actor-id': 'user-123',
          'x-actor-type': 'tenant-user',
          'x-actor-name': '张三',
          'x-roles': 'admin,manager',
          'x-permissions': 'read,write'
        }
        return headers[name]
      })
    }
    const res = {}
    const next = vi.fn()

    middleware.use(req as any, res as any, next)

    expect(req.actorContext).toEqual({
      actorId: 'user-123',
      actorType: 'tenant-user',
      actorName: '张三',
      tenantId: undefined,
      brandId: undefined,
      storeId: undefined,
      roles: ['admin', 'manager'],
      permissions: ['read', 'write'],
      authenticated: true,
      source: 'headers'
    })
  })
})
```

## 7. 性能与监控

### 7.1 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 上下文解析延迟 | < 1ms | 单次请求上下文解析时间 |
| 中间件处理延迟 | < 0.5ms | TenantMiddleware 处理时间 |
| 数据库查询开销 | +5% | 因租户隔离增加的查询复杂度 |
| 内存占用 | < 10KB/请求 | 上下文对象内存占用 |

### 7.2 监控告警

```yaml
# 多租户架构监控告警配置

- alert: HighTenantContextLatency
  expr: |
    histogram_quantile(0.99, 
      sum(rate(tenant_context_resolve_duration_seconds_bucket[5m])) by (le)
    ) > 0.001
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "租户上下文解析延迟过高"
    description: "99分位延迟超过 1ms"

- alert: MissingTenantId
  expr: |
    increase(http_requests_total{tenant_id="tenant-demo"}[5m]) > 100
  for: 5m
  labels:
    severity: info
  annotations:
    summary: "大量请求使用默认租户ID"
    description: "可能存在未正确传递 tenant-id 的客户端"

- alert: CrossTenantAccessAttempt
  expr: |
    increase(tenant_isolation_violations_total[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "检测到跨租户访问尝试"
    description: "可能存在安全漏洞或恶意攻击"
```

### 7.3 链路追踪

```typescript
// 在请求处理中添加租户上下文到 trace

import { trace } from '@opentelemetry/api'

function addTenantContextToSpan(tenantContext: RequestTenantContext) {
  const span = trace.getActiveSpan()
  if (span) {
    span.setAttributes({
      'tenant.id': tenantContext.tenantId,
      'tenant.brand_id': tenantContext.brandId,
      'tenant.store_id': tenantContext.storeId,
      'tenant.market_code': tenantContext.marketCode
    })
  }
}
```

## 8. 最佳实践

### 8.1 开发规范

1. **必须**在 Controller 方法签名中声明租户相关的 headers
2. **必须**使用 `TenantContext` 装饰器获取租户上下文
3. **禁止**在 Service 层直接读取 headers
4. **必须**在数据库查询中显式传递 tenantId

### 8.2 常见错误

```typescript
// ❌ 错误：直接在 Service 中读取 headers
@Service()
class BadService {
  async findOrders(headers: any) {
    const tenantId = headers['x-tenant-id']  // 不推荐
    return this.prisma.order.findMany({ where: { tenantId } })
  }
}

// ✅ 正确：通过参数传递租户上下文
@Service()
class GoodService {
  async findOrders(tenantContext: RequestTenantContext) {
    const { tenantId, brandId, storeId } = tenantContext
    return this.prisma.order.findMany({ 
      where: { 
        tenantId,
        ...(brandId && { brandId }),
        ...(storeId && { storeId })
      } 
    })
  }
}
```

### 8.3 测试指南

```typescript
// 多租户测试工具

export function createTestTenantContext(
  overrides?: Partial<RequestTenantContext>
): RequestTenantContext {
  return {
    tenantId: 'test-tenant',
    brandId: 'test-brand',
    storeId: 'test-store',
    marketCode: 'us-test',
    ...overrides
  }
}

export function createTestActorContext(
  overrides?: Partial<RequestActorContext>
): RequestActorContext {
  return {
    actorId: 'test-user',
    actorType: 'tenant-user',
    actorName: 'Test User',
    tenantId: 'test-tenant',
    brandId: 'test-brand',
    storeId: 'test-store',
    roles: ['user'],
    permissions: ['read'],
    authenticated: true,
    source: 'headers',
    ...overrides
  }
}

// 测试示例
describe('OrderService', () => {
  it('should only return orders for the specified tenant', async () => {
    // Arrange
    const tenantContext = createTestTenantContext({ tenantId: 'tenant-a' })
    
    // 创建测试数据
    await prisma.order.createMany({
      data: [
        { id: 'order-1', tenantId: 'tenant-a', total: 100 },
        { id: 'order-2', tenantId: 'tenant-b', total: 200 } // 不同租户
      ]
    })
    
    // Act
    const orders = await orderService.findOrders(tenantContext)
    
    // Assert
    expect(orders).toHaveLength(1)
    expect(orders[0].tenantId).toBe('tenant-a')
    expect(orders[0].id).toBe('order-1')
  })
})
```

---

**文档版本**: v1.0  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
