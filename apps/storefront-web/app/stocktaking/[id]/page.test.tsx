/*!
 * stocktaking/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for StocktakingDetailPage
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

describe('StocktakingDetailPage - 正例', () => {
  it('exports default StocktakingDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StocktakingDetailPage'), 'missing export');
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
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports ConfirmActionDialog', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmActionDialog'), 'missing ConfirmActionDialog');
  });
  it('imports DataTable', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), 'missing DataTable');
  });
  it('imports DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), 'missing DetailActionBar');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('has MOCK_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAILS'), 'missing MOCK_DETAILS');
  });
  it('has MOCK_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAILS'), 'missing MOCK_DETAILS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses DataTable', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), 'missing DataTable');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines StocktakingItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface StocktakingItem') || src.includes('type StocktakingItem'), 'missing StocktakingItem');
  });
  it('defines StocktakingDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface StocktakingDetail') || src.includes('type StocktakingDetail'), 'missing StocktakingDetail');
  });
});

describe('StocktakingDetailPage - 反例', () => {
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

describe('StocktakingDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('StocktakingDetailPage - 数据完整性', () => {
  it('includes context "3支装..."', () => {
    const src = readSource();
    assert.ok(src.includes('3支装'), 'missing 3支装');
  });
  it('includes context "删除..."', () => {
    const src = readSource();
    assert.ok(src.includes('删除'), 'missing 删除');
  });
  it('includes context "单位..."', () => {
    const src = readSource();
    assert.ok(src.includes('单位'), 'missing 单位');
  });
  it('includes context "口红套盒..."', () => {
    const src = readSource();
    assert.ok(src.includes('口红套盒'), 'missing 口红套盒');
  });
  it('includes context "商品名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品名称'), 'missing 商品名称');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "完成时间..."', () => {
    const src = readSource();
    assert.ok(src.includes('完成时间'), 'missing 完成时间');
  });
  it('includes context "实盘数量..."', () => {
    const src = readSource();
    assert.ok(src.includes('实盘数量'), 'missing 实盘数量');
  });
  it('includes context "差异..."', () => {
    const src = readSource();
    assert.ok(src.includes('差异'), 'missing 差异');
  });
  it('includes context "差异总值..."', () => {
    const src = readSource();
    assert.ok(src.includes('差异总值'), 'missing 差异总值');
  });
  it('has constant d', () => {
    const src = readSource();
    assert.ok(src.includes('d'), 'missing d');
  });
  it('has constant isPositive', () => {
    const src = readSource();
    assert.ok(src.includes('isPositive'), 'missing isPositive');
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