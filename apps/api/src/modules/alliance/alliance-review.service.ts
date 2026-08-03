/**
 * alliance-review.service.ts — WP-17B 异常审核 (BS-0225~BS-0226)
 *
 * 功能：
 *  - 异常交易检测
 *  - 人工审核流程
 */
import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

/** 异常类型 */
export type AnomalyType =
  | 'frequent_small_transactions'
  | 'unusual_time_trading'
  | 'amount_anomaly'
  | 'location_drift'
  | 'rapid_successive_redemption'

/** 异常严重级别 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

/** 审核状态 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'escalated'

/** 异常交易记录 */
export interface AnomalyTransaction {
  anomalyId: string
  partnerId: string
  partnerName: string
  type: AnomalyType
  severity: AnomalySeverity
  /** 涉及金额（分） */
  involvedAmount: number
  description: string
  detectedAt: string
  /** 关联的订单/券ID */
  relatedId?: string
}

/** 审核记录 */
export interface ReviewRecord {
  reviewId: string
  anomalyId: string
  partnerId: string
  decision: ReviewStatus
  reviewer: string
  note: string
  reviewedAt: string
}

/** 待审核列表项 */
export interface PendingReviewItem {
  anomaly: AnomalyTransaction
  assignedTo?: string
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AllianceReviewService {
  private readonly logger = new Logger(AllianceReviewService.name)

  /** 异常交易库 */
  private anomalies = new Map<string, AnomalyTransaction>()
  /** 审核记录 */
  private reviews = new Map<string, ReviewRecord[]>()

  private nextAnomalySeq = 1

  // ═══════════════════════════════════════════════════════════════════════════
  // 异常检测
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 提交异常交易记录
   */
  reportAnomaly(
    partnerId: string,
    partnerName: string,
    type: AnomalyType,
    severity: AnomalySeverity,
    involvedAmount: number,
    description: string,
    relatedId?: string,
  ): AnomalyTransaction {
    if (!partnerId || !type || !description) {
      throw new ReviewError('INVALID_PARAMS', 'partnerId, type and description required')
    }

    const anomaly: AnomalyTransaction = {
      anomalyId: `anomaly-${Date.now()}-${this.nextAnomalySeq++}`,
      partnerId,
      partnerName,
      type,
      severity,
      involvedAmount,
      description,
      detectedAt: new Date().toISOString(),
      relatedId,
    }

    this.anomalies.set(anomaly.anomalyId, anomaly)
    this.logger.warn(`Anomaly reported: ${anomaly.anomalyId} type=${type} severity=${severity}`)
    return anomaly
  }

  /**
   * 批量检测异常（基于传入的交易数据）
   */
  detectAnomalies(
    partnerId: string,
    partnerName: string,
    transactions: Array<{ amount: number; time: Date; location?: string }>,
  ): AnomalyTransaction[] {
    const detected: AnomalyTransaction[] = []

    // 1. 检测频繁小额交易：连续5笔 < 1000分
    const smallTxns = transactions.filter((t) => t.amount < 1000)
    if (smallTxns.length >= 5) {
      detected.push(this.reportAnomaly(
        partnerId, partnerName,
        'frequent_small_transactions',
        smallTxns.length >= 10 ? 'high' : 'medium',
        smallTxns.reduce((s, t) => s + t.amount, 0),
        `检测到 ${smallTxns.length} 笔小额交易`,
      ))
    }

    // 2. 检测非正常时间段交易（0-5点）
    const unusualTimeTxns = transactions.filter((t) => {
      const hour = t.time.getHours()
      return hour >= 0 && hour < 5
    })
    if (unusualTimeTxns.length >= 3) {
      detected.push(this.reportAnomaly(
        partnerId, partnerName,
        'unusual_time_trading',
        unusualTimeTxns.length >= 6 ? 'critical' : 'high',
        unusualTimeTxns.reduce((s, t) => s + t.amount, 0),
        `检测到 ${unusualTimeTxns.length} 笔凌晨交易`,
      ))
    }

    // 3. 快速连续核销检测：同一优惠券30分钟内多次核销
    // 在单独的上报调用中处理

    return detected
  }

  /**
   * 快速连续核销检测
   */
  detectRapidRedemption(partnerId: string, partnerName: string, redemptions: Array<{ couponId: string; time: Date }>): AnomalyTransaction[] {
    const detected: AnomalyTransaction[] = []
    const grouped = new Map<string, Date[]>()

    for (const r of redemptions) {
      const times = grouped.get(r.couponId) ?? []
      times.push(r.time)
      grouped.set(r.couponId, times)
    }

    for (const [couponId, times] of grouped) {
      const sorted = times.sort((a, b) => a.getTime() - b.getTime())
      for (let i = 1; i < sorted.length; i++) {
        const diffMinutes = (sorted[i].getTime() - sorted[i - 1].getTime()) / 60000
        if (diffMinutes < 30) {
          detected.push(this.reportAnomaly(
            partnerId, partnerName,
            'rapid_successive_redemption',
            'high',
            0,
            `优惠券 ${couponId} 在 ${Math.round(diffMinutes)}分钟内连续核销`,
            couponId,
          ))
          break // 每条券只报一次
        }
      }
    }

    return detected
  }

  /**
   * 获取异常记录
   */
  getAnomaly(anomalyId: string): AnomalyTransaction | undefined {
    return this.anomalies.get(anomalyId)
  }

  /**
   * 获取伙伴的所有异常记录
   */
  getPartnerAnomalies(partnerId: string): AnomalyTransaction[] {
    return Array.from(this.anomalies.values())
      .filter((a) => a.partnerId === partnerId)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 审核流程
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 获取待审核列表
   */
  getPendingReviews(): AnomalyTransaction[] {
    const reviewedAnomalyIds = new Set<string>()
    for (const records of this.reviews.values()) {
      for (const r of records) {
        reviewedAnomalyIds.add(r.anomalyId)
      }
    }

    return Array.from(this.anomalies.values())
      .filter((a) => !reviewedAnomalyIds.has(a.anomalyId))
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  }

  /**
   * 获取指定伙伴的待审核列表
   */
  getPendingReviewsByPartner(partnerId: string): AnomalyTransaction[] {
    const allPending = this.getPendingReviews()
    return allPending.filter((a) => a.partnerId === partnerId)
  }

  /**
   * 提交审核决定
   */
  submitReview(anomalyId: string, decision: ReviewStatus, reviewer: string, note: string): ReviewRecord {
    const anomaly = this.anomalies.get(anomalyId)
    if (!anomaly) {
      throw new ReviewError('ANOMALY_NOT_FOUND', `anomaly ${anomalyId} not found`)
    }

    // 检查是否已审核
    const existingReviews = this.reviews.get(anomalyId) ?? []
    if (existingReviews.length > 0) {
      throw new ReviewError('ALREADY_REVIEWED', `anomaly ${anomalyId} already reviewed`)
    }

    if (!reviewer || !note) {
      throw new ReviewError('INVALID_PARAMS', 'reviewer and note required')
    }

    const review: ReviewRecord = {
      reviewId: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      anomalyId,
      partnerId: anomaly.partnerId,
      decision,
      reviewer,
      note,
      reviewedAt: new Date().toISOString(),
    }

    existingReviews.push(review)
    this.reviews.set(anomalyId, existingReviews)

    this.logger.log(`Review submitted: ${review.reviewId} anomaly=${anomalyId} decision=${decision} by ${reviewer}`)
    return review
  }

  /**
   * 获取审核历史
   */
  getReviewHistory(anomalyId: string): ReviewRecord[] {
    return this.reviews.get(anomalyId) ?? []
  }

  /**
   * 获取伙伴所有审核记录
   */
  getPartnerReviewHistory(partnerId: string): ReviewRecord[] {
    const all: ReviewRecord[] = []
    for (const records of this.reviews.values()) {
      for (const r of records) {
        if (r.partnerId === partnerId) {
          all.push(r)
        }
      }
    }
    return all.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
  }

  /**
   * 获取审核统计
   */
  getReviewStats(): { total: number; pending: number; approved: number; rejected: number; escalated: number } {
    let approved = 0; let rejected = 0; let escalated = 0

    for (const records of this.reviews.values()) {
      for (const r of records) {
        switch (r.decision) {
          case 'approved': approved++; break
          case 'rejected': rejected++; break
          case 'escalated': escalated++; break
        }
      }
    }

    const totalAnomalies = this.anomalies.size
    const reviewed = approved + rejected + escalated

    return {
      total: totalAnomalies,
      pending: totalAnomalies - reviewed,
      approved,
      rejected,
      escalated,
    }
  }

  /**
   * 清除数据（测试用）
   */
  clearAll(): void {
    this.anomalies.clear()
    this.reviews.clear()
    this.nextAnomalySeq = 1
  }
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class ReviewError extends Error {
  constructor(
    public readonly code: 'INVALID_PARAMS' | 'ANOMALY_NOT_FOUND' | 'ALREADY_REVIEWED',
    message: string,
  ) {
    super(message)
    this.name = 'ReviewError'
  }
}
