export type CouponStatus = 'available' | 'claimed' | 'used' | 'expired';

export interface Coupon {
  couponId: string;
  name: string;
  type: 'discount' | 'cash' | 'gift' | 'shipping';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  status: CouponStatus;
  description: string;
  tags: string[];
}

export interface AllianceCoupon {
  couponId: string;
  name: string;
  discountValue: number;
  minOrderAmount: number;
  validFrom: string;
  validUntil: string;
  status: CouponStatus;
  allianceId: string;
  allianceName: string;
  partnerStores: { storeId: string; storeName: string; logo?: string }[];
  description: string;
}

export interface SteppedRule {
  threshold: number;
  discount: number;
  label: string;
}

export const MOCK_AVAILABLE_COUPONS: Coupon[] = [
  {
    couponId: 'C001',
    name: '新人专享85折',
    type: 'discount',
    discountValue: 0.85,
    minOrderAmount: 100,
    maxDiscountAmount: 50,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    description: '全场商品85折，新用户专享',
    tags: ['新人', '限时', '折扣'],
  },
  {
    couponId: 'C002',
    name: '满200减30',
    type: 'cash',
    discountValue: 30,
    minOrderAmount: 200,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    description: '单笔订单满200元减30元',
    tags: ['满减', '通用'],
  },
  {
    couponId: 'C003',
    name: '免运费券',
    type: 'shipping',
    discountValue: 0,
    minOrderAmount: 0,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    status: 'available',
    description: '全场免运费',
    tags: ['免运费', '通用'],
  },
  {
    couponId: 'C004',
    name: '满500减100',
    type: 'cash',
    discountValue: 100,
    minOrderAmount: 500,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-08-31T23:59:59Z',
    status: 'available',
    description: '高端商品专用优惠券',
    tags: ['满减', '高端'],
  },
  {
    couponId: 'C005',
    name: '生日礼包',
    type: 'gift',
    discountValue: 0,
    minOrderAmount: 0,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    description: '生日当月可领取精美礼品一份',
    tags: ['生日', '礼品'],
  },
  {
    couponId: 'C006',
    name: '限时9折',
    type: 'discount',
    discountValue: 0.9,
    minOrderAmount: 0,
    maxDiscountAmount: 100,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-07T23:59:59Z',
    status: 'available',
    description: '周末限时9折特惠',
    tags: ['限时', '折扣', '周末'],
  },
  {
    couponId: 'C007',
    name: '会员专享满300减50',
    type: 'cash',
    discountValue: 50,
    minOrderAmount: 300,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-09-30T23:59:59Z',
    status: 'available',
    description: '银卡及以上会员专享',
    tags: ['会员', '满减'],
  },
  {
    couponId: 'C008',
    name: '爆品直降50',
    type: 'cash',
    discountValue: 50,
    minOrderAmount: 150,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-15T23:59:59Z',
    status: 'available',
    description: '指定爆品可用',
    tags: ['爆品', '直降'],
  },
  {
    couponId: 'C009',
    name: '电器专属95折',
    type: 'discount',
    discountValue: 0.95,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    status: 'available',
    description: '家电数码品类专用',
    tags: ['电器', '折扣'],
  },
  {
    couponId: 'C010',
    name: '复购专属8折券',
    type: 'discount',
    discountValue: 0.8,
    minOrderAmount: 200,
    maxDiscountAmount: 80,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    description: '再次购买客户专享',
    tags: ['复购', '折扣'],
  },
];

