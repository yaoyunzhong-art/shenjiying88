import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { CanaryRouter } from './canary-router'

/**
 * P3-2.3 灰度路由器 5 子套件测试
 *
 *   1. 5 优先级决策 (forceRollback / allowlist / denylist / 阶段边界 / hash)
 *   2. 灰度稳定性 (同 hashKey → 同 bucket)
 *   3. hash 分布均匀性 (10000 次抽样)
 *   4. 逐步推 0 → 5 → 25 → 50 → 100
 *   5. 热切换 (setStage / setForceRollback / allowlist 增删)
 */

// ═══════════════════════════════════════════════════════════════
// 1. 5 优先级决策
// ═══════════════════════════════════════════════════════════════

describe('CanaryRouter · 5 优先级决策', () => {
  it('1.1 forceRollback=true: 任何 tenant 都回 primary', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      forceRollback: true
    })
    const d = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k1', stagePercentage: 100 })
    assert.equal(d.useCanary, false)
    assert.equal(d.bucket, 'primary')
    assert.equal(d.reason, 'override_force_primary')
  })

  it('1.2 allowlist 命中 → canary (无视 stagePercentage)', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      allowlist: ['t-internal']
    })
    // 即使 stage=0, allowlist 命中仍是 canary
    const d = r.shouldUseCanary({ tenantId: 't-internal', hashKey: 'k', stagePercentage: 0 })
    assert.equal(d.useCanary, true)
    assert.equal(d.reason, 'allowlist')
    assert.equal(d.effectivePercentage, 100)
  })

  it('1.3 denylist 命中 → primary (无视 stagePercentage)', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      denylist: ['t-vip']
    })
    const d = r.shouldUseCanary({ tenantId: 't-vip', hashKey: 'k', stagePercentage: 100 })
    assert.equal(d.useCanary, false)
    assert.equal(d.reason, 'denylist')
  })

  it('1.4 stagePercentage=0 → 全部 primary', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    const d = r.shouldUseCanary({ tenantId: 't', hashKey: 'k', stagePercentage: 0 })
    assert.equal(d.useCanary, false)
    assert.equal(d.bucket, 'primary')
  })

  it('1.5 stagePercentage=100 → 全部 canary', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    const d = r.shouldUseCanary({ tenantId: 't', hashKey: 'k', stagePercentage: 100 })
    assert.equal(d.useCanary, true)
    assert.equal(d.bucket, 'canary')
  })

  it('1.6 priority 顺序: allowlist > denylist > stage', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      allowlist: ['a'],
      denylist: ['b']
    })
    // a 在 allowlist → canary
    assert.equal(
      r.shouldUseCanary({ tenantId: 'a', hashKey: 'k', stagePercentage: 50 }).useCanary,
      true
    )
    // b 在 denylist → primary
    assert.equal(
      r.shouldUseCanary({ tenantId: 'b', hashKey: 'k', stagePercentage: 50 }).useCanary,
      false
    )
  })

  it('1.7 priority 顺序: forceRollback > allowlist', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      allowlist: ['a'],
      forceRollback: true
    })
    const d = r.shouldUseCanary({ tenantId: 'a', hashKey: 'k', stagePercentage: 50 })
    assert.equal(d.useCanary, false)
    assert.equal(d.reason, 'override_force_primary')
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. 灰度稳定性
// ═══════════════════════════════════════════════════════════════

