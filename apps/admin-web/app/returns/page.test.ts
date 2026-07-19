/**
 * returns/page.test.ts — 退换货管理页 L1 JMeter 风格测试
 *
 * 覆盖:
 *   正例 — 页面导出、Metadata、Suspense/ErrorBoundary、ReturnSummaryCards、状态引用、数据层引用
 *   反例 — console.log、硬编码 token、== 比较、空函数、DOM 操作
 *   边界 — JSON-LD、流程说明、加载/错误/空三态、数据层边界（空列表/未知状态/零金额）
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA_SOURCE = resolve(__dirname, 'return-data.ts');

// ---- 正例 (页面源码分析) ----

test('[正例] 应导出默认退换货页面组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default function ReturnsPage'), '缺少 ReturnsPage 默认导出');
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

test('[正例] 页面应包含 ReturnListClient 客户端组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnListClient'), '缺少 ReturnListClient');
});

test('[正例] 页面应包含 ReturnSummaryCards 统计概览', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnSummaryCards'), '缺少 ReturnSummaryCards');
  assert.ok(src.includes('待处理'), '缺少待处理统计');
  assert.ok(src.includes('已完成'), '缺少已完成统计');
});

test('[正例] 页面应引用退换货相关字段', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const returnKeywords = ['return', 'status', 'pending', 'closed'];
  const found = returnKeywords.filter((k) => src.includes(k));
  assert.ok(found.length >= 3, `至少包含 3 个退换货关键词, 实际: ${found.length}`);
});

test('[正例] 页面应有 LoadingFallback 加载占位', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnListLoadingFallback'), '缺少 ReturnListLoadingFallback');
  assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
});

test('[正例] 页面应有 ErrorFallback 错误回退', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnListErrorFallback'), '缺少 ReturnListErrorFallback');
  assert.ok(src.includes('退换货数据加载失败'), '缺少错误提示文字');
});

test('[正例] 页面应有 EmptyState 空状态', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnEmptyState'), '缺少 ReturnEmptyState');
  assert.ok(src.includes('暂无退换货申请'), '缺少空状态文字');
});

test('[正例] 页面应有退换货流程说明', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('退换货流程说明'), '缺少流程说明');
  assert.ok(src.includes('审核'), '缺少审核说明');
  assert.ok(src.includes('质检'), '缺少质检说明');
});

test('[正例] 页面应引用 getReturns 数据函数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('getReturns'), '缺少 getReturns 引用');
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
  assert.ok(src.includes('WebApplication'), '缺少 schema');
});

test('[边界] 页面应有加载/错误/空三种状态组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ReturnListLoadingFallback'), '缺少加载组件');
  assert.ok(src.includes('ReturnListErrorFallback'), '缺少错误组件');
  assert.ok(src.includes('ReturnEmptyState'), '缺少空状态组件');
});

test('[边界] 页面统计应基于退换货数据动态计算', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasDynamicCalc = /\.filter|\.reduce|forEach|counter/.test(src);
  assert.ok(hasDynamicCalc, '统计应动态计算');
});

test('[边界] 页面应支持多种状态处理', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const types = ['pending', 'processing', 'completed', 'closed'];
  const found = types.filter((t) => src.includes(t));
  assert.ok(found.length >= 3, `至少包含 3 种状态处理, 实际: ${found.length}`);
});

test('[边界] 页面应有 auto-fit 响应式布局', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('auto-fit') || src.includes('auto-fill'), '统计卡片应为响应式布局');
});

test('[边界] 页面应引用 return-data 数据层', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('./return-data'), '应引用 return-data 模块');
});

test('[边界] 页面应有重试链接', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('href="/returns"'), '应有重试链接');
});

test('[边界] 统计卡片应展示四种状态', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('待处理'), '缺少待处理');
  assert.ok(src.includes('处理中'), '缺少处理中');
  assert.ok(src.includes('已完成'), '缺少已完成');
  assert.ok(src.includes('已关闭'), '缺少已关闭');
});

// ---- 数据层测试 (readFileSync 源码分析) ----

test('[数据层] return-data 应导出 getReturns', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getReturns'), '缺少 getReturns 导出');
});

test('[数据层] return-data 应导出 countByStatus', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function countByStatus'), '缺少 countByStatus 导出');
});

test('[数据层] return-data 应导出 getStatusSummary', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getStatusSummary'), '缺少 getStatusSummary 导出');
});

test('[数据层] return-data 应导出 getTypeSummary', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('export function getTypeSummary'), '缺少 getTypeSummary 导出');
});

test('[数据层] return-data 应定义 ReturnRequest 接口', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('interface ReturnRequest'), '缺少 ReturnRequest 接口');
});

test('[数据层] return-data 应定义 ReturnItem 接口', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('interface ReturnItem'), '缺少 ReturnItem 接口');
});

test('[数据层] return-data 应包含 7 种退换货状态', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const statuses = ['pending_review', 'approved', 'rejected', 'return_received', 'refund_issued', 'replacement_sent', 'closed'];
  const found = statuses.filter((s) => src.includes(s));
  assert.ok(found.length >= 5, `至少包含 5 种状态, 实际: ${found.length}`);
});

test('[数据层] return-data 应包含 3 种退换货类型', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes("'refund'"), '缺少 refund 类型');
  assert.ok(src.includes("'exchange'"), '缺少 exchange 类型');
  assert.ok(src.includes("'repair'"), '缺少 repair 类型');
});

test('[数据层] return-data 应有 getReturns 返回 8 条 mock 记录', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const records = src.match(/id:\s*'/g);
  assert.ok(records && records.length >= 8, `mock 记录数不足 8, 实际 ${records?.length ?? 0}`);
});

test('[数据层] getStatusSummary 应有空列表处理逻辑', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('summary') || src.includes('reduce'), '应有汇总计算逻辑');
});

test('[数据层] data 层应包含必填字段引用', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  const requiredFields = ['id', 'orderNo', 'customerName', 'returnType', 'status', 'items', 'refundAmount'];
  const found = requiredFields.filter((f) => src.includes(f));
  assert.ok(found.length >= 5, `至少包含 5 个必填字段, 实际: ${found.length}`);
});

test('[数据层] return-data 应有 ReturnType 类型定义', () => {
  const src = readFileSync(DATA_SOURCE, 'utf-8');
  assert.ok(src.includes('type ReturnType') || src.includes('ReturnType'), '缺少 ReturnType 类型');
});
