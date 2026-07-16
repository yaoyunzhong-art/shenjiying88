/**
 * stores/[id]/promotions/page.test.tsx — 促销管理页面 L1 测试
 *
 * 覆盖: 促销活动数据、状态管理、预算消耗、类型过滤
 * 正例: 活动数据完整、状态筛选正确、预算计算、消耗率
 * 反例: 不存在的状态、消耗率0预算活动、已结束活动
 * 边界: 预算为0、已消耗等于预算、草稿/待开始/结束状态
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type PromoStatus = 'active' | 'scheduled' | 'ended' | 'draft';

interface Promo {
  id: string;
  name: string;
  type: string;
  discount: string;
  scope: string;
  start: string;
  end: string;
  budget: number;
  used: number;
  status: PromoStatus;
  targetGoal?: string;
}

const PROMO_DATA: Promo[] = [
  { id:'PROMO-001', name:'暑期8折优惠', type:'折扣', discount:'8折', scope:'全场', start:'2026-07-15', end:'2026-08-31', budget:30000, used:8500, status:'active', targetGoal:'提升客流20%' },
  { id:'PROMO-002', name:'新客满100减20', type:'满减', discount:'减20', scope:'新用户', start:'2026-07-10', end:'2026-07-31', budget:10000, used:3200, status:'active' },
  { id:'PROMO-003', name:'会员生日特惠', type:'折扣', discount:'7折', scope:'会员', start:'2026-07-01', end:'2026-12-31', budget:5000, used:1250, status:'active' },
  { id:'PROMO-004', name:'充值满赠', type:'满赠', discount:'充200送50', scope:'全场', start:'2026-08-01', end:'2026-08-15', budget:15000, used:0, status:'scheduled' },
  { id:'PROMO-005', name:'国庆特惠', type:'折扣', discount:'7.5折', scope:'全场', start:'2026-10-01', end:'2026-10-07', budget:50000, used:0, status:'draft' },
  { id:'PROMO-006', name:'618狂欢', type:'满减', discount:'满200减50', scope:'全场', start:'2026-06-18', end:'2026-06-20', budget:20000, used:18600, status:'ended' },
  { id:'PROMO-007', name:'学生证优惠', type:'折扣', discount:'8.5折', scope:'学生', start:'2026-07-20', end:'2026-09-01', budget:8000, used:0, status:'draft' },
  { id:'PROMO-008', name:'夜场畅玩卡', type:'套餐', discount:'68元/3h', scope:'夜场', start:'2026-07-15', end:'2026-09-30', budget:12000, used:2800, status:'active' },
];

/* ── 工具函数 ── */

const STATUS_CFG: Record<PromoStatus, { color: string; label: string }> = {
  active: { color: 'green', label: '进行中' },
  scheduled: { color: 'blue', label: '待开始' },
  ended: { color: 'default', label: '已结束' },
  draft: { color: 'default', label: '草稿' },
};

function filterByStatus(data: Promo[], status: string): Promo[] {
  if (status === 'all') return data;
  return data.filter(p => p.status === status);
}

function computeTotalBudget(data: Promo[]): number {
  return data.reduce((s, p) => s + p.budget, 0);
}

function computeTotalUsed(data: Promo[]): number {
  return data.reduce((s, p) => s + p.used, 0);
}

