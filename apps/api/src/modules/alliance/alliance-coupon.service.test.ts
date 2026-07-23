import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceCouponService, CouponError } from './alliance-coupon.service'
import { AllianceTierService } from './alliance-tier.service'

describe('AllianceCouponService — 联盟券互推 (BS-0220~BS-0221)', () => {
  let service: AllianceCouponService
  let tierService: AllianceTierService

  beforeEach(() => {
    tierService = new AllianceTierService()
    service = new AllianceCouponService(tierService)
  })

  describe('issueCoupon', () => {
    it('should issue a cross-brand coupon', () => {
      const coupon = service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000, // 5元
        minSpend: 30000,    // 满30元可用
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B', 'partner-C'],
        description: '联盟优惠券',
      })

      expect(coupon.couponId).toBeDefined()
      expect(coupon.issuerPartnerId).toBe('partner-A')
      expect(coupon.denomination).toBe(5000)
      expect(coupon.status).toBe('active')
      expect(coupon.acceptedPartnerIds).toHaveLength(2)
    })

    it('should throw error for invalid params (zero denomination)', () => {
      expect(() => service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 0,
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Invalid coupon',
      })).toThrow(CouponError)
    })

    it('should throw error for no accepted partners', () => {
      expect(() => service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: [],
        description: 'Empty partners',
      })).toThrow(CouponError)
    })
  })

  describe('redeemCoupon', () => {
    it('should redeem an active coupon', () => {
      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 10000,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Test coupon',
      })

      const coupon = service.listRedeemableCoupons('partner-B')[0]
      const redemption = service.redeemCoupon(
        coupon.couponId, 'partner-B', 'Brand B',
        'order-001', 'member-001', 20000,
      )

      expect(redemption.couponId).toBe(coupon.couponId)
      expect(redemption.discountApplied).toBe(5000)
      expect(redemption.partnerId).toBe('partner-B')

      // Check coupon status updated
      const updated = service.getCoupon(coupon.couponId)
      expect(updated?.status).toBe('redeemed')
    })

    it('should throw error if coupon not accepted by partner', () => {
      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Test coupon',
      })

      const coupon = service.listRedeemableCoupons('partner-B')[0]
      expect(() => service.redeemCoupon(
        coupon.couponId, 'partner-C', 'Brand C',
        'order-002', 'member-002', 20000,
      )).toThrow('not in accepted list')
    })

    it('should throw error if order amount below minSpend', () => {
      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 50000,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'High min spend',
      })

      const coupon = service.listRedeemableCoupons('partner-B')[0]
      expect(() => service.redeemCoupon(
        coupon.couponId, 'partner-B', 'Brand B',
        'order-003', 'member-003', 30000, // below 50000 minSpend
      )).toThrow(CouponError)
    })
  })

  describe('settleCoupon', () => {
    it('should create and settle coupon settlement', () => {
      service.setPartnerGrade('partner-A', 'S')

      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 10000, // 10元
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Settle test',
      })

      const coupon = service.listRedeemableCoupons('partner-B')[0]
      service.redeemCoupon(coupon.couponId, 'partner-B', 'Brand B', 'order-001', 'member-001', 50000)

      // Check settlement created
      const settlement = service.getCouponSettlement(coupon.couponId)
      expect(settlement).toBeDefined()
      expect(settlement?.status).toBe('pending')
      // S grade: 0.15 commission
      expect(settlement?.platformCommission).toBeGreaterThan(0)

      // Settle
      const settled = service.settleCoupon(coupon.couponId)
      expect(settled.status).toBe('settled')
      expect(settled.settledAt).toBeDefined()
    })

    it('should throw error for already settled coupon', () => {
      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Double settle',
      })

      const coupon = service.listRedeemableCoupons('partner-B')[0]
      service.redeemCoupon(coupon.couponId, 'partner-B', 'Brand B', 'order-001', 'member-001', 20000)
      service.settleCoupon(coupon.couponId)

      expect(() => service.settleCoupon(coupon.couponId)).toThrow(CouponError)
    })
  })

  describe('getPartnerCouponStats', () => {
    it('should return correct partner stats', () => {
      service.issueCoupon({
        issuerPartnerId: 'partner-A',
        issuerPartnerName: 'Brand A',
        denomination: 5000,
        minSpend: 0,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
        acceptedPartnerIds: ['partner-B'],
        description: 'Stats test',
      })

      const stats = service.getPartnerCouponStats('partner-A')
      expect(stats.partnerId).toBe('partner-A')
      expect(stats.totalIssued).toBe(1)
      expect(stats.totalRedeemed).toBe(0)
    })
  })
})
