import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { HeterogeneousChannelRouter } from './heterogeneous-router'
import type { ChannelCandidate } from './heterogeneous-router.port'

/**
 * P2-2 异构通道路由测试
 *
 *   1. priority 策略: 主备模式
 *   2. round_robin 策略: 轮询分发
 *   3. weighted 策略: 加权随机
 *   4. 混合场景: 健康切换 / 全部不健康 / 动态变更
 */

function makeChannels(): ChannelCandidate[] {
  return [
    { id: 'wechat-main', priority: 1, weight: 70, healthy: true },
    { id: 'alipay-backup', priority: 2, weight: 30, healthy: true }
  ]
}

// ═══════════════════════════════════════════════════════════════
// 1. priority 策略 (主备)
// ═══════════════════════════════════════════════════════════════

describe('HeterogeneousChannelRouter · priority 策略', () => {
  it('1.1 2 个 healthy: 总选 priority=1 那个', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    for (let i = 0; i < 100; i++) {
      assert.equal(r.select()!.id, 'wechat-main')
    }
  })

  it('1.2 主 unhealthy → 选 backup', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    r.setHealth('wechat-main', false)
    for (let i = 0; i < 50; i++) {
      assert.equal(r.select()!.id, 'alipay-backup')
    }
  })

  it('1.3 3 个候选: 始终选 priority 最小', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 3, weight: 10, healthy: true },
      { id: 'b', priority: 1, weight: 10, healthy: true },
      { id: 'c', priority: 2, weight: 10, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels })
    for (let i = 0; i < 30; i++) {
      assert.equal(r.select()!.id, 'b')
    }
  })

  it('1.4 priority 相同: 选第一个 (stable)', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 10, healthy: true },
      { id: 'b', priority: 1, weight: 10, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels })
    assert.equal(r.select()!.id, 'a')
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. round_robin 策略
// ═══════════════════════════════════════════════════════════════

describe('HeterogeneousChannelRouter · round_robin 策略', () => {
  it('2.1 3 个 healthy: 严格轮流', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 1, healthy: true },
      { id: 'b', priority: 1, weight: 1, healthy: true },
      { id: 'c', priority: 1, weight: 1, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'round_robin', channels })
    const selections = Array.from({ length: 9 }, () => r.select()!.id)
    assert.deepEqual(selections, ['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c'])
  })

  it('2.2 跳过 unhealthy: 仍均匀轮询剩余', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 1, healthy: true },
      { id: 'b', priority: 1, weight: 1, healthy: true },
      { id: 'c', priority: 1, weight: 1, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'round_robin', channels })
    r.setHealth('b', false)
    const selections = Array.from({ length: 4 }, () => r.select()!.id)
    // 跳过 b: a, c, a, c
    assert.deepEqual(selections, ['a', 'c', 'a', 'c'])
  })

  it('2.3 100 次选 2 个: 约各 50 次', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 1, healthy: true },
      { id: 'b', priority: 1, weight: 1, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'round_robin', channels })
    const counts: Record<string, number> = { a: 0, b: 0 }
    for (let i = 0; i < 100; i++) {
      counts[r.select()!.id]! += 1
    }
    assert.equal(counts.a, 50)
    assert.equal(counts.b, 50)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. weighted 策略
// ═══════════════════════════════════════════════════════════════

describe('HeterogeneousChannelRouter · weighted 策略', () => {
  it('3.1 7:3 权重 10000 次: 误差 < 5%', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'weighted', channels: makeChannels() })
    const counts: Record<string, number> = { 'wechat-main': 0, 'alipay-backup': 0 }
    const N = 10000
    for (let i = 0; i < N; i++) {
      counts[r.select()!.id]! += 1
    }
    const wechatPct = counts['wechat-main']! / N
    // 期望 0.70, 允许 ±0.05
    assert.ok(wechatPct > 0.65 && wechatPct < 0.75, `wechatPct=${wechatPct}`)
  })

  it('3.2 weight=0 → 永远不选', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 1, healthy: true },
      { id: 'b', priority: 1, weight: 0, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'weighted', channels })
    for (let i = 0; i < 50; i++) {
      assert.equal(r.select()!.id, 'a')
    }
  })

  it('3.3 全部 weight=0 → 选第一个 (兜底)', () => {
    const channels: ChannelCandidate[] = [
      { id: 'a', priority: 1, weight: 0, healthy: true },
      { id: 'b', priority: 1, weight: 0, healthy: true }
    ]
    const r = new HeterogeneousChannelRouter({ strategy: 'weighted', channels })
    assert.equal(r.select()!.id, 'a')
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 混合场景
// ═══════════════════════════════════════════════════════════════

describe('HeterogeneousChannelRouter · 混合场景', () => {
  it('4.1 全部 unhealthy → null + skipped++', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    r.setHealth('wechat-main', false)
    r.setHealth('alipay-backup', false)
    assert.equal(r.select(), null)
    assert.equal(r.getStats().skipped, 1)
  })

  it('4.2 setHealth 动态切换: 切换后立即生效', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    // 主 healthy
    assert.equal(r.select()!.id, 'wechat-main')
    // 切主 unhealthy
    r.setHealth('wechat-main', false)
    assert.equal(r.select()!.id, 'alipay-backup')
    // 恢复
    r.setHealth('wechat-main', true)
    assert.equal(r.select()!.id, 'wechat-main')
  })

  it('4.3 setStrategy 热切换: priority → round_robin', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    assert.equal(r.select()!.id, 'wechat-main') // priority 模式
    r.setStrategy('round_robin')
    const seq = Array.from({ length: 4 }, () => r.select()!.id)
    // round_robin 模式: wechat, alipay, wechat, alipay
    assert.deepEqual(seq, ['wechat-main', 'alipay-backup', 'wechat-main', 'alipay-backup'])
  })

  it('4.4 stats: perChannel 计数准确', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    for (let i = 0; i < 5; i++) r.select() // 5 次都选 wechat-main
    const stats = r.getStats()
    assert.equal(stats.totalSelections, 5)
    assert.equal(stats.perChannel['wechat-main'], 5)
    assert.equal(stats.perChannel['alipay-backup'], 0)
    assert.equal(stats.lastSelected, 'wechat-main')
  })

  it('4.5 listChannels 快照: 不影响内部状态', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    const snap = r.listChannels()
    snap[0]!.healthy = false // 改 snapshot
    const snap2 = r.listChannels()
    assert.equal(snap2[0]!.healthy, true, '内部状态未被 snapshot 修改')
  })

  it('4.6 reset: round_robin 指针归 0 + stats 清零', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'round_robin', channels: makeChannels() })
    r.select()
    r.select()
    r.select()
    r.reset()
    const stats = r.getStats()
    assert.equal(stats.totalSelections, 0)
    assert.equal(stats.perChannel['wechat-main'], 0)
    // 指针归 0, 下次从第一个开始
    assert.equal(r.select()!.id, 'wechat-main')
  })

  it('4.7 setHealth 不存在的 id → 静默忽略', () => {
    const r = new HeterogeneousChannelRouter({ strategy: 'priority', channels: makeChannels() })
    r.setHealth('nonexistent', false) // 不应抛错
    assert.equal(r.select()!.id, 'wechat-main')
  })
})
