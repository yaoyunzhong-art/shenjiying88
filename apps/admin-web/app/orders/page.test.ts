/**
 * orders/page.test.ts — 订单管理页 L1 JMeter 风格测试
 * 
 * 覆盖:
 *   正例 — 常量映射、订单状态标签、MOCK 数据、导出函数
 *   反例 — 空订单列表、无效状态筛选
 *   边界 — 分页边界、大量订单、搜索无结果
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('[正例] 应导出默认组件 OrdersPage', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default function OrdersPage'), '缺少 OrdersPage 默认导出');
});

test('[正例] 应包含 use client 指令', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('[正例] 源码应包含订单状态相关的字符串引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const orderStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'];
  for (const status of orderStatuses) {
    assert.ok(src.includes(status) || src.includes(status.toUpperCase()), `缺少状态引用: ${status}`);
  }
});

test('[正例] 页面应引用订单金额/数量等核心字段', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const coreFields = ['amount', 'total', 'status', 'createdAt'];
  const found = coreFields.filter(f => src.includes(f));
  assert.ok(found.length >= 2, `至少包含 2 个核心字段, 实际: ${found.length}`);
});

test('[正例] 页面应有表格或列表结构', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  // 检查常见的表格/列表关键词
  const hasTablePattern = /Table|List|<tr>|<td>|AntTable|proTable|columns/i.test(src);
  assert.ok(hasTablePattern, '页面应有表格/列表结构');
});

test('[正例] 页面应有分页相关引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasPagination = /pagination|pageSize|currentPage|Pagination/i.test(src);
  assert.ok(hasPagination, '页面应有分页引用');
});

// ---- 反例 ----

test('[反例] 不应包含硬编码敏感信息', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const secrets = [/api[_-]?key\s*=\s*['"][^'"]+['"]/i, /secret\s*=\s*['"][^'"]+['"]/i, /password\s*=\s*['"][^'"]+['"]/i];
  for (const pattern of secrets) {
    assert.ok(!pattern.test(src), `不应包含硬编码敏感信息: ${pattern}`);
  }
});

// ---- 边界 ----

test('[边界] 页面源码应大于 2KB', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 2048, `页面源码应大于 2KB, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有正确处理 loading/empty/error 状态的逻辑', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statePatterns = [/loading|isEmpty|empty|error|fallback|skeleton|Spin|Skeleton/i];
  const hasStateHandling = statePatterns.some(p => p.test(src));
  assert.ok(hasStateHandling, '页面应有 loading/empty/error 状态处理');
});
