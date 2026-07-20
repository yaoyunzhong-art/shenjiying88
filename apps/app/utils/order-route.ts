import type { PaymentChannel } from './payment-channel';

export type OrderPaymentRouteParams = {
  paymentStatus?: 'PAID';
  paymentAmount?: number;
  paymentPaidAt?: string;
  paymentChannel?: PaymentChannel;
};

export type OrderRefundRouteParams = {
  refundStatus?: 'PENDING' | 'REFUNDED';
  refundRequestedAmount?: number;
  refundReason?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
};

export type OrderRuntimeRouteParams = {
  orderId?: string;
  orderNo?: string;
} & OrderPaymentRouteParams & OrderRefundRouteParams;

export type OrderDetailRouteParams = {
  orderId: string;
  orderNo?: string;
} & OrderPaymentRouteParams & OrderRefundRouteParams;

export type PaymentRouteParams = {
  orderId?: string;
  orderNo?: string;
  amount?: number;
  paymentChannel?: PaymentChannel;
};

export type RefundRouteParams = {
  orderId?: string;
  orderNo?: string;
  amount?: number;
  reason?: string;
  paymentChannel?: PaymentChannel;
};
