/*!
 * refunds/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewRefundRequestPage
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

describe('NewRefundRequestPage - 正例', () => {
  it('exports default NewRefundRequestPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewRefundRequestPage'), 'missing export');
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
  it('imports FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), 'missing FormSubmitFeedback');
  });
  it('imports Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports RadioGroup', () => {
    const src = readSource();
    assert.ok(src.includes('RadioGroup'), 'missing RadioGroup');
  });
  it('imports RadioOption', () => {
    const src = readSource();
    assert.ok(src.includes('RadioOption'), 'missing RadioOption');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports SelectOption', () => {
    const src = readSource();
    assert.ok(src.includes('SelectOption'), 'missing SelectOption');
  });
  it('imports TextArea', () => {
    const src = readSource();
    assert.ok(src.includes('TextArea'), 'missing TextArea');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines FormValues interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormValues') || src.includes('type FormValues'), 'missing FormValues');
  });
});

describe('NewRefundRequestPage - 反例', () => {
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

describe('NewRefundRequestPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewRefundRequestPage - 数据完整性', () => {
  it('includes context "仅退款..."', () => {
    const src = readSource();
    assert.ok(src.includes('仅退款'), 'missing 仅退款');
  });
  it('includes context "其他原因..."', () => {
    const src = readSource();
    assert.ok(src.includes('其他原因'), 'missing 其他原因');
  });
  it('includes context "创建退换货申请，提交后将..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建退换货申请，提交后将进入审批流程'), 'missing 创建退换货申请，提交后将');
  });
  it('includes context "发错商品..."', () => {
    const src = readSource();
    assert.ok(src.includes('发错商品'), 'missing 发错商品');
  });
  it('includes context "商品与描述不符..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品与描述不符'), 'missing 商品与描述不符');
  });
  it('includes context "商品有瑕疵或尺码/规格不..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品有瑕疵或尺码/规格不符，申请换货'), 'missing 商品有瑕疵或尺码/规格不');
  });
  it('includes context "商品未发货或已退货，仅申..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品未发货或已退货，仅申请退款'), 'missing 商品未发货或已退货，仅申');
  });
  it('includes context "商品破损/瑕疵..."', () => {
    const src = readSource();
    assert.ok(src.includes('商品破损/瑕疵'), 'missing 商品破损/瑕疵');
  });
  it('includes context "尺码/规格不合适..."', () => {
    const src = readSource();
    assert.ok(src.includes('尺码/规格不合适'), 'missing 尺码/规格不合适');
  });
  it('includes context "已收货但需要退货并退款..."', () => {
    const src = readSource();
    assert.ok(src.includes('已收货但需要退货并退款'), 'missing 已收货但需要退货并退款');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant set', () => {
    const src = readSource();
    assert.ok(src.includes('set'), 'missing set');
  });
  it('has constant handleSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
  });
  it('has constant handleReset', () => {
    const src = readSource();
    assert.ok(src.includes('handleReset'), 'missing handleReset');
  });
});