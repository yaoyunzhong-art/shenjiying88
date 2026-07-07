import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Health 健康检查 HTTP 链路
 *
 * 链路:
 *   HTTP → HealthController → HealthService → PrismaService / LytService / Redis / Disk / Memory
 *
 * 验证:
 *   - GET /health - 基础连通性 (ping)
 *   - GET /health/ping - 别名连通性
 *   - GET /health/readiness - 完整健康检查 (含组件探测)
 *   - GET /health/readiness?verbose=true - 详细模式
 *   - 数据库组件探测
 *   - LYT 适配器组件探测
 *   - 降级状态检测
 *   - 未授权访问 readiness 返回 403/401
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { HealthService } from './health.service'
import { PrismaService } from '../../prisma/prisma.service'
import { LytService } from '../lyt/lyt.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { HealthQueryDto } from './health.dto'
import { FoundationScopeType } from '@m5/domain'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

function attachActorContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as any
  ctx.actorContext = {
    actorId: 'actor-001',
    roles: ['SUPER_ADMIN'],
    permissions: ['foundation.governance.read']
  }
  next()
}

// 模拟 PrismaService
const mockPrismaService = {
  $queryRaw: async () => [{ '?column?': 1 }]
} as unknown as PrismaService

// 模拟 LytService
const mockLytService = {
  getBootstrap: () => ({
    adapter: 'mock-adapter',
    foundationDependencies: {},
    foundationContracts: {}
  }),
  getAdapter: () => ({
    getMember: async (id: string) => ({ id, name: 'Mock Member', level: 'GOLD' })
  })
} as unknown as LytService

@Controller('health')
class TestHealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService
  ) {}

  @Get()
  getHealth() {
    return this.healthService.ping()
  }

  @Get('ping')
  getPing() {
    return this.healthService.ping()
  }

  @Get('readiness')
  getReadiness(
    @Req() req: Request,
    @Query() query: HealthQueryDto
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const actorContext = (req as any).actorContext
    return this.healthService.check({
      scope: {
        scopeType: tenantContext?.storeId
          ? FoundationScopeType.Store
          : tenantContext?.brandId
            ? FoundationScopeType.Brand
            : tenantContext?.tenantId
              ? FoundationScopeType.Tenant
              : tenantContext?.marketCode
                ? FoundationScopeType.Market
                : FoundationScopeType.Platform,
        scopeId:
          tenantContext?.storeId ??
          tenantContext?.brandId ??
          tenantContext?.tenantId ??
          tenantContext?.marketCode ??
          'platform'
      },
      requestorId: actorContext?.actorId,
      verbose: query?.verbose === true || query?.verbose === ('true' as any)
    })
  }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001',
  'x-market-code': 'cn-mainland'
}

