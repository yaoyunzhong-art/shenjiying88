import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const REACT_DOM_SERVER = (() => {
  try {
    return require('react-dom/server.node.js');
  } catch {
    return require(
      '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
    );
  }
})();
const { PerformanceRanking } = require('./PerformanceRanking');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

const mockData = [
  { rank: 1, id: 'u1', name: '张伟', value: 258000, changePercent: 15.3, tag: '冠军门店', tagColor: '#ffd700' },
  { rank: 2, id: 'u2', name: '李娜', value: 192000, changePercent: 8.7, tag: '明星导购' },
  { rank: 3, id: 'u3', name: '王强', value: 165000, changePercent: -2.1 },
  { rank: 4, id: 'u4', name: '赵雪', value: 128000, changePercent: 5.0 },
  { rank: 5, id: 'u5', name: '刘洋', value: 95000, changePercent: 12.8, avatar: 'https://example.com/avatar.png' },
];

test('PerformanceRanking renders with title', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData, title: '本月业绩排行' }));
  assert.match(html, /本月业绩排行/);
});

test('PerformanceRanking renders all items', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  assert.match(html, /张伟/);
  assert.match(html, /李娜/);
  assert.match(html, /王强/);
  assert.match(html, /赵雪/);
  assert.match(html, /刘洋/);
});

test('PerformanceRanking limits items', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData, limit: 2 }));
  assert.match(html, /张伟/);
  assert.match(html, /李娜/);
  assert.equal(html.includes('王强'), false);
});

test('PerformanceRanking shows medals for top 3', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  // Medal emojis should be present
  assert.match(html, /🥇/);
  assert.match(html, /🥈/);
  assert.match(html, /🥉/);
});

test('PerformanceRanking shows value formatting for large numbers', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  assert.match(html, /25\.8万/);
  assert.match(html, /19\.2万/);
});

test('PerformanceRanking shows change percent with sign', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  assert.match(html, /\+15\.3%/);
  assert.match(html, /-2\.1%/);
});

test('PerformanceRanking shows valueLabel', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData, valueLabel: '销售额' }));
  assert.match(html, /销售额/);
});

test('PerformanceRanking shows empty state', () => {
  const html = render(React.createElement(PerformanceRanking, { data: [], emptyText: '暂无数据' }));
  assert.match(html, /暂无数据/);
});

test('PerformanceRanking renders avatar when provided', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  assert.match(html, /example\.com/);
});

test('PerformanceRanking renders tag', () => {
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  assert.match(html, /冠军门店/);
  assert.match(html, /明星导购/);
});

test('PerformanceRanking handles unit correctly', () => {
  const dataWithUnit = [
    { rank: 1, id: 'u1', name: '测试', value: 5000, unit: '分' },
  ];
  const html = render(React.createElement(PerformanceRanking, { data: dataWithUnit }));
  assert.match(html, /分/);
});

test('PerformanceRanking renders item without avatar using initial letter', () => {
  // Items without avatar should render initial letter in a circle
  const html = render(React.createElement(PerformanceRanking, { data: mockData }));
  // 张伟's first char is 张
  assert.match(html, />张</);
});
