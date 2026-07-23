/**
 * alliance.service.ts — 异业联盟主 Service（Facade）
 *
 * 统一封装 6 个子服务：
 *   - AlliancePartner         伙伴管理
 *   - PartnerGradingService   分级评定
 *   - HealthScoreService      健康度评分
 *   - CrossMerchantSettlementService  跨商户分账
 *   - UnlinkedOrderDetector   未关联订单扫描
 *   - AnomalyDetectionService 异常行为检测
 *
 * 对外暴露简洁接口，内部委托给对应的子服务。
 */

import { Injectable, Logger, Optional } from '@nestjs/common'
import { AuditService } from '../audit/audit.service'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'
import { AllianceTierService } from './alliance-tier.service'
import { AllianceCouponService, type CouponIssueRequest, type PartnerCouponStats } from './alliance-coupon.service'
import { AllianceDataService, type DataCallbackRecord, type CallbackDataType, type DataQuery, type DataDashboard, type CallbackStats } from './alliance-data.service'
import { AllianceReviewService, type AnomalyTransaction, type ReviewRecord, type ReviewStatus } from './alliance-review.service'
import { AllianceDashboardService, type DashboardOverview, type GradeDistribution, type MonthlyTrend, type ActivityOverview, type PartnerRanking, type PartnerDashboard } from './alliance-dashboard.service'
import type {
  AlliancePartner as AlliancePartnerType,
  PartnerInfo,
  Grade,
  PartnerStatus,
  BusinessType,
  HealthFactors,
  HealthTrend,
  GradeCriteria,
} from './alliance.entity'
import type { SettlementParticipantDto } from './alliance.dto'

// ── 统一返回类型 ───────────────────────────────────────────────

export interface AllianceResult<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
}

/**
 * 联盟伙伴注册请求
 */
export interface RegisterRequest {
  name: string
  businessType: BusinessType
  contact: string
  address: string
}

/**
 * 伙伴更新请求
 */
export interface UpdateRequest {
  name?: string
  businessType?: BusinessType
  contact?: string
  address?: string
}

/**
 * 伙伴查询过滤
 */
export interface ListFilter {
  businessType?: BusinessType
  status?: PartnerStatus
  grade?: Grade
}

/**
 * 分账创建请求
 */
export interface SettlementCreateRequest {
  orderId: string
  type: 'ratio' | 'fixed'
  totalAmount: number
  participants: SettlementParticipantDto[]
}

/**
 * 健康度指标更新
 */
export interface HealthMetricsInput {
  revenue?: number
  orderCount?: number
  complaintCount?: number
  activeDays?: number
}

// ── Service ────────────────────────────────────────────────────

@Injectable()
export class AllianceService {
  private readonly logger = new Logger(AllianceService.name)

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
    @Optional() private readonly auditService?: AuditService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 1. 伙伴管理
  // ═══════════════════════════════════════════════════════════════

