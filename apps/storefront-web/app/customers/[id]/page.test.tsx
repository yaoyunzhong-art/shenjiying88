/*!
 * customers/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for CustomerDetailPage
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

describe('CustomerDetailPage - 正例', () => {
  it('exports default CustomerDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CustomerDetailPage'), 'missing export');
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
  it('imports DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), 'missing DetailActionBar');
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
  it('defines Customer interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface Customer') || src.includes('type Customer'), 'missing Customer');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('CustomerDetailPage - 反例', () => {
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

describe('CustomerDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('CustomerDetailPage - 数据完整性', () => {
  it('includes context "Demo Store 旗..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 旗舰店'), 'missing Demo Store 旗');
  });
  it('includes context "Demo Store 社..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 社区店'), 'missing Demo Store 社');
  });
  it('includes context "偏好到店体验，建议定期推..."', () => {
    const src = readSource();
    assert.ok(src.includes('偏好到店体验，建议定期推送新品。'), 'missing 偏好到店体验，建议定期推');
  });
  it('includes context "删除..."', () => {
    const src = readSource();
    assert.ok(src.includes('删除'), 'missing 删除');
  });
  it('includes context "到店..."', () => {
    const src = readSource();
    assert.ok(src.includes('到店'), 'missing 到店');
  });
  it('includes context "基本信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('基本信息'), 'missing 基本信息');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "姓名..."', () => {
    const src = readSource();
    assert.ok(src.includes('姓名'), 'missing 姓名');
  });
  it('includes context "姓名不能为空..."', () => {
    const src = readSource();
    assert.ok(src.includes('姓名不能为空'), 'missing 姓名不能为空');
  });
  it('includes context "客单价..."', () => {
    const src = readSource();
    assert.ok(src.includes('客单价'), 'missing 客单价');
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
  it('has constant next', () => {
    const src = readSource();
    assert.ok(src.includes('next'), 'missing next');
  });
});