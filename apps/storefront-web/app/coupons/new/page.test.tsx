/*!
 * coupons/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewCouponPage
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

describe('NewCouponPage - 正例', () => {
  it('exports default NewCouponPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewCouponPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
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
  it('has mockSubmitCoupon data', () => {
    const src = readSource();
    assert.ok(src.includes('mockSubmitCoupon'), 'missing mockSubmitCoupon');
  });
  it('has mockSubmitCoupon data', () => {
    const src = readSource();
    assert.ok(src.includes('mockSubmitCoupon'), 'missing mockSubmitCoupon');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines NewCouponFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface NewCouponFormData') || src.includes('type NewCouponFormData'), 'missing NewCouponFormData');
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

describe('NewCouponPage - 反例', () => {
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

describe('NewCouponPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewCouponPage - 数据完整性', () => {
  it('includes context "代金券..."', () => {
    const src = readSource();
    assert.ok(src.includes('代金券'), 'missing 代金券');
  });
  it('includes context "优惠券名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券名称'), 'missing 优惠券名称');
  });
  it('includes context "优惠券名称不超过50个字..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券名称不超过50个字符'), 'missing 优惠券名称不超过50个字');
  });
  it('includes context "优惠券名称至少2个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券名称至少2个字符'), 'missing 优惠券名称至少2个字符');
  });
  it('includes context "优惠券开始生效的日期..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券开始生效的日期'), 'missing 优惠券开始生效的日期');
  });
  it('includes context "优惠券类型..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券类型'), 'missing 优惠券类型');
  });
  it('includes context "优惠券说明..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券说明'), 'missing 优惠券说明');
  });
  it('includes context "优惠券说明不超过500个..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券说明不超过500个字符'), 'missing 优惠券说明不超过500个');
  });
  it('includes context "优惠券过期日期..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券过期日期'), 'missing 优惠券过期日期');
  });
  it('includes context "使用门槛..."', () => {
    const src = readSource();
    assert.ok(src.includes('使用门槛'), 'missing 使用门槛');
  });
  it('has constant COUPON_TYPES', () => {
    const src = readSource();
    assert.ok(src.includes('COUPON_TYPES'), 'missing COUPON_TYPES');
  });
  it('has constant result', () => {
    const src = readSource();
    assert.ok(src.includes('result'), 'missing result');
  });
});