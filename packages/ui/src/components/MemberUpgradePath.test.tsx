import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { createElement } = require('react');
const { MemberUpgradePath } = require('./MemberUpgradePath');

// ─── Helper: render JSX to string for testing ───────
function render(jsx) {
  return renderToStaticMarkup(jsx);
}

// ─── Mock Data ──────────────────────────────────────
const sampleTiers = [
  {
    key: 'bronze',
    name: '青铜会员',
    color: '#cd7f32',
    requiredValue: '注册即享',
    benefits: ['基础折扣 9.5折', '生日优惠券', '积分累积'],
  },
  {
    key: 'silver',
    name: '白银会员',
    color: '#c0c0c0',
    requiredValue: '累计消费 ≥ ¥500',
    conditions: [
      { label: '累计消费 ¥500', met: true },
      { label: '注册满 30 天', met: true },
      { label: '绑定手机号', met: true },
    ],
    benefits: ['折扣升级 9折', '每月1张满减券', '生日双倍积分'],
  },
  {
    key: 'gold',
    name: '黄金会员',
    color: '#ffd700',
    requiredValue: '累计消费 ≥ ¥2,000',
    conditions: [
      { label: '累计消费 ¥2,000', met: true },
      { label: '注册满 90 天', met: false },
      { label: '完成身份认证', met: true },
    ],
    benefits: ['折扣升级 8.5折', '每月2张满减券', '专属客服', '免运费'],
  },
];

// ─── Tests ──────────────────────────────────────────
describe('MemberUpgradePath', () => {
  test('renders all tier nodes', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    sampleTiers.forEach((tier) => {
      assert.ok(html.includes(`data-testid="tier-node-${tier.key}"`), `Missing tier-node-${tier.key}`);
    });
    assert.ok(html.includes('data-testid="member-upgrade-path"'));
  });

  test('renders title', () => {
    const html = render(
      createElement(MemberUpgradePath, { tiers: sampleTiers, subtitle: '测试门店' })
    );
    assert.ok(html.includes('会员升级路径'));
    assert.ok(html.includes('测试门店'));
  });

  test('renders empty state when tiers is empty', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: [] }));
    assert.ok(html.includes('data-testid="member-upgrade-path-empty"'));
    assert.ok(html.includes('暂无会员等级数据'));
  });

  test('marks current tier with data-current attribute', () => {
    const html = render(
      createElement(MemberUpgradePath, { tiers: sampleTiers, currentTierKey: 'silver' })
    );
    assert.ok(html.includes('data-current="true"'), 'data-current attribute missing');
    assert.ok(
      html.includes('<span') && html.includes('当前'),
      'Should contain "当前" badge'
    );
  });

  test('marks passed tiers as dimmed', () => {
    const html = render(
      createElement(MemberUpgradePath, { tiers: sampleTiers, currentTierKey: 'silver' })
    );
    assert.ok(html.includes('data-passed="true"'), 'Passed tiers should be marked');
  });

  test('shows next tier hint', () => {
    const html = render(
      createElement(MemberUpgradePath, { tiers: sampleTiers, currentTierKey: 'silver' })
    );
    assert.ok(html.includes('下一目标'), 'Should show next target hint');
  });

  test('renders arrows between tier nodes', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    assert.ok(html.includes('arrow-bronze-to-silver'));
    assert.ok(html.includes('arrow-silver-to-gold'));
  });

  test('renders conditions with met/unmet icons', () => {
    const html = render(
      createElement(MemberUpgradePath, { tiers: sampleTiers, currentTierKey: 'silver' })
    );
    // Met condition
    assert.ok(html.includes('✅'), 'Met condition should show checkmark');
    assert.ok(html.includes('⬜'), 'Unmet condition should show empty box');
  });

  test('renders condition labels', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    assert.ok(html.includes('累计消费 ¥500'));
    assert.ok(html.includes('注册满 90 天'));
  });

  test('renders benefits section', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    assert.ok(html.includes('data-testid="benefits-section"'));
    assert.ok(html.includes('当前等级权益'));
  });

  test('shows required value text', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    assert.ok(html.includes('注册即享'));
    assert.ok(html.includes('需 累计消费'));
  });

  test('has tier-steps container', () => {
    const html = render(createElement(MemberUpgradePath, { tiers: sampleTiers }));
    assert.ok(html.includes('data-testid="tier-steps"'));
  });
});
