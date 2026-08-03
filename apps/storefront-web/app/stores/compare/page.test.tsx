/*!
 * stores/compare/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for PageComponent
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('PageComponent - 正例', () => {
  it('imports EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('imports ErrorBoundary', () => {
    const src = readSource();
    assert.ok(src.includes('ErrorBoundary'), 'missing ErrorBoundary');
  });
  it('imports LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), 'missing LoadingSkeleton');
  });
  it('has MOCK_COMPARE_STATS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COMPARE_STATS'), 'missing MOCK_COMPARE_STATS');
  });
  it('has MOCK_COMPARE_STATS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COMPARE_STATS'), 'missing MOCK_COMPARE_STATS');
  });
  it('has MOCK_COMPARE_STATS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COMPARE_STATS'), 'missing MOCK_COMPARE_STATS');
  });
  it('uses EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('uses LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), 'missing LoadingSkeleton');
  });
  it('defines PageProps interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface PageProps') || src.includes('type PageProps'), 'missing PageProps');
  });
  it('uses Suspense', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), 'missing Suspense');
  });
  it('uses ErrorBoundary', () => {
    const src = readSource();
    assert.ok(src.includes('ErrorBoundary'), 'missing ErrorBoundary');
  });
  it('imports Metadata', () => {
    const src = readSource();
    assert.ok(src.includes('Metadata'), 'missing Metadata');
  });
  it('exports metadata', () => {
    const src = readSource();
    assert.ok(src.includes('export const metadata'), 'missing metadata');
  });
  it('has openGraph', () => {
    const src = readSource();
    assert.ok(src.includes('openGraph'), 'missing openGraph');
  });
  it('uses LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), 'missing LoadingSkeleton');
  });
});

describe('PageComponent - 反例', () => {
  it('JSON-LD uses dangerousSetInnerHTML (legitimate)', () => {
    const src = readSource();
    assert.ok(src.includes('dangerouslySetInnerHTML'), 'JSON-LD');
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('PageComponent - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('has fallback content', () => {
    const src = readSource();
    assert.ok(src.includes('fallback'), 'missing fallback');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('PageComponent - 数据完整性', () => {
  it('includes context "加载对比数据......"', () => {
    const src = readSource();
    assert.ok(src.includes('加载对比数据...'), 'missing 加载对比数据...');
  });
  it('includes context "加载满意度图表..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载满意度图表'), 'missing 加载满意度图表');
  });
  it('includes context "加载筛选区......"', () => {
    const src = readSource();
    assert.ok(src.includes('加载筛选区...'), 'missing 加载筛选区...');
  });
  it('includes context "加载营收图表..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载营收图表'), 'missing 加载营收图表');
  });
  it('includes context "对比数据加载失败..."', () => {
    const src = readSource();
    assert.ok(src.includes('对比数据加载失败'), 'missing 对比数据加载失败');
  });
  it('includes context "对比门店..."', () => {
    const src = readSource();
    assert.ok(src.includes('对比门店'), 'missing 对比门店');
  });
  it('includes context "旗舰店..."', () => {
    const src = readSource();
    assert.ok(src.includes('旗舰店'), 'missing 旗舰店');
  });
  it('includes context "无法加载门店对比数据。请..."', () => {
    const src = readSource();
    assert.ok(src.includes('无法加载门店对比数据。请检查数据源是否正常，稍后重试。'), 'missing 无法加载门店对比数据。请');
  });
  it('includes context "暂无对比门店..."', () => {
    const src = readSource();
    assert.ok(src.includes('暂无对比门店'), 'missing 暂无对比门店');
  });
  it('includes context "最高满意度..."', () => {
    const src = readSource();
    assert.ok(src.includes('最高满意度'), 'missing 最高满意度');
  });
  it('has constant COMPARE_METRICS', () => {
    const src = readSource();
    assert.ok(src.includes('COMPARE_METRICS'), 'missing COMPARE_METRICS');
  });
  it('has constant sp', () => {
    const src = readSource();
    assert.ok(src.includes('sp'), 'missing sp');
  });
  it('has constant hasPreselected', () => {
    const src = readSource();
    assert.ok(src.includes('hasPreselected'), 'missing hasPreselected');
  });
});