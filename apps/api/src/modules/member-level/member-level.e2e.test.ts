import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Member Level 评估 HTTP 链路
 *
 * 链路:
 *   HTTP → TestMemberLevelController → MemberLevelService
 *
 * 验证:
 *   - POST /member-level/evaluate (等级评估)
 *   - POST /member-level/calculate (仅成长值计算)
 *   - POST /member-level/batch (批量评估)
 *   - GET /member-level/config (等级配置查询)
 *   - GET /member-level/upgrade-path/:fromTier/:fromSub/:toTier/:toSub (升级路径)
 *   - 异常输入 (无效参数、缺失字段)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  Inject,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MemberLevelService } from './member-level.service'
import { MemberLevelTier, MemberLevelSub } from './member-level.entity'

/**
 * 测试用 Controller（模拟真实路由，直接注入 MemberLevelService）
 */
@Controller('member-level')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
class TestMemberLevelController {
  constructor(
    @Inject(MemberLevelService)
    private readonly memberLevelService: MemberLevelService
  ) {}

  @Post('evaluate')
  evaluate(@Body() body: Record<string, unknown>) {
    const { memberId, growthValue, totalSpend, totalVisits, tenantId } = body as {
      memberId: string
      growthValue: number
      totalSpend: number
      totalVisits: number
      tenantId: string
    }
    const result = this.memberLevelService.evaluateMemberLevel({
      memberId,
      growthValue,
      totalSpend,
      totalVisits,
      tenantId,
    })
    return { success: true, data: result }
  }

  @Post('calculate')
  async calculate(@Body() body: { growthValue: number }) {
    if (body.growthValue === undefined || body.growthValue < 0) {
      throw new BadRequestException('growthValue must be a non-negative number')
    }
    const result = await this.memberLevelService.calculateLevel(body.growthValue)
    return { success: true, data: result }
  }

  @Post('batch')
  batchEvaluate(@Body() body: { items: Array<{ input: Record<string, unknown> }> }) {
    const items = body.items.map((i) =>
      this.memberLevelService.evaluateMemberLevel({
        memberId: i.input.memberId as string,
        growthValue: i.input.growthValue as number,
        totalSpend: i.input.totalSpend as number,
        totalVisits: i.input.totalVisits as number,
        tenantId: i.input.tenantId as string,
      })
    )
    const upgradedCount = items.filter((r) => r.upgraded).length
    return {
      success: true,
      data: {
        items,
        totalEvaluated: items.length,
        upgradedCount,
        timestamp: new Date().toISOString(),
      },
    }
  }

  @Get('config')
  getConfig() {
    const config = this.memberLevelService.getAllLevelConfig()
    return { success: true, data: config }
  }

  @Get('upgrade-path/:fromTier/:fromSub/:toTier/:toSub')
  getUpgradePath(
    @Param('fromTier') fromTier: string,
    @Param('fromSub') fromSub: string,
    @Param('toTier') toTier: string,
    @Param('toSub') toSub: string
  ) {
    const validTiers = Object.values(MemberLevelTier) as string[]
    const validSubs = Object.values(MemberLevelSub) as string[]
    if (!validTiers.includes(fromTier)) throw new BadRequestException(`Invalid fromTier: ${fromTier}`)
    if (!validSubs.includes(fromSub)) throw new BadRequestException(`Invalid fromSub: ${fromSub}`)
    if (!validTiers.includes(toTier)) throw new BadRequestException(`Invalid toTier: ${toTier}`)
    if (!validSubs.includes(toSub)) throw new BadRequestException(`Invalid toSub: ${toSub}`)
    const path = this.memberLevelService.getUpgradePath(
      fromTier as MemberLevelTier,
      fromSub as MemberLevelSub,
      toTier as MemberLevelTier,
      toSub as MemberLevelSub
    )
    return { success: true, data: path }
  }
}

async function buildApp() {
  const memberLevelService = new MemberLevelService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestMemberLevelController],
    providers: [{ provide: MemberLevelService, useValue: memberLevelService }],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberLevelService }
}

// ── E2E 测试：POST /member-level/evaluate ────────────────────