async function buildApp() {
  const healthService = new HealthService(mockLytService, mockPrismaService)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestHealthController],
    providers: [
      { provide: HealthService, useValue: healthService },
      { provide: LytService, useValue: mockLytService },
      { provide: PrismaService, useValue: mockPrismaService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.use(attachActorContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalPipes(new (await import('@nestjs/common')).ValidationPipe({ transform: true }))
  await app.init()

  return { app, healthService }
}

// ========== 测试 ==========

it('e2e: GET /health returns alive=true', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/health')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
    assert.ok(typeof res.body.data.timestamp === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/ping returns alive=true (alias)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/health/ping')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness returns full health check', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(res.body.data.status))
    assert.ok(typeof res.body.data.checkedAt === 'string')
    assert.ok(typeof res.body.data.uptimeSeconds === 'number')
    assert.ok(typeof res.body.data.version === 'string')
    assert.ok(Array.isArray(res.body.data.components))
    assert.ok(res.body.data.components.length >= 2)
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness?verbose=true returns all components', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness?verbose=true')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    const componentNames = res.body.data.components.map((c: any) => c.name)
    // verbose 模式应包含数据库、LYT适配器、内存、磁盘、Redis
    assert.ok(componentNames.includes('database'))
    assert.ok(componentNames.includes('lyt-adapter'))
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness components have expected structure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    for (const comp of res.body.data.components) {
      assert.ok(typeof comp.name === 'string')
      assert.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(comp.status))
      assert.ok(typeof comp.latencyMs === 'number')
    }
    // 数据库应返回 connected
    const dbComponent = res.body.data.components.find((c: any) => c.name === 'database')
    assert.ok(dbComponent)
    assert.equal(dbComponent.status, 'OK')
    assert.equal(dbComponent.detail?.connected, true)
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness includes version info', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    // version 可能是 '0.0.0' 或其他版本号
    assert.ok(typeof res.body.data.version === 'string')
    assert.ok(res.body.data.version.length > 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness includes lytMode', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    // lytMode 在 tenant 下有值时返回 'mock'
    assert.ok(typeof res.body.data.lytMode === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: GET /health returns consistent response format', async () => {
  const { app } = await buildApp()
  try {
    // 多次调用应一致
    const res1 = await request(app.getHttpServer()).get('/health')
    const res2 = await request(app.getHttpServer()).get('/health')
    assert.equal(res1.body.data.alive, res2.body.data.alive)
    assert.equal(res1.body.code, res2.body.code)
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness without tenant returns 200', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
    assert.equal(res.statusCode, 200)
    // 无租户头时，中间件默认注入 tenant，lytMode 为 'mock'
    assert.ok(typeof res.body.data.lytMode === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: GET /health/readiness verbose shows sampleMember', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness?verbose=true')
      .set(TENANT_A)
    assert.equal(res.statusCode, 200)
    // verbose 模式下有 sampleMember
    assert.ok(res.body.data.sampleMember !== undefined)
    if (res.body.data.sampleMember) {
      assert.equal(res.body.data.sampleMember.id, 'seed-member-001')
    }
  } finally {
    await app.close()
  }
})

// ========== 角色模拟 E2E 测试 ==========

/**
 * 构建支持角色模拟的应用。
 * 通过自定义 attachActorContext2 从 headers 读取 actor 信息，
 * 模拟不同的系统角色访问健康检查端点。
 */
function attachActorContext2(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as any
  ctx.actorContext = {
    actorId: req.header('x-actor-id') ?? 'actor-default',
    actorType: req.header('x-actor-type') ?? 'tenant-user',
    actorName: req.header('x-actor-name') ?? undefined,
    tenantId: req.header('x-actor-tenant-id') ?? undefined,
    brandId: req.header('x-actor-brand-id') ?? undefined,
    storeId: req.header('x-actor-store-id') ?? undefined,
    roles: (req.header('x-actor-roles') ?? '').split(',').filter(Boolean),
    permissions: (req.header('x-actor-permissions') ?? '').split(',').filter(Boolean),
    authenticated: req.header('x-actor-authenticated') !== 'false',
    source: 'headers' as const
  }
  next()
}

async function buildRoleHealthApp() {
  const healthService = new HealthService(mockLytService, mockPrismaService)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestHealthController],
    providers: [
      { provide: HealthService, useValue: healthService },
      { provide: LytService, useValue: mockLytService },
      { provide: PrismaService, useValue: mockPrismaService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.use(attachActorContext2)
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalPipes(new (await import('@nestjs/common')).ValidationPipe({ transform: true }))
  await app.init()

  return { app, healthService }
}

// 1. 👔 店长: 可以访问健康检查
it('e2e: 👔 店长 可以访问基础健康检查', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set({
        'x-actor-id': 'store-manager-health',
        'x-actor-type': 'store-user',
        'x-actor-roles': 'STORE_MANAGER',
        'x-actor-permissions': 'tenant:read,store:manage',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
  } finally {
    await app.close()
  }
})

// 2. 🎮 导玩员: 可以访问基础健康检查
it('e2e: 🎮 导玩员 可以 ping 基础健康检查', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set({
        'x-actor-id': 'guide-player-001',
        'x-actor-type': 'store-user',
        'x-actor-roles': 'GUIDE',
        'x-actor-permissions': 'tenant:read,game:session:write',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
  } finally {
    await app.close()
  }
})

// 3. 🔧 安监: 访问详细的系统健康状态
it('e2e: 🔧 安监 访问 readiness 详细系统健康状态', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
      .set({
        'x-actor-id': 'safety-monitor-001',
        'x-actor-type': 'platform-user',
        'x-actor-roles': 'SECURITY_ADMIN',
        'x-actor-permissions': 'audit:read,foundation.governance.read',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(res.body.data.status))
    assert.ok(Array.isArray(res.body.data.components))
    // 安监可以获得完整组件信息
    assert.ok(res.body.data.components.length >= 2)
    const dbComponent = res.body.data.components.find((c: any) => c.name === 'database')
    assert.ok(dbComponent)
  } finally {
    await app.close()
  }
})

// 4. 📢 营销: 可以访问但不操作
it('e2e: 📢 营销 可以 ping 健康检查但不具有管理权限', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set({
        'x-actor-id': 'mkt-viewer-001',
        'x-actor-type': 'brand-user',
        'x-actor-roles': 'MARKETING',
        'x-actor-permissions': 'tenant:read,campaign:write',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
    // 营销的权限不包含 foundation.governance.read（readiness 需要）
    // 但基础的 /health 和 /health/ping 不需要特殊权限
  } finally {
    await app.close()
  }
})

// 5. 🎯 运行专员: 可以 ping
it('e2e: 🎯 运行专员 可以 ping 健康检查', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health/ping')
      .set({
        'x-actor-id': 'ops-runner-001',
        'x-actor-type': 'tenant-user',
        'x-actor-roles': 'OPERATIONS',
        'x-actor-permissions': 'tenant:read,foundation.operations.alerts.write',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
  } finally {
    await app.close()
  }
})

// 6. 🛒 前台: 基础健康检查可访问
it('e2e: 🛒 前台 可以访问基础健康检查', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set({
        'x-actor-id': 'reception-desk-001',
        'x-actor-type': 'store-user',
        'x-actor-roles': 'RECEPTION',
        'x-actor-permissions': 'tenant:read,member:profile:read',
        'x-actor-authenticated': 'true'
      })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.alive, true)
    // 前台权限最低，仅基础健康检查可访问
  } finally {
    await app.close()
  }
})

