import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { HeatmapChart } = require('./HeatmapChart');

const SAMPLE_DATA = [
  { rowLabel: '设备A', colLabel: '00-04', value: 85 },
  { rowLabel: '设备A', colLabel: '04-08', value: 72 },
  { rowLabel: '设备A', colLabel: '08-12', value: 45 },
  { rowLabel: '设备B', colLabel: '00-04', value: 60 },
  { rowLabel: '设备B', colLabel: '04-08', value: 90 },
  { rowLabel: '设备B', colLabel: '08-12', value: 30 },
  { rowLabel: '设备C', colLabel: '00-04', value: 20 },
  { rowLabel: '设备C', colLabel: '04-08', value: 55 },
  { rowLabel: '设备C', colLabel: '08-12', value: 78 },
];

const ROW_LABELS = ['设备A', '设备B', '设备C'];
const COL_LABELS = ['00-04', '04-08', '08-12'];

describe('HeatmapChart', () => {
  test('renders with title', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      title: '设备状态热力图',
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
    }));
    assert.match(html, /data-testid="heatmap-root"/);
    assert.match(html, /data-testid="heatmap-title"/);
    assert.match(html, /设备状态热力图/);
  });

  test('renders SVG grid with data', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
    }));
    assert.match(html, /data-testid="heatmap-grid"/);
    assert.match(html, /<svg/);
    // Each cell value should appear in SVG text elements
    assert.match(html, />85</);
    assert.match(html, />72</);
    assert.match(html, />45</);
    assert.match(html, />90</);
  });

  test('renders row and column labels', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
    }));
    assert.match(html, /设备A/);
    assert.match(html, /设备B/);
    assert.match(html, /设备C/);
    assert.match(html, /00-04/);
    assert.match(html, /04-08/);
    assert.match(html, /08-12/);
  });

  test('auto-extracts row and col labels when not provided', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
    }));
    assert.match(html, /设备A/);
    assert.match(html, /设备C/);
    assert.match(html, /00-04/);
    assert.match(html, /08-12/);
  });

  test('renders empty state when no data', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: [],
    }));
    assert.match(html, /data-testid="heatmap-empty"/);
    assert.match(html, /暂无数据/);
    assert.doesNotMatch(html, /data-testid="heatmap-grid"/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: [],
      emptyText: '暂时没有热力图数据',
    }));
    assert.match(html, /暂时没有热力图数据/);
  });

  test('renders legend by default', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
    }));
    assert.match(html, /data-testid="heatmap-legend"/);
    assert.match(html, /密度/);
    assert.match(html, /低/);
    assert.match(html, /中/);
    assert.match(html, /高/);
  });

  test('hides legend when showLegend is false', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
      showLegend: false,
    }));
    assert.doesNotMatch(html, /data-testid="heatmap-legend"/);
  });

  test('hides values when showValues is false', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
      showValues: false,
    }));
    assert.doesNotMatch(html, />85</);
    assert.doesNotMatch(html, />72</);
  });

  test('renders with different color schemes', () => {
    const schemes = ['red', 'blue', 'green', 'amber', 'purple', 'cool'] as const;
    for (const scheme of schemes) {
      const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
        data: SAMPLE_DATA,
        rowLabels: ROW_LABELS,
        colLabels: COL_LABELS,
        colorScheme: scheme,
      }));
      assert.match(html, /data-testid="heatmap-grid"/);
    }
  });

  test('accepts custom width and height', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
      width: 800,
      height: 400,
    }));
    assert.match(html, /viewBox="0 0 800 400"/);
  });

  test('applies className', () => {
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: SAMPLE_DATA,
      rowLabels: ROW_LABELS,
      colLabels: COL_LABELS,
      className: 'my-heatmap',
    }));
    assert.match(html, /class="my-heatmap"/);
  });

  test('truncates long row labels', () => {
    const longData = [
      { rowLabel: '超级长设备名称测试案例', colLabel: 'A', value: 50 },
    ];
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: longData,
    }));
    // slice(0, 7) + '…' => '超级长设备名称测试案…' length 8, but actual is slice(0,7) + '…' = 8 chars
    assert.match(html, /超级长设备名称…/);
  });

  test('custom color overrides per cell', () => {
    const dataWithColor = [
      { rowLabel: 'A', colLabel: 'X', value: 50, color: 'rgba(255,0,0,0.9)' },
    ];
    const html = renderToStaticMarkup(React.createElement(HeatmapChart, {
      data: dataWithColor,
      rowLabels: ['A'],
      colLabels: ['X'],
    }));
    assert.match(html, /rgba\(255,0,0,0\.9\)/);
  });
});