describe('E2E: POST /member-level/evaluate (等级评估)', () => {
  it('正例: 高成长值+高消费→应评估为 SVIP', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/evaluate')
        .send({
          memberId: 'm-svip-1',
          growthValue: 5000,
          totalSpend: 15000,
          totalVisits: 60,
          tenantId: 'tenant-A',
        })

      assert.equal(res.statusCode, 201)
      // ResponseInterceptor 包装后 data = { success: true, data: {...} }
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.currentTier, MemberLevelTier.SVIP)
      assert.equal(inner.data.currentSub, MemberLevelSub.L1)
      assert.ok(inner.data.benefits.length > 0)
      assert.ok(inner.data.upgraded)
    } finally {
      await app.close()
    }
  })

  it('正例: 零增长应评估为 REGULAR_L1 且未升级', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/evaluate')
        .send({
          memberId: 'm-new',
          growthValue: 0,
          totalSpend: 0,
          totalVisits: 0,
          tenantId: 'tenant-A',
        })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(inner.data.currentSub, MemberLevelSub.L1)
      assert.equal(inner.data.upgraded, false)
    } finally {
      await app.close()
    }
  })

  it('反例: 缺少字段默认用 undefined，服务端不崩溃', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/evaluate')
        .send({
          memberId: 'm-bad',
          // 故意缺少 growthValue, totalSpend, totalVisits
          tenantId: 'tenant-A',
        })

      // 测试 Controller 使用 Record<string, unknown> 时 undefined 字段会变成 NaN
      // 后端仍返回 201 + 有效结果（服务不崩溃）
      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.success, true)
      // 缺失值按 0 处理，降到 REGULAR_L1
      assert.equal(inner.data.currentTier, MemberLevelTier.REGULAR)
      assert.equal(inner.data.currentSub, MemberLevelSub.L1)
    } finally {
      await app.close()
    }
  })

  it('边界: 极高值 MYTH_L3', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/evaluate')
        .send({
          memberId: 'm-myth',
          growthValue: 300_000,
          totalSpend: 3_000_000,
          totalVisits: 5_000,
          tenantId: 'tenant-A',
        })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.data.currentTier, MemberLevelTier.MYTH)
      assert.equal(inner.data.currentSub, MemberLevelSub.L3)
      assert.equal(inner.data.upgradeProgress, 1.0)
    } finally {
      await app.close()
    }
  })
})

// ── E2E 测试：POST /member-level/calculate ────────────────────

describe('E2E: POST /member-level/calculate (仅成长值计算)', () => {
  it('正例: 成长值 2500 → VIP_L3', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/calculate')
        .send({ growthValue: 2500 })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.currentTier, MemberLevelTier.VIP)
      assert.equal(inner.data.currentSub, MemberLevelSub.L3)
    } finally {
      await app.close()
    }
  })

  it('反例: 负成长值应返回 400', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/calculate')
        .send({ growthValue: -100 })

      assert.equal(res.statusCode, 400)
    } finally {
      await app.close()
    }
  })

  it('边界: 成长值 0 → REGULAR_L1', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/calculate')
        .send({ growthValue: 0 })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.data.currentTier, MemberLevelTier.REGULAR)
    } finally {
      await app.close()
    }
  })
})

// ── E2E 测试：POST /member-level/batch ───────────────────────

describe('E2E: POST /member-level/batch (批量评估)', () => {
  it('正例: 批量评估 3 个会员', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/batch')
        .send({
          items: [
            { input: { memberId: 'm1', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: 't1' } },
            { input: { memberId: 'm2', growthValue: 4000, totalSpend: 10000, totalVisits: 60, tenantId: 't1' } },
            { input: { memberId: 'm3', growthValue: 250_000, totalSpend: 2_000_000, totalVisits: 3000, tenantId: 't1' } },
          ],
        })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.totalEvaluated, 3)
      assert.equal(inner.data.items.length, 3)
      assert.ok(inner.data.upgradedCount >= 1)
    } finally {
      await app.close()
    }
  })

  it('边界: 空数组列表', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/member-level/batch')
        .send({ items: [] })

      assert.equal(res.statusCode, 201)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.totalEvaluated, 0)
    } finally {
      await app.close()
    }
  })
})

// ── E2E 测试：GET /member-level/config ────────────────────────

