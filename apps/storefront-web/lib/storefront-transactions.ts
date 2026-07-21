import { ApiClient, ApiError, getDefaultApiBaseUrl } from '@m5/sdk';

export type CheckoutPaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member_card';
export type H5PaymentMethod = 'wechat' | 'alipay' | 'bankcard' | 'points';
export type PaymentResultStatus = 'success' | 'failed' | 'pending';
export type RuntimePaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';

export interface StorefrontScope {
  marketCode: string;
  tenantId: string;
  brandId: string;
  storeId: string;
}

export interface StorefrontTransactionAggregate {
  order: {
    orderId: string;
    orderNo?: string;
    memberId: string;
    currency: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    closedAt?: string;
    closeReason?: string;
    items?: Array<{
      skuId: string;
      title?: string;
      quantity: number;
      price: number;
    }>;
  };
  payment?: {
    paymentId: string;
    orderId: string;
    externalPaymentId?: string;
    channel?: string;
    amount: number;
    status: string;
    transactionNo?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
  memberNickname?: string;
  refunds: Array<{
    refundId: string;
    orderId: string;
    paymentId: string;
    memberId: string;
    refundAmount: number;
    reason: string;
    status: string;
    requestedAt: string;
    completedAt?: string;
  }>;
}

export interface CheckoutLineItem {
  skuId: string;
  title?: string;
  quantity: number;
  price: number;
}

export interface PaymentViewModel {
  orderId: string;
  orderCode: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  status: RuntimePaymentStatus;
  method: H5PaymentMethod;
  qrCode?: string;
  expireAt?: string;
  paidAt?: string;
  createdAt: string;
  storeId: string;
  description?: string;
}

export interface PaymentResultDisplay {
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
}

export interface ResultAction {
  label: string;
  href?: string;
  variant: 'primary' | 'secondary' | 'ghost';
  action?: 'back';
}

export const DEFAULT_STOREFRONT_SCOPE: StorefrontScope = {
  marketCode: 'cn-mainland',
  tenantId: 'demo-tenant',
  brandId: 'demo-brand',
  storeId: 'store-001',
};

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

const METHOD_LABELS: Record<H5PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bankcard: '银行卡',
  points: '积分支付',
};

const CHANNEL_LABELS: Record<string, string> = {
  WECHAT_PAY: '微信支付',
  ALIPAY: '支付宝',
  CASH: '现金',
  MEMBER_CARD: '会员卡',
};

export const RESULT_DISPLAY: Record<PaymentResultStatus, PaymentResultDisplay> = {
  success: {
    icon: '✅',
    title: '支付成功',
    subtitle: '感谢您的支付，订单已确认',
    bgColor: 'rgba(74, 222, 128, 0.15)',
  },
  failed: {
    icon: '❌',
    title: '支付失败',
    subtitle: '支付未完成，请稍后重试',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  pending: {
    icon: '⏳',
    title: '支付处理中',
    subtitle: '正在等待支付结果确认',
    bgColor: 'rgba(251, 191, 36, 0.15)',
  },
};

function createStorefrontTransactionsClient(scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: scope.tenantId,
    brandId: scope.brandId,
    storeId: scope.storeId,
    marketCode: scope.marketCode,
  });
}

export function formatCurrency(amount: number, currency = 'CNY') {
  const prefix = currency === 'CNY' ? '¥' : `${currency} `;
  return `${prefix}${amount.toFixed(2)}`;
}

export function buildStorefrontMemberId(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `sf-member-${digits || 'guest'}`;
}

export function mapCheckoutMethodToChannel(method: CheckoutPaymentMethod): string {
  switch (method) {
    case 'wechat':
      return 'WECHAT_PAY';
    case 'alipay':
      return 'ALIPAY';
    case 'cash':
      return 'CASH';
    case 'member_card':
      return 'MEMBER_CARD';
    default:
      return 'WECHAT_PAY';
  }
}

export function mapCheckoutMethodToH5Method(method: CheckoutPaymentMethod): H5PaymentMethod {
  switch (method) {
    case 'wechat':
      return 'wechat';
    case 'alipay':
      return 'alipay';
    case 'cash':
      return 'bankcard';
    case 'member_card':
      return 'points';
    default:
      return 'wechat';
  }
}

export function mapChannelToH5Method(channel?: string): H5PaymentMethod {
  switch (channel) {
    case 'WECHAT_PAY':
    case 'wechat':
    case 'wechat-pay':
      return 'wechat';
    case 'ALIPAY':
    case 'alipay':
    case 'ali-pay':
      return 'alipay';
    case 'MEMBER_CARD':
    case 'member-card':
    case 'member_card':
      return 'points';
    case 'CASH':
    case 'cash':
      return 'bankcard';
    default:
      return 'wechat';
  }
}

