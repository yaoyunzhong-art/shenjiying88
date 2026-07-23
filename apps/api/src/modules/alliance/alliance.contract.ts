/**
 * 🐜 自动: [alliance] [A] contract 补全
 *
 * 联盟管理：跨模块合约类型
 * 定义 alliance 模块对外暴露的稳定合约接口，
 * 供其他模块（notification, analytics, marketing 等）消费。
 */
import type {
  AlliancePartner,
  PartnerInfo,
  Grade,
  PartnerStatus,
  BusinessType,
  GradeCriteria,
} from './alliance.entity'
import type {
  SettlementType,
  SettlementParticipant,
  AnomalyRecord,
} from './alliance-settlement.service'
import type {
  CrossBrandCoupon,
  CouponSettlement,
} from './alliance-coupon.service'
import type {
  DashboardOverview,
  GradeDistribution,
  MonthlyTrend,
  PartnerRanking,
  PartnerDashboard,
} from './alliance-dashboard.service'

/**
 * 伙伴基本信息合约
 */
export interface AlliancePartnerContract {
  id: string
  name: string
  businessType: BusinessType
  contact: string
  address: string
  grade: Grade
  status: PartnerStatus
  healthScore: number
  registeredAt: string
  updatedAt: string
}

/**
 * 分级标准合约
 */
export interface GradeCriteriaContract {
  grade: Grade
  minScore: number
  maxScore: number
  label: string
  benefits: string[]
}

/**
 * 分账信息合约
 */
export interface SettlementContract {
  id: string
  orderId: string
  type: SettlementType
  totalAmount: number
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'flagged'
  participants: SettlementParticipant[]
  createdAt: string
}

/**
 * 健康度合约
 */
export interface HealthScoreContract {
  partnerId: string
  overallScore: number
  revenueScore: number
  activityScore: number
  complaintScore: number
  trend: 'up' | 'down' | 'stable'
  lastCalculatedAt: string
}

/**
 * 异常检测合约
 */
export interface AnomalyDetectionContract {
  partnerId: string
  anomalies: AnomalyRecord[]
  riskLevel: 'low' | 'medium' | 'high'
  detectedAt: string
}

/**
 * 订单关联合约
 */
export interface OrderLinkContract {
  orderId: string
  partnerId: string | null
  linkStatus: 'unlinked' | 'manual' | 'auto' | 'confirmed'
  linkedAt: string | null
}

/**
 * 联盟注册事件合约（供 notification 模块消费）
 */
export interface AllianceRegistrationEvent {
  kind: 'alliance.registration'
  partner: AlliancePartnerContract
  timestamp: string
}

/**
 * 联盟等级变更事件合约
 */
export interface AllianceGradeChangeEvent {
  kind: 'alliance.grade.change'
  partnerId: string
  partnerName: string
  previousGrade: Grade
  newGrade: Grade
  timestamp: string
}

/**
 * 联盟分账事件合约
 */
export interface AllianceSettlementEvent {
  kind: 'alliance.settlement'
  settlementId: string
  orderId: string
  type: SettlementType
  totalAmount: number
  participants: SettlementParticipant[]
  status: 'approved' | 'executed' | 'rejected'
  timestamp: string
}

/**
 * 联盟异常告警合约
 */
export interface AllianceAnomalyAlertEvent {
  kind: 'alliance.anomaly.alert'
  partnerId: string
  partnerName: string
  riskLevel: 'low' | 'medium' | 'high'
  anomalies: AnomalyRecord[]
  timestamp: string
}

// ── WP-17B 新增合约 ───────────────────────────────────────────────────────────

/**
 * 跨品牌优惠券合约
 */
export interface AllianceCouponContract {
  couponId: string
  issuerPartnerId: string
  denomination: number
  minSpend: number
  status: 'active' | 'redeemed' | 'expired' | 'cancelled'
  validFrom: string
  validTo: string
}

/**
 * 联盟券结算合约
 */
export interface AllianceCouponSettlementContract {
  couponId: string
  issuerPayAmount: number
  redeemReceiveAmount: number
  platformCommission: number
  status: 'pending' | 'settled' | 'disputed'
}

/**
 * 联盟看板合约
 */
export interface AllianceDashboardContract {
  overview: DashboardOverview
  gradeDistribution: GradeDistribution[]
  monthlyTrend: MonthlyTrend[]
  partnerRanking: PartnerRanking[]
}

/**
 * 联盟券发放事件合约
 */
export interface AllianceCouponIssueEvent {
  kind: 'alliance.coupon.issue'
  coupon: AllianceCouponContract
  issuerPartnerId: string
  acceptedPartnerIds: string[]
  timestamp: string
}

/**
 * 联盟券核销事件合约
 */
export interface AllianceCouponRedeemEvent {
  kind: 'alliance.coupon.redeem'
  couponId: string
  partnerId: string
  orderId: string
  discountApplied: number
  timestamp: string
}

/**
 * Alliance 模块支持的跨模块事件联合类型
 */
export type AllianceEvent =
  | AllianceRegistrationEvent
  | AllianceGradeChangeEvent
  | AllianceSettlementEvent
  | AllianceAnomalyAlertEvent
  | AllianceCouponIssueEvent
  | AllianceCouponRedeemEvent
