import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve(import.meta.dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

test('详情页应接入真实聚合订单查询', () => {
  assert.ok(SRC.includes('getStorefrontOrderTransaction'), '应接入真实聚合查询');
  assert.ok(SRC.includes('mapAggregateToOrderDetailView'), '应使用共享详情映射 helper');
  assert.ok(SRC.includes('const loadDetail = useCallback'), '应存在真实详情加载函数');
});

test('详情页不应再保留 mock 编辑/删除/状态流转壳', () => {
  assert.equal(SRC.includes('MOCK_ORDERS'), false, '不应继续保留 MOCK_ORDERS');
  assert.equal(SRC.includes('handleStatusForward'), false, '不应继续保留假状态推进');
  assert.equal(SRC.includes('handleDelete'), false, '不应继续保留假删除');
  assert.equal(SRC.includes('enterEdit'), false, '不应继续保留假编辑入口');
});

test('详情页应渲染真实金额、商品和退款记录', () => {
  assert.ok(SRC.includes('订单金额'), '应展示订单金额');
  assert.ok(SRC.includes('实付金额'), '应展示实付金额');
  assert.ok(SRC.includes('已退金额'), '应展示已退金额');
  assert.ok(SRC.includes('商品清单'), '应展示商品清单');
  assert.ok(SRC.includes('退款记录'), '应展示退款记录');
});

test('详情页应保留返回列表和三态重试能力', () => {
  assert.ok(SRC.includes("router.push('/orders')"), '应支持返回订单列表');
  assert.ok(SRC.includes('TriStateRenderer'), '应使用 TriStateRenderer');
  assert.ok(SRC.includes('onRetry={() => {'), '应保留重试能力');
});
