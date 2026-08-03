/*!
 * operations/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for OperationDetailPage
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

describe('OperationDetailPage - 正例', () => {
  it('exports default OperationDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OperationDetailPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports RuntimeOperationPresetDetailRoute', () => {
    const src = readSource();
    assert.ok(src.includes('RuntimeOperationPresetDetailRoute'), 'missing RuntimeOperationPresetDetailRoute');
  });
  it('has MOCK_OPS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_OPS'), 'missing MOCK_OPS');
  });
  it('has MOCK_OPS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_OPS'), 'missing MOCK_OPS');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useEffect', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), 'missing useEffect');
  });
  it('uses Skeleton component', () => {
    const src = readSource();
    assert.ok(src.includes('Skeleton'), 'missing Skeleton');
  });
  it('has retry mechanism', () => {
    const src = readSource();
    assert.ok(src.includes('retry') || src.includes('Retry'), 'missing retry');
  });
});

describe('OperationDetailPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
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

describe('OperationDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
  it('has shimmer animation', () => {
    const src = readSource();
    assert.ok(src.includes('shimmer'), 'missing shimmer');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('OperationDetailPage - 数据完整性', () => {
  it('includes context "已分配处理人..."', () => {
    const src = readSource();
    assert.ok(src.includes('已分配处理人'), 'missing 已分配处理人');
  });
  it('includes context "已创建..."', () => {
    const src = readSource();
    assert.ok(src.includes('已创建'), 'missing 已创建');
  });
  it('includes context "张经理..."', () => {
    const src = readSource();
    assert.ok(src.includes('张经理'), 'missing 张经理');
  });
  it('includes context "李处理..."', () => {
    const src = readSource();
    assert.ok(src.includes('李处理'), 'missing 李处理');
  });
  it('includes context "正在进行中..."', () => {
    const src = readSource();
    assert.ok(src.includes('正在进行中'), 'missing 正在进行中');
  });
  it('includes context "系统..."', () => {
    const src = readSource();
    assert.ok(src.includes('系统'), 'missing 系统');
  });
  it('includes context "网络连接异常，请重试..."', () => {
    const src = readSource();
    assert.ok(src.includes('网络连接异常，请重试'), 'missing 网络连接异常，请重试');
  });
  it('includes context "运营操作已创建..."', () => {
    const src = readSource();
    assert.ok(src.includes('运营操作已创建'), 'missing 运营操作已创建');
  });
  it('has constant PRESET', () => {
    const src = readSource();
    assert.ok(src.includes('PRESET'), 'missing PRESET');
  });
  it('has constant OPERATION_STAGES', () => {
    const src = readSource();
    assert.ok(src.includes('OPERATION_STAGES'), 'missing OPERATION_STAGES');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant id', () => {
    const src = readSource();
    assert.ok(src.includes('id'), 'missing id');
  });
});