  /** 注册新伙伴 */
  registerPartner(req: RegisterRequest): AllianceResult<AlliancePartnerType> {
    try {
      const partner = this.partnerService.register(req)
      // 审计日志: 伙伴注册
      this.auditService?.log({
        eventType: 'admin.role_create',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'alliance_partner',
        resourceId: partner.id,
        riskLevel: 'low',
        metadata: { partnerName: partner.name, businessType: partner.businessType },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: partner }
    } catch (err: any) {
      this.logger.error(`registerPartner failed: ${err.message}`, err.stack)
      return { success: false, message: err.message }
    }
  }

  /** 更新伙伴信息 */
  updatePartner(partnerId: string, req: UpdateRequest): AllianceResult<AlliancePartnerType> {
    try {
      const partner = this.partnerService.updatePartner(partnerId, req)
      // 审计日志: 伙伴信息更新
      this.auditService?.log({
        eventType: 'admin.config_change',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'alliance_partner',
        resourceId: partnerId,
        riskLevel: 'low',
        metadata: { updates: req },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: partner }
    } catch (err: any) {
      this.logger.error(`updatePartner failed: ${err.message}`, err.stack)
      return { success: false, message: err.message }
    }
  }

  /** 停用伙伴（入驻退出机制核心入口）*/
  deactivatePartner(partnerId: string, reason?: string): AllianceResult<AlliancePartnerType> {
    try {
      const partner = this.partnerService.deactivatePartner(partnerId, reason)
      this.auditService?.log({
        eventType: 'admin.config_change',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'alliance_partner',
        resourceId: partnerId,
        riskLevel: 'medium',
        metadata: { action: 'deactivate', reason },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: partner, message: reason ?? 'Partner deactivated' }
    } catch (err: any) {
      this.logger.error(`deactivatePartner failed: ${err.message}`, err.stack)
      return { success: false, message: err.message }
    }
  }

  /** 重新启用伙伴 */
  reactivatePartner(partnerId: string): AllianceResult<AlliancePartnerType> {
    try {
      const partner = this.partnerService.reactivatePartner(partnerId)
      this.auditService?.log({
        eventType: 'admin.config_change',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'alliance_partner',
        resourceId: partnerId,
        riskLevel: 'medium',
        metadata: { action: 'reactivate' },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: partner }
    } catch (err: any) {
      this.logger.error(`reactivatePartner failed: ${err.message}`, err.stack)
      return { success: false, message: err.message }
    }
  }

  /** 获取单个伙伴 */
  getPartner(partnerId: string): AllianceResult<AlliancePartnerType> {
    const partner = this.partnerService.getPartner(partnerId)
    if (!partner) {
      return { success: false, message: `Partner ${partnerId} not found` }
    }
    return { success: true, data: partner }
  }

  /** 列伙伴（支持过滤） */
  listPartners(filter?: ListFilter): AllianceResult<AlliancePartnerType[]> {
    const partners = this.partnerService.listPartners(filter ?? {})
    return { success: true, data: partners }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 分级评定
  // ═══════════════════════════════════════════════════════════════

  /** 获取分级标准 */
  getGradeCriteria(): AllianceResult<GradeCriteria[]> {
    const criteria = this.gradingService.getGradeCriteria()
    return { success: true, data: criteria }
  }

  /** 计算等级 */
  calculateGrade(partnerId: string): AllianceResult<{ partnerId: string; grade: Grade }> {
    const grade = this.gradingService.calculateGrade(partnerId)
    if (!grade) {
      return { success: false, message: `Partner ${partnerId} not found for grading` }
    }
    return { success: true, data: { partnerId, grade } }
  }

  /** 手动指定等级 */
  assignGrade(partnerId: string, grade: Grade): AllianceResult<void> {
    this.gradingService.assignGrade(partnerId, grade)
    // 审计日志: 手动调整等级
    this.auditService?.log({
      eventType: 'admin.config_change',
      actorId: 'system',
      actorType: 'admin',
      resourceType: 'alliance_grade',
      resourceId: partnerId,
      riskLevel: 'medium',
      metadata: { grade },
    }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
    return { success: true, message: `Grade ${grade} assigned to ${partnerId}` }
  }

  /** 获取当前等级 */
  getGrade(partnerId: string): AllianceResult<{ partnerId: string; grade: Grade | null }> {
    const grade = this.gradingService.getGrade(partnerId)
    return { success: true, data: { partnerId, grade } }
  }

  /** 自动升级检测 */
  autoUpgrade(partnerId: string): AllianceResult<{ partnerId: string; upgraded: boolean }> {
    const upgraded = this.gradingService.autoUpgrade(partnerId)
    return { success: true, data: { partnerId, upgraded } }
  }

  /** 自动降级检测 */
  autoDowngrade(partnerId: string): AllianceResult<{ partnerId: string; downgraded: boolean }> {
    const downgraded = this.gradingService.autoDowngrade(partnerId)
    return { success: true, data: { partnerId, downgraded } }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. 健康度评分
  // ═══════════════════════════════════════════════════════════════

  /** 计算健康度 */
  calculateHealth(partnerId: string): AllianceResult<{ partnerId: string; healthScore: number }> {
    const score = this.healthService.calculateHealthScore(partnerId)
    return { success: true, data: { partnerId, healthScore: score } }
  }

  /** 获取健康度因素 */
  getHealthFactors(partnerId: string): AllianceResult<HealthFactors> {
    const factors = this.healthService.getHealthFactors(partnerId)
    return { success: true, data: factors }
  }

  /** 获取健康度趋势 */
  getHealthTrend(partnerId: string, days: number = 30): AllianceResult<HealthTrend[]> {
    const trend = this.healthService.getHealthTrend(partnerId, days)
    return { success: true, data: trend }
  }

  /** 设置指标（测试辅助） */
  setMetrics(partnerId: string, metrics: HealthMetricsInput): AllianceResult<void> {
    this.healthService.setMetrics(partnerId, metrics as any)
    return { success: true, message: 'Metrics updated' }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. 分账管理
  // ═══════════════════════════════════════════════════════════════

  /** 创建分账单 */
  createSettlement(req: SettlementCreateRequest): AllianceResult<any> {
    try {
      const settlement = this.settlementService.createSettlement(
        req.orderId,
        req.type as any,
        req.totalAmount,
        req.participants.map((p) => ({
          partnerId: p.partnerId,
          partnerName: p.partnerName,
          ratio: p.ratio,
          fixedAmount: p.fixedAmount,
        })),
      )
      // 审计日志: 分账创建
      this.auditService?.log({
        eventType: 'settlement.created',
        actorId: 'system',
        actorType: 'system',
        resourceType: 'settlement',
        resourceId: settlement.settlementId,
        riskLevel: 'low',
        settlementId: settlement.settlementId,
        settlementAmount: req.totalAmount,
        metadata: { orderId: req.orderId, type: req.type, participantCount: req.participants.length },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: settlement }
    } catch (err: any) {
      this.logger.error(`createSettlement failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 审批分账 */
  approveSettlement(settlementId: string): AllianceResult<any> {
    try {
      const settlement = this.settlementService.approveSettlement(settlementId)
      // 审计日志: 分账审批
      this.auditService?.log({
        eventType: 'settlement.approved',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'settlement',
        resourceId: settlementId,
        riskLevel: 'medium',
        settlementId,
        settlementAmount: settlement.totalAmount,
        metadata: { settlementId, orderId: settlement.orderId },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: settlement }
    } catch (err: any) {
      this.logger.error(`approveSettlement failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 驳回分账 */
  rejectSettlement(settlementId: string): AllianceResult<any> {
    try {
      const settlement = this.settlementService.rejectSettlement(settlementId)
      this.auditService?.log({
        eventType: 'settlement.rejected',
        actorId: 'system',
        actorType: 'admin',
        resourceType: 'settlement',
        resourceId: settlementId,
        riskLevel: 'medium',
        settlementId,
        metadata: { settlementId },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: settlement }
    } catch (err: any) {
      this.logger.error(`rejectSettlement failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 取消分账（审批后撤） */
  cancelSettlement(settlementId: string): AllianceResult<any> {
    try {
      const settlement = this.settlementService.cancelSettlement(settlementId)
      this.auditService?.log({
        eventType: 'settlement.rejected',
        actorId: 'system',
        actorType: 'system',
        resourceType: 'settlement',
        resourceId: settlementId,
        riskLevel: 'medium',
        settlementId,
        metadata: { settlementId, action: 'cancel_after_approval' },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: settlement }
    } catch (err: any) {
      this.logger.error(`cancelSettlement failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 执行分账 */
  executeSettlement(settlementId: string): AllianceResult<any> {
    try {
      const settlement = this.settlementService.executeSettlement(settlementId)
      // 审计日志: 分账执行
      this.auditService?.log({
        eventType: 'settlement.paid',
        actorId: 'system',
        actorType: 'system',
        resourceType: 'settlement',
        resourceId: settlementId,
        riskLevel: 'medium',
        settlementId,
        settlementAmount: settlement.totalAmount,
        metadata: { settlementId, orderId: settlement.orderId, participantCount: settlement.participants?.length },
      }).catch((e: Error) => this.logger.warn(`Audit log failed: ${e.message}`))
      return { success: true, data: settlement }
    } catch (err: any) {
      this.logger.error(`executeSettlement failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 查询分账 */
  querySettlement(settlementId: string): AllianceResult<any> {
    const settlement = this.settlementService.querySettlement(settlementId)
    if (!settlement) {
      return { success: false, message: `Settlement ${settlementId} not found` }
    }
    return { success: true, data: settlement }
  }

  /** 获取伙伴分账历史 */
  getSettlementHistory(partnerId: string): AllianceResult<{ items: any[]; total: number }> {
    const history = this.settlementService.getSettlementHistory(partnerId)
    return { success: true, data: { items: history, total: history.length } }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. 未关联订单
  // ═══════════════════════════════════════════════════════════════

  /** 扫描未关联订单 */
  scanUnlinkedOrders(storeId: string, since: Date): AllianceResult<{
    storeId: string
    orders: Array<{ orderId: string; amount: number; createdAt: string; linkStatus: string }>
    total: number
  }> {
    const orders = this.orderDetector.scanUnlinkedOrders(storeId, since)
    return {
      success: true,
      data: {
        storeId,
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

  /** 手动关联订单 */
  linkOrder(orderId: string, partnerId: string): AllianceResult<any> {
    try {
      const result = this.orderDetector.manualLink(orderId, partnerId)
      return { success: true, data: result }
    } catch (err: any) {
      this.logger.error(`linkOrder failed: ${err.message}`, err.stack)
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 自动关联订单 */
  autoLinkOrder(orderId: string): AllianceResult<any> {
    const result = this.orderDetector.autoLinkByRule(orderId)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. 异常检测
  // ═══════════════════════════════════════════════════════════════

  /** 检测异常模式 */
  detectAnomaly(partnerId: string): AllianceResult<{ partnerId: string; anomalies: any[]; count: number }> {
    const anomalies = this.anomalyService.detectUnusualPattern(partnerId)
    return { success: true, data: { partnerId, anomalies, count: anomalies.length } }
  }

  /** 获取异常报告 */
  getAnomalyReport(partnerId: string): AllianceResult<any> {
    const report = this.anomalyService.getAnomalyReport(partnerId)
    return { success: true, data: report }
  }

  /** 标记可疑分账 */
  flagSuspiciousSettlement(settlementId: string): AllianceResult<any> {
    const result = this.anomalyService.flagSuspiciousSettlement(settlementId)
    return { success: true, data: result }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 7. 分级联盟 (BS-0218~BS-0219)
  // ═══════════════════════════════════════════════════════════════

  /** 获取等级分成配置 */
  getTierConfig(grade: Grade): AllianceResult<any> {
    const config = this.tierService.getTierConfig(grade)
    return { success: true, data: config }
  }

  /** 获取所有等级配置 */
  getAllTierConfigs(): AllianceResult<any> {
    const configs = this.tierService.getAllTierConfigs()
    return { success: true, data: configs }
  }

  /** 更新等级配置 */
  setTierConfig(grade: Grade, config: any): AllianceResult<any> {
    const updated = this.tierService.setTierConfig(grade, config)
    return { success: true, data: updated }
  }

  /** 计算等级分成金额 */
  calculateRevenueShare(grade: Grade, orderAmount: number): AllianceResult<number> {
    const share = this.tierService.calculateRevenueShare(grade, orderAmount)
    return { success: true, data: share }
  }

  /** 获取等级变更历史 */
  getGradeChangeHistory(partnerId: string): AllianceResult<any> {
    const history = this.tierService.getGradeChangeHistory(partnerId)
    return { success: true, data: history }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 8. 联盟券互推 (BS-0220~BS-0221)
  // ═══════════════════════════════════════════════════════════════

  /** 发放跨品牌优惠券 */
  issueCoupon(req: CouponIssueRequest): AllianceResult<any> {
    try {
      const coupon = this.couponService.issueCoupon(req)
      return { success: true, data: coupon }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 核销优惠券 */
  redeemCoupon(couponId: string, partnerId: string, partnerName: string, orderId: string, memberId: string, orderAmount: number): AllianceResult<any> {
    try {
      const redemption = this.couponService.redeemCoupon(couponId, partnerId, partnerName, orderId, memberId, orderAmount)
      return { success: true, data: redemption }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 取消优惠券 */
  cancelCoupon(couponId: string): AllianceResult<any> {
    try {
      const coupon = this.couponService.cancelCoupon(couponId)
      return { success: true, data: coupon }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 获取优惠券 */
  getCoupon(couponId: string): AllianceResult<any> {
    const coupon = this.couponService.getCoupon(couponId)
    if (!coupon) return { success: false, message: `Coupon ${couponId} not found` }
    return { success: true, data: coupon }
  }

  /** 列出伙伴可核销优惠券 */
  listRedeemableCoupons(partnerId: string): AllianceResult<any> {
    const coupons = this.couponService.listRedeemableCoupons(partnerId)
    return { success: true, data: coupons }
  }

  /** 优惠券结算 */
  settleCoupon(couponId: string): AllianceResult<any> {
    try {
      const settlement = this.couponService.settleCoupon(couponId)
      return { success: true, data: settlement }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 获取伙伴券统计 */
  getPartnerCouponStats(partnerId: string): AllianceResult<PartnerCouponStats> {
    const stats = this.couponService.getPartnerCouponStats(partnerId)
    return { success: true, data: stats }
  }

  /** 获取待结算列表 */
  getPendingCouponSettlements(): AllianceResult<any> {
    const settlements = this.couponService.getPendingSettlements()
    return { success: true, data: settlements }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 9. 数据API (BS-0222~BS-0224)
  // ═══════════════════════════════════════════════════════════════

  /** 接收数据回传 */
  receiveCallback(partnerId: string, dataType: CallbackDataType, payload: string): AllianceResult<DataCallbackRecord> {
    try {
      const record = this.dataService.receiveCallback(partnerId, dataType, payload)
      return { success: true, data: record }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 查询回传记录 */
  getCallbackRecords(partnerId: string, query?: DataQuery): AllianceResult<DataCallbackRecord[]> {
    const records = this.dataService.getCallbackRecords(partnerId, query)
    return { success: true, data: records }
  }

  /** 获取回传统计 */
  getCallbackStats(partnerId: string): AllianceResult<CallbackStats> {
    const stats = this.dataService.getCallbackStats(partnerId)
    return { success: true, data: stats }
  }

  /** 获取数据看板 */
  getDataDashboard(partnerId: string): AllianceResult<DataDashboard> {
    const dashboard = this.dataService.getDataDashboard(partnerId)
    return { success: true, data: dashboard }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 10. 异常审核 (BS-0225~BS-0226)
  // ═══════════════════════════════════════════════════════════════

  /** 提交异常记录 */
  reportAnomaly(partnerId: string, partnerName: string, type: string, severity: string, amount: number, description: string, relatedId?: string): AllianceResult<AnomalyTransaction> {
    try {
      const anomaly = this.reviewService.reportAnomaly(partnerId, partnerName, type as any, severity as any, amount, description, relatedId)
      return { success: true, data: anomaly }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 获取待审核列表 */
  getPendingReviews(): AllianceResult<AnomalyTransaction[]> {
    const pending = this.reviewService.getPendingReviews()
    return { success: true, data: pending }
  }

  /** 提交审核 */
  submitReview(anomalyId: string, decision: ReviewStatus, reviewer: string, note: string): AllianceResult<ReviewRecord> {
    try {
      const review = this.reviewService.submitReview(anomalyId, decision, reviewer, note)
      return { success: true, data: review }
    } catch (err: any) {
      return { success: false, message: err.message, code: err.code }
    }
  }

  /** 获取审核历史 */
  getReviewHistory(anomalyId: string): AllianceResult<ReviewRecord[]> {
    const history = this.reviewService.getReviewHistory(anomalyId)
    return { success: true, data: history }
  }

  /** 获取审核统计 */
  getReviewStats(): AllianceResult<any> {
    const stats = this.reviewService.getReviewStats()
    return { success: true, data: stats }
  }

  // ═══════════════════════════════════════════════════════════════
  // WP-17B: 11. 联盟看板 (BS-0227~BS-0228)
  // ═══════════════════════════════════════════════════════════════

  /** 获取运营概览 */
  getDashboardOverview(): AllianceResult<DashboardOverview> {
    const partners = this.partnerService.listPartners({})
    const activePartners = partners.filter((p) => p.status === 'ACTIVE')
    const activeCount = this.partnerService.listPartners({ status: 'ACTIVE' }).length
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const newThisMonth = partners.filter((p) => p.registeredAt.startsWith(currentMonth)).length
    const overview = this.dashboardService.getOverview(activeCount, partners.length, newThisMonth)
    return { success: true, data: overview }
  }

  /** 获取等级分布 */
  getGradeDistribution(): AllianceResult<GradeDistribution[]> {
    const partners = this.partnerService.listPartners({})
    const gradeCounts = new Map<string, number>()
    for (const p of partners) {
      const grade = p.currentGrade ?? 'C'
      gradeCounts.set(grade, (gradeCounts.get(grade) ?? 0) + 1)
    }
    const distribution = this.dashboardService.getGradeDistribution(gradeCounts)
    return { success: true, data: distribution }
  }

  /** 获取月度趋势 */
  getMonthlyTrend(months?: number): AllianceResult<MonthlyTrend[]> {
    const trend = this.dashboardService.getMonthlyTrend(months)
    return { success: true, data: trend }
  }

  /** 获取活动概览 */
  getActivityOverview(): AllianceResult<ActivityOverview> {
    const overview = this.dashboardService.getActivityOverview()
    return { success: true, data: overview }
  }

  /** 获取伙伴排行榜 */
  getPartnerRanking(): AllianceResult<PartnerRanking[]> {
    const partners = this.partnerService.listPartners({})
    const nameMap = new Map(partners.map((p) => [p.id, p.name]))
    const ranking = this.dashboardService.getPartnerRanking(nameMap)
    return { success: true, data: ranking }
  }

  /** 获取伙伴看板 */
  getPartnerDashboard(partnerId: string): AllianceResult<PartnerDashboard> {
    const partner = this.partnerService.getPartner(partnerId)
    if (!partner) {
      return { success: false, message: `Partner ${partnerId} not found` }
    }
    const dashboard = this.dashboardService.getPartnerDashboard(partnerId, partner.name, partner.currentGrade ?? 'C')
    return { success: true, data: dashboard }
  }
}
