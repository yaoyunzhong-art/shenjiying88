import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceReviewService, ReviewError } from './alliance-review.service'

describe('AllianceReviewService — 异常审核 (BS-0225~BS-0226)', () => {
  let service: AllianceReviewService

  beforeEach(() => {
    service = new AllianceReviewService()
  })

  describe('reportAnomaly', () => {
    it('should report an anomaly and store it', () => {
      const anomaly = service.reportAnomaly(
        'partner-A', 'Brand A',
        'frequent_small_transactions', 'high',
        50000, '检测到多笔小额交易',
      )

      expect(anomaly.anomalyId).toBeDefined()
      expect(anomaly.partnerId).toBe('partner-A')
      expect(anomaly.type).toBe('frequent_small_transactions')
      expect(anomaly.severity).toBe('high')

      const anomalies = service.getPartnerAnomalies('partner-A')
      expect(anomalies).toHaveLength(1)
    })

    it('should throw error for missing params', () => {
      expect(() => service.reportAnomaly('', '', 'frequent_small_transactions', 'low', 0, 'test'))
        .toThrow(ReviewError)
    })
  })

  describe('detectAnomalies', () => {
    it('should detect frequent small transactions', () => {
      const transactions = Array.from({ length: 6 }, (_, i) => ({
        amount: 500,
        time: new Date(`2026-07-23T10:${i}0:00Z`),
      }))

      const detected = service.detectAnomalies('partner-A', 'Brand A', transactions)
      const smallTxns = detected.filter((d) => d.type === 'frequent_small_transactions')
      expect(smallTxns.length).toBeGreaterThanOrEqual(1)
    })

    it('should detect unusual time trading (midnight)', () => {
      // Use epoch timestamps to ensure hour 0-5 regardless of timezone
      const now = new Date()
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1)
      const transactions = Array.from({ length: 4 }, (_, i) => ({
        amount: 5000,
        time: new Date(todayMidnight.getTime() + i * 3600000), // 01:00, 02:00, 03:00, 04:00
      }))

      const detected = service.detectAnomalies('partner-A', 'Brand A', transactions)
      const unusual = detected.filter((d) => d.type === 'unusual_time_trading')
      expect(unusual.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getPendingReviews', () => {
    it('should return all unreviewed anomalies', () => {
      service.reportAnomaly('partner-A', 'Brand A', 'frequent_small_transactions', 'low', 1000, 'test 1')
      service.reportAnomaly('partner-B', 'Brand B', 'location_drift', 'critical', 50000, 'test 2')

      const pending = service.getPendingReviews()
      expect(pending).toHaveLength(2)
    })

    it('should exclude reviewed anomalies', () => {
      const anomaly = service.reportAnomaly('partner-A', 'Brand A', 'frequent_small_transactions', 'low', 1000, 'test')
      service.submitReview(anomaly.anomalyId, 'approved', 'reviewer-1', 'Looks ok')

      const pending = service.getPendingReviews()
      expect(pending).toHaveLength(0)
    })
  })

  describe('submitReview', () => {
    it('should submit a review decision', () => {
      const anomaly = service.reportAnomaly('partner-A', 'Brand A', 'amount_anomaly', 'high', 100000, '异常大额交易')

      const review = service.submitReview(anomaly.anomalyId, 'approved', 'admin-1', '经核实为正常交易')
      expect(review.reviewId).toBeDefined()
      expect(review.decision).toBe('approved')
      expect(review.reviewer).toBe('admin-1')

      const history = service.getReviewHistory(anomaly.anomalyId)
      expect(history).toHaveLength(1)
    })

    it('should throw error for already reviewed anomaly', () => {
      const anomaly = service.reportAnomaly('partner-A', 'Brand A', 'amount_anomaly', 'high', 100000, 'test')
      service.submitReview(anomaly.anomalyId, 'rejected', 'admin-1', '可疑')

      expect(() => service.submitReview(anomaly.anomalyId, 'approved', 'admin-2', '核销'))
        .toThrow(ReviewError)
    })
  })

  describe('getReviewStats', () => {
    it('should return accurate review statistics', () => {
      const a1 = service.reportAnomaly('partner-A', 'Brand A', 'frequent_small_transactions', 'low', 1000, 'test 1')
      const a2 = service.reportAnomaly('partner-A', 'Brand A', 'amount_anomaly', 'high', 50000, 'test 2')
      const a3 = service.reportAnomaly('partner-B', 'Brand B', 'location_drift', 'critical', 20000, 'test 3')

      service.submitReview(a1.anomalyId, 'approved', 'admin', 'ok')
      service.submitReview(a2.anomalyId, 'rejected', 'admin', 'fraud')
      service.submitReview(a3.anomalyId, 'escalated', 'admin', 'escalate')

      const stats = service.getReviewStats()
      expect(stats.total).toBe(3)
      expect(stats.approved).toBe(1)
      expect(stats.rejected).toBe(1)
      expect(stats.escalated).toBe(1)
      expect(stats.pending).toBe(0)
    })
  })
})
