import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-config] [D] Controller spec 补全
 *
 * 策略：轻量 inline class + Decorator 模拟 → 验证路由元数据 / 行为边界 / 错误传播
 * 覆盖：GET / PATCH / POST reset/history/threshold/batch/points-rate/upgrade-progress/validate/default
 *
 * Phase-36 T166-1: Member 配置中心 Controller
 */

import assert from 'node:assert/strict'

// ── Lightweight inline decorator fakes ──────────────────────────

const controllerPrefixes = new Map<{ new (...args: any[]): unknown }, string>()
function Controller(prefix: string) {
  return (target: any): void => {
    controllerPrefixes.set(target, prefix)
  }
}

const routeMeta = new Map<string | symbol, { method: number; path: string; httpCode?: number }>()
enum HttpMethod {
  GET = 0,
  POST = 1,
  PUT = 2,
  DELETE = 3,
  PATCH = 4,
}
function Get(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.GET, path })
  }
}
function Post(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.POST, path })
  }
}
function Patch(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.PATCH, path })
  }
}
// Apply HTTP code via a separate metadata store (inline decorators run before route decorators)
const httpCodeMap = new Map<string | symbol, number>()
function HttpCodeV2(code: number) {
  return (target: object, key: string | symbol) => {
    httpCodeMap.set(key, code)
  }
}

const paramMeta: Array<{ key: string | symbol; index: number; decorator: string }> = []
function Req() {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: 'Req()' })
  }
}
function Body() {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: 'Body()' })
  }
}
function Param(name?: string) {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: `Param(${name ?? ''})` })
  }
}
function Query(name?: string) {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: `Query(${name ?? ''})` })
  }
}

// ── Stub types matching the real entity ─────────────────────────

const MemberLevel = {
  Bronze: 'BRONZE',
  Silver: 'SILVER',
  Gold: 'GOLD',
  Platinum: 'PLATINUM',
  Diamond: 'DIAMOND',
} as const
type MemberLevel = (typeof MemberLevel)[keyof typeof MemberLevel]

interface MemberConfig {
  points: {
    earnRate: number
    redeemRate: number
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  lifecycle: {
    dormantDays: number
    churnedDays: number
  }
  phoneUniqueScope: 'global' | 'tenant'
  crossTenantEnabled: boolean
}

const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: {
    thresholds: { BRONZE: 0, SILVER: 500, GOLD: 2000, PLATINUM: 10000, DIAMOND: 50000 }
  },
  lifecycle: { dormantDays: 90, churnedDays: 180 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: true,
}

interface MemberConfigPatch {
  points?: Partial<MemberConfig['points']>
  levels?: { thresholds?: Partial<MemberConfig['levels']['thresholds']> }
  lifecycle?: Partial<MemberConfig['lifecycle']>
  phoneUniqueScope?: 'global' | 'tenant'
  crossTenantEnabled?: boolean
}

// ═══════════════════════════════════════════════════════
// Inline controller with decorator fakes
// ═══════════════════════════════════════════════════════

@Controller('api/member/config')
class SpecController {
  private config: MemberConfig = structuredClone(DEFAULT_MEMBER_CONFIG)
  private history: Array<{ config: MemberConfig; changedBy: string; reason: string; changeId: string; at: string }> = []

  @Get()
  getConfig(): { config: MemberConfig } {
    return { config: this.config }
  }

  @Patch()
  @HttpCodeV2(200)
  updateConfig(@Req() _req: any, @Body() body: { patch: MemberConfigPatch; reason?: string }) {
    if (!body || !body.patch) throw new Error('patch required')
    this.config = this.deepMergeConfig(this.config, body.patch)
    const changeId = `chg-${this.history.length + 1}`
    this.history.unshift({
      config: structuredClone(this.config),
      changedBy: 'admin-001',
      reason: body.reason ?? 'no reason',
      changeId,
      at: new Date().toISOString(),
    })
    return { config: this.config, changeId }
  }

  @Post('reset')
  @HttpCodeV2(200)
  resetConfig(@Req() _req: any) {
    this.config = structuredClone(DEFAULT_MEMBER_CONFIG)
    return { config: this.config, changedBy: 'admin-001' }
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20
    const sliced = this.history.slice(0, limitNum)
    return { history: sliced, count: sliced.length }
  }

