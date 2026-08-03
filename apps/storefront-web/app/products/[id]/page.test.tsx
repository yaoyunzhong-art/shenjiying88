/*!
 * products/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for ProductDetailPage
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

describe('ProductDetailPage - 正例', () => {
  it('exports default ProductDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ProductDetailPage'), 'missing export');
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
  it('imports DetailShellAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShellAction'), 'missing DetailShellAction');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), 'missing FormSubmitFeedback');
  });
  it('imports Modal', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), 'missing Modal');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('imports SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('imports useFormSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('useFormSubmit'), 'missing useFormSubmit');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses Modal', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), 'missing Modal');
  });
  it('uses SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines StoreOffering interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface StoreOffering') || src.includes('type StoreOffering'), 'missing StoreOffering');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('ProductDetailPage - 反例', () => {
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

describe('ProductDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('ProductDetailPage - 数据完整性', () => {
  it('includes context "7月每周一三五 14:0..."', () => {
    const src = readSource();
    assert.ok(src.includes('7月每周一三五 14:00'), 'missing 7月每周一三五 14:0');
  });
  it('includes context "Demo Store 旗..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 旗舰店'), 'missing Demo Store 旗');
  });
  it('includes context "Demo Store 社..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 社区店'), 'missing Demo Store 社');
  });
  it('includes context "HIIT 高强度间歇训练..."', () => {
    const src = readSource();
    assert.ok(src.includes('HIIT 高强度间歇训练'), 'missing HIIT 高强度间歇训练');
  });
  it('includes context "¥149/节..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥149/节'), 'missing ¥149/节');
  });
  it('includes context "¥199/节..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥199/节'), 'missing ¥199/节');
  });
  it('includes context "¥2,999/期..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥2,999/期'), 'missing ¥2,999/期');
  });
  it('includes context "¥399/次..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥399/次'), 'missing ¥399/次');
  });
  it('includes context "¥50 报名费..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥50 报名费'), 'missing ¥50 报名费');
  });
  it('includes context "产品名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('产品名称'), 'missing 产品名称');
  });
  it('has constant handleSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
  });
  it('has constant handleSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant transitionStatus', () => {
    const src = readSource();
    assert.ok(src.includes('transitionStatus'), 'missing transitionStatus');
  });
});