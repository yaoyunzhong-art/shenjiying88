import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AllianceController } from './alliance.controller'

describe('AllianceController metadata', () => {
  it('controller should keep alliance path', () => {
    assert.equal(Reflect.getMetadata('path', AllianceController), 'alliance')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AllianceController.prototype.registerPartner, 1, 'partner/register'],
      [AllianceController.prototype.updatePartner, 2, 'partner/:partnerId'],
      [AllianceController.prototype.deactivatePartner, 1, 'partner/:partnerId/deactivate'],
      [AllianceController.prototype.reactivatePartner, 1, 'partner/:partnerId/reactivate'],
      [AllianceController.prototype.getPartner, 0, 'partner/:partnerId'],
      [AllianceController.prototype.listPartners, 0, 'partner'],
      [AllianceController.prototype.getGradeCriteria, 0, 'grading/criteria'],
      [AllianceController.prototype.calculateGrade, 1, 'grading/:partnerId/calculate'],
      [AllianceController.prototype.assignGrade, 2, 'grading/:partnerId/assign'],
      [AllianceController.prototype.getGrade, 0, 'grading/:partnerId'],
      [AllianceController.prototype.autoUpgrade, 1, 'grading/:partnerId/auto-upgrade'],
      [AllianceController.prototype.autoDowngrade, 1, 'grading/:partnerId/auto-downgrade'],
      [AllianceController.prototype.calculateHealth, 1, 'health/:partnerId/calculate'],
      [AllianceController.prototype.getHealthFactors, 0, 'health/:partnerId/factors'],
      [AllianceController.prototype.getHealthTrend, 0, 'health/:partnerId/trend'],
      [AllianceController.prototype.getLowEfficiency, 0, 'health/low-efficiency'],
      [AllianceController.prototype.setMetrics, 1, 'health/:partnerId/metrics'],
      [AllianceController.prototype.createSettlement, 1, 'settlement/create'],
      [AllianceController.prototype.approveSettlement, 1, 'settlement/:settlementId/approve'],
      [AllianceController.prototype.executeSettlement, 1, 'settlement/:settlementId/execute'],
      [AllianceController.prototype.rejectSettlement, 1, 'settlement/:settlementId/reject'],
      [AllianceController.prototype.cancelSettlement, 1, 'settlement/:settlementId/cancel'],
      [AllianceController.prototype.querySettlement, 0, 'settlement/:settlementId'],
      [AllianceController.prototype.getSettlementHistory, 0, 'settlement/history/:partnerId'],
      [AllianceController.prototype.scanUnlinkedOrders, 1, 'order/scan-unlinked'],
      [AllianceController.prototype.linkOrder, 1, 'order/:orderId/link'],
      [AllianceController.prototype.autoLinkOrder, 1, 'order/:orderId/auto-link'],
      [AllianceController.prototype.detectAnomaly, 1, 'anomaly/detect/:partnerId'],
      [AllianceController.prototype.getAnomalyReport, 0, 'anomaly/report/:partnerId'],
      [AllianceController.prototype.flagSuspicious, 1, 'settlement/:settlementId/flag-suspicious'],
      [AllianceController.prototype.getTierConfigs, 0, 'tier/configs'],
      [AllianceController.prototype.getTierConfig, 0, 'tier/config/:grade'],
      [AllianceController.prototype.setTierConfig, 2, 'tier/config'],
      [AllianceController.prototype.calculateTierShare, 1, 'tier/calculate-share'],
      [AllianceController.prototype.getGradeChangeHistory, 0, 'tier/change-history/:partnerId'],
      [AllianceController.prototype.issueCoupon, 1, 'coupon/issue'],
      [AllianceController.prototype.redeemCoupon, 1, 'coupon/redeem'],
      [AllianceController.prototype.cancelCoupon, 1, 'coupon/:couponId/cancel'],
      [AllianceController.prototype.getCoupon, 0, 'coupon/:couponId'],
      [AllianceController.prototype.listRedeemableCoupons, 0, 'coupon/redeemable/:partnerId'],
      [AllianceController.prototype.settleCoupon, 1, 'coupon/:couponId/settle'],
      [AllianceController.prototype.getPartnerCouponStats, 0, 'coupon/stats/:partnerId'],
      [AllianceController.prototype.getPendingCouponSettlements, 0, 'coupon/pending-settlements'],
      [AllianceController.prototype.receiveCallback, 1, 'data/callback/:partnerId'],
      [AllianceController.prototype.getCallbackRecords, 0, 'data/records/:partnerId'],
      [AllianceController.prototype.getCallbackStats, 0, 'data/stats/:partnerId'],
      [AllianceController.prototype.getDataDashboard, 0, 'data/dashboard/:partnerId'],
      [AllianceController.prototype.reportAnomaly, 1, 'review/report-anomaly'],
      [AllianceController.prototype.getPendingReviews, 0, 'review/pending'],
      [AllianceController.prototype.submitReview, 1, 'review/submit'],
      [AllianceController.prototype.getReviewHistory, 0, 'review/history/:anomalyId'],
      [AllianceController.prototype.getReviewStats, 0, 'review/stats'],
      [AllianceController.prototype.getDashboardOverview, 0, 'dashboard/overview'],
      [AllianceController.prototype.getGradeDistribution, 0, 'dashboard/grade-distribution'],
      [AllianceController.prototype.getMonthlyTrend, 0, 'dashboard/monthly-trend'],
      [AllianceController.prototype.getActivityOverview, 0, 'dashboard/activities'],
      [AllianceController.prototype.getPartnerRanking, 0, 'dashboard/ranking'],
      [AllianceController.prototype.getPartnerDashboard, 0, 'dashboard/partner/:partnerId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
