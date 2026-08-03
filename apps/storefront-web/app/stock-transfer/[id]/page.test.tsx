/*!
 * stock-transfer/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for StockTransferDetailPage
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

describe('StockTransferDetailPage - 正例', () => {
  it('exports default StockTransferDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockTransferDetailPage'), 'missing export');
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
  it('defines StockTransferDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockTransferDetail') || src.includes('type StockTransferDetail'), 'missing StockTransferDetail');
  });
  it('defines TransferItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface TransferItem') || src.includes('type TransferItem'), 'missing TransferItem');
  });
});

describe('StockTransferDetailPage - 反例', () => {
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

describe('StockTransferDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('StockTransferDetailPage - 数据完整性', () => {
  it('includes context "临期品退回..."', () => {
    const src = readSource();
    assert.ok(src.includes('临期品退回'), 'missing 临期品退回');
  });
  it('includes context "仓库→门店..."', () => {
    const src = readSource();
    assert.ok(src.includes('仓库→门店'), 'missing 仓库→门店');
  });
  it('includes context "删除..."', () => {
    const src = readSource();
    assert.ok(src.includes('删除'), 'missing 删除');
  });
  it('includes context "商品名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品名称'), 'missing 商品名称');
  });
  it('includes context "商品数..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品数'), 'missing 商品数');
  });
  it('includes context "完成时间..."', () => {
    const src = readSource();
    assert.ok(src.includes('完成时间'), 'missing 完成时间');
  });
  it('includes context "审批人..."', () => {
    const src = readSource();
    assert.ok(src.includes('审批人'), 'missing 审批人');
  });
  it('includes context "已取消..."', () => {
    const src = readSource();
    assert.ok(src.includes('已取消'), 'missing 已取消');
  });
  it('includes context "已完成..."', () => {
    const src = readSource();
    assert.ok(src.includes('已完成'), 'missing 已完成');
  });
  it('includes context "已审批..."', () => {
    const src = readSource();
    assert.ok(src.includes('已审批'), 'missing 已审批');
  });
  it('has constant d', () => {
    const src = readSource();
    assert.ok(src.includes('d'), 'missing d');
  });
  it('has constant ITEM_COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('ITEM_COLUMNS'), 'missing ITEM_COLUMNS');
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