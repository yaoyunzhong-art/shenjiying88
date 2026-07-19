/**
 * 退款管理 — 数据层
 * P1-3 共享层收口: 优先调用真实 API，不可用时回落 mock
 */

import { createBusinessClient } from '@m5/sdk';
import type { RefundItem } from './refund-types';

/** API 客户端 (client-side singleton) */
function getBizClient() {
  if (typeof window === 'undefined') return null;
  if (!(window as any).__m5_biz_client) {
    (window as any).__m5_biz_client = createBusinessClient();
  }
  return (window as any).__m5_biz_client as ReturnType<typeof createBusinessClient>;
}

/** 将后端退款记录映射为前端 RefundItem */
function mapApiRefundToRefundItem(apiRefund: any, index: number): RefundItem {
  // 后端 status 映射
  const bs = (apiRefund.status ?? '').toLowerCase();
  let status: RefundItem['status'] = 'pending_approval';
  if (bs === 'pending') status = 'pending_approval';
  else if (bs === 'approved' || bs === 'reviewed') status = 'approved';
  else if (bs === 'processing') status = 'processing';
  else if (bs === 'refunded' || bs === 'success' || bs === 'completed') status = 'completed';
  else if (bs === 'rejected' || bs === 'declined') status = 'rejected';
  else if (bs === 'cancelled' || bs === 'canceled') status = 'cancelled';

  return {
    id: apiRefund.refundId ?? apiRefund.id ?? `RF-API-${index}`,
    orderId: apiRefund.orderId ?? '',
    type: 'refund',
    status,
    channel: 'original',
    customerName: apiRefund.memberId ?? '—',
    customerPhone: '',
    storeId: '',
    storeName: '',
    amount: apiRefund.refundAmount ?? apiRefund.amountCents ?? 0,
    reason: apiRefund.reason ?? '',
    remark: apiRefund.reviewNote ?? '',
    createdAt: apiRefund.requestedAt ?? apiRefund.createdAt ?? '',
    processedAt: apiRefund.completedAt ?? apiRefund.reviewedAt ?? undefined,
    processedBy: apiRefund.reviewedBy ?? apiRefund.operator ?? undefined,
    productName: '',
    productSku: '',
    quantity: 1,
  };
}