export function getPaymentMethodLabel(methodOrChannel?: string) {
  if (!methodOrChannel) return '待确认';
  return CHANNEL_LABELS[methodOrChannel] ?? METHOD_LABELS[methodOrChannel as H5PaymentMethod] ?? methodOrChannel;
}

function buildPseudoQrCodeDataUrl(orderCode: string, amount: number, method: H5PaymentMethod) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <rect width="220" height="220" fill="#ffffff" rx="16"/>
      <rect x="18" y="18" width="184" height="184" rx="12" fill="#0f172a"/>
      <rect x="34" y="34" width="42" height="42" fill="#ffffff"/>
      <rect x="46" y="46" width="18" height="18" fill="#0f172a"/>
      <rect x="144" y="34" width="42" height="42" fill="#ffffff"/>
      <rect x="156" y="46" width="18" height="18" fill="#0f172a"/>
      <rect x="34" y="144" width="42" height="42" fill="#ffffff"/>
      <rect x="46" y="156" width="18" height="18" fill="#0f172a"/>
      <g fill="#ffffff">
        <rect x="96" y="34" width="12" height="12"/>
        <rect x="120" y="34" width="12" height="12"/>
        <rect x="96" y="58" width="12" height="12"/>
        <rect x="120" y="58" width="12" height="12"/>
        <rect x="84" y="96" width="12" height="12"/>
        <rect x="108" y="96" width="12" height="12"/>
        <rect x="132" y="96" width="12" height="12"/>
        <rect x="156" y="96" width="12" height="12"/>
        <rect x="84" y="120" width="12" height="12"/>
        <rect x="108" y="120" width="12" height="12"/>
        <rect x="132" y="120" width="12" height="12"/>
        <rect x="156" y="120" width="12" height="12"/>
        <rect x="96" y="144" width="12" height="12"/>
        <rect x="120" y="144" width="12" height="12"/>
        <rect x="144" y="144" width="12" height="12"/>
        <rect x="84" y="168" width="12" height="12"/>
        <rect x="108" y="168" width="12" height="12"/>
        <rect x="132" y="168" width="12" height="12"/>
      </g>
      <text x="110" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">
        ${orderCode} · ${METHOD_LABELS[method]} · ${formatCurrency(amount)}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isDuplicateMemberError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 409 || /already exists|已存在|duplicate/i.test(error.message))
  );
}

function buildPaymentExpireAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + PAYMENT_TIMEOUT_MS).toISOString();
}

export function getRuntimePaymentStatus(
  aggregate: StorefrontTransactionAggregate,
  nowMs = Date.now(),
): RuntimePaymentStatus {
  const latestRefund = aggregate.refunds.find((refund) => refund.status === 'COMPLETED');
  if (latestRefund) {
    return 'refunded';
  }

  if (aggregate.payment?.status === 'SUCCEEDED' || aggregate.order.status === 'PAID') {
    return 'paid';
  }

  if (aggregate.payment?.status === 'FAILED' || aggregate.order.status === 'PAYMENT_FAILED') {
    return 'failed';
  }

  if (
    aggregate.order.closeReason === 'PAYMENT_TIMEOUT' ||
    aggregate.order.status === 'CLOSED' ||
    new Date(aggregate.order.createdAt).getTime() + PAYMENT_TIMEOUT_MS <= nowMs
  ) {
    return 'expired';
  }

  return 'pending';
}

export function mapAggregateToPaymentView(
  aggregate: StorefrontTransactionAggregate,
  selectedMethod?: H5PaymentMethod,
): PaymentViewModel {
  const method = selectedMethod ?? mapChannelToH5Method(aggregate.payment?.channel);
  const status = getRuntimePaymentStatus(aggregate);
  const amount = aggregate.payment?.amount ?? aggregate.order.totalAmount;
  const createdAt = aggregate.payment?.createdAt ?? aggregate.order.createdAt;

  return {
    orderId: aggregate.order.orderId,
    orderCode: aggregate.order.orderNo ?? aggregate.order.orderId,
    amount,
    status,
    method,
    qrCode: status === 'pending' ? buildPseudoQrCodeDataUrl(aggregate.order.orderNo ?? aggregate.order.orderId, amount, method) : undefined,
    expireAt: status === 'pending' ? buildPaymentExpireAt(createdAt) : undefined,
    paidAt: aggregate.payment?.completedAt ?? aggregate.order.paidAt,
    createdAt,
    storeId: DEFAULT_STOREFRONT_SCOPE.storeId,
    description: aggregate.order.items?.map((item) => item.title ?? item.skuId).join(' / ') || '门店订单',
  };
}

