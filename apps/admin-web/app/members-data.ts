// ---- 会员管理数据类型与 Mock 数据 ----

export interface MemberItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  tier: MemberTier;
  status: MemberStatus;
  points: number;
  totalSpent: number;
  storeName: string;
  marketCode: string;
  registeredAt: string;
  lastVisitAt: string;
  visitCount: number;
  avgOrderValue: number;
  tags: string[];
}

export interface MemberRecommendedAction {
  code: string;
  label: string;
  reason: string;
  channel: 'coupon' | 'crm-task' | 'wechat' | 'app-push';
  priority: 'high' | 'medium' | 'low';
}

export interface MemberOperationsTask {
  taskId: string;
  actionCode: string;
  title: string;
  reason: string;
  channel: 'coupon' | 'crm-task' | 'wechat' | 'app-push';
  priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'dispatched' | 'completed';
  executionLane: 'campaign-execution' | 'member-crm' | 'promo-conversion';
  source: 'payment-success' | 'manual-refresh';
  sourceOrderId?: string;
  sourcePaymentId?: string;
  executionSummary?: string;
  executionTargetId?: string;
  executedAt?: string;
  createdAt: string;
  scheduledAt: string;
}

export interface MemberOperationsReceipt {
  executionId: string;
  taskId: string;
  actionCode: string;
  targetType: 'coupon-offer' | 'crm-follow-up';
  targetId: string;
  status: 'completed';
  summary: string;
  payload: Record<string, unknown>;
  runtimeReceiptCode?: string;
  runtimeState?: 'blocked' | 'challenge-issued' | 'submitted' | 'callback-recorded' | 'replay-scheduled';
  runtimeReplayable?: boolean;
  executedAt: string;
}

export interface MemberDetail extends MemberItem {
  apiLevel?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  apiStatus?: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'BLACKLISTED';
  email: string;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  referralCode: string;
  referredBy: string | null;
  notes: string;
  coupons: number;
  favoriteCategories: string[];
  lastOrderAt: string;
  lifecycleStage: MemberLifecycle;
  operationsSegments?: string[];
  recommendedActions?: MemberRecommendedAction[];
  automationTriggers?: string[];
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentChannel?: string;
  operationsTasks?: MemberOperationsTask[];
  operationsReceipts?: MemberOperationsReceipt[];
  mutationHistory?: MemberMutationHistoryItem[];
}

export interface MemberMutationHistoryItem {
  historyId: string;
  action:
    | 'profile-updated'
    | 'status-updated'
    | 'level-updated'
    | 'points-awarded'
    | 'points-rolled-back'
    | 'payment-activity-recorded'
    | 'approval.approved'
    | 'approval.rejected'
    | 'approval.cancelled'
    | 'approval.executed'
    | 'approval.execution-failed'
    | 'approval.resubmitted'
    | 'approval.superseded';
  summary: string;
  sourceChannel: string;
  operatorId: string;
  payload?: Record<string, unknown>;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  approvalTicket?: string;
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
  approvalSummary?: string;
  approvalOperation?: string;
  approvalDecisionBy?: string;
  approvalDecisionAt?: string;
  approvalExecutionStatus?: string;
  approvalExecutionSummary?: string;
  createdAt: string;
}

export function isMemberApprovalHistoryItem(
  action: MemberMutationHistoryItem['action']
): boolean {
  return action.startsWith('approval.');
}

export type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
export type MemberStatus = 'active' | 'frozen' | 'dormant' | 'cancelled';
export type MemberLifecycle = 'new' | 'growing' | 'loyal' | 'declining' | 'lost';
export type MemberTierVariant = 'success' | 'warning' | 'neutral' | 'danger';
export type MemberStatusVariant = 'success' | 'warning' | 'danger' | 'neutral';
export type MemberLifecycleVariant = 'success' | 'warning' | 'danger' | 'neutral';

// ---- 会员卡数据类型 ----

export interface MemberCard {
  id: string;
  memberId: string;
  memberName: string;
  cardNumber: string;
  cardType: 'physical' | 'virtual' | 'digital';
  status: 'active' | 'frozen' | 'expired' | 'cancelled';
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  balance: number;
  pointsMultiplier: number;
  designatedStore: string | null;
  linkedWechat: boolean;
  notes: string;
}

