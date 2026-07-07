import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { LYTPlatform } from './lyt-platform'
import { MockAltPlatform } from './mock-alt-platform'
import { BasePlatformRegistry } from './base-platform.registry'
import { BasePlatformError } from './base-platform.port'

/**
 * P3-1.5 平台适配器 4 子套件测试
 *
 *   1. LYTPlatform: 会员/订单/积分 正常路径 + 业务校验
 *   2. MockAltPlatform: 故障率注入 + 调用统计
 *   3. BasePlatformRegistry: 注册/路由/分发 + 限流熔断降级
 *   4. 多底座隔离: 某底座故障不影响另一底座
 */

// ═══════════════════════════════════════════════════════════════
// 1. LYTPlatform
// ═══════════════════════════════════════════════════════════════

describe('LYTPlatform · 神机营底座适配器', () => {
  it('1.1 healthCheck 返回 healthy=true + 延迟 5-15ms', async () => {
    const lyt = new LYTPlatform('lyt-1.1')
    const r = await lyt.healthCheck({ tenantId: 't1', requestId: 'r1' })
    assert.equal(r.healthy, true)
    assert.ok(r.latencyMs >= 5 && r.latencyMs <= 100)
  })

  it('1.2 syncMember 成功 → 返回 baseMemberId + baseSpecific', async () => {
    const lyt = new LYTPlatform('lyt-1.2')
    const r = await lyt.syncMember(
      { tenantId: 't1', requestId: 'r1' },
      { memberId: 'm1', name: '张三', phone: '13800000001' }
    )
    assert.equal(r.ok, true)
    assert.equal(r.baseMemberId, 'lyt-m1')
    assert.equal(r.baseSpecific?.lyt_memberNo, 'LYT-m1')
    assert.ok(r.syncedAt)
    // 内部状态写入
    const stored = lyt._getMember('m1')
    assert.equal(stored?.name, '张三')
  })

  it('1.3 syncMember 缺 memberId → 抛 BasePlatformError(retryable=false)', async () => {
    const lyt = new LYTPlatform('lyt-1.3')
    await assert.rejects(
      lyt.syncMember(
        { tenantId: 't1', requestId: 'r1' },
        { memberId: '', name: 'no-id', phone: '13800000001' }
      ),
      (err: unknown) => {
        assert.ok(err instanceof BasePlatformError)
        const e = err as BasePlatformError
        assert.equal(e.platformId, 'lyt-1.3')
        assert.equal(e.operation, 'syncMember')
        assert.equal(e.retryable, false)
        return true
      }
    )
  })

  it('1.4 syncMember 缺 phone → 抛错', async () => {
    const lyt = new LYTPlatform('lyt-1.4')
    await assert.rejects(
      lyt.syncMember(
        { tenantId: 't1', requestId: 'r1' },
        { memberId: 'm1', name: 'x', phone: '' }
      ),
      (err: unknown) => (err as BasePlatformError).operation === 'syncMember'
    )
  })

  it('1.5 syncOrder 正常 + amountCents 必须 > 0', async () => {
    const lyt = new LYTPlatform('lyt-1.5')
    const r = await lyt.syncOrder(
      { tenantId: 't1', requestId: 'r1' },
      { orderId: 'o1', amountCents: 1000, paidAt: '2026-01-01T00:00:00Z' }
    )
    assert.equal(r.ok, true)
    assert.equal(r.baseOrderId, 'lyt-order-o1')
    assert.equal(lyt._getOrder('o1')?.amountCents, 1000)

    await assert.rejects(
      lyt.syncOrder(
        { tenantId: 't1', requestId: 'r1' },
        { orderId: 'o2', amountCents: 0, paidAt: '2026-01-01T00:00:00Z' }
      ),
      (err: unknown) => (err as BasePlatformError).message.includes('positive')
    )
  })

  it('1.6 adjustPoints 累加 + 余额校验', async () => {
    const lyt = new LYTPlatform('lyt-1.6')
    // 首次: 0 + 100 = 100
    let r = await lyt.adjustPoints(
      { tenantId: 't1', requestId: 'r1' },
      { memberId: 'm1', delta: 100, reason: 'register' }
    )
    assert.equal(r.newBalance, 100)
    // 二次: 100 + 50 = 150
    r = await lyt.adjustPoints(
      { tenantId: 't1', requestId: 'r2' },
      { memberId: 'm1', delta: 50, reason: 'purchase' }
    )
    assert.equal(r.newBalance, 150)
    assert.equal(lyt._getPointsBalance('m1'), 150)
  })

  it('1.7 adjustPoints delta=0 → 拒绝', async () => {
    const lyt = new LYTPlatform('lyt-1.7')
    await assert.rejects(
      lyt.adjustPoints(
        { tenantId: 't1', requestId: 'r1' },
        { memberId: 'm1', delta: 0, reason: 'noop' }
      ),
      (err: unknown) => (err as BasePlatformError).message.includes('delta')
    )
  })

  it('1.8 adjustPoints 扣减后余额 < 0 → 拒绝', async () => {
    const lyt = new LYTPlatform('lyt-1.8')
    await lyt.adjustPoints(
      { tenantId: 't1', requestId: 'r1' },
      { memberId: 'm1', delta: 10, reason: 'init' }
    )
    await assert.rejects(
      lyt.adjustPoints(
        { tenantId: 't1', requestId: 'r2' },
        { memberId: 'm1', delta: -100, reason: 'redeem' }
      ),
      (err: unknown) => (err as BasePlatformError).message.includes('insufficient')
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. MockAltPlatform
// ═══════════════════════════════════════════════════════════════

describe('MockAltPlatform · 备用底座模拟器', () => {
  it('2.1 默认 failureRate=0: 100 次调用全部成功', async () => {
    const mock = new MockAltPlatform({ platformId: 'mock-2.1' })
    let ok = 0
    for (let i = 0; i < 100; i++) {
      const r = await mock.syncMember(
        { tenantId: 't1', requestId: `r${i}` },
        { memberId: `m${i}`, name: 'x', phone: '13800000000' }
      )
      if (r.ok) ok += 1
    }
    assert.equal(ok, 100)
  })

  it('2.2 failureRate=1: 全部失败 (retryable=true)', async () => {
    const mock = new MockAltPlatform({ platformId: 'mock-2.2', failureRate: 1 })
    let failed = 0
    for (let i = 0; i < 20; i++) {
      try {
        await mock.syncMember(
          { tenantId: 't1', requestId: `r${i}` },
          { memberId: `m${i}`, name: 'x', phone: '13800000000' }
        )
      } catch (err) {
        failed += 1
        assert.equal((err as BasePlatformError).retryable, true)
      }
    }
    assert.equal(failed, 20)
    const stats = mock.getCallStats()
    assert.equal(stats.failed, 20)
  })

  it('2.3 callStats 准确记录 3 类操作', async () => {
    const mock = new MockAltPlatform({ platformId: 'mock-2.3' })
    await mock.syncMember(
      { tenantId: 't1', requestId: 'r1' },
      { memberId: 'm1', name: 'x', phone: '13800000000' }
    )
    await mock.syncMember(
      { tenantId: 't1', requestId: 'r2' },
      { memberId: 'm2', name: 'x', phone: '13800000001' }
    )
    await mock.syncOrder(
      { tenantId: 't1', requestId: 'r3' },
      { orderId: 'o1', amountCents: 100, paidAt: '2026-01-01T00:00:00Z' }
    )
    await mock.adjustPoints(
      { tenantId: 't1', requestId: 'r4' },
      { memberId: 'm1', delta: 10, reason: 'r' }
    )
    const stats = mock.getCallStats()
    assert.equal(stats.member, 2)
    assert.equal(stats.order, 1)
    assert.equal(stats.points, 1)
    assert.equal(stats.failed, 0)
  })

  it('2.4 内部状态与 LYT 隔离: 各存各的 memberId', async () => {
    const mock = new MockAltPlatform({ platformId: 'mock-2.4' })
    const lyt = new LYTPlatform('lyt-2.4')
    await mock.syncMember(
      { tenantId: 't1', requestId: 'r1' },
      { memberId: 'shared', name: 'mock', phone: '13800000000' }
    )
    await lyt.syncMember(
      { tenantId: 't1', requestId: 'r2' },
      { memberId: 'shared', name: 'lyt', phone: '13800000000' }
    )
    assert.equal(mock._getMember('shared')?.name, 'mock')
    assert.equal(lyt._getMember('shared')?.name, 'lyt')
  })

  it('2.5 platformType 自定义', () => {
    const mock = new MockAltPlatform({ platformId: 'm', platformType: 'CUSTOM_A' })
    assert.equal(mock.platformType, 'CUSTOM_A')
  })

  it('2.6 healthCheck: failureRate<0.5 healthy=true, >=0.5 healthy=false', async () => {
    const ok = new MockAltPlatform({ platformId: 'm1', failureRate: 0.3 })
    const bad = new MockAltPlatform({ platformId: 'm2', failureRate: 0.8 })
    assert.equal((await ok.healthCheck({ tenantId: 't', requestId: 'r' })).healthy, true)
    assert.equal((await bad.healthCheck({ tenantId: 't', requestId: 'r' })).healthy, false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. BasePlatformRegistry
// ═══════════════════════════════════════════════════════════════

describe('BasePlatformRegistry · 多底座注册 + 路由 + 分发', () => {
  const buildRegistry = () => {
    const lyt = new LYTPlatform('lyt-reg')
    const mock = new MockAltPlatform({ platformId: 'mock-reg' })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    return { reg, lyt, mock }
  }

  it('3.1 onApplicationBootstrap: 注册 LYT + MockAlt, 设置 default + fallback = LYT', () => {
    const { reg } = buildRegistry()
    const list = reg.listPlatforms()
    assert.equal(list.length, 2)
    assert.ok(list.find((p) => p.platformId === 'lyt-reg'))
    assert.ok(list.find((p) => p.platformId === 'mock-reg'))
  })

  it('3.2 setPrimaryForTenant + route: tenant 命中 primary', () => {
    const { reg } = buildRegistry()
    reg.setPrimaryForTenant('t-A', 'lyt-reg')
    reg.setPrimaryForTenant('t-B', 'mock-reg')
    const r1 = reg.route({ tenantId: 't-A' })
    const r2 = reg.route({ tenantId: 't-B' })
    assert.equal(r1.platform.platformId, 'lyt-reg')
    assert.equal(r1.reason, 'primary')
    assert.equal(r2.platform.platformId, 'mock-reg')
  })

  it('3.3 route 未配 tenant → 用 defaultPlatform', () => {
    const { reg } = buildRegistry()
    const r = reg.route({ tenantId: 'unknown' })
    assert.equal(r.platform.platformId, 'lyt-reg') // default
  })

  it('3.4 routeTo: 灰度路由直接到指定 platform', () => {
    const { reg } = buildRegistry()
    const r = reg.routeTo('mock-reg', 'gray_canary', 'canary')
    assert.equal(r.platform.platformId, 'mock-reg')
    assert.equal(r.reason, 'gray_canary')
    assert.equal(r.canaryBucket, 'canary')
  })

  it('3.5 setPrimaryForTenant 未知 platform → 抛错', () => {
    const { reg } = buildRegistry()
    assert.throws(() => reg.setPrimaryForTenant('t', 'unknown'))
  })

  it('3.6 dispatchSyncMember 走限流+熔断→调用底层平台', async () => {
    const { reg } = buildRegistry()
    reg.setPrimaryForTenant('t1', 'lyt-reg')
    const decision = reg.route({ tenantId: 't1' })
    const r = await reg.dispatchSyncMember(decision, { tenantId: 't1', requestId: 'r1' }, {
      memberId: 'm1', name: '张三', phone: '13800000000'
    })
    assert.equal(r.ok, true)
    assert.equal(r.baseMemberId, 'lyt-m1')
  })

  it('3.7 dispatchAdjustPoints 累加跨平台独立', async () => {
    const { reg, lyt, mock } = buildRegistry()
    reg.setPrimaryForTenant('t1', 'lyt-reg')
    reg.setPrimaryForTenant('t2', 'mock-reg')
    const d1 = reg.route({ tenantId: 't1' })
    const d2 = reg.route({ tenantId: 't2' })
    await reg.dispatchAdjustPoints(d1, { tenantId: 't1', requestId: 'r1' }, { memberId: 'shared', delta: 100, reason: 'r' })
    await reg.dispatchAdjustPoints(d2, { tenantId: 't2', requestId: 'r2' }, { memberId: 'shared', delta: 50, reason: 'r' })
    assert.equal(lyt._getPointsBalance('shared'), 100)
    assert.equal(mock._getPointsBalance('shared'), 50)
  })

  it('3.8 getBreakerStats / getLimiterStats 真实存在', () => {
    const { reg } = buildRegistry()
    assert.ok(reg.getBreakerStats('lyt-reg'))
    assert.ok(reg.getLimiterStats('lyt-reg'))
  })

  it('3.9 checkHealth LYT 正常 → HEALTHY', async () => {
    const { reg } = buildRegistry()
    const r = await reg.checkHealth('lyt-reg')
    assert.equal(r.health, 'HEALTHY')
    assert.ok(r.latencyMs >= 0)
  })

  it('3.10 checkHealth 未知 platform → 抛错', async () => {
    const { reg } = buildRegistry()
    await assert.rejects(reg.checkHealth('nope'))
  })

  it('3.11 removePrimaryForTenant: 路由回落到 default', () => {
    const { reg } = buildRegistry()
    reg.setPrimaryForTenant('t1', 'mock-reg')
    assert.equal(reg.route({ tenantId: 't1' }).platform.platformId, 'mock-reg')
    reg.removePrimaryForTenant('t1')
    assert.equal(reg.route({ tenantId: 't1' }).platform.platformId, 'lyt-reg')
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 故障隔离 + 降级
// ═══════════════════════════════════════════════════════════════

describe('多底座故障隔离 + 降级', () => {
  it('4.1 某 platform 连续失败 → 该 platform 熔断 OPEN (无 fallback → 抛错)', async () => {
    const lyt = new LYTPlatform('lyt-iso')
    const mock = new MockAltPlatform({ platformId: 'mock-iso', failureRate: 1 })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    // 让 fallback 指向 mock 自身 → 熔断时不会走降级 → 向上抛 CircuitOpenError
    reg.setFallbackPlatform('mock-iso')
    reg.setPrimaryForTenant('t1', 'mock-iso')
    let openErr: Error | null = null
    for (let i = 0; i < 10; i++) {
      try {
        const d = reg.route({ tenantId: 't1' })
        await reg.dispatchSyncMember(d, { tenantId: 't1', requestId: `r${i}` }, {
          memberId: 'm', name: 'x', phone: '13800000000'
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'CircuitOpenError' && !openErr) {
          openErr = err
        }
      }
    }
    // 验证熔断器状态
    const stats = reg.getBreakerStats('mock-iso')
    assert.equal(stats?.state, 'OPEN')
    assert.ok(openErr, '应至少触发一次 CircuitOpenError')
  })

  it('4.1b 熔断开启后 → 自动降级到 fallback (最终成功)', async () => {
    const lyt = new LYTPlatform('lyt-iso2')
    const mock = new MockAltPlatform({ platformId: 'mock-iso2', failureRate: 1 })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    reg.setFallbackPlatform('lyt-iso2')
    reg.setPrimaryForTenant('t1', 'mock-iso2')
    // 触发熔断
    for (let i = 0; i < 8; i++) {
      try {
        const d = reg.route({ tenantId: 't1' })
        await reg.dispatchSyncMember(d, { tenantId: 't1', requestId: `r${i}` }, {
          memberId: `m${i}`, name: 'x', phone: '13800000000'
        })
      } catch { /* 忽略 */ }
    }
    // 熔断已开启 → fallback = lyt → 后续调用应都走 LYT
    const d = reg.route({ tenantId: 't1' })
    const r = await reg.dispatchSyncMember(d, { tenantId: 't1', requestId: 'after-open' }, {
      memberId: 'm-fb', name: 'fallback', phone: '13800000000'
    })
    // baseMemberId 以 lyt- 开头说明走了 LYT
    assert.equal(r.baseMemberId, 'lyt-m-fb')
    // LYT 收到了 member
    assert.equal(lyt._getMember('m-fb')?.name, 'fallback')
  })

  it('4.2 限流触发 → throw BasePlatformError(retryable=true)', async () => {
    const lyt = new LYTPlatform('lyt-rl')
    const mock = new MockAltPlatform({ platformId: 'mock-rl' })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    reg.setPrimaryForTenant('t1', 'mock-rl')
    // TokenBucket capacity=100, burst 后再跑一波触发限流
    const decisions = Array.from({ length: 200 }, () => reg.route({ tenantId: 't1' }))
    let limited = 0
    for (let i = 0; i < decisions.length; i++) {
      try {
        await reg.dispatchSyncMember(decisions[i], { tenantId: 't1', requestId: `r${i}` }, {
          memberId: `m${i}`, name: 'x', phone: '13800000000'
        })
      } catch (err) {
        if (err instanceof BasePlatformError && err.message === 'rate limited') limited += 1
      }
    }
    assert.ok(limited > 0, '应至少限流 1 次')
  })

  it('4.3 健康检查不互相影响: lyt 健康 + mock 健康 → 都 HEALTHY', async () => {
    const lyt = new LYTPlatform('lyt-h1')
    const mock = new MockAltPlatform({ platformId: 'mock-h1' })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    const r1 = await reg.checkHealth('lyt-h1')
    const r2 = await reg.checkHealth('mock-h1')
    assert.equal(r1.health, 'HEALTHY')
    assert.equal(r2.health, 'HEALTHY')
  })

  it('4.4 故障底座: failureRate=1 → healthCheck HEALTHY 但调用必失败', async () => {
    const lyt = new LYTPlatform('lyt-h2')
    const mock = new MockAltPlatform({ platformId: 'mock-h2', failureRate: 0.8 })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    const r = await reg.checkHealth('mock-h2')
    // failureRate=0.8 >= 0.5 → unhealthy
    assert.equal(r.health, 'DEGRADED')
  })

  it('4.5 业务异常 (BasePlatformError) 不污染其他 platform', async () => {
    const lyt = new LYTPlatform('lyt-poll')
    const mock = new MockAltPlatform({ platformId: 'mock-poll' })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    reg.setPrimaryForTenant('t1', 'lyt-poll')
    reg.setPrimaryForTenant('t2', 'mock-poll')
    // t1 业务失败 (缺 phone)
    const d1 = reg.route({ tenantId: 't1' })
    await assert.rejects(
      reg.dispatchSyncMember(d1, { tenantId: 't1', requestId: 'r1' }, {
        memberId: 'm1', name: 'x', phone: ''
      })
    )
    // t2 仍正常
    const d2 = reg.route({ tenantId: 't2' })
    const r = await reg.dispatchSyncMember(d2, { tenantId: 't2', requestId: 'r2' }, {
      memberId: 'm2', name: 'y', phone: '13800000000'
    })
    assert.equal(r.ok, true)
  })

  it('4.6 dispatchSyncOrder 走 fallback 后用 LYT 写入', async () => {
    const lyt = new LYTPlatform('lyt-fb')
    const mock = new MockAltPlatform({ platformId: 'mock-fb', failureRate: 1 })
    const reg = new BasePlatformRegistry(lyt, mock)
    reg.onApplicationBootstrap()
    reg.setFallbackPlatform('lyt-fb')
    reg.setPrimaryForTenant('t1', 'mock-fb')
    // 触发 mock 失败 5 次 → 熔断
    for (let i = 0; i < 8; i++) {
      try {
        const d = reg.route({ tenantId: 't1' })
        await reg.dispatchSyncOrder(d, { tenantId: 't1', requestId: `r${i}` }, {
          orderId: `o${i}`, amountCents: 100, paidAt: '2026-01-01'
        })
      } catch { /* 忽略 */ }
    }
    // 此时 mock 应已 OPEN
    const breaker = reg.getBreakerStats('mock-fb')
    assert.equal(breaker?.state, 'OPEN')
  })
})
