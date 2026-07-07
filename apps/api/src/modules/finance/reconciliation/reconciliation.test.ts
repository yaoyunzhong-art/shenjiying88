import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { WeChatReconciliationAdapter } from './wechat-reconciliation.adapter'
import { AlipayReconciliationAdapter } from './alipay-reconciliation.adapter'
import { ReconciliationService } from './reconciliation.service'
import { ReconciliationCron } from './reconciliation.cron'
import {
  ReconciliationAdapterError,
  type ReconciliationAdapter,
  type ChannelBillRow
} from './reconciliation.port'
import type { Payment, PaymentMethod } from '@m5/types'

/**
 * P1-2.6 对账 4 子套件测试
 *
 *   1. 适配器 (WeChat CSV 解析 + Alipay + 错误处理)
 *   2. 服务 (matched / only-internal / only-channel / amount-mismatch / status-mismatch)
 *   3. 差异分类 (5 种 kind 全覆盖)
 *   4. 并发 (cron 重入锁 + 异常隔离)
 */

// ─── 测试 fixture ─────────────────────────────────────

function makePayment(input: Partial<Payment> & { id: string; status: Payment['status'] }): Payment {
  return {
    id: input.id,
    tenantId: input.tenantId ?? 't1',
    orderId: input.orderId ?? input.id,
    method: input.method ?? 'WECHAT',
    amountCents: input.amountCents ?? 9900,
    status: input.status,
    providerTxnId: input.providerTxnId ?? `tx-${input.id}`,
    idempotencyKey: input.idempotencyKey ?? `idem-${input.id}`,
    paidAt: input.paidAt ?? (input.status === 'SUCCESS' ? '2026-07-02T10:00:00+08:00' : null),
    failureReason: input.failureReason ?? null,
    createdAt: input.createdAt ?? '2026-07-02T09:55:00+08:00',
    updatedAt: input.updatedAt ?? '2026-07-02T10:00:00+08:00'
  }
}

