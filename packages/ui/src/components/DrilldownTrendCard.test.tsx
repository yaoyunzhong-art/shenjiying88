import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { DrilldownTrendCard } = require('./DrilldownTrendCard');

function renderToHtml(component: React.ReactElement): string {
  return renderToStaticMarkup(component);
}

function assertText(html: string, text: string, msg?: string) {
  assert.ok(html.includes(text), msg ?? `Expected "${text}" in rendered HTML`);
}

describe('DrilldownTrendCard', () => {
  const baseProps = {
    label: '本月销售额',
    value: '¥128,500',
    trendDirection: 'up',
    trendValue: '+12.5%',
  };

  test('renders the label and value', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} />);
    assertText(html, '本月销售额');
    assertText(html, '¥128,500');
  });

  test('renders the trend indicator with arrow', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} />);
    assertText(html, '↑');
    assertText(html, '+12.5%');
  });

  test('renders with stable trend', () => {
    const html = renderToHtml(
      <DrilldownTrendCard {...baseProps} trendDirection="stable" trendValue="±0%" />
    );
    assertText(html, '→');
    assertText(html, '±0%');
  });

  test('renders with down trend', () => {
    const html = renderToHtml(
      <DrilldownTrendCard {...baseProps} trendDirection="down" trendValue="-5.2%" />
    );
    assertText(html, '↓');
    assertText(html, '-5.2%');
  });

  test('renders the description text', () => {
    const html = renderToHtml(
      <DrilldownTrendCard {...baseProps} description="较上月增长明显" />
    );
    assertText(html, '较上月增长明显');
  });

  test('does not render sparkline when data has fewer than 2 points', () => {
    const html = renderToHtml(
      <DrilldownTrendCard {...baseProps} sparklineData={[{ label: 'Mon', value: 100 }]} />
    );
    assert.ok(!html.includes('svg'), 'Expected no SVG element');
  });

  test('renders sparkline when data has 2+ points', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        sparklineData={[
          { label: 'Mon', value: 100 },
          { label: 'Tue', value: 120 },
          { label: 'Wed', value: 115 },
        ]}
      />
    );
    assert.ok(html.includes('<svg'), 'Expected SVG element');
  });

  test('does not render drilldown when expandable is false', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        expandable={false}
        drilldownDetail={{
          title: '详细数据',
          items: [{ label: '线上', value: '¥82,000' }],
        }}
      />
    );
    assert.ok(!html.includes('详细数据'), 'Expected no drilldown content');
  });

  test('button is disabled when drilldownDetail is undefined', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} />);
    assert.ok(html.includes('disabled'), 'Expected disabled attribute');
    assert.ok(html.includes('aria-expanded="false"'), 'Expected aria-expanded="false"');
  });

  test('renders drilldown details when expanded by default', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        defaultExpanded
        drilldownDetail={{
          title: '渠道分解',
          description: '各渠道销售额明细',
          items: [
            { label: '线上', value: '¥82,000' },
            { label: '线下', value: '¥46,500' },
          ],
        }}
      />
    );
    assertText(html, '渠道分解');
    assertText(html, '各渠道销售额明细');
    assertText(html, '线上');
    assertText(html, '¥82,000');
    assertText(html, '线下');
    assertText(html, '¥46,500');
  });

  test('renders drilldown items with trend data', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        defaultExpanded
        drilldownDetail={{
          title: '详细数据',
          items: [
            {
              label: '线上',
              value: '¥82,000',
              trend: { value: '+15%', positive: true },
            },
            {
              label: '退货',
              value: '¥3,200',
              trend: { value: '-2%', positive: false },
            },
          ],
        }}
      />
    );
    assertText(html, '+15%');
    assertText(html, '-2%');
    assertText(html, '↑');
    assertText(html, '↓');
  });

  test('renders drilldown items with variant colors', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        defaultExpanded
        drilldownDetail={{
          title: '风险项',
          items: [
            { label: '高风险', value: '3', variant: 'error' },
            { label: '正常', value: '12', variant: 'success' },
          ],
        }}
      />
    );
    assertText(html, '高风险');
    assertText(html, '正常');
  });

  test('renders icon when provided in main card', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} icon={<span>💰</span>} />);
    assertText(html, '💰');
  });

  test('renders with info variant without errors', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} variant="info" />);
    assertText(html, '本月销售额');
  });

  test('button is disabled without drilldownDetail', () => {
    const html = renderToHtml(<DrilldownTrendCard {...baseProps} />);
    assert.ok(html.includes('disabled'), 'Expected disabled attribute');
  });

  test('button aria-expanded matches defaultExpanded', () => {
    // Not expanded by default
    const htmlNotExpanded = renderToHtml(<DrilldownTrendCard {...baseProps} drilldownDetail={{
      title: 'T', items: [{ label: 'A', value: '1' }]
    }} />);
    assert.ok(htmlNotExpanded.includes('aria-expanded="false"'));

    // Expanded with defaultExpanded
    const htmlExpanded = renderToHtml(<DrilldownTrendCard {...baseProps} defaultExpanded drilldownDetail={{
      title: 'T', items: [{ label: 'A', value: '1' }]
    }} />);
    assert.ok(htmlExpanded.includes('aria-expanded="true"'));
  });

  test('renders multiple sparkline data points', () => {
    const html = renderToHtml(
      <DrilldownTrendCard
        {...baseProps}
        sparklineData={[
          { label: 'Jan', value: 80 },
          { label: 'Feb', value: 95 },
          { label: 'Mar', value: 110 },
          { label: 'Apr', value: 105 },
          { label: 'May', value: 120 },
        ]}
      />
    );
    assert.ok(html.includes('<svg'), 'Expected SVG for 5 data points');
  });
});
