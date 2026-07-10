import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { WordCloudChart } = require('./WordCloudChart');

import type { WordCloudItem, WordCloudChartProps } from './WordCloudChart';

/** Helper */
function word(
  text: string,
  weight: number,
  overrides: Partial<WordCloudItem> = {}
): WordCloudItem {
  return { text, weight, ...overrides };
}

describe('WordCloudChart', () => {
  test('renders title', () => {
    const data: WordCloudItem[] = [word('服务', 80)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        title: 'AI 高频词',
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('AI 高频词'), 'title should render');
  });

  test('renders empty state when data is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data: [],
        emptyText: '暂无数据',
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('暂无数据'), 'empty text should appear');
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data: [],
        emptyText: '无词云数据',
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('无词云数据'));
  });

  test('renders word text content', () => {
    const data: WordCloudItem[] = [
      word('智能推荐', 95),
      word('会员管理', 72),
      word('数据分析', 60),
    ];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, { data } as WordCloudChartProps)
    );
    assert.ok(html.includes('智能推荐'), 'word 1 should render');
    assert.ok(html.includes('会员管理'), 'word 2 should render');
    assert.ok(html.includes('数据分析'), 'word 3 should render');
  });

  test('renders single word', () => {
    const data: WordCloudItem[] = [word('测试', 100)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, { data } as WordCloudChartProps)
    );
    assert.ok(html.includes('测试'), 'single word renders');
    assert.ok(html.includes('wordcloud-svg'), 'svg renders');
  });

  test('renders many words', () => {
    const words = [
      'AI', '数据', '分析', '管理', '系统', '会员', '推荐',
      '自动化', '智能', '决策', '报表', '监控', '告警', '优化',
      '预测', '模型', '训练', '部署', '配置', '同步',
    ];
    const data: WordCloudItem[] = words.map((w, i) =>
      word(w, 100 - i * 4)
    );
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        width: 600,
        height: 250,
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('AI'), 'first word renders');
    assert.ok(html.includes('wordcloud-svg'), 'svg renders');
  });

  test('renders with custom className', () => {
    const data: WordCloudItem[] = [word('测试', 50)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        className: 'custom-wordcloud',
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('custom-wordcloud'), 'custom class');
  });

  test('renders with different font strategies', () => {
    for (const fs of ['normal', 'bold', 'light', 'italic', 'bold-italic'] as const) {
      const data: WordCloudItem[] = [word('策略', 60)];
      const html = renderToStaticMarkup(
        React.createElement(WordCloudChart, {
          data,
          fontStrategy: fs,
          title: `Strategy: ${fs}`,
        } as WordCloudChartProps)
      );
      assert.ok(html.includes(`Strategy: ${fs}`), `strategy ${fs} renders`);
    }
  });

  test('shows legend when showLegend is true', () => {
    const data: WordCloudItem[] = [word('A', 80), word('B', 40)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        showLegend: true,
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('wordcloud-legend'), 'legend renders');
  });

  test('hides legend when showLegend is false', () => {
    const data: WordCloudItem[] = [word('A', 80)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        showLegend: false,
      } as WordCloudChartProps)
    );
    assert.ok(!html.includes('wordcloud-legend'), 'legend hidden');
  });

  test('renders with custom min/max fontSize', () => {
    const data: WordCloudItem[] = [
      word('大', 100),
      word('中', 60),
      word('小', 20),
    ];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, {
        data,
        minFontSize: 10,
        maxFontSize: 48,
      } as WordCloudChartProps)
    );
    assert.ok(html.includes('大') && html.includes('中') && html.includes('小'));
  });

  test('renders required data prop without crashing', () => {
    const data: WordCloudItem[] = [word('最小', 50)];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, { data } as WordCloudChartProps)
    );
    assert.ok(html.length > 0, 'component renders with only data');
  });

  test('items with custom color override', () => {
    const data: WordCloudItem[] = [
      word('红色词', 90, { color: '#ff0000' }),
      word('蓝色词', 70, { color: '#0000ff' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(WordCloudChart, { data } as WordCloudChartProps)
    );
    assert.ok(html.includes('红色词'), 'custom color word 1');
    assert.ok(html.includes('蓝色词'), 'custom color word 2');
  });
});
