import {
  ApiClient,
  ApiError,
  createBusinessClient,
  getDefaultApiBaseUrl,
  type BusinessCashierMemberLookupResult,
  type BusinessCashierProductItem,
  type BusinessTransactionAggregate,
} from '@m5/sdk';

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

export type StorefrontTransactionAggregate = BusinessTransactionAggregate;

export interface StorefrontCashierProduct extends BusinessCashierProductItem {
  id: string;
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

  const paymentRecord = aggregate.payment as (typeof aggregate.payment & {
    qrCodeUrl?: string;
    qrCode?: string;
    paymentUrl?: string;
  }) | undefined;

  return {
    orderId: aggregate.order.orderId,
    orderCode: aggregate.order.orderNo ?? aggregate.order.orderId,
    amount,
    status,
    method,
    qrCode:
      status === 'pending'
        ? paymentRecord?.qrCodeUrl ?? paymentRecord?.qrCode ?? paymentRecord?.paymentUrl
        : undefined,
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
): Promise<BusinessCashierMemberLookupResult | null> {
  const client = createBusinessClient(getDefaultApiBaseUrl());
  try {
    return await client.cashier.lookupMember(query, {
      cache: 'no-store',
      headers: {
        'x-tenant-id': scope.tenantId,
        'x-brand-id': scope.brandId,
        'x-store-id': scope.storeId,
        'x-market-code': scope.marketCode,
      },
    });
  } catch {
    return null;
  }
}

export async function listStorefrontCashierProducts(
  scope: StorefrontScope = DEFAULT_STOREFRONT_SCOPE,
): Promise<StorefrontCashierProduct[]> {
  const client = createBusinessClient(getDefaultApiBaseUrl());
  const payload = await client.cashier.listProducts(
    { limit: 100 },
    {
      cache: 'no-store',
      headers: {
        'x-tenant-id': scope.tenantId,
        'x-brand-id': scope.brandId,
        'x-store-id': scope.storeId,
        'x-market-code': scope.marketCode,
      },
    },
  );

  return payload.items.map((item) => ({
    ...item,
    id: item.sku,
  }));
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
  return createBusinessClient(getDefaultApiBaseUrl()).orders.get(orderId, {
    cache: 'no-store',
    headers: {
      'x-tenant-id': scope.tenantId,
      'x-brand-id': scope.brandId,
      'x-store-id': scope.storeId,
      'x-market-code': scope.marketCode,
    },
  });
}
