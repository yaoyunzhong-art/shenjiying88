/**
 * alliance.service.test.ts — AllianceService 单元测试
 *
 * 覆盖：AllianceService 作为 Facade，委托所有操作到子服务
 * 正例 + 反例 + 边界，合计 ≥ 12 用例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceService } from './alliance.service'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

describe('AllianceService', () => {
  let service: AllianceService

  beforeEach(() => {
    service = new AllianceService(
      new AlliancePartner(),
      new PartnerGradingService(),
      new HealthScoreService(),
      new CrossMerchantSettlementService(),
      new UnlinkedOrderDetector(),
      new AnomalyDetectionService(),
    )
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 伙伴管理
  // ═══════════════════════════════════════════════════════════════

  describe('registerPartner', () => {
    it('✅ 正例：成功注册新伙伴', () => {
      const result = service.registerPartner({
        name: '测试联盟 A',
        businessType: 'RETAIL',
        contact: 'contact@a.com',
        address: '上海南京路 100 号',
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.name).toBe('测试联盟 A')
      expect(result.data!.status).toBe('ACTIVE')
    })

    it('✅ 正例：空名字也能注册（服务层允许）', () => {
      const result = service.registerPartner({
        name: '',
        businessType: 'F&B',
        contact: 'chef@b.com',
        address: '北京朝阳路',
      })
      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('')
    })
  })

  describe('getPartner / listPartners', () => {
    it('✅ 正例：注册后能查到伙伴', () => {
      const { data: p1 } = service.registerPartner({
        name: 'Tech Co', businessType: 'TECH', contact: 'dev@t.co', address: 'SZ',
      })
      const result = service.getPartner(p1!.id)
      expect(result.success).toBe(true)
      expect(result.data!.name).toBe('Tech Co')
    })

    it('✅ 正例：listPartners 返回全部伙伴', () => {
      service.registerPartner({ name: 'A', businessType: 'RETAIL', contact: 'a@a', address: 'addr' })
      service.registerPartner({ name: 'B', businessType: 'F&B', contact: 'b@b', address: 'addr' })
      const result = service.listPartners()
      expect(result.success).toBe(true)
      expect(result.data!.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例 — 伙伴管理
  // ═══════════════════════════════════════════════════════════════

  describe('error cases', () => {
    it('❌ 反例：获取不存在的伙伴返回失败', () => {
      const result = service.getPartner('non-existent-id')
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('❌ 反例：更新不存在的伙伴返回失败', () => {
      const result = service.updatePartner('no-such-id', { name: 'Ghost' })
      expect(result.success).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 分级评定
  // ═══════════════════════════════════════════════════════════════

  describe('grade management', () => {
    it('✅ 正例：获取分级标准', () => {
      const result = service.getGradeCriteria()
      expect(result.success).toBe(true)
      expect(result.data!.length).toBe(4) // S/A/B/C
    })

    it('✅ 正例：手动指定等级后能正确获取', () => {
      const { data: partner } = service.registerPartner({
        name: 'Grade Partner', businessType: 'SERVICE', contact: 'g@g', address: 'addr',
      })
      service.assignGrade(partner!.id, 'A')
      const getResult = service.getGrade(partner!.id)
      expect(getResult.success).toBe(true)
      expect(getResult.data!.grade).toBe('A')
    })

    it('✅ 正例：手动指定等级', () => {
      const { data: partner } = service.registerPartner({
        name: 'Manual', businessType: 'RETAIL', contact: 'm@m', address: 'addr',
      })
      const result = service.assignGrade(partner!.id, 'S')
      expect(result.success).toBe(true)
      expect(result.message).toContain('S')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 健康度
  // ═══════════════════════════════════════════════════════════════

  describe('health scores', () => {
    it('✅ 正例：获取健康度趋势', () => {
      const { data: partner } = service.registerPartner({
        name: 'Health Co', businessType: 'TECH', contact: 'h@h', address: 'addr',
      })
      const trendResult = service.getHealthTrend(partner!.id)
      expect(trendResult.success).toBe(true)
      expect(Array.isArray(trendResult.data)).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 分账
  // ═══════════════════════════════════════════════════════════════

  describe('settlements', () => {
    it('✅ 正例：创建并查询分账', () => {
      const { data: p1 } = service.registerPartner({
        name: 'Seller A', businessType: 'RETAIL', contact: 's@s', address: 'addr',
      })
      const { data: p2 } = service.registerPartner({
        name: 'Seller B', businessType: 'SERVICE', contact: 's2@s', address: 'addr',
      })

      const createResult = service.createSettlement({
        orderId: 'order-001',
        type: 'ratio',
        totalAmount: 1000,
        participants: [
          { partnerId: p1!.id, partnerName: 'Seller A', ratio: 0.6 },
          { partnerId: p2!.id, partnerName: 'Seller B', ratio: 0.4 },
        ],
      })
      expect(createResult.success).toBe(true)
      expect(createResult.data).toBeDefined()

      const sid = createResult.data!.settlementId
      const queryResult = service.querySettlement(sid)
      expect(queryResult.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 异常检测
  // ═══════════════════════════════════════════════════════════════

  describe('anomaly detection', () => {
    it('✅ 正例：检测异常模式', () => {
      const { data: partner } = service.registerPartner({
        name: 'Anom Co', businessType: 'RETAIL', contact: 'a@a', address: 'addr',
      })
      const result = service.detectAnomaly(partner!.id)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(typeof result.data!.count).toBe('number')
    })

    it('✅ 正例：获取异常报告', () => {
      const { data: partner } = service.registerPartner({
        name: 'Report Co', businessType: 'RETAIL', contact: 'r@r', address: 'addr',
      })
      const result = service.getAnomalyReport(partner!.id)
      expect(result.success).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界
  // ═══════════════════════════════════════════════════════════════

  describe('boundary cases', () => {
    it('🔲 边界：空伙伴列表查询', () => {
      const result = service.listPartners({ businessType: 'TECH' })
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('🔲 边界：扫描未关联订单', () => {
      const result = service.scanUnlinkedOrders('store-b', new Date('2025-01-01'))
      expect(result.success).toBe(true)
      expect(result.data!.storeId).toBe('store-b')
      expect(Array.isArray(result.data!.orders)).toBe(true)
    })
  })
})
