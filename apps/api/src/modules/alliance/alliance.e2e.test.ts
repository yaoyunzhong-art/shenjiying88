/**
 * 🐜 自动: [alliance] E2E 基础测试
 *
 * E2E 链路: HTTP → AllianceController → AlliancePartner/PartnerGradingService/HealthScoreService
 *                        → CrossMerchantSettlementService/UnlinkedOrderDetector/AnomalyDetectionService
 *
 * 覆盖:
 *   - 伙伴注册 / 更新 / 查询 / 列表
 *   - 分级计算 / 手动指定 / 自动升/降级
 *   - 健康度计算 / 因素详情 / 趋势 / 指标设置
 *   - 分账创建 / 审批 / 执行 / 查询 / 历史
 *   - 未关联订单扫描 / 手动关联 / 自动关联
 *   - 异常检测 / 报告 / 可疑标记
 *   - 错误处理 (重复注册 / 不存在)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import 'reflect-metadata'
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

// ── Import actual services ────────────────────────────────────────────────────
import type { PartnerInfo, Grade } from './alliance-grade.service'
import {
  AlliancePartner as AlliancePartnerService,
  PartnerGradingService,
  HealthScoreService,
} from './alliance-grade.service'
import type { Settlement, SettlementParticipant } from './alliance-settlement.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

// ── Test Controller (inline routes matching alliance.controller.ts) ─────────

@Controller('alliance')
class TestAllianceController {
  constructor(
    @Inject(AlliancePartnerService) private readonly partnerService: AlliancePartnerService,
    @Inject(PartnerGradingService) private readonly gradingService: PartnerGradingService,
    @Inject(HealthScoreService) private readonly healthService: HealthScoreService,
    @Inject(CrossMerchantSettlementService) private readonly settlementService: CrossMerchantSettlementService,
    @Inject(UnlinkedOrderDetector) private readonly orderDetector: UnlinkedOrderDetector,
    @Inject(AnomalyDetectionService) private readonly anomalyService: AnomalyDetectionService,
  ) {}

  @Post('partner/register')
  registerPartner(@Body() body: any) {
    try {
      const partner = this.partnerService.register({
        name: body.name,
        businessType: body.businessType,
        contact: body.contact,
        address: body.address,
      })
      return { success: true, data: partner }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Put('partner/:partnerId')
  updatePartner(@Param('partnerId') partnerId: string, @Body() body: any) {
    try {
      const partner = this.partnerService.updatePartner(partnerId, body)
      return { success: true, data: partner }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Get('partner/:partnerId')
  getPartner(@Param('partnerId') partnerId: string) {
    const partner = this.partnerService.getPartner(partnerId)
    if (!partner) return { success: false, message: `Partner ${partnerId} not found` }
    return { success: true, data: partner }
  }

  @Get('partner')
  listPartners(@Query() query: any) {
    const partners = this.partnerService.listPartners({
      businessType: query.businessType,
      status: query.status,
      grade: query.grade,
    })
    return { success: true, data: partners, total: partners.length }
  }

  @Get('grading/criteria')
  getGradeCriteria() {
    const criteria = this.gradingService.getGradeCriteria()
    return { success: true, data: criteria }
  }

  @Post('grading/:partnerId/calculate')
  calculateGrade(@Param('partnerId') partnerId: string) {
    const grade = this.gradingService.calculateGrade(partnerId)
    return { success: true, data: { partnerId, grade } }
  }

  @Put('grading/:partnerId/assign')
  assignGrade(@Param('partnerId') partnerId: string, @Body() body: any) {
    this.gradingService.assignGrade(partnerId, body.grade)
    return { success: true, message: `Grade ${body.grade} assigned to ${partnerId}` }
  }

  @Get('grading/:partnerId')
  getGrade(@Param('partnerId') partnerId: string) {
    const grade = this.gradingService.getGrade(partnerId)
    return { success: true, data: { partnerId, grade } }
  }

  @Post('grading/:partnerId/auto-upgrade')
  autoUpgrade(@Param('partnerId') partnerId: string) {
    const upgraded = this.gradingService.autoUpgrade(partnerId)
    return { success: true, data: { partnerId, upgraded }, message: upgraded ? 'Upgraded!' : 'No upgrade condition met' }
  }

  @Post('grading/:partnerId/auto-downgrade')
  autoDowngrade(@Param('partnerId') partnerId: string) {
    const downgraded = this.gradingService.autoDowngrade(partnerId)
    return { success: true, data: { partnerId, downgraded }, message: downgraded ? 'Downgraded!' : 'No downgrade condition met' }
  }

  @Post('health/:partnerId/calculate')
  calculateHealth(@Param('partnerId') partnerId: string) {
    const score = this.healthService.calculateHealthScore(partnerId)
    return { success: true, data: { partnerId, healthScore: score } }
  }

  @Get('health/:partnerId/factors')
  getHealthFactors(@Param('partnerId') partnerId: string) {
    const factors = this.healthService.getHealthFactors(partnerId)
    return { success: true, data: factors }
  }

  @Get('health/:partnerId/trend')
  getHealthTrend(@Param('partnerId') partnerId: string) {
    const trend = this.healthService.getHealthTrend(partnerId, 30)
    return { success: true, data: trend }
  }

  @Post('health/:partnerId/metrics')
  setMetrics(@Param('partnerId') partnerId: string, @Body() body: any) {
    this.healthService.setMetrics(partnerId, body)
    return { success: true, message: 'Metrics updated' }
  }

  @Post('settlement/create')
  createSettlement(@Body() body: any) {
    try {
      const settlement = this.settlementService.createSettlement(body.orderId, body.type, body.totalAmount, body.participants)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  @Post('settlement/:settlementId/approve')
  approveSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.approveSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  @Post('settlement/:settlementId/execute')
  executeSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.executeSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  @Get('settlement/:settlementId')
  querySettlement(@Param('settlementId') settlementId: string) {
    const settlement = this.settlementService.querySettlement(settlementId)
    if (!settlement) return { success: false, message: `Settlement ${settlementId} not found` }
    return { success: true, data: settlement }
  }

  @Get('settlement/history/:partnerId')
  getSettlementHistory(@Param('partnerId') partnerId: string) {
    const history = this.settlementService.getSettlementHistory(partnerId)
    return { success: true, data: history, total: history.length }
  }

  @Post('order/scan-unlinked')
  scanUnlinkedOrders(@Body() body: any) {
    const orders = this.orderDetector.scanUnlinkedOrders(body.storeId, new Date(body.since))
    return {
      success: true,
      data: { storeId: body.storeId, orders: orders.map((o: any) => ({
        orderId: o.orderId, amount: o.amount,
        createdAt: o.createdAt.toISOString(), linkStatus: o.linkStatus,
      })), total: orders.length },
    }
  }

  @Post('order/:orderId/link')
  linkOrder(@Param('orderId') orderId: string, @Body() body: any) {
    try {
      const result = this.orderDetector.manualLink(orderId, body.partnerId)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  @Post('order/:orderId/auto-link')
  autoLinkOrder(@Param('orderId') orderId: string) {
    const result = this.orderDetector.autoLinkByRule(orderId)
    return { success: true, data: result }
  }

  @Post('anomaly/detect/:partnerId')
  detectAnomaly(@Param('partnerId') partnerId: string) {
    const anomalies = this.anomalyService.detectUnusualPattern(partnerId)
    return { success: true, data: { partnerId, anomalies, count: anomalies.length } }
  }

  @Get('anomaly/report/:partnerId')
  getAnomalyReport(@Param('partnerId') partnerId: string) {
    const report = this.anomalyService.getAnomalyReport(partnerId)
    return { success: true, data: report }
  }

  @Post('settlement/:settlementId/flag-suspicious')
  flagSuspicious(@Param('settlementId') settlementId: string) {
    const result = this.anomalyService.flagSuspiciousSettlement(settlementId)
    return { success: true, data: result }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Test Suite
// ══════════════════════════════════════════════════════════════════════════════

describe('Alliance E2E (HTTP → Controller → Service)', () => {
  let app: any
  let http: request.SuperTest<request.Test>

  // ── Setup ──────────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestAllianceController],
      providers: [
        AlliancePartnerService,
        PartnerGradingService,
        HealthScoreService,
        CrossMerchantSettlementService,
        UnlinkedOrderDetector,
        AnomalyDetectionService,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    http = request(app.getHttpServer()) as any
  })

  afterAll(async () => {
    await app?.close()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Partner Registration & Management
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /alliance/partner/register — 伙伴注册', () => {
    it('正例: 注册新伙伴成功', async () => {
      const res = await http
        .post('/alliance/partner/register')
        .send({ name: '测试乐园A', businessType: 'RETAIL', contact: '13800138001', address: '北京市朝阳区' })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.id).toBeDefined()
      expect(res.body.data.name).toBe('测试乐园A')
      expect(res.body.data.status).toBe('ACTIVE')
    })

    it('反例: 重复注册同名伙伴失败', async () => {
      await http
        .post('/alliance/partner/register')
        .send({ name: '测试乐园B', businessType: 'F&B', contact: '13800138002', address: '上海市' })
        .expect(201)
      const res = await http
        .post('/alliance/partner/register')
        .send({ name: '测试乐园B', businessType: 'F&B', contact: '13800138002', address: '上海市' })
        .expect(201)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('already exists')
    })
  })

  describe('PUT /alliance/partner/:partnerId — 更新伙伴', () => {
    let partnerId: string

    beforeEach(async () => {
      const res = await http
        .post('/alliance/partner/register')
        .send({ name: '更新测试伙伴', businessType: 'SERVICE', contact: '13900000001', address: '广州市' })
      partnerId = res.body.data.id
    })

    it('正例: 更新伙伴名称成功', async () => {
      const res = await http
        .put(`/alliance/partner/${partnerId}`)
        .send({ name: '更新测试伙伴-新名称' })
        .expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('更新测试伙伴-新名称')
    })
  })

  describe('GET /alliance/partner/:partnerId — 查询伙伴', () => {
    it('正例: 查询已注册伙伴成功', async () => {
      const res = await http.post('/alliance/partner/register')
        .send({ name: '查询测试伙伴', businessType: 'TECH', contact: '13900000002', address: '深圳市' })
      const pid = res.body.data.id
      const getRes = await http.get(`/alliance/partner/${pid}`).expect(200)
      expect(getRes.body.success).toBe(true)
      expect(getRes.body.data.name).toBe('查询测试伙伴')
    })

    it('反例: 查询不存在的伙伴返回失败', async () => {
      const res = await http.get('/alliance/partner/nonexistent-id').expect(200)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('not found')
    })
  })

  describe('GET /alliance/partner — 伙伴列表', () => {
    it('正例: 列出伙伴', async () => {
      const res = await http.get('/alliance/partner').expect(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.total).toBeGreaterThanOrEqual(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Grading System
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /alliance/grading/criteria — 分级标准', () => {
    it('正例: 返回分级标准列表', async () => {
      const res = await http.get('/alliance/grading/criteria').expect(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(4) // S/A/B/C
      expect(res.body.data[0].grade).toBeDefined()
    })
  })

  describe('POST /alliance/grading/:partnerId/calculate — 计算等级', () => {
    it('正例: 计算新伙伴初始等级', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '分级计算伙伴', businessType: 'SERVICE', contact: '13100000001', address: '杭州市' })
      const pid = reg.body.data.id
      const res = await http.post(`/alliance/grading/${pid}/calculate`).expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.grade).toBeDefined()
      expect(['S', 'A', 'B', 'C']).toContain(res.body.data.grade)
    })
  })

  describe('PUT /alliance/grading/:partnerId/assign — 手动指定等级', () => {
    it('正例: 手动指定等级并查询', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '手动分级伙伴', businessType: 'RETAIL', contact: '13200000001', address: '武汉市' })
      const pid = reg.body.data.id
      await http.put(`/alliance/grading/${pid}/assign`).send({ grade: 'S' }).expect(200)
      const res = await http.get(`/alliance/grading/${pid}`).expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.grade).toBe('S')
    })
  })

  describe('POST /alliance/grading/:partnerId/auto-upgrade — 自动升级', () => {
    it('正例: 自动升级检测', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '自动升级伙伴', businessType: 'TECH', contact: '13300000001', address: '成都市' })
      const pid = reg.body.data.id
      const res = await http.post(`/alliance/grading/${pid}/auto-upgrade`).expect(201)
      expect(res.body.success).toBe(true)
      expect(typeof res.body.data.upgraded).toBe('boolean')
    })
  })

  describe('POST /alliance/grading/:partnerId/auto-downgrade — 自动降级', () => {
    it('正例: 自动降级检测', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '自动降级伙伴', businessType: 'RETAIL', contact: '13400000001', address: '南京市' })
      const pid = reg.body.data.id
      const res = await http.post(`/alliance/grading/${pid}/auto-downgrade`).expect(201)
      expect(res.body.success).toBe(true)
      expect(typeof res.body.data.downgraded).toBe('boolean')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Health Score
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /alliance/health/:partnerId/calculate — 健康度计算', () => {
    it('正例: 计算健康度', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '健康度测试伙伴', businessType: 'SERVICE', contact: '13500000001', address: '西安市' })
      const pid = reg.body.data.id
      const res = await http.post(`/alliance/health/${pid}/calculate`).expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.healthScore).toBeGreaterThanOrEqual(0)
      expect(res.body.data.healthScore).toBeLessThanOrEqual(100)
    })
  })

  describe('GET /alliance/health/:partnerId/factors — 健康度因素', () => {
    it('正例: 获取健康因素', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '健康因素测试', businessType: 'RETAIL', contact: '13600000001', address: '长沙市' })
      const pid = reg.body.data.id
      const res = await http.get(`/alliance/health/${pid}/factors`).expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('GET /alliance/health/:partnerId/trend — 健康度趋势', () => {
    it('正例: 获取健康趋势', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '健康趋势测试', businessType: 'SERVICE', contact: '13700000001', address: '苏州市' })
      const pid = reg.body.data.id
      await http.post(`/alliance/health/${pid}/metrics`).send({
        revenue: 100000, orderCount: 500, complaintCount: 2, activeDays: 25,
      })
      const res = await http.get(`/alliance/health/${pid}/trend`).expect(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /alliance/health/:partnerId/metrics — 设置指标', () => {
    it('正例: 设置指标后健康度更新', async () => {
      const reg = await http.post('/alliance/partner/register')
        .send({ name: '设定指标测试', businessType: 'TECH', contact: '13800000001', address: '天津市' })
      const pid = reg.body.data.id
      await http.post(`/alliance/health/${pid}/metrics`).send({
        revenue: 200000, orderCount: 1000, complaintCount: 1, activeDays: 28,
      }).expect(201)
      const res = await http.post(`/alliance/health/${pid}/calculate`).expect(201)
      expect(res.body.data.healthScore).toBeGreaterThan(60)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Settlement (using settlementId, not id)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /alliance/settlement/create — 创建分账', () => {
    it('正例: 创建比例分账成功', async () => {
      const participants: SettlementParticipant[] = [
        { partnerId: 'p-a', partnerName: '乐园A', ratio: 0.6 },
        { partnerId: 'p-b', partnerName: '乐园B', ratio: 0.4 },
      ]
      const res = await http
        .post('/alliance/settlement/create')
        .send({ orderId: 'order-001', type: 'ratio', totalAmount: 10000, participants })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.settlementId).toBeDefined()
      expect(res.body.data.status).toBe('pending')
    })

    it('正例: 创建固定金额分账成功', async () => {
      const participants: SettlementParticipant[] = [
        { partnerId: 'p-c', partnerName: '乐园C', fixedAmount: 3000 },
        { partnerId: 'p-d', partnerName: '乐园D', fixedAmount: 2000 },
      ]
      const res = await http
        .post('/alliance/settlement/create')
        .send({ orderId: 'order-002', type: 'fixed', totalAmount: 5000, participants })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.settlementId).toBeDefined()
      expect(res.body.data.status).toBe('pending')
    })
  })

  describe('POST /alliance/settlement/:settlementId/approve — 审批分账', () => {
    it('正例: 审批分账成功', async () => {
      const createRes = await http.post('/alliance/settlement/create').send({
        orderId: 'approve-test', type: 'fixed', totalAmount: 3000,
        participants: [{ partnerId: 'p1', partnerName: 'P1', fixedAmount: 3000 }],
      })
      const sid = createRes.body.data.settlementId
      const res = await http.post(`/alliance/settlement/${sid}/approve`).expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('approved')
    })

    it('反例: 审批不存在的分账失败', async () => {
      const res = await http.post('/alliance/settlement/nonexistent/approve').expect(201)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /alliance/settlement/:settlementId/execute — 执行分账', () => {
    it('正例: 批准后执行分账成功', async () => {
      const createRes = await http.post('/alliance/settlement/create').send({
        orderId: 'exec-test', type: 'fixed', totalAmount: 3000,
        participants: [{ partnerId: 'p-exec', partnerName: 'Exec', fixedAmount: 3000 }],
      })
      const sid = createRes.body.data.settlementId
      await http.post(`/alliance/settlement/${sid}/approve`)
      const res = await http.post(`/alliance/settlement/${sid}/execute`).expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('executed')
    })
  })

  describe('GET /alliance/settlement/:settlementId — 查询分账', () => {
    it('正例: 查询分账成功', async () => {
      const createRes = await http.post('/alliance/settlement/create').send({
        orderId: 'query-test', type: 'fixed', totalAmount: 5000,
        participants: [{ partnerId: 'p-query', partnerName: 'Query', fixedAmount: 5000 }],
      })
      const sid = createRes.body.data.settlementId
      const res = await http.get(`/alliance/settlement/${sid}`).expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.orderId).toBe('query-test')
    })

    it('反例: 查询不存在的分账', async () => {
      const res = await http.get('/alliance/settlement/no-such-id').expect(200)
      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /alliance/settlement/history/:partnerId — 分账历史', () => {
    it('正例: 获取伙伴分账历史', async () => {
      const res = await http.get('/alliance/settlement/history/test-partner').expect(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Unlinked Orders (use real mock orders from service)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /alliance/order/scan-unlinked — 扫描未关联订单', () => {
    it('正例: 扫描门店未关联订单', async () => {
      const res = await http
        .post('/alliance/order/scan-unlinked')
        .send({ storeId: 'store-A', since: '2026-01-01T00:00:00Z' })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.storeId).toBe('store-A')
      expect(Array.isArray(res.body.data.orders)).toBe(true)
    })
  })

  describe('POST /alliance/order/:orderId/link — 手动关联', () => {
    it('正例: 手动关联已存在的未关联订单', async () => {
      // order-u-001 is a mock order that exists in the service
      const res = await http
        .post('/alliance/order/order-u-001/link')
        .send({ partnerId: 'partner-link-test' })
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.linkStatus).toBe('linked')
    })

    it('反例: 关联不存在的订单失败', async () => {
      const res = await http
        .post('/alliance/order/no-such-order/link')
        .send({ partnerId: 'partner-x' })
        .expect(201)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /alliance/order/:orderId/auto-link — 自动关联', () => {
    it('正例: 自动关联order-u-003 (金额>=10000)', async () => {
      const res = await http
        .post('/alliance/order/order-u-003/auto-link')
        .expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.linked).toBe(true)
    })

    it('边界: 小金额订单智能不关联', async () => {
      const res = await http
        .post('/alliance/order/order-u-002/auto-link')
        .expect(201)
      expect(res.body.success).toBe(true)
      // order-u-002 is 8000 < 10000, so autoLinkByRule should return linked: false
      expect(res.body.data.linked).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Anomaly Detection
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /alliance/anomaly/detect/:partnerId — 异常检测', () => {
    it('正例: 检测伙伴异常', async () => {
      const res = await http.post('/alliance/anomaly/detect/partner-x').expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.partnerId).toBe('partner-x')
      expect(typeof res.body.data.count).toBe('number')
    })
  })

  describe('GET /alliance/anomaly/report/:partnerId — 异常报告', () => {
    it('正例: 获取伙伴异常报告', async () => {
      const res = await http.get('/alliance/anomaly/report/partner-x').expect(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.partnerId).toBe('partner-x')
    })
  })

  describe('POST /alliance/settlement/:settlementId/flag-suspicious — 标记可疑', () => {
    it('正例: 标记分账可疑成功', async () => {
      const res = await http.post('/alliance/settlement/stl-test-001/flag-suspicious').expect(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.flagged).toBe(true)
    })
  })
})
