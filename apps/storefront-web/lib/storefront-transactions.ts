import {
  ApiClient,
  ApiError,
  createBusinessClient,
  getDefaultApiBaseUrl,
  type BusinessCashierMemberLookupResult,
  type BusinessCashierProductItem,
  type BusinessTransactionAggregate,
} from '@m5/sdk';

export { ApiError };

export type CheckoutPaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member_card';
export type H5PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member_card';
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

export const STOREFRONT_SCOPE_STORAGE_KEYS = {
  marketCode: 'storefront.marketCode',
  tenantId: 'storefront.tenantId',
  brandId: 'storefront.brandId',
  storeId: 'storefront.storeId',
} as const;

const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

const METHOD_LABELS: Record<H5PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金支付',
  member_card: '会员卡支付',
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

function readScopeFromEnv(): StorefrontScope | null {
  const marketCode = process.env.NEXT_PUBLIC_STOREFRONT_MARKET_CODE?.trim();
  const tenantId = process.env.NEXT_PUBLIC_STOREFRONT_TENANT_ID?.trim();
  const brandId = process.env.NEXT_PUBLIC_STOREFRONT_BRAND_ID?.trim();
  const storeId = process.env.NEXT_PUBLIC_STOREFRONT_STORE_ID?.trim();

  if (!marketCode || !tenantId || !brandId || !storeId) {
    return null;
  }

  return { marketCode, tenantId, brandId, storeId };
}

function readScopeFromBrowser(): StorefrontScope | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const marketCode =
    searchParams.get('marketCode')?.trim() ||
    searchParams.get('market')?.trim() ||
    window.localStorage.getItem(STOREFRONT_SCOPE_STORAGE_KEYS.marketCode)?.trim() ||
    '';
  const tenantId =
    searchParams.get('tenantId')?.trim() ||
    searchParams.get('tenantCode')?.trim() ||
    window.localStorage.getItem(STOREFRONT_SCOPE_STORAGE_KEYS.tenantId)?.trim() ||
    '';
  const brandId =
    searchParams.get('brandId')?.trim() ||
    searchParams.get('brandCode')?.trim() ||
    window.localStorage.getItem(STOREFRONT_SCOPE_STORAGE_KEYS.brandId)?.trim() ||
    '';
  const storeId =
    searchParams.get('storeId')?.trim() ||
    searchParams.get('storeCode')?.trim() ||
    window.localStorage.getItem(STOREFRONT_SCOPE_STORAGE_KEYS.storeId)?.trim() ||
    '';

  if (!marketCode || !tenantId || !brandId || !storeId) {
    return null;
  }

  return { marketCode, tenantId, brandId, storeId };
}

function buildDefaultScope(): StorefrontScope {
  const browserScope = readScopeFromBrowser();
  if (browserScope) {
    return browserScope;
  }

  const envScope = readScopeFromEnv();
  if (envScope) {
    return envScope;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_STOREFRONT_SCOPE;
  }

  throw new Error(
    'Storefront scope is not configured. Please provide marketCode/tenantId/brandId/storeId via URL, localStorage, or NEXT_PUBLIC_STOREFRONT_* env vars.',
  );
}

export function resolveStorefrontScope(scope?: StorefrontScope): StorefrontScope {
  return scope ?? buildDefaultScope();
}

function tryResolveStorefrontScope(scope?: StorefrontScope): StorefrontScope | null {
  try {
    return resolveStorefrontScope(scope);
  } catch {
    return null;
  }
}

export function buildStorefrontScopeHeaders(scope: StorefrontScope) {
  return {
    'x-tenant-id': scope.tenantId,
    'x-brand-id': scope.brandId,
    'x-store-id': scope.storeId,
    'x-market-code': scope.marketCode,
  };
}

function createStorefrontTransactionsClient(scope?: StorefrontScope) {
  const resolvedScope = resolveStorefrontScope(scope);
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: resolvedScope.tenantId,
    brandId: resolvedScope.brandId,
    storeId: resolvedScope.storeId,
    marketCode: resolvedScope.marketCode,
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
      return 'cash';
    case 'member_card':
      return 'member_card';
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
      return 'member_card';
    case 'CASH':
    case 'cash':
      return 'cash';
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
  const createdAtMs = parseTimestampMs(createdAt);
  if (createdAtMs === undefined) {
    return undefined;
  }
  return new Date(createdAtMs + PAYMENT_TIMEOUT_MS).toISOString();
}

