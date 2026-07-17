/*!
 * sales-performance/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for SalesPerformanceDetailPage
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

describe('SalesPerformanceDetailPage - 正例', () => {
  it('exports default SalesPerformanceDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SalesPerformanceDetailPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports DetailShellAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShellAction'), 'missing DetailShellAction');
  });
  it('imports InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('has MOCK_TRANSACTIONS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSACTIONS'), 'missing MOCK_TRANSACTIONS');
  });
  it('has MOCK_MEMBERS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_MEMBERS'), 'missing MOCK_MEMBERS');
  });
  it('has MOCK_TRANSACTIONS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSACTIONS'), 'missing MOCK_TRANSACTIONS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('defines SalesTransaction interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface SalesTransaction') || src.includes('type SalesTransaction'), 'missing SalesTransaction');
  });
  it('defines SalesMember interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface SalesMember') || src.includes('type SalesMember'), 'missing SalesMember');
  });
});

describe('SalesPerformanceDetailPage - 反例', () => {
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

describe('SalesPerformanceDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('SalesPerformanceDetailPage - 数据完整性', () => {
  it('includes context "交易信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易信息'), 'missing 交易信息');
  });
  it('includes context "交易单号..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易单号'), 'missing 交易单号');
  });
  it('includes context "交易时间..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易时间'), 'missing 交易时间');
  });
  it('includes context "交易渠道..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易渠道'), 'missing 交易渠道');
  });
  it('includes context "交易详情..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易详情'), 'missing 交易详情');
  });
  it('includes context "交易金额..."', () => {
    const src = readSource();
    assert.ok(src.includes('交易金额'), 'missing 交易金额');
  });
  it('includes context "件数..."', () => {
    const src = readSource();
    assert.ok(src.includes('件数'), 'missing 件数');
  });
  it('includes context "会员信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员信息'), 'missing 会员信息');
  });
  it('includes context "会员等级..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员等级'), 'missing 会员等级');
  });
  it('includes context "会员编号..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员编号'), 'missing 会员编号');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant transaction', () => {
    const src = readSource();
    assert.ok(src.includes('transaction'), 'missing transaction');
  });
  it('has constant member', () => {
    const src = readSource();
    assert.ok(src.includes('member'), 'missing member');
  });
  it('has constant infoSections', () => {
    const src = readSource();
    assert.ok(src.includes('infoSections'), 'missing infoSections');
  });
});