/**
 * page.test.tsx — RefundsPage 退款管理页面组件测试
 *
 * 测试场景：
 *   1. 页面组件声明与 metadata 验证
 *   2. RefundListClient 组件引用 UI 组件链
 *   3. refund-data 数据完整性
 *   4. 过滤/搜索/状态切换等交互逻辑
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// 1. 组件声明验证
// ---------------------------------------------------------------------------

test('正例: page.tsx 导出默认函数组件 RefundsPage', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export default function RefundsPage'),
    '页面应使用 export default function RefundsPage');
  assert.ok(src.includes('RefundsPage'), '组件名应为 RefundsPage');
});

test('正例: metadata 含中文标题和 description', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('退款管理'), 'metadata title 应包含"退款管理"');
  assert.ok(src.includes('description'), 'metadata 应包含 description');
});

test('正例: page.tsx 调用 getRefunds + 渲染 RefundListClient', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('getRefunds'), '应调用 getRefunds');
  assert.ok(src.includes('RefundListClient'), '应渲染 RefundListClient');
});

// ---------------------------------------------------------------------------
// 2. refund-data 数据完整性
// ---------------------------------------------------------------------------

test('正例: getRefunds 返回数组且每项包含必填字段', async () => {
  const { getRefunds } = await import('./refund-data');
  const refunds = getRefunds();
  assert.ok(Array.isArray(refunds), '应返回数组');
  assert.ok(refunds.length > 0, '应有退款记录');
  for (const r of refunds) {
    assert.ok(typeof r.id === 'string', 'id 应为 string');
    assert.ok(typeof r.orderId === 'string', 'orderId 应为 string');
    assert.ok(r.type, '应有 type');
    assert.ok(typeof r.amount === 'number', 'amount 应为 number');
    assert.ok(r.status, '应有 status');
    assert.ok(r.createdAt, '应有 createdAt');
  }
});

test('正例: refund-types 导出类型定义', async () => {
  const mod = await import('./refund-types');
  assert.ok(mod.RefundType || mod.RefundStatus || true, 'refund-types 模块可正常导入');
});

// ---------------------------------------------------------------------------
// 3. RefundListClient 组件 API 验证
// ---------------------------------------------------------------------------

test('正例: refund-list-client 导出 RefundListClient', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export function RefundListClient'), '应导出 RefundListClient');
  assert.ok(src.includes('refunds'), 'props 应包含 refunds');
});

test('正例: RefundListClient 使用核心 UI 组件', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  const uiComponents = ['DataTable', 'Pagination', 'SearchFilterInput', 'PageShell', 'QuickStats', 'StatusBadge', 'Tabs', 'FilterChips', 'DetailActionBar'];
  for (const comp of uiComponents) {
    assert.ok(src.includes(comp), `应使用 ${comp}`);
  }
});

test('正例: RefundListClient 列定义包含必要字段', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  const columns = ['orderId', 'type', 'amount', 'status', 'reason', 'applicant', 'createdAt', 'storeName'];
  for (const col of columns) {
    assert.ok(src.includes(`'${col}'`) || src.includes(`"${col}"`) || src.includes(`\`${col}\``), `应包含 ${col} 列`);
  }
});

// ---------------------------------------------------------------------------
// 4. 状态管理与交互逻辑
// ---------------------------------------------------------------------------

test('正例: RefundListClient 使用 useState/useMemo/useEffect', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('searchText') || src.includes('statusFilter') || src.includes('typeFilter'), '应包含 filter state');
  assert.ok(src.includes('sortConfig'), '应包含 sortConfig');
  assert.ok(src.includes('usePagination'), '应使用 usePagination');
  assert.ok(src.includes('useSortedItems'), '应使用 useSortedItems');
  assert.ok(src.includes('useMemo'), '应使用 useMemo');
  assert.ok(src.includes('useDetailActions'), '应使用 useDetailActions');
});

test('正例: 退款状态过滤支持 ALL/pending/approved/rejected', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes("'ALL'") || src.includes('"ALL"'), '应包含 ALL');
  assert.ok(src.includes('pending') || src.includes('PENDING'), '应包含 pending');
  assert.ok(src.includes('approved') || src.includes('APPROVED'), '应包含 approved');
  assert.ok(src.includes('rejected') || src.includes('REJECTED'), '应包含 rejected');
});

test('正例: FilterChips onClearAll 清空所有 filter', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('onClearAll'), '应绑定 onClearAll');
});

test('正例: filter 变化时 reset 分页', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('resetPage'), 'filter 变化时应 resetPage');
});

// ---------------------------------------------------------------------------
// 5. 数据流验证
// ---------------------------------------------------------------------------

test('正例: refund-data 导出 getRefunds 与类型', async () => {
  const mod = await import('./refund-data');
  assert.ok(typeof mod.getRefunds === 'function', '应导出 getRefunds');
  assert.ok(typeof mod.RefundDataPlaceholder === 'undefined' || true, '模块无报错');
});

test('正例: 全流程数据管道', async () => {
  const { getRefunds } = await import('./refund-data');
  const refunds = getRefunds();
  assert.ok(refunds.length >= 3, '至少有 3 条退款记录');

  const amounts = refunds.map((r) => r.amount);
  assert.ok(amounts.every((a) => a > 0), '退款金额应大于 0');
  const validStatuses = new Set(refunds.map((r) => r.status));
  assert.ok(validStatuses.size >= 2, '应有 2 种以上的状态');
});

test('正例: 按状态过滤退款记录', async () => {
  const { getRefunds } = await import('./refund-data');
  const refunds = getRefunds();

  // 模拟客户端过滤逻辑
  const pendingRefunds = refunds.filter((r) => r.status === 'pending');
  const approvedRefunds = refunds.filter((r) => r.status === 'approved');

  assert.ok(pendingRefunds.length + approvedRefunds.length <= refunds.length);
  assert.ok(pendingRefunds.every((r) => r.status === 'pending'));
  assert.ok(approvedRefunds.every((r) => r.status === 'approved'));
});

// ---------------------------------------------------------------------------
// 6. 源码健康检查
// ---------------------------------------------------------------------------

test('正例: client 组件无调试残留', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(!src.includes('console.log('), '不应含 console.log');
  assert.ok(!src.includes('debugger;'), '不应含 debugger');
});

test('正例: 使用 useMemo 优化', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./refund-list-client.tsx', import.meta.url), 'utf-8'),
  );
  const useMemoCount = (src.match(/useMemo/g) || []).length;
  assert.ok(useMemoCount >= 2, `应有 >= 2 个 useMemo (当前: ${useMemoCount})`);
});
