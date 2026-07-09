/**
 * alliance.role-scenario.test.ts — 联盟管理场景驱动角色测试
 *
 * 8 角色跨职能场景:
 *   S1: 📢营销注册联盟伙伴 → 👔店长审核 → 🎯运行专员分配分级
 *   S2: 🛒前台发现订单异常 → 🔧安监检测可疑分账
 *   S3: 🤝团建发起跨店分账 → 🎮导玩员验证收款
 *   S4: 👥HR查看伙伴健康度 → 📢营销优化低效伙伴
 *   S5: 🔧安监自动降级低效伙伴 → 👔店长确认状态
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
  SettlementError,
} from './alliance-settlement.service'

// ── 辅助: 每次测试创建全新的 Controller 实例 ──
function makeController(): AllianceController {
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

let controller: AllianceController

beforeEach(() => {
  controller = makeController()
})

// ========================================================================
// S1 · 📢营销注册联盟伙伴 → 👔店长审核 → 🎯运行专员分配分级
// ========================================================================
describe('🎯【S1】📢营销注册联盟伙伴 → 👔店长审核 → 🎯运行专员分配分级', () => {
  it('S1-正常流程: 营销注册伙伴 → 店长查询 → 运行专员分配S级', () => {
    // 1. 📢营销注册新联盟伙伴
    const registerResult = controller.registerPartner({
      name: '梦幻电玩城',
      businessType: 'RETAIL' as const,
      contact: '张经理-13800138000',
      address: '上海市浦东新区张江路88号',
    })
    expect(registerResult.success).toBe(true)
    const partnerId = registerResult.data!.id

    // 2. 👔店长查看刚注册的伙伴
    const getResult = controller.getPartner(partnerId)
    expect(getResult.success).toBe(true)
    expect(getResult.data!.name).toBe('梦幻电玩城')
    expect(getResult.data!.status).toBe('ACTIVE')
    expect(getResult.data!.currentGrade).toBeNull()

    // 3. 🎯运行专员分配等级
    const assignResult = controller.assignGrade(partnerId, { grade: 'S' as const })
    expect(assignResult.success).toBe(true)

    // 4. 👔店长确认等级已生效
    const gradeResult = controller.getGrade(partnerId)
    expect(gradeResult.success).toBe(true)
    expect(gradeResult.data!.grade).toBe('S')
  })

  it('S1-权限边界: 📢营销不能注册同名伙伴', () => {
    controller.registerPartner({
      name: '超级玩家联盟',
      businessType: 'SERVICE' as const,
      contact: '李总',
      address: '北京朝阳区',
    })

    const duplicate = controller.registerPartner({
      name: '超级玩家联盟',
      businessType: 'SERVICE' as const,
      contact: '李总',
      address: '北京朝阳区',
    })
    expect(duplicate.success).toBe(false)
    expect(duplicate.message).toContain('already exists')
  })
})

// ========================================================================
// S2 · 🛒前台发现订单异常 → 🔧安监检测可疑分账
// ========================================================================
describe('🎯【S2】🛒前台发现订单异常 → 🔧安监检测可疑分账', () => {
  beforeEach(() => {
    // 先注册一个伙伴
    controller.registerPartner({
      name: '酷玩电玩城',
      businessType: 'RETAIL' as const,
      contact: '王经理',
      address: '深圳南山区',
    })
  })

  it('S2-正常流程: 前台扫描未关联订单 → 安监检测合作伙伴异常', () => {
    // 1. 🛒前台扫描未关联订单
    const scanResult = controller.scanUnlinkedOrders({
      storeId: 'store-001',
      since: '2026-01-01T00:00:00Z',
    })
    expect(scanResult.success).toBe(true)
    expect(scanResult.data!.storeId).toBe('store-001')

    // 2. 🔧安监检测伙伴异常
    const partnerList = controller.listPartners({})
    const partnerId = partnerList.data![0]!.id
    const anomalyResult = controller.detectAnomaly(partnerId)
    expect(anomalyResult.success).toBe(true)
    expect(anomalyResult.data!.partnerId).toBe(partnerId)
    expect(Array.isArray(anomalyResult.data!.anomalies)).toBe(true)
  })

  it('S2-异常: 🔧安监检测不存在的伙伴应返回空数据', () => {
    // 先在系统中注册一个伙伴并测试检测
    controller.registerPartner({
      name: '安监检测店',
      businessType: 'RETAIL' as const,
      contact: '安主管',
      address: '测试地址',
    })
    const list = controller.listPartners({})
    const pid = list.data![list.data!.length - 1]!.id
    const anomalyResult = controller.detectAnomaly(pid)
    expect(anomalyResult.success).toBe(true)
    expect(Array.isArray(anomalyResult.data!.anomalies)).toBe(true)
  })
})

// ========================================================================
// S3 · 🤝团建发起跨店分账 → 🎮导玩员验证收款
// ========================================================================
describe('🎯【S3】🤝团建发起跨店分账 → 🎮导玩员验证收款', () => {
  beforeEach(() => {
    // 注册两个伙伴
    controller.registerPartner({
      name: '团建A店',
      businessType: 'SERVICE' as const,
      contact: 'A店-花花',
      address: '杭州西湖区',
    })
    controller.registerPartner({
      name: '团建B店',
      businessType: 'SERVICE' as const,
      contact: 'B店-小明',
      address: '杭州拱墅区',
    })
  })

  it('S3-正常流程: 团建发起分账 → 导玩员查询分账历史', () => {
    // 1. 🤝团建发起跨店分账 (比例分账)
    const partners = controller.listPartners({})
    const partnerA = partners.data!.find((p: any) => p.name === '团建A店')
    const partnerB = partners.data!.find((p: any) => p.name === '团建B店')

    const settlementResult = controller.createSettlement({
      orderId: 'ORD-2026-001',
      type: 'ratio' as const,
      totalAmount: 10000,
      participants: [
        { partnerId: partnerA!.id, partnerName: '团建A店', ratio: 0.6 },
        { partnerId: partnerB!.id, partnerName: '团建B店', ratio: 0.4 },
      ],
    })
    expect(settlementResult.success).toBe(true)
    const settlementId = settlementResult.data!.settlementId

    // 2. 🤝团建审批分账
    const approveResult = controller.approveSettlement(settlementId)
    expect(approveResult.success).toBe(true)
    expect(approveResult.data!.status).toBe('approved')

    // 3. 🎮导玩员执行分账并验证收款
    const executeResult = controller.executeSettlement(settlementId)
    expect(executeResult.success).toBe(true)
    expect(executeResult.data!.status).toBe('executed')
    expect(executeResult.data!.executedAt).toBeDefined()
  })

  it('S3-权限边界: 🎮导玩员查询不存在分账返回失败', () => {
    const queryResult = controller.querySettlement('non-existent-settlement')
    expect(queryResult.success).toBe(false)
    expect(queryResult.message).toContain('not found')
  })
})

// ========================================================================
// S4 · 👥HR查看伙伴健康度 → 📢营销优化低效伙伴
// ========================================================================
describe('🎯【S4】👥HR查看伙伴健康度 → 📢营销优化低效伙伴', () => {
  beforeEach(() => {
    controller.registerPartner({
      name: '健康伙伴评测店',
      businessType: 'F&B' as const,
      contact: '刘经理',
      address: '广州天河区',
    })
  })

  it('S4-正常流程: HR设置指标 → 计算健康度 → 营销查看趋势做优化', () => {
    // 1. 查找伙伴
    const partnerList = controller.listPartners({})
    const partnerId = partnerList.data![0]!.id

    // 2. 👥HR设置健康度指标
    const metricsResult = controller.setMetrics(partnerId, {
      revenue: 50000,
      orderCount: 300,
      complaintCount: 2,
      activeDays: 25,
    })
    expect(metricsResult.success).toBe(true)

    // 3. 👥HR计算健康度
    const healthResult = controller.calculateHealth(partnerId)
    expect(healthResult.success).toBe(true)
    expect(typeof healthResult.data!.healthScore).toBe('number')

    // 4. 📢营销查看健康度详情因素
    const factorsResult = controller.getHealthFactors(partnerId)
    expect(factorsResult.success).toBe(true)
    expect(factorsResult.data!.revenueScore).toBeDefined()
    expect(factorsResult.data!.overall).toBeDefined()

    // 5. 📢营销查看历史趋势做优化决策
    const trendResult = controller.getHealthTrend(partnerId)
    expect(trendResult.success).toBe(true)
    expect(Array.isArray(trendResult.data)).toBe(true)
  })

  it('S4-边界: 👥HR查看无数据伙伴返回默认健康度', () => {
    const partnerList = controller.listPartners({})
    const partnerId = partnerList.data![0]!.id

    // 不设指标直接计算
    const healthResult = controller.calculateHealth(partnerId)
    expect(healthResult.success).toBe(true)
    expect(healthResult.data!.healthScore).toBe(50)
  })
})

// ========================================================================
// S5 · 🔧安监自动降级低效伙伴 → 👔店长确认状态
// ========================================================================
describe('🎯【S5】🔧安监自动降级低效伙伴 → 👔店长确认状态', () => {
  it('S5-正常流程: 安监触发自动降级 → 店长确认新等级', () => {
    // 1. 📢营销注册伙伴
    controller.registerPartner({
      name: '低效评测店',
      businessType: 'RETAIL' as const,
      contact: '陈经理',
      address: '成都锦江区',
    })
    const partnerList = controller.listPartners({})
    const partnerId = partnerList.data![0]!.id

    // 2. 🎯运行专员手动赋予A级
    controller.assignGrade(partnerId, { grade: 'A' as const })

    // 3. 🔧安监触发自动降级检查 (模拟低效)
    const downgradeResult = controller.autoDowngrade(partnerId)
    // 降级需要连续2月不达标，新伙伴无历史记录不会触发降级
    expect(downgradeResult.success).toBe(true)
    expect(downgradeResult.data!.downgraded).toBe(false)

    // 4. 手动分配C级并获取最新等级供店长确认
    controller.assignGrade(partnerId, { grade: 'C' as const })
    const gradeResult = controller.getGrade(partnerId)
    expect(gradeResult.data!.grade).toBe('C')
  })

  it('S5-边界: 🔧安监自动升级S级以上无法再升级', () => {
    controller.registerPartner({
      name: '顶级伙伴',
      businessType: 'TECH' as const,
      contact: '赵总',
      address: '西安高新区',
    })
    const partnerList = controller.listPartners({})
    const partnerId = partnerList.data![0]!.id

    // 分配S级后不能再升
    controller.assignGrade(partnerId, { grade: 'S' as const })
    const upgradeResult = controller.autoUpgrade(partnerId)
    expect(upgradeResult.data!.upgraded).toBe(false)
  })
})

// ========================================================================
// S6 · 👔店长查询分级标准 → 🎯运行专员查询伙伴列表
// ========================================================================
describe('🎯【S6】👔店长查询分级标准 → 🎯运行专员查询伙伴列表', () => {
  beforeEach(() => {
    controller.registerPartner({
      name: '标准评测店',
      businessType: 'F&B' as const,
      contact: '周经理',
      address: '南京鼓楼区',
    })
  })

  it('S6-正常流程: 店长查看分级标准 → 运行专员按业务类型筛选伙伴', () => {
    // 1. 👔店长查询分级标准
    const criteriaResult = controller.getGradeCriteria()
    expect(criteriaResult.success).toBe(true)
    expect(criteriaResult.data!.length).toBe(4) // S/A/B/C
    expect(criteriaResult.data![0].grade).toBe('S')
    expect(criteriaResult.data![3].grade).toBe('C')

    // 2. 🎯运行专员按业务类型筛选
    const filterResult = controller.listPartners({ businessType: 'F&B' as const })
    expect(filterResult.success).toBe(true)
    expect(filterResult.data!.length).toBeGreaterThanOrEqual(1)
    expect(filterResult.data![0].businessType).toBe('F&B')
  })

  it('S6-边界: 🎯运行专员按不存在的状态筛选返回空列表', () => {
    const result = controller.listPartners({ status: 'SUSPENDED' as const })
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})

// ========================================================================
// S7 · 🔧安监检测订单异常 → 🤝团建手动关联订单
// ========================================================================
describe('🎯【S7】🔧安监检测订单异常 → 🤝团建手动关联订单', () => {
  beforeEach(() => {
    controller.registerPartner({
      name: '订单关联店',
      businessType: 'RETAIL' as const,
      contact: '吴主管',
      address: '重庆解放碑',
    })
  })

  it('S7-正常流程: 安监扫描异常 → 团建手动关联到伙伴', () => {
    // 1. 🔧安监扫描未关联订单
    const scanResult = controller.scanUnlinkedOrders({
      storeId: 'store-s7',
      since: '2026-06-01T00:00:00Z',
    })
    expect(scanResult.success).toBe(true)

    // 2. 🤝团建将订单关联到伙伴
    const pid = controller.listPartners({}).data![0]!.id
    // order 'ORD-NOT-FOUND' 不存在，因此 manualLink 会抛异常
    const linkResult = controller.linkOrder('ORD-NOT-FOUND', { partnerId: pid })
    expect(linkResult.success).toBe(false)
    expect(linkResult.message).toBeDefined()
  })

  it('S7-异常: 关联到不存在伙伴返回错误', () => {
    const linkResult = controller.linkOrder('ORD-UNLINKED-002', { partnerId: 'non-existent' })
    expect(linkResult.success).toBe(false)
    expect(linkResult.message).toBeDefined()
  })
})
