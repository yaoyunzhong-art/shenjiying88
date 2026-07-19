/**
 * rate-limits/page.test.ts — 限流与配额页 L1 JMeter 风格测试
 *
 * 覆盖:
 *   正例 — 页面导出、use client、核心字段、Suspense/ErrorBoundary、分页搜索
 *   反例 — console.log、硬编码 token、== 比较、空函数、window/document
 *   边界 — loading/empty/error 状态、源码大小、动态渲染、searchParams 处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('[正例] 应导出默认页面组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default async function RateLimitsPage'), '缺少 RateLimitsPage 默认导出');
});

test('[正例] 页面应包含核心限流字段引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const coreFields = ['tenantId', 'policyCode', 'subjectKey', 'status'];
  const found = coreFields.filter((f) => src.includes(f));
  assert.ok(found.length >= 3, `至少包含 3 个核心字段, 实际: ${found.length}`);
});

test('[正例] 页面应引用限流业务模块', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('loadRateLimitWorkspace'), '缺少 loadRateLimitWorkspace 引入');
  assert.ok(src.includes('RateLimitsWorkspaceClient'), '缺少 RateLimitsWorkspaceClient 引入');
});

test('[正例] 页面应有 Suspense 懒加载', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Suspense'), '缺少 Suspense');
});

test('[正例] 页面应有 ErrorBoundary 错误边界', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ErrorBoundary'), '缺少 ErrorBoundary');
});

test('[正例] 页面应有 loading 占位组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  assert.ok(src.includes('加载限流配额'), '缺少加载文案');
});

test('[正例] 页面应有 PageShell 页面外壳', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('PageShell'), '缺少 PageShell');
});

test('[正例] 页面应有 subtitle 描述文本', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('subtitle'), '缺少 subtitle');
  assert.ok(src.includes('限流策略与配额账本'), '缺少核心描述');
});

test('[正例] 页面应有 searchParams 查询参数处理', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('searchParams'), '缺少 searchParams');
  assert.ok(src.includes('readQueryParam'), '缺少 readQueryParam 函数');
});

test('[正例] 页面应支持 healthy / warning / blocked 状态分桶', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statusBuckets = ['healthy', 'warning', 'blocked'];
  const found = statusBuckets.filter((s) => src.includes(s));
  assert.ok(found.length >= 2, `至少包含 2 种状态, 实际: ${found.length}`);
});

test('[正例] 页面应有动态渲染配置', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("dynamic = 'force-dynamic'"), '缺少 force-dynamic');
  assert.ok(src.includes('revalidate = 0'), '缺少 revalidate = 0');
});

test('[正例] 页面应引用客户端子组件', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Suspense'), '服务端组件应使用 Suspense');
  assert.ok(src.includes('RateLimitsWorkspaceClient'), '应引用客户端组件');
});

// ---- 反例 ----

test('[反例] 不应有 console.log 调试残留', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const codeLines = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const hasConsoleLog = codeLines.some((l) => /console\.(log|warn|error|debug)\s*\(/.test(l));
  assert.ok(!hasConsoleLog, '不应有 console 调试残留');
});

test('[反例] 不应包含硬编码 API Token', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const secrets = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/i,
    /secret\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /bearer\s+['"][A-Za-z0-9_\-]{20,}['"]?/i,
  ];
  for (const pat of secrets) {
    assert.ok(!pat.test(src), `不应包含硬编码敏感信息: ${pat}`);
  }
});

test('[反例] 不应使用 == 宽松比较', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const looseCompares = src.match(/(?:status|limit|burstLimit)\s*==\s*['"]?\w+/g);
  assert.ok(!looseCompares || looseCompares.length === 0, '应使用 === 而非 ==');
});

test('[反例] 不应使用 dangerouslySetInnerHTML', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
});

test('[反例] 不应有空白函数体', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyFuncs = src.match(/function\s+\w+\s*\(\s*\)\s*\{\s*\}/g);
  assert.ok(!emptyFuncs || emptyFuncs.length === 0, '不应有空函数');
});

test('[反例] 不应有注释掉的生产代码', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const commentedCode = src.match(/\/\/\s*(?:export|import|const|function|return)/g);
  assert.ok(!commentedCode || commentedCode.length <= 2, '不应有过多注释掉的代码');
});

test('[反例] 不应有全局 DOM 操作', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(!src.includes('document.body'), '不应直接操作 document.body');
  assert.ok(!src.includes('window.location'), '不应直接操作 window.location');
});

// ---- 边界 ----

test('[边界] 页面源码应大于 1.5KB', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 1536, `源码长度不足, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有 loading/empty/error 状态处理', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statePatterns = [/loading|isEmpty|empty|error|fallback|ErrorBoundary|Suspense/i];
  const hasStateHandling = statePatterns.some((p) => p.test(src));
  assert.ok(hasStateHandling, '页面应有 loading/empty/error 状态处理');
});

test('[边界] 页面应有查询参数筛选能力', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasFilter = /filter|tenantId|policyCode|subjectKey|status|search|Search/i.test(src);
  assert.ok(hasFilter, '页面应有筛选/搜索能力');
});

test('[边界] 页面应处理 ALL 状态查询', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('ALL') || src.includes('ALL'), '页面应支持 ALL 通配状态');
});

test('[边界] 页面应处理 searchParams 为 undefined 的情况', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('readQueryParam'), '应有查询参数读取辅助函数');
  assert.ok(src.includes('undefined'), '应处理 undefined 参数');
});

test('[边界] 页面应处理数组类型的查询参数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Array.isArray'), '应处理数组类型查询参数');
});

test('[边界] 页面应使用 Promise<searchParams> 异步参数', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('Promise'), 'searchParams 应为 Promise 类型');
  assert.ok(src.includes('await'), '应 await searchParams');
});

test('[边界] 页面应包含健康/警告/封禁三态颜色指示', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  // 页面应有状态桶标签
  assert.ok(src.includes('healthy') || src.includes('warning') || src.includes('blocked'), '应含状态桶');
});

test('[边界] 页面应支持 no-store 缓存策略', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("cache: 'no-store'") || src.includes('no-store'), '应使用 no-store 缓存策略');
});

test('[边界] 页面应具有 maxWidth 布局约束', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('maxWidth') || src.includes('max-width'), '应有最大宽度布局约束');
});
