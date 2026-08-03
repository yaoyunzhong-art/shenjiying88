/**
 * finance-reconciliation-external.gateway.ts — P-38 RQ-38-05
 * 外部支付渠道对账网关
 *
 * 功能:
 *   1. 从微信支付/支付宝下载对账单
 *   2. 解析对账单为统一格式
 *   3. 标记差异（我方记录 vs 渠道记录）
 *   4. 提供对账结果给 FinanceReconciliationService
 *
 * Phase-45 接入真实微信/支付宝 API
 */

import { Injectable, Logger } from '@nestjs/common'
import { ReconciliationChannel } from './dto/create-reconciliation.dto'

// ─── 类型定义 ──────────────────────────────────────────

/** 外部渠道交易记录（统一格式） */
export interface ExternalTransaction {
  /** 渠道交易号（微信/支付宝） */
  providerTxnId: string
  /** 我方订单号 */
  orderId: string
  /** 交易金额（分） */
  amountCents: number
  /** 交易时间 ISO */
  txnAt: string
  /** 渠道: WECHAT | ALIPAY | BANK */
  channel: ReconciliationChannel
  /** 交易状态: SUCCESS | REFUND | PARTIAL_REFUND */
  status: 'SUCCESS' | 'REFUND' | 'PARTIAL_REFUND'
  /** 商户号 */
  merchantId: string
  /** 手续费（分） */
  feeCents: number
  /** 退款金额（分） */
  refundCents: number
}

/** 对账单汇总 */
export interface ExternalStatement {
  /** 对账日期 YYYY-MM-DD */
  date: string
  /** 渠道 */
  channel: ReconciliationChannel
  /** 交易总数 */
  totalCount: number
  /** 交易总金额（分） */
  totalAmountCents: number
  /** 总手续费（分） */
  totalFeeCents: number
  /** 总退款金额（分） */
  totalRefundCents: number
  /** 交易明细 */
  transactions: ExternalTransaction[]
  /** 原始文件内容（调试用） */
  rawCsvLines?: string[]
}

/** 对账差异类型 */
export type ReconciliationDifference = {
  type: 'MISSING_INTERNAL' | 'MISSING_EXTERNAL' | 'AMOUNT_MISMATCH' | 'STATUS_MISMATCH'
  externalTxn?: ExternalTransaction
  internalTxnId?: string
  description: string
  expectedAmountCents?: number
  actualAmountCents?: number
}

/** 对账结果 */
export interface ExternalReconciliationResult {
  statement: ExternalStatement
  differences: ReconciliationDifference[]
  matchedCount: number
  matchedAmountCents: number
  differenceCount: number
  differenceAmountCents: number
  isBalanced: boolean
}

// ─── Mock 微信/支付宝账单数据 ────────────────────────

interface MockBillConfig {
  channel: ReconciliationChannel
  merchantId: string
  baseDate: Date
}

function generateMockTransactions(config: MockBillConfig): ExternalTransaction[] {
  const { channel, merchantId, baseDate } = config
  const transactions: ExternalTransaction[] = []

  // 生成 20 笔正常交易
  for (let i = 1; i <= 20; i++) {
    const txnAt = new Date(baseDate)
    txnAt.setHours(9 + Math.floor(i / 4), (i * 17) % 60, 0)

    transactions.push({
      providerTxnId: `${channel === ReconciliationChannel.WECHAT ? 'wx' : 'al'}_${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}_${String(i).padStart(6, '0')}`,
      orderId: `ORD-${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(5, '0')}`,
      amountCents: [3000, 5000, 1500, 8000, 2000, 3500, 6000, 1200, 4500, 2500, 7000, 1800, 3200, 9000, 2200, 4800, 1600, 5500, 2800, 4200][i - 1]!,
      txnAt: txnAt.toISOString(),
      channel,
      status: 'SUCCESS',
      merchantId,
      feeCents: Math.round(([3000, 5000, 1500, 8000, 2000, 3500, 6000, 1200, 4500, 2500, 7000, 1800, 3200, 9000, 2200, 4800, 1600, 5500, 2800, 4200][i - 1]! * 0.006) * 100) / 100,
      refundCents: 0,
    })
  }

  // 插入 2 笔退款交易
  transactions.push({
    providerTxnId: `${channel === ReconciliationChannel.WECHAT ? 'wx' : 'al'}_${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}_refund_001`,
    orderId: `ORD-${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}-00005`,
    amountCents: 2000,
    txnAt: new Date(baseDate.getTime() + 12 * 3600 * 1000).toISOString(),
    channel,
    status: 'REFUND',
    merchantId,
    feeCents: 0,
    refundCents: 2000,
  })

  transactions.push({
    providerTxnId: `${channel === ReconciliationChannel.WECHAT ? 'wx' : 'al'}_${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}_refund_002`,
    orderId: `ORD-${baseDate.toISOString().slice(0, 10).replace(/-/g, '')}-00012`,
    amountCents: 1200,
    txnAt: new Date(baseDate.getTime() + 14 * 3600 * 1000).toISOString(),
    channel,
    status: 'REFUND',
    merchantId,
    feeCents: 0,
    refundCents: 1200,
  })

  return transactions
}

