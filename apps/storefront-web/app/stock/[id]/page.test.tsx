/*!
 * stock/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for StockDetailPage
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

describe('StockDetailPage - 正例', () => {
  it('exports default StockDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockDetailPage'), 'missing export');
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
  it('imports DescriptionList', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), 'missing DescriptionList');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports InputNumber', () => {
    const src = readSource();
    assert.ok(src.includes('InputNumber'), 'missing InputNumber');
  });
  it('imports Modal', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), 'missing Modal');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('imports TextArea', () => {
    const src = readSource();
    assert.ok(src.includes('TextArea'), 'missing TextArea');
  });
  it('has MOCK_ITEMS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ITEMS'), 'missing MOCK_ITEMS');
  });
  it('has MOCK_ITEMS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ITEMS'), 'missing MOCK_ITEMS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses Modal', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), 'missing Modal');
  });
  it('uses Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
});

describe('StockDetailPage - 反例', () => {
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

describe('StockDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('StockDetailPage - 数据完整性', () => {
  it('includes context "SKU 编码..."', () => {
    const src = readSource();
    assert.ok(src.includes('SKU 编码'), 'missing SKU 编码');
  });
  it('includes context "低于阈值..."', () => {
    const src = readSource();
    assert.ok(src.includes('低于阈值'), 'missing 低于阈值');
  });
  it('includes context "单价必须大于 0..."', () => {
    const src = readSource();
    assert.ok(src.includes('单价必须大于 0'), 'missing 单价必须大于 0');
  });
  it('includes context "商品名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品名称'), 'missing 商品名称');
  });
  it('includes context "基本信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('基本信息'), 'missing 基本信息');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "已耗尽..."', () => {
    const src = readSource();
    assert.ok(src.includes('已耗尽'), 'missing 已耗尽');
  });
  it('includes context "库存信息已更新..."', () => {
    const src = readSource();
    assert.ok(src.includes('库存信息已更新'), 'missing 库存信息已更新');
  });
  it('includes context "库存健康度..."', () => {
    const src = readSource();
    assert.ok(src.includes('库存健康度'), 'missing 库存健康度');
  });
  it('includes context "库存状态..."', () => {
    const src = readSource();
    assert.ok(src.includes('库存状态'), 'missing 库存状态');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant itemId', () => {
    const src = readSource();
    assert.ok(src.includes('itemId'), 'missing itemId');
  });
  it('has constant item', () => {
    const src = readSource();
    assert.ok(src.includes('item'), 'missing item');
  });
});