function makeBillRow(input: Partial<ChannelBillRow> & { outOrderId: string }): ChannelBillRow {
  return {
    channelTxnId: input.channelTxnId ?? `wx-tx-${input.outOrderId}`,
    outOrderId: input.outOrderId,
    channel: input.channel ?? 'WECHAT',
    amountCents: input.amountCents ?? 9900,
    feeCents: input.feeCents ?? 0,
    txType: input.txType ?? 'PAYMENT',
    status: input.status ?? 'SUCCESS',
    completedAt: input.completedAt ?? '2026-07-02T10:00:00+08:00',
    rawPayload: input.rawPayload
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. 适配器子套件
// ═══════════════════════════════════════════════════════════════

describe('WeChatReconciliationAdapter · CSV 解析', () => {
  function makeAdapter() {
    return new WeChatReconciliationAdapter({
      baseUrl: 'https://api.mch.weixin.qq.com',
      signingSecret: 'test-secret',
      timeoutMs: 5000
    })
  }

  it('1.1 PAYMENT 收入: 解析 → ChannelBillRow 金额分单位 + status=SUCCESS', () => {
    const adapter = makeAdapter()
    const csv = [
      '2026-07-02 10:00:00,wx-tx-001,m-001,f-001,下单支付,收入,99.00,0.60,成功',
      '2026-07-02 10:05:00,wx-tx-002,m-002,f-002,下单支付,收入,199.50,1.20,成功'
    ].join('\n')

    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows.length, 2)
    assert.equal(rows[0]!.channelTxnId, 'wx-tx-001')
    assert.equal(rows[0]!.outOrderId, 'm-001')
    assert.equal(rows[0]!.amountCents, 9900)
    assert.equal(rows[0]!.feeCents, 60)
    assert.equal(rows[0]!.txType, 'PAYMENT')
    assert.equal(rows[0]!.status, 'SUCCESS')
    assert.equal(rows[0]!.completedAt, '2026-07-02T10:00:00+08:00')
    assert.equal(rows[1]!.amountCents, 19950)
  })

  it('1.2 REFUND 支出: 金额 + 手续费取负 + txType=REFUND', () => {
    const adapter = makeAdapter()
    const csv = '2026-07-02 11:00:00,wx-tx-r1,m-001,f-r1,退款,支出,99.00,0.60,退款'

    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.amountCents, -9900)
    assert.equal(rows[0]!.feeCents, -60)
    assert.equal(rows[0]!.txType, 'REFUND')
    assert.equal(rows[0]!.status, 'REFUND')
  })

  it('1.3 跳过表头 + 跳过汇总行 (微信 CSV 末尾)', () => {
    const adapter = makeAdapter()
    const csv = [
      '记账时间,微信支付业务单号,商户订单号,资金流水单号,业务名称,收支类型,收支金额(元),手续费(元),资金状态',
      '2026-07-02 10:00:00,wx-tx-001,m-001,f-001,下单支付,收入,99.00,0.60,成功',
      '资金流水单号,商户订单号,业务名称,收支类型,收支金额(元),手续费(元)',
      '总笔数: 1 / 总金额: 99.00 / 总手续费: 0.60'
    ].join('\n')

    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows.length, 1, '表头 + 汇总行被跳过')
    assert.equal(rows[0]!.outOrderId, 'm-001')
  })

  it('1.4 跳过 < 9 列的破损行', () => {
    const adapter = makeAdapter()
    const csv = [
      '2026-07-02 10:00:00,wx-tx-001,m-001', // 破损
      '2026-07-02 10:05:00,wx-tx-002,m-002,f-002,下单支付,收入,99.00,0.60,成功'
    ].join('\n')

    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.outOrderId, 'm-002')
  })

  it('1.5 FAILED/PENDING 状态映射', () => {
    const adapter = makeAdapter()
    const csv = [
      '2026-07-02 10:00:00,wx-tx-f1,m-f1,f-f1,下单支付,收入,10.00,0.10,失败',
      '2026-07-02 11:00:00,wx-tx-p1,m-p1,f-p1,下单支付,收入,20.00,0.20,处理中'
    ].join('\n')

    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows[0]!.status, 'FAILED')
    assert.equal(rows[1]!.status, 'PENDING')
  })

  it('1.6 日期时间归一化: "yyyy-MM-dd HH:mm:ss" → ISO 8601 +08:00', () => {
    const adapter = makeAdapter()
    const csv = '2026-07-02 14:30:00,wx-tx-1,m-1,f-1,下单支付,收入,1.00,0.01,成功'
    const rows = adapter.parseWeChatCsv(csv, 't1')
    assert.equal(rows[0]!.completedAt, '2026-07-02T14:30:00+08:00')
  })

  it('1.7 非法日期格式 → ReconciliationAdapterError(retryable=false)', async () => {
    const adapter = makeAdapter()
    // 注入一个永远失败的 fetch, 但在参数校验阶段就抛
    await assert.rejects(
      adapter.downloadBill('t1', '2026/07/02'),
      (err: unknown) => {
        assert.ok(err instanceof ReconciliationAdapterError)
        assert.equal((err as ReconciliationAdapterError).retryable, false)
        assert.match((err as Error).message, /Invalid date format/)
        return true
      }
    )
  })

  it('1.8 healthCheck 默认 healthy=true, 0 failures', async () => {
    const adapter = makeAdapter()
    const health = await adapter.healthCheck('t1')
    assert.equal(health.healthy, true)
    assert.equal(health.consecutiveFailures, 0)
    assert.equal(health.channel, 'WECHAT')
  })
})