// ─── 外部渠道对账单模拟器 ────────────────────────────

/**
 * ExternalReconciliationGateway
 *
 * 从外部渠道（微信支付/支付宝）下载和解析对账单。
 * Phase-45 替换为真实 API 调用。
 *
 * 当前的 mock 实现：
 *   - 生成期 20 笔成功交易 + 2 笔退款
 *   - 支持按日/按渠道过滤
 *   - 模拟微信 CSLV 格式和支付宝 CSV 格式
 */
@Injectable()
export class ExternalReconciliationGateway {
  private readonly logger = new Logger(ExternalReconciliationGateway.name)

  /**
   * 下载指定日期和渠道的对账单
   *
   * @param date - 对账日期 YYYY-MM-DD
   * @param channel - 支付渠道 (WECHAT | ALIPAY | BANK)
   * @param options - 可选的 merchantId 等
   */
  async fetchStatement(
    date: string,
    channel: ReconciliationChannel,
    options?: { merchantId?: string }
  ): Promise<ExternalStatement> {
    this.logger.log(`📥 下载对账单 date=${date} channel=${channel} merchantId=${options?.merchantId ?? 'default'}`)

    // Phase-45: 替换为真实 HTTP 调用
    //   WECHAT: GET https://api.mch.weixin.qq.com/v3/bill/tradebill?bill_date=${date}&bill_type=ALL
    //   ALIPAY: POST https://openapi.alipay.com/gateway.do?method=alipay.data.dataservice.bill.downloadurl.query
    const merchantId = options?.merchantId ?? `merchant_${channel.toLowerCase()}_001`
    const baseDate = new Date(date + 'T00:00:00+08:00')

    const transactions = generateMockTransactions({ channel, merchantId, baseDate })
    const totalAmountCents = transactions.reduce((s, t) => s + (t.status === 'SUCCESS' ? t.amountCents : 0), 0)
    const totalFeeCents = transactions.reduce((s, t) => s + t.feeCents, 0)
    const totalRefundCents = transactions.reduce((s, t) => s + t.refundCents, 0)

    const statement: ExternalStatement = {
      date,
      channel,
      totalCount: transactions.length,
      totalAmountCents,
      totalFeeCents,
      totalRefundCents,
      transactions,
    }

    this.logger.log(`✅ 对账单就绪 date=${date} channel=${channel} count=${transactions.length} amount=${totalAmountCents}`)
    return statement
  }