export function mapAggregateToResultStatus(aggregate: StorefrontTransactionAggregate): PaymentResultStatus {
  const runtimeStatus = getRuntimePaymentStatus(aggregate);
  if (runtimeStatus === 'paid' || runtimeStatus === 'refunded') {
    return 'success';
  }
  if (runtimeStatus === 'failed' || runtimeStatus === 'expired') {
    return 'failed';
  }
  return 'pending';
}

export function getPaymentResultActions(status: PaymentResultStatus, orderId: string): ResultAction[] {
  switch (status) {
    case 'success':
      return [
        { label: '查看订单', href: '/h5/orders', variant: 'primary' },
        { label: '返回首页', href: '/h5', variant: 'secondary' },
      ];
    case 'failed':
      return [
        { label: '重新支付', href: `/h5/payment/${orderId}`, variant: 'primary' },
        { label: '返回首页', href: '/h5', variant: 'secondary' },
      ];
    case 'pending':
      return [
        { label: '返回支付页面', variant: 'secondary', action: 'back' },
        { label: '先逛逛其他', href: '/h5', variant: 'ghost' },
      ];
    default:
      return [];
  }
}

export function getCashierClient() {
  return createStorefrontTransactionsClient();
}

/**
 * 前台收银会员查找 — 调用 cashier/members/lookup API
 * 返回 null 表示未找到该手机号会员
 */
export async function lookupStorefrontMember(
  query: string,
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
) {
  const client = getCashierClient();
  try {
    return await client.getData<{
      id: string;
      name: string;
      phone: string;
      memberNo: string;
      tier: string;
      points: number;
      discountRate: number;
    } | null>(`/cashier/members/lookup?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
  } catch {
    return null;
  }
}

export async function ensureStorefrontMemberRegistered(
  memberId: string,
  nickname: string,
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
) {
  const client = createStorefrontTransactionsClient(scope);

  try {
    return await client.postData('/members/register', { memberId, nickname }, { cache: 'no-store' });
  } catch (error) {
    if (isDuplicateMemberError(error)) {
      return client.getData(`/members/${memberId}`, { cache: 'no-store' });
    }
    throw error;
  }
}

export async function startStorefrontCheckout(
  memberId: string,
  items: CheckoutLineItem[],
  paymentMethod: CheckoutPaymentMethod,
  amount?: number,
  couponCode?: string,
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
) {
  return createStorefrontTransactionsClient(scope).postData<StorefrontTransactionAggregate>(
    '/transactions/checkout',
    {
      memberId,
      items,
      paymentChannel: mapCheckoutMethodToChannel(paymentMethod),
      currency: 'CNY',
      couponCode,
      amount,
    },
    { cache: 'no-store' },
  );
}

export async function getStorefrontOrderTransaction(
  orderId: string,
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
) {
  return createStorefrontTransactionsClient(scope).getData<StorefrontTransactionAggregate>(
    `/transactions/orders/${orderId}`,
    { cache: 'no-store' },
  );
}

export async function submitStorefrontPaymentSuccess(
  aggregate: StorefrontTransactionAggregate,
  paymentMethod: H5PaymentMethod,
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
) {
  const paymentId = aggregate.payment?.paymentId;
  if (!paymentId) {
    throw new Error('当前订单尚未生成支付单，无法提交支付结果');
  }

  const channel = (() => {
    switch (paymentMethod) {
      case 'wechat':
        return 'WECHAT_PAY';
      case 'alipay':
        return 'ALIPAY';
      case 'points':
        return 'MEMBER_CARD';
      case 'bankcard':
      default:
        return 'CASH';
    }
  })();

  await createStorefrontTransactionsClient(scope).postData<StorefrontTransactionAggregate>(
    '/transactions/payments/standardized-callback',
    {
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: paymentId,
      paymentId,
      orderId: aggregate.order.orderId,
      tenantId: scope.tenantId,
      externalPaymentId: aggregate.payment?.externalPaymentId,
      transactionNo: aggregate.payment?.transactionNo ?? `storefront-${paymentId}`,
      channel,
      amount: aggregate.payment?.amount ?? aggregate.order.totalAmount,
      status: 'SUCCEEDED',
      paidAt: new Date().toISOString(),
      payload: {
        source: 'storefront-h5',
        marketCode: scope.marketCode,
      },
    },
    { cache: 'no-store' },
  );

  return getStorefrontOrderTransaction(aggregate.order.orderId, scope);
}