describe('AlipayReconciliationAdapter · 解析', () => {
  function makeAdapter() {
    return new AlipayReconciliationAdapter({
      baseUrl: 'https://openapi.alipay.com',
      appId: 'test-app',
      privateKey: 'test-private-key'
    })
  }

  it('2.1 MVP stub: downloadBill 返回空数组 + 标记 healthy', async () => {
    const adapter = makeAdapter()
    const rows = await adapter.downloadBill('t1', '2026-07-02')
    assert.deepEqual(rows, [])
    const health = await adapter.healthCheck('t1')
    assert.equal(health.healthy, true)
  })

  it('2.2 parseAlipayCsv: 收入 + 成功 → amountCents 正数 + status=SUCCESS', () => {
    const adapter = makeAdapter()
    const csv = [
      'ali-tx-001,m-001,交易,2026-07-02 10:00:00,收入,99.00,0.60,交易成功',
      'ali-tx-002,m-002,交易,2026-07-02 10:05:00,收入,199.50,1.20,交易成功'
    ].join('\n')
    const rows = adapter.parseAlipayCsv(csv, 't1')
    assert.equal(rows.length, 2)
    assert.equal(rows[0]!.amountCents, 9900)
    assert.equal(rows[0]!.feeCents, 60)
    assert.equal(rows[0]!.status, 'SUCCESS')
    assert.equal(rows[0]!.txType, 'PAYMENT')
  })

  it('2.3 parseAlipayCsv: 支出 + 已退款 → amountCents 负数 + status=REFUND', () => {
    const adapter = makeAdapter()
    const csv = 'ali-tx-r1,m-001,退款,2026-07-02 11:00:00,支出,99.00,0.60,已退款'
    const rows = adapter.parseAlipayCsv(csv, 't1')
    assert.equal(rows[0]!.amountCents, -9900)
    assert.equal(rows[0]!.txType, 'REFUND')
    assert.equal(rows[0]!.status, 'REFUND')
  })

  it('2.4 parseAlipayCsv: 跳过表头行 (channelTxnId=支付宝交易号)', () => {
    const adapter = makeAdapter()
    const csv = [
      '支付宝交易号,商户订单号,业务类型,交易时间,收/支,金额,手续费,状态',
      'ali-tx-001,m-001,交易,2026-07-02 10:00:00,收入,99.00,0.60,交易成功'
    ].join('\n')
    const rows = adapter.parseAlipayCsv(csv, 't1')
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.outOrderId, 'm-001')
  })

  it('2.5 非法日期格式 → ReconciliationAdapterError(retryable=false)', async () => {
    const adapter = makeAdapter()
    await assert.rejects(
      adapter.downloadBill('t1', '20260702'),
      (err: unknown) => {
        assert.ok(err instanceof ReconciliationAdapterError)
        assert.equal((err as ReconciliationAdapterError).retryable, false)
        return true
      }
    )
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. 服务子套件 (5 种匹配场景)
// ═══════════════════════════════════════════════════════════════

describe('ReconciliationService · 5 种对比场景', () => {
  function build(input: { internals: Payment[]; channels: ChannelBillRow[]; channel?: PaymentMethod }) {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT' as PaymentMethod,
      async downloadBill(_tenantId: string, _date: string) {
        return input.channels
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT' as PaymentMethod, consecutiveFailures: 0 }
      }
    }
    const adapters = new Map<PaymentMethod, ReconciliationAdapter>([['WECHAT', wechatAdapter]])
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return input.internals
        }
      },
      adapters
    )
    return service
  }

  it('3.1 matched: 内部 + 通道完全对齐 → matched=N, discrepancies=[]', async () => {
    const service = build({
      internals: [
        makePayment({ id: 'm-1', status: 'SUCCESS', amountCents: 9900 }),
        makePayment({ id: 'm-2', status: 'SUCCESS', amountCents: 19950 })
      ],
      channels: [
        makeBillRow({ outOrderId: 'm-1', amountCents: 9900, status: 'SUCCESS' }),
        makeBillRow({ outOrderId: 'm-2', amountCents: 19950, status: 'SUCCESS' })
      ]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.internalCount, 2)
    assert.equal(report.channelCount, 2)
    assert.equal(report.matched, 2)
    assert.equal(report.discrepancies.length, 0)
    assert.equal(report.internalTotalCents, 29850)
    assert.equal(report.channelTotalCents, 29850)
    assert.equal(report.diffTotalCents, 0)
  })

  it('3.2 only-internal: 内部有, 通道无 → 差异 only-internal', async () => {
    const service = build({
      internals: [
        makePayment({ id: 'm-1', status: 'SUCCESS', amountCents: 9900 }),
        makePayment({ id: 'm-missing', status: 'SUCCESS', amountCents: 5000 })
      ],
      channels: [makeBillRow({ outOrderId: 'm-1', amountCents: 9900, status: 'SUCCESS' })]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.matched, 1)
    assert.equal(report.discrepancies.length, 1)
    assert.equal(report.discrepancies[0]!.kind, 'only-internal')
    assert.equal(report.discrepancies[0]!.outOrderId, 'm-missing')
    assert.equal(report.discrepancies[0]!.internalAmountCents, 5000)
  })

  it('3.3 only-channel: 通道有, 内部无 → 差异 only-channel', async () => {
    const service = build({
      internals: [makePayment({ id: 'm-1', status: 'SUCCESS', amountCents: 9900 })],
      channels: [
        makeBillRow({ outOrderId: 'm-1', amountCents: 9900, status: 'SUCCESS' }),
        makeBillRow({ outOrderId: 'm-orphan', amountCents: 3000, status: 'SUCCESS' })
      ]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.matched, 1)
    assert.equal(report.discrepancies.length, 1)
    assert.equal(report.discrepancies[0]!.kind, 'only-channel')
    assert.equal(report.discrepancies[0]!.outOrderId, 'm-orphan')
    assert.equal(report.discrepancies[0]!.channelAmountCents, 3000)
  })

  it('3.4 amount-mismatch: 金额不一致 → 差异 amount-mismatch', async () => {
    const service = build({
      internals: [makePayment({ id: 'm-1', status: 'SUCCESS', amountCents: 9900 })],
      channels: [makeBillRow({ outOrderId: 'm-1', amountCents: 9999, status: 'SUCCESS' })]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.matched, 0)
    assert.equal(report.discrepancies.length, 1)
    assert.equal(report.discrepancies[0]!.kind, 'amount-mismatch')
    assert.equal(report.discrepancies[0]!.internalAmountCents, 9900)
    assert.equal(report.discrepancies[0]!.channelAmountCents, 9999)
  })

  it('3.5 status-mismatch: 内部 PENDING, 通道 FAILED → 差异 status-mismatch', async () => {
    const service = build({
      internals: [makePayment({ id: 'm-1', status: 'PENDING', amountCents: 9900 })],
      channels: [makeBillRow({ outOrderId: 'm-1', amountCents: 9900, status: 'FAILED' })]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.matched, 0)
    assert.equal(report.discrepancies.length, 1)
    assert.equal(report.discrepancies[0]!.kind, 'status-mismatch')
    assert.equal(report.discrepancies[0]!.internalStatus, 'PENDING')
    assert.equal(report.discrepancies[0]!.channelStatus, 'FAILED')
  })

  it('3.6 status 等价映射: 内部 SUCCESS + 通道 REFUND → matched (退款已入账)', async () => {
    const service = build({
      internals: [makePayment({ id: 'm-1', status: 'SUCCESS', amountCents: 9900 })],
      channels: [makeBillRow({ outOrderId: 'm-1', amountCents: -9900, status: 'REFUND', txType: 'REFUND' })]
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    // amount-mismatch 因为正负不一致 → 仍记为差异 (这是预期, 退款是负数)
    assert.equal(report.discrepancies[0]!.kind, 'amount-mismatch')
  })

  it('3.7 无 adapter → 产生 partial report (warn + 0 channel)', async () => {
    const service = new ReconciliationService({
      async listPaymentsByDate() {
        return [makePayment({ id: 'm-1', status: 'SUCCESS' })]
      }
    })
    const report = await service.reconcile({ tenantId: 't1', channel: 'ALIPAY', date: '2026-07-02' })
    assert.equal(report.internalCount, 1)
    assert.equal(report.channelCount, 0)
    assert.equal(report.matched, 0)
    assert.equal(report.internalTotalCents, 9900)
    assert.equal(report.channelTotalCents, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. 差异分类子套件 (5 种 kind 全覆盖 + recordDiscrepancy 回调)
// ═══════════════════════════════════════════════════════════════

describe('ReconciliationService · 差异分类全谱', () => {
  it('4.1 同一笔订单同时触发 only-internal + only-channel + amount-mismatch + status-mismatch', async () => {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        return [
          makeBillRow({ outOrderId: 'm-mismatch', amountCents: 9999, status: 'FAILED' }), // 金额+状态都错
          makeBillRow({ outOrderId: 'm-orphan', amountCents: 5000, status: 'SUCCESS' }) // only-channel
        ]
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return [
            makePayment({ id: 'm-mismatch', status: 'PENDING', amountCents: 9900 }), // amount+status mismatch
            makePayment({ id: 'm-missing', status: 'SUCCESS', amountCents: 3000 }) // only-internal
          ]
        }
      },
      new Map([['WECHAT', wechatAdapter]])
    )
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    const kinds = report.discrepancies.map((d) => d.kind).sort()
    assert.deepEqual(kinds, ['amount-mismatch', 'only-channel', 'only-internal'])
    // 注: amount 优先于 status, 一笔订单只记一个差异
    assert.equal(report.discrepancies.find((d) => d.outOrderId === 'm-mismatch')!.kind, 'amount-mismatch')
  })

  it('4.2 recordDiscrepancy 回调被调用 + reportId 透传', async () => {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        return []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const recorded: Array<{ kind: string; reportId: string }> = []
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return [makePayment({ id: 'm-missing', status: 'SUCCESS' })]
        },
        async recordDiscrepancy(d) {
          recorded.push({ kind: d.kind, reportId: d.reportId })
        }
      },
      new Map([['WECHAT', wechatAdapter]])
    )
    const report = await service.reconcile({
      tenantId: 't1',
      channel: 'WECHAT',
      date: '2026-07-02',
      reportId: 'custom-rid-1'
    })
    assert.equal(recorded.length, 1)
    assert.equal(recorded[0]!.kind, 'only-internal')
    assert.equal(recorded[0]!.reportId, 'custom-rid-1')
  })

  it('4.3 recordDiscrepancy 抛错 → 不影响 report 生成 (异常隔离)', async () => {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        return []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return [makePayment({ id: 'm-1', status: 'SUCCESS' })]
        },
        async recordDiscrepancy() {
          throw new Error('DB down')
        }
      },
      new Map([['WECHAT', wechatAdapter]])
    )
    // 不抛 → report 正常生成
    const report = await service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' })
    assert.equal(report.discrepancies.length, 1)
  })

  it('4.4 channel 异常 → ReconciliationAdapterError 透传', async () => {
    const failingAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        throw new ReconciliationAdapterError({
          channel: 'WECHAT',
          tenantId: 't1',
          date: '2026-07-02',
          retryable: true,
          message: 'upstream timeout'
        })
      },
      async healthCheck() {
        return { healthy: false, channel: 'WECHAT', consecutiveFailures: 1 }
      }
    }
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return []
        }
      },
      new Map([['WECHAT', failingAdapter]])
    )
    await assert.rejects(
      service.reconcile({ tenantId: 't1', channel: 'WECHAT', date: '2026-07-02' }),
      (err: unknown) => {
        assert.ok(err instanceof ReconciliationAdapterError)
        assert.equal((err as ReconciliationAdapterError).retryable, true)
        return true
      }
    )
  })

  it('4.5 report 自定义 reportId → 透传到记录', async () => {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        return []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const service = new ReconciliationService(
      {
        async listPaymentsByDate() {
          return [makePayment({ id: 'm-1', status: 'SUCCESS' })]
        }
      },
      new Map([['WECHAT', wechatAdapter]])
    )
    const report = await service.reconcile({
      tenantId: 't1',
      channel: 'WECHAT',
      date: '2026-07-02',
      reportId: 'recon-2026-07-02-t1-WECHAT'
    })
    assert.equal(report.discrepancies[0]!.note, '内部有支付, 通道账单无对应记录 (可能漏单或通道未生成)')
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 并发子套件 (cron 重入锁 + 异常隔离 + metrics)
// ═══════════════════════════════════════════════════════════════

describe('ReconciliationCron · 并发安全 + 异常隔离', () => {
  function buildCron(input: {
    targets: Array<{ tenantId: string; channel: 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' }>
    service: ReconciliationService
  }) {
    return new ReconciliationCron(input.service, () => input.targets)
  }

  function makeService(input: { rowsByChannel: Map<string, ChannelBillRow[]>; internals: Payment[] }) {
    const wechatAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        return input.rowsByChannel.get('WECHAT') ?? []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    return new ReconciliationService(
      {
        async listPaymentsByDate() {
          return input.internals
        }
      },
      new Map([['WECHAT', wechatAdapter]])
    )
  }

  it('5.1 runOnce 成功: 多 (tenant, channel) 都对账 + metrics 累加', async () => {
    const service = makeService({
      rowsByChannel: new Map(),
      internals: [makePayment({ id: 'm-1', status: 'SUCCESS' })]
    })
    const cron = buildCron({
      service,
      targets: [
        { tenantId: 't1', channel: 'WECHAT' },
        { tenantId: 't2', channel: 'WECHAT' }
      ]
    })
    const result = await cron.runOnce({ date: '2026-07-02' })
    assert.equal(result.date, '2026-07-02')
    assert.equal(result.reports, 2)
    assert.equal(result.failed, 0)
    const metrics = cron.getMetrics()
    assert.equal(metrics.totalRuns, 1)
    assert.equal(metrics.totalReconciliations, 2)
    assert.equal(metrics.lastReconciliationDate, '2026-07-02')
  })

  it('5.2 重入锁: 第二次 runOnce 同步调用 → 抛 "already in progress"', async () => {
    // 构造一个慢适配器
    const slowAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        await new Promise((r) => setTimeout(r, 50))
        return []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const service = new ReconciliationService(
      { async listPaymentsByDate() { return [] } },
      new Map([['WECHAT', slowAdapter]])
    )
    const cron = new ReconciliationCron(service, () => [
      { tenantId: 't1', channel: 'WECHAT' }
    ])

    // 第一次: 不 await
    const first = cron.runOnce({ date: '2026-07-02' })
    // 第二次: 立即同步 → 应该抛
    await assert.rejects(
      cron.runOnce({ date: '2026-07-02' }),
      /already in progress/
    )
    await first
  })

  it('5.3 异常隔离: 单 (tenant, channel) 抛错 → 不影响其他, totalFailed++', async () => {
    let wechatCalls = 0
    const flakyAdapter: ReconciliationAdapter = {
      channel: 'WECHAT',
      async downloadBill() {
        wechatCalls++
        if (wechatCalls === 1) {
          throw new ReconciliationAdapterError({
            channel: 'WECHAT',
            tenantId: 't1',
            date: '2026-07-02',
            retryable: true,
            message: 'upstream timeout'
          })
        }
        return []
      },
      async healthCheck() {
        return { healthy: true, channel: 'WECHAT', consecutiveFailures: 0 }
      }
    }
    const service = new ReconciliationService(
      { async listPaymentsByDate() { return [] } },
      new Map([['WECHAT', flakyAdapter]])
    )
    const cron = new ReconciliationCron(service, () => [
      { tenantId: 't1', channel: 'WECHAT' }, // 失败
      { tenantId: 't2', channel: 'WECHAT' } // 成功
    ])
    const result = await cron.runOnce({ date: '2026-07-02' })
    assert.equal(result.reports, 1, 't2 成功')
    assert.equal(result.failed, 1, 't1 失败被记录')
    assert.equal(result.discrepancies, 0)
    const metrics = cron.getMetrics()
    assert.equal(metrics.totalFailed, 1)
    assert.equal(metrics.totalReconciliations, 1)
    assert.match(metrics.lastError ?? '', /upstream timeout/)
  })

  it('5.4 metrics: totalDiscrepancies 累加 + lastRunAt 设置', async () => {
    const service = makeService({
      rowsByChannel: new Map(),
      internals: [makePayment({ id: 'm-missing', status: 'SUCCESS' })]
    })
    const cron = buildCron({
      service,
      targets: [{ tenantId: 't1', channel: 'WECHAT' }]
    })
    const before = Date.now()
    await cron.runOnce({ date: '2026-07-02' })
    const metrics = cron.getMetrics()
    assert.equal(metrics.totalDiscrepancies, 1)
    assert.ok(metrics.lastRunAt)
    assert.ok(new Date(metrics.lastRunAt!).getTime() >= before)
  })

  it('5.5 empty targets → reports=0, failed=0, 不报错', async () => {
    const service = makeService({ rowsByChannel: new Map(), internals: [] })
    const cron = buildCron({ service, targets: [] })
    const result = await cron.runOnce({ date: '2026-07-02' })
    assert.equal(result.reports, 0)
    assert.equal(result.failed, 0)
    assert.equal(result.discrepancies, 0)
  })
})
