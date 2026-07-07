/**
 * blindbox-data.ts — 盲盒抽奖 Mock 数据与类型定义
 */

export interface BlindBoxPrize {
  prizeId: string;
  name: string;
  description: string;
  stock: number;
  image?: string;
}

export interface BlindBoxTier {
  name: string;
  probability: number; // 0-1
  prizes: BlindBoxPrize[];
}

export interface BlindBoxPlan {
  planId: string;
  name: string;
  tiers: BlindBoxTier[];
  guaranteePity: number; // 保底次数
  status: 'active' | 'inactive';
}

export interface BlindBoxDrawRecord {
  recordId: string;
  tier: string;
  prizeName: string;
  drawType: 'single' | 'batch10';
  createdAt: string;
}

// ===================== Mock Data =====================

export const MOCK_BLINDBOX_PLANS: BlindBoxPlan[] = [
  {
    planId: 'plan-energy-box',
    name: '限定能量盒',
    status: 'active',
    guaranteePity: 10,
    tiers: [
      {
        name: '一等奖',
        probability: 0.01,
        prizes: [
          { prizeId: 'p-001', name: '限量版能量饮料一箱', description: '24罐装，限定口味', stock: 5, image: '/images/energy-drink-case.png' },
        ],
      },
      {
        name: '二等奖',
        probability: 0.05,
        prizes: [
          { prizeId: 'p-002', name: '能量饮料6罐装', description: '经典口味6罐', stock: 50, image: '/images/energy-drink-6pack.png' },
        ],
      },
      {
        name: '三等奖',
        probability: 0.15,
        prizes: [
          { prizeId: 'p-003', name: '能量饮料2罐装', description: '便携装2罐', stock: 200, image: '/images/energy-drink-2pack.png' },
        ],
      },
      {
        name: '四等奖',
        probability: 0.79,
        prizes: [
          { prizeId: 'p-004', name: '谢谢参与', description: '再接再厉', stock: 0, image: '/images/sorry.png' },
          { prizeId: 'p-005', name: '5元优惠券', description: '满50元可用', stock: 500, image: '/images/coupon-5.png' },
        ],
      },
    ],
  },
  {
    planId: 'plan-super-bag',
    name: '至尊福袋盒',
    status: 'active',
    guaranteePity: 10,
    tiers: [
      {
        name: '一等奖',
        probability: 0.02,
        prizes: [
          { prizeId: 'p-101', name: '神秘福袋大礼包', description: '价值超过500元', stock: 3, image: '/images/super-bag.png' },
        ],
      },
      {
        name: '二等奖',
        probability: 0.08,
        prizes: [
          { prizeId: 'p-102', name: '高级福袋', description: '价值200元左右', stock: 30, image: '/images/mid-bag.png' },
        ],
      },
      {
        name: '三等奖',
        probability: 0.20,
        prizes: [
          { prizeId: 'p-103', name: '普通福袋', description: '价值50元左右', stock: 150, image: '/images/normal-bag.png' },
        ],
      },
      {
        name: '四等奖',
        probability: 0.70,
        prizes: [
          { prizeId: 'p-104', name: '谢谢参与', description: '再接再厉', stock: 0, image: '/images/sorry.png' },
          { prizeId: 'p-105', name: '小福袋', description: '价值10元左右', stock: 800, image: '/images/small-bag.png' },
        ],
      },
    ],
  },
];

export const MOCK_DRAW_HISTORY: BlindBoxDrawRecord[] = [
  { recordId: 'rec-001', tier: '一等奖', prizeName: '限量版能量饮料一箱', drawType: 'single', createdAt: '2026-07-02T10:30:00Z' },
  { recordId: 'rec-002', tier: '三等奖', prizeName: '能量饮料2罐装', drawType: 'batch10', createdAt: '2026-07-02T10:25:00Z' },
  { recordId: 'rec-003', tier: '四等奖', prizeName: '5元优惠券', drawType: 'single', createdAt: '2026-07-02T10:20:00Z' },
  { recordId: 'rec-004', tier: '二等奖', prizeName: '能量饮料6罐装', drawType: 'single', createdAt: '2026-07-02T10:15:00Z' },
  { recordId: 'rec-005', tier: '四等奖', prizeName: '谢谢参与', drawType: 'batch10', createdAt: '2026-07-02T10:10:00Z' },
  { recordId: 'rec-006', tier: '三等奖', prizeName: '能量饮料2罐装', drawType: 'single', createdAt: '2026-07-02T10:05:00Z' },
  { recordId: 'rec-007', tier: '一等奖', prizeName: '限量版能量饮料一箱', drawType: 'batch10', createdAt: '2026-07-02T10:00:00Z' },
  { recordId: 'rec-008', tier: '四等奖', prizeName: '5元优惠券', drawType: 'single', createdAt: '2026-07-02T09:55:00Z' },
  { recordId: 'rec-009', tier: '二等奖', prizeName: '能量饮料6罐装', drawType: 'single', createdAt: '2026-07-02T09:50:00Z' },
  { recordId: 'rec-010', tier: '三等奖', prizeName: '能量饮料2罐装', drawType: 'batch10', createdAt: '2026-07-02T09:45:00Z' },
];

export function getPlanById(planId: string): BlindBoxPlan | undefined {
  return MOCK_BLINDBOX_PLANS.find(plan => plan.planId === planId);
}

export function formatDrawTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('zh-CN', { hour12: false });
}
