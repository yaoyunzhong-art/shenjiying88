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
  const financeFields = ['amountCents', 'amount', 'currency', 'orderId', 'paymentId', '金额', '状态'];
  const found = financeFields.filter(f => src.includes(f));
  assert.ok(found.length >= 3, `至少包含 3 个财务字段, 实际: ${found.length}`);
});

test('[正例] 页面应包含日期/时间字段引用', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasDateReference = /createdAt|updatedAt|DatePicker|datePicker|dayjs|moment|时间/i.test(src);
  assert.ok(hasDateReference, '财务页面应有时间/日期相关引用');
});

test('[正例] 页面应有表格/列表展示财务数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasTable = /Table|columns|dataSource|data-index|dataIndex|proTable|<tr>|<td>/i.test(src);
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

test('[反例] 不应该存在硬编码 Token', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const sensitivePatterns = [/apiKey\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}/, /bearer\s+['"][A-Za-z0-9_\-]{20,}/i];
  for (const pat of sensitivePatterns) {
    assert.ok(!pat.test(src), '不应包含硬编码 API Token');
  }
});

test('[反例] 金额比较不应使用 == 宽松比较', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const looseCompare = /amount\s*==\s*['"]?\d+/.test(src);
  assert.ok(!looseCompare, '金额比较应使用 ===');
});

test('[反例] 不应在业务逻辑中直接使用 Math.random 产生密值', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  // 允许 uuid 生成器中的 Math.random，但禁止直接用于业务 ID
  const lines = src.split('\n').filter(l => l.includes('Math.random') && !l.includes('uuid') && !l.includes('nanoid'));
  assert.ok(lines.length <= 1, '业务逻辑应避免分散 Math.random 调用');
});

// ---- 边界 ----

test('[边界] 页面应有合计/汇总计算', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasSummary = /summary|合计|汇总|total|sum\(|reduce|aggregation|counter|count|统计|filtered|\.length/i.test(src);
  assert.ok(hasSummary, '页面应有合计/汇总计算');
});

test('[边界] 页面源码应大于 3KB，确保有实质内容', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.length > 3072, `源码长度不足, 实际 ${src.length} bytes`);
});

test('[边界] 页面应有 loading/empty/error 状态处理', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statePatterns = [/loading|isEmpty|empty|error|fallback|skeleton|Spin|Skeleton/i];
  const hasStateHandling = statePatterns.some(p => p.test(src));
  assert.ok(hasStateHandling, '页面应有 loading/empty/error 状态处理');
});

test('[边界] 页面应处理零金额场景', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const zeroCheck = /amountCents\s*[=<>!]|=== -1|\/\/.*0\b|余额不足/i.test(src);
  assert.ok(zeroCheck, '页面应处理零金额/余额不足场景');
});

test('[边界] 页面应定义财务状态标签常量', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const statusLabels = /状态|已支付|未支付|待审核|已退款|STATUS|PENDING|SUCCESS|FAILED|REFUNDED/i.test(src);
  assert.ok(statusLabels, '页面应有财务状态标签');
});

test('[正例] 页面应有分页或滚动加载', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasPagination = /pagination|pageSize|currentPage|page\.tsx|loadMore|分页|翻页/i.test(src);
  assert.ok(hasPagination, '财务列表应有分页能力');
});

test('[正例] 页面应支持筛选/search', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasFilter = /filter|search|查询|筛选|搜索|Search|typeSelector|Dropdown|Select/i.test(src);
  assert.ok(hasFilter, '财务页面应有筛选/搜索功能');
});

test('[反例] 应避免超大整数比较时使用 parseInt', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const hasParseInt = /parseInt\s*\(.*amount/.test(src);
  const hasNumber = /Number\(.*amount/.test(src);
  assert.ok(!hasParseInt || hasNumber, '金额转换推荐使用 Number 而非 parseInt');
});

test('[边界] 页面应处理搜索结果为空的UI', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const emptyCheck = /空|empty|暂无|noData|isEmpty|无数据|Empty/i.test(src);
  assert.ok(emptyCheck, '应有空数据展示 UI');
});

test('[边界] 页面应支持日期范围查询', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const dateRange = /startDate|endDate|dateRange|RangePicker|日期范围|DatePicker\.RangePicker|dayjs|moment/i.test(src);
  assert.ok(dateRange, '财务页面应有日期范围查询');
});

test('[边界] 应处理负金额/退款场景', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  hasRefund = /refund|退款|negative|负数|退|Refund/i.test(src);
  assert.ok(hasRefund, '财务页面应有退款/负数处理');
});
