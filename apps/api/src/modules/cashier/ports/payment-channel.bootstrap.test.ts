import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { PaymentChannelBootstrap } from './payment-channel.bootstrap'
import { PaymentChannelRegistry } from './payment-channel.registry'
import type { MockPaymentGateway } from '../payment.service'
/**
 * PaymentChannelBootstrap 集成测试 (P0-2.6)
 *
 * 覆盖:
 *   - onApplicationBootstrap 注册 3 个默认通道
 *   - 通道可被 registry.selectPrimary 找到
 *   - 通道调用 createPrepay 透传到 MockPaymentGateway
 */
class FakeMockGateway {
  readonly gatewayName = 'fake-mock'
  public lastCreatePrepayCall: { order: { id: string; totalCents: number }; method: string } | null = null
  async createPrepay(order: { id: string; totalCents: number }, method: any) {
    this.lastCreatePrepayCall = { order, method }
    return {
      prepayId: `mock-${order.id}`,
      expiresAt: new Date(Date.now() + 900_000).toISOString()
    }
  }
  async query(providerTxnId: string) {
    return { status: 'SUCCESS' as const, paidAt: new Date().toISOString() }
  }
  async refund(input: any) {
    return { providerRefundId: `rf-${input.paymentId}` }
  }
}
function buildBootstrap() {
  const registry = new PaymentChannelRegistry()
  const mock = new FakeMockGateway() as unknown as MockPaymentGateway
  const bootstrap = new PaymentChannelBootstrap(mock, registry)
  return { registry, mock, bootstrap }
}
describe('PaymentChannelBootstrap · 启动时注册默认通道', () => {
  it('onApplicationBootstrap 注册 WECHAT/ALIPAY/CARD 3 个通道', () => {
    const { registry, bootstrap } = buildBootstrap()
    // 还未 bootstrap
    assert.equal(registry.listChannels('default', 'WECHAT').length, 0)
    // 触发 bootstrap (模拟 NestJS 生命周期)
    bootstrap.onApplicationBootstrap()
    assert.equal(registry.listChannels('default', 'WECHAT').length, 1)
    assert.equal(registry.listChannels('default', 'ALIPAY').length, 1)
    assert.equal(registry.listChannels('default', 'CARD').length, 1)
  })
  it('注册的通道 priority=0, enabled=true, isHealthy=true', () => {
    const { registry, bootstrap } = buildBootstrap()
    bootstrap.onApplicationBootstrap()
    const primary = registry.selectPrimary('default', 'WECHAT')
    assert.equal(primary.config.priority, 0)
    assert.equal(primary.config.enabled, true)
    assert.equal(primary.config.isHealthy, true)
    assert.equal(primary.config.channel, 'WECHAT')
  })
  it('通道 createPrepay 透传到 MockPaymentGateway', async () => {
    const { registry, mock, bootstrap } = buildBootstrap()
    bootstrap.onApplicationBootstrap()
    const primary = registry.selectPrimary('default', 'WECHAT')
    const result = await primary.createPrepay(
      { id: 'o-int', totalCents: 999 },
      'WECHAT'
    )
    assert.equal(result.prepayId, 'mock-o-int')
    assert.equal(
      (mock as unknown as FakeMockGateway).lastCreatePrepayCall?.order.id,
      'o-int'
    )
  })
  it('executeWithFailover 链路: 主 WECHAT 成功', async () => {
    const { registry, bootstrap } = buildBootstrap()
    bootstrap.onApplicationBootstrap()
    const result = await registry.executeWithFailover({
      tenantId: 'default',
      method: 'WECHAT',
      op: async (channel) => {
        const r = await channel.createPrepay({ id: 'o-link', totalCents: 100 }, 'WECHAT')
        return r.prepayId
      }
    })
    assert.equal(result, 'mock-o-link')
  })
})
