import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ProgressSegments } = require('./ProgressSegments');

describe('ProgressSegments', () => {
  const sampleSegments = [
    { label: 'A类', value: 50, color: '#3b82f6' },
    { label: 'B类', value: 30, color: '#10b981' },
    { label: 'C类', value: 20, color: '#f59e0b' },
  ];

  test('renders all segments', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: sampleSegments })
    );
    // 每个 segment 应有 title 属性展示信息
    assert(html.includes('A类: 50'), 'should contain A类 data');
    assert(html.includes('B类: 30'), 'should contain B类 data');
    assert(html.includes('C类: 20'), 'should contain C类 data');
  });

  test('renders percentage in title', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: sampleSegments })
    );
    assert(html.includes('50.0%'), '50% should be in title');
    assert(html.includes('30.0%'), '30% should be in title');
    assert(html.includes('20.0%'), '20% should be in title');
  });

  test('renders empty bar when segments is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: [] })
    );
    // 无 segment 时只渲染空容器
    assert(html.includes('height:20px'), 'empty bar should render container');
    assert(!html.includes('50.0%'), 'no percentage in empty state');
  });

  test('renders labels when showLabels is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: sampleSegments, showLabels: true })
    );
    assert(html.includes('50.0%'), 'label percentage should display');
    assert(html.includes('A类'), 'label name should display');
    assert(html.includes('B类'), 'label name should display');
  });

  test('accepts custom total', () => {
    const customSegments = [
      { label: '销售', value: 80, color: '#3b82f6' },
      { label: '售后', value: 20, color: '#f59e0b' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: customSegments, total: 100 })
    );
    assert(html.includes('80.0%'), '80% for sales');
    assert(html.includes('20.0%'), '20% for after-sales');
  });

  test('adds cursor pointer for clickable segments', () => {
    const clickableSegments = [
      { label: 'A', value: 40, color: '#3b82f6', onClick: () => {} },
      { label: 'B', value: 60, color: '#10b981' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: clickableSegments })
    );
    // 有 onClick 的 segment 应有 cursor: pointer
    assert(html.includes('pointer'), 'clickable segment should have pointer cursor');
  });

  test('supports data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressSegments, { segments: sampleSegments, 'data-testid': 'progress-segments-test' })
    );
    assert(html.includes('data-testid'), 'test id attribute should be present');
    assert(html.includes('progress-segments-test'), 'test id value should be correct');
  });
});
