import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { GaugeChart } = require('./GaugeChart');

// ==================== 基础渲染 ====================

describe('GaugeChart', () => {
  describe('基础渲染', () => {
    test('渲染 meter 角色容器', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 42 })
      );
      assert.match(html, /role="meter"/);
    });

    test('设置正确的 aria 属性', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 72 })
      );
      assert.match(html, /aria-valuenow="72"/);
      assert.match(html, /aria-valuemin="0"/);
      assert.match(html, /aria-valuemax="100"/);
    });

    test('显示当前值', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 55 })
      );
      assert.match(html, /55/);
    });

    test('显示后缀', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 80, suffix: '%' })
      );
      assert.match(html, /%/);
    });

    test('渲染 SVG 元素', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 30 })
      );
      assert.match(html, /<svg/);
    });

    test('渲染指针线', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50 })
      );
      assert.match(html, /<line/);
    });

    test('渲染中心圆', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50 })
      );
      const circles = html.match(/<circle/g);
      assert.ok(circles);
      assert.strictEqual(circles.length, 2);
    });

    test('渲染段弧线 path', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 40 })
      );
      assert.match(html, /<path/);
    });
  });

  // ==================== 标签 ====================

  describe('label 属性', () => {
    test('显示 label 文本', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 60, label: 'CPU 使用率' })
      );
      assert.match(html, /CPU 使用率/);
    });

    test('使用 label 作为 aria-label', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 10, label: '磁盘容量' })
      );
      assert.match(html, /aria-label="磁盘容量"/);
    });

    test('无 label 时有默认 aria-label', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 25 })
      );
      assert.match(html, /aria-label="仪表盘"/);
    });
  });

  // ==================== 范围 ====================

  describe('min / max 属性', () => {
    test('根据 min/max 归一化值', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50, min: 0, max: 200 })
      );
      // 50/200 = 25%
      assert.match(html, /aria-valuenow="25"/);
    });

    test('clamp 超出范围的值', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 150, min: 0, max: 100 })
      );
      assert.match(html, /aria-valuenow="100"/);
    });

    test('clamp 低于范围的值', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: -10, min: 0, max: 100 })
      );
      assert.match(html, /aria-valuenow="0"/);
    });

    test('正确处理负范围', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 20, min: -50, max: 50 })
      );
      // (20 - (-50)) / (50 - (-50)) * 100 = 70
      assert.match(html, /aria-valuenow="70"/);
    });
  });

  // ==================== 段配置 ====================

  describe('segments 属性', () => {
    const customSegments = [
      { from: 0, to: 50, color: '#3b82f6', label: '冷' },
      { from: 50, to: 80, color: '#f59e0b', label: '温' },
      { from: 80, to: 100, color: '#ef4444', label: '热' },
    ];

    test('渲染自定义段的图例标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 70, segments: customSegments })
      );
      assert.match(html, /冷/);
      assert.match(html, /温/);
      assert.match(html, /热/);
    });

    test('为每个段渲染弧线', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 45, segments: customSegments })
      );
      // 3 个背景段 + 1 个当前值段 = 4 个 path
      const paths = html.match(/<path/g);
      assert.ok(paths);
      assert.strictEqual(paths.length, 4);
    });

    test('没有 label 的段显示数值范围', () => {
      const noLabelSegments = [
        { from: 0, to: 50, color: '#22c55e' },
        { from: 50, to: 100, color: '#ef4444' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 30, segments: noLabelSegments })
      );
      assert.match(html, /0-50/);
      assert.match(html, /50-100/);
    });
  });

  // ==================== 尺寸 ====================

  describe('size 属性', () => {
    test('使用默认尺寸 160', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50 })
      );
      assert.match(html, /width="160"/);
    });

    test('应用自定义 size', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50, size: 240 })
      );
      assert.match(html, /width="240"/);
    });

    test('小尺寸正常渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50, size: 80 })
      );
      assert.match(html, /width="80"/);
    });
  });

  // ==================== arcWidth ====================

  describe('arcWidth 属性', () => {
    test('使用默认弧宽 18', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 40 })
      );
      assert.match(html, /stroke-width="18"/);
    });

    test('应用自定义弧宽', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 40, arcWidth: 28 })
      );
      assert.match(html, /stroke-width="28"/);
    });
  });

  // ==================== 刻度 ====================

  describe('showTicks 属性', () => {
    test('默认显示刻度标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50 })
      );
      // 应该有 6 个刻度（0,20,40,60,80,100）+ 可能的段标签
      const texts = html.match(/<text/g);
      assert.ok(texts);
      assert.ok(texts.length >= 4);
    });

    test('关闭刻度时不显示刻度 text 元素', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50, showTicks: false })
      );
      const texts = html.match(/<text/g);
      assert.strictEqual(texts, null);
    });
  });

  // ==================== className / style ====================

  describe('className 和 style', () => {
    test('应用自定义 className', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 30, className: 'my-gauge' })
      );
      assert.match(html, /my-gauge/);
    });

    test('应用自定义 style', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 30, style: { marginTop: 20 } })
      );
      assert.match(html, /margin-top:20px/);
    });
  });

  // ==================== 后缀 ====================

  describe('suffix 属性', () => {
    test('使用自定义后缀', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 88, suffix: '°C' })
      );
      assert.match(html, /°C/);
    });

    test('使用默认后缀 %', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50 })
      );
      assert.match(html, /%/);
    });

    test('支持空后缀', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 120, min: 0, max: 200, suffix: '' })
      );
      // 60% 归一化，只显示数值 60
      assert.match(html, />60</);
    });
  });

  // ==================== 边界情况 ====================

  describe('边界情况', () => {
    test('处理 value=0', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 0 })
      );
      assert.match(html, /aria-valuenow="0"/);
      assert.match(html, /<svg/);
    });

    test('处理 value=100', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 100 })
      );
      assert.match(html, /aria-valuenow="100"/);
      assert.match(html, /100/);
    });

    test('处理空段数组', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 50, segments: [] })
      );
      assert.match(html, /<svg/);
    });

    test('处理单个段', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, {
          value: 75,
          segments: [{ from: 0, to: 100, color: '#6366f1', label: '统一' }],
        })
      );
      assert.match(html, /统一/);
      assert.match(html, /<svg/);
    });
  });

  // ==================== 默认颜色段 ====================

  describe('默认颜色段', () => {
    test('包含正常 / 注意 / 告警三个默认段', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 65, label: '内存使用率' })
      );
      assert.match(html, /内存使用率/);
      assert.match(html, /正常/);
      assert.match(html, /注意/);
      assert.match(html, /告警/);
    });

    test('当前值为警告级别时对应颜色来自段', () => {
      const html = renderToStaticMarkup(
        React.createElement(GaugeChart, { value: 90, label: '负载' })
      );
      assert.match(html, /负载/);
      assert.match(html, /告警/);
    });
  });

  // ==================== 导出验证 ====================

  describe('导出验证', () => {
    test('GaugeChart 是函数组件', () => {
      assert.strictEqual(typeof GaugeChart, 'function');
    });

    test('export default 是同一个组件', () => {
      const GaugeChartDefault = require('./GaugeChart').default;
      assert.strictEqual(GaugeChartDefault, GaugeChart);
    });
  });
});
