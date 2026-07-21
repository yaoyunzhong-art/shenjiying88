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
import {
  RegisterPartnerDto,
  UpdatePartnerDto,
  ListPartnerQueryDto,
  AssignGradeDto,
  CreateSettlementDto,
  SetMetricsDto,
  ScanUnlinkedOrdersDto,
  LinkOrderDto,
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
}
