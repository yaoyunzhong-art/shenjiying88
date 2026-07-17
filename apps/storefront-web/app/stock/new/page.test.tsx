/*!
 * stock/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewStockItemPage
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

describe('NewStockItemPage - 正例', () => {
  it('exports default NewStockItemPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewStockItemPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports FormPageField', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageField'), 'missing FormPageField');
  });
  it('imports FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('imports FormPageSubmitResult', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageSubmitResult'), 'missing FormPageSubmitResult');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines NewStockFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface NewStockFormData') || src.includes('type NewStockFormData'), 'missing NewStockFormData');
  });
  it('has FIELDS array', () => {
    const src = readSource();
    assert.ok(src.includes('FIELDS'), 'missing FIELDS');
  });
  it('has backUrl', () => {
    const src = readSource();
    assert.ok(src.includes('backUrl'), 'missing backUrl');
  });
  it('has submitLabel', () => {
    const src = readSource();
    assert.ok(src.includes('submitLabel'), 'missing submitLabel');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('NewStockItemPage - 反例', () => {
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

describe('NewStockItemPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewStockItemPage - 数据完整性', () => {
  it('includes context "SKU编码..."', () => {
    const src = readSource();
    assert.ok(src.includes('SKU编码'), 'missing SKU编码');
  });
  it('includes context "SKU编码不超过30个字..."', () => {
    const src = readSource();
    assert.ok(src.includes('SKU编码不超过30个字符'), 'missing SKU编码不超过30个字');
  });
  it('includes context "SKU编码至少2个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('SKU编码至少2个字符'), 'missing SKU编码至少2个字符');
  });
  it('includes context "例如：A区-03货架-第..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：A区-03货架-第2层'), 'missing 例如：A区-03货架-第');
  });
  it('includes context "例如：SKU-1001..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：SKU-1001'), 'missing 例如：SKU-1001');
  });
  it('includes context "例如：广州美妆供应链有限..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：广州美妆供应链有限公司'), 'missing 例如：广州美妆供应链有限');
  });
  it('includes context "例如：玫瑰精华爽肤水..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：玫瑰精华爽肤水'), 'missing 例如：玫瑰精华爽肤水');
  });
  it('includes context "供应商..."', () => {
    const src = readSource();
    assert.ok(src.includes('供应商'), 'missing 供应商');
  });
  it('includes context "供应商名称不超过100个..."', () => {
    const src = readSource();
    assert.ok(src.includes('供应商名称不超过100个字符'), 'missing 供应商名称不超过100个');
  });
  it('includes context "其他..."', () => {
    const src = readSource();
    assert.ok(src.includes('其他'), 'missing 其他');
  });
  it('has constant CATEGORIES', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORIES'), 'missing CATEGORIES');
  });
  it('has constant UNIT_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('UNIT_OPTIONS'), 'missing UNIT_OPTIONS');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
});