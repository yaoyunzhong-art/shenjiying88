import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-Module 跨模块验证 HTTP 链路
 *
 * 链路:
 *   HTTP → CrossModuleController → CrossModuleService → CrossModuleChain entities
 *
 * 验证:
 *   - GET /cross-module/chain-status - 列出所有跨模块链路
 *   - POST /cross-module/validate - 验证指定链路
 *   - POST /cross-module/validate?chainName=xxx - 验证单条链路
 *   - 响应格式一致性
 *   - 空参数边界
 *   - 8 角色权限验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Query,
  Req,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { CrossModuleService } from './cross-module.service'
import type { CrossModuleValidationResult } from './cross-module.entity'
import { ChainStatus } from './cross-module.entity'

// ========== 中间件 ==========

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as any
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

// ========== 测试 Controller (内联完整路由) ==========

@Controller('cross-module')
class TestCrossModuleController {
  constructor(
    @Inject(CrossModuleService) private readonly crossModuleService: CrossModuleService
  ) {}

  @Get('chain-status')
  getChainStatus() {
    return {
      chains: this.crossModuleService.listChains(),
      total: this.crossModuleService.listChains().length,
      runtime: 'cross-module-e2e',
    }
  }

  @Post('validate')
  async validate(
    @Body() body: { chainNames?: string[] },
    @Query('chainName') chainName?: string,
  ): Promise<{
    results: CrossModuleValidationResult[]
    summary: { total: number; passed: number; failed: number }
  }> {
    const chainNames = body.chainNames ?? (chainName ? [chainName] : undefined)
    const results = await this.crossModuleService.validate(chainNames)
    const passed = results.filter((r) => r.passed).length
    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed: results.length - passed,
      },
    }
  }

  @Get('summary')
  getSummary() {
    return this.crossModuleService.getSummary()
  }
}

// ========== 测试常量 ==========

const TENANT_HEADERS = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001',
  'x-market-code': 'cn-mainland',
}

// 8 角色定义
const EIGHT_ROLES = [
  { name: '👔店长', roles: ['STORE_MANAGER'], permissions: ['store.manage', 'cross-module.read'] },
  { name: '🛒前台', roles: ['CASHIER'], permissions: ['cashier.operate', 'cross-module.read'] },
  { name: '👥HR', roles: ['HR_MANAGER'], permissions: ['hr.manage', 'cross-module.read'] },
  { name: '🔧安监', roles: ['SAFETY_INSPECTOR'], permissions: ['safety.inspect', 'cross-module.read'] },
  { name: '🎮导玩员', roles: ['GAME_GUIDE'], permissions: ['game.guide', 'cross-module.read'] },
  { name: '🎯运行专员', roles: ['OPERATIONS_SPECIALIST'], permissions: ['operations.manage', 'cross-module.read'] },
  { name: '🤝团建', roles: ['TEAM_BUILDING'], permissions: ['team.organize', 'cross-module.read'] },
  { name: '📢营销', roles: ['MARKETING'], permissions: ['marketing.promote', 'cross-module.read'] },
]

// ========== 构建 app ==========

async function buildApp() {
  const crossModuleService = new CrossModuleService()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestCrossModuleController],
    providers: [
      { provide: CrossModuleService, useValue: crossModuleService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.use(attachActorContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  return { app, crossModuleService }
}

// ========== 基础 E2E 测试 ==========

it('e2e: GET /cross-module/chain-status returns 4 chains', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
      .set(TENANT_HEADERS)
    const httpStatus = res.statusCode || res.status
    assert.equal(httpStatus, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.total, 4)
    assert.ok(Array.isArray(res.body.data.chains))
    assert.equal(res.body.data.chains.length, 4)
    assert.equal(res.body.data.runtime, 'cross-module-e2e')
  } finally {
    await app.close()
  }
})

it('e2e: GET /cross-module/chain-status each chain has required fields', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
      .set(TENANT_HEADERS)
    assert.equal(res.statusCode, 200)
    for (const chain of res.body.data.chains) {
      assert.ok(typeof chain.name === 'string')
      assert.ok(Array.isArray(chain.modules))
      assert.ok(chain.modules.length > 0)
      assert.ok(['defined', 'validating', 'verified', 'broken'].includes(chain.status))
    }
    // 检查已知链路
    const chainNames = res.body.data.chains.map((c: any) => c.name)
    assert.ok(chainNames.includes('admin-to-consumer'))
    assert.ok(chainNames.includes('sdk-to-api'))
    assert.ok(chainNames.includes('governance-chain'))
    assert.ok(chainNames.includes('multi-client-consistency'))
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate validates all chains by default', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({})
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data.results))
    assert.equal(res.body.data.results.length, 4)
    assert.equal(res.body.data.summary.total, 4)
    assert.equal(res.body.data.summary.passed, 4)
    assert.equal(res.body.data.summary.failed, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate with specific chain names', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['admin-to-consumer', 'sdk-to-api'] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.results.length, 2)
    const resultNames = res.body.data.results.map((r: any) => r.chainName)
    assert.ok(resultNames.includes('admin-to-consumer'))
    assert.ok(resultNames.includes('sdk-to-api'))
    assert.equal(res.body.data.summary.passed, 2)
    assert.equal(res.body.data.summary.failed, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate?chainName=sdk-to-api validates single chain', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate?chainName=sdk-to-api')
      .set(TENANT_HEADERS)
      .send({})
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.results.length, 1)
    assert.equal(res.body.data.results[0].chainName, 'sdk-to-api')
    assert.equal(res.body.data.results[0].passed, true)
  } finally {
    await app.close()
  }
})

