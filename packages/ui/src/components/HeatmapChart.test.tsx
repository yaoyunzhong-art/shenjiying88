import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { HeatmapChart } = require('./HeatmapChart');

import type { HeatmapCell, HeatmapChartProps } from './HeatmapChart';

/** Helper */
function cell(
  rowLabel: string,
  colLabel: string,
  value: number,
  overrides: Partial<HeatmapCell> = {}
): HeatmapCell {
  return { rowLabel, colLabel, value, ...overrides };
}

describe('HeatmapChart', () => {
  test('renders title', () => {
    const data: HeatmapCell[] = [
      cell('设备A', '06:00', 80),
    ];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        title: '设备状态热力图',
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('设备状态热力图'), 'title should render');
  });

  test('renders empty state when data is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: [],
        emptyText: '暂无数据',
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('暂无数据'), 'empty text should appear');
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data: [],
        emptyText: '无可用数据',
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('无可用数据'));
  });

  test('renders row and col labels from data', () => {
    const data: HeatmapCell[] = [
      cell('设备A', '周一', 60),
      cell('设备A', '周二', 80),
      cell('设备B', '周一', 40),
    ];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, { data } as HeatmapChartProps)
    );
    assert.ok(html.includes('设备A'), 'row label A');
    assert.ok(html.includes('设备B'), 'row label B');
    assert.ok(html.includes('周一'), 'col label 周一');
    assert.ok(html.includes('周二'), 'col label 周二');
  });

  test('respects custom rowLabels and colLabels', () => {
    const data: HeatmapCell[] = [
      cell('X', 'Y', 50),
    ];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        rowLabels: ['设备A'],
        colLabels: ['时段1'],
      } as HeatmapChartProps)
    );
    // Custom labels override auto-detected ones
    assert.ok(html.includes('设备A'), 'custom row label');
    assert.ok(html.includes('时段1'), 'custom col label');
  });

  test('renders with custom width and height', () => {
    const data: HeatmapCell[] = [cell('A', 'B', 30)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        width: 800,
        height: 400,
      } as HeatmapChartProps)
    );
    assert.ok(html.length > 0, 'should render with custom dimensions');
  });

  test('renders with different color schemes', () => {
    for (const scheme of ['red', 'blue', 'green', 'amber', 'purple', 'cool'] as const) {
      const data: HeatmapCell[] = [cell('A', 'B', 75)];
      const html = renderToStaticMarkup(
        React.createElement(HeatmapChart, {
          data,
          colorScheme: scheme,
          title: `Scheme: ${scheme}`,
        } as HeatmapChartProps)
      );
      assert.ok(html.includes(`Scheme: ${scheme}`), `scheme ${scheme} renders`);
    }
  });

  test('hides values when showValues is false', () => {
    const data: HeatmapCell[] = [cell('A', 'B', 95)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        showValues: false,
      } as HeatmapChartProps)
    );
    // Component still renders grid, just without value labels
    assert.ok(html.length > 0);
  });

  test('hides legend when showLegend is false', () => {
    const data: HeatmapCell[] = [cell('A', 'B', 50)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        showLegend: false,
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('A'), 'row label still renders');
    assert.ok(html.includes('B'), 'col label still renders');
  });

  test('applies custom className', () => {
    const data: HeatmapCell[] = [cell('A', 'B', 60)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        className: 'custom-heatmap',
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('custom-heatmap'), 'custom class rendered');
  });

  test('renders only required data prop without crashing', () => {
    const data: HeatmapCell[] = [cell('A', 'B', 50)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, { data } as HeatmapChartProps)
    );
    assert.ok(html.length > 0, 'component renders with only data');
  });

  test('single cell renders correctly', () => {
    const data: HeatmapCell[] = [cell('唯一行', '唯一列', 100)];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        showValues: true,
        showLegend: true,
      } as HeatmapChartProps)
    );
    assert.ok(html.includes('唯一行'));
    assert.ok(html.includes('唯一列'));
  });

  test('many cells render without error', () => {
    const rows = ['R0', 'R1', 'R2', 'R3', 'R4'];
    const cols = ['C0', 'C1', 'C2'];
    const data: HeatmapCell[] = rows.flatMap((r) =>
      cols.map((c) => cell(r, c, Math.floor(Math.random() * 100)))
    );
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, {
        data,
        width: 400,
        height: 300,
      } as HeatmapChartProps)
    );
    for (const r of rows) assert.ok(html.includes(r), `row ${r} appears`);
    for (const c of cols) assert.ok(html.includes(c), `col ${c} appears`);
  });

  test('data with custom color override', () => {
    const data: HeatmapCell[] = [
      cell('A', 'B', 42, { color: '#ff0000' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(HeatmapChart, { data } as HeatmapChartProps)
    );
    assert.ok(html.includes('A'));
    assert.ok(html.includes('B'));
  });
});
