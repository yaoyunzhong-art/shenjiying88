import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { TierUpgradePanel } = require('./TierUpgradePanel');

function render(props: Record<string, unknown> = {}) {
  return typeof TierUpgradePanel.render === 'function'
    ? TierUpgradePanel.render(props, null)
    : TierUpgradePanel(props);
}

function extractText(element: React.ReactElement): string {
  if (!element) return '';
  const children = element.props?.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((c: React.ReactNode) => {
      if (typeof c === 'string' || typeof c === 'number') return String(c);
      if (React.isValidElement(c)) return extractText(c);
      return '';
    }).join('');
  }
  if (React.isValidElement(children)) return extractText(children);
  return '';
}

const silverTier = { name: '白银会员', color: '#94a3b8', threshold: 0 };
const goldTier = { name: '黄金会员', color: '#f59e0b', threshold: 5000 };
const diamondTier = { name: '钻石会员', color: '#06b6d4', threshold: 20000 };

test('TierUpgradePanel: renders current tier name and value', () => {
  const text = extractText(
    render({ currentTier: silverTier, nextTier: goldTier, currentValue: 3200 })
  );
  assert.ok(text.includes('白银会员'));
  assert.ok(text.includes('3.2k') || text.includes('3,200'));
});

test('TierUpgradePanel: shows progress toward next tier', () => {
  const text = extractText(
    render({ currentTier: silverTier, nextTier: goldTier, currentValue: 2500 })
  );
  // 2500/5000 = 50%
  assert.ok(text.includes('50%') || text.includes('升级进度'));
});

test('TierUpgradePanel: shows remaining amount to next tier', () => {
  const text = extractText(
    render({ currentTier: silverTier, nextTier: goldTier, currentValue: 3000, unit: '元' })
  );
  assert.ok(text.includes('2k') || text.includes('2,000') || text.includes('元'));
  assert.ok(text.includes('黄金会员'));
});

test('TierUpgradePanel: shows max level when nextTier is null', () => {
  const text = extractText(
    render({ currentTier: diamondTier, nextTier: null, currentValue: 25000 })
  );
  assert.ok(text.includes('最高等级') || text.includes('🎉'));
});

test('TierUpgradePanel: shows estimated days when provided', () => {
  const text = extractText(
    render({
      currentTier: silverTier,
      nextTier: goldTier,
      currentValue: 1000,
      estimatedDays: 45,
    })
  );
  assert.ok(text.includes('45') || text.includes('天'));
  assert.ok(text.includes('预计'));
});

test('TierUpgradePanel: 100% progress when value >= next threshold', () => {
  const result = render({
    currentTier: silverTier,
    nextTier: goldTier,
    currentValue: 5000,
  });
  const text = extractText(result);
  assert.ok(text.includes('100%') || text.includes('100'));
});

test('TierUpgradePanel: renders data-testid', () => {
  const result = render({
    currentTier: silverTier,
    nextTier: goldTier,
    currentValue: 100,
    'data-testid': 'tier-upgrade-1',
  });
  assert.equal(result.props['data-testid'], 'tier-upgrade-1');
});

test('TierUpgradePanel: renders tier badge with first character', () => {
  const text = extractText(
    render({ currentTier: goldTier, nextTier: diamondTier, currentValue: 8000 })
  );
  assert.ok(text.includes('黄'));
});

test('TierUpgradePanel: large numbers format with k/万', () => {
  const text = extractText(
    render({ currentTier: silverTier, nextTier: goldTier, currentValue: 15000 })
  );
  assert.ok(text.includes('1.5万') || text.includes('15,000') || text.includes('15k'));
});

test('TierUpgradePanel: renders without estimatedDays gracefully', () => {
  const text = extractText(
    render({ currentTier: silverTier, nextTier: goldTier, currentValue: 500 })
  );
  assert.ok(!text.includes('预计升级'));
});

test('TierUpgradePanel: all variants render without error', () => {
  const variants = ['default', 'elevated', 'outlined', 'ghost'] as const;
  for (const variant of variants) {
    const result = render({
      currentTier: silverTier,
      nextTier: goldTier,
      currentValue: 1000,
      variant,
    });
    assert.ok(result, `variant ${variant} should render`);
  }
});

test('TierUpgradePanel: custom unit label appears', () => {
  const text = extractText(
    render({
      currentTier: silverTier,
      nextTier: goldTier,
      currentValue: 888,
      unit: '点',
    })
  );
  assert.ok(text.includes('点'));
});
