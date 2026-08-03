/**
 * 🧪 P-38 RQ-38-05: 外部对账网关测试 (Vitest 版)
 * ExternalReconciliationGateway
 *
 * 三件套:
 *   - 正例: 下载对账单 + 完全对账
 *   - 反例: 金额不匹配 + 状态不匹配
 *   - 边界: 空对账单 + 无 providerTxnId
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ExternalReconciliationGateway } from './finance-reconciliation-external.gateway'
import { ReconciliationChannel } from './dto/create-reconciliation.dto'

describe('ExternalReconciliationGateway', () => {
  let gateway: ExternalReconciliationGateway

  beforeEach(() => {
    gateway = new ExternalReconciliationGateway()
  })

  // ════════════════════════════════════════════════════
  // 正例
  // ════════════════════════════════════════════════════

  it('[正例] 下载微信对账单应返回完整的 ExternalStatement', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    expect(statement).toBeTruthy()
    expect(statement.date).toBe('2026-07-19')
    expect(statement.channel).toBe(ReconciliationChannel.WECHAT)
    expect(statement.totalCount).toBeGreaterThan(0)
    expect(statement.totalAmountCents).toBeGreaterThan(0)
    expect(Array.isArray(statement.transactions)).toBe(true)

    const first = statement.transactions[0]
    expect(first?.providerTxnId).toBeTruthy()
    expect(first?.orderId).toBeTruthy()
    expect(first?.amountCents).toBeGreaterThan(0)
    expect(first?.txnAt).toBeTruthy()
    expect(first?.channel).toBe(ReconciliationChannel.WECHAT)
    expect(['SUCCESS', 'REFUND', 'PARTIAL_REFUND']).toContain(first?.status)

    const refunds = statement.transactions.filter(t => t.status === 'REFUND')
    expect(refunds.length).toBeGreaterThan(0)
  })

  it('[正例] 支付宝对账单格式与微信一致', async () => {
    const wechat = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const alipay = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.ALIPAY)

    expect(wechat.transactions.length).toBeGreaterThan(0)
    expect(alipay.transactions.length).toBeGreaterThan(0)

    expect(wechat.transactions[0]?.providerTxnId).toMatch(/^wx_/)
    expect(alipay.transactions[0]?.providerTxnId).toMatch(/^al_/)
  })

  it('[正例] 完全对账: 所有渠道记录在系统内存在且金额一致', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    const internalTxns = statement.transactions
      .filter(t => t.status === 'SUCCESS')
      .map(t => ({
        id: `internal-${t.providerTxnId}`,
        orderId: t.orderId,
        amountCents: t.amountCents,
        status: 'SUCCESS',
        providerTxnId: t.providerTxnId,
      }))

    const result = await gateway.reconcile(statement, internalTxns)
    expect(result.matchedCount).toBe(internalTxns.length)
    expect(result.differenceCount).toBe(2)
    expect(result.matchedAmountCents).toBeGreaterThan(0)
    const missingInt = result.differences.filter(d => d.type === 'MISSING_INTERNAL')
    expect(missingInt).toHaveLength(2)
  })

  // ════════════════════════════════════════════════════
  // 反例
  // ════════════════════════════════════════════════════

  it('[反例] 金额不匹配: 系统金额与渠道金额不同', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    const internalTxns = statement.transactions
      .filter(t => t.status === 'SUCCESS')
      .slice(0, 5)
      .map((t, i) => ({
        id: `internal-${t.providerTxnId}`,
        orderId: t.orderId,
        amountCents: i === 0 ? t.amountCents + 500 : t.amountCents,
        status: 'SUCCESS',
        providerTxnId: t.providerTxnId,
      }))

    const result = await gateway.reconcile(statement, internalTxns)
    expect(result.isBalanced).toBe(false)
    const amountDiff = result.differences.filter(d => d.type === 'AMOUNT_MISMATCH')
    expect(amountDiff.length).toBeGreaterThan(0)
    expect(amountDiff[0]?.description).toContain('500')
  })

  it('[反例] 状态不匹配: 系统 SUCCESS 但渠道 REFUND', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    const refundTxn = statement.transactions.find(t => t.status === 'REFUND')!
    const internalTxns = [
      {
        id: 'internal-wrong-status',
        orderId: refundTxn.orderId,
        amountCents: refundTxn.amountCents,
        status: 'SUCCESS',
        providerTxnId: refundTxn.providerTxnId,
      },
    ]

    const result = await gateway.reconcile(statement, internalTxns)
    const statusDiff = result.differences.filter(d => d.type === 'STATUS_MISMATCH')
    expect(statusDiff.length).toBeGreaterThan(0)
  })

  it('[反例] 系统有但渠道没有: MISSING_EXTERNAL', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const internalTxns = [
      {
        id: 'internal-orphan-001',
        orderId: 'ORD-20260719-99999',
        amountCents: 10000,
        status: 'SUCCESS',
        providerTxnId: 'wx_20260719_orphan_001',
      },
    ]

    const result = await gateway.reconcile(statement, internalTxns)
    const missingExt = result.differences.filter(d => d.type === 'MISSING_EXTERNAL')
    expect(missingExt.length).toBeGreaterThan(0)
  })

  // ════════════════════════════════════════════════════
  // 边界
  // ════════════════════════════════════════════════════

  it('[边界] 空对账单不应崩溃', async () => {
    const emptyStatement = {
      date: '2026-07-19',
      channel: ReconciliationChannel.WECHAT,
      totalCount: 0,
      totalAmountCents: 0,
      totalFeeCents: 0,
      totalRefundCents: 0,
      transactions: [],
    }

    const result = await gateway.reconcile(emptyStatement, [])
    expect(result.isBalanced).toBe(true)
    expect(result.matchedCount).toBe(0)
    expect(result.differenceCount).toBe(0)
  })

  it('[边界] 系统交易无 providerTxnId 自动标记为 MISSING_EXTERNAL', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const internalTxns = [
      {
        id: 'internal-no-txnid',
        orderId: 'ORD-20260719-00001',
        amountCents: 5000,
        status: 'SUCCESS',
        providerTxnId: null,
      },
    ]

    const result = await gateway.reconcile(statement, internalTxns as any)
    const missingExt = result.differences.filter(d => d.type === 'MISSING_EXTERNAL' && d.description.includes('无 providerTxnId'))
    expect(missingExt.length).toBeGreaterThan(0)
  })

  it('[边界] 部分对账: 只有部分系统记录匹配', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const successTxns = statement.transactions.filter(t => t.status === 'SUCCESS')

    const partialTxns = successTxns.slice(0, 10).map(t => ({
      id: `internal-${t.providerTxnId}`,
      orderId: t.orderId,
      amountCents: t.amountCents,
      status: 'SUCCESS',
      providerTxnId: t.providerTxnId,
    }))

    const result = await gateway.reconcile(statement, partialTxns)
    expect(result.isBalanced).toBe(false)
    expect(result.matchedCount).toBeLessThanOrEqual(12)
    expect(result.differences.length).toBeGreaterThanOrEqual(12)
  })

  it('[边界] 同一天多渠道对账互不干扰', async () => {
    const [wx, alipay] = await Promise.all([
      gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT),
      gateway.fetchStatement('2026-07-19', ReconciliationChannel.ALIPAY),
    ])

    expect(wx.transactions.length).not.toBe(0)
    expect(alipay.transactions.length).not.toBe(0)

    expect(wx.transactions[0]?.providerTxnId).toMatch(/^wx_/)
    expect(alipay.transactions[0]?.providerTxnId).toMatch(/^al_/)

    const wxIds = new Set(wx.transactions.map(t => t.providerTxnId))
    const aliIds = new Set(alipay.transactions.map(t => t.providerTxnId))
    for (const id of wxIds) {
      expect(aliIds.has(id)).toBe(false)
    }
  })
})
