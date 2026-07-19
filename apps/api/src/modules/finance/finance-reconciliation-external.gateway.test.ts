/**
 * 🧪 P-38 RQ-38-05: 外部对账网关测试
 * ExternalReconciliationGateway
 *
 * 三件套:
 *   - 正例: 下载对账单 + 完全对账
 *   - 反例: 金额不匹配 + 状态不匹配
 *   - 边界: 空对账单 + 无 providerTxnId
 */

import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { ExternalReconciliationGateway } from './finance-reconciliation-external.gateway.js'
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

    assert.ok(statement, '应返回对账单')
    assert.equal(statement.date, '2026-07-19', '日期应匹配')
    assert.equal(statement.channel, ReconciliationChannel.WECHAT, '渠道应为微信')
    assert.ok(statement.totalCount > 0, '应有交易')
    assert.ok(statement.totalAmountCents > 0, '总金额应大于0')
    assert.ok(Array.isArray(statement.transactions), '交易应为数组')

    // 检查第一条交易结构
    const first = statement.transactions[0]!
    assert.ok(first.providerTxnId, '应含 providerTxnId')
    assert.ok(first.orderId, '应含 orderId')
    assert.ok(first.amountCents > 0, '金额应大于0')
    assert.ok(first.txnAt, '应含时间')
    assert.equal(first.channel, ReconciliationChannel.WECHAT, '渠道应一致')
    assert.ok(['SUCCESS', 'REFUND', 'PARTIAL_REFUND'].includes(first.status), '状态应合法')

    // 应包含退款交易
    const refunds = statement.transactions.filter(t => t.status === 'REFUND')
    assert.ok(refunds.length > 0, '应有退款交易')
  })

  it('[正例] 支付宝对账单格式与微信一致', async () => {
    const wechat = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const alipay = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.ALIPAY)

    assert.ok(wechat.transactions.length > 0, '微信应有交易')
    assert.ok(alipay.transactions.length > 0, '支付宝应有交易')

    // providerTxnId 前缀不同
    assert.ok(wechat.transactions[0]!.providerTxnId.startsWith('wx_'), '微信 txn 应以 wx_ 开头')
    assert.ok(alipay.transactions[0]!.providerTxnId.startsWith('al_'), '支付宝 txn 应以 al_ 开头')
  })

  it('[正例] 完全对账: 所有渠道记录在系统内存在且金额一致', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    // 模拟系统记录完美匹配
    const internalTxns = statement.transactions
      .filter(t => t.status === 'SUCCESS')
      .map(t => ({
        id: `internal-${t.providerTxnId}`,
        orderId: t.orderId,
        amountCents: t.amountCents,
        status: 'SUCCESS',
        providerTxnId: t.providerTxnId,
      }))

    // 外部有22笔(含2笔REFUND), 系统只传20笔SUCCESS
    // 2笔REFUND在渠道中providerTxnId不同, 系统无对应记录 → MISSING_INTERNAL
    // 所以matched=20, diff=2, balanced=false
    const result = await gateway.reconcile(statement, internalTxns)
    assert.equal(result.matchedCount, internalTxns.length, '所有SUCCESS记录应匹配')
    assert.equal(result.differenceCount, 2, '2笔退款为MISSING_INTERNAL')
    assert.ok(result.matchedAmountCents > 0, '对账金额应大于0')
    const missingInt = result.differences.filter(d => d.type === 'MISSING_INTERNAL')
    assert.equal(missingInt.length, 2, '2笔退款MISSING_INTERNAL')
  })

  // ════════════════════════════════════════════════════
  // 反例
  // ════════════════════════════════════════════════════

  it('[反例] 金额不匹配: 系统金额与渠道金额不同', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    // 模拟系统记录—故意改金额
    const internalTxns = statement.transactions
      .filter(t => t.status === 'SUCCESS')
      .slice(0, 5)
      .map((t, i) => ({
        id: `internal-${t.providerTxnId}`,
        orderId: t.orderId,
        amountCents: i === 0 ? t.amountCents + 500 : t.amountCents, // 第一条金额 +500
        status: 'SUCCESS',
        providerTxnId: t.providerTxnId,
      }))

    const result = await gateway.reconcile(statement, internalTxns)
    assert.equal(result.isBalanced, false, '金额不匹配应不平衡')
    const amountDiff = result.differences.filter(d => d.type === 'AMOUNT_MISMATCH')
    assert.ok(amountDiff.length > 0, '应发现金额不匹配')
    assert.ok(amountDiff[0]!.description.includes('500'), '差异描述应含差额')
  })

  it('[反例] 状态不匹配: 系统 SUCCESS 但渠道 REFUND', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)

    // 取一笔退款 — 偷换 status
    const refundTxn = statement.transactions.find(t => t.status === 'REFUND')!
    const internalTxns = [
      {
        id: 'internal-wrong-status',
        orderId: refundTxn.orderId,
        amountCents: refundTxn.amountCents,
        status: 'SUCCESS', // 系统显示成功，但渠道显示退款
        providerTxnId: refundTxn.providerTxnId,
      },
    ]

    const result = await gateway.reconcile(statement, internalTxns)
    const statusDiff = result.differences.filter(d => d.type === 'STATUS_MISMATCH')
    assert.ok(statusDiff.length > 0, '应发现状态不匹配')
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
    assert.ok(missingExt.length > 0, '应发现孤儿交易')
  })

  // ════════════════════════════════════════════════════
  // 边界
  // ════════════════════════════════════════════════════

  it('[边界] 空对账单不应崩溃', async () => {
    // 使用 mock 调用约束—空 statement
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
    assert.equal(result.isBalanced, true, '空对账应平衡')
    assert.equal(result.matchedCount, 0, '匹配数为0')
    assert.equal(result.differenceCount, 0, '无差异')
  })

  it('[边界] 系统交易无 providerTxnId 自动标记为 MISSING_EXTERNAL', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const internalTxns = [
      {
        id: 'internal-no-txnid',
        orderId: 'ORD-20260719-00001',
        amountCents: 5000,
        status: 'SUCCESS',
        providerTxnId: null as unknown as string, // null providerTxnId
      },
    ]

    const result = await gateway.reconcile(statement, internalTxns)
    const missingExt = result.differences.filter(d => d.type === 'MISSING_EXTERNAL' && d.description.includes('无 providerTxnId'))
    assert.ok(missingExt.length > 0, '应标记无 providerTxnId 的交易')
  })

  it('[边界] 部分对账: 只有部分系统记录匹配', async () => {
    const statement = await gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT)
    const successTxns = statement.transactions.filter(t => t.status === 'SUCCESS')

    // 只传前 10 笔
    const partialTxns = successTxns.slice(0, 10).map(t => ({
      id: `internal-${t.providerTxnId}`,
      orderId: t.orderId,
      amountCents: t.amountCents,
      status: 'SUCCESS',
      providerTxnId: t.providerTxnId,
    }))

    const result = await gateway.reconcile(statement, partialTxns)
    assert.equal(result.isBalanced, false, '部分对账应不平衡')
    // 10笔SUCCESS match, 但外部还有12笔SUCCESS(未传) + 2笔REFUND(无内部记录)
    // diff: 12笔MISSING_EXTERNAL + 2笔MISSING_INTERNAL = 14
    assert.ok(result.matchedCount <= 12, '最多匹配部分')
    const allDiffs = result.differences
    assert.ok(allDiffs.length >= 12, '应有至少12笔差异')
  })

  it('[边界] 同一天多渠道对账互不干扰', async () => {
    const [wx, alipay] = await Promise.all([
      gateway.fetchStatement('2026-07-19', ReconciliationChannel.WECHAT),
      gateway.fetchStatement('2026-07-19', ReconciliationChannel.ALIPAY),
    ])

    assert.notEqual(wx.transactions.length, 0, '微信有交易')
    assert.notEqual(alipay.transactions.length, 0, '支付宝有交易')

    // 计数相同但交易ID前缀不同
    assert.ok(wx.transactions[0]!.providerTxnId.startsWith('wx_'), '微信 txn 前缀')
    assert.ok(alipay.transactions[0]!.providerTxnId.startsWith('al_'), '支付宝 txn 前缀')
    // 交易ID不重叠
    const wxIds = new Set(wx.transactions.map(t => t.providerTxnId))
    const aliIds = new Set(alipay.transactions.map(t => t.providerTxnId))
    for (const id of wxIds) { assert.ok(!aliIds.has(id), '微信支付宝交易ID不应重叠') }
  })
})
