// alliance-settlement.service.ts · T112-2 异业分账 + 跨商户关联异常检测
// 落地: P0-8 跨商户关联 / P1-18 未关联订单补录 / P2-12 用户行为分析

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SettlementStatus = 'pending' | 'approved' | 'executed' | 'cancelled'
export type SettlementType = 'ratio' | 'fixed'
export type AnomalySeverity = 'normal' | 'warning' | 'critical'

export interface SettlementParticipant {
  partnerId: string
  partnerName: string
  ratio?: number       // 比例（0-1），type=ratio 时必填
  fixedAmount?: number // 固定金额（分），type=fixed 时必填
}

export interface Settlement {
  settlementId: string
  orderId: string
  type: SettlementType
  totalAmount: number   // 订单总金额（分）
  participants: SettlementParticipant[]
  status: SettlementStatus
  createdAt: Date
  approvedAt?: Date
  executedAt?: Date

  // BS-0269: 分账报表加退货列
  refundAmount?: number    // 退货金额（分）
  returnCount?: number     // 退货笔数
}

// BS-0269: 退货统计数据
export interface RefundStats {
  settlementId: string
  orderId: string
  originalAmount: number
  refundAmount: number
  returnCount: number
  refundRate: number       // 退款率 = refundAmount / originalAmount
  participantsRefunds: Array<{
    partnerId: string
    partnerName: string
    originalAmount: number
    refundAmount: number
  }>
}

export interface UnlinkedOrder {
  orderId: string
  storeId: string
  amount: number
  createdAt: Date
  location?: { lat: number; lng: number }
  linkedPartnerId?: string
  linkStatus: 'unlinked' | 'pending' | 'linked'
}

export interface LinkingCandidate {
  partnerId: string
  partnerName: string
  score: number        // 匹配分数 0-1
  reason: string
}

export interface AnomalyRecord {
  anomalyId: string
  partnerId: string
  type: 'frequent_small' | 'unusual_time' | 'location_drift'
  severity: AnomalySeverity
  detail: string
  detectedAt: Date
  settlementId?: string
}

export interface AnomalyReport {
  partnerId: string
  totalAnomalies: number
  warnings: number
  criticals: number
  records: AnomalyRecord[]
}

// ─── CrossMerchantSettlementService ──────────────────────────────────────────

@Injectable()
export class CrossMerchantSettlementService {
  private readonly logger = new Logger(CrossMerchantSettlementService.name)
  private readonly settlements = new Map<string, Settlement>()
  private readonly partnerHistory = new Map<string, Settlement[]>()