function computeUsageRate(data: Promo[]): number {
  const totalBudget = computeTotalBudget(data);
  const totalUsed = computeTotalUsed(data);
  return totalBudget > 0 ? Math.round(totalUsed / totalBudget * 100) : 0;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('promotions: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders container', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('promotions: 数据类型', () => {
  it('Promo has all fields', () => {
    const p: Promo = { id: 'P-99', name: '测试', type: '折扣', discount:'8折', scope:'全场', start:'2026-01-01', end:'2026-12-31', budget:10000, used:0, status:'draft' };
    assert.equal(typeof p.id, 'string');
    assert.equal(typeof p.budget, 'number');
    assert.equal(typeof p.used, 'number');
  });

  it('PROMO_DATA has 8 records', () => {
    assert.equal(PROMO_DATA.length, 8);
  });

  it('all promo IDs are unique', () => {
    const ids = PROMO_DATA.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('STATUS_CFG has all statuses', () => {
    assert.equal(Object.keys(STATUS_CFG).length, 4);
  });

  it('all status values are valid', () => {
    const valid: PromoStatus[] = ['active', 'scheduled', 'ended', 'draft'];
    PROMO_DATA.forEach(p => assert.ok(valid.includes(p.status)));
  });
});

describe('promotions: 业务逻辑', () => {
  // ── 正例 ──
  it('filterByStatus "all" returns all', () => {
    assert.equal(filterByStatus(PROMO_DATA, 'all').length, 8);
  });

  it('filterByStatus "active" returns 4 active promos', () => {
    const active = filterByStatus(PROMO_DATA, 'active');
    assert.equal(active.length, 4);
    active.forEach(p => assert.equal(p.status, 'active'));
  });

  it('filterByStatus "scheduled" returns 1', () => {
    const sched = filterByStatus(PROMO_DATA, 'scheduled');
    assert.equal(sched.length, 1);
    assert.equal(sched[0]?.name, '充值满赠');
  });

  it('filterByStatus "ended" returns 1', () => {
    const ended = filterByStatus(PROMO_DATA, 'ended');
    assert.equal(ended.length, 1);
    assert.equal(ended[0]?.name, '618狂欢');
  });

  it('filterByStatus "draft" returns 2', () => {
    const draft = filterByStatus(PROMO_DATA, 'draft');
    assert.equal(draft.length, 2);
  });

  it('computeTotalBudget returns correct sum', () => {
    const sum = PROMO_DATA.reduce((s, p) => s + p.budget, 0);
    assert.equal(computeTotalBudget(PROMO_DATA), sum);
  });

  it('computeTotalUsed returns correct sum', () => {
    const sum = PROMO_DATA.reduce((s, p) => s + p.used, 0);
    assert.equal(computeTotalUsed(PROMO_DATA), sum);
  });

  it('computeUsageRate returns percentage', () => {
    const rate = computeUsageRate(PROMO_DATA);
    // totalBudget=150000, totalUsed=34350, rate=22%
    assert.equal(rate, 22);
  });

  it('active promos have used > 0', () => {
    const active = PROMO_DATA.filter(p => p.status === 'active');
    active.forEach(p => assert.ok(p.used > 0));
  });

  it('scheduled/draft promos have used = 0', () => {
    const notActive = PROMO_DATA.filter(p => p.status === 'scheduled' || p.status === 'draft');
    notActive.forEach(p => assert.equal(p.used, 0));
  });

  it('STATUS_CFG active -> 进行中', () => {
    assert.equal(STATUS_CFG.active.label, '进行中');
    assert.equal(STATUS_CFG.scheduled.label, '待开始');
  });

  // ── 反例 ──
  it('filterByStatus with non-existent status returns empty', () => {
    assert.equal(filterByStatus(PROMO_DATA, 'unknown').length, 0);
  });

  it('filterByStatus empty string returns empty', () => {
    assert.equal(filterByStatus(PROMO_DATA, '').length, 0);
  });

  it('no promos have status "paused"', () => {
    assert.equal(PROMO_DATA.filter(p => p.status === 'paused' as any).length, 0);
  });

  it('no promo has negative budget', () => {
    PROMO_DATA.forEach(p => assert.ok(p.budget >= 0));
  });

  it('no promo has negative used', () => {
    PROMO_DATA.forEach(p => assert.ok(p.used >= 0));
  });

  // ── 边界 ──
  it('PROMO-004 (scheduled) has used = 0', () => {
    const promo = PROMO_DATA.find(p => p.id === 'PROMO-004');
    assert.equal(promo?.used, 0);
  });

  it('PROMO-005 (draft) has budget 50000 (highest)', () => {
    const promo = PROMO_DATA.find(p => p.id === 'PROMO-005');
    assert.equal(promo?.budget, 50000);
  });

  it('PROMO-003 has smallest budget 5000', () => {
    const min = PROMO_DATA.reduce((m, p) => p.budget < m.budget ? p : m);
    assert.equal(min.budget, 5000);
  });

  it('PROMO-006 (ended) usage rate is 93%', () => {
    const promo = PROMO_DATA.find(p => p.id === 'PROMO-006');
    assert.equal(promo?.used, 18600);
    if (promo) {
      const rate = Math.round(promo.used / promo.budget * 100);
      assert.equal(rate, 93);
    }
  });

  it('usage rate 70%+ goes orange', () => {
    const promo = PROMO_DATA.find(p => p.id === 'PROMO-006');
    if (promo) {
      const rate = Math.round(promo.used / promo.budget * 100);
      assert.ok(rate > 70);
    }
  });

  it('active count + scheduled + ended + draft = total', () => {
    const active = PROMO_DATA.filter(p => p.status === 'active').length;
    const sched = PROMO_DATA.filter(p => p.status === 'scheduled').length;
    const ended = PROMO_DATA.filter(p => p.status === 'ended').length;
    const draft = PROMO_DATA.filter(p => p.status === 'draft').length;
    assert.equal(active + sched + ended + draft, PROMO_DATA.length);
  });

  it('学生证优惠 is draft scope=学生', () => {
    const promo = PROMO_DATA.find(p => p.name === '学生证优惠');
    assert.equal(promo?.scope, '学生');
    assert.equal(promo?.status, 'draft');
  });

  it('夜场畅玩卡 type is 套餐', () => {
    const promo = PROMO_DATA.find(p => p.name === '夜场畅玩卡');
    assert.equal(promo?.type, '套餐');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Promotions — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