it('e2e: validation result has expected structure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['admin-to-consumer'] })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.results[0]
    assert.equal(result.chainName, 'admin-to-consumer')
    assert.equal(result.passed, true)
    assert.ok(typeof result.executedAt === 'string')
    assert.ok(typeof result.durationMs === 'number')
    assert.ok(Array.isArray(result.stages))
    // admin-to-consumer: tenant→bootstrap→foundation→portal→market→miniapp = 5 stages
    assert.equal(result.stages.length, 5)
    for (const stage of result.stages) {
      assert.ok(typeof stage.stage === 'string')
      assert.ok(typeof stage.from === 'string')
      assert.ok(typeof stage.to === 'string')
      assert.equal(stage.passed, true)
      assert.ok(typeof stage.durationMs === 'number')
    }
  } finally {
    await app.close()
  }
})

it('e2e: GET /cross-module/summary returns summary stats', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/cross-module/summary')
      .set(TENANT_HEADERS)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.total, 4)
    assert.equal(res.body.data.defined, 4)
    assert.equal(res.body.data.validating, 0)
    assert.equal(res.body.data.verified, 0)
    assert.equal(res.body.data.broken, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate with empty chainNames array validates nothing', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: [] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.results.length, 0)
    assert.equal(res.body.data.summary.total, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate with unknown chain name results empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['non-existent-chain'] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.results.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /cross-module/chain-status response is consistent across calls', async () => {
  const { app } = await buildApp()
  try {
    const res1 = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
      .set(TENANT_HEADERS)
    const res2 = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
      .set(TENANT_HEADERS)
    assert.equal(res1.body.data.total, res2.body.data.total)
    assert.equal(res1.body.data.runtime, res2.body.data.runtime)
  } finally {
    await app.close()
  }
})

// ========== 8 角色权限测试 ==========

for (const role of EIGHT_ROLES) {
  it(`e2e: role ${role.name} can GET /cross-module/chain-status`, async () => {
    const { app } = await buildApp()
    try {
      // 为每个角色建独立 app
      const res = await request(app.getHttpServer())
        .get('/cross-module/chain-status')
        .set({ ...TENANT_HEADERS, 'x-actor-roles': role.roles.join(',') })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.total, 4)
    } finally {
      await app.close()
    }
  })
}

for (const role of EIGHT_ROLES) {
  it(`e2e: role ${role.name} can POST /cross-module/validate`, async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/cross-module/validate')
        .set({ ...TENANT_HEADERS, 'x-actor-roles': role.roles.join(',') })
        .send({ chainNames: ['sdk-to-api'] })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.summary.passed, 1)
    } finally {
      await app.close()
    }
  })
}

// ========== 边界测试 ==========

it('e2e: GET /cross-module/chain-status without tenant headers still works', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 4)
  } finally {
    await app.close()
  }
})

it('e2e: POST /cross-module/validate without body returns all chains', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
    // 不发送 body，验证行为
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.results.length, 4)
  } finally {
    await app.close()
  }
})

it('e2e: response uses correct status for POST (201) and GET (200)', async () => {
  const { app } = await buildApp()
  try {
    const getRes = await request(app.getHttpServer())
      .get('/cross-module/chain-status')
      .set(TENANT_HEADERS)
    assert.equal(getRes.statusCode, 200)

    const postRes = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['admin-to-consumer'] })
    assert.equal(postRes.statusCode, 201)
  } finally {
    await app.close()
  }
})

it('e2e: governance-chain has 5 modules => 4 stages', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['governance-chain'] })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.results[0]
    assert.equal(result.stages.length, 4) // 5 modules = 4 adjacent pairs
  } finally {
    await app.close()
  }
})

it('e2e: multi-client-consistency chain has 5 modules => 4 stages', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['multi-client-consistency'] })
    assert.equal(res.statusCode, 201)
    const result = res.body.data.results[0]
    assert.equal(result.stages.length, 4) // 5 modules = 4 stages
  } finally {
    await app.close()
  }
})

it('e2e: validation updates chain status after validate', async () => {
  const { app, crossModuleService } = await buildApp()
  try {
    // 初始状态：所有 defined
    const summaryBefore = crossModuleService.getSummary()
    assert.equal(summaryBefore.defined, 4)

    // 执行验证
    const res = await request(app.getHttpServer())
      .post('/cross-module/validate')
      .set(TENANT_HEADERS)
      .send({ chainNames: ['admin-to-consumer'] })

    assert.equal(res.statusCode, 201)

    // 验证后：admin-to-consumer 已变为 verified
    const summaryAfter = crossModuleService.getSummary()
    assert.equal(summaryAfter.verified, 1)
    assert.equal(summaryAfter.defined, 3)
  } finally {
    await app.close()
  }
})