function parseTimestampMs(value?: string) {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function resolveExpireAt(expireAt?: string, createdAt?: string) {
  if (parseTimestampMs(expireAt) !== undefined) {
    return expireAt;
  }
  return createdAt ? buildPaymentExpireAt(createdAt) : undefined;
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

  const orderCreatedAtMs = parseTimestampMs(aggregate.order.createdAt);
  if (
    aggregate.order.closeReason === 'PAYMENT_TIMEOUT' ||
    aggregate.order.status === 'CLOSED' ||
    (orderCreatedAtMs !== undefined && orderCreatedAtMs + PAYMENT_TIMEOUT_MS <= nowMs)
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
  const paymentRecord = aggregate.payment;
  const expireAt = status === 'pending' ? resolveExpireAt(paymentRecord?.expiresAt, createdAt) : undefined;

  const resolvedScope = tryResolveStorefrontScope();

  return {
    orderId: aggregate.order.orderId,
    orderCode: aggregate.order.orderNo ?? aggregate.order.orderId,
    amount,
    status,
    method,
    qrCode:
      status === 'pending'
        ? paymentRecord?.qrCodeUrl ?? paymentRecord?.paymentUrl
        : undefined,
    expireAt,
    paidAt: aggregate.payment?.completedAt ?? aggregate.order.paidAt,
    createdAt,
    storeId: resolvedScope?.storeId ?? DEFAULT_STOREFRONT_SCOPE.storeId,
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
  scope?: StorefrontScope,
): Promise<BusinessCashierMemberLookupResult | null> {
  const resolvedScope = resolveStorefrontScope(scope);
  const client = createBusinessClient(getDefaultApiBaseUrl());
  try {
    return await client.cashier.lookupMember(query, {
      cache: 'no-store',
      headers: buildStorefrontScopeHeaders(resolvedScope),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error instanceof Error ? error : new Error('会员查询失败，请稍后重试');
  }
}

export async function listStorefrontCashierProducts(
  scope?: StorefrontScope,
): Promise<StorefrontCashierProduct[]> {
  const resolvedScope = resolveStorefrontScope(scope);
  const client = createBusinessClient(getDefaultApiBaseUrl());
  const payload = await client.cashier.listProducts(
    { limit: 100 },
    {
      cache: 'no-store',
      headers: buildStorefrontScopeHeaders(resolvedScope),
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
  scope?: StorefrontScope,
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
  scope?: StorefrontScope,
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
  scope?: StorefrontScope,
) {
  const resolvedScope = resolveStorefrontScope(scope);
  return createBusinessClient(getDefaultApiBaseUrl()).orders.get(orderId, {
    cache: 'no-store',
    headers: buildStorefrontScopeHeaders(resolvedScope),
  });
}

/**
 * 前台收银优惠券预验证 — 调用 POST /coupons/redeem
 * 返回 null 表示验证服务不可用
 */
export async function validateStorefrontCoupon(
  couponCode: string,
  memberId: string,
  scope?: StorefrontScope,
): Promise<{ valid: boolean; message: string; discount?: number } | null> {
  const resolvedScope = resolveStorefrontScope(scope);
  const client = createStorefrontTransactionsClient(resolvedScope);
  try {
    const result = await client.postData<{
      valid: boolean;
      label?: string;
      discount: number;
      code?: string;
    }>('/coupons/redeem', {
      code: couponCode,
      memberId,
      amount: 0, // 预验证模式
    }, {
      headers: buildStorefrontScopeHeaders(resolvedScope),
    });
    return {
      valid: result.valid !== false,
      message: result.label ?? `优惠已应用 -¥${result.discount}`,
      discount: result.discount,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { valid: false, message: error.message };
    }
    return { valid: false, message: '优惠券验证失败' };
  }
}

/** 会员余额/积分概览信息 */
export interface MemberBalanceInfo {
  balance: number;       // 可用余额（分）
  points: number;        // 可用积分
  frozenPoints: number;  // 冻结积分
  couponCount: number;   // 可用优惠券张数
}

/**
 * 查询会员余额/积分概览 — 调用 GET /members/:memberId/balance
 * 返回 null 表示查询失败或会员不存在
 */
export async function getStorefrontMemberBalance(
  memberId: string,
  scope?: StorefrontScope,
): Promise<MemberBalanceInfo | null> {
  try {
    const client = createStorefrontTransactionsClient(scope);
    return await client.getData<MemberBalanceInfo>(
      `/members/${memberId}/balance`,
      {
        cache: 'no-store',
      },
    );
  } catch {
    return null;
  }
}

/**
 * 前台发起退款请求
 */
export async function requestStorefrontRefund(
  orderId: string,
  paymentId: string,
  amountCents: number,
  reason: string,
  scope?: StorefrontScope,
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const client = createBusinessClient(getDefaultApiBaseUrl());
    const result = await client.cashier.createRefund(orderId, {
      paymentId,
      amountCents,
      reason,
    }, {
      cache: 'no-store',
      headers: buildStorefrontScopeHeaders(resolveStorefrontScope(scope)),
    });
    return { success: true, refundId: result.refundId };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : '退款请求失败';
    return { success: false, error: message };
  }
}