  /**
   * 对账（系统记录 vs 渠道记录）
   *
   * @param statement - 从渠道下载的对账单
   * @param internalTransactions - 我方数据库中的交易记录
   */
  async reconcile(
    statement: ExternalStatement,
    internalTransactions: Array<{ id: string; orderId: string; amountCents: number; status: string; providerTxnId: string | null }>
  ): Promise<ExternalReconciliationResult> {
    this.logger.log(`🔄 开始对账 channel=${statement.channel} date=${statement.date}`)
    this.logger.log(`   外部: ${statement.transactions.length} 笔 | 内部: ${internalTransactions.length} 笔`)

    const differences: ReconciliationDifference[] = []
    let matchedCount = 0
    let matchedAmountCents = 0

    // 建立外部索引 (providerTxnId → ExternalTransaction)
    const externalIndex = new Map(statement.transactions.map(t => [t.providerTxnId, t]))

    // 建立内部索引 (providerTxnId → internalTransaction)
    const internalIndex = new Map(internalTransactions.map(t => [t.providerTxnId ?? '', t]))

    // Step 1: 遍历渠道记录，匹配系统记录
    for (const externalTxn of statement.transactions) {
      const internalTxn = internalIndex.get(externalTxn.providerTxnId)

      if (!internalTxn) {
        // 渠道有但系统没有 → 缺内部记录
        differences.push({
          type: 'MISSING_INTERNAL',
          externalTxn,
          description: `渠道有交易 ${externalTxn.providerTxnId} (¥${(externalTxn.amountCents / 100).toFixed(2)}) 但系统无对应记录`,
          expectedAmountCents: externalTxn.amountCents,
        })
        continue
      }

      // 金额校验
      if (internalTxn.amountCents !== externalTxn.amountCents) {
        differences.push({
          type: 'AMOUNT_MISMATCH',
          externalTxn,
          internalTxnId: internalTxn.id,
          description: `金额不匹配: 系统=${internalTxn.amountCents}c 渠道=${externalTxn.amountCents}c`,
          expectedAmountCents: internalTxn.amountCents,
          actualAmountCents: externalTxn.amountCents,
        })
        continue
      }

      // 状态校验 (简化: 我方 SUCCESS ↔ 渠道 SUCCESS)
      const externalStatusOk = externalTxn.status === 'SUCCESS'
      const internalStatusOk = internalTxn.status === 'SUCCESS' || internalTxn.status === 'PAID'
      if (externalStatusOk !== internalStatusOk) {
        differences.push({
          type: 'STATUS_MISMATCH',
          externalTxn,
          internalTxnId: internalTxn.id,
          description: `状态不匹配: 系统=${internalTxn.status} 渠道=${externalTxn.status}`,
        })
        continue
      }

      // 完全匹配
      matchedCount++
      matchedAmountCents += externalTxn.amountCents
    }

    // Step 2: 遍历系统记录，找系统有但渠道没有的
    for (const internalTxn of internalTransactions) {
      if (!internalTxn.providerTxnId) {
        // 没有 providerTxnId 的系统记录 — 无法对账
        differences.push({
          type: 'MISSING_EXTERNAL',
          internalTxnId: internalTxn.id,
          description: `系统交易 ${internalTxn.id} (¥${(internalTxn.amountCents / 100).toFixed(2)}) 无 providerTxnId，无法在渠道对账`,
        })
        continue
      }
      if (!externalIndex.has(internalTxn.providerTxnId)) {
        differences.push({
          type: 'MISSING_EXTERNAL',
          internalTxnId: internalTxn.id,
          description: `系统交易 ${internalTxn.id} (¥${(internalTxn.amountCents / 100).toFixed(2)}) 在渠道对账单中不存在`,
          expectedAmountCents: internalTxn.amountCents,
        })
      }
    }

    const totalChannelAmount = statement.transactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((s, t) => s + t.amountCents, 0)
    const differenceAmountCents = differences
      .filter(d => d.type === 'AMOUNT_MISMATCH' || d.type === 'MISSING_INTERNAL')
      .reduce((s, d) => s + (Math.abs((d.expectedAmountCents ?? 0) - (d.actualAmountCents ?? 0)) || (d.expectedAmountCents ?? 0)), 0)

    const result: ExternalReconciliationResult = {
      statement,
      differences,
      matchedCount,
      matchedAmountCents,
      differenceCount: differences.length,
      differenceAmountCents,
      isBalanced: differences.length === 0,
    }

    this.logger.log(`📊 对账完成: matched=${matchedCount}/${statement.transactions.length} diff=${differences.length} balanced=${result.isBalanced}`)
    return result
  }

  /**
   * 模拟人工调账
   * Phase-45: 调用渠道退款/冲正 API
   */
  async manualAdjustment(
    result: ExternalReconciliationResult,
    adjustmentId: string,
    resolved: boolean
  ): Promise<ExternalReconciliationResult> {
    this.logger.log(`🔧 调账 adjustmentId=${adjustmentId} resolved=${resolved}`)
    // 实际调用渠道的退款/冲正接口
    return {
      ...result,
      isBalanced: resolved && result.differences.length === 0,
    }
  }
}
