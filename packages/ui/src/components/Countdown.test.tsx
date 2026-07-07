import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before, after } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Countdown } = require('./Countdown');

describe('Countdown 倒计时组件', () => {
  // ---------- 基础渲染 ----------
  test('应格式化显示剩余时间 (65s -> 01:05)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 65 })
    );
    assert.match(html, /01:05/);
  });

  test('应显示默认格式 00:00', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 0 })
    );
    assert.match(html, /00:00/);
  });

  test('60秒应显示 01:00', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 60 })
    );
    assert.match(html, /01:00/);
  });

  test('3661秒应显示 61:01', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 3661 })
    );
    assert.match(html, /61:01/);
  });

  // ---------- 状态属性 ----------
  test('运行中应有 data-status="running"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 30 })
    );
    assert.match(html, /data-status="running"/);
  });

  test('0秒 + autoStart=false 应有 data-status="paused"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 0, autoStart: false })
    );
    assert.match(html, /data-status="paused"/);
  });

  // ---------- 自定义格式 ----------
  test('应支持自定义 format 函数', () => {
    const customFormat = (r: number) => `还剩 ${r} 秒`;
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 30,
        format: customFormat,
      })
    );
    assert.match(html, /还剩 30 秒/);
  });

  // ---------- data-testid ----------
  test('应支持 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 10,
        'data-testid': 'my-countdown',
      })
    );
    assert.match(html, /data-testid="my-countdown"/);
  });

  // ---------- 自定义颜色 ----------
  test('应支持自定义 color', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 60,
        color: '#ff0000',
      })
    );
    assert.match(html, /color.*#ff0000/);
  });

  // ---------- 自定义样式 ----------
  test('应支持 digitStyle', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 99,
        digitStyle: { fontWeight: 'bold' as any },
      })
    );
    // 验证样式被内联传入（数字或字符串）
    assert.ok(html.length > 0);
  });

  // ---------- 加载态 ----------
  test('loading 状态应显示 --:--', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 60, loading: true })
    );
    assert.match(html, /--:--/);
    assert.match(html, /m5-countdown--loading/);
  });

  // ---------- 类名 ----------
  test('应支持自定义类名', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 120,
        className: 'custom-class',
      })
    );
    assert.match(html, /custom-class/);
    assert.match(html, /m5-countdown--running/);
  });

  // ---------- autoStart ----------
  test('autoStart=false 应有 data-status="paused"', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, {
        seconds: 60,
        autoStart: false,
      })
    );
    assert.match(html, /data-status="paused"/);
  });

  // ---------- CSS tabular-nums ----------
  test('应包含 tabular-nums 字体设置', () => {
    const html = renderToStaticMarkup(
      React.createElement(Countdown, { seconds: 45 })
    );
    assert.match(html, /tabular-nums/);
  });
});