describe('CanaryRouter · 灰度稳定性', () => {
  it('2.1 同 (tenant, hashKey) 调用 100 次 → 始终同 bucket', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    const first = r.shouldUseCanary({ tenantId: 't-stable', hashKey: 'order-12345', stagePercentage: 50 })
    for (let i = 0; i < 100; i++) {
      const d = r.shouldUseCanary({ tenantId: 't-stable', hashKey: 'order-12345', stagePercentage: 50 })
      assert.equal(d.useCanary, first.useCanary, `第 ${i + 1} 次不一致`)
    }
  })

  it('2.2 改 stagePercentage: bucket 切换边界正确', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    const tenant = 't-x'
    const key = 'k-x'
    // 50% → 决定一次后, 100% 一定是 canary
    const r50 = r.shouldUseCanary({ tenantId: tenant, hashKey: key, stagePercentage: 50 })
    const r100 = r.shouldUseCanary({ tenantId: tenant, hashKey: key, stagePercentage: 100 })
    assert.equal(r100.useCanary, true)
    // 0% 一定是 primary
    const r0 = r.shouldUseCanary({ tenantId: tenant, hashKey: key, stagePercentage: 0 })
    assert.equal(r0.useCanary, false)
    // 25% 应该是 r50 的子集
    const r25 = r.shouldUseCanary({ tenantId: tenant, hashKey: key, stagePercentage: 25 })
    if (!r50.useCanary) {
      assert.equal(r25.useCanary, false, '25% 不应比 50% 命中更多')
    }
  })

  it('2.3 100 个不同 hashKey, 同 tenant: hash 桶固定但结果多样', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    let canaryCount = 0
    for (let i = 0; i < 100; i++) {
      const d = r.shouldUseCanary({ tenantId: 't', hashKey: `k${i}`, stagePercentage: 50 })
      if (d.useCanary) canaryCount += 1
    }
    // 50% 期望: 30-70 之间 (允许统计波动)
    assert.ok(canaryCount >= 30 && canaryCount <= 70, `canary=${canaryCount} 偏离 50% 过多`)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. 分布均匀性
// ═══════════════════════════════════════════════════════════════

describe('CanaryRouter · hash 分布均匀性', () => {
  it('3.1 10000 个 (tenant, key) 在 50% 灰度下: 命中数应非常接近 5000', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    let canaryCount = 0
    const N = 10_000
    for (let i = 0; i < N; i++) {
      const d = r.shouldUseCanary({
        tenantId: `t-${i % 100}`, // 100 个 tenant
        hashKey: `k-${i}`,
        stagePercentage: 50
      })
      if (d.useCanary) canaryCount += 1
    }
    const ratio = canaryCount / N
    // 期望 0.5, 容忍 ±5%
    assert.ok(Math.abs(ratio - 0.5) < 0.05, `命中比例 ${ratio.toFixed(4)} 偏离 0.5 过大`)
  })

  it('3.2 25% 灰度: 命中数应 ~25%', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    let canaryCount = 0
    const N = 5_000
    for (let i = 0; i < N; i++) {
      const d = r.shouldUseCanary({
        tenantId: `t-${i % 50}`,
        hashKey: `k-${i}`,
        stagePercentage: 25
      })
      if (d.useCanary) canaryCount += 1
    }
    const ratio = canaryCount / N
    assert.ok(Math.abs(ratio - 0.25) < 0.05, `命中比例 ${ratio.toFixed(4)} 偏离 0.25 过大`)
  })

  it('3.3 5% 灰度: 命中数应 ~5%', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    let canaryCount = 0
    const N = 5_000
    for (let i = 0; i < N; i++) {
      const d = r.shouldUseCanary({
        tenantId: `t-${i % 50}`,
        hashKey: `k-${i}`,
        stagePercentage: 5
      })
      if (d.useCanary) canaryCount += 1
    }
    const ratio = canaryCount / N
    assert.ok(Math.abs(ratio - 0.05) < 0.02, `命中比例 ${ratio.toFixed(4)} 偏离 0.05 过大`)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 逐步推
// ═══════════════════════════════════════════════════════════════

describe('CanaryRouter · 逐步推 0 → 100', () => {
  it('4.1 阶段递进: canary 命中数单调递增', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    const tenants = Array.from({ length: 1000 }, (_, i) => `t-${i}`)
    const stages: Array<[number, number]> = []
    for (const pct of [0, 5, 25, 50, 100]) {
      let c = 0
      for (const t of tenants) {
        if (r.shouldUseCanary({ tenantId: t, hashKey: t, stagePercentage: pct }).useCanary) c += 1
      }
      stages.push([pct, c])
    }
    // 单调非递减
    for (let i = 1; i < stages.length; i++) {
      assert.ok(
        stages[i][1] >= stages[i - 1][1],
        `阶段 ${stages[i][0]}% (${stages[i][1]}) 命中数 < ${stages[i - 1][0]}% (${stages[i - 1][1]})`
      )
    }
    // 边界检查
    assert.equal(stages[0][1], 0) // 0% 时 0 命中
    assert.equal(stages[4][1], 1000) // 100% 时 1000 命中
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. 热切换
// ═══════════════════════════════════════════════════════════════

describe('CanaryRouter · 热切换', () => {
  it('5.1 setForceRollback: 立即生效, 任何 tenant 回 primary', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    // 先记录原始
    const d50 = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k1', stagePercentage: 50 })
    void d50
    // 紧急回滚
    r.setForceRollback(true)
    const d = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k1', stagePercentage: 100 })
    assert.equal(d.useCanary, false)
    assert.equal(d.reason, 'override_force_primary')
    // 取消回滚
    r.setForceRollback(false)
    const d2 = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k1', stagePercentage: 100 })
    assert.equal(d2.useCanary, true)
  })

  it('5.2 setStage: 更新 currentStage', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    assert.equal(r.getStats().currentStage, 0)
    r.setStage(25)
    assert.equal(r.getStats().currentStage, 25)
    r.setStage(100)
    assert.equal(r.getStats().currentStage, 100)
  })

  it('5.3 addToAllowlist / removeFromAllowlist: 动态增删', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    // t1 初始: stage=0 → primary
    const d0 = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k', stagePercentage: 0 })
    assert.equal(d0.useCanary, false)
    // 加入 allowlist
    r.addToAllowlist('t1')
    const d1 = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k', stagePercentage: 0 })
    assert.equal(d1.useCanary, true)
    assert.equal(d1.reason, 'allowlist')
    // 移除
    r.removeFromAllowlist('t1')
    const d2 = r.shouldUseCanary({ tenantId: 't1', hashKey: 'k', stagePercentage: 0 })
    assert.equal(d2.useCanary, false)
  })

  it('5.4 addToDenylist: 让某 tenant 永远走 primary', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt' })
    r.addToDenylist('t-vip')
    const d = r.shouldUseCanary({ tenantId: 't-vip', hashKey: 'k', stagePercentage: 100 })
    assert.equal(d.useCanary, false)
    assert.equal(d.reason, 'denylist')
  })

  it('5.5 stats 累计: perReason 准确', () => {
    const r = new CanaryRouter({ primaryPlatformId: 'lyt', canaryPlatformId: 'alt', allowlist: ['a'] })
    r.shouldUseCanary({ tenantId: 'a', hashKey: 'k', stagePercentage: 50 }) // allowlist
    r.shouldUseCanary({ tenantId: 'b', hashKey: 'k', stagePercentage: 0 }) // percentage_hash (0)
    r.shouldUseCanary({ tenantId: 'b', hashKey: 'k', stagePercentage: 50 }) // percentage_hash
    r.shouldUseCanary({ tenantId: 'c', hashKey: 'k', stagePercentage: 100 }) // percentage_hash (100)
    const stats = r.getStats()
    assert.equal(stats.totalDecisions, 4)
    assert.equal(stats.canaryDecisions, 2) // a (allowlist) + c (100%)
    assert.equal(stats.primaryDecisions, 2) // b (0%) + b (50%)
    assert.equal(stats.perReason.allowlist, 1)
    assert.equal(stats.perReason.percentage_hash, 3)
  })

  it('5.6 getConfig: 返回当前配置快照', () => {
    const r = new CanaryRouter({
      primaryPlatformId: 'lyt',
      canaryPlatformId: 'alt',
      allowlist: ['a', 'b'],
      denylist: ['c'],
      forceRollback: true
    })
    const c = r.getConfig()
    assert.equal(c.primaryPlatformId, 'lyt')
    assert.equal(c.canaryPlatformId, 'alt')
    assert.deepEqual(c.allowlist.sort(), ['a', 'b'])
    assert.deepEqual(c.denylist, ['c'])
    assert.equal(c.forceRollback, true)
  })
})
