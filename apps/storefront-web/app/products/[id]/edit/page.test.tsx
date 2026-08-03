/*!
 * products/[id]/edit/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for ProductEditPage
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

describe('ProductEditPage - 正例', () => {
  it('exports default ProductEditPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ProductEditPage'), 'missing export');
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
  it('has MOCK_OFFERINGS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_OFFERINGS'), 'missing MOCK_OFFERINGS');
  });
  it('has MOCK_OFFERINGS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_OFFERINGS'), 'missing MOCK_OFFERINGS');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines StoreOffering interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface StoreOffering') || src.includes('type StoreOffering'), 'missing StoreOffering');
  });
  it('has backUrl', () => {
    const src = readSource();
    assert.ok(src.includes('backUrl'), 'missing backUrl');
  });
  it('has onSuccess callback', () => {
    const src = readSource();
    assert.ok(src.includes('onSuccess'), 'missing onSuccess');
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

describe('ProductEditPage - 反例', () => {
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

describe('ProductEditPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('ProductEditPage - 数据完整性', () => {
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
  it('includes context "InBody 体测 + ..."', () => {
    const src = readSource();
    assert.ok(src.includes('InBody 体测 + 专业解读报告'), 'missing InBody 体测 + ');
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
  it('includes context "¥499/节..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥499/节'), 'missing ¥499/节');
  });
  it('has constant runtimeStore', () => {
    const src = readSource();
    assert.ok(src.includes('runtimeStore'), 'missing runtimeStore');
  });
  it('has constant original', () => {
    const src = readSource();
    assert.ok(src.includes('original'), 'missing original');
  });
  it('has constant existing', () => {
    const src = readSource();
    assert.ok(src.includes('existing'), 'missing existing');
  });
  it('has constant updated', () => {
    const src = readSource();
    assert.ok(src.includes('updated'), 'missing updated');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
});