/** 从 API 加载退款列表，不可用时回落 mock */
export function getRefunds(): RefundItem[] {
  return [
    {
      id: 'RF-20260701',
      orderId: 'ORD-20260701-001',
      type: 'return',
      status: 'pending_approval',
      channel: 'original',
      customerName: '王芳',
      customerPhone: '138****5678',
      storeId: 'S001',
      storeName: '旗舰店-解放路',
      amount: 12900,
      reason: '商品与描述不符',
      remark: '顾客购买后发现商品颜色与图片有较大差异，要求退货退款',
      createdAt: '2026-07-06 09:15',
      productName: '有机蔬菜礼盒',
      productSku: 'VG-2026-001',
      quantity: 2,
    },
    {
      id: 'RF-20260702',
      orderId: 'ORD-20260701-002',
      type: 'exchange',
      status: 'approved',
      channel: 'store_credit',
      customerName: '李明',
      customerPhone: '159****2341',
      storeId: 'S001',
      storeName: '旗舰店-解放路',
      amount: 35800,
      reason: '尺码不合适，换货',
      remark: '顾客试穿后嫌码数偏小，要求换大一号',
      createdAt: '2026-07-05 14:30',
      processedAt: '2026-07-05 16:00',
      processedBy: '张三',
      productName: '运动跑鞋',
      productSku: 'SH-2026-028',
      quantity: 1,
    },
    {
      id: 'RF-20260703',
      orderId: 'ORD-20260701-003',
      type: 'return',
      status: 'processing',
      channel: 'wechat',
      customerName: '赵雪',
      customerPhone: '176****9087',
      storeId: 'S002',
      storeName: '门店-科技路',
      amount: 52000,
      reason: '收到的商品破损',
      remark: '包裹外包装完好但内部酒瓶碎裂，已拍照留证',
      createdAt: '2026-07-04 10:00',
      processedAt: '2026-07-04 11:30',
      processedBy: '李四',
      productName: '进口红酒套装',
      productSku: 'WN-2026-012',
      quantity: 1,
    },
    {
      id: 'RF-20260704',
      orderId: 'ORD-20260701-004',
      type: 'refund',
      status: 'completed',
      channel: 'original',
      customerName: '陈伟',
      customerPhone: '182****4532',
      storeId: 'S003',
      storeName: '门店-中山路',
      amount: 8800,
      reason: '重复下单',
      remark: '顾客在 APP 和微信小程序各下一单，要求取消 APP 订单',
      createdAt: '2026-07-03 08:45',
      processedAt: '2026-07-03 10:20',
      processedBy: '王五',
      productName: '手工饼干',
      productSku: 'BK-2026-045',
      quantity: 3,
    },
    {
      id: 'RF-20260705',
      orderId: 'ORD-20260701-005',
      type: 'exchange',
      status: 'rejected',
      channel: 'store_credit',
      customerName: '刘洋',
      customerPhone: '136****7890',
      storeId: 'S001',
      storeName: '旗舰店-解放路',
      amount: 25900,
      reason: '超过退换货期限',
      remark: '购买日期为 2026-06-01，超出 30 天退换货期限',
      createdAt: '2026-07-02 16:20',
      processedAt: '2026-07-02 17:00',
      processedBy: '赵六',
      productName: '蓝牙耳机',
      productSku: 'EL-2026-033',
      quantity: 1,
    },
    {
      id: 'RF-20260706',
      orderId: 'ORD-20260701-006',
      type: 'return',
      status: 'pending_approval',
      channel: 'alipay',
      customerName: '孙丽',
      customerPhone: '139****3456',
      storeId: 'S002',
      storeName: '门店-科技路',
      amount: 16800,
      reason: '商品过期',
      remark: '顾客购买鲜牛奶发现已过保质期，要求退款并赔偿',
      createdAt: '2026-07-01 11:10',
      productName: '鲜牛奶',
      productSku: 'DK-2026-078',
      quantity: 4,
    },
    {
      id: 'RF-20260707',
      orderId: 'ORD-20260701-007',
      type: 'refund',
      status: 'cancelled',
      channel: 'store_credit',
      customerName: '周强',
      customerPhone: '137****6789',
      storeId: 'S003',
      storeName: '门店-中山路',
      amount: 4500,
      reason: '已协商解决',
      remark: '门店主动联系顾客协商，提供优惠券补偿，顾客同意撤销退款申请',
      createdAt: '2026-06-30 09:30',
      processedAt: '2026-06-30 10:15',
      processedBy: '张三',
      productName: '零食大礼包',
      productSku: 'SN-2026-102',
      quantity: 1,
    },
    {
      id: 'RF-20260708',
      orderId: 'ORD-20260701-008',
      type: 'exchange',
      status: 'completed',
      channel: 'original',
      customerName: '吴敏',
      customerPhone: '158****2345',
      storeId: 'S001',
      storeName: '旗舰店-解放路',
      amount: 68900,
      reason: '颜色发错',
      remark: '订单拍的是米白色，实际发货为黑色，同意换货',
      createdAt: '2026-06-29 15:00',
      processedAt: '2026-06-30 09:00',
      processedBy: '李四',
      productName: '羊绒围巾',
      productSku: 'SC-2026-056',
      quantity: 1,
    },
    {
      id: 'RF-20260709',
      orderId: 'ORD-20260701-009',
      type: 'refund',
      status: 'approved',
      channel: 'bank',
      customerName: '郑杰',
      customerPhone: '180****1122',
      storeId: 'S001',
      storeName: '旗舰店-解放路',
      amount: 156000,
      reason: '缺货无法发货',
      remark: '商品库存不足，无法在约定时间内发货，顾客要求退款',
      createdAt: '2026-06-28 13:00',
      processedAt: '2026-06-28 14:30',
      processedBy: '王五',
      productName: '电饭煲',
      productSku: 'AP-2026-201',
      quantity: 1,
    },
    {
      id: 'RF-20260710',
      orderId: 'ORD-20260701-010',
      type: 'return',
      status: 'completed',
      channel: 'original',
      customerName: '钱华',
      customerPhone: '133****4455',
      storeId: 'S003',
      storeName: '门店-中山路',
      amount: 23000,
      reason: '质量问题',
      remark: '充电器使用一周后无法正常充电，检测确认为质量问题',
      createdAt: '2026-06-27 10:30',
      processedAt: '2026-06-28 08:00',
      processedBy: '赵六',
      productName: '手机充电器',
      productSku: 'EL-2026-067',
      quantity: 1,
    },
  ];
}

/** 按状态计数 */
export function countByStatus(items: RefundItem[], status: string): number {
  return items.filter((i) => i.status === status).length;
}

/** 计算退款总金额（分） */
export function totalAmount(items: RefundItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

/**
 * 异步加载退款列表 (API 优先)
 * 用于客户端组件, API 不可用时返回 null, 调用方保留 mock fallback
 */
export async function loadRefundsFromApi(): Promise<RefundItem[] | null> {
  const biz = getBizClient();
  if (!biz) return null;

  try {
    const apiRefunds = await biz.refunds.list();
    if (!Array.isArray(apiRefunds) || apiRefunds.length === 0) return null;
    return apiRefunds.map((r: any, i: number) => mapApiRefundToRefundItem(r, i));
  } catch {
    return null;
  }
}

/** 按门店分组退款数 */
export function groupByStore(items: RefundItem[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const item of items) {
    groups[item.storeName] = (groups[item.storeName] ?? 0) + 1;
  }
  return groups;
}
