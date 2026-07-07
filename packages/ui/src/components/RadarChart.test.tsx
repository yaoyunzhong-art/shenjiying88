import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { RadarChart } = require('./RadarChart');

const MOCK_DIMENSIONS = [
  { label: '活跃度', value: 85 },
  { label: '消费力', value: 72 },
  { label: '忠诚度', value: 90 },
  { label: '影响力', value: 45 },
  { label: '回访率', value: 68 },
];

const MOCK_SERIES = [
  { name: '当前会员', color: '#3b82f6', data: [85, 72, 90, 45, 68] },
];

const baseProps = {
  dimensions: MOCK_DIMENSIONS,
  series: MOCK_SERIES,
  width: 320,
  height: 360,
  title: '会员能力雷达',
};

describe('RadarChart', () => {
  // ==================== 基础渲染 ====================

  test('正确渲染雷达图容器', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, baseProps)
    );
    assert.match(html, /radar-chart/);
    assert.match(html, /<svg/);
  });

  test('渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, baseProps)
    );
    assert.match(html, /会员能力雷达/);
  });

  test('渲染所有维度标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, baseProps)
    );
    assert.match(html, /活跃度/);
    assert.match(html, /消费力/);
    assert.match(html, /忠诚度/);
    assert.match(html, /影响力/);
    assert.match(html, /回访率/);
  });

  test('维度少于3个时显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }],
        series: [{ name: 'S1', color: '#000', data: [50, 50] }],
        emptyText: '暂无数据',
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('series 为空时显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }, { label: 'C', value: 50 }],
        series: [],
        emptyText: '暂无数据',
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('data 长度与 dimensions 不匹配时显示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }, { label: 'C', value: 50 }],
        series: [{ name: 'S1', color: '#000', data: [50] }],
        emptyText: '暂无数据',
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('多系列时渲染图例', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }, { label: 'C', value: 50 }],
        series: [
          { name: '系列1', color: '#f00', data: [80, 60, 70] },
          { name: '系列2', color: '#0f0', data: [50, 90, 40] },
        ],
      })
    );
    assert.match(html, /系列1/);
    assert.match(html, /系列2/);
  });

  test('基线值存在时显示基线信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [
          { label: '活跃度', value: 85, baseline: 70 },
          { label: '消费力', value: 72, baseline: 60 },
          { label: '忠诚度', value: 90, baseline: 80 },
        ],
        series: [{ name: '当前会员', color: '#3b82f6', data: [85, 72, 90] }],
      })
    );
    assert.match(html, /radar-baseline-legend/);
    assert.match(html, /活跃度/);
  });

  test('showValues 控制数值标签显示', () => {
    const htmlTrue = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { showValues: true }))
    );
    assert.match(htmlTrue, />85</);
    assert.match(htmlTrue, />72</);

    const htmlFalse = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { showValues: false }))
    );
    // 数值不应作为独立 text 显示
    assert.doesNotMatch(htmlFalse, />85</);
  });

  test('showLegend 控制多系列图例显示', () => {
    const multiSeriesProps = {
      dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }, { label: 'C', value: 50 }],
      series: [
        { name: 'S1', color: '#f00', data: [80, 60, 70] },
        { name: 'S2', color: '#0f0', data: [50, 90, 40] },
      ],
      showLegend: false,
    };

    const htmlFalse = renderToStaticMarkup(
      React.createElement(RadarChart, multiSeriesProps)
    );
    assert.doesNotMatch(htmlFalse, /S1/);
    assert.doesNotMatch(htmlFalse, /S2/);

    const htmlTrue = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, multiSeriesProps, { showLegend: true }))
    );
    assert.match(htmlTrue, /S1/);
    assert.match(htmlTrue, /S2/);
  });

  test('fillArea=false 时没有填充 polygon', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { fillArea: false }))
    );
    // 只应有网格 polygon (fill="none")
    const svg = html;
    const polygonCount = (svg.match(/<polygon/g) || []).length;
    const fillNoneCount = (svg.match(/fill="none"/g) || []).length;
    // 网格 polygon 数量 = gridLevels(5) + 系列连接线(1) = 6
    assert.ok(polygonCount <= fillNoneCount + 1); // 允许 1 个非 none
  });

  test('fillArea=true 时存在填充 polygon', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { fillArea: true }))
    );
    // 填充属性应该在 html 中出现
    assert.match(html, /fill-opacity/);
  });

  test('传递自定义 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { className: 'my-radar' }))
    );
    assert.match(html, /my-radar/);
  });

  test('gridLevels 控制网格层数', () => {
    const html3 = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { gridLevels: 3 }))
    );
    // 3 层网格多边形 + 1 个系列连线多边形 = 4 polygon
    const polygonCount3 = (html3.match(/<polygon/g) || []).length;
    assert.ok(polygonCount3 >= 3);

    const html5 = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { gridLevels: 5 }))
    );
    const polygonCount5 = (html5.match(/<polygon/g) || []).length;
    assert.ok(polygonCount5 > polygonCount3);
  });

  test('不同 width/height 正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, Object.assign({}, baseProps, { width: 400, height: 440 }))
    );
    assert.match(html, /<svg/);
    assert.match(html, /width="400"/);
    assert.match(html, /height="440"/);
  });

  test('默认空文本为"暂无数据"', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }],
        series: [{ name: 'S1', color: '#000', data: [50, 50] }],
      })
    );
    assert.match(html, /暂无数据/);
  });

  test('默认参数正常渲染（无 title/showValues）', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, {
        dimensions: [{ label: 'A', value: 50 }, { label: 'B', value: 50 }, { label: 'C', value: 50 }],
        series: [{ name: '测试', color: '#f00', data: [80, 60, 70] }],
      })
    );
    assert.match(html, /<svg/);
    assert.match(html, />A</);
    assert.match(html, />B</);
    assert.match(html, />C</);
  });

  test('包含轴线线条', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, baseProps)
    );
    // 5 个维度 => 5 条轴线
    const lineCount = (html.match(/<line/g) || []).length;
    assert.ok(lineCount >= 5);
  });

  test('数据点圆点在 html 中存在', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadarChart, baseProps)
    );
    // 5 个数据点 => 5 个 circle
    const circleCount = (html.match(/<circle/g) || []).length;
    assert.ok(circleCount >= 5);
  });
});
