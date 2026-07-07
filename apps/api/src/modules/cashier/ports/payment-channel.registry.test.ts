import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  PaymentChannelRegistry,
  NoChannelConfiguredError,
  AllChannelsFailedError,
  type PaymentChannelPort
} from './payment-channel.registry'
import type { PaymentGateway } from '../payment.service'
import type { PaymentMethod } from '@m5/types'
import type { PaymentChannelConfig } from './payment-channel.port'
/**
 * PaymentChannelRegistry 单元测试 (P0-2.4)
 *
 * 覆盖:
 *   - register / listChannels (按 priority 排序)
 *   - selectPrimary (空 / 单 / 多 / 启用过滤)
 *   - selectNext (排除 / 跳过熔断)
 *   - recordFailure (熔断阈值)
 *   - recordSuccess (清零 + 健康)
 *   - executeWithFailover (主备链式调用)
 *   - NoChannelConfiguredError
 *   - AllChannelsFailedError
 *   - 熔断 cooldown 恢复
 */
class TestChannel implements PaymentChannelPort {
  readonly gatewayName = 'test-channel'
  readonly channel: PaymentMethod
  public failTimes = 0
  public failWithError: string | null = null
  public createPrepayCalls = 0
  public lastCreatePrepayOrderId: string | null = null
  constructor(readonly tenantId: string, readonly config: PaymentChannelConfig) {
    this.channel = config.channel
  }
  async createPrepay(order: { id: string; totalCents: number }, _method: PaymentMethod) {
    this.createPrepayCalls += 1
    this.lastCreatePrepayOrderId = order.id
    if (this.failTimes > 0) {
      this.failTimes -= 1
      throw new Error(this.failWithError ?? 'simulated failure')
    }
    return {
      prepayId: `${this.config.channel}-${order.id}`,
      expiresAt: new Date(Date.now() + 900_000).toISOString()
    }
  }
  async query() {
    return { status: 'SUCCESS' as const, paidAt: new Date().toISOString() }
  }
  async refund() {
    return { providerRefundId: 'rf' }
  }
  async healthCheck() {
    return { healthy: true, latencyMs: 1 }
  }
  recordFailure(reason: string) {
    void reason
  }
  recordSuccess() {}
}
function buildChannel(
  tenantId: string,
  channel: PaymentMethod,
  priority: number,
  overrides: Partial<PaymentChannelConfig> = {}
): TestChannel {
  return new TestChannel(tenantId, {
    tenantId,
    channel,
    priority,
    enabled: overrides.enabled ?? true,
    isHealthy: overrides.isHealthy ?? true,
    lastFailureAt: overrides.lastFailureAt,
    consecutiveFailures: overrides.consecutiveFailures ?? 0
  })
}
// ═══════════════════════════════════════════════════════════════
// 1. register + listChannels
// ═══════════════════════════════════════════════════════════════
describe('PaymentChannelRegistry · register + listChannels', () => {
  it('orders channels by priority ascending', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 2))
    reg.register(buildChannel('t1', 'WECHAT', 0))
    reg.register(buildChannel('t1', 'WECHAT', 1))
    const list = reg.listChannels('t1', 'WECHAT')
    assert.equal(list.length, 3)
    assert.equal(list[0].config.priority, 0)
    assert.equal(list[1].config.priority, 1)
    assert.equal(list[2].config.priority, 2)
  })
  it('isolates channels by (tenantId, method)', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0))
    reg.register(buildChannel('t1', 'ALIPAY', 0))
    reg.register(buildChannel('t2', 'WECHAT', 0))
    assert.equal(reg.listChannels('t1', 'WECHAT').length, 1)
    assert.equal(reg.listChannels('t1', 'ALIPAY').length, 1)
    assert.equal(reg.listChannels('t2', 'WECHAT').length, 1)
    assert.equal(reg.listChannels('t3', 'WECHAT').length, 0)
  })
  it('returns empty list for unknown tenant', () => {
    const reg = new PaymentChannelRegistry()
    assert.deepEqual(reg.listChannels('unknown', 'WECHAT'), [])
  })
})
// ═══════════════════════════════════════════════════════════════
// 2. selectPrimary
// ═══════════════════════════════════════════════════════════════
describe('PaymentChannelRegistry · selectPrimary', () => {
  it('throws NoChannelConfiguredError when empty', () => {
    const reg = new PaymentChannelRegistry()
    assert.throws(
      () => reg.selectPrimary('t1', 'WECHAT'),
      (err: unknown) => {
        assert.ok(err instanceof NoChannelConfiguredError)
        assert.equal((err as NoChannelConfiguredError).tenantId, 't1')
        assert.equal((err as NoChannelConfiguredError).method, 'WECHAT')
        return true
      }
    )
  })
  it('throws when all channels disabled', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0, { enabled: false }))
    assert.throws(() => reg.selectPrimary('t1', 'WECHAT'), NoChannelConfiguredError)
  })
  it('throws when primary circuit-opened', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0, { isHealthy: false, lastFailureAt: new Date().toISOString() }))
    assert.throws(() => reg.selectPrimary('t1', 'WECHAT'), NoChannelConfiguredError)
  })
  it('returns lowest-priority enabled healthy channel', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 5))
    reg.register(buildChannel('t1', 'WECHAT', 0))
    reg.register(buildChannel('t1', 'WECHAT', 2))
    const primary = reg.selectPrimary('t1', 'WECHAT')
    assert.equal(primary.config.priority, 0)
  })
})
// ═══════════════════════════════════════════════════════════════
// 3. selectNext (失败重路由)
// ═══════════════════════════════════════════════════════════════
describe('PaymentChannelRegistry · selectNext', () => {
  it('skips excluded instance and returns next available', () => {
    const reg = new PaymentChannelRegistry()
    const c0 = buildChannel('t1', 'WECHAT', 0)
    const c1 = buildChannel('t1', 'WECHAT', 1)
    const c2 = buildChannel('t1', 'WECHAT', 2)
    reg.register(c0)
    reg.register(c1)
    reg.register(c2)
    const next = reg.selectNext('t1', 'WECHAT', c0)
    assert.ok(next)
    assert.equal(next!.config.priority, 1)
    assert.equal(next, c1)
  })
  it('returns null when no fallback available', () => {
    const reg = new PaymentChannelRegistry()
    const c0 = buildChannel('t1', 'WECHAT', 0)
    reg.register(c0)
    const next = reg.selectNext('t1', 'WECHAT', c0)
    assert.equal(next, null)
  })
})
// ═══════════════════════════════════════════════════════════════
// 4. 熔断 + 恢复
// ═══════════════════════════════════════════════════════════════
describe('PaymentChannelRegistry · 熔断器', () => {
  it('consecutiveFailures reaches threshold → isHealthy=false', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0))
    for (let i = 0; i < 4; i += 1) {
      reg.recordFailure('t1', 'WECHAT', `fail-${i}`)
    }
    // 4 次失败, 仍 healthy
    let primary = reg.selectPrimary('t1', 'WECHAT')
    assert.ok(primary)
    reg.recordFailure('t1', 'WECHAT', 'fail-5')
    // 5 次失败 → 熔断
    assert.throws(() => reg.selectPrimary('t1', 'WECHAT'), NoChannelConfiguredError)
  })
  it('recordSuccess resets counter and restores health', () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0))
    for (let i = 0; i < 5; i += 1) reg.recordFailure('t1', 'WECHAT', 'x')
    assert.throws(() => reg.selectPrimary('t1', 'WECHAT'), NoChannelConfiguredError)
    reg.recordSuccess('t1', 'WECHAT')
    const primary = reg.selectPrimary('t1', 'WECHAT')
    assert.ok(primary)
  })
  it('cooldown 过后自动 half-open', () => {
    const reg = new PaymentChannelRegistry()
    // 手动构造: 31 秒前失败 (超过 cooldown 30s)
    const past = new Date(Date.now() - 31_000).toISOString()
    reg.register(
      buildChannel('t1', 'WECHAT', 0, {
        isHealthy: false,
        lastFailureAt: past
      })
    )
    // cooldown 已过 → 视为可用
    const primary = reg.selectPrimary('t1', 'WECHAT')
    assert.ok(primary, 'cooldown 过后应自动恢复')
  })
  it('cooldown 未到仍熔断', () => {
    const reg = new PaymentChannelRegistry()
    const now = new Date().toISOString()
    reg.register(
      buildChannel('t1', 'WECHAT', 0, {
        isHealthy: false,
        lastFailureAt: now
      })
    )
    assert.throws(() => reg.selectPrimary('t1', 'WECHAT'), NoChannelConfiguredError)
  })
})
// ═══════════════════════════════════════════════════════════════
// 5. executeWithFailover
// ═══════════════════════════════════════════════════════════════
describe('PaymentChannelRegistry · executeWithFailover', () => {
  it('主通道成功 → 不走备', async () => {
    const reg = new PaymentChannelRegistry()
    const primary = buildChannel('t1', 'WECHAT', 0)
    const backup = buildChannel('t1', 'WECHAT', 1)
    reg.register(primary)
    reg.register(backup)
    const result = await reg.executeWithFailover({
      tenantId: 't1',
      method: 'WECHAT',
      op: async (channel) => {
        const r = await channel.createPrepay({ id: 'o-1', totalCents: 100 }, 'WECHAT')
        return r.prepayId
      }
    })
    assert.equal(result, 'WECHAT-o-1')
    assert.equal(primary.createPrepayCalls, 1)
    assert.equal(backup.createPrepayCalls, 0)
  })
  it('主失败 → 切备', async () => {
    const reg = new PaymentChannelRegistry()
    const primary = buildChannel('t1', 'WECHAT', 0)
    const backup = buildChannel('t1', 'WECHAT', 1)
    primary.failTimes = 1
    primary.failWithError = 'primary down'
    reg.register(primary)
    reg.register(backup)
    const visited: PaymentMethod[] = []
    const result = await reg.executeWithFailover({
      tenantId: 't1',
      method: 'WECHAT',
      op: async (channel) => {
        visited.push(channel.config.channel)
        const r = await channel.createPrepay({ id: 'o-2', totalCents: 200 }, 'WECHAT')
        return r.prepayId
      }
    })
    assert.equal(result, 'WECHAT-o-2')
    assert.deepEqual(visited, ['WECHAT', 'WECHAT'])
    assert.equal(primary.createPrepayCalls, 1)
    assert.equal(backup.createPrepayCalls, 1)
  })
  it('所有通道失败 → AllChannelsFailedError', async () => {
    const reg = new PaymentChannelRegistry()
    const c1 = buildChannel('t1', 'WECHAT', 0)
    const c2 = buildChannel('t1', 'WECHAT', 1)
    c1.failTimes = 99
    c2.failTimes = 99
    reg.register(c1)
    reg.register(c2)
    await assert.rejects(
      reg.executeWithFailover({
        tenantId: 't1',
        method: 'WECHAT',
        op: async (channel) => {
          return await channel.createPrepay({ id: 'o-3', totalCents: 300 }, 'WECHAT')
        }
      }),
      (err: unknown) => {
        assert.ok(err instanceof AllChannelsFailedError)
        const e = err as AllChannelsFailedError
        assert.equal(e.attempts.length, 2)
        assert.equal(e.method, 'WECHAT')
        return true
      }
    )
  })
  it('onChannel 回调记录路由路径', async () => {
    const reg = new PaymentChannelRegistry()
    reg.register(buildChannel('t1', 'WECHAT', 0))
    reg.register(buildChannel('t1', 'WECHAT', 1))
    const visited: number[] = []
    await reg.executeWithFailover({
      tenantId: 't1',
      method: 'WECHAT',
      op: async (channel) => {
        return await channel.createPrepay({ id: 'o-4', totalCents: 0 }, 'WECHAT')
      },
      onChannel: (channel) => {
        visited.push(channel.config.priority)
      }
    })
    assert.deepEqual(visited, [0])
  })
})
