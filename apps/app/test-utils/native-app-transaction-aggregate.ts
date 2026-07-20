import type {
  NativeAppTransactionAggregate,
  NativeAppTransactionOrder,
  NativeAppTransactionPayment,
  NativeAppTransactionRefund,
} from '../market-bootstrap';

interface BuildNativeAppTransactionAggregateOptions {
  memberNickname?: string;
  order?: Partial<NativeAppTransactionOrder>;
  payment?: Partial<NativeAppTransactionPayment> | null;
  settlement?: Partial<NonNullable<NativeAppTransactionAggregate['settlement']>> | null;
  refunds?: NativeAppTransactionRefund[];
}

const DEFAULT_ORDER: NativeAppTransactionOrder = {
  orderId: 'order-001',
  orderNo: 'ORDAPI20260720001',
  memberId: 'member-api-001',
  items: [],
  currency: 'CNY',
  totalAmount: 156,
  status: 'PAID',
  latestPaymentId: 'payment-order-001',
  createdAt: '2026-06-12T10:30:00.000Z',
  updatedAt: '2026-07-20T04:12:00.000Z',
  paidAt: '2026-07-20T04:12:00.000Z',
};

const DEFAULT_PAYMENT: NativeAppTransactionPayment = {
  paymentId: 'payment-order-001',
  orderId: 'order-001',
  channel: 'wechat-pay',
  amount: 156,
  status: 'SUCCEEDED',
  createdAt: '2026-06-12T10:30:00.000Z',
  updatedAt: '2026-07-20T04:12:00.000Z',
  completedAt: '2026-07-20T04:12:00.000Z',
};

const DEFAULT_SETTLEMENT: NonNullable<NativeAppTransactionAggregate['settlement']> = {
  settlementId: 'settlement-order-001',
  pointsEarned: 156,
  pointsBalance: 156,
};

export function buildNativeAppTransactionAggregate(
  options: BuildNativeAppTransactionAggregateOptions = {},
): NativeAppTransactionAggregate {
  return {
    order: {
      ...DEFAULT_ORDER,
      ...options.order,
    },
    memberNickname: options.memberNickname ?? '接口会员',
    payment: options.payment === null
      ? undefined
      : {
          ...DEFAULT_PAYMENT,
          ...options.payment,
        },
    settlement: options.settlement === null
      ? undefined
      : {
          ...DEFAULT_SETTLEMENT,
          ...options.settlement,
        },
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: options.refunds ?? [],
  };
}

export function createNativeAppTransactionAggregateResponse(
  options: BuildNativeAppTransactionAggregateOptions = {},
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'OK',
      data: buildNativeAppTransactionAggregate(options),
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
