/** 退款管理 — 类型定义 */

/** 退款状态 */
export type RefundStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';

/** 退款类型 */
export type RefundType = 'refund' | 'exchange' | 'return';

/** 退款处理方式 */
export type RefundChannel = 'original' | 'wechat' | 'alipay' | 'bank' | 'store_credit';

/** 退款申请项 */
export interface RefundItem {
  id: string;
  orderId: string;
  type: RefundType;
  status: RefundStatus;
  channel: RefundChannel;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  amount: number; // 分
  reason: string;
  remark: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  productName: string;
  productSku: string;
  quantity: number;
}

/** 退款状态中文标签 */
export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
};

/** 退款状态对应的 UI variant */
export const REFUND_STATUS_VARIANT: Record<RefundStatus, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  processing: 'info',
  completed: 'success',
  cancelled: 'default',
};

/** 退款类型中文标签 */
export const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  refund: '仅退款',
  exchange: '换货',
  return: '退货退款',
};

/** 退款渠道中文标签 */
export const REFUND_CHANNEL_LABEL: Record<RefundChannel, string> = {
  original: '原路退回',
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '银行转账',
  store_credit: '门店余额',
};
