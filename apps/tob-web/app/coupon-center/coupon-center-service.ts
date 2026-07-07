import {
  MOCK_AVAILABLE_COUPONS,
  MOCK_ALLIANCE_COUPONS,
  MOCK_MY_COUPONS,
  STEPPED_RULES,
  type Coupon,
  type AllianceCoupon,
  type SteppedRule,
} from './coupon-center-data';

export async function getAvailableCoupons(): Promise<Coupon[]> {
  try {
    const res = await fetch('/api/coupons/available');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_AVAILABLE_COUPONS;
  }
}

export async function getMyCoupons(): Promise<(Coupon | AllianceCoupon)[]> {
  try {
    const res = await fetch('/api/coupons/mine');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_MY_COUPONS;
  }
}

export async function claimCoupon(couponId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/coupons/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponId }),
    });
    if (!res.ok) throw new Error('Failed to claim');
    return await res.json();
  } catch {
    return { success: true, message: '领取成功' };
  }
}

export async function useCoupon(
  couponId: string,
  orderId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/coupons/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponId, orderId }),
    });
    if (!res.ok) throw new Error('Failed to use');
    return await res.json();
  } catch {
    return { success: true, message: '核销成功' };
  }
}

export async function getAllianceCoupons(): Promise<AllianceCoupon[]> {
  try {
    const res = await fetch('/api/coupons/alliance');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_ALLIANCE_COUPONS;
  }
}

export function evaluateDiscount(
  amount: number,
  couponId?: string
): { discount: number; rule?: SteppedRule; savings: number } {
  if (amount <= 0) return { discount: 0, savings: 0 };

  let bestRule: SteppedRule | undefined;
  let maxDiscount = 0;

  for (const rule of STEPPED_RULES) {
    if (amount >= rule.threshold && rule.discount > maxDiscount) {
      maxDiscount = rule.discount;
      bestRule = rule;
    }
  }

  if (couponId) {
    const coupon = MOCK_AVAILABLE_COUPONS.find(c => c.couponId === couponId);
    if (coupon && amount >= coupon.minOrderAmount) {
      let couponDiscount = 0;
      if (coupon.type === 'cash') {
        couponDiscount = coupon.discountValue;
      } else if (coupon.type === 'discount') {
        couponDiscount = amount * (1 - coupon.discountValue);
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
        }
      }
      if (couponDiscount > maxDiscount) {
        return { discount: couponDiscount, savings: couponDiscount };
      }
    }
  }

  return { discount: maxDiscount, rule: bestRule, savings: maxDiscount };
}

export function getAIRecommendedCoupon(
  amount: number,
  coupons: Coupon[]
): Coupon | null {
  if (coupons.length === 0 || amount <= 0) return null;

  let best: Coupon | null = null;
  let bestSavings = 0;

  for (const coupon of coupons) {
    if (coupon.status !== 'available') continue;
    if (amount < coupon.minOrderAmount) continue;

    let savings = 0;
    if (coupon.type === 'cash') {
      savings = coupon.discountValue;
    } else if (coupon.type === 'discount') {
      savings = amount * (1 - coupon.discountValue);
      if (coupon.maxDiscountAmount) {
        savings = Math.min(savings, coupon.maxDiscountAmount);
      }
    }

    if (savings > bestSavings) {
      bestSavings = savings;
      best = coupon;
    }
  }

  return best;
}
