/*!
 * suppliers/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewSupplierPage
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

describe('NewSupplierPage - 正例', () => {
  it('exports default NewSupplierPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewSupplierPage'), 'missing export');
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
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines SupplierFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface SupplierFormData') || src.includes('type SupplierFormData'), 'missing SupplierFormData');
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

describe('NewSupplierPage - 反例', () => {
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

describe('NewSupplierPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewSupplierPage - 数据完整性', () => {
  it('includes context "交货周期 (天)..."', () => {
    const src = readSource();
    assert.ok(src.includes('交货周期 (天)'), 'missing 交货周期 (天)');
  });
  it('includes context "交货周期不能超过365天..."', () => {
    const src = readSource();
    assert.ok(src.includes('交货周期不能超过365天'), 'missing 交货周期不能超过365天');
  });
  it('includes context "交货周期必须大于0..."', () => {
    const src = readSource();
    assert.ok(src.includes('交货周期必须大于0'), 'missing 交货周期必须大于0');
  });
  it('includes context "从下单到到货的平均天数..."', () => {
    const src = readSource();
    assert.ok(src.includes('从下单到到货的平均天数'), 'missing 从下单到到货的平均天数');
  });
  it('includes context "付款条件..."', () => {
    const src = readSource();
    assert.ok(src.includes('付款条件'), 'missing 付款条件');
  });
  it('includes context "例如：138001380..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：13800138001'), 'missing 例如：138001380');
  });
  it('includes context "例如：3602 0001..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：3602 0001 0123 4567 890'), 'missing 例如：3602 0001');
  });
  it('includes context "例如：7..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：7'), 'missing 例如：7');
  });
  it('includes context "例如：contact@e..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：contact@example.com'), 'missing 例如：contact@e');
  });
  it('includes context "例如：中国工商银行广州白..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：中国工商银行广州白云支行'), 'missing 例如：中国工商银行广州白');
  });
  it('has constant CATEGORY_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY_OPTIONS'), 'missing CATEGORY_OPTIONS');
  });
  it('has constant PAYMENT_TERMS_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('PAYMENT_TERMS_OPTIONS'), 'missing PAYMENT_TERMS_OPTIONS');
  });
  it('has constant phone', () => {
    const src = readSource();
    assert.ok(src.includes('phone'), 'missing phone');
  });
  it('has constant license', () => {
    const src = readSource();
    assert.ok(src.includes('license'), 'missing license');
  });
  it('has constant acct', () => {
    const src = readSource();
    assert.ok(src.includes('acct'), 'missing acct');
  });
});