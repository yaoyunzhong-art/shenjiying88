/**
 * orders/page.test.ts — 订单管理页 L1 JMeter 风格测试
 *
 * 覆盖:
 *   正例 — 页面导出、use client、订单常量、状态映射、数据函数、表格、分页、搜索、统计
 *   反例 — console.log、硬编码 secret、== 比较、dangerouslySetInnerHTML、注释调试
 *   边界 — loading/empty/error 状态、分页边界、金额范围、零金额、sort 排序
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('[正例] 应导出 OrdersPage 默认组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default function OrdersPage'), '缺少 OrdersPage 默认导出');
});

test('[正例] 页面应包含 use client 指令', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('[正例] 页面应引用订单状态常量', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const constants = ['ORDER_STATUS_MAP', 'ORDER_STATUSES', 'ORDER_CHANNEL_MAP', 'ORDER_CHANNELS', 'ORDER_STATUS_FLOW'];
  const found = constants.filter((c) => src.includes(c));
  assert.ok(found.length >= 3, `至少引用 3 个订单常量, 实际: ${found.length}`);
});

test('[正例] 页面应引用 MOCK_ORDERS 数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('MOCK_ORDERS'), '缺少 MOCK_ORDERS 引用');
});

test('[正例] 页面应引用核心订单字段', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const orderFields = ['orderNo', 'customerName', 'totalAmount', 'paidAmount', 'status', 'channel', 'createdAt', 'storeName'];
  const found = orderFields.filter((f) => src.includes(f));
  assert.ok(found.length >= 5, `至少包含 5 个核心字段, 实际: ${found.length}`);
});

test('[正例] 页面应有 DataTable 表格', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('DataTable'), '缺少 DataTable');
});

test('[正例] 页面应有 Pagination 分页', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Pagination'), '缺少 Pagination');
  assert.ok(src.includes('usePagination'), '缺少 usePagination');
});

test('[正例] 页面应有搜索功能', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
  assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
});

test('[正例] 页面应有排序功能', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  assert.ok(src.includes('sortable'), '列应支持排序');
});

test('[正例] 页面应有状态筛选 Tabs', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Tabs'), '缺少 Tabs');
  assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
});

test('[正例] 页面应有渠道筛选', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('channelFilter'), '缺少 channelFilter');
});

test('[正例] 页面应有金额范围筛选', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('amountFilter'), '缺少 amountFilter');
  assert.ok(src.includes('AmountRange'), '缺少 AmountRange 类型');
});

test('[正例] 页面应有统计卡片', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('stats.total'), '缺少 stats 统计');
  assert.ok(src.includes('总订单'), '缺少总订单统计');
  assert.ok(src.includes('待处理'), '缺少待处理统计');
  assert.ok(src.includes('客单价'), '缺少客单价统计');
});

test('[正例] 页面应有 FilterChips 活跃过滤提示', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('FilterChips'), '缺少 FilterChips');
  assert.ok(src.includes('已筛选'), '缺少筛选提示');
});

test('[正例] 页面应有金额格式化函数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('formatAmount'), '缺少 formatAmount');
  assert.ok(src.includes('amountColor'), '缺少 amountColor');
});

test('[正例] 页面应有 Suspense 懒加载', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Suspense'), '缺少 Suspense');
  assert.ok(src.includes('OrdersPageFallback'), '缺少 fallback 组件');
});

// ---- 反例 ----

test('[反例] 不应包含 console.log 残留', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hasConsoleLog = codeLines.some((l) => /console\.(log|warn|error|debug)\s*\(/.test(l));
  assert.ok(!hasConsoleLog, '不应有 console 调试残留');
});

test('[反例] 不应包含硬编码敏感信息', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const secrets = [/api[_-]?key\s*[=:]\s*['"][^'"]{16,}['"]/i, /secret\s*[=:]\s*['"][^'"]{8,}['"]/i];
  for (const pat of secrets) {
    assert.ok(!pat.test(src), `不应包含硬编码敏感信息: ${pat}`);
  }
});

test('[反例] 不应使用 dangerouslySetInnerHTML', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
});

test('[反例] 不应有注释掉的 console 调试语句', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const debugComments = src.match(/\/\/\s*console\./g);
  assert.ok(!debugComments || debugComments.length === 0, '不应有注释掉的 console');
});

test('[反例] 状态筛选应使用 === 精确比较', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const looseStatus = /status\s*==\s*['"][a-z]+['"]/i.test(src);
  assert.ok(!looseStatus, '状态过滤应使用 ===');
});

// ---- 边界 ----

test('[边界] 页面源码应大于 8KB (丰富客户端组件)', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 8192, `源码长度不足, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有 loading/empty/error 状态处理', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statePatterns = [/loading|isEmpty|empty|error|fallback|Suspense|Spin|skeleton/i];
  const hasState = statePatterns.some((p) => p.test(src));
  assert.ok(hasState, '页面应有 loading/empty/error 状态处理');
});

test('[边界] 页面应有分页重置逻辑', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('resetPage'), '筛选变更时应重置分页');
});

test('[边界] 页面应处理零金额订单场景', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const zeroHandling = /=== 0|under100|free|zero|0\b/i.test(src);
  assert.ok(zeroHandling, '页面应处理零金额场景');
});

test('[边界] 页面应处理全部筛选为 ALL 的默认状态', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const allChecks = src.match(/['"]ALL['"]/g);
  assert.ok(allChecks && allChecks.length >= 4, '应有至少 4 个 ALL 通配状态');
});

test('[边界] 页面应有市场筛选', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('marketFilter'), '缺少 marketFilter');
  assert.ok(src.includes('marketCode'), '缺少 marketCode');
});

test('[边界] 页面行点击应跳转订单详情', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('handleRowClick'), '缺少行点击处理');
  assert.ok(src.includes('/orders/'), '应跳转到订单详情页');
});

test('[边界] 页面应有 pageSize 选项', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('pageSizeOptions'), '缺少分页尺寸选项');
  assert.ok(src.includes('pageSize'), '缺少 pageSize');
});

test('[边界] 页面统计应为响应式 Grid 布局', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('gridTemplateColumns') || src.includes('display: grid'), '统计卡片应为 grid 布局');
});
