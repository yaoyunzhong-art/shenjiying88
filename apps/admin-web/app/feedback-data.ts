/**
 * feedback-data.ts — Customer feedback mock data for admin-web feedback management page
 */

export type FeedbackType = 'complaint' | 'suggestion' | 'praise' | 'inquiry';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved';

export interface FeedbackItem {
  id: string;
  customerName: string;
  storeName: string;
  type: FeedbackType;
  rating: number;
  content: string;
  createdAt: string;
  status: FeedbackStatus;
  /** 处理人（已处理和进行中时必填） */
  handler?: string;
  /** 处理备注 */
  remark?: string;
  /** 处理时间 */
  resolvedAt?: string;
}

export const FEEDBACK_TYPES: FeedbackType[] = ['complaint', 'suggestion', 'praise', 'inquiry'];
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['pending', 'processing', 'resolved'];

export const FEEDBACK_TYPE_MAP: Record<FeedbackType, { label: string; variant: 'danger' | 'warning' | 'success' | 'info' }> = {
  complaint: { label: '投诉', variant: 'danger' },
  suggestion: { label: '建议', variant: 'warning' },
  praise: { label: '表扬', variant: 'success' },
  inquiry: { label: '咨询', variant: 'info' },
};

export const FEEDBACK_STATUS_MAP: Record<FeedbackStatus, { label: string; variant: 'danger' | 'warning' | 'success' | 'neutral' }> = {
  pending: { label: '待处理', variant: 'danger' },
  processing: { label: '处理中', variant: 'warning' },
  resolved: { label: '已处理', variant: 'success' },
};

export function getFeedbackTypeLabel(type: FeedbackType): string {
  return FEEDBACK_TYPE_MAP[type]?.label ?? type;
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  return FEEDBACK_STATUS_MAP[status]?.label ?? status;
}

export function getFeedbackTypeVariant(type: FeedbackType): string {
  return FEEDBACK_TYPE_MAP[type]?.variant ?? 'neutral';
}

export function getFeedbackStatusVariant(status: FeedbackStatus): string {
  return FEEDBACK_STATUS_MAP[status]?.variant ?? 'neutral';
}

export const MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'f-001',
    customerName: '王小明',
    storeName: '朝阳大悦城旗舰店',
    type: 'complaint',
    rating: 1,
    content: '服务员态度极其恶劣，等了半小时无人接待，要求道歉并退款。',
    createdAt: '2026-07-15 14:30',
    status: 'pending',
  },
  {
    id: 'f-002',
    customerName: '李芳',
    storeName: '上海陆家嘴中心店',
    type: 'suggestion',
    rating: 3,
    content: '建议增加自助结账通道，高峰时段排队时间过长，影响购物体验。',
    createdAt: '2026-07-15 10:20',
    status: 'processing',
    handler: '运营部-张三',
    remark: '已与门店沟通，月底前新增两台自助收银机',
  },
  {
    id: 'f-003',
    customerName: '张伟',
    storeName: '深圳万象天地店',
    type: 'praise',
    rating: 5,
    content: '店员小李服务非常专业，耐心讲解了产品的所有功能，点赞！',
    createdAt: '2026-07-14 16:45',
    status: 'resolved',
    handler: '门店-陈店长',
    remark: '已将表扬信发到门店群，给予小李月度表彰',
    resolvedAt: '2026-07-15 09:00',
  },
  {
    id: 'f-004',
    customerName: '赵敏',
    storeName: '成都太古里体验店',
    type: 'inquiry',
    rating: 4,
    content: '请问会员积分可以在线上商城使用吗？具体怎么操作？',
    createdAt: '2026-07-14 09:10',
    status: 'pending',
  },
  {
    id: 'f-005',
    customerName: '刘强',
    storeName: '杭州银泰旗舰店',
    type: 'complaint',
    rating: 2,
    content: '购买的电器商品有质量问题，联系售后一周无人处理，非常失望。',
    createdAt: '2026-07-13 11:30',
    status: 'processing',
    handler: '客服部-李四',
    remark: '已联系供应商，安排换货流程',
  },
  {
    id: 'f-006',
    customerName: '陈静',
    storeName: '广州天河城店',
    type: 'suggestion',
    rating: 4,
    content: '建议App增加到店自取预约功能，方便提前锁定商品库存。',
    createdAt: '2026-07-12 15:00',
    status: 'resolved',
    handler: '产品部-王五',
    remark: '已纳入下个迭代需求清单',
    resolvedAt: '2026-07-13 17:30',
  },
  {
    id: 'f-007',
    customerName: '林小红',
    storeName: '南京德基广场店',
    type: 'praise',
    rating: 5,
    content: '门店环境非常好，商品陈列清晰有序，导购热情但不打扰，完美体验！',
    createdAt: '2026-07-11 19:20',
    status: 'resolved',
    handler: '运营部-张三',
    remark: '已通报表扬，列为服务标杆门店案例',
    resolvedAt: '2026-07-12 10:00',
  },
  {
    id: 'f-008',
    customerName: '周杰',
    storeName: '北京三里屯店',
    type: 'inquiry',
    rating: 3,
    content: '请问电子发票怎么开具？购买了一个月还能补开吗？',
    createdAt: '2026-07-10 08:30',
    status: 'pending',
  },
];

// ---- 统计计算 ----

export interface FeedbackStats {
  total: number;
  pendingCount: number;
  processingCount: number;
  resolvedCount: number;
  /** 本月平均评级 */
  monthlyAvgRating: number;
  complaintCount: number;
  suggestionCount: number;
  praiseCount: number;
  inquiryCount: number;
}

export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  const thisMonth = '2026-07';
  const thisMonthItems = items.filter((f) => f.createdAt.startsWith(thisMonth));
  const totalRating = thisMonthItems.reduce((s, f) => s + f.rating, 0);
  const monthlyAvgRating = thisMonthItems.length > 0
    ? Math.round((totalRating / thisMonthItems.length) * 10) / 10
    : 0;

  return {
    total: items.length,
    pendingCount: items.filter((f) => f.status === 'pending').length,
    processingCount: items.filter((f) => f.status === 'processing').length,
    resolvedCount: items.filter((f) => f.status === 'resolved').length,
    monthlyAvgRating,
    complaintCount: items.filter((f) => f.type === 'complaint').length,
    suggestionCount: items.filter((f) => f.type === 'suggestion').length,
    praiseCount: items.filter((f) => f.type === 'praise').length,
    inquiryCount: items.filter((f) => f.type === 'inquiry').length,
  };
}

export function renderStars(rating: number): string {
  const full = '★'.repeat(Math.min(rating, 5));
  const empty = '☆'.repeat(Math.max(0, 5 - rating));
  return full + empty;
}
