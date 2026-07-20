import {
  formatOrderCurrencyAmount,
  formatOrderDateTime,
  getOrderRefundDisplay,
  getOrderStatusLabel,
} from './order-display';
import { getPaymentChannelLabel } from './payment-channel';
import type { OrderDetailViewModel } from './order-view';

export type OrderDetailSectionValueTone = 'default' | 'warning' | 'success' | 'info';

export interface OrderDetailSectionRow {
  label: string;
  value: string;
  valueTone?: OrderDetailSectionValueTone;
}

export interface OrderDetailSection {
  title: string;
  rows: OrderDetailSectionRow[];
}

export function buildOrderStatusSection(order: OrderDetailViewModel): OrderDetailSection {
  const rows: OrderDetailSectionRow[] = [
    {
      label: '订单状态',
      value: getOrderStatusLabel(order.status),
      valueTone: order.status === 'PAID'
        ? 'success'
        : order.status === 'PENDING'
          ? 'warning'
          : order.status === 'REFUNDED' || order.status === 'REFUND_PENDING'
            ? 'info'
            : 'default',
    },
    {
      label: '订单号',
      value: order.orderNo,
    },
    {
      label: '下单时间',
      value: formatOrderDateTime(order.createdAt),
    },
  ];

  if (order.paidAt) {
    rows.push({
      label: '支付时间',
      value: formatOrderDateTime(order.paidAt),
    });
  }

  return {
    title: '订单状态',
    rows,
  };
}

export function buildOrderRefundSection(input: {
  effectiveRefundStatus?: 'PENDING' | 'REFUNDED';
  effectiveRefundAmount?: number;
  effectiveRefundReason?: string;
  effectiveRefundRequestedAt?: string;
  effectiveRefundCompletedAt?: string;
}): OrderDetailSection | undefined {
  if (!input.effectiveRefundStatus || typeof input.effectiveRefundAmount !== 'number') {
    return undefined;
  }

  const refundDisplay = getOrderRefundDisplay(input.effectiveRefundStatus);
  const rows: OrderDetailSectionRow[] = [
    {
      label: '退款状态',
      value: refundDisplay.statusLabel,
      valueTone: input.effectiveRefundStatus === 'REFUNDED' ? 'success' : 'info',
    },
    {
      label: refundDisplay.amountLabel,
      value: formatOrderCurrencyAmount(input.effectiveRefundAmount),
    },
    {
      label: '退款原因',
      value: input.effectiveRefundReason ?? '未填写',
    },
  ];

  if (input.effectiveRefundRequestedAt) {
    rows.push({
      label: '申请时间',
      value: formatOrderDateTime(input.effectiveRefundRequestedAt),
    });
  }

  if (input.effectiveRefundStatus === 'REFUNDED' && input.effectiveRefundCompletedAt) {
    rows.push({
      label: '完成时间',
      value: formatOrderDateTime(input.effectiveRefundCompletedAt),
    });
  }

  return {
    title: refundDisplay.sectionTitle,
    rows,
  };
}

export function buildOrderPaymentSection(order: OrderDetailViewModel): OrderDetailSection {
  return {
    title: '支付信息',
    rows: [
      {
        label: '支付方式',
        value: getPaymentChannelLabel(order.paymentChannel) ?? '未知渠道',
      },
      {
        label: '支付金额',
        value: formatOrderCurrencyAmount(order.totalAmount, order.currency),
      },
      {
        label: '获得积分',
        value: `+${order.pointsEarned}`,
        valueTone: 'warning',
      },
    ],
  };
}

export function buildOrderMemberSection(order: OrderDetailViewModel): OrderDetailSection {
  return {
    title: '会员信息',
    rows: [
      {
        label: '会员ID',
        value: order.memberId,
      },
      {
        label: '会员昵称',
        value: order.memberNickname,
      },
    ],
  };
}
