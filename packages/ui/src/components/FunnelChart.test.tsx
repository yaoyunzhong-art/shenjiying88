import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FunnelChart } = require('./FunnelChart');

// ==================== 基础渲染 ====================

describe('FunnelChart', () => {
  describe('基础渲染', () => {
    const sampleSteps = [
      { label: '曝光', value: 10000 },
      { label: '点击', value: 3200 },
      { label: '注册', value: 850 },
      { label: '下单', value: 210 },
    ];

    test('渲染 SVG 元素', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: sampleSteps })
      );
      assert.match(html, /<svg/);
    });

    test('渲染所有步骤标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: sampleSteps })
      );
      assert.match(html, /曝光/);
      assert.match(html, /点击/);
      assert.match(html, /注册/);
      assert.match(html, /下单/);
    });

    test('渲染步骤值', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: sampleSteps })
      );
      // 10000 → 1.0万, 3200 → 3,200
      assert.ok(html.includes('1.0万'), '10000 应格式化为 1.0万');
      assert.ok(html.includes('3,200'), '3200 应格式化为 3,200');
    });

    test('渲染数字序列号', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: sampleSteps })
      );
      assert.match(html, />1</);
      assert.match(html, />2</);
      assert.match(html, />3</);
      assert.match(html, />4</);
    });

    test('渲染 role="img" 容器', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: sampleSteps })
      );
      assert.match(html, /role="img"/);
    });
  });

  // ==================== 空状态 ====================

  describe('空状态', () => {
    test('空数据渲染空状态文案', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: [] })
      );
      assert.match(html, /暂无数据/);
    });

    test('自定义空状态文案', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: [], emptyText: '请添加漏斗步骤' })
      );
      assert.match(html, /请添加漏斗步骤/);
    });

    test('空状态不渲染 SVG', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: [] })
      );
      assert.ok(!html.includes('<svg'));
    });

    test('null 步骤安全处理', () => {
      // @ts-expect-error testing undefined
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: undefined })
      );
      assert.match(html, /暂无数据/);
    });

    test('undefined steps 安全', () => {
      const html = renderToStaticMarkup(React.createElement(FunnelChart, {}));
      assert.match(html, /暂无数据/);
    });
  });

  // ==================== 标题 ====================

  describe('title 属性', () => {
    test('显示标题文本', () => {
      const steps = [{ label: 'A', value: 100 }];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, title: '用户转化漏斗' })
      );
      assert.match(html, /用户转化漏斗/);
    });

    test('设置 aria-label', () => {
      const steps = [{ label: 'A', value: 100 }];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, title: '销售漏斗' })
      );
      assert.match(html, /漏斗图: 销售漏斗/);
    });

    test('无标题时默认 aria-label', () => {
      const steps = [{ label: 'A', value: 100 }];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /漏斗图/);
    });
  });

  // ==================== 宽度 ====================

  describe('width 属性', () => {
    const steps = [{ label: 'A', value: 100 }];

    test('使用默认宽度 400', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /width="400"/);
    });

    test('应用自定义宽度', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, width: 600 })
      );
      assert.match(html, /width="600"/);
    });

    test('小宽度正常渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, width: 200 })
      );
      assert.match(html, /width="200"/);
    });
  });

  // ==================== 转化率 ====================

  describe('转化率显示', () => {
    const steps = [
      { label: '访问', value: 1000 },
      { label: '注册', value: 500 },
      { label: '购买', value: 100 },
    ];

    test('显示百分比标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, showConversionRate: true })
      );
      assert.match(html, /100\.0%/);
      assert.match(html, /50\.0%/);
      assert.match(html, /10\.0%/);
    });

    test('关闭转化率时不显示百分比', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, showConversionRate: false })
      );
      assert.ok(!html.includes('100.0%'));
    });

    test('支持自定义小数位数', () => {
      const steps2 = [
        { label: 'A', value: 333 },
        { label: 'B', value: 100 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: steps2, decimalPlaces: 2 })
      );
      assert.match(html, /30\.03%/);
    });
  });

  // ==================== 箭头 ====================

  describe('showArrows 属性', () => {
    const steps = [
      { label: 'A', value: 100 },
      { label: 'B', value: 50 },
    ];

    test('默认显示转化箭头', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, showArrows: true })
      );
      assert.match(html, /<polygon/);
    });

    test('关闭箭头时不渲染箭头多边形', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, showArrows: false })
      );
      // 仍渲染矩形，但箭头多边形不会出现在步骤间
      assert.match(html, /<rect/);
    });

    test('单步骤不渲染箭头', () => {
      const singleStep = [{ label: 'A', value: 100 }];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: singleStep })
      );
      assert.match(html, /<rect/);
    });
  });

  // ==================== 自定义颜色 ====================

  describe('自定义颜色', () => {
    test('使用 steps 中的自定义颜色', () => {
      const steps = [
        { label: 'A', value: 100, color: '#ff0000' },
        { label: 'B', value: 50, color: '#00ff00' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      // 验证颜色被用于 fill 属性
      assert.match(html, /fill=".*#ff0000.*"/);
    });

    test('未指定颜色时使用默认调色板', () => {
      const steps = [
        { label: 'A', value: 100 },
        { label: 'B', value: 50 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      // 默认蓝色 #3b82f6 应被使用
      assert.match(html, /fill=".*#3b82f6.*"/);
    });
  });

  // ==================== className ====================

  describe('className 属性', () => {
    const steps = [{ label: 'A', value: 100 }];

    test('应用自定义 className', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps, className: 'my-funnel' })
      );
      assert.match(html, /my-funnel/);
    });
  });

  // ==================== 边界情况 ====================

  describe('边界情况', () => {
    test('单步骤渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: [{ label: '仅曝光', value: 5000 }] })
      );
      assert.match(html, /仅曝光/);
    });

    test('步骤值为 0 时安全处理', () => {
      const steps = [
        { label: 'A', value: 100 },
        { label: 'B', value: 0 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /0\.0%/);
    });

    test('全零值数据', () => {
      const steps = [
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /<svg/);
    });

    test('超大步数 (10步)', () => {
      const manySteps = Array.from({ length: 10 }, (_, i) => ({
        label: `Step ${i + 1}`,
        value: 1000 - i * 100,
      }));
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps: manySteps })
      );
      const rects = html.match(/<rect/g);
      assert.ok(rects);
      assert.strictEqual(rects.length, 10);
    });

    test('大数据值', () => {
      const steps = [
        { label: '访问', value: 100_0000 },
        { label: '注册', value: 50_0000 },
        { label: '购买', value: 10_0000 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /100\.0万/);
      assert.match(html, /50\.0万/);
      assert.match(html, /10\.0万/);
    });
  });

  // ==================== description 字段 ====================

  describe('description 字段', () => {
    test('显示步骤描述在步骤下方', () => {
      const steps = [
        { label: 'A', value: 100 },
        { label: 'B', value: 50, description: '完成注册流程' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /完成注册流程/);
    });

    test('第一步带描述', () => {
      const steps = [
        { label: 'A', value: 100, description: '初始访问' },
        { label: 'B', value: 50 },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /初始访问/);
    });

    test('最后一步也显示描述', () => {
      const steps = [
        { label: 'A', value: 100 },
        { label: 'B', value: 50, description: '最终转化' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /最终转化/);
    });

    test('单步带描述', () => {
      const steps = [
        { label: 'A', value: 100, description: '初始' },
      ];
      const html = renderToStaticMarkup(
        React.createElement(FunnelChart, { steps })
      );
      assert.match(html, /初始/);
    });
  });

  // ==================== 导出验证 ====================

  describe('导出验证', () => {
    const steps = [{ label: 'A', value: 100 }];

    test('FunnelChart 是函数组件', () => {
      assert.strictEqual(typeof FunnelChart, 'function');
    });

    test('export default 是同一个组件', () => {
      const FunnelChartDefault = require('./FunnelChart').default;
      assert.strictEqual(FunnelChartDefault, FunnelChart);
    });
  });
});