export const MOCK_ALLIANCE_COUPONS: AllianceCoupon[] = [
  {
    couponId: 'AC001',
    name: '联盟跨店满300减40',
    discountValue: 40,
    minOrderAmount: 300,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    allianceId: 'A001',
    allianceName: '城市品质生活联盟',
    partnerStores: [
      { storeId: 'S001', storeName: '星巴克', logo: '☕' },
      { storeId: 'S002', storeName: '屈臣氏', logo: '💊' },
      { storeId: 'S003', storeName: '优衣库', logo: '👕' },
      { storeId: 'S004', storeName: '永辉超市', logo: '🛒' },
    ],
    description: '联盟商家通用，单笔满300减40',
  },
  {
    couponId: 'AC002',
    name: '美食联盟满100减20',
    discountValue: 20,
    minOrderAmount: 100,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'available',
    allianceId: 'A002',
    allianceName: '美食联盟',
    partnerStores: [
      { storeId: 'S011', storeName: '麦当劳', logo: '🍔' },
      { storeId: 'S012', storeName: '肯德基', logo: '🍗' },
      { storeId: 'S013', storeName: '海底捞', logo: '🍲' },
    ],
    description: '美食联盟商家通用',
  },
  {
    couponId: 'AC003',
    name: '运动联盟8折券',
    discountValue: 0.8,
    minOrderAmount: 200,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-08-31T23:59:59Z',
    status: 'available',
    allianceId: 'A003',
    allianceName: '运动健身联盟',
    partnerStores: [
      { storeId: 'S021', storeName: 'Nike', logo: '👟' },
      { storeId: 'S022', storeName: 'Adidas', logo: '🏃' },
      { storeId: 'S023', storeName: '迪卡侬', logo: '⚽' },
      { storeId: 'S024', storeName: '安踏', logo: '🧥' },
      { storeId: 'S025', storeName: '李宁', logo: '🎽' },
    ],
    description: '运动品牌专享折扣券',
  },
  {
    couponId: 'AC004',
    name: '亲子联盟满500减80',
    discountValue: 80,
    minOrderAmount: 500,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-09-30T23:59:59Z',
    status: 'available',
    allianceId: 'A004',
    allianceName: '亲子联盟',
    partnerStores: [
      { storeId: 'S031', storeName: '孩子王', logo: '👶' },
      { storeId: 'S032', storeName: '乐友', logo: '🧸' },
    ],
    description: '母婴用品专享',
  },
  {
    couponId: 'AC005',
    name: '奢品联盟专属95折',
    discountValue: 0.95,
    minOrderAmount: 1000,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    status: 'available',
    allianceId: 'A005',
    allianceName: '奢品联盟',
    partnerStores: [
      { storeId: 'S041', storeName: 'LV', logo: '👜' },
      { storeId: 'S042', storeName: 'Gucci', logo: '👛' },
      { storeId: 'S043', storeName: 'Prada', logo: '🕶️' },
    ],
    description: '奢侈品专属折扣',
  },
];

export const MOCK_MY_COUPONS: (Coupon | AllianceCoupon)[] = [
  {
    couponId: 'C002',
    name: '满200减30',
    type: 'cash',
    discountValue: 30,
    minOrderAmount: 200,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'claimed',
    description: '单笔订单满200元减30元',
    tags: ['满减', '通用'],
  },
  {
    couponId: 'C003',
    name: '免运费券',
    type: 'shipping',
    discountValue: 0,
    minOrderAmount: 0,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    status: 'used',
    description: '全场免运费',
    tags: ['免运费', '通用'],
  },
  {
    couponId: 'AC001',
    name: '联盟跨店满300减40',
    discountValue: 40,
    minOrderAmount: 300,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: '2026-07-31T23:59:59Z',
    status: 'claimed',
    allianceId: 'A001',
    allianceName: '城市品质生活联盟',
    partnerStores: [
      { storeId: 'S001', storeName: '星巴克', logo: '☕' },
      { storeId: 'S002', storeName: '屈臣氏', logo: '💊' },
      { storeId: 'S003', storeName: '优衣库', logo: '👕' },
      { storeId: 'S004', storeName: '永辉超市', logo: '🛒' },
    ],
    description: '联盟商家通用，单笔满300减40',
  },
];

export const STEPPED_RULES: SteppedRule[] = [
  { threshold: 100, discount: 10, label: '满100减10' },
  { threshold: 200, discount: 25, label: '满200减25' },
  { threshold: 300, discount: 45, label: '满300减45' },
  { threshold: 500, discount: 80, label: '满500减80' },
  { threshold: 800, discount: 140, label: '满800减140' },
  { threshold: 1000, discount: 200, label: '满1000减200' },
];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function getStatusLabel(status: CouponStatus): string {
  const labels: Record<CouponStatus, string> = {
    available: '可领取',
    claimed: '已领取',
    used: '已使用',
    expired: '已过期',
  };
  return labels[status];
}

export function getStatusColor(status: CouponStatus): string {
  const colors: Record<CouponStatus, string> = {
    available: '#22c55e',
    claimed: '#3b82f6',
    used: '#94a3b8',
    expired: '#ef4444',
  };
  return colors[status];
}
