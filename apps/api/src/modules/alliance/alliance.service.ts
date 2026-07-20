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
}
