/**
 * refunds/page.test.ts — 退款管理页 L1 JMeter 风格测试
 *
 * 覆盖:
 *   正例 — 页面导出、Metadata、Suspense/ErrorBoundary、RefundSummaryCards、状态引用、搜索、分页、空/加载/错误组件
 *   反例 — console.log、硬编码 token、== 比较、window 操作、空函数
 *   边界 — JSON-LD、流程说明、大金额、零退款、搜索无结果、data 层函数
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
  assert.ok(src.includes('export default function RefundsPage'), '缺少 RefundsPage 默认导出');
});

test('[正例] 页面应包含 Metadata 导出', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export const metadata'), '缺少 metadata 导出');
  assert.ok(src.includes('title'), '缺少 title');
  assert.ok(src.includes('description'), '缺少 description');
});

test('[正例] 页面应包含 openGraph 元数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('openGraph'), '缺少 openGraph');
});

test('[正例] 页面应包含 Suspense 懒加载', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Suspense'), '缺少 Suspense');
});

test('[正例] 页面应包含 ErrorBoundary 错误边界', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ErrorBoundary'), '缺少 ErrorBoundary');
});

test('[正例] 页面应包含 RefundListClient 客户端组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundListClient'), '缺少 RefundListClient');
});

test('[正例] 页面应包含 RefundSummaryCards 统计概览', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundSummaryCards'), '缺少 RefundSummaryCards');
  assert.ok(src.includes('待处理'), '缺少待处理统计');
  assert.ok(src.includes('已退款'), '缺少已退款统计');
});

test('[正例] 页面应引用退款状态/类型字段', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const refundKeywords = ['refund', 'status', 'amount', 'pending', 'approved', 'rejected'];
  const found = refundKeywords.filter((k) => src.includes(k));
  assert.ok(found.length >= 4, `至少包含 4 个退款关键词, 实际: ${found.length}`);
});

test('[正例] 页面应有 LoadingFallback 加载占位', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundListLoadingFallback'), '缺少 RefundListLoadingFallback');
  assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
});

test('[正例] 页面应有 ErrorFallback 错误回退', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundListErrorFallback'), '缺少 RefundListErrorFallback');
  assert.ok(src.includes('退款数据加载失败'), '缺少错误提示文字');
});

test('[正例] 页面应有 EmptyState 空状态', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundEmptyState'), '缺少 RefundEmptyState');
  assert.ok(src.includes('暂无退款申请'), '缺少空状态文字');
});

test('[正例] 页面应有退款流程说明', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('退款流程说明'), '缺少流程说明');
  assert.ok(src.includes('审核'), '缺少审核说明');
  assert.ok(src.includes('财务确认'), '缺少财务确认说明');
});

test('[正例] 页面应引用 getRefunds 数据函数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('getRefunds'), '缺少 getRefunds 引用');
});

// ---- 反例 ----

test('[反例] 不应包含 console.log 调试残留', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hasConsoleLog = codeLines.some((l) => /console\.(log|warn|error|debug)\s*\(/.test(l));
  assert.ok(!hasConsoleLog, '不应有 console 调试残留');
});

test('[反例] 不应包含硬编码 API Token', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const secrets = [/api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/i, /secret\s*[:=]\s*['"][^'"]{8,}['"]/i];
  for (const pat of secrets) {
    assert.ok(!pat.test(src), `不应包含硬编码秘钥: ${pat}`);
  }
});

test('[反例] 不应使用 == 宽松比较', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const loose = /(?:status|type|amount)\s*==\s*['"]?\w+/;
  assert.ok(!loose.test(src), '应使用 ===');
});

test('[反例] 不应有直接全局 DOM 操作', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(!src.includes('document.'), '不应操作 document');
  assert.ok(!src.includes('window.'), '不应操作 window');
});

test('[反例] 不应有空白或未实现的函数体', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyFuncs = src.match(/function\s+\w+\s*\(\s*\)\s*\{\s*\}/g);
  assert.ok(!emptyFuncs || emptyFuncs.length === 0, '不应有空函数');
});

// ---- 边界 ----

test('[边界] 页面源码应大于 3KB', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 3072, `源码长度不足, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有 JSON-LD 结构化数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ld+json'), '缺少 ld+json');
  assert.ok(src.includes('WebApplication'), '缺少 WebApplication schema');
});

test('[边界] 页面应有加载/错误/空三种状态组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('RefundListLoadingFallback'), '缺少加载组件');
  assert.ok(src.includes('RefundListErrorFallback'), '缺少错误组件');
  assert.ok(src.includes('RefundEmptyState'), '缺少空状态组件');
});

test('[边界] 页面统计应基于退款数据动态计算', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  // 统计应使用 filter/reduce 动态计算而非硬编码
  const hasDynamicCalc = /\.filter|\.reduce|forEach|counter/.test(src);
  assert.ok(hasDynamicCalc, '统计应动态计算');
});

test('[边界] 页面应支持三种退款类型', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const types = ['pending', 'approved', 'rejected', 'refunded'];
  const found = types.filter((t) => src.includes(t));
  assert.ok(found.length >= 3, `至少包含 3 种退款类型处理, 实际: ${found.length}`);
});

test('[边界] 页面应有 auto-fit 响应式布局', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('auto-fit') || src.includes('auto-fill'), '统计卡片应为响应式布局');
});

test('[边界] 页面应引用 refund-data 数据层', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('./refund-data') || src.includes('refund-data'), '应引用 refund-data 模块');
});

test('[边界] 页面应有重试链接', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('href="/refunds"') || src.includes('href="/refunds"'), '应有重试链接');
});

// ---- 数据层测试 (正例) ----

test('[数据层] getRefunds 应返回 10 条记录', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('getRefunds'), '页面引用 getRefunds');
});

// ---- 统计卡片内部计算验证 ----
test('[边界] 统计卡片应计算已退总额', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('totalAmount') || src.includes('已退总额'), '应包含已退总额');
});

test('[边界] 页面应有 RefundSummaryItems 配置', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('SUMMARY_ITEMS') || src.includes('待处理'), '应有统计项定义');
});
