/**
 * AllianceController 集成测试 (D-controller spec 补全)
 *
 * 策略：使用真实 Service 实例创建 Controller 进行测试
 * 覆盖：伙伴注册/查询/分级、健康度、分账、关联、异常检测
 * 正向流程 + 边界条件
 */
import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

describe('AllianceController', () => {
  let controller: AllianceController
  let partnerService: AlliancePartner
  let gradingService: PartnerGradingService
  let healthService: HealthScoreService
  let settlementService: CrossMerchantSettlementService
  let orderDetector: UnlinkedOrderDetector
  let anomalyService: AnomalyDetectionService

  function ok<T>(v: T | undefined | null): asserts v is T {
    assert.ok(v)
  }

  beforeEach(() => {
    partnerService = new AlliancePartner()
    gradingService = new PartnerGradingService()
    healthService = new HealthScoreService()
    settlementService = new CrossMerchantSettlementService()
    orderDetector = new UnlinkedOrderDetector()
    anomalyService = new AnomalyDetectionService()
    controller = new AllianceController(
      partnerService,
      gradingService,
      healthService,
      settlementService,
      orderDetector,
      anomalyService,
    )
  })

  // ─── 伙伴管理 ─────────────────────────────────────────────

  describe('POST /alliance/partner/register', () => {
    it('should register a partner successfully', () => {
      const result = controller.registerPartner({
        name: 'Test Partner',
        businessType: 'RETAIL',
        contact: 'contact@test.com',
        address: '123 Main St',
      })

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.name, 'Test Partner')
      assert.equal(result.data.businessType, 'RETAIL')
      assert.equal(result.data.status, 'ACTIVE')
    })

    it('should register partner with empty name (service allows)', () => {
      const result = controller.registerPartner({
        name: '',
        businessType: 'RETAIL',
        contact: 'contact@test.com',
        address: '123 Main St',
      })

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.name, '')
    })
  })

  describe('GET /alliance/partner/:partnerId', () => {
    it('should get a registered partner', () => {
      const registered = controller.registerPartner({
        name: 'Partner A',
        businessType: 'SERVICE',
        contact: 'a@test.com',
        address: 'addr',
      })
      ok(registered.data)

      const result = controller.getPartner(registered.data.id)
      ok(result.data)

      assert.equal(result.success, true)
      assert.equal(result.data.name, 'Partner A')
    })

    it('should return not found for unknown partner', () => {
      const result = controller.getPartner('nonexistent-id')

      assert.equal(result.success, false)
      assert.ok(result.message?.includes('not found'))
    })
  })

  describe('GET /alliance/partner', () => {
    it('should list all registered partners', () => {
      controller.registerPartner({ name: 'P1', businessType: 'RETAIL', contact: 'c1', address: 'a1' })
      controller.registerPartner({ name: 'P2', businessType: 'F&B', contact: 'c2', address: 'a2' })

      const result = controller.listPartners({})

      assert.equal(result.success, true)
      ok(result.data)
      assert.ok(result.data.length >= 2)
      assert.equal(result.total, result.data.length)
    })

    it('should filter partners by businessType', () => {
      controller.registerPartner({ name: 'P1', businessType: 'RETAIL', contact: 'c1', address: 'a1' })
      controller.registerPartner({ name: 'P2', businessType: 'F&B', contact: 'c2', address: 'a2' })

      const result = controller.listPartners({ businessType: 'RETAIL' })

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
      assert.ok(result.data.every((p: any) => p.businessType === 'RETAIL'))
    })
  })

  describe('PUT /alliance/partner/:partnerId', () => {
    it('should update partner contact info', () => {
      const registered = controller.registerPartner({
        name: 'Partner',
        businessType: 'TECH',
        contact: 'old@test.com',
        address: 'addr',
      })
      ok(registered.data)

      const result = controller.updatePartner(registered.data.id, { contact: 'new@test.com' })
      ok(result.data)

      assert.equal(result.success, true)
      assert.equal(result.data.contact, 'new@test.com')
    })
  })

  // ─── 分级管理 ─────────────────────────────────────────────

  describe('GET /alliance/grading/criteria', () => {
    it('should return grade criteria', () => {
      const result = controller.getGradeCriteria()

      assert.equal(result.success, true)
      ok(result.data)
      assert.ok(result.data.length >= 4)
      const grades = result.data.map((c: any) => c.grade)
      assert.ok(grades.includes('S'))
      assert.ok(grades.includes('A'))
      assert.ok(grades.includes('B'))
      assert.ok(grades.includes('C'))
    })
  })

  describe('POST /alliance/grading/:partnerId/calculate', () => {
    it('should calculate grade for a partner', () => {
      const registered = controller.registerPartner({
        name: 'Grading Partner',
        businessType: 'RETAIL',
        contact: 'g@test.com',
        address: 'addr',
      })
      ok(registered.data)

      controller.setMetrics(registered.data.id, {
        revenue: 1000000,
        orderCount: 5000,
        complaintCount: 1,
        activeDays: 30,
      })
      controller.calculateHealth(registered.data.id)

      const result = controller.calculateGrade(registered.data.id)

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.partnerId, registered.data.id)
      assert.ok(['S', 'A', 'B', 'C'].includes(result.data.grade))
    })
  })

  describe('PUT /alliance/grading/:partnerId/assign', () => {
    it('should manually assign grade', () => {
      const registered = controller.registerPartner({
        name: 'Manual Grade',
        businessType: 'SERVICE',
        contact: 'm@test.com',
        address: 'addr',
      })
      ok(registered.data)

      const result = controller.assignGrade(registered.data.id, { grade: 'A' })

      assert.equal(result.success, true)
      assert.ok(result.message?.includes('A'))
    })
  })

  describe('POST /alliance/grading/:partnerId/auto-upgrade', () => {
    it('should attempt auto upgrade', () => {
      const registered = controller.registerPartner({
        name: 'Upgrade Partner',
        businessType: 'TECH',
        contact: 'u@test.com',
        address: 'addr',
      })
      ok(registered.data)

      controller.setMetrics(registered.data.id, {
        revenue: 2000000, orderCount: 10000, complaintCount: 0, activeDays: 31,
      })
      controller.calculateHealth(registered.data.id)

      const result = controller.autoUpgrade(registered.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.ok('upgraded' in result.data)
    })
  })

  describe('POST /alliance/grading/:partnerId/auto-downgrade', () => {
    it('should attempt auto downgrade', () => {
      const registered = controller.registerPartner({
        name: 'Downgrade Partner',
        businessType: 'OTHER',
        contact: 'd@test.com',
        address: 'addr',
      })
      ok(registered.data)

      controller.setMetrics(registered.data.id, {
        revenue: 100, orderCount: 1, complaintCount: 50, activeDays: 1,
      })
      controller.calculateHealth(registered.data.id)

      const result = controller.autoDowngrade(registered.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.ok('downgraded' in result.data)
    })
  })

  // ─── 健康度 ────────────────────────────────────────────────

  describe('POST /alliance/health/:partnerId/calculate', () => {
    it('should calculate health score', () => {
      const registered = controller.registerPartner({
        name: 'Health Partner',
        businessType: 'RETAIL',
        contact: 'h@test.com',
        address: 'addr',
      })
      ok(registered.data)

      const result = controller.calculateHealth(registered.data.id)

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.partnerId, registered.data.id)
      assert.ok(result.data.healthScore >= 0)
      assert.ok(result.data.healthScore <= 100)
    })
  })

  describe('GET /alliance/health/:partnerId/factors', () => {
    it('should return health factors', () => {
      const registered = controller.registerPartner({
        name: 'Factors Partner',
        businessType: 'F&B',
        contact: 'f@test.com',
        address: 'addr',
      })
      ok(registered.data)

      controller.setMetrics(registered.data.id, {
        revenue: 500000, orderCount: 2000, complaintCount: 5, activeDays: 25,
      })

      const result = controller.getHealthFactors(registered.data.id)

      assert.equal(result.success, true)
      ok(result.data)
      assert.ok(result.data.revenueScore >= 0)
      assert.ok(result.data.overall >= 0)
    })
  })

  describe('GET /alliance/health/:partnerId/trend', () => {
    it('should return health trend data', () => {
      const registered = controller.registerPartner({
        name: 'Trend Partner',
        businessType: 'SERVICE',
        contact: 't@test.com',
        address: 'addr',
      })
      ok(registered.data)

      controller.calculateHealth(registered.data.id)
      controller.setMetrics(registered.data.id, { revenue: 600000 })
      controller.calculateHealth(registered.data.id)

      const result = controller.getHealthTrend(registered.data.id)

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
    })
  })

  // ─── 分账管理 ─────────────────────────────────────────────

  describe('POST /alliance/settlement/create', () => {
    it('should create a settlement successfully', () => {
      const result = controller.createSettlement({
        orderId: 'order-001',
        type: 'ratio',
        totalAmount: 10000,
        participants: [
          { partnerId: 'partner-1', partnerName: 'P1', ratio: 0.6 },
          { partnerId: 'partner-2', partnerName: 'P2', ratio: 0.4 },
        ],
      })

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.orderId, 'order-001')
      assert.equal(result.data.status, 'pending')
    })

    it('should fail when ratio does not sum to 1', () => {
      const result = controller.createSettlement({
        orderId: 'order-002',
        type: 'ratio',
        totalAmount: 10000,
        participants: [
          { partnerId: 'p1', partnerName: 'P1', ratio: 0.3 },
          { partnerId: 'p2', partnerName: 'P2', ratio: 0.3 },
        ],
      })

      assert.equal(result.success, false)
      assert.ok(result.message)
    })

    it('should fail when fixed amount exceeds total', () => {
      const result = controller.createSettlement({
        orderId: 'order-003',
        type: 'fixed',
        totalAmount: 5000,
        participants: [
          { partnerId: 'p1', partnerName: 'P1', fixedAmount: 6000 },
        ],
      })

      assert.equal(result.success, false)
      assert.ok(result.message)
    })
  })

  describe('POST /alliance/settlement/:settlementId/approve', () => {
    it('should approve a pending settlement', () => {
      const created = controller.createSettlement({
        orderId: 'order-004',
        type: 'fixed',
        totalAmount: 10000,
        participants: [
          { partnerId: 'p1', partnerName: 'P1', fixedAmount: 10000 },
        ],
      })
      ok(created.data)

      const result = controller.approveSettlement(created.data.settlementId)

      assert.equal(result.success, true)
      ok(result.data)
      const r = result.data as unknown as Record<string, unknown>
      assert.equal(r.status, 'approved')
    })
  })

  describe('POST /alliance/settlement/:settlementId/execute', () => {
    it('should execute an approved settlement', () => {
      const created = controller.createSettlement({
        orderId: 'order-005',
        type: 'fixed',
        totalAmount: 10000,
        participants: [
          { partnerId: 'p1', partnerName: 'P1', fixedAmount: 10000 },
        ],
      })
      ok(created.data)
      controller.approveSettlement(created.data.settlementId)

      const result = controller.executeSettlement(created.data.settlementId)

      assert.equal(result.success, true)
      ok(result.data)
      const r = result.data as unknown as Record<string, unknown>
      assert.equal(r.status, 'executed')
    })
  })

  describe('GET /alliance/settlement/:settlementId', () => {
    it('should query settlement by ID', () => {
      const created = controller.createSettlement({
        orderId: 'order-006',
        type: 'fixed',
        totalAmount: 10000,
        participants: [
          { partnerId: 'p1', partnerName: 'P1', fixedAmount: 10000 },
        ],
      })
      ok(created.data)

      const result = controller.querySettlement(created.data.settlementId)

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.settlementId, created.data.settlementId)
    })

    it('should return not found for unknown settlement', () => {
      const result = controller.querySettlement('nonexistent-settlement')

      assert.equal(result.success, false)
      assert.ok(result.message?.includes('not found'))
    })
  })

  describe('GET /alliance/settlement/history/:partnerId', () => {
    it('should return settlement history for partner', () => {
      controller.createSettlement({
        orderId: 'order-hist-1',
        type: 'fixed',
        totalAmount: 5000,
        participants: [
          { partnerId: 'p-history', partnerName: 'History Partner', fixedAmount: 5000 },
        ],
      })

      const result = controller.getSettlementHistory('p-history')

      assert.equal(result.success, true)
      assert.ok(Array.isArray(result.data))
    })

    it('should return empty array for partner with no settlements', () => {
      const result = controller.getSettlementHistory('no-history-partner')

      assert.equal(result.success, true)
      assert.equal(result.total, 0)
    })
  })

  // ─── 未关联订单 ──────────────────────────────────────────

  describe('POST /alliance/order/scan-unlinked', () => {
    it('should scan unlinked orders for a store', () => {
      const result = controller.scanUnlinkedOrders({
        storeId: 'store-001',
        since: '2026-01-01T00:00:00Z',
      })

      assert.equal(result.success, true)
      assert.equal(result.data.storeId, 'store-001')
      assert.ok(Array.isArray(result.data.orders))
    })
  })

  describe('POST /alliance/order/:orderId/link', () => {
    it('should manually link order to partner', () => {
      const result = controller.linkOrder('order-u-001', { partnerId: 'partner-1' })

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.linkedPartnerId, 'partner-1')
      assert.equal(result.data.linkStatus, 'linked')
    })

    it('should fail linking already linked order', () => {
      controller.linkOrder('order-u-002', { partnerId: 'partner-1' })

      const result = controller.linkOrder('order-u-002', { partnerId: 'partner-2' })

      assert.equal(result.success, false)
      assert.ok(result.message)
    })
  })

  describe('POST /alliance/order/:orderId/auto-link', () => {
    it('should auto-link order by rule', () => {
      const result = controller.autoLinkOrder('order-u-001')

      assert.equal(result.success, true)
      ok(result.data)
      assert.ok('linked' in result.data)
    })
  })

  // ─── 异常检测 ─────────────────────────────────────────────

  describe('POST /alliance/anomaly/detect/:partnerId', () => {
    it('should detect anomalies for a partner', () => {
      const result = controller.detectAnomaly('partner-anomaly-1')

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.partnerId, 'partner-anomaly-1')
      assert.ok(Array.isArray(result.data.anomalies))
      assert.equal(result.data.count, result.data.anomalies.length)
    })
  })

  describe('GET /alliance/anomaly/report/:partnerId', () => {
    it('should return anomaly report', () => {
      const result = controller.getAnomalyReport('partner-report-1')

      assert.equal(result.success, true)
      ok(result.data)
    })
  })

  describe('POST /alliance/settlement/:settlementId/flag-suspicious', () => {
    it('should flag a settlement as suspicious', () => {
      const created = controller.createSettlement({
        orderId: 'order-flag-1',
        type: 'fixed',
        totalAmount: 100000,
        participants: [
          { partnerId: 'p-flag', partnerName: 'Flag Partner', fixedAmount: 100000 },
        ],
      })
      ok(created.data)

      const result = controller.flagSuspicious(created.data.settlementId)

      assert.equal(result.success, true)
      ok(result.data)
    })
  })
})