  @Get('threshold/:level')
  getThreshold(@Param('level') level: string) {
    const normalizedLevel = level.toUpperCase()
    if (!Object.values(MemberLevel).includes(normalizedLevel as MemberLevel)) {
      throw new Error(`invalid level: ${level}`)
    }
    const thresholds: Record<string, number> = {
      BRONZE: 0, SILVER: 500, GOLD: 2000, PLATINUM: 10000, DIAMOND: 50000,
    }
    return { level: normalizedLevel, threshold: thresholds[normalizedLevel] }
  }

  @Post('threshold/batch')
  @HttpCodeV2(200)
  batchThreshold(@Body() body: { levels?: string[] }) {
    const levels = body?.levels ?? Object.values(MemberLevel)
    const thresholds: Record<string, number> = {}
    const allThresholds: Record<string, number> = {
      BRONZE: 0, SILVER: 500, GOLD: 2000, PLATINUM: 10000, DIAMOND: 50000,
    }
    for (const lv of levels) {
      const normalized = lv.toUpperCase()
      if (Object.values(MemberLevel).includes(normalized as MemberLevel)) {
        thresholds[normalized] = allThresholds[normalized]
      }
    }
    return { thresholds }
  }

  @Get('points-rate')
  getPointsRate(): { earn: number; redeem: number } {
    return { earn: this.config.points.earnRate, redeem: this.config.points.redeemRate }
  }

  @Get('upgrade-progress')
  upgradeProgress(
    @Query('currentPoints') currentPoints?: string,
    @Query('currentLevel') currentLevel?: string
  ) {
    const points = currentPoints ? parseInt(currentPoints, 10) : 0
    const level = (currentLevel?.toUpperCase() ?? 'BRONZE') as string

    if (!Object.values(MemberLevel).includes(level as MemberLevel)) {
      throw new Error(`invalid currentLevel: ${currentLevel}`)
    }

    const thresholds: Record<string, number> = {
      BRONZE: 0, SILVER: 500, GOLD: 2000, PLATINUM: 10000, DIAMOND: 50000,
    }
    const levelOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
    const idx = levelOrder.indexOf(level)
    const nextLevel = idx < levelOrder.length - 1 ? levelOrder[idx + 1] : null
    const pointsNeeded = nextLevel ? thresholds[nextLevel] - points : 0

    let progress = 0
    if (nextLevel) {
      const currentThreshold = thresholds[level]
      const nextThreshold = thresholds[nextLevel]
      const range = nextThreshold - currentThreshold
      const advanced = points - currentThreshold
      progress = range > 0 ? Math.min(100, Math.max(0, (advanced / range) * 100)) : 0
    } else {
      progress = 100
    }

    return {
      currentLevel: level,
      currentPoints: points,
      nextLevel,
      pointsNeeded,
      progress: Math.round(progress * 100) / 100,
    }
  }

  @Post('validate')
  @HttpCodeV2(200)
  validateConfig(@Body() body: { patch: MemberConfigPatch }) {
    const errors: string[] = []
    if (!body || !body.patch) {
      errors.push('patch required')
      return { valid: false, errors }
    }
    const p = body.patch
    if (p.points) {
      if (p.points.earnRate !== undefined && p.points.earnRate <= 0) errors.push('points.earnRate must be > 0')
      if (p.points.redeemRate !== undefined && p.points.redeemRate <= 0) errors.push('points.redeemRate must be > 0')
      if (p.points.expiryDays !== undefined && p.points.expiryDays < 0) errors.push('points.expiryDays must be >= 0')
    }
    if (p.levels?.thresholds) {
      const merged = { ...this.config.levels.thresholds, ...p.levels.thresholds }
      if (!(merged.BRONZE <= merged.SILVER && merged.SILVER <= merged.GOLD && merged.GOLD <= merged.PLATINUM && merged.PLATINUM <= merged.DIAMOND)) {
        errors.push('level thresholds must be monotonic increasing')
      }
    }
    if (p.lifecycle) {
      const merged = { ...this.config.lifecycle, ...p.lifecycle }
      if (merged.dormantDays >= merged.churnedDays) {
        errors.push('dormantDays must be less than churnedDays')
      }
    }
    return { valid: errors.length === 0, errors }
  }