export const MEMBER_CARD_TYPE_MAP: Record<MemberCard['cardType'], { label: string; variant: string }> = {
  physical: { label: '实体卡', variant: 'success' },
  virtual: { label: '虚拟卡', variant: 'info' },
  digital: { label: '数字卡', variant: 'warning' },
};

export const MEMBER_CARD_STATUS_MAP: Record<MemberCard['status'], { label: string; variant: string }> = {
  active: { label: '正常', variant: 'success' },
  frozen: { label: '已冻结', variant: 'warning' },
  expired: { label: '已过期', variant: 'danger' },
  cancelled: { label: '已注销', variant: 'neutral' },
};

export const MOCK_MEMBER_CARDS: MemberCard[] = [
  { id: 'mc-001', memberId: 'm001', memberName: '张伟', cardNumber: 'VIP-20260001', cardType: 'physical', status: 'active', issuedAt: '2026-01-15', activatedAt: '2026-01-16', expiresAt: '2028-01-15', balance: 58000, pointsMultiplier: 2, designatedStore: '朝阳大悦城旗舰店', linkedWechat: true, notes: 'VIP实体卡' },
  { id: 'mc-002', memberId: 'm002', memberName: '李娜', cardNumber: 'VIP-20260002', cardType: 'virtual', status: 'active', issuedAt: '2026-02-01', activatedAt: '2026-02-01', expiresAt: '2027-02-01', balance: 32000, pointsMultiplier: 1.5, designatedStore: null, linkedWechat: true, notes: '' },
  { id: 'mc-003', memberId: 'm004', memberName: '赵敏', cardNumber: 'VIP-20260003', cardType: 'digital', status: 'active', issuedAt: '2024-11-20', activatedAt: '2024-11-20', expiresAt: null, balance: 120000, pointsMultiplier: 2.5, designatedStore: '成都太古里体验店', linkedWechat: true, notes: '数字钻石卡' },
  { id: 'mc-004', memberId: 'm006', memberName: '陈静', cardNumber: 'VIP-20260004', cardType: 'physical', status: 'frozen', issuedAt: '2025-05-10', activatedAt: '2025-05-12', expiresAt: '2027-05-10', balance: 8500, pointsMultiplier: 1, designatedStore: '广州天河城店', linkedWechat: false, notes: '因争议订单冻结' },
  { id: 'mc-005', memberId: 'm007', memberName: '杨帆', cardNumber: 'VIP-20260005', cardType: 'virtual', status: 'expired', issuedAt: '2024-03-01', activatedAt: '2024-03-01', expiresAt: '2026-03-01', balance: 1200, pointsMultiplier: 1, designatedStore: null, linkedWechat: true, notes: '已过期未续费' },
  { id: 'mc-006', memberId: 'm010', memberName: '郑丽', cardNumber: 'VIP-20260006', cardType: 'physical', status: 'active', issuedAt: '2025-08-15', activatedAt: '2025-08-16', expiresAt: '2028-08-15', balance: 95000, pointsMultiplier: 3, designatedStore: 'San Francisco Union Square', linkedWechat: true, notes: '全球VIP实体卡' },
];

// ---- 会员等级配置类型 ----

