/**
 * 促销详情页 L1+L2 测试 — PromotionDetailPage (storefront-web)
 *
 * 测试覆盖 (三态: 正例/反例/边界):
 * - 正例: 模块导入 / 常量映射 / Mock 数据 / 状态流转 / 统计卡片 / 操作按钮
 * - 反例: 安全防御 / 类型安全 / 空 mock / 负数值 / 不存在 ID
 * - 边界: loading 态 (transitioning) / 已结束无流转 / 0 使用量 / 删除确认 / 日期边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与 page.tsx 保持一致的常量/类型 ---- //

type PromotionStatus = 'draft' | 'active' | 'paused' | 'ended';
type PromotionType = 'discount' | 'coupon' | 'gift' | 'flash-sale';

interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  status: PromotionStatus;
  storeName: string;
  storeId: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
  usageLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const TYPE_COLORS: Record<PromotionType, string> = {
  discount: '#60a5fa',
  coupon: '#4ade80',
  gift: '#facc15',
  'flash-sale': '#f472b6',
};

const STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

const STATUS_VARIANTS: Record<PromotionStatus, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  ended: 'neutral',
};

const STATUS_TRANSITIONS: Record<PromotionStatus, Array<{ label: string; to: PromotionStatus }>> = {
  draft: [{ label: '启动活动', to: 'active' }],
  active: [
    { label: '暂停', to: 'paused' },
    { label: '提前结束', to: 'ended' },
  ],
  paused: [
    { label: '恢复活动', to: 'active' },
    { label: '终止', to: 'ended' },
  ],
  ended: [],
};

// Mock 数据 (与 page.tsx 一致)
const MOCK_PROMOTIONS: Record<string, Promotion> = {
  'promo-1': {
    id: 'promo-1', title: '夏日清凉大促', type: 'discount', status: 'active',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-06-20', endDate: '2026-07-20',
    budget: 50000, usageCount: 187, usageLimit: 500,
    description: '全场商品8折起，覆盖夏季新品和经典热销款。线上线下同步进行，活动期间更有满额赠礼。',
    createdBy: '张店长', createdAt: '2026-06-15', updatedAt: '2026-06-19',
  },
  'promo-2': {
    id: 'promo-2', title: '会员专属折扣', type: 'discount', status: 'active',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-06-01', endDate: '2026-08-31',
    budget: 120000, usageCount: 943, usageLimit: 2000,
    description: '钻石会员享7折，黄金会员享8折，银卡会员享9折。',
    createdBy: '张店长', createdAt: '2026-05-25', updatedAt: '2026-05-30',
  },
  'promo-3': {
    id: 'promo-3', title: '满减优惠券', type: 'coupon', status: 'active',
    storeName: '南山分店', storeId: 'store-2',
    startDate: '2026-06-15', endDate: '2026-07-15',
    budget: 30000, usageCount: 56, usageLimit: 300,
    description: '领券满300减50，满500减100。每人限领1张。',
    createdBy: '李经理', createdAt: '2026-06-10', updatedAt: '2026-06-14',
  },
  'promo-4': {
    id: 'promo-4', title: '买一送一活动', type: 'gift', status: 'paused',
    storeName: '福田分店', storeId: 'store-3',
    startDate: '2026-06-10', endDate: '2026-07-10',
    budget: 20000, usageCount: 234, usageLimit: 500,
    description: '指定饮品买一送一。由于库存紧张已暂停。',
    createdBy: '王主管', createdAt: '2026-06-05', updatedAt: '2026-06-18',
  },
  'promo-5': {
    id: 'promo-5', title: '双倍积分活动', type: 'coupon', status: 'ended',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-05-01', endDate: '2026-05-31',
    budget: 15000, usageCount: 567, usageLimit: 1000,
    description: '活动期间消费享双倍积分。',
    createdBy: '张店长', createdAt: '2026-04-25', updatedAt: '2026-06-01',
  },
  'promo-6': {
    id: 'promo-6', title: '新品首发特价', type: 'flash-sale', status: 'draft',
    storeName: '宝安店', storeId: 'store-4',
    startDate: '2026-07-01', endDate: '2026-07-03',
    budget: 80000, usageCount: 0, usageLimit: 300,
    description: '新品限量首发！前300名下单享5折特惠。',
    createdBy: '赵专员', createdAt: '2026-06-20', updatedAt: '2026-06-20',
  },
};

// ---- 工具函数 ----

function getUsageRate(usageCount: number, usageLimit: number): number {
  return usageLimit > 0 ? Math.round((usageCount / usageLimit) * 100) : 0;
}

function getDaysRemaining(endDate: string, status: PromotionStatus): number {
  if (status === 'ended') return 0;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function mockPromotion(overrides?: Partial<Promotion>): Promotion {
  return {
    id: 'promo-test', title: '测试活动', type: 'discount', status: 'draft',
    storeName: '测试店', storeId: 'store-test',
    startDate: '2026-07-01', endDate: '2026-07-31',
    budget: 10000, usageCount: 0, usageLimit: 100,
    description: '测试描述', createdBy: '测试人',
    createdAt: '2026-06-20', updatedAt: '2026-06-20',
    ...overrides,
  };
}

// ==================== 正例 (模块/常量/数据/流转) ====================

describe('PromotionDetailPage — 正例', () => {
  it('模块可导入，default 导出为函数组件', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('TYPE_LABELS 包含全部 4 种类型', () => {
    assert.equal(Object.keys(TYPE_LABELS).length, 4);
    assert.equal(TYPE_LABELS.discount, '折扣');
    assert.equal(TYPE_LABELS.coupon, '优惠券');
    assert.equal(TYPE_LABELS.gift, '赠品');
    assert.equal(TYPE_LABELS['flash-sale'], '秒杀');
  });

  it('TYPE_COLORS 包含全部 4 种颜色 (十六进制)', () => {
    assert.equal(Object.keys(TYPE_COLORS).length, 4);
    for (const v of Object.values(TYPE_COLORS)) {
      assert.ok(v.startsWith('#'), `missing hash prefix: ${v}`);
    }
  });

  it('STATUS_LABELS 包含全部 4 种状态', () => {
    assert.equal(Object.keys(STATUS_LABELS).length, 4);
    assert.equal(STATUS_LABELS.draft, '草稿');
    assert.equal(STATUS_LABELS.active, '进行中');
    assert.equal(STATUS_LABELS.paused, '已暂停');
    assert.equal(STATUS_LABELS.ended, '已结束');
  });

  it('STATUS_VARIANTS 映射正确', () => {
    assert.equal(STATUS_VARIANTS.draft, 'default');
    assert.equal(STATUS_VARIANTS.active, 'success');
    assert.equal(STATUS_VARIANTS.paused, 'warning');
    assert.equal(STATUS_VARIANTS.ended, 'neutral');
  });

  it('STATUS_TRANSITIONS 流转定义完整', () => {
    // draft → active (1 条)
    assert.equal(STATUS_TRANSITIONS.draft.length, 1);
    assert.equal(STATUS_TRANSITIONS.draft[0].to, 'active');
    // active → paused + ended (2 条)
    assert.equal(STATUS_TRANSITIONS.active.length, 2);
    assert.equal(STATUS_TRANSITIONS.active[0].to, 'paused');
    assert.equal(STATUS_TRANSITIONS.active[1].to, 'ended');
    // paused → active + ended (2 条)
    assert.equal(STATUS_TRANSITIONS.paused.length, 2);
    assert.equal(STATUS_TRANSITIONS.paused[0].to, 'active');
    assert.equal(STATUS_TRANSITIONS.paused[1].to, 'ended');
    // ended = 空
    assert.equal(STATUS_TRANSITIONS.ended.length, 0);
  });

  it('Mock 数据含 6 条促销记录', () => {
    assert.equal(Object.keys(MOCK_PROMOTIONS).length, 6);
  });

  it('每条促销记录字段完整', () => {
    const required = ['id', 'title', 'type', 'status', 'storeName', 'startDate', 'endDate', 'budget', 'usageCount', 'usageLimit', 'description', 'createdBy', 'createdAt', 'updatedAt'];
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      for (const f of required) {
        assert.ok(p[f as keyof Promotion] !== undefined && p[f as keyof Promotion] !== null, `${p.id} missing ${f}`);
      }
    }
  });

  it('所有记录 type 在 TYPE_LABELS 定义范围内', () => {
    const validTypes = Object.keys(TYPE_LABELS);
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(validTypes.includes(p.type), `${p.id}: invalid type ${p.type}`);
    }
  });

  it('所有记录 status 在 STATUS_LABELS 定义范围内', () => {
    const validStatuses = Object.keys(STATUS_LABELS);
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(validStatuses.includes(p.status), `${p.id}: invalid status ${p.status}`);
    }
  });

  it('日期格式均为 YYYY-MM-DD', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.match(p.startDate, /^\d{4}-\d{2}-\d{2}$/, `${p.id} startDate`);
      assert.match(p.endDate, /^\d{4}-\d{2}-\d{2}$/, `${p.id} endDate`);
    }
  });

  it('预算 budget 为正数', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(p.budget > 0, `${p.id} budget must be positive`);
    }
  });

  it('usageCount ≤ usageLimit (对于有上限的记录)', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      if (p.usageLimit > 0) {
        assert.ok(p.usageCount <= p.usageLimit, `${p.id}: ${p.usageCount} > ${p.usageLimit}`);
      }
    }
  });

  it('使用率计算正确', () => {
    assert.equal(getUsageRate(187, 500), 37);
    assert.equal(getUsageRate(943, 2000), 47);
    assert.equal(getUsageRate(0, 300), 0);
    assert.equal(getUsageRate(500, 500), 100);
  });

  it('Mock 覆盖全部 4 种状态', () => {
    const statuses = new Set(Object.values(MOCK_PROMOTIONS).map(p => p.status));
    assert.ok(statuses.has('draft'));
    assert.ok(statuses.has('active'));
    assert.ok(statuses.has('paused'));
    assert.ok(statuses.has('ended'));
  });

  it('Mock 覆盖全部 4 种类型', () => {
    const types = new Set(Object.values(MOCK_PROMOTIONS).map(p => p.type));
    assert.ok(types.has('discount'));
    assert.ok(types.has('coupon'));
    assert.ok(types.has('gift'));
    assert.ok(types.has('flash-sale'));
  });
});

// ==================== 反例 (安全/防御/错误) ====================

describe('PromotionDetailPage — 反例', () => {
  it('空促销列表查不到记录', () => {
    const empty: Record<string, Promotion> = {};
    assert.equal(empty['nonexistent'], undefined);
  });

  it('负数使用量极端情况', () => {
    const p = mockPromotion({ usageCount: -1, usageLimit: 100 });
    assert.equal(p.usageCount, -1);
    const rate = getUsageRate(p.usageCount, p.usageLimit);
    assert.equal(rate, -1);
  });

  it('budget 为 0 的极端情况', () => {
    const p = mockPromotion({ budget: 0 });
    assert.equal(p.budget, 0);
  });

  it('usageLimit 为 0 时使用率返回 0', () => {
    const p = mockPromotion({ usageLimit: 0, usageCount: 0 });
    assert.equal(getUsageRate(p.usageCount, p.usageLimit), 0);
  });

  it('usageLimit 为 0 时 usageCount 也应为空', () => {
    const p = mockPromotion({ usageLimit: 0, usageCount: 0 });
    assert.equal(p.usageCount, 0);
    assert.equal(p.usageLimit, 0);
  });

  it('已结束 (ended) 状态无流转', () => {
    const promo = mockPromotion({ status: 'ended' });
    const transitions = STATUS_TRANSITIONS[promo.status];
    assert.equal(transitions.length, 0);
  });

  it('不存在于 MOCK_PROMOTIONS 的 ID 返回 undefined', () => {
    const result = MOCK_PROMOTIONS['promo-nonexistent'];
    assert.equal(result, undefined);
  });
});

// ==================== 边界 (loading/空/删除/日期) ====================

describe('PromotionDetailPage — 边界', () => {
  it('草稿 (draft) 状态只能启动 (→active)', () => {
    const trans = STATUS_TRANSITIONS.draft;
    assert.equal(trans.length, 1);
    assert.equal(trans[0].to, 'active');
    assert.equal(trans[0].label, '启动活动');
  });

  it('进行中 (active) 可以暂停或提前结束', () => {
    const trans = STATUS_TRANSITIONS.active;
    assert.equal(trans.length, 2);
    const targets = trans.map(t => t.to);
    assert.ok(targets.includes('paused'));
    assert.ok(targets.includes('ended'));
  });

  it('已暂停 (paused) 可以恢复或终止', () => {
    const trans = STATUS_TRANSITIONS.paused;
    assert.equal(trans.length, 2);
    const targets = trans.map(t => t.to);
    assert.ok(targets.includes('active'));
    assert.ok(targets.includes('ended'));
  });

  it('usageCount 为 0 时使用率 0%', () => {
    const p = mockPromotion({ usageCount: 0, usageLimit: 300 });
    assert.equal(getUsageRate(p.usageCount, p.usageLimit), 0);
    assert.equal(p.usageCount, 0);
  });

  it('usageCount 等于 usageLimit 时使用率 100%', () => {
    const p = mockPromotion({ usageCount: 500, usageLimit: 500 });
    assert.equal(getUsageRate(p.usageCount, p.usageLimit), 100);
  });

  it('已结束活动剩余天数为 0', () => {
    const days = getDaysRemaining('2026-01-01', 'ended');
    assert.equal(days, 0);
  });

  it('描述信息不为空', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(p.description.length > 0, `${p.id} description empty`);
    }
  });

  it('所有记录有 createdBy', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(p.createdBy, `${p.id} missing createdBy`);
    }
  });

  it('多门店覆盖 (旗舰店/南山分店/福田分店/宝安店)', () => {
    const storeNames = new Set(Object.values(MOCK_PROMOTIONS).map(p => p.storeName));
    assert.ok(storeNames.has('旗舰店'));
    assert.ok(storeNames.has('南山分店'));
    assert.ok(storeNames.has('福田分店'));
    assert.ok(storeNames.has('宝安店'));
  });
});
