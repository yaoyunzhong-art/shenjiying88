import type { OrderRuntimeMergeTarget } from './order-runtime';

type OrderDisplayStatus = OrderRuntimeMergeTarget['status'];

const ORDER_STATUS_LABELS: Record<OrderDisplayStatus, string> = {
  PENDING: '待支付',
  PAID: '已完成',
  REFUND_PENDING: '退款审核中',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
};

export function getOrderStatusLabel(status: OrderDisplayStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function formatOrderDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderCurrencyAmount(amount: number, currency = 'CNY'): string {
  return `${currency === 'CNY' ? '¥' : '$'}${amount.toFixed(2)}`;
}

export function getOrderRefundDisplay(
  refundStatus: 'PENDING' | 'REFUNDED',
): {
  sectionTitle: string;
  statusLabel: string;
  amountLabel: string;
} {
  if (refundStatus === 'REFUNDED') {
    return {
      sectionTitle: '退款结果',
      statusLabel: '已退款',
      amountLabel: '退款金额',
    };
  }

  return {
    sectionTitle: '退款进度',
    statusLabel: '退款审核中',
    amountLabel: '申请金额',
  };
}
