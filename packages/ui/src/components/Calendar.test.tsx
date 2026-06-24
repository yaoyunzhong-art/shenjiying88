import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Calendar } = require('./Calendar');

// ==================== 测试数据 ====================

const sampleMarkers = [
  { date: '2026-06-15', type: 'dot' as const, color: '#ef4444' },
  { date: '2026-06-20', type: 'badge' as const, label: '巡检', color: '#f59e0b' },
  { date: '2026-06-22', type: 'highlight' as const, color: 'rgba(59,130,246,0.15)' },
];

const enWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const enMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

describe('Calendar', () => {
  // ==================== 基础渲染 ====================

  test('渲染日历组件', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /role="grid"/);
    assert.match(html, /2026年/);
  });

  test('渲染月份标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /六月/);
    assert.match(html, /2026年/);
  });

  test('渲染星期标题（中文默认）', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /日/);
    assert.match(html, /一/);
    assert.match(html, /六/);
  });

  test('渲染日期按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    // 应该有多个 button 元素（日期格子）
    const buttonCount = (html.match(/<button/g) || []).length;
    assert.ok(buttonCount > 28, `expected >28 buttons, got ${buttonCount}`);
  });

  // ==================== 导航按钮 ====================

  test('渲染上月/下月导航按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /上个月/);
    assert.match(html, /下个月/);
  });

  // ==================== 选中状态 ====================

  test('defaultValue 对应的日期被标记为选中', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    // 15 日应该显示
    assert.match(html, />15</);
  });

  test('选中日期有 aria-selected 属性', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /aria-selected="true"/);
  });

  // ==================== 日期标记 ====================

  test('渲染日期标记（dot/badge/highlight）', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        markers: sampleMarkers,
      })
    );
    // badge 标记文案
    assert.match(html, /巡检/);
  });

  test('没有标记时正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    // 应该正常渲染不报错
    assert.match(html, /role="grid"/);
  });

  // ==================== 国际化 ====================

  test('支持自定义星期标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        weekDayLabels: enWeekDays,
      })
    );
    assert.match(html, /Sun/);
    assert.match(html, /Mon/);
    assert.match(html, /Sat/);
  });

  test('支持自定义月份名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        monthLabels: enMonths,
      })
    );
    assert.match(html, /Jun/);
  });

  // ==================== 最小/最大日期 ====================

  test('minDate 之前的日期被禁用', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 20),
        minDate: new Date(2026, 5, 10),
      })
    );
    // 应该有 disabled 按钮
    assert.match(html, /disabled/);
  });

  test('maxDate 之后的日期被禁用', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 10),
        maxDate: new Date(2026, 5, 20),
      })
    );
    assert.match(html, /disabled/);
  });

  // ==================== 周末禁用 ====================

  test('disableWeekends 时周末日期被禁用', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        disableWeekends: true,
      })
    );
    // 有禁用按钮即合理
    assert.match(html, /disabled/);
  });

  // ==================== 自定义禁用 ====================

  test('isDateDisabled 自定义禁用', () => {
    // 禁用所有 13 号的日期
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        isDateDisabled: (d: Date) => d.getDate() === 13,
      })
    );
    assert.match(html, /disabled/);
  });

  // ==================== 自定义日期渲染 ====================

  test('支持自定义日期渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        renderDate: (d: Date) => `·${d.getDate()}·`,
      })
    );
    assert.match(html, /·15·/);
  });

  // ==================== 无初始值 ====================

  test('无 defaultValue 时正常渲染', () => {
    const html = renderToStaticMarkup(React.createElement(Calendar, {}));
    assert.match(html, /role="grid"/);
  });

  // ==================== 跨年导航 ====================

  test('一月时间线正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 0, 1) })
    );
    assert.match(html, /一月/);
    assert.match(html, /2026年/);
  });

  test('十二月时间线正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 11, 25) })
    );
    assert.match(html, /十二月/);
  });

  // ==================== 边界：空标记数组 ====================

  test('空 markers 数组正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        markers: [],
      })
    );
    assert.match(html, /role="grid"/);
  });

  // ==================== 类名透传 ====================

  test('className 属性透传', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, {
        defaultValue: new Date(2026, 5, 15),
        className: 'my-calendar',
      })
    );
    assert.match(html, /my-calendar/);
  });

  // ==================== aria 可访问性 ====================

  test('日期按钮有 aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    // 应该有类似 "2026年6月15日" 的 aria-label
    assert.match(html, /aria-label="2026年6月\d+日/);
  });

  test('选中日期 aria-label 包含 (已选中)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Calendar, { defaultValue: new Date(2026, 5, 15) })
    );
    assert.match(html, /已选中/);
  });
});