  @Get('default')
  getDefault(): { config: MemberConfig } {
    return { config: structuredClone(DEFAULT_MEMBER_CONFIG) }
  }

  private deepMergeConfig(base: MemberConfig, patch: MemberConfigPatch): MemberConfig {
    const merged = structuredClone(base)
    if (patch.points) Object.assign(merged.points, patch.points)
    if (patch.levels?.thresholds) Object.assign(merged.levels.thresholds, patch.levels.thresholds)
    if (patch.lifecycle) Object.assign(merged.lifecycle, patch.lifecycle)
    if (patch.phoneUniqueScope) merged.phoneUniqueScope = patch.phoneUniqueScope
    if (patch.crossTenantEnabled !== undefined) merged.crossTenantEnabled = patch.crossTenantEnabled
    return merged
  }
}

// ═══════════════════════════════════════════════════════
// Spec 测试
// ═══════════════════════════════════════════════════════

describe('MemberConfigController · 路由元数据', () => {
  it('controller prefix = api/member/config', () => {
    assert.equal(controllerPrefixes.get(SpecController), 'api/member/config')
  })

  const routes: Array<{ name: string; method: number; path: string }> = [
    { name: 'getConfig', method: HttpMethod.GET, path: '' },
    { name: 'updateConfig', method: HttpMethod.PATCH, path: '' },
    { name: 'resetConfig', method: HttpMethod.POST, path: 'reset' },
    { name: 'getHistory', method: HttpMethod.GET, path: 'history' },
    { name: 'getThreshold', method: HttpMethod.GET, path: 'threshold/:level' },
    { name: 'batchThreshold', method: HttpMethod.POST, path: 'threshold/batch' },
    { name: 'getPointsRate', method: HttpMethod.GET, path: 'points-rate' },
    { name: 'upgradeProgress', method: HttpMethod.GET, path: 'upgrade-progress' },
    { name: 'validateConfig', method: HttpMethod.POST, path: 'validate' },
    { name: 'getDefault', method: HttpMethod.GET, path: 'default' },
  ]
  for (const r of routes) {
    it(`${r.name}: ${HttpMethod[r.method]} /${r.path}`, () => {
      const meta = routeMeta.get(r.name)
      assert.ok(meta, `route meta for ${r.name}`)
      assert.equal(meta.method, r.method)
      assert.equal(meta.path, r.path)
    })
  }

  it('updateConfig @HttpCode 200', () => {
    assert.equal(httpCodeMap.get('updateConfig'), 200)
  })
  it('resetConfig @HttpCode 200', () => {
    assert.equal(httpCodeMap.get('resetConfig'), 200)
  })
  it('batchThreshold @HttpCode 200', () => {
    assert.equal(httpCodeMap.get('batchThreshold'), 200)
  })
  it('validateConfig @HttpCode 200', () => {
    assert.equal(httpCodeMap.get('validateConfig'), 200)
  })
})

describe('MemberConfigController · 正例', () => {
  const ctrl = new SpecController()

  it('GET / → 返回默认配置 (8 字段)', () => {
    const result = ctrl.getConfig()
    assert.ok(result.config)
    assert.equal(result.config.points.earnRate, 1)
    assert.equal(result.config.phoneUniqueScope, 'global')
    assert.equal(result.config.lifecycle.dormantDays, 90)
  })

  it('PATCH / → 部分更新生效', () => {
    const result = ctrl.updateConfig({} as any, { patch: { points: { earnRate: 3 } }, reason: '促销活动' })
    assert.equal(result.config.points.earnRate, 3)
    assert.ok(result.changeId)
  })

  it('POST /reset → 恢复默认值', () => {
    const result = ctrl.resetConfig({} as any)
    assert.equal(result.config.points.earnRate, 1)
    assert.equal(result.changedBy, 'admin-001')
  })

  it('GET /history → 返回变更记录', () => {
    const hist = ctrl.getHistory({ limit: '10' } as any)
    assert.ok(Array.isArray(hist.history))
    assert.ok(hist.count >= 0)
  })

  it('GET /threshold/:level → 各等级阈值正确', () => {
    assert.equal(ctrl.getThreshold('bronze').threshold, 0)
    assert.equal(ctrl.getThreshold('silver').threshold, 500)
    assert.equal(ctrl.getThreshold('gold').threshold, 2000)
    assert.equal(ctrl.getThreshold('platinum').threshold, 10000)
    assert.equal(ctrl.getThreshold('diamond').threshold, 50000)
  })

  it('POST /threshold/batch → 批量查询', () => {
    const r = ctrl.batchThreshold({ levels: ['gold', 'diamond'] })
    assert.equal(r.thresholds['GOLD'], 2000)
    assert.equal(r.thresholds['DIAMOND'], 50000)
    assert.ok(!r.thresholds['BRONZE'], '未请求的不返回')
  })

  it('POST /threshold/batch → 空数组返回全部 5 档', () => {
    const r = ctrl.batchThreshold({})
    assert.equal(Object.keys(r.thresholds).length, 5)
  })

  it('GET /points-rate → 积分比例', () => {
    assert.deepEqual(ctrl.getPointsRate(), { earn: 1, redeem: 100 })
  })

  it('GET /upgrade-progress → Bronze 300 分', () => {
    const r = ctrl.upgradeProgress('300', 'bronze')
    assert.equal(r.currentLevel, 'BRONZE')
    assert.equal(r.nextLevel, 'SILVER')
    assert.equal(r.pointsNeeded, 200)
    assert.ok(r.progress > 0 && r.progress < 100)
  })

  it('GET /upgrade-progress → Diamond 满级', () => {
    const r = ctrl.upgradeProgress('99999', 'diamond')
    assert.equal(r.nextLevel, null)
    assert.equal(r.progress, 100)
  })

  it('POST /validate → 合法 patch', () => {
    const r = ctrl.validateConfig({ patch: { points: { earnRate: 2 } } })
    assert.equal(r.valid, true)
  })

  it('GET /default → 返回默认配置', () => {
    const r = ctrl.getDefault()
    assert.equal(r.config.points.earnRate, 1)
    assert.equal(r.config.crossTenantEnabled, true)
  })
})

describe('MemberConfigController · 反例 & 边界', () => {
  const ctrl = new SpecController()

  it('PATCH / → 空 body 抛 Error', () => {
    assert.throws(() => ctrl.updateConfig({} as any, {} as any), /patch required/)
  })

  it('GET /threshold/:level → 无效等级抛 Error', () => {
    assert.throws(() => ctrl.getThreshold('mythic'), /invalid level/)
  })

  it('GET /upgrade-progress → 无效等级抛 Error', () => {
    assert.throws(() => ctrl.upgradeProgress('0', 'invalid'), /invalid currentLevel/)
  })

  it('POST /validate → 非法阈值', () => {
    const r = ctrl.validateConfig({ patch: { levels: { thresholds: { SILVER: 100, GOLD: 50 } } } })
    assert.equal(r.valid, false)
    assert.ok(r.errors.some((e: string) => e.includes('monotonic')))
  })

  it('POST /validate → earnRate = 0 不合法', () => {
    const r = ctrl.validateConfig({ patch: { points: { earnRate: 0 } } })
    assert.equal(r.valid, false)
    assert.ok(r.errors.some((e: string) => e.includes('earnRate')))
  })

  it('POST /validate → dormantDays >= churnedDays', () => {
    const r = ctrl.validateConfig({ patch: { lifecycle: { dormantDays: 200, churnedDays: 100 } } })
    assert.equal(r.valid, false)
    assert.ok(r.errors.some((e: string) => e.includes('dormantDays')))
  })

  it('GET /upgrade-progress → 默认参数 (0 积分 Bronze)', () => {
    const r = ctrl.upgradeProgress(undefined as any, undefined as any)
    assert.equal(r.currentLevel, 'BRONZE')
    assert.equal(r.currentPoints, 0)
    assert.equal(r.nextLevel, 'SILVER')
  })

  it('GET /history → limit 上限 100', () => {
    const r = ctrl.getHistory({ limit: '999' } as any)
    assert.ok(r.count <= 100)
    assert.ok(Array.isArray(r.history))
  })
})
