/*!
 * purchase-orders/[id]/edit/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for PurchaseOrderEditPage
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

describe('PurchaseOrderEditPage - 正例', () => {
  it('exports default PurchaseOrderEditPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function PurchaseOrderEditPage'), 'missing export');
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
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('imports Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('has MOCK_ORDERS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), 'missing MOCK_ORDERS');
  });
  it('has MOCK_ORDERS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), 'missing MOCK_ORDERS');
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
  it('uses Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines PurchaseOrderItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface PurchaseOrderItem') || src.includes('type PurchaseOrderItem'), 'missing PurchaseOrderItem');
  });
  it('defines PurchaseOrder interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface PurchaseOrder') || src.includes('type PurchaseOrder'), 'missing PurchaseOrder');
  });
  it('defines EditFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface EditFormData') || src.includes('type EditFormData'), 'missing EditFormData');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('PurchaseOrderEditPage - 反例', () => {
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

describe('PurchaseOrderEditPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
});

describe('PurchaseOrderEditPage - 数据完整性', () => {
  it('includes context "11位手机号码..."', () => {
    const src = readSource();
    assert.ok(src.includes('11位手机号码'), 'missing 11位手机号码');
  });
  it('includes context "付款方式..."', () => {
    const src = readSource();
    assert.ok(src.includes('付款方式'), 'missing 付款方式');
  });
  it('includes context "付款条件..."', () => {
    const src = readSource();
    assert.ok(src.includes('付款条件'), 'missing 付款条件');
  });
  it('includes context "供应商名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('供应商名称'), 'missing 供应商名称');
  });
  it('includes context "供应商名称不能为空..."', () => {
    const src = readSource();
    assert.ok(src.includes('供应商名称不能为空'), 'missing 供应商名称不能为空');
  });
  it('includes context "全额预付..."', () => {
    const src = readSource();
    assert.ok(src.includes('全额预付'), 'missing 全额预付');
  });
  it('includes context "名称不超过100个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('名称不超过100个字符'), 'missing 名称不超过100个字符');
  });
  it('includes context "地址不超过200个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('地址不超过200个字符'), 'missing 地址不超过200个字符');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "备注不超过500个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注不超过500个字符'), 'missing 备注不超过500个字符');
  });
  it('has constant PAYMENT_TERMS_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('PAYMENT_TERMS_OPTIONS'), 'missing PAYMENT_TERMS_OPTIONS');
  });
  it('has constant PAYMENT_METHOD_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('PAYMENT_METHOD_OPTIONS'), 'missing PAYMENT_METHOD_OPTIONS');
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