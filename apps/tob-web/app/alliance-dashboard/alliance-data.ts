/**
 * alliance-data.ts — 异业联盟 Mock 数据与类型定义
 */

// ===================== 类型定义 =====================

export type PartnerGrade = 'S' | 'A' | 'B' | 'C';

export interface AlliancePartner {
  partnerId: string;
  partnerName: string;
  grade: PartnerGrade;
  industry: string;
  contactPerson: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  totalTransactions: number;
  totalRevenue: number;
  healthScore: number; // 0-100
  rating: number; // 1-5
  status: 'active' | 'inactive' | 'pending';
}

export interface HealthScore {
  partnerId: string;
  overall: number; // 0-100
  transactionHealth: number;
  revenueHealth: number;
  complianceHealth: number;
  lastUpdated: string;
}

export interface SettlementRecord {
  settlementId: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  ratio: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  settlementDate: string;
  remarks: string;
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyAlert {
  alertId: string;
  partnerId: string;
  partnerName: string;
  anomalyType: string;
  severity: AnomalySeverity;
  description: string;
  detectedAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export type ChannelType = 'SMS' | 'Email' | 'Push' | 'APP';

export interface ChannelReachStats {
  channel: ChannelType;
  totalSent: number;
  totalDelivered: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface SendRecord {
  recordId: string;
  channel: ChannelType;
  content: string;
  sentAt: string;
  recipientCount: number;
  deliveredCount: number;
}

// ===================== 常量 =====================

export const PARTNER_GRADE_LABELS: Record<PartnerGrade, string> = {
  S: 'S级合作伙伴',
  A: 'A级合作伙伴',
  B: 'B级合作伙伴',
  C: 'C级合作伙伴',
};

export const PARTNER_GRADE_COLORS: Record<PartnerGrade, string> = {
  S: '#f59e0b',
  A: '#3b82f6',
  B: '#22c55e',
  C: '#94a3b8',
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementRecord['status'], string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  completed: '已完成',
};

export const SETTLEMENT_STATUS_COLORS: Record<SettlementRecord['status'], string> = {
  pending: '#f59e0b',
  approved: '#3b82f6',
  rejected: '#ef4444',
  completed: '#22c55e',
};

export const ANOMALY_SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const ANOMALY_SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  SMS: '短信',
  Email: '邮件',
  Push: '推送',
  APP: 'APP消息',
};

// ===================== Mock 数据 =====================

export const MOCK_PARTNERS: AlliancePartner[] = [
  {
    partnerId: 'P001',
    partnerName: '星巴克咖啡',
    grade: 'S',
    industry: '餐饮',
    contactPerson: '张经理',
    contactPhone: '138****1234',
    contractStartDate: '2025-01-01',
    contractEndDate: '2027-12-31',
    totalTransactions: 12580,
    totalRevenue: 628900,
    healthScore: 95,
    rating: 4.8,
    status: 'active',
  },
  {
    partnerId: 'P002',
    partnerName: '万达影城',
    grade: 'S',
    industry: '娱乐',
    contactPerson: '李总监',
    contactPhone: '139****5678',
    contractStartDate: '2025-03-15',
    contractEndDate: '2027-03-14',
    totalTransactions: 8960,
    totalRevenue: 448000,
    healthScore: 92,
    rating: 4.6,
    status: 'active',
  },
  {
    partnerId: 'P003',
    partnerName: '华润超市',
    grade: 'A',
    industry: '零售',
    contactPerson: '王主管',
    contactPhone: '137****9012',
    contractStartDate: '2025-06-01',
    contractEndDate: '2027-05-31',
    totalTransactions: 15800,
    totalRevenue: 316000,
    healthScore: 88,
    rating: 4.3,
    status: 'active',
  },
  {
    partnerId: 'P004',
    partnerName: '顺丰速运',
    grade: 'A',
    industry: '物流',
    contactPerson: '赵经理',
    contactPhone: '136****3456',
    contractStartDate: '2025-02-01',
    contractEndDate: '2026-01-31',
    totalTransactions: 23400,
    totalRevenue: 234000,
    healthScore: 85,
    rating: 4.2,
    status: 'active',
  },
  {
    partnerId: 'P005',
    partnerName: '格林酒店',
    grade: 'B',
    industry: '酒店',
    contactPerson: '陈经理',
    contactPhone: '135****7890',
    contractStartDate: '2025-09-01',
    contractEndDate: '2027-08-31',
    totalTransactions: 4560,
    totalRevenue: 182400,
    healthScore: 76,
    rating: 3.9,
    status: 'active',
  },
  {
    partnerId: 'P006',
    partnerName: '乐购便利店',
    grade: 'B',
    industry: '零售',
    contactPerson: '刘店长',
    contactPhone: '134****2345',
    contractStartDate: '2025-07-01',
    contractEndDate: '2027-06-30',
    totalTransactions: 7890,
    totalRevenue: 157800,
    healthScore: 72,
    rating: 3.7,
    status: 'active',
  },
  {
    partnerId: 'P007',
    partnerName: '博途健身',
    grade: 'B',
    industry: '运动健身',
    contactPerson: '周教练',
    contactPhone: '133****6789',
    contractStartDate: '2025-10-01',
    contractEndDate: '2027-09-30',
    totalTransactions: 3450,
    totalRevenue: 103500,
    healthScore: 68,
    rating: 3.5,
    status: 'active',
  },
  {
    partnerId: 'P008',
    partnerName: '邻家洗衣',
    grade: 'C',
    industry: '生活服务',
    contactPerson: '吴老板',
    contactPhone: '132****0123',
    contractStartDate: '2025-11-01',
    contractEndDate: '2027-10-31',
    totalTransactions: 1280,
    totalRevenue: 38400,
    healthScore: 58,
    rating: 3.1,
    status: 'active',
  },
  {
    partnerId: 'P009',
    partnerName: '快捷汽车养护',
    grade: 'C',
    industry: '汽车服务',
    contactPerson: '郑老板',
    contactPhone: '131****4567',
    contractStartDate: '2025-12-01',
    contractEndDate: '2027-11-30',
    totalTransactions: 890,
    totalRevenue: 35600,
    healthScore: 52,
    rating: 2.8,
    status: 'inactive',
  },
  {
    partnerId: 'P010',
    partnerName: '鲜果汇',
    grade: 'C',
    industry: '餐饮',
    contactPerson: '冯老板娘',
    contactPhone: '130****8901',
    contractStartDate: '2026-01-01',
    contractEndDate: '2027-12-31',
    totalTransactions: 2340,
    totalRevenue: 70200,
    healthScore: 78,
    rating: 4.0,
    status: 'pending',
  },
];

export const MOCK_HEALTH_SCORES: Record<string, HealthScore> = MOCK_PARTNERS.reduce((acc, partner) => {
  acc[partner.partnerId] = {
    partnerId: partner.partnerId,
    overall: partner.healthScore,
    transactionHealth: Math.min(100, partner.healthScore + Math.floor(Math.random() * 10 - 5)),
    revenueHealth: Math.min(100, partner.healthScore + Math.floor(Math.random() * 8 - 4)),
    complianceHealth: Math.min(100, partner.healthScore + Math.floor(Math.random() * 6 - 3)),
    lastUpdated: new Date().toISOString(),
  };
  return acc;
}, {} as Record<string, HealthScore>);

export const MOCK_SETTLEMENTS: SettlementRecord[] = [
  {
    settlementId: 'ST001',
    partnerId: 'P001',
    partnerName: '星巴克咖啡',
    amount: 188670,
    ratio: 0.30,
    status: 'pending',
    settlementDate: '2026-07-01',
    remarks: '6月联盟营收分账',
  },
  {
    settlementId: 'ST002',
    partnerId: 'P002',
    partnerName: '万达影城',
    amount: 134400,
    ratio: 0.30,
    status: 'approved',
    settlementDate: '2026-07-01',
    remarks: '6月联盟营收分账',
  },
  {
    settlementId: 'ST003',
    partnerId: 'P003',
    partnerName: '华润超市',
    amount: 94800,
    ratio: 0.30,
    status: 'completed',
    settlementDate: '2026-06-28',
    remarks: '6月联盟营收分账已完成',
  },
  {
    settlementId: 'ST004',
    partnerId: 'P004',
    partnerName: '顺丰速运',
    amount: 70200,
    ratio: 0.30,
    status: 'pending',
    settlementDate: '2026-07-02',
    remarks: '6月联盟营收分账-待确认',
  },
  {
    settlementId: 'ST005',
    partnerId: 'P005',
    partnerName: '格林酒店',
    amount: 36540,
    ratio: 0.20,
    status: 'rejected',
    settlementDate: '2026-06-25',
    remarks: '分账比例调整，驳回重算',
  },
];

export const MOCK_ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    alertId: 'ALT001',
    partnerId: 'P009',
    partnerName: '快捷汽车养护',
    anomalyType: '交易异常',
    severity: 'high',
    description: '连续30天无交易记录，合作伙伴活跃度异常',
    detectedAt: '2026-07-01 08:00:00',
    status: 'open',
  },
  {
    alertId: 'ALT002',
    partnerId: 'P006',
    partnerName: '乐购便利店',
    anomalyType: '收入下滑',
    severity: 'medium',
    description: '本月收入同比下降45%，超出正常波动范围',
    detectedAt: '2026-07-02 10:30:00',
    status: 'acknowledged',
  },
  {
    alertId: 'ALT003',
    partnerId: 'P008',
    partnerName: '邻家洗衣',
    anomalyType: '合规风险',
    severity: 'low',
    description: '资质证书即将到期，请及时更新',
    detectedAt: '2026-07-03 09:15:00',
    status: 'open',
  },
];

