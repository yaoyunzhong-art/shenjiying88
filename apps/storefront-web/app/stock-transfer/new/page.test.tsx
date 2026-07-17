/*!
 * stock-transfer/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewStockTransferPage
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

describe('NewStockTransferPage - 正例', () => {
  it('exports default NewStockTransferPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewStockTransferPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines TransferLineItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface TransferLineItem') || src.includes('type TransferLineItem'), 'missing TransferLineItem');
  });
  it('defines FormState interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormState') || src.includes('type FormState'), 'missing FormState');
  });
});

describe('NewStockTransferPage - 反例', () => {
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

describe('NewStockTransferPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('NewStockTransferPage - 数据完整性', () => {
  it('includes context "中央仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('中央仓库'), 'missing 中央仓库');
  });
  it('includes context "仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('仓库'), 'missing 仓库');
  });
  it('includes context "仓库→门店..."', () => {
    const src = readSource();
    assert.ok(src.includes('仓库→门店'), 'missing 仓库→门店');
  });
  it('includes context "分店(体育西)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(体育西)'), 'missing 分店(体育西)');
  });
  it('includes context "分店(北京路)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(北京路)'), 'missing 分店(北京路)');
  });
  it('includes context "分店(珠江新城)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(珠江新城)'), 'missing 分店(珠江新城)');
  });
  it('includes context "华东仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('华东仓库'), 'missing 华东仓库');
  });
  it('includes context "华南仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('华南仓库'), 'missing 华南仓库');
  });
  it('includes context "提交中…..."', () => {
    const src = readSource();
    assert.ok(src.includes('提交中…'), 'missing 提交中…');
  });
  it('includes context "提交调拨单..."', () => {
    const src = readSource();
    assert.ok(src.includes('提交调拨单'), 'missing 提交调拨单');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant typeDir', () => {
    const src = readSource();
    assert.ok(src.includes('typeDir'), 'missing typeDir');
  });
  it('has constant getLocationOptions', () => {
    const src = readSource();
    assert.ok(src.includes('getLocationOptions'), 'missing getLocationOptions');
  });
  it('has constant fromOptions', () => {
    const src = readSource();
    assert.ok(src.includes('fromOptions'), 'missing fromOptions');
  });
});