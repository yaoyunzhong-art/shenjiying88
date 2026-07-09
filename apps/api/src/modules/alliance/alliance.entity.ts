import {
  AlliancePartner,
  PartnerInfo,
  Grade,
  PartnerStatus,
  BusinessType,
  HealthFactors,
  HealthTrend,
  GradeCriteria,
  SettlementType,
  SettlementParticipant,
  AnomalyRecord,
  AnomalyReport,
} from './alliance-grade.service'

export type {
  AlliancePartner,
  PartnerInfo,
  Grade,
  PartnerStatus,
  BusinessType,
  HealthFactors,
  HealthTrend,
  GradeCriteria,
  SettlementType,
  SettlementParticipant,
  AnomalyRecord,
  AnomalyReport,
}

/**
 * 联盟伙伴注册请求
 */
export interface AllianceRegisterRequest {
  name: string
  businessType: BusinessType
  contact: string
  address: string
}

/**
 * 联盟伙伴更新请求
 */
export interface AllianceUpdateRequest {
  name?: string
  businessType?: BusinessType
  contact?: string
  address?: string
}

/**
 * 联盟伙伴列表查询过滤
 */
export interface AllianceListFilter {
  businessType?: BusinessType
  status?: PartnerStatus
  grade?: Grade
}

/**
 * 分级配置信息
 */
export interface GradeConfig {
  grade: Grade
  minScore: number
  maxScore: number
  label: string
}

/**
 * 创建分账请求
 */
export interface SettlementCreateRequest {
  orderId: string
  type: SettlementType
  totalAmount: number
  participants: SettlementParticipant[]
}

/**
 * 异常检测报告
 */
export interface AnomalyDetectionResponse {
  partnerId: string
  report: AnomalyReport
}

/**
 * 未关联订单扫描结果
 */
export interface UnlinkedOrderScanResult {
  storeId: string
  orders: Array<{
    orderId: string
    amount: number
    createdAt: string
    linkStatus: string
  }>
  total: number
}

/**
 * 自动关联结果
 */
export interface AutoLinkResult {
  linked: boolean
  partnerId?: string
  reason?: string
}
