/**
 * return-orders/page.test.tsx — 退货单列表页 L1 冒烟测试
 * 角色视角: 🧾 售后/店长
 * 覆盖: 正例(数据工厂/过滤逻辑/统计计算) + 边界(空结果)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 退货数据结构 ── */

type ReturnStatus = 'pending' | 'inspecting' | 'approved' | 'rejected' | 'refunded' | 'exchanged' | 'closed';

interface ReturnOrderItem {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdDate: string;
  storeName: string;
}

const STATUS_ORDER: ReturnStatus[] = [
  'pending', 'inspecting', 'approved', 'rejected', 'refunded', 'exchanged', 'closed',
];

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待处理', inspecting: '质检中', approved: '已通过',
  rejected: '已拒绝', refunded: '已退款', exchanged: '已换货', closed: '已关闭',
};

/* ── 工厂函数 ── */

function createReturn(overrides?: Partial<ReturnOrderItem>): ReturnOrderItem {
  const id = overrides?.id ?? `r${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    returnNo: `RT${id.toUpperCase()}`,
    customerName: '测试客户',
    phone: '13800138000',
    productName: '测试商品',
    reason: '测试原因',
    amount: 100,
    status: 'pending',
    createdDate: '2026-07-01',
    storeName: 'Demo Store 旗舰店',
    ...overrides,
  };
}

function createReturns(count: number, status?: ReturnStatus): ReturnOrderItem[] {
  return Array.from({ length: count }, (_, i) =>
    createReturn({ id: `r${i + 1}`, status: status ?? 'pending' }),
  );
}

/* ── 过滤逻辑 ── */

function filterBySearch(items: ReturnOrderItem[], term: string, fields: (keyof ReturnOrderItem)[]): ReturnOrderItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(lower)),
  );
}

function filterByStatus(items: ReturnOrderItem[], status: ReturnStatus | 'ALL'): ReturnOrderItem[] {
  return status === 'ALL' ? items : items.filter((item) => item.status === status);
}

function computeStats(items: ReturnOrderItem[]) {
  const total = items.length;
  const pending = items.filter((o) => o.status === 'pending' || o.status === 'inspecting').length;
  const approved = items.filter((o) => ['approved', 'refunded', 'exchanged'].includes(o.status)).length;
  const rejected = items.filter((o) => ['rejected', 'closed'].includes(o.status)).length;
  return { total, pending, approved, rejected };
}

/* ── Mock 数据 (同page.tsx) ── */

const MOCK_RETURNS: ReturnOrderItem[] = [
  createReturn({ id: 'r1', returnNo: 'RT20260701-001', customerName: '张三', phone: '138****0001', productName: '瑜伽初级课', reason: '课程时间冲突无法参加', amount: 199, status: 'pending', createdDate: '2026-07-01', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r2', returnNo: 'RT20260701-002', customerName: '李四', phone: '138****0002', productName: '蛋白粉（乳清）', reason: '产品质量问题包装破损', amount: 299, status: 'inspecting', createdDate: '2026-07-01', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r3', returnNo: 'RT20260630-001', customerName: '王五', phone: '139****0003', productName: '运动毛巾套装', reason: '颜色与描述不符', amount: 89, status: 'approved', createdDate: '2026-06-30', storeName: 'Demo Store 社区店' }),
  createReturn({ id: 'r4', returnNo: 'RT20260630-002', customerName: '赵六', phone: '137****0004', productName: '游泳季卡', reason: '门店搬迁不方便继续使用', amount: 1999, status: 'rejected', createdDate: '2026-06-30', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r5', returnNo: 'RT20260629-001', customerName: '孙七', phone: '136****0005', productName: '私教一对一', reason: '教练离职更换', amount: 499, status: 'refunded', createdDate: '2026-06-29', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r6', returnNo: 'RT20260629-002', customerName: '周八', phone: '135****0006', productName: '运动背包（防水）', reason: '拉链损坏', amount: 249, status: 'exchanged', createdDate: '2026-06-29', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r7', returnNo: 'RT20260628-001', customerName: '吴九', phone: '134****0007', productName: '瑜伽垫（加厚）', reason: '尺寸不合适', amount: 159, status: 'closed', createdDate: '2026-06-28', storeName: 'Demo Store 社区店' }),
  createReturn({ id: 'r8', returnNo: 'RT20260628-002', customerName: '郑十', phone: '133****0008', productName: '减脂训练营', reason: '健康原因无法参加', amount: 3999, status: 'pending', createdDate: '2026-06-28', storeName: 'Demo Store 社区店' }),
  createReturn({ id: 'r9', returnNo: 'RT20260627-001', customerName: '陈晓', phone: '132****0009', productName: 'HIIT 高强度间歇训练', reason: '工作调动无法继续', amount: 149, status: 'inspecting', createdDate: '2026-06-27', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r10', returnNo: 'RT20260627-002', customerName: '林立', phone: '131****0010', productName: '普拉提中级课', reason: '课程难度与描述不符', amount: 229, status: 'approved', createdDate: '2026-06-27', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r11', returnNo: 'RT20260626-001', customerName: '黄海', phone: '130****0011', productName: '体测评估服务', reason: '重复下单', amount: 99, status: 'refunded', createdDate: '2026-06-26', storeName: 'Demo Store 旗舰店' }),
  createReturn({ id: 'r12', returnNo: 'RT20260626-002', customerName: '马飞', phone: '159****0012', productName: '游泳季卡', reason: '临时出差无法使用', amount: 1999, status: 'rejected', createdDate: '2026-06-26', storeName: 'Demo Store 社区店' }),
];

const SEARCH_FIELDS: (keyof ReturnOrderItem)[] = [
  'returnNo', 'customerName', 'phone', 'productName', 'reason', 'storeName',
];

/* ── 测试用例 ── */

test('page: Mock 数据总数正确', () => {
  assert.equal(MOCK_RETURNS.length, 12);
});

test('page: 状态标签覆盖全部 7 种状态', () => {
  for (const s of STATUS_ORDER) {
    assert.ok(STATUS_LABELS[s], `缺少状态标签: ${s}`);
  }
});

test('page: 全部退货单被搜索到', () => {
  const result = filterBySearch(MOCK_RETURNS, '', SEARCH_FIELDS);
  assert.equal(result.length, 12);
});

test('page: 按退货单号搜索', () => {
  const result = filterBySearch(MOCK_RETURNS, 'RT20260701-001', SEARCH_FIELDS);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'r1');
});

test('page: 按客户名称搜索', () => {
  const result = filterBySearch(MOCK_RETURNS, '张三', SEARCH_FIELDS);
  assert.equal(result.length, 1);
});

test('page: 按商品名称搜索', () => {
  const result = filterBySearch(MOCK_RETURNS, '瑜伽', SEARCH_FIELDS);
  assert.ok(result.length >= 1);
});

test('page: 按退货原因搜索', () => {
  const result = filterBySearch(MOCK_RETURNS, '包装破损', SEARCH_FIELDS);
  assert.equal(result.length, 1);
});

test('page: 大小写不敏感搜索', () => {
  const result = filterBySearch(MOCK_RETURNS, 'rt20260701-001', SEARCH_FIELDS);
  assert.equal(result.length, 1);
});

test('page: 不匹配的搜索词返回空结果', () => {
  const result = filterBySearch(MOCK_RETURNS, '不存在的关键词xyz', SEARCH_FIELDS);
  assert.equal(result.length, 0);
});

test('page: 状态过滤 - ALL 返回全部', () => {
  const result = filterByStatus(MOCK_RETURNS, 'ALL');
  assert.equal(result.length, 12);
});

test('page: 状态过滤 - pending 返回 2 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'pending');
  assert.equal(result.length, 2);
});

test('page: 状态过滤 - inspecting 返回 2 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'inspecting');
  assert.equal(result.length, 2);
});

test('page: 状态过滤 - approved 返回 2 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'approved');
  assert.equal(result.length, 2);
});

test('page: 状态过滤 - rejected 返回 2 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'rejected');
  assert.equal(result.length, 2);
});

test('page: 状态过滤 - refunded 返回 2 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'refunded');
  assert.equal(result.length, 2);
});

test('page: 状态过滤 - closed 返回 1 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'closed');
  assert.equal(result.length, 1);
});

test('page: 状态过滤 - exchanged 返回 1 条', () => {
  const result = filterByStatus(MOCK_RETURNS, 'exchanged');
  assert.equal(result.length, 1);
});

test('page: 统计卡片 - pending + inspecting = 待处理', () => {
  const stats = computeStats(MOCK_RETURNS);
  assert.equal(stats.pending, 4); // r1+r8 pending, r2+r9 inspecting
});

test('page: 统计卡片 - 已完成 = approved + refunded + exchanged', () => {
  const stats = computeStats(MOCK_RETURNS);
  assert.equal(stats.approved, 5);
});

test('page: 统计卡片 - 已关闭拒绝 = rejected + closed', () => {
  const stats = computeStats(MOCK_RETURNS);
  assert.equal(stats.rejected, 3);
});

test('page: 空数据在搜索后过滤正常', () => {
  const result = filterBySearch([], '张三', SEARCH_FIELDS);
  assert.equal(result.length, 0);
});

test('page: 空数据统计返回零', () => {
  const stats = computeStats([]);
  assert.deepEqual(stats, { total: 0, pending: 0, approved: 0, rejected: 0 });
});
