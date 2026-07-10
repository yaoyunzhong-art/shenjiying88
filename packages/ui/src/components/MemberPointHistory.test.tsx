import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { createElement } = require('react');
const { MemberPointHistory } = require('./MemberPointHistory');

// ─── Helper ──────────────────────────────────────────
function render(jsx) {
  return renderToStaticMarkup(jsx);
}

function extractByDataTestId(html, testId) {
  const re = new RegExp(`data-testid="${testId}"[^>]*>[\\s\\S]*?</[^>]+>`, 'g');
  const match = html.match(re);
  return match ? match : [];
}

function hasText(html, text) {
  return html.includes(text);
}

// ─── Mock data ───────────────────────────────────────
const mockRecords = [
  {
    id: '1', type: 'earn_purchase', amount: 200, balanceAfter: 1200,
    description: '订单 #ORD-001 消费获得',
    createdAt: '2026-07-01T10:30:00Z',
    orderId: 'ORD-001',
  },
  {
    id: '2', type: 'earn_signin', amount: 5, balanceAfter: 1205,
    description: '连续签到第3天奖励',
    createdAt: '2026-07-02T08:00:00Z',
  },
  {
    id: '3', type: 'spend_redeem', amount: -500, balanceAfter: 705,
    description: '兑换 ¥50 代金券',
    createdAt: '2026-07-03T14:20:00Z',
  },
  {
    id: '4', type: 'expire', amount: -100, balanceAfter: 605,
    description: '2025年度积分过期',
    createdAt: '2026-07-05T00:00:00Z',
  },
  {
    id: '5', type: 'earn_referral', amount: 300, balanceAfter: 905,
    description: '推荐好友注册奖励',
    createdAt: '2026-07-06T09:15:00Z',
  },
];

// ─── Tests ───────────────────────────────────────────

describe('MemberPointHistory', () => {
  test('renders summary stat cards with correct values', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords,
      totalPoints: 905,
      totalEarnedThisMonth: 505,
      totalSpentThisMonth: 600,
      expiringSoon: 100,
    }));

    assert.ok(hasText(html, '当前积分'));
    assert.ok(hasText(html, '905'));
    assert.ok(hasText(html, '+505'));
    assert.ok(hasText(html, '-600'));
    assert.ok(hasText(html, '即将过期'));
  });

  test('renders all records when activeFilter is all', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords,
      totalPoints: 905,
      totalEarnedThisMonth: 505,
      totalSpentThisMonth: 600,
    }));

    const rows = extractByDataTestId(html, 'point-record-row');
    assert.equal(rows.length, 5);
  });

  test('shows empty state when no records', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [],
      totalPoints: 0,
      totalEarnedThisMonth: 0,
      totalSpentThisMonth: 0,
    }));

    assert.ok(hasText(html, '暂无积分记录'));
  });

  test('shows loading skeleton when isLoading', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [],
      totalPoints: 0,
      totalEarnedThisMonth: 0,
      totalSpentThisMonth: 0,
      isLoading: true,
    }));

    assert.ok(hasText(html, 'member-point-history-loading'));
  });

  test('does not show member-point-history tag when loading', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [],
      totalPoints: 0,
      totalEarnedThisMonth: 0,
      totalSpentThisMonth: 0,
      isLoading: true,
    }));

    // The loading div uses testid member-point-history-loading, not member-point-history
    // We check that data-testid="member-point-history" does not appear as a standalone value
    const pattern = 'data-testid="member-point-history"';
    const exactMatch = html.includes(pattern);
    assert.equal(exactMatch, false, 'should not render member-point-history data-testid when loading');
  });

  test('renders filter bar when onFilterChange is provided', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords,
      totalPoints: 905,
      totalEarnedThisMonth: 505,
      totalSpentThisMonth: 600,
      onFilterChange: () => {},
    }));

    assert.ok(hasText(html, 'point-filter-bar'));
    assert.ok(hasText(html, '全部'));
    assert.ok(hasText(html, '签到'));
    assert.ok(hasText(html, '兑换'));
    assert.ok(hasText(html, '过期'));
  });

  test('does not render filter bar without onFilterChange', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords,
      totalPoints: 905,
      totalEarnedThisMonth: 505,
      totalSpentThisMonth: 600,
    }));

    assert.ok(!hasText(html, 'point-filter-bar'));
  });

  test('positive amount shows + prefix', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords.slice(0, 1),
      totalPoints: 1200,
      totalEarnedThisMonth: 200,
      totalSpentThisMonth: 0,
    }));

    assert.ok(hasText(html, '+200'));
  });

  test('negative amount shows - prefix', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [mockRecords[2]],
      totalPoints: 705,
      totalEarnedThisMonth: 0,
      totalSpentThisMonth: 500,
    }));

    assert.ok(hasText(html, '-500'));
  });

  test('shows balance after in record rows', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords.slice(0, 1),
      totalPoints: 1200,
      totalEarnedThisMonth: 200,
      totalSpentThisMonth: 0,
    }));

    assert.ok(hasText(html, '余额 1,200') || hasText(html, '余额 1200'));
  });

  test('record description is rendered', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords.slice(0, 1),
      totalPoints: 1200,
      totalEarnedThisMonth: 200,
      totalSpentThisMonth: 0,
    }));

    assert.ok(hasText(html, '订单 #ORD-001 消费获得'));
  });

  test('does not render expiring card when not provided', () => {
    const html = render(createElement(MemberPointHistory, {
      records: mockRecords,
      totalPoints: 905,
      totalEarnedThisMonth: 505,
      totalSpentThisMonth: 600,
    }));

    assert.ok(!hasText(html, '即将过期'));
  });

  test('passes custom className', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [],
      totalPoints: 0,
      totalEarnedThisMonth: 0,
      totalSpentThisMonth: 0,
      className: 'my-custom-class',
    }));

    assert.ok(hasText(html, 'my-custom-class'));
  });

  test('handles single record gracefully', () => {
    const html = render(createElement(MemberPointHistory, {
      records: [mockRecords[0]],
      totalPoints: 200,
      totalEarnedThisMonth: 200,
      totalSpentThisMonth: 0,
    }));

    const rows = extractByDataTestId(html, 'point-record-row');
    assert.equal(rows.length, 1);
  });
});
