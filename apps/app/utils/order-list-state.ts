import type { NativeAppOrderListQuery } from '../market-bootstrap';
import type { OrderSummaryViewModel } from './order-view';

export type OrderStatus = 'ALL' | 'PENDING' | 'PAID' | 'REFUNDED';
export type OrderDateRange = 'ALL_TIME' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

export const orderStatusFilters: Array<{ id: OrderStatus; label: string }> = [
  { id: 'ALL', label: '全部' },
  { id: 'PENDING', label: '待支付' },
  { id: 'PAID', label: '已完成' },
  { id: 'REFUNDED', label: '已退款' },
];

export const orderDateRangeFilters: Array<{ id: OrderDateRange; label: string }> = [
  { id: 'ALL_TIME', label: '全部时间' },
  { id: 'LAST_7_DAYS', label: '近7天' },
  { id: 'LAST_30_DAYS', label: '近30天' },
];

export const mockOrderListSummaries: OrderSummaryViewModel[] = [
  {
    orderId: 'order-001',
    orderNo: 'ORD20260612001',
    totalAmount: 156,
    paidAmount: 156,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'PAID',
    createdAt: '2026-06-12T10:30:00.000Z',
    paidAt: '2026-06-12T10:35:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    itemCount: 3,
  },
  {
    orderId: 'order-002',
    orderNo: 'ORD20260612002',
    totalAmount: 89.5,
    paidAmount: 0,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'PENDING',
    createdAt: '2026-06-12T11:15:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    itemCount: 2,
  },
  {
    orderId: 'order-003',
    orderNo: 'ORD20260611001',
    totalAmount: 320,
    paidAmount: 320,
    refundedAmount: 320,
    currency: 'CNY',
    status: 'REFUNDED',
    createdAt: '2026-06-11T14:20:00.000Z',
    paidAt: '2026-06-11T14:25:00.000Z',
    paymentChannel: 'ALIPAY',
    itemCount: 5,
  },
  {
    orderId: 'order-004',
    orderNo: 'ORD20260610001',
    totalAmount: 68,
    paidAmount: 68,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'PAID',
    createdAt: '2026-06-10T09:45:00.000Z',
    paidAt: '2026-06-10T09:47:00.000Z',
    paymentChannel: 'CASH',
    itemCount: 1,
  },
];

export const ORDER_LIST_PAGE_SIZE = 10;

export function getOrderListNow(): Date {
  const mockedNow = (globalThis as {
    __mockOrderListNow?: string | number | Date;
  }).__mockOrderListNow;

  if (!mockedNow) {
    return new Date();
  }

  return mockedNow instanceof Date ? mockedNow : new Date(mockedNow);
}

export function buildOrderListQuery(
  filter: OrderStatus,
  range: OrderDateRange,
  page = 1,
  pageSize = ORDER_LIST_PAGE_SIZE,
): NativeAppOrderListQuery {
  const query: NativeAppOrderListQuery = {
    page,
    pageSize,
  };

  switch (filter) {
    case 'PENDING':
      query.status = 'PENDING_PAYMENT';
      break;
    case 'PAID':
      query.status = 'PAID';
      break;
    case 'REFUNDED':
      query.status = 'REFUNDED';
      break;
    default:
      break;
  }

  if (range !== 'ALL_TIME') {
    const now = getOrderListNow();
    const fromDate = new Date(now);
    const offsetDays = range === 'LAST_7_DAYS' ? 6 : 29;
    fromDate.setDate(fromDate.getDate() - offsetDays);
    query.fromDate = fromDate.toISOString();
    query.toDate = now.toISOString();
  }

  return query;
}

export function mergePagedOrders(
  previous: OrderSummaryViewModel[] | null,
  next: OrderSummaryViewModel[],
): OrderSummaryViewModel[] {
  const merged = [...(previous ?? [])];

  next.forEach((item) => {
    const existingIndex = merged.findIndex((order) => order.orderId === item.orderId);
    if (existingIndex >= 0) {
      merged[existingIndex] = item;
      return;
    }
    merged.push(item);
  });

  return merged;
}

export function filterOrderListByStatus(
  orders: OrderSummaryViewModel[],
  selectedFilter: OrderStatus,
): OrderSummaryViewModel[] {
  if (selectedFilter === 'ALL') {
    return orders;
  }

  return orders.filter((order) => {
    if (selectedFilter === 'REFUNDED') {
      return order.status === 'REFUNDED' || order.status === 'REFUND_PENDING';
    }
    return order.status === selectedFilter;
  });
}
