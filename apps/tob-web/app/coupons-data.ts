/**
 * coupons-data.ts — 优惠券 mock 数据 (ToB 优惠券管理)
 */

export type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
export type CouponStatus = 'active' | 'expired' | 'disabled';

export interface CouponItem {
  id: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  maxAmount: string;
  totalIssued: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  marketCode: string;
  brandCode: string;
  status: CouponStatus;
  createdBy: string;
  description?: string;
  usageLimit: number;
}

export const COUPON_TYPE_MAP: Record<CouponType, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  discount: { label: '打折券', variant: 'success' },
  cash: { label: '代金券', variant: 'warning' },
  free_shipping: { label: '免运费', variant: 'info' },
  voucher: { label: '礼品券', variant: 'danger' },
};

export const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  active: { label: '进行中', variant: 'success' },
  expired: { label: '已过期', variant: 'neutral' },
  disabled: { label: '已停用', variant: 'warning' },
};

export const REVERSE_STATUS: Partial<Record<CouponStatus, CouponStatus>> = {
  active: 'disabled',
  disabled: 'active',
};

export const REVERSE_ACTION_LABEL: Partial<Record<CouponStatus, string>> = {
  active: '停用优惠券',
  disabled: '重新激活',
};

export const COUPON_TYPES: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];
export const COUPON_STATUSES: CouponStatus[] = ['active', 'expired', 'disabled'];

export const ALL_MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];
export const ALL_BRANDS = ['M5', 'M5-PRO', 'M5-LITE'];

function createMockCoupons(): CouponItem[] {
  const now = new Date('2026-06-26');
  const names = [
    '新客首单8折', '满300减50', '会员专享免运费', '夏季狂欢9折',
    '端午节礼券', '满500减80', '年终特惠8.5折', '开业庆代价券',
    '复购有礼', '好友邀请券', '周末促销', '超值套餐券',
    '店庆大促', '跨店满减', '会员日专享', '批量采购优惠',
    '新品首发折扣', '积分兑换券', '老客回馈', '季度满减',
  ];
  const types: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];
  const statuses: CouponStatus[] = ['active', 'active', 'active', 'expired', 'disabled'];
  const salespersons = ['张三', '李四', '王五', '赵六'];
  const descs = [
    '适用于本品牌所有门店，可与其他优惠叠加使用',
    '仅限指定商品，不参与会员折扣',
    '适用于本品牌线上商城及线下门店',
    '活动期间每人限领1张',
  ];

  return names.map((name, i) => {
    const type = types[i % types.length]!;
    const status = statuses[i % statuses.length]!;
    const totalIssued = Math.floor(Math.random() * 2000) + 100;
    const usedCount = Math.floor(Math.random() * totalIssued);

    const valueMap: Record<CouponType, string> = {
      discount: `${[8, 8.5, 9, 7, 6.5][i % 5]}折`,
      cash: `¥${[20, 30, 50, 80, 100, 200][i % 6]}`,
      free_shipping: '免运费',
      voucher: `¥${[30, 50, 100, 200][i % 4]}`,
    };

    const minMap: Record<CouponType, string[]> = {
      discount: ['满0元', '满200元', '满0元'],
      cash: ['满100元', '满300元', '满500元', '满600元'],
      free_shipping: ['满99元', '满0元'],
      voucher: ['满100元', '满200元'],
    };

    const startDays = Math.floor(Math.random() * 60) + 1;
    const endDays = Math.floor(Math.random() * 180) + 30;
    const minOptions = minMap[type];

    return {
      id: `tob-cpn-${String(i + 1).padStart(3, '0')}`,
      name,
      type,
      value: valueMap[type],
      minAmount: minOptions[i % minOptions.length]!,
      maxAmount: type === 'discount' || type === 'cash' ? '¥200' : '',
      totalIssued,
      usedCount,
      validFrom: new Date(now.getTime() - startDays * 86400000).toISOString().slice(0, 10),
      validTo: new Date(now.getTime() + endDays * 86400000).toISOString().slice(0, 10),
      marketCode: ALL_MARKETS[i % ALL_MARKETS.length]!,
      brandCode: ALL_BRANDS[i % ALL_BRANDS.length]!,
      status,
      createdBy: salespersons[i % salespersons.length]!,
      description: descs[i % descs.length]!,
      usageLimit: Math.floor(Math.random() * 3) + 1,
    };
  });
}

export const MOCK_COUPONS = createMockCoupons();
