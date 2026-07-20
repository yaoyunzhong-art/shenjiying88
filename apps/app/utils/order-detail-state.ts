import type { OrderDetailRouteParams } from './order-route';
import {
  buildRuntimeFallbackOrderDetail,
  type OrderDetailViewModel,
} from './order-view';

export const mockOrderDetails: Record<string, OrderDetailViewModel> = {
  'order-001': {
    orderId: 'order-001',
    orderNo: 'ORD20260612001',
    paidAmount: 156.00,
    refundedAmount: 0,
    status: 'PAID',
    createdAt: '2026-06-12T10:30:00.000Z',
    paidAt: '2026-06-12T10:35:00.000Z',
    totalAmount: 156.00,
    currency: 'CNY',
    paymentChannel: 'WECHAT_PAY',
    memberId: 'member-001',
    memberNickname: '张三',
    itemCount: 4,
    items: [
      { skuId: 'SKU001', title: '拿铁咖啡', quantity: 2, price: 32.00 },
      { skuId: 'SKU002', title: '提拉米苏', quantity: 1, price: 48.00 },
      { skuId: 'SKU003', title: '鲜榨橙汁', quantity: 1, price: 44.00 },
    ],
    pointsEarned: 156,
  },
  'order-002': {
    orderId: 'order-002',
    orderNo: 'ORD20260612002',
    paidAmount: 0,
    refundedAmount: 0,
    status: 'PENDING',
    createdAt: '2026-06-12T11:15:00.000Z',
    totalAmount: 89.50,
    currency: 'CNY',
    paymentChannel: 'WECHAT_PAY',
    memberId: 'member-002',
    memberNickname: '李四',
    itemCount: 3,
    items: [
      { skuId: 'SKU101', title: '美式咖啡', quantity: 1, price: 26.00 },
      { skuId: 'SKU102', title: '牛角包', quantity: 2, price: 31.75 },
    ],
    pointsEarned: 0,
  },
  'order-003': {
    orderId: 'order-003',
    orderNo: 'ORD20260611001',
    paidAmount: 320.00,
    refundedAmount: 320.00,
    status: 'REFUNDED',
    createdAt: '2026-06-11T14:20:00.000Z',
    paidAt: '2026-06-11T14:25:00.000Z',
    totalAmount: 320.00,
    currency: 'CNY',
    paymentChannel: 'ALIPAY',
    memberId: 'member-003',
    memberNickname: '王五',
    itemCount: 7,
    items: [
      { skuId: 'SKU201', title: '蛋白棒', quantity: 4, price: 35.00 },
      { skuId: 'SKU202', title: '运动饮料', quantity: 3, price: 60.00 },
    ],
    pointsEarned: 320,
  },
  'order-004': {
    orderId: 'order-004',
    orderNo: 'ORD20260610001',
    paidAmount: 68.00,
    refundedAmount: 0,
    status: 'PAID',
    createdAt: '2026-06-10T09:45:00.000Z',
    paidAt: '2026-06-10T09:47:00.000Z',
    totalAmount: 68.00,
    currency: 'CNY',
    paymentChannel: 'CASH',
    memberId: 'member-004',
    memberNickname: '赵六',
    itemCount: 3,
    items: [
      { skuId: 'SKU301', title: '矿泉水', quantity: 1, price: 8.00 },
      { skuId: 'SKU302', title: '能量胶', quantity: 2, price: 30.00 },
    ],
    pointsEarned: 68,
  },
};

export const defaultMockOrderDetail = mockOrderDetails['order-001']!;

export function resolveOrderDetailBaseOrder(
  routeParams?: OrderDetailRouteParams,
): OrderDetailViewModel {
  const matchedMockOrder = routeParams?.orderId ? mockOrderDetails[routeParams.orderId] : undefined;

  return matchedMockOrder ?? buildRuntimeFallbackOrderDetail(routeParams, {
    currency: 'CNY',
    paymentChannel: 'WECHAT_PAY',
    memberId: 'member-unknown',
    memberNickname: '未知会员',
    items: [],
    itemCount: 0,
  });
}