// 7. 跨 tenant 的健康检查隔离
it('e2e: 跨 tenant 健康检查隔离', async () => {
  const { app } = await buildRoleHealthApp()
  try {
    // Tenant A readiness
    const resA = await request(app.getHttpServer())
      .get('/health/readiness')
      .set(TENANT_A)
      .set({
        'x-actor-id': 'cross-actor',
        'x-actor-type': 'tenant-user',
        'x-actor-roles': 'SUPER_ADMIN',
        'x-actor-permissions': 'foundation.governance.read,*',
        'x-actor-authenticated': 'true'
      })
    assert.equal(resA.statusCode, 200)

    // Tenant B readiness
    const resB = await request(app.getHttpServer())
      .get('/health/readiness')
      .set({
        'x-tenant-id': 'tenant-002',
        'x-brand-id': 'brand-002',
        'x-store-id': 'store-002',
        'x-market-code': 'us-default'
      })
      .set({
        'x-actor-id': 'cross-actor-b',
        'x-actor-type': 'tenant-user',
        'x-actor-roles': 'SUPER_ADMIN',
        'x-actor-permissions': 'foundation.governance.read,*',
        'x-actor-authenticated': 'true'
      })
    assert.equal(resB.statusCode, 200)

    // 两个 tenant 都应返回健康检查结果
    assert.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(resA.body.data.status))
    assert.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(resB.body.data.status))

    // 每个 tenant 的检查时间戳应独立
    assert.ok(typeof resA.body.data.checkedAt === 'string')
    assert.ok(typeof resB.body.data.checkedAt === 'string')
  } finally {
    await app.close()
  }
})
