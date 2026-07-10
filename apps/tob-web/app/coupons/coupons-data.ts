/**
 * coupons/coupons-data.ts — ToB 优惠券数据层
 *
 * 共享类型定义与 Mock 数据集，供列表页 / 详情页 / 新建页复用
 */

// ---- 类型 ----

export type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
export type CouponStatus = 'active' | 'expired' | 'disabled';

export interface Coupon {
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
}

export const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

export const STATUS_LABELS: Record<CouponStatus, string> = {
  active: '进行中',
  expired: '已过期',
  disabled: '已停用',
};

// ---- Mock 数据生成 ----

function createMockCoupons(): Coupon[] {
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
  const MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];
  const BRANDS = ['M5', 'M5-PRO', 'M5-LITE'];
  const SALESPERSONS = ['张三', '李四', '王五', '赵六'];

  return names.map((name, i) => {
    const type = types[i % types.length]!;
    const status = statuses[i % statuses.length]!;
    const totalIssued = Math.floor(Math.random() * 2000) + 100;
    const usedCount = Math.floor(Math.random() * totalIssued);
    const startDays = Math.floor(Math.random() * 60) + 1;
    const endDays = Math.floor(Math.random() * 180) + 30;

    const valueMap: Record<CouponType, string> = {
      discount: `${[8, 8.5, 9, 7, 6.5][i % 5]}折`,
      cash: `¥${[20, 30, 50, 80, 100, 200][i % 6]}`,
      free_shipping: '免运费',
      voucher: `¥${[30, 50, 100, 200][i % 4]}`,
    };

    const minAmountMap: Record<CouponType, string[]> = {
      discount: ['满0元', '满200元', '满0元'],
      cash: ['满100元', '满300元', '满500元', '满600元'],
      free_shipping: ['满99元', '满0元'],
      voucher: ['满100元', '满200元'],
    };

    const nowTs = now.getTime();

    return {
      id: `tob-cpn-${String(i + 1).padStart(3, '0')}`,
      name,
      type,
      value: valueMap[type],
      minAmount: (minAmountMap[type] ?? ['满0元'])[i % (minAmountMap[type]?.length ?? 1)] ?? '满0元',
      maxAmount: type === 'discount' || type === 'cash' ? `¥200` : '',
      totalIssued,
      usedCount,
      validFrom: new Date(nowTs - startDays * 86400000).toISOString().slice(0, 10),
      validTo: new Date(nowTs + endDays * 86400000).toISOString().slice(0, 10),
      marketCode: MARKETS[i % MARKETS.length]!,
      brandCode: BRANDS[i % BRANDS.length]!,
      status,
      createdBy: SALESPERSONS[i % SALESPERSONS.length]!,
    };
  });
}

export const MOCK_COUPONS = createMockCoupons();