  /**
   * 创建分账单
   * @param orderId 订单ID
   * @param type 分账方式：ratio 按比例 / fixed 按固定金额
   * @param totalAmount 订单总金额（分）
   * @param participants 分账参与方
   */
  createSettlement(
    orderId: string,
    type: SettlementType,
    totalAmount: number,
    participants: SettlementParticipant[],
  ): Settlement {
    if (!orderId || totalAmount <= 0 || !participants || participants.length === 0) {
      throw new SettlementError('INVALID_PARAMS', 'orderId, totalAmount and participants are required')
    }

    if (type === 'ratio') {
      const totalRatio = participants.reduce((sum, p) => sum + (p.ratio ?? 0), 0)
      if (Math.abs(totalRatio - 1) > 0.0001) {
        throw new SettlementError('INVALID_RATIO', `total ratio must be 1, got ${totalRatio}`)
      }
    }

    if (type === 'fixed') {
      const totalFixed = participants.reduce((sum, p) => sum + (p.fixedAmount ?? 0), 0)
      if (totalFixed !== totalAmount) {
        throw new SettlementError('INVALID_FIXED_AMOUNT', `sum of fixedAmount must equal totalAmount: ${totalFixed} vs ${totalAmount}`)
      }
    }

    const settlementId = `stl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const settlement: Settlement = {
      settlementId,
      orderId,
      type,
      totalAmount,
      participants,
      status: 'pending',
      createdAt: new Date(),
    }

    this.settlements.set(settlementId, settlement)

    // 记录到各参与方历史
    for (const p of participants) {
      const history = this.partnerHistory.get(p.partnerId) ?? []
      history.push(settlement)
      this.partnerHistory.set(p.partnerId, history)
    }

    this.logger.log(`Settlement created: ${settlementId} order=${orderId} type=${type} amount=${totalAmount}`)
    return settlement
  }

  /** 审批分账 */
  approveSettlement(settlementId: string): Settlement {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }
    if (settlement.status !== 'pending') {
      throw new SettlementError('INVALID_STATUS', `cannot approve settlement in status: ${settlement.status}`)
    }

    settlement.status = 'approved'
    settlement.approvedAt = new Date()
    this.logger.log(`Settlement approved: ${settlementId}`)
    return settlement
  }

  /** 驳回分账 */
  rejectSettlement(settlementId: string): Settlement {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }
    if (settlement.status !== 'pending') {
      throw new SettlementError('INVALID_STATUS', `cannot reject settlement in status: ${settlement.status}`)
    }
    settlement.status = 'cancelled'
    this.logger.log(`Settlement rejected: ${settlementId}`)
    return settlement
  }

  /** 取消分账（审批后撤） */
  cancelSettlement(settlementId: string): Settlement {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }
    if (settlement.status !== 'approved') {
      throw new SettlementError('INVALID_STATUS', `cannot cancel settlement in status: ${settlement.status}`)
    }
    settlement.status = 'cancelled'
    this.logger.log(`Settlement cancelled: ${settlementId}`)
    return settlement
  }

  /** 执行分账：各商户账户加钱 */
  executeSettlement(settlementId: string): Settlement {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }
    if (settlement.status !== 'approved') {
      throw new SettlementError('INVALID_STATUS', `cannot execute settlement in status: ${settlement.status}`)
    }

    // 计算各参与方实际分账金额
    const executedParticipants = settlement.participants.map((p) => {
      const amount = settlement.type === 'ratio'
        ? Math.round(settlement.totalAmount * (p.ratio ?? 0))
        : (p.fixedAmount ?? 0)
      // 模拟加钱到商户账户
      this.logger.debug(`Adding ${amount} to partner ${p.partnerId}`)
      return { ...p, executedAmount: amount }
    })

    settlement.status = 'executed'
    settlement.executedAt = new Date()
    ;(settlement as any).executedParticipants = executedParticipants

    this.logger.log(`Settlement executed: ${settlementId} participants=${executedParticipants.length}`)
    return settlement
  }

  /** 查询分账状态 */
  querySettlement(settlementId: string): Settlement | undefined {
    return this.settlements.get(settlementId)
  }

  /** 获取分账历史 */
  getSettlementHistory(partnerId: string): Settlement[] {
    return this.partnerHistory.get(partnerId) ?? []
  }

  // ── BS-0269: 分账报表加退货列 ────────────────────────────────────────────

  /**
   * 更新退货信息（模拟退货发生后调用）
   */
  updateRefundInfo(
    settlementId: string,
    refundAmount: number,
    returnCount: number,
  ): Settlement {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }

    settlement.refundAmount = refundAmount
    settlement.returnCount = returnCount

    this.logger.log(`Settlement refund info updated: ${settlementId} refund=${refundAmount} returns=${returnCount}`)
    return settlement
  }

  /**
   * 获取退货统计报表
   */
  getSettlementRefundStats(settlementId: string): RefundStats {
    const settlement = this.settlements.get(settlementId)
    if (!settlement) {
      throw new SettlementError('NOT_FOUND', `settlement ${settlementId} not found`)
    }

    const refundAmount = settlement.refundAmount ?? 0
    const refundRate = settlement.totalAmount > 0
      ? refundAmount / settlement.totalAmount
      : 0

    const participantsRefunds = settlement.participants.map(p => {
      const pAmount = settlement.type === 'ratio'
        ? Math.round(settlement.totalAmount * (p.ratio ?? 0))
        : (p.fixedAmount ?? 0)
      const pRefundRatio = refundRate
      return {
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        originalAmount: pAmount,
        refundAmount: Math.round(pAmount * pRefundRatio),
      }
    })

    return {
      settlementId: settlement.settlementId,
      orderId: settlement.orderId,
      originalAmount: settlement.totalAmount,
      refundAmount,
      returnCount: settlement.returnCount ?? 0,
      refundRate,
      participantsRefunds,
    }
  }

  /**
   * 获取指定商户的退货趋势（基于分账历史）
   */
  getPartnerRefundTrend(partnerId: string): Array<{ settlementId: string; orderId: string; totalAmount: number; refundAmount: number; returnCount: number; date: string }> {
    const history = this.partnerHistory.get(partnerId) ?? []
    return history
      .filter(s => (s.refundAmount ?? 0) > 0 || (s.returnCount ?? 0) > 0)
      .map(s => ({
        settlementId: s.settlementId,
        orderId: s.orderId,
        totalAmount: s.totalAmount,
        refundAmount: s.refundAmount ?? 0,
        returnCount: s.returnCount ?? 0,
        date: s.createdAt.toISOString().slice(0, 10),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // 仅供测试用
  clearAll(): void {
    this.settlements.clear()
    this.partnerHistory.clear()
  }
}

// ─── SettlementError ─────────────────────────────────────────────────────────

export class SettlementError extends Error {
  constructor(
    public readonly code: 'INVALID_PARAMS' | 'INVALID_RATIO' | 'INVALID_FIXED_AMOUNT' | 'NOT_FOUND' | 'INVALID_STATUS',
    message: string,
  ) {
    super(message)
    this.name = 'SettlementError'
  }
}

// ─── UnlinkedOrderDetector ────────────────────────────────────────────────────

@Injectable()
export class UnlinkedOrderDetector {
  private readonly logger = new Logger(UnlinkedOrderDetector.name)
  private readonly orders = new Map<string, UnlinkedOrder>()

  constructor() {
    // 初始化一些 mock 未关联订单
    this.initMockOrders()
  }

  private initMockOrders(): void {
    const mockOrders: UnlinkedOrder[] = [
      {
        orderId: 'order-u-001',
        storeId: 'store-A',
        amount: 15000,
        createdAt: new Date('2026-07-01T10:00:00Z'),
        location: { lat: 31.2304, lng: 121.4737 },
        linkStatus: 'unlinked',
      },
      {
        orderId: 'order-u-002',
        storeId: 'store-A',
        amount: 8000,
        createdAt: new Date('2026-07-01T14:30:00Z'),
        location: { lat: 31.2304, lng: 121.4737 },
        linkStatus: 'unlinked',
      },
      {
        orderId: 'order-u-003',
        storeId: 'store-B',
        amount: 50000,
        createdAt: new Date('2026-07-02T09:15:00Z'),
        location: { lat: 31.2304, lng: 121.4737 },
        linkStatus: 'unlinked',
      },
    ]
    for (const o of mockOrders) {
      this.orders.set(o.orderId, o)
    }
  }

  /** 扫描未关联订单 */
  scanUnlinkedOrders(storeId: string, since: Date): UnlinkedOrder[] {
    const result: UnlinkedOrder[] = []
    for (const order of this.orders.values()) {
      if (order.storeId === storeId && order.createdAt >= since && order.linkStatus === 'unlinked') {
        result.push(order)
      }
    }
    this.logger.log(`Scanned unlinked orders: store=${storeId} since=${since.toISOString()} found=${result.length}`)
    return result
  }

  /** 建议关联商户 */
  suggestLinking(orderId: string, candidates: LinkingCandidate[]): LinkingCandidate[] {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new UnlinkedOrderError('ORDER_NOT_FOUND', `order ${orderId} not found`)
    }

    // 按匹配分数降序
    const sorted = [...candidates].sort((a, b) => b.score - a.score)
    this.logger.log(`Suggested linking for ${orderId}: top=${sorted[0]?.partnerId} score=${sorted[0]?.score}`)
    return sorted
  }

  /** 手动关联 */
  manualLink(orderId: string, partnerId: string): UnlinkedOrder {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new UnlinkedOrderError('ORDER_NOT_FOUND', `order ${orderId} not found`)
    }
    if (order.linkStatus === 'linked') {
      throw new UnlinkedOrderError('ALREADY_LINKED', `order ${orderId} already linked`)
    }

    order.linkedPartnerId = partnerId
    order.linkStatus = 'linked'
    this.logger.log(`Manual link: order=${orderId} partner=${partnerId}`)
    return order
  }

  /** 按规则自动关联（金额 + 时间 + 地点） */
  autoLinkByRule(orderId: string): { linked: boolean; partnerId?: string; reason?: string } {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new UnlinkedOrderError('ORDER_NOT_FOUND', `order ${orderId} not found`)
    }
    if (order.linkStatus !== 'unlinked') {
      return { linked: false, reason: `order status is ${order.linkStatus}` }
    }

    // 简单规则匹配：
    // 金额 > 10000 且时间在 9:00-18:00 范围内 → partner-P1
    const hour = order.createdAt.getUTCHours()
    const amountThreshold = 10000

    if (order.amount >= amountThreshold && hour >= 9 && hour <= 18) {
      order.linkedPartnerId = 'partner-auto-001'
      order.linkStatus = 'linked'
      this.logger.log(`Auto link: order=${orderId} partner=partner-auto-001 reason=amount+time match`)
      return { linked: true, partnerId: 'partner-auto-001', reason: 'amount+time match' }
    }

    return { linked: false, reason: 'no rule matched' }
  }

  // 仅供测试用
  getOrder(orderId: string): UnlinkedOrder | undefined {
    return this.orders.get(orderId)
  }

  clearAll(): void {
    this.orders.clear()
    this.initMockOrders()
  }
}

// ─── UnlinkedOrderError ──────────────────────────────────────────────────────

export class UnlinkedOrderError extends Error {
  constructor(
    public readonly code: 'ORDER_NOT_FOUND' | 'ALREADY_LINKED',
    message: string,
  ) {
    super(message)
    this.name = 'UnlinkedOrderError'
  }
}

// ─── AnomalyDetectionService ─────────────────────────────────────────────────

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name)
  private readonly anomalies = new Map<string, AnomalyRecord[]>()
  private readonly suspiciousFlags = new Set<string>()

  /** 检测异常模式 */
  detectUnusualPattern(partnerId: string): AnomalyRecord[] {
    const records: AnomalyRecord[] = []
    const history = this.getMockSettlementHistory(partnerId)

    // 1. 频繁小额检测：最近 5 笔交易中有 3 笔以上 < 1000 分
    const smallTransactions = history.filter((h) => h.amount < 1000)
    if (smallTransactions.length >= 3) {
      records.push({
        anomalyId: `anomaly-${Date.now()}-1`,
        partnerId,
        type: 'frequent_small',
        severity: 'warning',
        detail: `Found ${smallTransactions.length} small transactions (<1000) in recent 5 settlements`,
        detectedAt: new Date(),
      })
    }

    // 2. 异常时间检测：凌晨 0-6 点有交易
    const unusualTimeTxns = history.filter((h) => {
      const hour = new Date(h.date).getUTCHours()
      return hour >= 0 && hour < 6
    })
    if (unusualTimeTxns.length > 0) {
      records.push({
        anomalyId: `anomaly-${Date.now()}-2`,
        partnerId,
        type: 'unusual_time',
        severity: 'warning',
        detail: `Found ${unusualTimeTxns.length} transactions during unusual hours (0-6AM)`,
        detectedAt: new Date(),
      })
    }

    // 3. 地点漂移检测：两次交易地点距离 > 50km
    const locations = history.map((h) => h.location).filter(Boolean)
    if (locations.length >= 2) {
      const last = locations[locations.length - 1]
      const prev = locations[locations.length - 2]
      if (last && prev) {
        const distance = this.calcDistance(last.lat, last.lng, prev.lat, prev.lng)
        if (distance > 50) {
          records.push({
            anomalyId: `anomaly-${Date.now()}-3`,
            partnerId,
            type: 'location_drift',
            severity: 'critical',
            detail: `Location drift detected: ${distance.toFixed(1)}km between recent transactions`,
            detectedAt: new Date(),
          })
        }
      }
    }

    // 保存记录
    const existing = this.anomalies.get(partnerId) ?? []
    this.anomalies.set(partnerId, [...existing, ...records])

    this.logger.log(`Detected ${records.length} anomalies for partner ${partnerId}`)
    return records
  }

  /** 标记可疑分账 */
  flagSuspiciousSettlement(settlementId: string): { flagged: boolean; settlementId: string } {
    this.suspiciousFlags.add(settlementId)
    this.logger.warn(`Suspicious settlement flagged: ${settlementId}`)
    return { flagged: true, settlementId }
  }

  /** 获取异常报告 */
  getAnomalyReport(partnerId: string): AnomalyReport {
    const records = this.anomalies.get(partnerId) ?? []
    return {
      partnerId,
      totalAnomalies: records.length,
      warnings: records.filter((r) => r.severity === 'warning').length,
      criticals: records.filter((r) => r.severity === 'critical').length,
      records,
    }
  }

  isFlagged(settlementId: string): boolean {
    return this.suspiciousFlags.has(settlementId)
  }

  clearAll(): void {
    this.anomalies.clear()
    this.suspiciousFlags.clear()
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private getMockSettlementHistory(partnerId: string): Array<{ amount: number; date: Date; location?: { lat: number; lng: number } }> {
    // 模拟最近 5 笔分账记录
    const now = new Date()
    return [
      { amount: 800, date: new Date(now.getTime() - 5 * 60 * 60 * 1000), location: { lat: 31.2304, lng: 121.4737 } },
      { amount: 600, date: new Date(now.getTime() - 4 * 60 * 60 * 1000), location: { lat: 31.2304, lng: 121.4737 } },
      { amount: 1200, date: new Date(now.getTime() - 3 * 60 * 60 * 1000), location: { lat: 31.2304, lng: 121.4737 } },
      { amount: 500, date: new Date(now.getTime() - 2 * 60 * 60 * 1000), location: { lat: 31.2304, lng: 121.4737 } },
      { amount: 700, date: new Date(now.getTime() - 1 * 60 * 60 * 1000), location: { lat: 31.2304, lng: 121.4737 } },
    ]
  }

  /** 计算两点间距离（km）使用 Haversine 公式 */
  private calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // 地球半径 km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }
}