export const MOCK_CHANNEL_STATS: ChannelReachStats[] = [
  { channel: 'SMS', totalSent: 50000, totalDelivered: 48500, deliveryRate: 0.97, openRate: 0.68, clickRate: 0.12 },
  { channel: 'Email', totalSent: 30000, totalDelivered: 27000, deliveryRate: 0.90, openRate: 0.35, clickRate: 0.08 },
  { channel: 'Push', totalSent: 80000, totalDelivered: 76000, deliveryRate: 0.95, openRate: 0.52, clickRate: 0.15 },
  { channel: 'APP', totalSent: 60000, totalDelivered: 58800, deliveryRate: 0.98, openRate: 0.72, clickRate: 0.22 },
];

export const MOCK_SEND_RECORDS: SendRecord[] = [
  { recordId: 'SR001', channel: 'SMS', content: '【异业联盟】星巴克新品上市，联盟用户专享8折优惠', sentAt: '2026-07-01 10:00:00', recipientCount: 5000, deliveredCount: 4850 },
  { recordId: 'SR002', channel: 'Email', content: '【异业联盟】万达影城暑期档会员专享观影券', sentAt: '2026-07-01 14:30:00', recipientCount: 3000, deliveredCount: 2700 },
  { recordId: 'SR003', channel: 'Push', content: '【异业联盟】华润超市周末生鲜满100减20', sentAt: '2026-07-02 09:00:00', recipientCount: 8000, deliveredCount: 7600 },
  { recordId: 'SR004', channel: 'APP', content: '【异业联盟】顺丰速运寄件立减10元优惠券已到账', sentAt: '2026-07-02 11:00:00', recipientCount: 6000, deliveredCount: 5880 },
];

// ===================== 辅助函数 =====================

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function getGradeLabel(grade: PartnerGrade): string {
  return PARTNER_GRADE_LABELS[grade];
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  if (score >= 40) return '一般';
  return '较差';
}