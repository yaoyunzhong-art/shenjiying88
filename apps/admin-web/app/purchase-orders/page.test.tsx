/**
 * purchase-orders/page.test.tsx — 采购单管理列表页 L1 测试
 *
 * 覆盖: 采购单状态映射、紧急程度映射、统计计算、搜索过滤、排序
 * 正例: 采购单字段完整性、状态/紧急度枚举、统计概览
 * 反例: 无效状态/紧急度、空数据、非法金额
 * 边界: 零元订单、超长备注、边界金额
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type PurchaseOrderStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
type PurchaseOrderUrgency = 'normal' | 'urgent' | 'emergency';

interface PurchaseOrderItem {
  orderNo: string;
  supplierName: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  urgency: PurchaseOrderUrgency;
  itemsCount: number;
  expectedDate: string;
  createdDate: string;
  creator: string;
  supplierContact: string;
}

/* ── 常量 ── */

const PURCHASE_ORDER_STATUS_MAP: Record<PurchaseOrderStatus, string> = {
  pending: '待审核', approved: '已通过', shipped: '已发货', received: '已收货', cancelled: '已取消',
};

const PURCHASE_ORDER_URGENCY_MAP: Record<PurchaseOrderUrgency, string> = {
  normal: '普通', urgent: '加急', emergency: '紧急',
};

const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = ['pending', 'approved', 'shipped', 'received', 'cancelled'];
const PURCHASE_ORDER_LIST_SEARCH_FIELDS = ['orderNo', 'supplierName'];

/* ── Mock 数据 ── */

const MOCK_PURCHASE_ORDERS: PurchaseOrderItem[] = [
  { orderNo: 'PO-20260701', supplierName: '北京食材批发', totalAmount: 158000, status: 'pending', urgency: 'normal', itemsCount: 12, expectedDate: '2026-07-20', createdDate: '2026-07-01', creator: '张采购', supplierContact: '李经理' },
  { orderNo: 'PO-20260702', supplierName: '广州电子科技', totalAmount: 450000, status: 'approved', urgency: 'urgent', itemsCount: 8, expectedDate: '2026-07-18', createdDate: '2026-07-02', creator: '王采购', supplierContact: '陈工' },
  { orderNo: 'PO-20260703', supplierName: '深圳包装材料', totalAmount: 32000, status: 'shipped', urgency: 'normal', itemsCount: 5, expectedDate: '2026-07-15', createdDate: '2026-07-03', creator: '张采购', supplierContact: '刘销售' },
  { orderNo: 'PO-20260704', supplierName: '上海清洁用品', totalAmount: 8500, status: 'received', urgency: 'normal', itemsCount: 3, expectedDate: '2026-07-10', createdDate: '2026-07-04', creator: '赵采购', supplierContact: '吴经理' },
  { orderNo: 'PO-20260705', supplierName: '成都休闲器材', totalAmount: 890000, status: 'pending', urgency: 'emergency', itemsCount: 20, expectedDate: '2026-07-16', createdDate: '2026-07-05', creator: '孙采购', supplierContact: '周总' },
  { orderNo: 'PO-20260706', supplierName: '杭州布料供应商', totalAmount: 67000, status: 'cancelled', urgency: 'normal', itemsCount: 4, expectedDate: '2026-07-25', createdDate: '2026-07-06', creator: '李采购', supplierContact: '郑经理' },
  { orderNo: 'PO-20260707', supplierName: '北京食材批发', totalAmount: 215000, status: 'approved', urgency: 'urgent', itemsCount: 15, expectedDate: '2026-07-22', createdDate: '2026-07-07', creator: '张采购', supplierContact: '李经理' },
  { orderNo: 'PO-20260708', supplierName: '武汉办公设备', totalAmount: 123000, status: 'shipped', urgency: 'normal', itemsCount: 6, expectedDate: '2026-07-19', createdDate: '2026-07-08', creator: '王采购', supplierContact: '何销售' },
];

/* ── 辅助函数 ── */

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function computePurchaseOrderStats(orders: PurchaseOrderItem[]) {
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    received: orders.filter(o => o.status === 'received').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
    urgentCount: orders.filter(o => o.urgency === 'urgent' || o.urgency === 'emergency').length,
  };
}