export interface MemberLevelConfig {
  id: string;
  key: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string[];
  memberCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const MOCK_MEMBER_LEVEL_CONFIGS: MemberLevelConfig[] = [
  { id: 'lv-1', key: 'diamond', name: '钻石卡', level: 5, minPoints: 150000, maxPoints: 999999, discountRate: 0.8, annualFee: 888, benefits: ['专属客服', '免费停车', '生日礼包', '双倍积分', '新品优先'], memberCount: 120, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-2', key: 'gold', name: '金卡', level: 4, minPoints: 80000, maxPoints: 149999, discountRate: 0.85, annualFee: 388, benefits: ['免费停车', '生日礼包', '积分加速'], memberCount: 350, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-3', key: 'silver', name: '银卡', level: 3, minPoints: 30000, maxPoints: 79999, discountRate: 0.9, annualFee: 0, benefits: ['生日礼包', '积分加速'], memberCount: 680, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-4', key: 'bronze', name: '铜卡', level: 2, minPoints: 5000, maxPoints: 29999, discountRate: 0.95, annualFee: 0, benefits: ['基础积分'], memberCount: 890, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'lv-5', key: 'standard', name: '标准', level: 1, minPoints: 0, maxPoints: 4999, discountRate: 1, annualFee: 0, benefits: [], memberCount: 300, status: 'inactive', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const MEMBER_TIER_MAP: Record<MemberTier, { label: string; variant: MemberTierVariant }> = {
  diamond: { label: '钻石卡', variant: 'success' },
  gold: { label: '金卡', variant: 'success' },
  silver: { label: '银卡', variant: 'warning' },
  bronze: { label: '铜卡', variant: 'neutral' },
  standard: { label: '标准', variant: 'neutral' },
};

export const MEMBER_STATUS_MAP: Record<MemberStatus, { label: string; variant: MemberStatusVariant }> = {
  active: { label: '活跃', variant: 'success' },
  frozen: { label: '已冻结', variant: 'warning' },
  dormant: { label: '休眠', variant: 'neutral' },
  cancelled: { label: '已注销', variant: 'danger' },
};

export const MEMBER_LIFECYCLE_MAP: Record<MemberLifecycle, { label: string; variant: MemberLifecycleVariant }> = {
  new: { label: '新会员', variant: 'warning' },
  growing: { label: '成长中', variant: 'success' },
  loyal: { label: '忠实会员', variant: 'success' },
  declining: { label: '衰退期', variant: 'warning' },
  lost: { label: '已流失', variant: 'danger' },
};

export const MEMBER_TIERS: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
export const MEMBER_STATUSES: MemberStatus[] = ['active', 'frozen', 'dormant', 'cancelled'];

export const MOCK_MEMBERS: MemberItem[] = [
  { id: 'm001', code: 'MEM-001', name: '张伟', phone: '+86-138-0001-0001', tier: 'diamond', status: 'active', points: 185000, totalSpent: 367800, storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', registeredAt: '2022-03-15', lastVisitAt: '2026-06-13', visitCount: 412, avgOrderValue: 893, tags: ['高净值', '母婴', '数码'] },
  { id: 'm002', code: 'MEM-002', name: '李娜', phone: '+86-138-0001-0002', tier: 'gold', status: 'active', points: 92000, totalSpent: 184500, storeName: '上海陆家嘴中心店', marketCode: 'cn-mainland', registeredAt: '2022-07-20', lastVisitAt: '2026-06-12', visitCount: 286, avgOrderValue: 645, tags: ['美妆', '时尚'] },
  { id: 'm003', code: 'MEM-003', name: '王强', phone: '+86-138-0001-0003', tier: 'silver', status: 'active', points: 45000, totalSpent: 90100, storeName: '深圳万象天地店', marketCode: 'cn-mainland', registeredAt: '2023-01-10', lastVisitAt: '2026-06-11', visitCount: 153, avgOrderValue: 589, tags: ['运动', '户外'] },
  { id: 'm004', code: 'MEM-004', name: '赵敏', phone: '+86-138-0001-0004', tier: 'diamond', status: 'active', points: 210000, totalSpent: 420000, storeName: '成都太古里体验店', marketCode: 'cn-mainland', registeredAt: '2021-11-05', lastVisitAt: '2026-06-14', visitCount: 521, avgOrderValue: 806, tags: ['奢侈品', '珠宝', '高净值'] },
  { id: 'm005', code: 'MEM-005', name: '刘洋', phone: '+86-138-0001-0005', tier: 'standard', status: 'dormant', points: 3200, totalSpent: 6400, storeName: '杭州银泰旗舰店', marketCode: 'cn-mainland', registeredAt: '2025-06-01', lastVisitAt: '2026-03-20', visitCount: 48, avgOrderValue: 133, tags: [] },
  { id: 'm006', code: 'MEM-006', name: '陈静', phone: '+86-138-0001-0006', tier: 'gold', status: 'active', points: 78000, totalSpent: 156200, storeName: '广州天河城店', marketCode: 'cn-mainland', registeredAt: '2022-09-12', lastVisitAt: '2026-06-10', visitCount: 234, avgOrderValue: 668, tags: ['家居', '亲子'] },
  { id: 'm007', code: 'MEM-007', name: '杨帆', phone: '+86-138-0001-0007', tier: 'bronze', status: 'frozen', points: 15000, totalSpent: 30200, storeName: '南京德基广场店', marketCode: 'cn-mainland', registeredAt: '2023-05-18', lastVisitAt: '2026-05-01', visitCount: 89, avgOrderValue: 339, tags: ['数码', '游戏'] },
  { id: 'm008', code: 'MEM-008', name: '周婷', phone: '+86-138-0001-0008', tier: 'silver', status: 'active', points: 52000, totalSpent: 104300, storeName: '武汉天地旗舰店', marketCode: 'cn-mainland', registeredAt: '2023-03-22', lastVisitAt: '2026-06-13', visitCount: 178, avgOrderValue: 586, tags: ['美妆', '健康'] },
  { id: 'm009', code: 'MEM-009', name: '吴昊', phone: '+86-138-0001-0009', tier: 'standard', status: 'cancelled', points: 800, totalSpent: 1600, storeName: '重庆来福士店', marketCode: 'cn-mainland', registeredAt: '2025-09-01', lastVisitAt: '2026-02-10', visitCount: 22, avgOrderValue: 73, tags: [] },
  { id: 'm010', code: 'MEM-010', name: '郑丽', phone: '+86-138-0001-0010', tier: 'diamond', status: 'active', points: 225000, totalSpent: 450300, storeName: 'San Francisco Union Square', marketCode: 'us-default', registeredAt: '2022-01-20', lastVisitAt: '2026-06-14', visitCount: 498, avgOrderValue: 904, tags: ['奢侈品', '时尚', '高净值', 'VIP'] },
  { id: 'm011', code: 'MEM-011', name: 'David Chen', phone: '+1-415-555-1001', tier: 'gold', status: 'active', points: 85000, totalSpent: 170500, storeName: 'San Francisco Union Square', marketCode: 'us-default', registeredAt: '2023-02-14', lastVisitAt: '2026-06-12', visitCount: 201, avgOrderValue: 848, tags: ['科技', '运动'] },
  { id: 'm012', code: 'MEM-012', name: 'Emma Wilson', phone: '+1-212-555-1002', tier: 'silver', status: 'active', points: 48000, totalSpent: 96300, storeName: 'New York Fifth Avenue', marketCode: 'us-default', registeredAt: '2023-08-30', lastVisitAt: '2026-06-11', visitCount: 145, avgOrderValue: 664, tags: ['时尚', '美妆'] },
  { id: 'm013', code: 'MEM-013', name: 'James Smith', phone: '+44-20-555-3001', tier: 'bronze', status: 'dormant', points: 12000, totalSpent: 24100, storeName: 'London Oxford Street', marketCode: 'uk-default', registeredAt: '2024-04-01', lastVisitAt: '2026-04-15', visitCount: 65, avgOrderValue: 371, tags: ['书籍', '音乐'] },
  { id: 'm014', code: 'MEM-014', name: '黄晓明', phone: '+86-138-0001-0014', tier: 'gold', status: 'active', points: 96000, totalSpent: 192400, storeName: '苏州中心旗舰店', marketCode: 'cn-mainland', registeredAt: '2022-11-08', lastVisitAt: '2026-06-13', visitCount: 267, avgOrderValue: 720, tags: ['汽车', '户外', '数码'] },
  { id: 'm015', code: 'MEM-015', name: '孙悦', phone: '+86-138-0001-0015', tier: 'silver', status: 'frozen', points: 38000, totalSpent: 76200, storeName: '西安大唐不夜城店', marketCode: 'cn-mainland', registeredAt: '2023-07-15', lastVisitAt: '2026-05-20', visitCount: 112, avgOrderValue: 680, tags: ['美妆', '珠宝'] },
  { id: 'm016', code: 'MEM-016', name: 'Sophia Lee', phone: '+1-206-555-4001', tier: 'standard', status: 'active', points: 8200, totalSpent: 16400, storeName: 'Seattle Downtown', marketCode: 'us-default', registeredAt: '2025-01-05', lastVisitAt: '2026-06-09', visitCount: 78, avgOrderValue: 210, tags: ['咖啡', '健康'] },
  { id: 'm017', code: 'MEM-017', name: '马超', phone: '+86-138-0001-0017', tier: 'diamond', status: 'active', points: 198000, totalSpent: 396500, storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', registeredAt: '2021-06-20', lastVisitAt: '2026-06-14', visitCount: 589, avgOrderValue: 673, tags: ['高净值', '数码', '汽车', 'VIP'] },
  { id: 'm018', code: 'MEM-018', name: 'Julia Roberts', phone: '+1-415-555-2001', tier: 'gold', status: 'active', points: 88000, totalSpent: 176200, storeName: 'New York Fifth Avenue', marketCode: 'us-default', registeredAt: '2022-12-25', lastVisitAt: '2026-06-10', visitCount: 223, avgOrderValue: 790, tags: ['奢侈品', '珠宝'] },
  { id: 'm019', code: 'MEM-019', name: '何平', phone: '+86-138-0001-0019', tier: 'bronze', status: 'active', points: 22000, totalSpent: 44200, storeName: '成都太古里体验店', marketCode: 'cn-mainland', registeredAt: '2024-08-12', lastVisitAt: '2026-06-08', visitCount: 95, avgOrderValue: 465, tags: ['运动', '户外'] },
  { id: 'm020', code: 'MEM-020', name: 'Tom Harris', phone: '+44-20-555-4001', tier: 'standard', status: 'cancelled', points: 600, totalSpent: 1200, storeName: 'London Oxford Street', marketCode: 'uk-default', registeredAt: '2025-11-01', lastVisitAt: '2026-03-01', visitCount: 15, avgOrderValue: 80, tags: [] },
];

// ---- 会员导入记录 ----

export interface MemberImportRecord {
  importId: string;
  fileName: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  status: 'completed' | 'partial' | 'failed' | 'processing';
  importedBy: string;
  importedAt: string;
  errors: string[];
}

export const MOCK_IMPORT_RECORDS: MemberImportRecord[] = [
  { importId: 'imp-001', fileName: 'members_batch_20260601.csv', totalRecords: 120, successRecords: 118, failedRecords: 2, status: 'completed', importedBy: 'admin@example.com', importedAt: '2026-06-01T10:30:00Z', errors: ['第15行手机号格式错误：1380000', '第78行姓名为空'] },
  { importId: 'imp-002', fileName: 'vip_members_20260615.xlsx', totalRecords: 45, successRecords: 44, failedRecords: 1, status: 'completed', importedBy: 'ops@example.com', importedAt: '2026-06-15T14:20:00Z', errors: ['第33行等级值无效：platinum'] },
  { importId: 'imp-003', fileName: 'us_market_batch.csv', totalRecords: 80, successRecords: 80, failedRecords: 0, status: 'completed', importedBy: 'admin@example.com', importedAt: '2026-06-20T09:15:00Z', errors: [] },
  { importId: 'imp-004', fileName: 'promo_registrations_202607.csv', totalRecords: 200, successRecords: 0, failedRecords: 0, status: 'processing', importedBy: 'system', importedAt: '2026-07-10T08:00:00Z', errors: [] },
  { importId: 'imp-005', fileName: 'bulk_update_tiers.csv', totalRecords: 15, successRecords: 12, failedRecords: 3, status: 'partial', importedBy: 'ops@example.com', importedAt: '2026-06-25T16:45:00Z', errors: ['第2条会员ID不存在：m999', '第7条会员ID不存在：m998', '第11条等级值无效'] },
];

// ---- 会员报表月度趋势 ----

export interface MemberMonthlyTrend {
  month: string;
  newMembers: number;
  churnedMembers: number;
  activeMembers: number;
  totalMembers: number;
  newMemberRevenue: number;
  retentionRate: number;
}

export const MOCK_MEMBER_TRENDS: MemberMonthlyTrend[] = [
  { month: '2026-01', newMembers: 112, churnedMembers: 38, activeMembers: 1780, totalMembers: 2200, newMemberRevenue: 168000, retentionRate: 0.58 },
  { month: '2026-02', newMembers: 95, churnedMembers: 42, activeMembers: 1810, totalMembers: 2250, newMemberRevenue: 142500, retentionRate: 0.60 },
  { month: '2026-03', newMembers: 118, churnedMembers: 35, activeMembers: 1840, totalMembers: 2280, newMemberRevenue: 188800, retentionRate: 0.61 },
  { month: '2026-04', newMembers: 130, churnedMembers: 40, activeMembers: 1855, totalMembers: 2305, newMemberRevenue: 221000, retentionRate: 0.63 },
  { month: '2026-05', newMembers: 125, churnedMembers: 38, activeMembers: 1865, totalMembers: 2325, newMemberRevenue: 212500, retentionRate: 0.62 },
  { month: '2026-06', newMembers: 128, churnedMembers: 45, activeMembers: 1850, totalMembers: 2340, newMemberRevenue: 217600, retentionRate: 0.62 },
];

// ---- 会员报表导出配置 ----

export interface ReportExportConfig {
  format: 'csv' | 'xlsx' | 'pdf';
  includeCharts: boolean;
  dateRange: 'last-30-days' | 'last-quarter' | 'last-year' | 'all';
  includeMarkets: string[];
  groupBy: 'market' | 'tier' | 'lifecycle' | 'none';
}

export const DEFAULT_REPORT_EXPORT_CONFIG: ReportExportConfig = {
  format: 'csv',
  includeCharts: false,
  dateRange: 'last-30-days',
  includeMarkets: [],
  groupBy: 'none',
};

export const CHURN_REASONS = [
  { reason: '价格因素', count: 85, percentage: 0.28 },
  { reason: '质量不满意', count: 62, percentage: 0.20 },
  { reason: '服务体验差', count: 48, percentage: 0.16 },
  { reason: '竞品吸引', count: 55, percentage: 0.18 },
  { reason: '需求变化', count: 38, percentage: 0.12 },
  { reason: '其他', count: 18, percentage: 0.06 },
];

export const MOCK_MEMBER_DETAILS: Record<string, MemberDetail> = {
  m001: { id: 'm001', code: 'MEM-001', name: '张伟', phone: '+86-138-0001-0001', tier: 'diamond', status: 'active', points: 185000, totalSpent: 367800, storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', registeredAt: '2022-03-15', lastVisitAt: '2026-06-13', visitCount: 412, avgOrderValue: 893, tags: ['高净值', '母婴', '数码'], email: 'zhangwei@example.com', gender: 'male', birthday: '1988-05-12', wechatId: 'zhangwei_wx', address: '北京市朝阳区建国路88号SOHO现代城A座1205', referralCode: 'REF-ZW001', referredBy: null, notes: 'VIP客户，季度回访重点。偏好高端数码产品和进口母婴用品，对价格敏感度低，注重品质。', coupons: 5, favoriteCategories: ['数码', '母婴', '家居'], lastOrderAt: '2026-06-13', lifecycleStage: 'loyal' },
  m002: { id: 'm002', code: 'MEM-002', name: '李娜', phone: '+86-138-0001-0002', tier: 'gold', status: 'active', points: 92000, totalSpent: 184500, storeName: '上海陆家嘴中心店', marketCode: 'cn-mainland', registeredAt: '2022-07-20', lastVisitAt: '2026-06-12', visitCount: 286, avgOrderValue: 645, tags: ['美妆', '时尚'], email: 'lina@example.com', gender: 'female', birthday: '1991-11-08', wechatId: 'lina_beauty', address: '上海市浦东新区世纪大道100号环球金融中心88层', referralCode: 'REF-LN002', referredBy: 'm001', notes: '美妆时尚达人，社交影响力强。有多次复购记录，推荐发展成KOC。', coupons: 3, favoriteCategories: ['美妆', '时尚', '珠宝'], lastOrderAt: '2026-06-12', lifecycleStage: 'loyal' },
  m003: { id: 'm003', code: 'MEM-003', name: '王强', phone: '+86-138-0001-0003', tier: 'silver', status: 'active', points: 45000, totalSpent: 90100, storeName: '深圳万象天地店', marketCode: 'cn-mainland', registeredAt: '2023-01-10', lastVisitAt: '2026-06-11', visitCount: 153, avgOrderValue: 589, tags: ['运动', '户外'], email: 'wangqiang@example.com', gender: 'male', birthday: '1985-03-22', wechatId: 'wq_run', address: '深圳市南山区科技园南路88号深圳湾创新科技中心', referralCode: 'REF-WQ003', referredBy: null, notes: '运动户外爱好者，偏好登山露营装备。节假日活跃，关注季节性促销。', coupons: 2, favoriteCategories: ['运动', '户外', '数码'], lastOrderAt: '2026-06-11', lifecycleStage: 'growing' },
  m004: { id: 'm004', code: 'MEM-004', name: '赵敏', phone: '+86-138-0001-0004', tier: 'diamond', status: 'active', points: 210000, totalSpent: 420000, storeName: '成都太古里体验店', marketCode: 'cn-mainland', registeredAt: '2021-11-05', lastVisitAt: '2026-06-14', visitCount: 521, avgOrderValue: 806, tags: ['奢侈品', '珠宝', '高净值'], email: 'zhaomin@example.com', gender: 'female', birthday: '1982-09-15', wechatId: 'zhaomin_luxury', address: '成都市锦江区红星路三段99号国际金融中心B座2102', referralCode: 'REF-ZM004', referredBy: null, notes: '顶级VIP客户，年消费额超过50万。偏好国际一线奢侈品和高级珠宝。需要专属客服1对1服务。', coupons: 8, favoriteCategories: ['奢侈品', '珠宝', '时尚'], lastOrderAt: '2026-06-14', lifecycleStage: 'loyal' },
  m005: { id: 'm005', code: 'MEM-005', name: '刘洋', phone: '+86-138-0001-0005', tier: 'standard', status: 'dormant', points: 3200, totalSpent: 6400, storeName: '杭州银泰旗舰店', marketCode: 'cn-mainland', registeredAt: '2025-06-01', lastVisitAt: '2026-03-20', visitCount: 48, avgOrderValue: 133, tags: [], email: 'liuyang@example.com', gender: 'male', birthday: '1998-07-30', wechatId: 'ly_sleepy', address: '杭州市余杭区文一西路998号阿里巴巴西溪园区附近', referralCode: 'REF-LY005', referredBy: 'm006', notes: '新客户但活跃度下降快。接近3个月未到店，需要激活策略。可发送优惠券唤醒。', coupons: 1, favoriteCategories: ['书籍', '音乐'], lastOrderAt: '2026-03-19', lifecycleStage: 'declining' },
  m006: { id: 'm006', code: 'MEM-006', name: '陈静', phone: '+86-138-0001-0006', tier: 'gold', status: 'active', points: 78000, totalSpent: 156200, storeName: '广州天河城店', marketCode: 'cn-mainland', registeredAt: '2022-09-12', lastVisitAt: '2026-06-10', visitCount: 234, avgOrderValue: 668, tags: ['家居', '亲子'], email: 'chenjing@example.com', gender: 'female', birthday: '1989-12-25', wechatId: 'cj_mom', address: '广州市天河区天河路385号太古汇1座', referralCode: 'REF-CJ006', referredBy: null, notes: '家庭型消费者，关注亲子类产品和家居用品。带孩子到店频率高，适合亲子活动推广。', coupons: 4, favoriteCategories: ['家居', '亲子', '健康'], lastOrderAt: '2026-06-10', lifecycleStage: 'loyal' },
  m007: { id: 'm007', code: 'MEM-007', name: '杨帆', phone: '+86-138-0001-0007', tier: 'bronze', status: 'frozen', points: 15000, totalSpent: 30200, storeName: '南京德基广场店', marketCode: 'cn-mainland', registeredAt: '2023-05-18', lastVisitAt: '2026-05-01', visitCount: 89, avgOrderValue: 339, tags: ['数码', '游戏'], email: 'yangfan@example.com', gender: 'male', birthday: '1995-04-18', wechatId: 'yf_gamer', address: '南京市鼓楼区汉中路2号金陵饭店', referralCode: 'REF-YF007', referredBy: 'm014', notes: '因争议订单冻结，客诉处理中。需要客服团队介入调解，挽回客户信任。', coupons: 0, favoriteCategories: ['数码', '游戏'], lastOrderAt: '2026-04-28', lifecycleStage: 'lost' },
  m009: { id: 'm009', code: 'MEM-009', name: '吴昊', phone: '+86-138-0001-0009', tier: 'standard', status: 'cancelled', points: 800, totalSpent: 1600, storeName: '重庆来福士店', marketCode: 'cn-mainland', registeredAt: '2025-09-01', lastVisitAt: '2026-02-10', visitCount: 22, avgOrderValue: 73, tags: [], email: 'wuhao@example.com', gender: 'male', birthday: '2000-01-15', wechatId: 'wh_student', address: '重庆市江北区北城天街4号龙湖重庆北城天街', referralCode: 'REF-WH009', referredBy: null, notes: '学生群体，消费能力有限。已注销账号，可归档处理。', coupons: 0, favoriteCategories: [], lastOrderAt: '2026-02-09', lifecycleStage: 'lost' },
  m010: { id: 'm010', code: 'MEM-010', name: '郑丽', phone: '+86-138-0001-0010', tier: 'diamond', status: 'active', points: 225000, totalSpent: 450300, storeName: 'San Francisco Union Square', marketCode: 'us-default', registeredAt: '2022-01-20', lastVisitAt: '2026-06-14', visitCount: 498, avgOrderValue: 904, tags: ['奢侈品', '时尚', '高净值', 'VIP'], email: 'zhengli@example.com', gender: 'female', birthday: '1986-06-06', wechatId: 'zl_global', address: '333 Post St, San Francisco, CA 94108', referralCode: 'REF-ZL010', referredBy: null, notes: '全球高端客户，跨市场消费能力强。需保持品牌互动和新品优先通知。', coupons: 6, favoriteCategories: ['奢侈品', '时尚', '珠宝'], lastOrderAt: '2026-06-14', lifecycleStage: 'loyal' },
  m011: { id: 'm011', code: 'MEM-011', name: 'David Chen', phone: '+1-415-555-1001', tier: 'gold', status: 'active', points: 85000, totalSpent: 170500, storeName: 'San Francisco Union Square', marketCode: 'us-default', registeredAt: '2023-02-14', lastVisitAt: '2026-06-12', visitCount: 201, avgOrderValue: 848, tags: ['科技', '运动'], email: 'david.chen@example.com', gender: 'male', birthday: '1990-08-20', wechatId: 'david_tech', address: '500 Howard St, San Francisco, CA 94105', referralCode: 'REF-DC011', referredBy: 'm010', notes: '科技行业从业者，偏好最新数码产品。有多次推荐转化记录。', coupons: 3, favoriteCategories: ['科技', '运动', '数码'], lastOrderAt: '2026-06-12', lifecycleStage: 'growing' },
  m020: { id: 'm020', code: 'MEM-020', name: 'Tom Harris', phone: '+44-20-555-4001', tier: 'standard', status: 'cancelled', points: 600, totalSpent: 1200, storeName: 'London Oxford Street', marketCode: 'uk-default', registeredAt: '2025-11-01', lastVisitAt: '2026-03-01', visitCount: 15, avgOrderValue: 80, tags: [], email: 'tom.harris@example.com', gender: 'male', birthday: '2001-03-12', wechatId: '', address: '50 Baker St, London W1U 7BT', referralCode: 'REF-TH020', referredBy: null, notes: '留学生群体，疑似已回国。账号已注销，可归档处理。', coupons: 0, favoriteCategories: ['书籍'], lastOrderAt: '2026-02-28', lifecycleStage: 'lost' },
};
