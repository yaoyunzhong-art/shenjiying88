import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ProgressCard } = require('./ProgressCard');

describe('ProgressCard', () => {
  const baseProps = {
    title: '月度销售目标',
    value: '¥85,200',
    progress: 75,
    unit: '元',
    variant: 'primary',
  };

  test('renders title and value', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, baseProps));
    assert(html.includes('月度销售目标'), 'title should be present');
    assert(html.includes('¥85,200'), 'value should be present');
  });

  test('renders unit text', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, baseProps));
    assert(html.includes('元'), 'unit should be present');
  });

  test('renders progress percentage', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, progress: 62 }));
    assert(html.includes('62%'), 'progress percentage should be present');
  });

  test('renders description', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, description: '已完成 ¥85,200' }));
    assert(html.includes('已完成 ¥85,200'), 'description should be present');
  });

  test('renders trend up arrow', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, trend: { direction: 'up', label: '+12%' } }));
    assert(html.includes('▲ +12%'), 'trend up should be shown');
  });

  test('renders trend down arrow', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, trend: { direction: 'down', label: '-5%' } }));
    assert(html.includes('▼ -5%'), 'trend down should be shown');
  });

  test('renders trend stable', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, trend: { direction: 'stable' } }));
    assert(html.includes('—'), 'trend stable should be shown');
  });

  test('renders icon', () => {
    const icon = React.createElement('span', { 'data-testid': 'test-icon' }, '💰');
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, icon }));
    assert(html.includes('💰'), 'icon should be present');
  });

  test('renders footer content', () => {
    const footer = React.createElement('button', null, '查看详情');
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, footer }));
    assert(html.includes('查看详情'), 'footer content should be present');
  });

  test('clamps progress to 100% maximum', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, progress: 150 }));
    assert(html.includes('100%'), 'progress should be clamped to 100');
  });

  test('clamps progress to 0% minimum', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, progress: -10 }));
    assert(html.includes('0%'), 'progress should be clamped to 0');
  });

  test('handles custom maxProgress', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, progress: 50, maxProgress: 200 }));
    assert(html.includes('25%'), 'should compute percentage against custom max');
  });

  test('renders with data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, 'data-testid': 'my-card' }));
    assert(html.includes('data-testid'), 'data-testid attribute should exist');
  });

  test('renders with variant success', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, variant: 'success' }));
    assert(html.includes('75%'), 'success variant should still show percentage');
  });

  test('renders with variant warning', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, variant: 'warning' }));
    assert(html.includes('75%'), 'warning variant should still show percentage');
  });

  test('renders with variant danger', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, variant: 'danger' }));
    assert(html.includes('75%'), 'danger variant should still show percentage');
  });

  test('renders minimal props without optional ones', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { title: '简单指标', value: '100', progress: 50 }));
    assert(html.includes('简单指标'), 'title should be present');
    assert(html.includes('100'), 'value should be present');
    assert(html.includes('50%'), 'progress should be present');
  });

  test('renders clickable card when onClick provided', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressCard, { ...baseProps, onClick: () => {} }));
    assert(html.includes('role="button"'), 'clickable card should have button role');
    assert(html.includes('tabindex="0"'), 'clickable card should be tabbable');
  });
});