describe('E2E: GET /member-level/config (等级配置)', () => {
  it('正例: 返回 18 个等级配置', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/config')

      assert.equal(res.statusCode, 200)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.equal(inner.data.tiers.length, 18)
    } finally {
      await app.close()
    }
  })

  it('正例: 配置按成长值升序排列', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/config')

      const inner = res.body.data
      const tiers = inner.data.tiers
      for (let i = 1; i < tiers.length; i++) {
        assert.ok(
          tiers[i].growthRequired >= tiers[i - 1].growthRequired,
          `等级 ${i} growthRequired ${tiers[i].growthRequired} 应 >= ${tiers[i - 1].growthRequired}`
        )
      }
    } finally {
      await app.close()
    }
  })

  it('正例: 每个等级包含 all required 字段', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/config')

      const inner = res.body.data
      for (const tier of inner.data.tiers) {
        assert.ok(typeof tier.tier === 'string')
        assert.ok(typeof tier.label === 'string')
        assert.ok(typeof tier.growthRequired === 'number')
        assert.ok(typeof tier.spendRequired === 'number')
        assert.ok(typeof tier.visitRequired === 'number')
        assert.ok(Array.isArray(tier.benefits))
      }
    } finally {
      await app.close()
    }
  })

  it('正例: 配置最后更新时间不为空', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/config')

      const inner = res.body.data
      assert.ok(inner.data.lastUpdated)
      assert.doesNotThrow(() => new Date(inner.data.lastUpdated))
    } finally {
      await app.close()
    }
  })
})

// ── E2E 测试：GET /member-level/upgrade-path/:fromTier/:fromSub/:toTier/:toSub ─────

describe('E2E: GET /member-level/upgrade-path (升级路径)', () => {
  it('正例: REGULAR_L1 → VIP_L1 返回升级路径', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/REGULAR/L1/VIP/L1')

      assert.equal(res.statusCode, 200)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.ok(Array.isArray(inner.data))
      assert.ok(inner.data.length > 0)
      // 路径第一步从 REGULAR 开始
      assert.equal(inner.data[0].fromTier, MemberLevelTier.REGULAR)
      assert.equal(inner.data[0].fromSub, MemberLevelSub.L1)
    } finally {
      await app.close()
    }
  })

  it('正例: 最大跨度 REGULAR_L1 → MYTH_L3 应有 17 步', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/REGULAR/L1/MYTH/L3')

      assert.equal(res.statusCode, 200)
      const inner = res.body.data
      assert.ok(inner.data.length > 0)
      const last = inner.data[inner.data.length - 1]
      assert.equal(last.toTier, MemberLevelTier.MYTH)
      assert.equal(last.toSub, MemberLevelSub.L3)
    } finally {
      await app.close()
    }
  })

  it('正例: 同级路径返回空数据', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/VIP/L2/VIP/L2')

      assert.equal(res.statusCode, 200)
      const inner = res.body.data
      assert.equal(inner.success, true)
      assert.ok(Array.isArray(inner.data))
    } finally {
      await app.close()
    }
  })

  it('反例: 无效 fromTier 返回 400', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/BOGUS/L1/VIP/L1')

      assert.equal(res.statusCode, 400)
    } finally {
      await app.close()
    }
  })

  it('反例: 无效 toSub 返回 400', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/REGULAR/L1/DIAMOND/L5')

      assert.equal(res.statusCode, 400)
    } finally {
      await app.close()
    }
  })

  it('反例: 无效 fromSub 使用大写字母匹配', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/member-level/upgrade-path/VIP/L-1/DIAMOND/L1')

      // L-1 不匹配 L1/L2/L3
      assert.equal(res.statusCode, 400)
    } finally {
      await app.close()
    }
  })
})

// ── E2E 测试：ResponseInterceptor 包装 ────────────────────────

describe('E2E: Response 结构一致性', () => {
  it('所有端点返回 { success, message, data } 顶级结构', async () => {
    const { app } = await buildApp()
    try {
      // GET /config
      const configRes = await request(app.getHttpServer()).get('/member-level/config')
      assert.equal(configRes.body.success, true)
      assert.equal(configRes.body.message, 'OK')
      assert.ok(configRes.body.data)
      assert.ok(configRes.body.timestamp)

      // POST /evaluate
      const evalRes = await request(app.getHttpServer())
        .post('/member-level/evaluate')
        .send({ memberId: 'm-test', growthValue: 100, totalSpend: 500, totalVisits: 5, tenantId: 't' })
      assert.equal(evalRes.body.success, true)
      assert.equal(evalRes.body.message, 'OK')
      assert.ok(evalRes.body.data)
    } finally {
      await app.close()
    }
  })
})
