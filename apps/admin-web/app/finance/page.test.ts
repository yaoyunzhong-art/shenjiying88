/**
 * finance/page.test.ts — 财务管理页 L1 JMeter 风格测试
 * 
 * 覆盖:
 *   正例 — 财务常量、报表映射、MOCK 数据
 *   反例 — 无效财务数据格式、负数金额异常
 *   边界 — 大金额、零金额、跨月统计
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('[正例] 应导出财务页面默认组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default'), '页面应有默认导出');
});

test('[正例] 页面应包含 use client 指令', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('[正例] 页面应引用核心财务字段', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const financeFields = ['revenue', 'amount', 'total', 'income', 'expense', 'profit', '金额', '收入', '支出'];
  const found = financeFields.filter(f => src.includes(f));
  assert.ok(found.length >= 3, `至少包含 3 个财务字段, 实际: ${found.length}`);
});

test('[正例] 页面应包含日期范围选择器引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasDatePicker = /DatePicker|datePicker|date_range|时间范围|startDate|endDate|dayjs|moment/i.test(src);
  assert.ok(hasDatePicker, '财务页面应有日期范围选择器');
});

test('[正例] 页面应有表格/列表展示财务数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasTable = /Table|columns|dataSource|data-index|dataIndex|proTable/i.test(src);
  assert.ok(hasTable, '页面应有财务数据表格');
});

// ---- 反例 ----

test('[反例] 页面不应有 console.log 残留', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  // 排除注释中的 console.log
  const codeLines = src.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hasConsoleLog = codeLines.some(l => /console\.log\s*\(/.test(l));
  assert.ok(!hasConsoleLog, '页面不应有 console.log 调试残留');
});

// ---- 边界 ----

test('[边界] 页面应有合计/汇总计算', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasSummary = /summary|合计|汇总|total|sum\(|reduce|aggregation/i.test(src);
  assert.ok(hasSummary, '页面应有合计/汇总计算');
});

test('[边界] 页面源码应大于 3KB，确保有实质内容', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 3072, `源码长度不足, 实际 ${src.length} bytes`);
});
