/*!
 * coupons/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for CouponDetailPage
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

describe('CouponDetailPage - 正例', () => {
  it('exports default CouponDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CouponDetailPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports DetailShellAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShellAction'), 'missing DetailShellAction');
  });
  it('imports InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('imports QuickStats', () => {
    const src = readSource();
    assert.ok(src.includes('QuickStats'), 'missing QuickStats');
  });
  it('has MOCK_COUPON_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPON_DETAILS'), 'missing MOCK_COUPON_DETAILS');
  });
  it('has MOCK_COUPON_DETAILS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPON_DETAILS'), 'missing MOCK_COUPON_DETAILS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('defines CouponDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface CouponDetail') || src.includes('type CouponDetail'), 'missing CouponDetail');
  });
});

describe('CouponDetailPage - 反例', () => {
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

describe('CouponDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
});

describe('CouponDetailPage - 数据完整性', () => {
  it('includes context "8折..."', () => {
    const src = readSource();
    assert.ok(src.includes('8折'), 'missing 8折');
  });
  it('includes context "Demo Store 旗..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 旗舰店'), 'missing Demo Store 旗');
  });
  it('includes context "Demo Store 社..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 社区店'), 'missing Demo Store 社');
  });
  it('includes context "不限..."', () => {
    const src = readSource();
    assert.ok(src.includes('不限'), 'missing 不限');
  });
  it('includes context "代金券..."', () => {
    const src = readSource();
    assert.ok(src.includes('代金券'), 'missing 代金券');
  });
  it('includes context "优惠券不存在..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券不存在'), 'missing 优惠券不存在');
  });
  it('includes context "会员专享免运费..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员专享免运费'), 'missing 会员专享免运费');
  });
  it('includes context "会员专享免运费权益，下单..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员专享免运费权益，下单满99元即享包邮服务。'), 'missing 会员专享免运费权益，下单');
  });
  it('includes context "使用门槛..."', () => {
    const src = readSource();
    assert.ok(src.includes('使用门槛'), 'missing 使用门槛');
  });
  it('includes context "停用..."', () => {
    const src = readSource();
    assert.ok(src.includes('停用'), 'missing 停用');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant couponId', () => {
    const src = readSource();
    assert.ok(src.includes('couponId'), 'missing couponId');
  });
  it('has constant coupon', () => {
    const src = readSource();
    assert.ok(src.includes('coupon'), 'missing coupon');
  });
  it('has constant redeemRate', () => {
    const src = readSource();
    assert.ok(src.includes('redeemRate'), 'missing redeemRate');
  });
  it('has constant remaining', () => {
    const src = readSource();
    assert.ok(src.includes('remaining'), 'missing remaining');
  });
});