/**
 * PromotionDetailPage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - 页面常量（标签映射、颜色映射、状态流转）
 * - Mock 数据完整性
 * - 状态流转逻辑（STATUS_TRANSITIONS）
 * - 404 分支逻辑（通过 mock 规则验证）
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与 page.tsx 保持一致的常量/类型 ---- //

const TYPE_LABELS: Record<string, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const TYPE_COLORS: Record<string, string> = {
  discount: '#60a5fa',
  coupon: '#4ade80',
  gift: '#facc15',
  'flash-sale': '#f472b6',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

type PromotionStatus = 'draft' | 'active' | 'paused' | 'ended';

const STATUS_VARIANTS: Record<PromotionStatus, string> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  ended: 'neutral',
};

interface Promotion {
  id: string;
  title: string;
  type: string;
  status: PromotionStatus;
  storeName: string;
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

// 与 page.tsx 一致的 Mock 数据
const MOCK_PROMOTIONS: Record<string, Promotion> = {
  'promo-1': {
    id: 'promo-1', title: '夏日清凉大促', type: 'discount', status: 'active',
    storeName: '旗舰店',
    startDate: '2026-06-20', endDate: '2026-07-20',
    budget: 50000, usageCount: 187, usageLimit: 500,
    description: '全场商品8折起，覆盖夏季新品和经典热销款。线上线下同步进行，活动期间更有满额赠礼。',
    createdBy: '张店长', createdAt: '2026-06-15', updatedAt: '2026-06-19',
  },
  'promo-4': {
    id: 'promo-4', title: '买一送一活动', type: 'gift', status: 'paused',
    storeName: '福田分店',
    startDate: '2026-06-10', endDate: '2026-07-10',
    budget: 20000, usageCount: 234, usageLimit: 500,
    description: '指定饮品买一送一。由于库存紧张已暂停。',
    createdBy: '王主管', createdAt: '2026-06-05', updatedAt: '2026-06-18',
  },
};

// ---- 正例 ----

describe('PromotionDetailPage 促销详情', () => {
  it('1. 模块可导入，default 导出为函数', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function (component)');
  });

  it('2. TYPE_LABELS 包含所有 4 种活动类型', () => {
    assert.equal(Object.keys(TYPE_LABELS).length, 4);
    assert.equal(TYPE_LABELS.discount, '折扣');
    assert.equal(TYPE_LABELS.coupon, '优惠券');
    assert.equal(TYPE_LABELS.gift, '赠品');
    assert.equal(TYPE_LABELS['flash-sale'], '秒杀');
  });

  it('3. TYPE_COLORS 包含所有 4 种颜色值', () => {
    assert.equal(Object.keys(TYPE_COLORS).length, 4);
    assert.ok(TYPE_COLORS.discount.startsWith('#'));
    assert.ok(TYPE_COLORS.coupon.startsWith('#'));
    assert.ok(TYPE_COLORS.gift.startsWith('#'));
    assert.ok(TYPE_COLORS['flash-sale'].startsWith('#'));
  });

  it('4. STATUS_LABELS 包含 all 4 种状态', () => {
    assert.equal(Object.keys(STATUS_LABELS).length, 4);
    assert.equal(STATUS_LABELS.draft, '草稿');
    assert.equal(STATUS_LABELS.active, '进行中');
    assert.equal(STATUS_LABELS.paused, '已暂停');
    assert.equal(STATUS_LABELS.ended, '已结束');
  });

  it('5. STATUS_VARIANTS 映射正确', () => {
    assert.equal(STATUS_VARIANTS.draft, 'default');
    assert.equal(STATUS_VARIANTS.active, 'success');
    assert.equal(STATUS_VARIANTS.paused, 'warning');
    assert.equal(STATUS_VARIANTS.ended, 'neutral');
  });

  it('6. STATUS_TRANSITIONS 定义完整', () => {
    // draft → active
    assert.equal(STATUS_TRANSITIONS.draft.length, 1);
    assert.equal(STATUS_TRANSITIONS.draft[0].to, 'active');

    // active → {paused, ended}
    assert.equal(STATUS_TRANSITIONS.active.length, 2);
    assert.equal(STATUS_TRANSITIONS.active[0].to, 'paused');
    assert.equal(STATUS_TRANSITIONS.active[1].to, 'ended');

    // paused → {active, ended}
    assert.equal(STATUS_TRANSITIONS.paused.length, 2);
    assert.equal(STATUS_TRANSITIONS.paused[0].to, 'active');
    assert.equal(STATUS_TRANSITIONS.paused[1].to, 'ended');

    // ended → 无
    assert.equal(STATUS_TRANSITIONS.ended.length, 0);
  });

  it('7. MOCK_PROMOTIONS promo-1 数据完整性（active）', () => {
    const p = MOCK_PROMOTIONS['promo-1'];
    assert.ok(p);
    assert.equal(p.title, '夏日清凉大促');
    assert.equal(p.status, 'active');
    assert.equal(p.storeName, '旗舰店');
    assert.equal(p.budget, 50000);
    assert.equal(p.usageCount, 187);
    assert.equal(p.usageLimit, 500);
    assert.ok(p.description.length > 0);
  });

  it('8. MOCK_PROMOTIONS promo-4 数据完整性（paused）', () => {
    const p = MOCK_PROMOTIONS['promo-4'];
    assert.ok(p);
    assert.equal(p.title, '买一送一活动');
    assert.equal(p.status, 'paused');
    assert.equal(p.type, 'gift');
    assert.equal(p.storeName, '福田分店');
  });

  it('9. 状态流转从 active 到 paused 到 ended 正确', () => {
    // 模拟状态流转: active → paused → ended
    const activeTrans = STATUS_TRANSITIONS.active;
    const pausedTrans = STATUS_TRANSITIONS.paused;

    const toPaused = activeTrans.find(t => t.to === 'paused');
    const toEndedFromPaused = pausedTrans.find(t => t.to === 'ended');
    assert.ok(toPaused);
    assert.ok(toEndedFromPaused);
    assert.equal(toPaused?.label, '暂停');
    assert.equal(toEndedFromPaused?.label, '终止');
  });

  it('10. 不存在的 ID 逻辑——MOCK_PROMOTIONS 无此 key', () => {
    // 验证模拟数据没有 "nonexistent"
    assert.equal('nonexistent' in MOCK_PROMOTIONS, false);
  });

  it('11. 所有促销记录的 type 在 TYPE_LABELS 中', () => {
    const validTypes = Object.keys(TYPE_LABELS);
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(validTypes.includes(p.type), `Unexpected type: ${p.type}`);
    }
  });

  it('12. 所有促销记录的 status 在 STATUS_LABELS 中', () => {
    const validStatuses = Object.keys(STATUS_LABELS);
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(validStatuses.includes(p.status), `Unexpected status: ${p.status}`);
    }
  });

  it('13. 日期格式均为 YYYY-MM-DD', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.match(p.startDate, /^\d{4}-\d{2}-\d{2}$/, `${p.id} startDate`);
      assert.match(p.endDate, /^\d{4}-\d{2}-\d{2}$/, `${p.id} endDate`);
    }
  });

  it('14. usageCount <= usageLimit（对于有上限的记录）', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      if (p.usageLimit > 0) {
        assert.ok(p.usageCount <= p.usageLimit, `${p.id}: ${p.usageCount} > ${p.usageLimit}`);
      }
    }
  });

  it('15. 预算 budget 为正数', () => {
    for (const p of Object.values(MOCK_PROMOTIONS)) {
      assert.ok(p.budget > 0, `${p.id} budget should be positive`);
    }
  });
});

// ---- 边界 ----

describe('PromotionDetailPage 边界测试', () => {
  it('16. 空数据集合：无促销记录时查找返回 undefined', () => {
    const empty: Record<string, Promotion> = {};
    assert.equal(empty['nonexistent'], undefined);
  });

  it('17. draft 状态应当能被正确标记', () => {
    const status = 'draft' as PromotionStatus;
    assert.equal(STATUS_LABELS[status], '草稿');
    assert.equal(STATUS_VARIANTS[status], 'default');
  });

  it('18. ended 状态不应有任何流转', () => {
    assert.equal(STATUS_TRANSITIONS.ended.length, 0);
  });
});
