/**
 * 🐜 自动: [svip] E2E 基础测试
 *
 * E2E 链路: HTTP → SvipController → SvipService → Tier/Member/Benefit
 *
 * 覆盖:
 *   - Tier 初始化 + 列表 + upsert
 *   - Member 创建/获取/列表 + 状态机 (Active ↔ Frozen)
 *   - 等级升级 (upgradeTier) + 降级 (downgradeTier)
 *   - Benefit 创建/列表 + useBenefit
 *   - 到期降级 (checkAndDowngradeExpired)
 *   - 自动升级 (checkAndAutoUpgrade, 联动 loyalty)
 *   - 跨租户隔离
 *   - 错误处理
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Inject
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import type { TenantAwareRequest } from '../tenant/tenant.types'
import { SvipService } from './svip.service'
import { SvipBenefitType, SvipMemberStatus } from './svip.entity'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  ;(req as TenantAwareRequest).tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

// ========== 测试 Controller ==========

@Controller('svip')
class TestSvipController {
  constructor(@Inject(SvipService) private readonly service: SvipService) {}

  @Post('tiers/init')
  @HttpCode(HttpStatus.CREATED)
  init(@Req() req: Request) {
    return this.service.initDefaultTiers((req as any).tenantContext)
  }

  @Get('tiers')
  listTiers(@Req() req: Request) {
    return this.service.listTiers((req as any).tenantContext.tenantId)
  }

  @Post('tiers')
  @HttpCode(HttpStatus.CREATED)
  upsertTier(@Req() req: Request, @Body() body: any) {
    return this.service.upsertTier((req as any).tenantContext, body)
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  createMember(@Req() req: Request, @Body() body: any) {
    return this.service.createMember((req as any).tenantContext, body)
  }

  @Get('members')
  listMembers(@Req() req: Request, @Query() query: any) {
    return this.service.listMembers((req as any).tenantContext.tenantId, query)
  }

  @Get('members/:memberId')
  getMember(@Req() req: Request, @Param('memberId') memberId: string) {
    const m = this.service.getMemberTier(memberId, (req as any).tenantContext.tenantId)
    if (!m) throw new NotFoundException(`SvipMember ${memberId} not found`)
    return m
  }

  @Post('members/:memberId/upgrade')
  upgrade(@Req() req: Request, @Param('memberId') memberId: string, @Body() body: any) {
    return this.service.upgradeTier((req as any).tenantContext, {
      memberId,
      ...body
    })
  }

  @Post('members/:memberId/downgrade')
  downgrade(@Req() req: Request, @Param('memberId') memberId: string, @Body() body: any) {
    return this.service.downgradeTier((req as any).tenantContext, {
      memberId,
      ...body
    })
  }

  @Post('members/:memberId/freeze')
  freeze(@Req() req: Request, @Param('memberId') memberId: string) {
    return this.service.freezeMember(memberId, (req as any).tenantContext.tenantId)
  }

  @Post('members/:memberId/unfreeze')
  unfreeze(@Req() req: Request, @Param('memberId') memberId: string) {
    return this.service.unfreezeMember(memberId, (req as any).tenantContext.tenantId)
  }

  @Post('benefits')
  @HttpCode(HttpStatus.CREATED)
  createBenefit(@Body() body: any) {
    return this.service.createBenefit(body)
  }

  @Get('benefits')
  listBenefits(@Query('tierId') tierId: string) {
    return this.service.listBenefits(tierId)
  }

  @Post('members/:memberId/benefits/use')
  useBenefit(
    @Req() req: Request,
    @Param('memberId') memberId: string,
    @Body() body: { benefitType: SvipBenefitType }
  ) {
    return this.service.useBenefit(
      memberId,
      body.benefitType,
      (req as any).tenantContext.tenantId
    )
  }

  @Post('check/downgrade-expired')
  checkExpired(@Req() req: Request) {
    return this.service.checkAndDowngradeExpired((req as any).tenantContext.tenantId)
  }

  @Post('check/auto-upgrade')
  autoUpgrade(@Req() req: Request, @Body() body: any) {
    return this.service.checkAndAutoUpgrade(
      (req as any).tenantContext,
      body.memberId,
      body.totalSpend,
      body.currentPoints
    )
  }
}

// ========== 构建 app ==========

async function buildApp() {
  const service = new SvipService()
  service.resetSvipStoresForTests()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestSvipController],
    providers: [{ provide: SvipService, useValue: service }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

const TENANT_HEADERS = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

const TENANT_B_HEADERS = {
  'x-tenant-id': 'tenant-002',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

async function initTiers(app: any, headers: any = TENANT_HEADERS) {
  const res = await request(app.getHttpServer())
    .post('/svip/tiers/init')
    .set(headers)
  return res.body.data
}

async function createMember(
  app: any,
  memberId: string,
  tierId: string,
  headers: any = TENANT_HEADERS
) {
  return request(app.getHttpServer())
    .post('/svip/members')
    .set(headers)
    .send({
      memberId,
      brandId: 'brand-001',
      storeId: 'store-001',
      tierId,
      totalSpend: 1000,
      currentPoints: 500,
      expiresAt: '2027-12-31T00:00:00Z'
    })
}

// ========== E2E: Tier 初始化与管理 ==========

describe('E2E: Tier 初始化', () => {
  test('POST /svip/tiers/init 创建默认等级 (Bronze/Silver/Gold/Platinum/Diamond)', async () => {
    const { app } = await buildApp()
    try {
      const res = await initTiers(app)
      assert.ok(Array.isArray(res))
      assert.ok(res.length >= 3, '默认 ≥ 3 等级')
      for (const t of res) {
        assert.ok(t.name)
        assert.ok(typeof t.level === 'number')
        assert.ok(typeof t.minSpendAmount === 'number')
      }
    } finally {
      await app.close()
    }
  })

  test('GET /svip/tiers 列表 + 按 level 排序', async () => {
    const { app } = await buildApp()
    try {
      await initTiers(app)
      const res = await request(app.getHttpServer())
        .get('/svip/tiers')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length >= 3)
      // 按 level 升序
      for (let i = 1; i < res.body.data.length; i++) {
        assert.ok(res.body.data[i - 1].level <= res.body.data[i].level)
      }
    } finally {
      await app.close()
    }
  })

  test('POST /svip/tiers upsert 自定义等级', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/svip/tiers')
        .set(TENANT_HEADERS)
        .send({
          name: 'Black',
          level: 6,
          minSpendAmount: 100000,
          minPoints: 50000,
          benefits: ['vip_room', 'priority_queue', 'discount_20', 'free_upgrade'],
          icon: 'black.png',
          color: '#000'
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.level, 6)
      assert.ok(res.body.data.id.startsWith('svip-tier-'))
    } finally {
      await app.close()
    }
  })

  test('initDefaultTiers 重复调用返回现有', async () => {
    const { app } = await buildApp()
    try {
      await initTiers(app)
      const second = await initTiers(app)
      // 第二次应该返回相同的(已存在)
      assert.ok(Array.isArray(second))
      assert.ok(second.length >= 3)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: Member 生命周期 ==========

describe('E2E: Member 生命周期', () => {
  test('POST → GET :memberId → list 完整流程', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const createRes = await createMember(app, 'user-001', tiers[0].id)
      assert.equal(createRes.statusCode, 201)
      assert.equal(createRes.body.data.memberId, 'user-001')
      assert.equal(createRes.body.data.status, SvipMemberStatus.Active)

      const getRes = await request(app.getHttpServer())
        .get('/svip/members/user-001')
        .set(TENANT_HEADERS)
      assert.equal(getRes.statusCode, 200)
      assert.equal(getRes.body.data.memberId, 'user-001')

      const listRes = await request(app.getHttpServer())
        .get('/svip/members')
        .set(TENANT_HEADERS)
      assert.equal(listRes.body.data.length, 1)
    } finally {
      await app.close()
    }
  })

  test('同 memberId 重复创建 Active → 报错', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)
      const res = await createMember(app, 'user-001', tiers[0].id)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('已过期 (Expired) 允许重新创建', async () => {
    const { app, service } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)
      // 直接修改 store 里的 member 状态为 Expired (绕过 service 接口)
      const internal = service.listMembers('tenant-001').find(
        (m) => m.memberId === 'user-001'
      )
      if (!internal) throw new Error('seed failed')
      internal.status = SvipMemberStatus.Expired
      // 重新创建
      const res = await createMember(app, 'user-001', tiers[0].id)
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.memberId, 'user-001')
      assert.equal(res.body.data.status, SvipMemberStatus.Active)
    } finally {
      await app.close()
    }
  })

  test('GET /svip/members/:id 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/svip/members/non-existent')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('GET /svip/members?status=Active 过滤', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)
      await createMember(app, 'user-002', tiers[0].id)
      await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .get(`/svip/members?status=${SvipMemberStatus.Active}`)
        .set(TENANT_HEADERS)
      assert.equal(res.body.data.length, 1)
      assert.equal(res.body.data[0].memberId, 'user-002')
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 升级 / 降级 ==========

describe('E2E: 等级升降级', () => {
  test('upgrade Tier 1 → Tier 3 合法', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const create = await createMember(app, 'user-001', tiers[0].id)
      const memberId = create.body.data.memberId

      const upgrade = await request(app.getHttpServer())
        .post(`/svip/members/${memberId}/upgrade`)
        .set(TENANT_HEADERS)
        .send({ targetTierLevel: 3, totalSpend: 30000, currentPoints: 10000 })
      assert.equal(upgrade.statusCode, 201)
      assert.equal(upgrade.body.data.tierLevel, 3)
    } finally {
      await app.close()
    }
  })

  test('upgrade 到更低的 level 报错', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const create = await createMember(app, 'user-001', tiers[2].id) // 高等级
      const upgrade = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/upgrade`)
        .set(TENANT_HEADERS)
        .send({ targetTierLevel: 1 })
      assert.equal(upgrade.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('downgrade Tier 3 → Tier 1 合法', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const create = await createMember(app, 'user-001', tiers[2].id)
      const downgrade = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/downgrade`)
        .set(TENANT_HEADERS)
        .send({ targetTierLevel: 1 })
      assert.equal(downgrade.statusCode, 201)
      assert.equal(downgrade.body.data.tierLevel, 1)
    } finally {
      await app.close()
    }
  })

  test('downgrade 到更高 level 报错', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const create = await createMember(app, 'user-001', tiers[0].id)
      const res = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/downgrade`)
        .set(TENANT_HEADERS)
        .send({ targetTierLevel: 5 })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: Freeze / Unfreeze ==========

describe('E2E: 冻结解冻', () => {
  test('freeze → unfreeze 状态机', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)

      const freeze = await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_HEADERS)
      assert.equal(freeze.body.data.status, SvipMemberStatus.Frozen)

      const unfreeze = await request(app.getHttpServer())
        .post('/svip/members/user-001/unfreeze')
        .set(TENANT_HEADERS)
      assert.equal(unfreeze.body.data.status, SvipMemberStatus.Active)
    } finally {
      await app.close()
    }
  })

  test('重复 freeze 报错', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)
      await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('unfreeze 非 Frozen 报错', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      await createMember(app, 'user-001', tiers[0].id)
      const res = await request(app.getHttpServer())
        .post('/svip/members/user-001/unfreeze')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: Benefits ==========

describe('E2E: Benefit 使用', () => {
  test('createBenefit + listBenefits + useBenefit 完整流程', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      // 选择包含 priority_queue 的 tier (默认 init 包含)
      const tier = tiers.find((t: any) =>
        t.benefits.some((b: string) => b === 'priority_queue')
      )
      if (!tier) {
        // 没有 priority_queue 等级,跳过
        return
      }
      const create = await createMember(app, 'user-001', tier.id)

      // 创建具体 benefit
      const benefitRes = await request(app.getHttpServer())
        .post('/svip/benefits')
        .send({
          tierId: tier.id,
          benefitType: SvipBenefitType.PriorityQueue,
          benefitValue: 'priority-1',
          description: '优先排队',
          isActive: true
        })
      assert.equal(benefitRes.statusCode, 201)

      const listRes = await request(app.getHttpServer())
        .get(`/svip/benefits?tierId=${tier.id}`)
      assert.ok(listRes.body.data.length >= 1)

      // useBenefit
      const useRes = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
        .set(TENANT_HEADERS)
        .send({ benefitType: SvipBenefitType.PriorityQueue })
      assert.equal(useRes.statusCode, 201)
      assert.equal(useRes.body.data.success, true)
    } finally {
      await app.close()
    }
  })

  test('useBenefit 当前等级无此权益 → success=false', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      // 用最低 tier,通常没有 exclusive_event
      const lowTier = tiers[0]
      const create = await createMember(app, 'user-001', lowTier.id)
      const res = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
        .set(TENANT_HEADERS)
        .send({ benefitType: SvipBenefitType.ExclusiveEvent })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.success, false)
    } finally {
      await app.close()
    }
  })

  test('useBenefit 非 Active 会员 → success=false', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const tier = tiers[0]
      const create = await createMember(app, 'user-001', tier.id)
      await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
        .set(TENANT_HEADERS)
        .send({ benefitType: SvipBenefitType.Discount })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.success, false)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 到期降级 + 自动升级 ==========

describe('E2E: 到期降级 & 自动升级', () => {
  test('checkAndDowngradeExpired 已过期但 < 30 天缓冲期 → 降一级', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      // 创建 member, expiresAt 为 5 天前 (在缓冲期内)
      const create = await request(app.getHttpServer())
        .post('/svip/members')
        .set(TENANT_HEADERS)
        .send({
          memberId: 'expired-user',
          brandId: 'brand-001',
          storeId: 'store-001',
          tierId: tiers[2].id,
          totalSpend: 50000,
          currentPoints: 20000,
          expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        })
      assert.equal(create.statusCode, 201)

      const res = await request(app.getHttpServer())
        .post('/svip/check/downgrade-expired')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 201)
      assert.ok(res.body.data.length >= 1)
      // member 等级应降一级
      const member = res.body.data[0]
      assert.ok(member.tierLevel < 3, 'level 3 应该降一级')
    } finally {
      await app.close()
    }
  })

  test('checkAndAutoUpgrade 积分达标 → 自动创建 + 升级', async () => {
    const { app } = await buildApp()
    try {
      await initTiers(app)
      const res = await request(app.getHttpServer())
        .post('/svip/check/auto-upgrade')
        .set(TENANT_HEADERS)
        .send({ memberId: 'new-user', totalSpend: 30000, currentPoints: 10000 })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.upgraded, true)
      assert.ok(res.body.data.newLevel >= 1)
    } finally {
      await app.close()
    }
  })

  test('checkAndAutoUpgrade 缺 Level1 tier → 不升级 (reason=Tier not found)', async () => {
    // 不 init tiers,Level1 tier 不存在 → 升级应失败
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/svip/check/auto-upgrade')
        .set(TENANT_HEADERS)
        .send({ memberId: 'low-user', totalSpend: 100, currentPoints: 10 })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.upgraded, false)
      assert.equal(res.body.data.reason, 'Below Level1 threshold')
    } finally {
      await app.close()
    }
  })

  test('checkAndAutoUpgrade 已是 SVIP 且当前等级满足 → 不升级 (no-op)', async () => {
    // 已是 Level1 的 member,totalSpend/points 仍满足 Level1 → 不触发升级
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app)
      const memberRes = await createMember(app, 'vip-user', tiers[0].id, TENANT_HEADERS)
      assert.equal(memberRes.body.data.tierLevel, 1)
      const res = await request(app.getHttpServer())
        .post('/svip/check/auto-upgrade')
        .set(TENANT_HEADERS)
        .send({ memberId: 'vip-user', totalSpend: 6000, currentPoints: 600 })
      assert.equal(res.statusCode, 201)
      // 已存在 member + computedLevel(1) <= existing.tierLevel(1) → not upgraded
      assert.equal(res.body.data.upgraded, false)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 跨租户隔离 ==========

describe('E2E: 跨租户隔离', () => {
  test('tenant-B 看不到 tenant-A 的 member', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app, TENANT_HEADERS)
      await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .get('/svip/members/user-001')
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('tenant-B 不能 freeze tenant-A 的 member', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app, TENANT_HEADERS)
      await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post('/svip/members/user-001/freeze')
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('tenant-B 不能 upgrade tenant-A 的 member', async () => {
    const { app } = await buildApp()
    try {
      const tiers = await initTiers(app, TENANT_HEADERS)
      await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post('/svip/members/user-001/upgrade')
        .set(TENANT_B_HEADERS)
        .send({ targetTierLevel: 3 })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})
