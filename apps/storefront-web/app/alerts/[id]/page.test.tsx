/*!
 * alerts/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for AlertDetailPage
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

describe('AlertDetailPage - 正例', () => {
  it('exports default AlertDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AlertDetailPage'), 'missing export');
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
  it('imports FoundationAlertPresetDetailRoute', () => {
    const src = readSource();
    assert.ok(src.includes('FoundationAlertPresetDetailRoute'), 'missing FoundationAlertPresetDetailRoute');
  });
  it('has MOCK_DETAIL data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAIL'), 'missing MOCK_DETAIL');
  });
  it('has MOCK_DETAIL data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAIL'), 'missing MOCK_DETAIL');
  });
  it('has MOCK_DETAIL data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAIL'), 'missing MOCK_DETAIL');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
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

describe('AlertDetailPage - 反例', () => {
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

describe('AlertDetailPage - 边界', () => {
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

describe('AlertDetailPage - 数据完整性', () => {
  it('includes context "2小时前..."', () => {
    const src = readSource();
    assert.ok(src.includes('2小时前'), 'missing 2小时前');
  });
  it('includes context "○ 标记已读..."', () => {
    const src = readSource();
    assert.ok(src.includes('○ 标记已读'), 'missing ○ 标记已读');
  });
  it('includes context "✅ 已读..."', () => {
    const src = readSource();
    assert.ok(src.includes('✅ 已读'), 'missing ✅ 已读');
  });
  it('includes context "严重..."', () => {
    const src = readSource();
    assert.ok(src.includes('严重'), 'missing 严重');
  });
  it('includes context "中等..."', () => {
    const src = readSource();
    assert.ok(src.includes('中等'), 'missing 中等');
  });
  it('includes context "告警不存在..."', () => {
    const src = readSource();
    assert.ok(src.includes('告警不存在'), 'missing 告警不存在');
  });
  it('includes context "系统自动创建..."', () => {
    const src = readSource();
    assert.ok(src.includes('系统自动创建'), 'missing 系统自动创建');
  });
  it('includes context "警告..."', () => {
    const src = readSource();
    assert.ok(src.includes('警告'), 'missing 警告');
  });
  it('includes context "返回告警列表..."', () => {
    const src = readSource();
    assert.ok(src.includes('返回告警列表'), 'missing 返回告警列表');
  });
  it('includes context "高危..."', () => {
    const src = readSource();
    assert.ok(src.includes('高危'), 'missing 高危');
  });
  it('has constant PRESET', () => {
    const src = readSource();
    assert.ok(src.includes('PRESET'), 'missing PRESET');
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
  it('has constant timer', () => {
    const src = readSource();
    assert.ok(src.includes('timer'), 'missing timer');
  });
});