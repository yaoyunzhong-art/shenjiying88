import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'
import { AllianceTierService } from './alliance-tier.service'
import { AllianceCouponService } from './alliance-coupon.service'
import { AllianceDataService, type CallbackDataType } from './alliance-data.service'
import { AllianceReviewService } from './alliance-review.service'
import { AllianceDashboardService } from './alliance-dashboard.service'
import {
  RegisterPartnerDto,
  UpdatePartnerDto,
  ListPartnerQueryDto,
  AssignGradeDto,
  CreateSettlementDto,
  SetMetricsDto,
  ScanUnlinkedOrdersDto,
  LinkOrderDto,
  SetTierConfigDto,
  IssueCouponDto,
  RedeemCouponDto,
  ReceiveCallbackDto,
  QueryCallbackDto,
  ReportAnomalyDto,
  SubmitReviewDto,
} from './alliance.dto'

@Controller('alliance')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AllianceController {
  constructor(
    private readonly partnerService: AlliancePartner,
    private readonly gradingService: PartnerGradingService,
    private readonly healthService: HealthScoreService,
    private readonly settlementService: CrossMerchantSettlementService,
    private readonly orderDetector: UnlinkedOrderDetector,
    private readonly anomalyService: AnomalyDetectionService,
    private readonly tierService: AllianceTierService = new AllianceTierService(),
    private readonly couponService: AllianceCouponService = new AllianceCouponService(new AllianceTierService()),
    private readonly dataService: AllianceDataService = new AllianceDataService(),
    private readonly reviewService: AllianceReviewService = new AllianceReviewService(),
    private readonly dashboardService: AllianceDashboardService = new AllianceDashboardService(),
  ) {}

  // ─── Partner Registration ────────────────────────────────────

  /**
   * 注册联盟伙伴
   */
  @Post('partner/register')
  registerPartner(@Body() body: RegisterPartnerDto) {
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

  /**
   * 更新伙伴信息
   */
  @Put('partner/:partnerId')
  updatePartner(
    @Param('partnerId') partnerId: string,
    @Body() body: UpdatePartnerDto,
  ) {
    try {
      const partner = this.partnerService.updatePartner(partnerId, body)
      return { success: true, data: partner }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  /**
   * 停用/退出伙伴
   */
  @Post('partner/:partnerId/deactivate')
  deactivatePartner(@Param('partnerId') partnerId: string) {
    try {
      const partner = this.partnerService.deactivatePartner(partnerId)
      return { success: true, data: partner, message: 'Partner deactivated' }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  /**
   * 重新启用伙伴
   */
  @Post('partner/:partnerId/reactivate')
  reactivatePartner(@Param('partnerId') partnerId: string) {
    try {
      const partner = this.partnerService.reactivatePartner(partnerId)
      return { success: true, data: partner, message: 'Partner reactivated' }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  /**
   * 获取伙伴详情
   */
  @Get('partner/:partnerId')
  getPartner(@Param('partnerId') partnerId: string) {
    const partner = this.partnerService.getPartner(partnerId)
    if (!partner) {
      return { success: false, message: `Partner ${partnerId} not found` }
    }
    return { success: true, data: partner }
  }

  /**
   * 列出伙伴（支持过滤）
   */
  @Get('partner')
  listPartners(@Query() query: ListPartnerQueryDto) {
    const partners = this.partnerService.listPartners({
      businessType: query.businessType,
      status: query.status,
      grade: query.grade,
    })
    return { success: true, data: partners, total: partners.length }
  }

  // ─── Grading ─────────────────────────────────────────────────

  /**
   * 获取分级标准
   */
  @Get('grading/criteria')
  getGradeCriteria() {
    const criteria = this.gradingService.getGradeCriteria()
    return { success: true, data: criteria }
  }

  /**
   * 计算评定等级
   */
  @Post('grading/:partnerId/calculate')
  calculateGrade(@Param('partnerId') partnerId: string) {
    const grade = this.gradingService.calculateGrade(partnerId)
    return { success: true, data: { partnerId, grade } }
  }

  /**
   * 手动指定等级
   */
  @Put('grading/:partnerId/assign')
  assignGrade(
    @Param('partnerId') partnerId: string,
    @Body() body: AssignGradeDto,
  ) {
    this.gradingService.assignGrade(partnerId, body.grade)
    return { success: true, message: `Grade ${body.grade} assigned to ${partnerId}` }
  }

  /**
   * 获取当前等级
   */
  @Get('grading/:partnerId')
  getGrade(@Param('partnerId') partnerId: string) {
    const grade = this.gradingService.getGrade(partnerId)
    return { success: true, data: { partnerId, grade } }
  }

  /**
   * 自动升级检测
   */
  @Post('grading/:partnerId/auto-upgrade')
  autoUpgrade(@Param('partnerId') partnerId: string) {
    const upgraded = this.gradingService.autoUpgrade(partnerId)
    return {
      success: true,
      data: { partnerId, upgraded },
      message: upgraded ? 'Upgraded!' : 'No upgrade condition met',
    }
  }

  /**
   * 自动降级检测
   */
  @Post('grading/:partnerId/auto-downgrade')
  autoDowngrade(@Param('partnerId') partnerId: string) {
    const downgraded = this.gradingService.autoDowngrade(partnerId)
    return {
      success: true,
      data: { partnerId, downgraded },
      message: downgraded ? 'Downgraded!' : 'No downgrade condition met',
    }
  }

  // ─── Health Score ────────────────────────────────────────────

  /**
   * 计算健康度
   */
  @Post('health/:partnerId/calculate')
  calculateHealth(@Param('partnerId') partnerId: string) {
    const score = this.healthService.calculateHealthScore(partnerId)
    return { success: true, data: { partnerId, healthScore: score } }
  }

  /**
   * 获取健康度因素详情
   */
  @Get('health/:partnerId/factors')
  getHealthFactors(@Param('partnerId') partnerId: string) {
    const factors = this.healthService.getHealthFactors(partnerId)
    return { success: true, data: factors }
  }

  /**
   * 获取健康度趋势
   */
  @Get('health/:partnerId/trend')
  getHealthTrend(@Param('partnerId') partnerId: string) {
    const trend = this.healthService.getHealthTrend(partnerId, 30)
    return { success: true, data: trend }
  }

  /**
   * BS-0294: 低效联盟预警
   */
  @Get('health/low-efficiency')
  getLowEfficiency() {
    const alerts = this.healthService.detectLowEfficiencyPartners()
    return { success: true, data: alerts, total: alerts.length }
  }

  /**
   * 设置指标（测试辅助）
   */
  @Post('health/:partnerId/metrics')
  setMetrics(
    @Param('partnerId') partnerId: string,
    @Body() body: SetMetricsDto,
  ) {
    this.healthService.setMetrics(partnerId, body)
    return { success: true, message: 'Metrics updated' }
  }

  // ─── Settlement ──────────────────────────────────────────────

  /**
   * 创建分账单
   */
  @Post('settlement/create')
  createSettlement(@Body() body: CreateSettlementDto) {
    try {
      const settlement = this.settlementService.createSettlement(
        body.orderId,
        body.type,
        body.totalAmount,
        body.participants,
      )
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 审批分账
   */
  @Post('settlement/:settlementId/approve')
  approveSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.approveSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 执行分账
   */
  @Post('settlement/:settlementId/execute')
  executeSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.executeSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 驳回分账（pending → cancelled）
   */
  @Post('settlement/:settlementId/reject')
  rejectSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.rejectSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 取消分账（approved → cancelled）
   */
  @Post('settlement/:settlementId/cancel')
  cancelSettlement(@Param('settlementId') settlementId: string) {
    try {
      const settlement = this.settlementService.cancelSettlement(settlementId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 查询分账
   */
  @Get('settlement/:settlementId')
  querySettlement(@Param('settlementId') settlementId: string) {
    const settlement = this.settlementService.querySettlement(settlementId)
    if (!settlement) {
      return { success: false, message: `Settlement ${settlementId} not found` }
    }
    return { success: true, data: settlement }
  }

  /**
   * 获取伙伴分账历史
   */
  @Get('settlement/history/:partnerId')
  getSettlementHistory(@Param('partnerId') partnerId: string) {
    const history = this.settlementService.getSettlementHistory(partnerId)
    return { success: true, data: history, total: history.length }
  }

  // ─── Unlinked Orders ─────────────────────────────────────────

  /**
   * 扫描未关联订单
   */
  @Post('order/scan-unlinked')
  scanUnlinkedOrders(@Body() body: ScanUnlinkedOrdersDto) {
    const orders = this.orderDetector.scanUnlinkedOrders(
      body.storeId,
      new Date(body.since),
    )
    return {
      success: true,
      data: {
        storeId: body.storeId,
        orders: orders.map((o) => ({
          orderId: o.orderId,
          amount: o.amount,
          createdAt: o.createdAt.toISOString(),
          linkStatus: o.linkStatus,
        })),
        total: orders.length,
      },
    }
  }

  /**
   * 手动关联订单到伙伴
   */
  @Post('order/:orderId/link')
  linkOrder(
    @Param('orderId') orderId: string,
    @Body() body: LinkOrderDto,
  ) {
    try {
      const result = this.orderDetector.manualLink(orderId, body.partnerId)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 自动关联订单
   */
  @Post('order/:orderId/auto-link')
  autoLinkOrder(@Param('orderId') orderId: string) {
    const result = this.orderDetector.autoLinkByRule(orderId)
    return { success: true, data: result }
  }

  // ─── Anomaly Detection ───────────────────────────────────────

  /**
   * 检测异常模式
   */
  @Post('anomaly/detect/:partnerId')
  detectAnomaly(@Param('partnerId') partnerId: string) {
    const anomalies = this.anomalyService.detectUnusualPattern(partnerId)
    return { success: true, data: { partnerId, anomalies, count: anomalies.length } }
  }

  /**
   * 获取异常报告
   */
  @Get('anomaly/report/:partnerId')
  getAnomalyReport(@Param('partnerId') partnerId: string) {
    const report = this.anomalyService.getAnomalyReport(partnerId)
    return { success: true, data: report }
  }

  /**
   * 标记可疑分账
   */
  @Post('settlement/:settlementId/flag-suspicious')
  flagSuspicious(@Param('settlementId') settlementId: string) {
    const result = this.anomalyService.flagSuspiciousSettlement(settlementId)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 分级联盟 (BS-0218~BS-0219)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 获取所有等级分成配置
   */
  @Get('tier/configs')
  getTierConfigs() {
    const configs = this.tierService.getAllTierConfigs()
    return { success: true, data: configs }
  }

  /**
   * 获取指定等级分成配置
   */
  @Get('tier/config/:grade')
  getTierConfig(@Param('grade') grade: string) {
    const config = this.tierService.getTierConfig(grade as any)
    return { success: true, data: config }
  }

  /**
   * 更新等级分成配置
   */
  @Put('tier/config')
  setTierConfig(@Body() body: SetTierConfigDto) {
    const updated = this.tierService.setTierConfig(body.grade, {
      revenueShareRatio: body.revenueShareRatio,
      couponCommissionRatio: body.couponCommissionRatio,
      minSettlementThreshold: body.minSettlementThreshold,
    })
    return { success: true, data: updated }
  }

  /**
   * 计算等级分成金额
   */
  @Post('tier/calculate-share')
  calculateTierShare(@Body() body: { grade: string; orderAmount: number }) {
    const share = this.tierService.calculateRevenueShare(body.grade as any, body.orderAmount)
    return { success: true, data: { grade: body.grade, orderAmount: body.orderAmount, shareAmount: share } }
  }

  /**
   * 获取等级变更历史
   */
  @Get('tier/change-history/:partnerId')
  getGradeChangeHistory(@Param('partnerId') partnerId: string) {
    const history = this.tierService.getGradeChangeHistory(partnerId)
    return { success: true, data: history }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 联盟券互推 (BS-0220~BS-0221)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 发放跨品牌优惠券
   */
  @Post('coupon/issue')
  issueCoupon(@Body() body: IssueCouponDto) {
    try {
      const coupon = this.couponService.issueCoupon(body)
      return { success: true, data: coupon }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 核销优惠券
   */
  @Post('coupon/redeem')
  redeemCoupon(@Body() body: RedeemCouponDto) {
    try {
      const redemption = this.couponService.redeemCoupon(
        body.couponId, body.partnerId, body.partnerName,
        body.orderId, body.memberId, body.orderAmount,
      )
      return { success: true, data: redemption }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 取消优惠券
   */
  @Post('coupon/:couponId/cancel')
  cancelCoupon(@Param('couponId') couponId: string) {
    try {
      const coupon = this.couponService.cancelCoupon(couponId)
      return { success: true, data: coupon }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 获取优惠券详情
   */
  @Get('coupon/:couponId')
  getCoupon(@Param('couponId') couponId: string) {
    const coupon = this.couponService.getCoupon(couponId)
    if (!coupon) {
      return { success: false, message: `Coupon ${couponId} not found` }
    }
    return { success: true, data: coupon }
  }

  /**
   * 列出伙伴可核销的优惠券
   */
  @Get('coupon/redeemable/:partnerId')
  listRedeemableCoupons(@Param('partnerId') partnerId: string) {
    const coupons = this.couponService.listRedeemableCoupons(partnerId)
    return { success: true, data: coupons }
  }

  /**
   * 结算优惠券
   */
  @Post('coupon/:couponId/settle')
  settleCoupon(@Param('couponId') couponId: string) {
    try {
      const settlement = this.couponService.settleCoupon(couponId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 获取伙伴券统计
   */
  @Get('coupon/stats/:partnerId')
  getPartnerCouponStats(@Param('partnerId') partnerId: string) {
    const stats = this.couponService.getPartnerCouponStats(partnerId)
    return { success: true, data: stats }
  }

  /**
   * 获取待结算列表
   */
  @Get('coupon/pending-settlements')
  getPendingCouponSettlements() {
    const settlements = this.couponService.getPendingSettlements()
    return { success: true, data: settlements }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 数据API (BS-0222~BS-0224)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 接收数据回传
   */
  @Post('data/callback/:partnerId')
  receiveCallback(
    @Param('partnerId') partnerId: string,
    @Body() body: ReceiveCallbackDto,
  ) {
    try {
      const record = this.dataService.receiveCallback(partnerId, body.dataType as CallbackDataType, body.payload)
      return { success: true, data: record }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 查询回传记录
   */
  @Get('data/records/:partnerId')
  getCallbackRecords(
    @Param('partnerId') partnerId: string,
    @Query() query: QueryCallbackDto,
  ) {
    const records = this.dataService.getCallbackRecords(partnerId, {
      dataType: query.dataType as CallbackDataType | undefined,
      from: query.from ?? '',
      to: query.to ?? '',
    })
    return { success: true, data: records }
  }

  /**
   * 获取回传统计
   */
  @Get('data/stats/:partnerId')
  getCallbackStats(@Param('partnerId') partnerId: string) {
    const stats = this.dataService.getCallbackStats(partnerId)
    return { success: true, data: stats }
  }

  /**
   * 获取数据看板
   */
  @Get('data/dashboard/:partnerId')
  getDataDashboard(@Param('partnerId') partnerId: string) {
    const dashboard = this.dataService.getDataDashboard(partnerId)
    return { success: true, data: dashboard }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 异常审核 (BS-0225~BS-0226)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 提交异常记录
   */
  @Post('review/report-anomaly')
  reportAnomaly(@Body() body: ReportAnomalyDto) {
    try {
      const anomaly = this.reviewService.reportAnomaly(
        body.partnerId, body.partnerName,
        body.type as any, body.severity as any,
        body.involvedAmount, body.description, body.relatedId,
      )
      return { success: true, data: anomaly }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 获取待审核列表
   */
  @Get('review/pending')
  getPendingReviews() {
    const pending = this.reviewService.getPendingReviews()
    return { success: true, data: pending }
  }

  /**
   * 提交审核决定
   */
  @Post('review/submit')
  submitReview(@Body() body: SubmitReviewDto) {
    try {
      const review = this.reviewService.submitReview(
        body.anomalyId, body.decision as any,
        body.reviewer, body.note,
      )
      return { success: true, data: review }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /**
   * 获取审核历史
   */
  @Get('review/history/:anomalyId')
  getReviewHistory(@Param('anomalyId') anomalyId: string) {
    const history = this.reviewService.getReviewHistory(anomalyId)
    return { success: true, data: history }
  }

  /**
   * 获取审核统计
   */
  @Get('review/stats')
  getReviewStats() {
    const stats = this.reviewService.getReviewStats()
    return { success: true, data: stats }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 联盟看板 (BS-0227~BS-0228)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 运营概览
   */
  @Get('dashboard/overview')
  getDashboardOverview() {
    const partners = this.partnerService.listPartners({})
    const activePartners = partners.filter((p) => p.status === 'ACTIVE')
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const newThisMonth = partners.filter((p) => p.registeredAt.startsWith(currentMonth)).length
    const overview = this.dashboardService.getOverview(activePartners.length, partners.length, newThisMonth)
    return { success: true, data: overview }
  }

  /**
   * 等级分布
   */
  @Get('dashboard/grade-distribution')
  getGradeDistribution() {
    const partners = this.partnerService.listPartners({})
    const gradeCounts = new Map<string, number>()
    for (const p of partners) {
      const grade = p.currentGrade ?? 'C'
      gradeCounts.set(grade, (gradeCounts.get(grade) ?? 0) + 1)
    }
    const distribution = this.dashboardService.getGradeDistribution(gradeCounts)
    return { success: true, data: distribution }
  }

  /**
   * 月度趋势
   */
  @Get('dashboard/monthly-trend')
  getMonthlyTrend(@Query('months') months?: string) {
    const trend = this.dashboardService.getMonthlyTrend(months ? parseInt(months, 10) : 6)
    return { success: true, data: trend }
  }

  /**
   * 活动概览
   */
  @Get('dashboard/activities')
  getActivityOverview() {
    const overview = this.dashboardService.getActivityOverview()
    return { success: true, data: overview }
  }

  /**
   * 伙伴排行榜
   */
  @Get('dashboard/ranking')
  getPartnerRanking() {
    const partners = this.partnerService.listPartners({})
    const nameMap = new Map(partners.map((p) => [p.id, p.name]))
    const ranking = this.dashboardService.getPartnerRanking(nameMap)
    return { success: true, data: ranking }
  }

  /**
   * 伙伴看板
   */
  @Get('dashboard/partner/:partnerId')
  getPartnerDashboard(@Param('partnerId') partnerId: string) {
    const partner = this.partnerService.getPartner(partnerId)
    if (!partner) {
      return { success: false, message: `Partner ${partnerId} not found` }
    }
    const dashboard = this.dashboardService.getPartnerDashboard(partnerId, partner.name, partner.currentGrade ?? 'C')
    return { success: true, data: dashboard }
  }
}
