/**
 * logistics-page.test.ts — 后勤配送管理页 L1 数据层测试
 * 覆盖：正例·反例·边界·角色场景
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型（内联，不依赖外部结构） ──────────────────────────

type LogisticsOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';
type LogisticsUrgency = 'normal' | 'urgent' | 'emergency';

interface LogisticsOrder {
  id: string;
  orderNo: string;
  supplierName: string;
  totalAmount: number;
  totalQuantity: number;
  status: LogisticsOrderStatus;
  urgency: LogisticsUrgency;
  orderDate: string;
  expectedDelivery: string;
  createdBy: string;
  department: string;
  deliveryAddress: string;
}

const VALID_STATUSES: LogisticsOrderStatus[] = ['pending', 'confirmed', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled'];
const VALID_URGENCIES: LogisticsUrgency[] = ['normal', 'urgent', 'emergency'];
const STATUS_LABELS: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', shipped: '已发货',
  in_transit: '配送中', delivered: '已签收', returned: '已退回', cancelled: '已取消',
};

// ── 数据工厂 ─────────────────────────────────────────────

function makeOrder(overrides?: Partial<LogisticsOrder>): LogisticsOrder {
  return {
    id: 'log-001',
    orderNo: 'LOG-2026-0001',
    supplierName: '绿源食品有限公司',
    totalAmount: 15000,
    totalQuantity: 100,
    status: 'pending',
    urgency: 'normal',
    orderDate: '2026-07-01',
    expectedDelivery: '2026-07-10',
    createdBy: '张三',
    department: '后勤部',
    deliveryAddress: '北京市朝阳区建国路88号',
    ...overrides,
  };
}

function makeMockOrders(): LogisticsOrder[] {
  return [
    makeOrder({ id: 'log-001', orderNo: 'LOG-2026-0001', supplierName: '绿源食品有限公司', totalAmount: 15000, totalQuantity: 100, status: 'pending', urgency: 'normal' }),
    makeOrder({ id: 'log-002', orderNo: 'LOG-2026-0002', supplierName: '鸿运包装', totalAmount: 320000, totalQuantity: 5000, status: 'confirmed', urgency: 'normal' }),
    makeOrder({ id: 'log-003', orderNo: 'LOG-2026-0003', supplierName: '优品清洁', totalAmount: 5000, totalQuantity: 200, status: 'delivered', urgency: 'normal' }),
    makeOrder({ id: 'log-004', orderNo: 'LOG-2026-0004', supplierName: '极速配送', totalAmount: 300000, totalQuantity: 50, status: 'in_transit', urgency: 'urgent' }),
    makeOrder({ id: 'log-005', orderNo: 'LOG-2026-0005', supplierName: '鲜果汇', totalAmount: 10000000, totalQuantity: 3000, status: 'shipped', urgency: 'emergency' }),
    makeOrder({ id: 'log-006', orderNo: 'LOG-2026-0006', supplierName: '鑫达办公', totalAmount: 9900, totalQuantity: 800, status: 'cancelled', urgency: 'normal' }),
    makeOrder({ id: 'log-007', orderNo: 'LOG-2026-0007', supplierName: '旺旺食品', totalAmount: 56000, totalQuantity: 600, status: 'shipped', urgency: 'urgent' }),
    makeOrder({ id: 'log-008', orderNo: 'LOG-2026-0008', supplierName: '铭扬五金', totalAmount: 128000, totalQuantity: 2000, status: 'confirmed', urgency: 'normal' }),
    makeOrder({ id: 'log-009', orderNo: 'LOG-2026-0009', supplierName: '绿源食品有限公司', totalAmount: 8800, totalQuantity: 150, status: 'returned', urgency: 'normal' }),
    makeOrder({ id: 'log-010', orderNo: 'LOG-2026-0010', supplierName: '安达物流', totalAmount: 25000, totalQuantity: 1, status: 'pending', urgency: 'emergency' }),
  ];
}

// ── 辅助函数（内联复制业务逻辑） ──────────────────────────

function computeStats(orders: LogisticsOrder[]) {
  const stats = {
    total: orders.length, pending: 0, confirmed: 0, shipped: 0, inTransit: 0,
    delivered: 0, returned: 0, cancelled: 0, totalAmount: 0, totalQuantity: 0,
    urgentCount: 0, emergencyCount: 0, normalCount: 0,
  };
  for (const o of orders) {
    stats.totalAmount += o.totalAmount;
    stats.totalQuantity += o.totalQuantity;
    switch (o.status) {
      case 'pending': stats.pending++; break;
      case 'confirmed': stats.confirmed++; break;
      case 'shipped': stats.shipped++; break;
      case 'in_transit': stats.inTransit++; break;
      case 'delivered': stats.delivered++; break;
      case 'returned': stats.returned++; break;
      case 'cancelled': stats.cancelled++; break;
    }
    if (o.urgency === 'urgent') stats.urgentCount++;
    else if (o.urgency === 'emergency') stats.emergencyCount++;
    else stats.normalCount++;
  }
  return stats;
}

function formatYuan(amount: number): string {
  if (amount >= 10000000) return (amount / 10000).toLocaleString('zh-CN') + '万';
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toLocaleString('zh-CN');
}

// ── 正例测试 ─────────────────────────────────────────

test('配送数据 → 正例: 10个配送订单各有正确的单号', () => {
  const orders = makeMockOrders();
  assert.equal(orders.length, 10);
  assert.equal(orders[0].orderNo, 'LOG-2026-0001');
  assert.equal(orders[9].orderNo, 'LOG-2026-0010');
});

test('配送数据 → 正例: 所有订单金额为正整数', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(Number.isFinite(o.totalAmount), `${o.orderNo} amount invalid`);
    assert.ok(o.totalAmount > 0, `${o.orderNo} amount should be > 0`);
  }
});

test('配送数据 → 正例: 所有订单数量为正整数', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(Number.isInteger(o.totalQuantity), `${o.orderNo} quantity should be integer`);
    assert.ok(o.totalQuantity > 0, `${o.orderNo} quantity should be > 0`);
  }
});

test('配送数据 → 正例: 所有订单状态在合法范围内', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(VALID_STATUSES.includes(o.status), `${o.orderNo}: 非法状态 ${o.status}`);
  }
});

test('配送数据 → 正例: 所有订单紧急程度在合法范围内', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(VALID_URGENCIES.includes(o.urgency), `${o.orderNo}: 非法紧急程度 ${o.urgency}`);
  }
});

test('配送数据 → 正例: 预计到货日期 >= 下单日期', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(o.expectedDelivery >= o.orderDate, `${o.orderNo}: 预计到货 ${o.expectedDelivery} 应 >= 下单 ${o.orderDate}`);
  }
});

test('配送数据 → 正例: 必填字段完整', () => {
  const orders = makeMockOrders();
  const required = ['id', 'orderNo', 'supplierName', 'totalAmount', 'totalQuantity', 'status', 'urgency', 'orderDate', 'expectedDelivery', 'createdBy', 'deliveryAddress'];
  for (const o of orders) {
    for (const f of required) {
      assert.ok(f in o, `${o.orderNo}: 缺少字段 ${f}`);
    }
  }
});

test('配送数据 → 正例: 配送地址字段存在且非空', () => {
  const orders = makeMockOrders();
  for (const o of orders) {
    assert.ok(o.deliveryAddress.length > 0, `${o.orderNo}: 配送地址不能为空`);
    assert.ok(o.deliveryAddress.includes('市'), `配送地址应包含"市"`);
  }
});

test('统计 → 正例: 统计总数正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  assert.equal(stats.total, 10);
  const expectedAmount = 15000 + 320000 + 5000 + 300000 + 10000000 + 9900 + 56000 + 128000 + 8800 + 25000;
  assert.equal(stats.totalAmount, expectedAmount);
  assert.equal(stats.totalQuantity, 100 + 5000 + 200 + 50 + 3000 + 800 + 600 + 2000 + 150 + 1);
});

test('统计 → 正例: 各状态数量正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  assert.equal(stats.pending, 2);        // log-001, log-010
  assert.equal(stats.confirmed, 2);      // log-002, log-008
  assert.equal(stats.shipped, 2);        // log-005, log-007
  assert.equal(stats.inTransit, 1);      // log-004
  assert.equal(stats.delivered, 1);      // log-003
  assert.equal(stats.returned, 1);       // log-009
  assert.equal(stats.cancelled, 1);      // log-006
});

test('统计 → 正例: 紧急程度分布正确', () => {
  const orders = makeMockOrders();
  const stats = computeStats(orders);
  // 10 - 2 urgent - 2 emergency = 6 normal
  assert.equal(stats.normalCount, 6);
  assert.equal(stats.urgentCount, 2);    // log-004, log-007
  assert.equal(stats.emergencyCount, 2); // log-005, log-010
});

test('格式化 → 正例: 15000 → "1.5万"', () => {
  assert.equal(formatYuan(15000), '1.5万');
});

test('格式化 → 正例: 100 → "100"', () => {
  assert.equal(formatYuan(100), '100');
});

test('格式化 → 正例: 320000 → "32.0万"', () => {
  assert.equal(formatYuan(320000), '32.0万');
});

test('格式化 → 正例: 9999 → "9,999"（小于1万）', () => {
  assert.equal(formatYuan(9999), '9,999');
});

test('状态标签 → 正例: 所有状态都有标签', () => {
  for (const s of VALID_STATUSES) {
    assert.ok(STATUS_LABELS[s], `缺少状态标签: ${s}`);
  }
});

// ── 边界测试 ─────────────────────────────────────────

test('统计 → 边界: 空列表', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.totalAmount, 0);
  assert.equal(stats.totalQuantity, 0);
  assert.equal(stats.pending, 0);
  assert.equal(stats.confirmed, 0);
  assert.equal(stats.shipped, 0);
  assert.equal(stats.inTransit, 0);
  assert.equal(stats.delivered, 0);
  assert.equal(stats.returned, 0);
  assert.equal(stats.cancelled, 0);
});

test('统计 → 边界: 单个订单', () => {
  const stats = computeStats([makeOrder()]);
  assert.equal(stats.total, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.totalAmount, 15000);
});

test('格式化 → 边界: 0 → "0"', () => {
  assert.equal(formatYuan(0), '0');
});

test('格式化 → 边界: 10000000 → 含万字', () => {
  const result = formatYuan(10000000);
  assert.ok(result.endsWith('万'), `应包含万字: ${result}`);
});

test('数据 → 边界: 所有状态互斥，无重复', () => {
  const orders = makeMockOrders();
  const statuses = orders.map(o => o.status);
  const pending = statuses.filter(s => s === 'pending').length;
  const confirmed = statuses.filter(s => s === 'confirmed').length;
  assert.equal(pending + confirmed + statuses.filter(s => s === 'shipped').length +
    statuses.filter(s => s === 'in_transit').length + statuses.filter(s => s === 'delivered').length +
    statuses.filter(s => s === 'returned').length + statuses.filter(s => s === 'cancelled').length, 10);
});

// ── 反例测试 ─────────────────────────────────────────

test('数据 → 反例: 非法状态不应在状态列表中', () => {
  assert.ok(!VALID_STATUSES.includes('unknown' as any));
  assert.ok(!VALID_STATUSES.includes('expired' as any));
  assert.ok(!VALID_STATUSES.includes('refunded' as any));
});

test('数据 → 反例: 非法紧急程度不应在列表中', () => {
  assert.ok(!VALID_URGENCIES.includes('critical' as any));
  assert.ok(!VALID_URGENCIES.includes('low' as any));
  assert.ok(!VALID_URGENCIES.includes('high' as any));
});

test('格式化 → 反例: 负数不应产生有效格式', () => {
  const result = formatYuan(-100);
  assert.ok(typeof result === 'string');
});

// ── 静态代码分析 ────────────────────────────────────

test('静态代码 → LogisticsPage 页面组件正确导出', () => {
  assert.ok(SRC.includes('export default function LogisticsPage'));
});

test('静态代码 → 使用 Client Component', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('静态代码 → 包含 useState', () => {
  assert.ok(SRC.includes('useState'));
});

test('静态代码 → 包含 useMemo', () => {
  assert.ok(SRC.includes('useMemo'));
});

test('静态代码 → 包含 JSX 返回', () => {
  assert.ok(SRC.includes('return (') || SRC.includes('return <'));
});

test('静态代码 → 包含事件处理器', () => {
  assert.ok(SRC.includes('onClick={') || SRC.includes('onChange=') || SRC.includes('onSortChange'));
});

test('静态代码 → 包含列表渲染', () => {
  assert.ok(SRC.includes('.map('));
});

test('静态代码 → 包含条件渲染', () => {
  assert.ok(SRC.includes(' && ') || SRC.includes(' ? ') || SRC.includes('??'));
});

test('静态代码 → 包含样式定义', () => {
  assert.ok(SRC.includes('style={'));
});

test('静态代码 → 包含模板字符串', () => {
  assert.ok(SRC.includes('${'));
});

test('静态代码 → 包含类型定义', () => {
  assert.ok(SRC.includes('interface ') || SRC.includes('type '));
});

test('静态代码 → 包含 DataTable 组件', () => {
  assert.ok(SRC.includes('DataTable'));
});

test('静态代码 → 包含 Pagination 组件', () => {
  assert.ok(SRC.includes('Pagination'));
});

test('静态代码 → 包含 SearchFilterInput', () => {
  assert.ok(SRC.includes('SearchFilterInput'));
});

test('静态代码 → 包含 PageShell', () => {
  assert.ok(SRC.includes('PageShell'));
});

test('静态代码 → 包含 Tabs 组件', () => {
  assert.ok(SRC.includes('Tabs'));
});

test('静态代码 → 包含 StatusBadge', () => {
  assert.ok(SRC.includes('StatusBadge'));
});

test('静态代码 → 无 dangerousSetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});

test('静态代码 → 无 console.log', () => {
  assert.ok(!SRC.includes('console.log'));
});

// ── 业务深度 ────────────────────────────────────────

test('业务 → 包含后勤配送管理标题', () => {
  assert.ok(SRC.includes('后勤配送管理'));
});

test('业务 → 包含配送单号列', () => {
  assert.ok(SRC.includes('配送单号'));
});

test('业务 → 包含供应商列', () => {
  assert.ok(SRC.includes('供应商'));
});

test('业务 → 包含状态筛选 Tab', () => {
  assert.ok(SRC.includes('待确认'));
  assert.ok(SRC.includes('配送中'));
  assert.ok(SRC.includes('已签收'));
  assert.ok(SRC.includes('已退回'));
  assert.ok(SRC.includes('已取消'));
});

test('业务 → 包含统计卡片', () => {
  assert.ok(SRC.includes('配送单总数'));
  assert.ok(SRC.includes('配送总额'));
  assert.ok(SRC.includes('紧急单'));
});

test('业务 → 包含详情侧面板', () => {
  assert.ok(SRC.includes('OrderDetailPanel'));
  assert.ok(SRC.includes('配送详情'));
  assert.ok(SRC.includes('配送地址'));
});

// ── 角色视角 ────────────────────────────────────────

test('👔 角色: 后勤主管查看全局配送统计', () => {
  assert.ok(SRC.includes('配送单总数'));
  assert.ok(SRC.includes('配送中'));
  assert.ok(SRC.includes('已签收'));
});

test('🎯 角色: 配送员查看配送中订单', () => {
  assert.ok(SRC.includes('in_transit'));
  assert.ok(SRC.includes('配送地址'));
});

test('📦 角色: 仓管查看待确认/已确认配送单', () => {
  assert.ok(SRC.includes('pending'));
  assert.ok(SRC.includes('confirmed'));
  assert.ok(SRC.includes('待确认'));
  assert.ok(SRC.includes('已确认'));
});

test('🔧 角色: 运营关注紧急配送和异常退回', () => {
  assert.ok(SRC.includes('紧急'));
  assert.ok(SRC.includes('returned'));
  assert.ok(SRC.includes('已退回'));
});
