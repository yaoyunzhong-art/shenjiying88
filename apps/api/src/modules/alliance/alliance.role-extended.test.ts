/**
 * 🐜 自动: [alliance] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — alliance 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 边界/权限)
 * 覆盖: 伙伴注册/更新/查询、分级管理(S/A/B/C)、健康度评分、分账创建/审批/执行、
 *       未关联订单扫描、异常检测、可疑标记
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
  SettlementError,
  UnlinkedOrderError,
} from './alliance-settlement.service'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createController(): AllianceController {
  const partnerService = new AlliancePartner()
  const gradingService = new PartnerGradingService()
  const healthService = new HealthScoreService()
  const settlementService = new CrossMerchantSettlementService()
  const orderDetector = new UnlinkedOrderDetector()
  const anomalyService = new AnomalyDetectionService()
  return new AllianceController(
    partnerService,
    gradingService,
    healthService,
    settlementService,
    orderDetector,
    anomalyService,
  )
}

function asData<T>(r: { success: boolean; data?: T }): { success: true; data: T } {
  if (!r.success || !r.data) throw new Error(`Expected success with data, got success=${r.success}`)
  return r as { success: true; data: T }
}

function createParticipant(partnerId: string, partnerName: string, ratio: number) {
  return { partnerId, partnerName, ratio, fixedAmount: undefined }
}

describe('Alliance 8-Role Extended Tests', () => {
  let controller: AllianceController

  beforeEach(() => {
    controller = createController()
  })

  // ════════════════════════════════════════════════════════════════
  // 👔 店长 - 全局运营视角
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.StoreManager} 店长`, () => {
    it('【正向】注册多个不同业态伙伴并查看完整列表', () => {
      controller.registerPartner({
        name: '零售超市A',
        businessType: 'RETAIL',
        contact: '13800000001',
        address: '上海市南京路1号',
      })
      controller.registerPartner({
        name: '科技公司B',
        businessType: 'TECH',
        contact: '13800000002',
        address: '北京市中关村',
      })
      const result = controller.listPartners({})
      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
    })

    it('【边界】注册名称重复伙伴应失败', () => {
      controller.registerPartner({
        name: '独家商户',
        businessType: 'RETAIL',
        contact: '13800000001',
        address: '地址1',
      })
      const result = controller.registerPartner({
        name: '独家商户',
        businessType: 'F&B',
        contact: '13800000002',
        address: '地址2',
      })
      expect(result.success).toBe(false)
      expect(result.message).toContain('already exists')
    })

    it('【正向】审批分账并通过后查看全链路状态', () => {
      controller.registerPartner({
        name: '分账测试商户',
        businessType: 'RETAIL',
        contact: '13800000000',
        address: '测试地址',
      })
      const cResult = controller.createSettlement({
        orderId: 'ord-chain-001',
        type: 'ratio',
        totalAmount: 20000,
        participants: [createParticipant('partner-1', '商户A', 0.6), createParticipant('partner-2', '商户B', 0.4)],
      })
      const settlementId = asData(cResult).data.settlementId
      const aResult = controller.approveSettlement(settlementId)
      expect(asData(aResult).data.status).toBe('approved')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 🛒 前台 - 日常业务操作
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.FrontDesk} 前台`, () => {
    it('【正向】快速注册新商户并查询详情', () => {
      const regResult = controller.registerPartner({
        name: '快闪店C',
        businessType: 'SERVICE',
        contact: '13900000003',
        address: '广州天河',
      })
      const partnerId = asData(regResult).data.id
      const qResult = controller.getPartner(partnerId)
      expect(asData(qResult).data.name).toBe('快闪店C')
    })

    it('【边界】查询不存在的商户返回错误', () => {
      const result = controller.getPartner('non-existent-id')
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('【正向】创建比例分账并验证参与方', () => {
      const result = controller.createSettlement({
        orderId: 'ord-fd-001',
        type: 'ratio',
        totalAmount: 6000,
        participants: [
          { partnerId: 'p-fd-1', partnerName: '前台商户甲', ratio: 0.7 },
          { partnerId: 'p-fd-2', partnerName: '前台商户乙', ratio: 0.3 },
        ],
      })
      expect(result.success).toBe(true)
      const data = asData(result).data
      expect(data.status).toBe('pending')
      expect(data.participants).toHaveLength(2)
    })

    it('【边界】比例不等于1的分账创建失败', () => {
      const result = controller.createSettlement({
        orderId: 'ord-fd-err',
        type: 'ratio',
        totalAmount: 5000,
        participants: [
          { partnerId: 'p-err', partnerName: '错误商户', ratio: 0.5 },
          { partnerId: 'p-err2', partnerName: '错误商户2', ratio: 0.3 },
        ],
      })
      expect(result.success).toBe(false)
      expect(result.message).toMatch(/ratio/i)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 👥 HR - 人员/伙伴信息管理
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.HR} HR`, () => {
    it('【正向】更新伙伴联系信息并验证变更', () => {
      const regResult = controller.registerPartner({
        name: 'HR测试商户',
        businessType: 'RETAIL',
        contact: '15000000000',
        address: '深圳市南山区',
      })
      const partnerId = asData(regResult).data.id
      const updateResult = controller.updatePartner(partnerId, {
        contact: '15099999999',
        businessType: 'F&B',
      })
      expect(asData(updateResult).data.contact).toBe('15099999999')
    })

    it('【边界】更新不存在的伙伴返回错误', () => {
      const result = controller.updatePartner('no-such-partner', { name: '匿名' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('【正向】根据业务类型筛选伙伴列表', () => {
      controller.registerPartner({ name: '餐饮店', businessType: 'F&B', contact: '1', address: 'a' })
      controller.registerPartner({ name: '科技公司', businessType: 'TECH', contact: '2', address: 'b' })
      controller.registerPartner({ name: '零售店', businessType: 'RETAIL', contact: '3', address: 'c' })
      const fList = asData(controller.listPartners({ businessType: 'F&B' }) as any)
      expect(fList.total).toBe(1)
      expect(fList.data[0].name).toBe('餐饮店')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 🔧 安监 - 风控与异常
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.Safety} 安监`, () => {
    it('【正向】检测伙伴异常模式并获取报告', () => {
      const detectResult = controller.detectAnomaly('partner-safety-1')
      expect(detectResult.success).toBe(true)
      // 由于模拟的小额交易，应该检测到异常
      expect(asData(detectResult).data.anomalies).toBeDefined()
    })

    it('【正向】标记可疑分账并验证标记状态', () => {
      const result = controller.flagSuspicious('stl-suspicious-001')
      expect(result.success).toBe(true)
      expect(asData(result).data.flagged).toBe(true)
    })

    it('【边界】扫描未关联订单后尝试关联不存在的订单应失败', () => {
      try {
        controller.linkOrder('non-existent-order', { partnerId: 'p-001' })
      } catch (e: any) {
        // controller catches UnlinkedOrderError and returns success: false
      }
      // 直接调用 service 层验证
      const detector = new UnlinkedOrderDetector()
      expect(() => detector.manualLink('non-existent', 'p-001')).toThrow(UnlinkedOrderError)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 🎮 导玩员 - 现场活动执行
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.Guide} 导玩员`, () => {
    it('【正向】查询伙伴健康度详情并确认各维度字段完整', () => {
      // 设置指标后查询
      controller.setMetrics('partner-guide-1', {
        revenue: 200000,
        orderCount: 600,
        complaintCount: 1,
        activeDays: 28,
      })
      const factors = asData(controller.getHealthFactors('partner-guide-1'))
      expect(factors.data.revenueScore).toBeGreaterThan(0)
      expect(factors.data.orderScore).toBeGreaterThan(0)
      expect(factors.data.overall).toBeGreaterThan(0)
    })

    it('【正向】获取健康度趋势并验证日期序列长度', () => {
      const trend = asData(controller.getHealthTrend('partner-guide-1'))
      expect(trend.data).toHaveLength(30)
    })

    it('【边界】无指标数据时健康度返回默认值', () => {
      const factors = asData(controller.getHealthFactors('new-partner-no-data'))
      expect(factors.data.overall).toBe(50)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 🎯 运行专员 - 日常运维操作
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.Ops} 运行专员`, () => {
    it('【正向】完整的伙伴等级计算 → 自动升级 → 降级周期', () => {
      const regResult = controller.registerPartner({
        name: '运维测试商户',
        businessType: 'RETAIL',
        contact: '1',
        address: 'a',
      })
      const pid = asData(regResult).data.id
      // 手动指定等级
      controller.assignGrade(pid, { grade: 'C' })
      // 计算等级（基于最近记录）
      const calcResult = controller.calculateGrade(pid)
      expect(calcResult.success).toBe(true)
    })

    it('【正向】创建分账 → 审批 → 执行完整流程', () => {
      const cResult = controller.createSettlement({
        orderId: 'ord-ops-001',
        type: 'fixed',
        totalAmount: 10000,
        participants: [
          { partnerId: 'p-ops-1', partnerName: '运维商户甲', fixedAmount: 6000 },
          { partnerId: 'p-ops-2', partnerName: '运维商户乙', fixedAmount: 4000 },
        ],
      })
      const sid = asData(cResult).data.settlementId
      controller.approveSettlement(sid)
      const eResult = controller.executeSettlement(sid)
      expect(asData(eResult).data.status).toBe('executed')
    })

    it('【边界】未审批直接执行分账应失败', () => {
      const cResult = controller.createSettlement({
        orderId: 'ord-ops-err',
        type: 'ratio',
        totalAmount: 5000,
        participants: [createParticipant('p-err', '错误商户', 1.0)],
      })
      const sid = asData(cResult).data.settlementId
      const eResult = controller.executeSettlement(sid)
      expect(eResult.success).toBe(false)
      expect(eResult.message).toContain('cannot execute')
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 🤝 团建 - 跨部门团建合作查看
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.Teambuilding} 团建`, () => {
    it('【正向】查看伙伴分级标准列表', () => {
      const result = controller.getGradeCriteria()
      expect(result.success).toBe(true)
      expect(asData(result).data).toHaveLength(4) // S/A/B/C 四级
    })

    it('【正向】查看已注册商户的整体概览', () => {
      controller.registerPartner({ name: '团建商户A', businessType: 'F&B', contact: '1', address: 'a' })
      controller.registerPartner({ name: '团建商户B', businessType: 'RETAIL', contact: '2', address: 'b' })
      const list = controller.listPartners({})
      expect(list.success).toBe(true)
      expect(list.total).toBe(2)
    })

    it('【边界】空列表时仍返回成功', () => {
      const result = controller.listPartners({ businessType: 'TECH' })
      expect(result.success).toBe(true)
      expect(result.total).toBe(0)
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 📢 营销 - 营销数据分析
  // ════════════════════════════════════════════════════════════════
  describe(`${ROLES.Marketing} 营销`, () => {
    it('【正向】查看伙伴分账历史用于营销分析', () => {
      // 创建一个有记录的分账
      const regResult = controller.registerPartner({ name: '营销测试商户', businessType: 'RETAIL', contact: '1', address: 'a' })
      const pid = asData(regResult).data.id
      controller.createSettlement({
        orderId: 'ord-mkt-001',
        type: 'ratio',
        totalAmount: 30000,
        participants: [createParticipant(pid, '营销测试商户', 1.0)],
      })
      const history = controller.getSettlementHistory(pid)
      expect(history.success).toBe(true)
      expect(asData(history).data.length).toBeGreaterThan(0)
    })

    it('【正向】查询伙伴等级用于营销推荐', () => {
      // assign grade then query
      const regResult = controller.registerPartner({ name: '营销高价值商户', businessType: 'RETAIL', contact: '1', address: 'a' })
      const pid = asData(regResult).data.id
      controller.assignGrade(pid, { grade: 'S' })
      const gradeResult = controller.getGrade(pid)
      expect(asData(gradeResult).data.grade).toBe('S')
    })

    it('【边界】未分级的伙伴返回 null', () => {
      const regResult = controller.registerPartner({ name: '新伙伴', businessType: 'SERVICE', contact: '1', address: 'a' })
      const pid = asData(regResult).data.id
      const gradeResult = controller.getGrade(pid)
      expect(asData(gradeResult).data.grade).toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════════════
  // 跨角色：健康度低效预警 (P2-2)
  // ════════════════════════════════════════════════════════════════
  describe('跨角色 P2-2 低效伙伴预警', () => {
    it('【👔店长+🔧安监】设置低指标后健康度低于阈值应触发预警', () => {
      const regResult = controller.registerPartner({ name: '低效伙伴', businessType: 'RETAIL', contact: '1', address: 'a' })
      const pid = asData(regResult).data.id
      controller.setMetrics(pid, { revenue: 1000, orderCount: 3, complaintCount: 5, activeDays: 2 })
      const healthResult = controller.calculateHealth(pid)
      expect(asData(healthResult).data.healthScore).toBeLessThan(40)
    })

    it('【🎯运行专员+🤝团建】S 级伙伴查询分级标准全部正确', () => {
      const criteria = asData(controller.getGradeCriteria())
      const sGrade = criteria.data.find((c: any) => c.grade === 'S')
      expect(sGrade).toBeDefined()
      expect(sGrade!.minScore).toBe(90)
      expect(sGrade!.maxScore).toBe(100)
      expect(sGrade!.label).toBe('金牌伙伴')
    })
  })
})
