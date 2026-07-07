import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CashierToLytBridge } from './cashier-to-lyt.bridge'
import { LytToCashierBridge } from './lyt-to-cashier.bridge'
import type { ILytAdapter } from '../../lyt/interfaces/lyt-adapter.interface'
import type { LytOrderPayload, LytOrderResult, LytMemberProfile } from '@m5/domain'
/**
 * Bridge 测试 (P1-1.4)
 *
 * 覆盖:
 *   - CashierToLytBridge: 3 个事件 (order.paid, order.refunded, member.tier-upgrade)
 *     - 首次 dispatch → success
 *     - 重复 dispatch → duplicate
 *     - adapter 抛错 → failed
 *   - LytToCashierBridge: 3 个事件 (member.profile-synced, order.external-created, gate.pass-record)
 *     - 同上三态
 *   - 售币场景端到端 (P1-1.5)
 */
class FakeLytAdapter implements ILytAdapter {
  readonly adapterName = 'fake-lyt'
  readonly adapterMode = 'mock' as const
  public createOrderCalls: Array<{ lytOrderId?: string; coinProductId?: string; [k: string]: unknown }> = []
  public updateMemberCalls: Array<{ tier?: string; [k: string]: unknown }> = []
  public failNext = false
  async getMember(_memberId: string): Promise<LytMemberProfile> {
    return { memberId: _memberId, levelName: 'GOLD' }
  }
  async createOrder(input: LytOrderPayload): Promise<LytOrderResult> {
    this.createOrderCalls.push(input as unknown as { lytOrderId?: string; coinProductId?: string; [k: string]: unknown })
    if (this.failNext) {
      this.failNext = false
      throw new Error('simulated LYT failure')
    }
    return {
      orderId: input.lytOrderId ?? input.orderId ?? 'unknown',
      totalAmount: input.totalCents ?? 0,
      status: 'CREATED'
    }
  }
  async applyDiscount(orderId: string, couponCode: string) {
    return { orderId, couponCode }
  }
  async syncGateEvent(storeId: string, passCode: string) {
    return { accepted: true, storeId }
  }
  async getDeviceStatus(deviceId: string) {
    return { deviceId, status: 'ONLINE' as const }
  }
  async updateMember(input: { memberId: string; tier?: string; [k: string]: unknown }) {
    this.updateMemberCalls.push(input)
    return { status: 'UPDATED' as const, memberId: input.memberId }
  }
}
const fakeCtx = {
  tenantId: 't1',
  userId: 'u1',
  traceId: 'tr-1'
}
// ═══════════════════════════════════════════════════════════════
// CashierToLytBridge
// ═══════════════════════════════════════════════════════════════
describe('CashierToLytBridge · 3 个事件', () => {
  function buildBridge() {
    const adapter = new FakeLytAdapter()
    const bridge = new CashierToLytBridge({
      resolveLytAdapter: () => adapter
    })
    return { bridge, adapter }
  }
  it('dispatchPaidOrder 首次 → success', async () => {
    const { bridge, adapter } = buildBridge()
    const result = await bridge.dispatchPaidOrder(
      {
        orderId: 'co-1',
        tenantId: 't1',
        memberId: 'm-1',
        totalCents: 1000,
        method: 'WECHAT',
        providerTxnId: 'wx-tx-1',
        coinProductId: 'coin-100',
        coinQuantity: 5,
        paidAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(adapter.createOrderCalls.length, 1)
    assert.equal(adapter.createOrderCalls[0]?.lytOrderId, 'co-1')
    assert.equal(adapter.createOrderCalls[0]?.coinProductId, 'coin-100')
  })
  it('dispatchPaidOrder 重复 → duplicate', async () => {
    const { bridge } = buildBridge()
    const event = {
      orderId: 'co-2',
      tenantId: 't1',
      memberId: 'm-1',
      totalCents: 100,
      method: 'WECHAT' as const,
      providerTxnId: 'wx-tx-2',
      paidAt: new Date().toISOString()
    }
    await bridge.dispatchPaidOrder(event, fakeCtx)
    const second = await bridge.dispatchPaidOrder(event, fakeCtx)
    assert.equal(second.status, 'duplicate')
  })
  it('dispatchPaidOrder adapter 抛错 → failed', async () => {
    const { bridge, adapter } = buildBridge()
    adapter.failNext = true
    const result = await bridge.dispatchPaidOrder(
      {
        orderId: 'co-3',
        tenantId: 't1',
        memberId: 'm-1',
        totalCents: 100,
        method: 'WECHAT',
        providerTxnId: 'wx-tx-3',
        paidAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'failed')
    assert.match(result.message ?? '', /simulated LYT failure/)
  })
  it('dispatchRefundedOrder 不调 adapter, 只 audit', async () => {
    const { bridge, adapter } = buildBridge()
    const result = await bridge.dispatchRefundedOrder(
      {
        orderId: 'co-4',
        tenantId: 't1',
        memberId: 'm-1',
        refundId: 'rf-1',
        refundCents: 500,
        reason: 'user cancel',
        refundedAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(adapter.createOrderCalls.length, 0)
  })
  it('dispatchMemberUpgrade 调 updateMember', async () => {
    const { bridge, adapter } = buildBridge()
    const result = await bridge.dispatchMemberUpgrade(
      {
        memberId: 'm-1',
        tenantId: 't1',
        oldTier: 'SILVER',
        newTier: 'GOLD',
        upgradedAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(adapter.updateMemberCalls.length, 1)
    assert.equal(adapter.updateMemberCalls[0]?.tier, 'GOLD')
  })
})
// ═══════════════════════════════════════════════════════════════
// LytToCashierBridge
// ═══════════════════════════════════════════════════════════════
describe('LytToCashierBridge · 3 个事件', () => {
  function buildBridge() {
    const deps = {
      syncMemberProfile: async (_input: { memberId: string; tenantId: string; profile: { tier?: string } }) => ({ updated: true }),
      syncExternalOrder: async (_input: { lytOrderId: string; tenantId: string; memberId: string; amountCents: number; productType: 'COIN' | 'TICKET' | 'LOCKER' | 'OTHER'; productRef: string }) => ({ cashierOrderId: 'cashier-o-1' }),
      recordGatePass: async (_input: { memberId: string; tenantId: string; gateId: string; passType: 'ENTER' | 'EXIT'; passAt: string; relatedOrderId?: string }) => ({ recorded: true })
    }
    const bridge = new LytToCashierBridge(deps)
    return { bridge, deps }
  }
  it('handleMemberProfileSynced 首次 → success', async () => {
    const { bridge, deps: _deps } = buildBridge()
    const result = await bridge.handleMemberProfileSynced(
      {
        lytMemberId: 'lyt-m-1',
        memberId: 'm-1',
        tenantId: 't1',
        profile: { tier: 'GOLD', points: 1000 },
        syncedAt: '2026-07-03T10:00:00Z'
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(result.message, 'UPDATED')
  })
  it('handleMemberProfileSynced 重复 → duplicate', async () => {
    const { bridge } = buildBridge()
    const event = {
      lytMemberId: 'lyt-m-2',
      memberId: 'm-2',
      tenantId: 't1',
      profile: {},
      syncedAt: '2026-07-03T10:00:00Z'
    }
    await bridge.handleMemberProfileSynced(event, fakeCtx)
    const second = await bridge.handleMemberProfileSynced(event, fakeCtx)
    assert.equal(second.status, 'duplicate')
  })
  it('handleExternalOrderCreated 调 syncExternalOrder', async () => {
    const { bridge, deps: _deps } = buildBridge()
    const result = await bridge.handleExternalOrderCreated(
      {
        lytOrderId: 'lyt-o-1',
        tenantId: 't1',
        lytMemberId: 'lyt-m-1',
        memberId: 'm-1',
        amountCents: 5000,
        productType: 'COIN',
        productRef: 'coin-100',
        createdAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(result.message, 'CREATED')
  })
  it('handleGatePassRecord 调 recordGatePass', async () => {
    const { bridge, deps: _deps } = buildBridge()
    const result = await bridge.handleGatePassRecord(
      {
        lytPassId: 'pass-1',
        tenantId: 't1',
        gateId: 'gate-A',
        lytMemberId: 'lyt-m-1',
        memberId: 'm-1',
        passType: 'ENTER',
        passAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(result.status, 'success')
    assert.equal(result.message, 'RECORDED')
  })
  it('deps 抛错 → failed', async () => {
    const bridge = new LytToCashierBridge({
      syncMemberProfile: async () => {
        throw new Error('cashier member service down')
      },
      syncExternalOrder: async () => ({ cashierOrderId: 'x' }),
      recordGatePass: async () => ({ recorded: false })
    })
    const result = await bridge.handleMemberProfileSynced(
      {
        lytMemberId: 'lyt-m-3',
        memberId: 'm-3',
        tenantId: 't1',
        profile: {},
        syncedAt: '2026-07-03T10:00:00Z'
      },
      fakeCtx
    )
    assert.equal(result.status, 'failed')
    assert.match(result.message ?? '', /cashier member service down/)
  })
})
// ═══════════════════════════════════════════════════════════════
// 售币场景端到端 (P1-1.5)
// ═══════════════════════════════════════════════════════════════
describe('售币场景端到端', () => {
  it('cashier 售币支付成功 → LYT createOrder → LYT 门闸放行 → cashier 标记履约', async () => {
    // 1. cashier 端: 售币订单支付成功
    const cashierBridge = new CashierToLytBridge({
      resolveLytAdapter: () => new FakeLytAdapter()
    })
    const payResult = await cashierBridge.dispatchPaidOrder(
      {
        orderId: 'sale-coin-1',
        tenantId: 't-park',
        memberId: 'm-vip',
        totalCents: 10000,
        method: 'WECHAT',
        providerTxnId: 'wx-tx-coin',
        coinProductId: 'coin-100',
        coinQuantity: 100,
        paidAt: new Date().toISOString()
      },
      fakeCtx
    )
    assert.equal(payResult.status, 'success')
    // 2. LYT 端: 售币成功后会员去玩, 门闸放行 (LYT → cashier 事件)
    const cashierDeps = {
      syncMemberProfile: async () => ({ updated: false }),
      syncExternalOrder: async () => ({ cashierOrderId: 'cashier-sale-coin-1' }),
      recordGatePass: async () => ({ recorded: true })
    }
    const lytBridge = new LytToCashierBridge(cashierDeps)
    const gateResult = await lytBridge.handleGatePassRecord(
      {
        lytPassId: 'pass-coin-1',
        tenantId: 't-park',
        gateId: 'gate-1',
        lytMemberId: 'lyt-m-vip',
        memberId: 'm-vip',
        passType: 'ENTER',
        passAt: new Date().toISOString(),
        relatedOrderId: 'sale-coin-1'
      },
      fakeCtx
    )
    assert.equal(gateResult.status, 'success')
    // 3. 验证事件链: 售币成功 → 门闸放行
    assert.equal(payResult.message, 'CREATED')
    assert.equal(gateResult.message, 'RECORDED')
  })
})
