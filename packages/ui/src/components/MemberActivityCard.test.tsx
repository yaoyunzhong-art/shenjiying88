/**
 * MemberActivityCard.test.tsx — L1 JMeter-style tests
 * Pattern: 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { MemberActivityCard } = require('./MemberActivityCard');

// ---- Mock 活动数据 ----

const purchaseActivity = {
  id: 'act-001',
  type: 'purchase',
  title: '购买了钻石护发套餐',
  description: '会员在星光店购买了钻石护发套餐，使用会员价¥168.00，优惠券抵扣¥20',
  amount: 168.00,
  points: 168,
  createdAt: '2026-06-28 14:30',
};

const rechargeActivity = {
  id: 'act-002',
  type: 'recharge',
  title: '会员卡充值',
  description: '通过微信支付充值¥1,000，获得赠送¥100',
  amount: 1000,
  createdAt: '2026-06-27 10:00',
};

const redeemActivity = {
  id: 'act-003',
  type: 'redeem',
  title: '兑换了年度美容护理套装',
  description: '使用 5,000 积分兑换年度美容护理套装（价值¥399）',
  points: -5000,
  createdAt: '2026-06-25 09:15',
};

const visitActivity = {
  id: 'act-004',
  type: 'visit',
  title: '到店签到',
  description: '会员光临朝阳大悦城店',
  points: 20,
  createdAt: '2026-06-24 11:20',
};

const reviewActivity = {
  id: 'act-005',
  type: 'review',
  title: '评价了王牌造型服务',
  description: '5星好评：非常满意效果，下次还会再来',
  points: 50,
  createdAt: '2026-06-23 16:45',
};

const referralActivity = {
  id: 'act-006',
  type: 'referral',
  title: '推荐好友注册成功',
  description: '推荐好友「李小花」注册并完成首次消费',
  points: 500,
  createdAt: '2026-06-20 20:00',
};

const upgradeActivity = {
  id: 'act-007',
  type: 'upgrade',
  title: '会员等级升级',
  description: '从黄金会员升级为钻石会员，累计消费达¥8,888',
  points: 1000,
  createdAt: '2026-06-15 08:00',
};

const registerActivity = {
  id: 'act-008',
  type: 'register',
  title: '新会员注册',
  description: '通过微信小程序注册并领取新人礼包',
  points: 200,
  createdAt: '2026-06-01 09:00',
};

function render(props: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(React.createElement(MemberActivityCard, props));
}

// ---- 测试: 基础渲染 ----

describe('MemberActivityCard — 基础渲染', () => {
  it('应渲染购买活动的标题和金额', () => {
    const html = render({ activity: purchaseActivity });
    assert.ok(html.includes('购买了钻石护发套餐'), '应包含活动标题');
    assert.ok(html.includes('168.00'), '应包含格式化金额');
    assert.ok(html.includes('data-testid'), '应包含 data-testid');
    assert.ok(html.includes('data-activity-type="purchase"'), '应包含 activity type');
  });

  it('应渲染充值活动的金额', () => {
    const html = render({ activity: rechargeActivity });
    assert.ok(html.includes('1000.00'), '充值金额应格式化显示');
    assert.ok(html.includes('data-testid="activity-act-002-amount"'), '应包含 amount data-testid');
  });

  it('应渲染兑换活动的积分变动', () => {
    const html = render({ activity: redeemActivity });
    assert.ok(html.includes('-5000'), '积分消耗应显示为负值');
    assert.ok(html.includes('积分'));
  });

  it('应渲染 visit 类型签到', () => {
    const html = render({ activity: visitActivity });
    assert.ok(html.includes('到店'), '应包含活动类型标签');
    assert.ok(html.includes('2026-06-24'), '应包含时间');
    assert.ok(html.includes('data-activity-type="visit"'), 'type 应为 visit');
  });

  it('应渲染 review 类型', () => {
    const html = render({ activity: reviewActivity });
    assert.ok(html.includes('评价'));
    assert.ok(html.includes('50'));
    assert.ok(html.includes('积分'));
  });

  it('应渲染 referral 类型', () => {
    const html = render({ activity: referralActivity });
    assert.ok(html.includes('推荐好友'));
    assert.ok(html.includes('+500'));
    assert.ok(html.includes('data-activity-type="referral"'));
  });

  it('应渲染 upgrade 类型', () => {
    const html = render({ activity: upgradeActivity });
    assert.ok(html.includes('会员等级升级'));
  });

  it('应渲染 register 类型', () => {
    const html = render({ activity: registerActivity });
    assert.ok(html.includes('新会员注册'));
  });
});

// ---- 测试: compact 模式 ----

describe('MemberActivityCard — compact 紧凑模式', () => {
  it('compact 模式应正常渲染', () => {
    const html = render({ activity: visitActivity, compact: true });
    assert.ok(html.includes('到店签到'));
    assert.ok(html.includes('data-testid="member-activity-act-004"'));
  });

  it('compact 模式无 amount 时正常', () => {
    const noAmountActivity = {
      id: 'act-009',
      type: 'register',
      title: '注册送积分',
      description: '新人注册送积分',
      createdAt: '2026-06-01',
    };
    const html = render({ activity: noAmountActivity, compact: true });
    assert.ok(html.includes('注册送积分'));
    assert.ok(!html.includes('activity-amount'), '不应渲染金额区域');
  });
});

// ---- 测试: onClick 交互 ----

describe('MemberActivityCard — 点击交互', () => {
  it('无 onClick 时不应有 role="button"', () => {
    const html = render({ activity: purchaseActivity });
    assert.ok(!html.includes('role="button"'), '无 onClick 时不应有 button role');
  });

  it('有 onClick 时应渲染 role="button"', () => {
    const html = render({ activity: purchaseActivity, onClick: () => {} });
    assert.ok(html.includes('role="button"'), '有 onClick 时应渲染 button role');
    assert.ok(html.includes('tabindex="0"'), '应有 tabIndex');
  });
});

// ---- 测试: 边界情况 ----

describe('MemberActivityCard — 边界情况', () => {
  it('amount 为 0 也应显示', () => {
    const zeroAmountActivity = {
      id: 'act-zero',
      type: 'purchase',
      title: '0元体验',
      description: '0元体验活动消费',
      amount: 0,
      createdAt: '2026-06-30',
    };
    const html = render({ activity: zeroAmountActivity });
    assert.ok(html.includes('0.00'), '0 元应显示为 ¥0.00');
    assert.ok(html.includes('data-activity-type="purchase"'));
  });

  it('巨大金额应格式化以万为单位', () => {
    const bigAmountActivity = {
      id: 'act-big',
      type: 'recharge',
      title: '大额充值',
      description: '企业账户大额充值',
      amount: 500000,
      createdAt: '2026-06-30',
    };
    const html = render({ activity: bigAmountActivity });
    assert.ok(html.includes('50.0'), '50万应格式化为 50.0');
  });

  it('description 超长时不应抛出异常', () => {
    const longDescActivity = {
      id: 'act-long',
      type: 'review',
      title: '长评价',
      description: 'A'.repeat(1000),
      createdAt: '2026-06-30',
    };
    assert.doesNotThrow(() => {
      render({ activity: longDescActivity });
    });
  });

  it('无 amount 和 points 的正常渲染', () => {
    const minimalActivity = {
      id: 'act-min',
      type: 'visit',
      title: '签到',
      description: '到店签到',
      createdAt: '2026-06-30',
    };
    const html = render({ activity: minimalActivity });
    assert.ok(html.includes('签到'), '最小活动数据应正常渲染');
    assert.ok(!html.includes('积分'), '无积分时不显示积分');
    assert.ok(html.includes('data-testid="member-activity-act-min"'));
  });
});