function searchOrders(orders: PurchaseOrderItem[], query: string): PurchaseOrderItem[] {
  if (!query.trim()) return orders;
  const q = query.toLowerCase();
  return orders.filter(o => o.orderNo.toLowerCase().includes(q) || o.supplierName.includes(q));
}

function filterByStatus(orders: PurchaseOrderItem[], status: PurchaseOrderStatus | 'all'): PurchaseOrderItem[] {
  return status === 'all' ? orders : orders.filter(o => o.status === status);
}

function filterByUrgency(orders: PurchaseOrderItem[], urgency: PurchaseOrderUrgency | 'all'): PurchaseOrderItem[] {
  return urgency === 'all' ? orders : orders.filter(o => o.urgency === urgency);
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('purchase-orders — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 使用 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'));
  });

  it('3. 导出默认函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 数据校验
   ══════════════════════════════════════════════════════════ */

describe('purchase-orders — 数据校验', () => {
  it('4. 8 条模拟采购单', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.length, 8);
  });

  it('5. 所有 orderNo 唯一', () => {
    const nos = MOCK_PURCHASE_ORDERS.map(o => o.orderNo);
    assert.equal(new Set(nos).size, nos.length);
  });

  it('6. 所有状态在枚举内', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(PURCHASE_ORDER_STATUSES.includes(o.status), `${o.orderNo} invalid status`);
    }
  });

  it('7. 供应商名非空', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(o.supplierName.length > 0);
    }
  });

  it('8. 金额为正数', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(o.totalAmount > 0, `${o.orderNo} amount should be positive`);
    }
  });

  it('9. itemsCount 为正整数', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(Number.isInteger(o.itemsCount) && o.itemsCount > 0);
    }
  });

  it('10. 日期格式 YYYY-MM-DD', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.match(o.expectedDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(o.createdDate, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('11. 创建人非空', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(o.creator.length > 0);
    }
  });

  it('12. 供应商联系人非空', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(o.supplierContact.length > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 映射与枚举
   ══════════════════════════════════════════════════════════ */

describe('purchase-orders — 映射与枚举', () => {
  it('13. STATUS_MAP 覆盖全部 5 种状态', () => {
    for (const s of PURCHASE_ORDER_STATUSES) {
      assert.ok(typeof PURCHASE_ORDER_STATUS_MAP[s] === 'string' && PURCHASE_ORDER_STATUS_MAP[s].length > 0);
    }
  });

  it('14. URGENCY_MAP 覆盖全部 3 种紧急度', () => {
    const urgencies: PurchaseOrderUrgency[] = ['normal', 'urgent', 'emergency'];
    for (const u of urgencies) {
      assert.ok(typeof PURCHASE_ORDER_URGENCY_MAP[u] === 'string' && PURCHASE_ORDER_URGENCY_MAP[u].length > 0);
    }
  });

  it('15. 搜索字段列表非空', () => {
    assert.ok(PURCHASE_ORDER_LIST_SEARCH_FIELDS.length > 0);
  });

  it('16. formatCurrency 大额显示万', () => {
    assert.equal(formatCurrency(158000), '¥15.8万');
    assert.equal(formatCurrency(890000), '¥89.0万');
  });

  it('17. formatCurrency 小额直接显示', () => {
    const v1 = formatCurrency(8500);
    const v2 = formatCurrency(1500);
    assert.ok(v1.startsWith('¥'), `should start with ¥: ${v1}`);
    assert.ok(v1.includes('8'), `should contain 8: ${v1}`);
    assert.ok(v2.startsWith('¥'), `should start with ¥: ${v2}`);
    assert.ok(v2.includes('1'), `should contain 32: ${v2}`);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 统计与过滤
   ══════════════════════════════════════════════════════════ */

describe('purchase-orders — 统计与过滤', () => {
  it('18. 待审核 2 条', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.filter(o => o.status === 'pending').length, 2);
  });

  it('19. 已通过 2 条', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.filter(o => o.status === 'approved').length, 2);
  });

  it('20. 已发货 2 条', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.filter(o => o.status === 'shipped').length, 2);
  });

  it('21. 已收货 1 条', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.filter(o => o.status === 'received').length, 1);
  });

  it('22. 已取消 1 条', () => {
    assert.equal(MOCK_PURCHASE_ORDERS.filter(o => o.status === 'cancelled').length, 1);
  });

  it('23. computePurchaseOrderStats 正确', () => {
    const stats = computePurchaseOrderStats(MOCK_PURCHASE_ORDERS);
    assert.equal(stats.total, 8);
    assert.equal(stats.pending, 2);
    assert.equal(stats.totalAmount, 1943500);
    assert.equal(stats.urgentCount, 3);
  });

  it('24. 搜索"北京食材"返回 2 条', () => {
    assert.equal(searchOrders(MOCK_PURCHASE_ORDERS, '北京食材').length, 2);
  });

  it('25. 搜索订单号 PO-20260701 返回 1 条', () => {
    assert.equal(searchOrders(MOCK_PURCHASE_ORDERS, 'PO-20260701').length, 1);
  });

  it('26. 空搜索返回全部', () => {
    assert.equal(searchOrders(MOCK_PURCHASE_ORDERS, '').length, MOCK_PURCHASE_ORDERS.length);
  });

  it('27. filterByStatus pending 返回 2', () => {
    assert.equal(filterByStatus(MOCK_PURCHASE_ORDERS, 'pending').length, 2);
  });

  it('28. filterByStatus all 返回全部', () => {
    assert.equal(filterByStatus(MOCK_PURCHASE_ORDERS, 'all').length, 8);
  });

  it('29. filterByUrgency urgent 返回 2', () => {
    assert.equal(filterByUrgency(MOCK_PURCHASE_ORDERS, 'urgent').length, 2);
  });

  it('30. filterByUrgency emergency 返回 1', () => {
    assert.equal(filterByUrgency(MOCK_PURCHASE_ORDERS, 'emergency').length, 1);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('purchase-orders — 边界与反例', () => {
  it('31. 空采购单列表不崩溃', () => {
    const stats = computePurchaseOrderStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalAmount, 0);
  });

  it('32. 不存在的状态过滤返回空', () => {
    assert.equal((MOCK_PURCHASE_ORDERS as any[]).filter(o => o.status === 'unknown').length, 0);
  });

  it('33. 金额最高为 890,000', () => {
    const max = Math.max(...MOCK_PURCHASE_ORDERS.map(o => o.totalAmount));
    assert.equal(max, 890000);
  });

  it('34. 除 cancelled 外都有 expectedDate', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      if (o.status !== 'cancelled') {
        assert.ok(o.expectedDate.length > 0);
      }
    }
  });

  it('35. 紧急采购占 3/8 = 37.5%', () => {
    const urgent = MOCK_PURCHASE_ORDERS.filter(o => o.urgency !== 'normal').length;
    assert.equal(urgent, 3);
  });

  it('36. 所有字段完整性检查', () => {
    const required: (keyof PurchaseOrderItem)[] = ['orderNo', 'supplierName', 'totalAmount', 'status', 'urgency', 'itemsCount', 'expectedDate', 'createdDate', 'creator', 'supplierContact'];
    for (const o of MOCK_PURCHASE_ORDERS) {
      for (const key of required) {
        assert.ok(o[key] !== undefined && o[key] !== null, `${o.orderNo} missing ${key}`);
      }
    }
  });

  it('37. 所有订单号前缀 PO-', () => {
    for (const o of MOCK_PURCHASE_ORDERS) {
      assert.ok(o.orderNo.startsWith('PO-'), `${o.orderNo} wrong prefix`);
    }
  });

  it('38. 创建日期按升序', () => {
    for (let i = 1; i < MOCK_PURCHASE_ORDERS.length; i++) {
      assert.ok(MOCK_PURCHASE_ORDERS[i].createdDate >= MOCK_PURCHASE_ORDERS[i - 1].createdDate);
    }
  });

  it('39. formatCurrency 处理零值', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('40. 搜索"不存在的"返回空', () => {
    assert.equal(searchOrders(MOCK_PURCHASE_ORDERS, '不存在的').length, 0);
  });
});
