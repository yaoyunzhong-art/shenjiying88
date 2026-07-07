/**
 * 退换货数据模型与工具函数
 * Refund data types, constants, and mock data for the refunds page.
 */

/* ── 退换货状态 ── */
export type RefundStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
};

export const REFUND_STATUS_VARIANT: Record<RefundStatus, 'warning' | 'success' | 'danger' | 'neutral' | 'info'> = {
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  processing: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

/* ── 退换货类型 ── */
export type RefundType = 'refund' | 'exchange' | 'return';

export const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  refund: '仅退款',
  exchange: '换货',
  return: '退货退款',
};

/* ── 退换货数据模型 ── */
export interface RefundItem {
  id: string;
  orderId: string;
  type: RefundType;
  status: RefundStatus;
  customerName: string;
  customerPhone: string;
  amount: number; // 分
  reason: string;
  createdAt: string;
  processedAt?: string;
  productName: string;
}

/* ── Mock 数据 ── */
export const MOCK_REFUNDS: RefundItem[] = [
  { id: 'RF-20260601', orderId: 'ORD-20260601-001', type: 'refund', status: 'pending_approval', customerName: '王芳', customerPhone: '138****5678', amount: 12900, reason: '商品与描述不符', createdAt: '2026-06-28 09:15', productName: '有机蔬菜礼盒' },
  { id: 'RF-20260602', orderId: 'ORD-20260601-002', type: 'exchange', status: 'approved', customerName: '李明', customerPhone: '159****2341', amount: 35800, reason: '尺码不合适，换货', createdAt: '2026-06-27 14:30', processedAt: '2026-06-27 16:00', productName: '运动跑鞋' },
  { id: 'RF-20260603', orderId: 'ORD-20260601-003', type: 'return', status: 'processing', customerName: '赵雪', customerPhone: '176****9087', amount: 52000, reason: '收到的商品破损', createdAt: '2026-06-26 10:00', processedAt: '2026-06-26 11:30', productName: '进口红酒套装' },
  { id: 'RF-20260604', orderId: 'ORD-20260601-004', type: 'refund', status: 'completed', customerName: '陈伟', customerPhone: '182****4532', amount: 8800, reason: '重复下单', createdAt: '2026-06-25 08:45', processedAt: '2026-06-25 10:20', productName: '手工饼干' },
  { id: 'RF-20260605', orderId: 'ORD-20260601-005', type: 'exchange', status: 'rejected', customerName: '刘洋', customerPhone: '136****7890', amount: 25900, reason: '超过退换货期限', createdAt: '2026-06-24 16:20', processedAt: '2026-06-24 17:00', productName: '蓝牙耳机' },
  { id: 'RF-20260606', orderId: 'ORD-20260601-006', type: 'return', status: 'pending_approval', customerName: '孙丽', customerPhone: '139****3456', amount: 16800, reason: '商品过期', createdAt: '2026-06-23 11:10', productName: '鲜牛奶' },
  { id: 'RF-20260607', orderId: 'ORD-20260601-007', type: 'refund', status: 'cancelled', customerName: '周强', customerPhone: '137****6789', amount: 4500, reason: '已协商解决', createdAt: '2026-06-22 09:30', processedAt: '2026-06-22 10:15', productName: '零食大礼包' },
  { id: 'RF-20260608', orderId: 'ORD-20260601-008', type: 'exchange', status: 'completed', customerName: '吴敏', customerPhone: '158****2345', amount: 68900, reason: '颜色发错', createdAt: '2026-06-21 15:00', processedAt: '2026-06-22 09:00', productName: '羊绒围巾' },
];
