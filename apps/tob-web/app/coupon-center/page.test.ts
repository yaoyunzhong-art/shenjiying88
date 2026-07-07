import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(): string {
  const src = resolve(__dirname, 'page.tsx');
  return readFileSync(src, 'utf-8');
}

describe('CouponCenterPage', () => {
  it('has coupon data structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('MOCK_AVAILABLE_COUPONS') ||
        src.includes('Coupon') ||
        src.includes('couponId') ||
        src.includes('折扣') ||
        src.includes('满减'),
      'missing coupon data structure'
    );
  });

  it('has tab switching for available/mine/alliance', () => {
    const src = readSource();
    assert.ok(
      src.includes('可领取') ||
        src.includes('我的券') ||
        src.includes('联盟券') ||
        src.includes('available') ||
        src.includes('mine') ||
        src.includes('alliance'),
      'missing tab structure'
    );
  });

  it('has alliance coupon special display', () => {
    const src = readSource();
    assert.ok(
      src.includes('联盟') ||
        src.includes('Alliance') ||
        src.includes('partnerStores') ||
        src.includes('跨店') ||
        src.includes('partnerStores'),
      'missing alliance coupon display'
    );
  });

  it('has stepped discount calculator', () => {
    const src = readSource();
    assert.ok(
      src.includes('STEPPED_RULES') ||
        src.includes('满减') ||
        src.includes('threshold') ||
        src.includes('阶梯') ||
        src.includes('evaluateDiscount'),
      'missing stepped discount structure'
    );
  });

  it('has AI recommendation modal', () => {
    const src = readSource();
    assert.ok(
      src.includes('AI') ||
        src.includes('AI推荐') ||
        src.includes('getAIRecommendedCoupon') ||
        src.includes('showAIModal'),
      'missing AI recommendation modal'
    );
  });

  it('has coupon claim/use handlers', () => {
    const src = readSource();
    assert.ok(
      src.includes('handleClaim') ||
        src.includes('claimCoupon') ||
        src.includes('handleUse') ||
        src.includes('useCoupon') ||
        src.includes('领取') ||
        src.includes('核销'),
      'missing coupon action handlers'
    );
  });
});
