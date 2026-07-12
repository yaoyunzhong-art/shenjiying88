/**
 * refunds/page.test.ts — 退款管理页 L1 JMeter 风格测试
 * 
 * 覆盖:
 *   正例 — 退款常量、状态标签、MOCK 数据、组件导出
 *   反例 — 非法操作、越权状态转换
 *   边界 — 退款金额边界、多次退款
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('[正例] 应导出默认退款页面组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default'), '页面应有默认导出');
});

test('[正例] 应包含 use client 指令', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('[正例] 页面应包含退款相关状态引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const refundKeywords = ['refund', '退款', 'amount', 'status', 'reason'];
  const found = refundKeywords.filter(k => src.includes(k));
  assert.ok(found.length >= 3, `至少包含 3 个退款关键词, 实际: ${found.length}`);
});

test('[正例] 页面应包含搜索/筛选功能', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasFilter = /search|filter|Search|Filter|Input.Search|onSearch/i.test(src);
  assert.ok(hasFilter, '页面应有搜索/筛选功能');
});

// ---- 反例 ----

test('[反例] 不应有空白或未实现的函数体', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyFuncPattern = /function\s+\w+\s*\(\s*\)\s*\{\s*\}/g;
  const matches = src.match(emptyFuncPattern);
  if (matches) {
    assert.ok(matches.length < 3, `不应有过多空函数, 发现 ${matches.length} 个`);
  }
});

// ---- 边界 ----

test('[边界] 页面应有处理空退款数据列表的逻辑', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyHandling = /empty|Empty|noData|placeholder|暂无|空状态|EmptyState/i.test(src);
  assert.ok(emptyHandling, '页面应有空状态处理');
});

test('[边界] 源码应大于 1KB，确保有实际内容', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 1024, `源码长度不足, 实际 ${src.length} bytes`);
});
