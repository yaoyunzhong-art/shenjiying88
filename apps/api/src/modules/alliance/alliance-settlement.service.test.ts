import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { CrossMerchantSettlementService, UnlinkedOrderDetector, AnomalyDetectionService, SettlementError } from './alliance-settlement.service'

describe('AllianceSettlementService', () => {
  let settlementService: CrossMerchantSettlementService
  let unlinkedOrderDetector: UnlinkedOrderDetector
  let anomalyService: AnomalyDetectionService

  beforeEach(() => {
    settlementService = new CrossMerchantSettlementService()
    unlinkedOrderDetector = new UnlinkedOrderDetector()
    anomalyService = new AnomalyDetectionService()
  })

  describe('CrossMerchantSettlementService', () => {
    describe('createSettlement', () => {
      it('should create settlement with ratio split', () => {
        const settlement = settlementService.createSettlement('order1', 'ratio', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', ratio: 0.6 },
          { partnerId: 'p2', partnerName: 'Partner 2', ratio: 0.4 },
        ])
        expect(settlement.settlementId).toBeDefined()
        expect(settlement.totalAmount).toBe(10000)
      })

      it('should create settlement with fixed amounts', () => {
        const settlement = settlementService.createSettlement('order1', 'fixed', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', fixedAmount: 6000 },
          { partnerId: 'p2', partnerName: 'Partner 2', fixedAmount: 4000 },
        ])
        expect(settlement.settlementId).toBeDefined()
      })

      it('should throw error for invalid ratio', () => {
        expect(() =>
          settlementService.createSettlement('order1', 'ratio', 10000, [
            { partnerId: 'p1', partnerName: 'Partner 1', ratio: 0.5 },
            { partnerId: 'p2', partnerName: 'Partner 2', ratio: 0.3 },
          ])
        ).toThrow()
      })
    })

    describe('approveSettlement', () => {
      it('should approve pending settlement', () => {
        const settlement = settlementService.createSettlement('order1', 'ratio', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', ratio: 1 },
        ])
        const approved = settlementService.approveSettlement(settlement.settlementId)
        expect(approved.status).toBe('approved')
      })
    })

    describe('executeSettlement', () => {
      it('should execute approved settlement', () => {
        const settlement = settlementService.createSettlement('order1', 'ratio', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', ratio: 1 },
        ])
        settlementService.approveSettlement(settlement.settlementId)
        const executed = settlementService.executeSettlement(settlement.settlementId)
        expect(executed.status).toBe('executed')
      })
    })

    describe('querySettlement', () => {
      it('should return settlement by id', () => {
        const settlement = settlementService.createSettlement('order1', 'ratio', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', ratio: 1 },
        ])
        const found = settlementService.querySettlement(settlement.settlementId)
        expect(found?.orderId).toBe('order1')
      })
    })

    describe('getSettlementHistory', () => {
      it('should return settlement history for partner', () => {
        settlementService.createSettlement('order1', 'ratio', 10000, [
          { partnerId: 'p1', partnerName: 'Partner 1', ratio: 1 },
        ])
        const history = settlementService.getSettlementHistory('p1')
        expect(history.length).toBeGreaterThan(0)
      })
    })
  })

  describe('UnlinkedOrderDetector', () => {
    describe('scanUnlinkedOrders', () => {
      it('should scan unlinked orders for store', () => {
        const orders = unlinkedOrderDetector.scanUnlinkedOrders('store-A', new Date('2026-07-01'))
        expect(orders.length).toBeGreaterThanOrEqual(0)
      })
    })

    describe('suggestLinking', () => {
      it('should suggest linking candidates', () => {
        const candidates = [
          { partnerId: 'p1', partnerName: 'Partner 1', score: 0.9, reason: 'High score match' },
        ]
        const suggestions = unlinkedOrderDetector.suggestLinking('order-u-001', candidates)
        expect(suggestions[0].partnerId).toBe('p1')
      })
    })

    describe('manualLink', () => {
      it('should link order to partner', () => {
        const linked = unlinkedOrderDetector.manualLink('order-u-001', 'partner-001')
        expect(linked.linkStatus).toBe('linked')
      })
    })

    describe('autoLinkByRule', () => {
      it('should auto link based on rules', () => {
        const result = unlinkedOrderDetector.autoLinkByRule('order-u-003')
        expect(result).toHaveProperty('linked')
      })
    })
  })

  describe('AnomalyDetectionService', () => {
    describe('detectUnusualPattern', () => {
      it('should detect unusual patterns', () => {
        const anomalies = anomalyService.detectUnusualPattern('partner1')
        expect(Array.isArray(anomalies)).toBe(true)
      })
    })

    describe('flagSuspiciousSettlement', () => {
      it('should flag suspicious settlement', () => {
        const result = anomalyService.flagSuspiciousSettlement('settlement1')
        expect(result.flagged).toBe(true)
      })

      it('should return true for flagged settlement', () => {
        anomalyService.flagSuspiciousSettlement('settlement1')
        expect(anomalyService.isFlagged('settlement1')).toBe(true)
      })
    })

    describe('getAnomalyReport', () => {
      it('should return anomaly report for partner', () => {
        anomalyService.detectUnusualPattern('partner1')
        const report = anomalyService.getAnomalyReport('partner1')
        expect(report.partnerId).toBe('partner1')
      })
    })
  })
})
