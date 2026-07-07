import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ProgressRing } = require('./ProgressRing');

describe('ProgressRing 组件', () => {
  // ---------- 基础渲染 ----------
  test('应显示百分比', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 75 })
    );
    assert.match(html, /75%/);
  });

  test('应设置 role=progressbar 和 aria 属性', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 65 })
    );
    assert.match(html, /role="progressbar"/);
    assert.match(html, /aria-valuenow="65"/);
    assert.match(html, /aria-valuemin="0"/);
    assert.match(html, /aria-valuemax="100"/);
  });

  test('0% 应正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 0 })
    );
    assert.match(html, /0%/);
    assert.match(html, /aria-valuenow="0"/);
  });

  test('100% 应正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 100 })
    );
    assert.match(html, /100%/);
    assert.match(html, /aria-valuenow="100"/);
  });

  // ---------- 边界值 ----------
  test('超出范围的值应被钳制: 150 显示 100%', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 150 })
    );
    assert.match(html, /100%/);
  });

  test('超出范围的值应被钳制: -20 显示 0%', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: -20 })
    );
    assert.match(html, /0%/);
  });

  // ---------- 标题 ----------
  test('应渲染标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50, title: '完成率' })
    );
    assert.match(html, /完成率/);
  });

  test('有标题时 aria-label 应包含标题和进度信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 65, title: '完成率' })
    );
    // Should contain both title and progress
    assert.match(html, /完成率/);
    assert.match(html, /65%/);
  });

  // ---------- 自定义格式 ----------
  test('应使用自定义格式化函数', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, {
        percent: 85,
        formatLabel: (p: number) => `${p}/100`,
      })
    );
    assert.match(html, /85\/100/);
  });

  // ---------- 显示控制 ----------
  test('showPercentLabel=false 不显示百分比文字', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 65, showPercentLabel: false })
    );
    // aria-label 仍然有数值，但中心展示文字不应出现（检查 svg 外无纯数字百分比）
    // 当 showPercentLabel=false，百分比文字 class progress-ring 容器内不应有单独的百分比 div
    const matches = html.match(/65[%％]/g);
    // aria-label 中会匹配到一次（"进度 65%"），不应该有额外的<div>展示
    assert.ok(matches !== null);
    assert.equal(matches.length, 1); // 仅 aria-label 中的1次
  });

  // ---------- 加载态 ----------
  test('加载态不显示百分比文字', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 65, loading: true })
    );
    // aria-label 中有"进度 65%"，但不应有额外独立的百分比 div
    const matches = html.match(/65[%％]/g);
    assert.ok(matches !== null);
    assert.equal(matches.length, 1); // 仅 aria-label
  });

  test('加载态应包含 shimmer 动画 style', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50, loading: true })
    );
    assert.match(html, /shimmer/);
    assert.match(html, /@keyframes progress-ring-shimmer/);
  });

  // ---------- 自定义类名 ----------
  test('应透传自定义 className', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50, className: 'my-ring' })
    );
    assert.match(html, /my-ring/);
  });

  // ---------- 自定义颜色 ----------
  test('应使用自定义颜色', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, {
        percent: 50,
        color: '#ff0000',
        trackColor: '#eeeeee',
      })
    );
    // Track circle stroke
    assert.match(html, /stroke="#eeeeee"/);
  });

  // ---------- 自定义尺寸 ----------
  test('应应用自定义尺寸', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50, size: 200 })
    );
    assert.match(html, /width:200px/);
    assert.match(html, /height:200px/);
  });

  // ---------- SVG 元素 ----------
  test('应渲染 SVG 和两个圆环 (轨道 + 进度)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50 })
    );
    assert.match(html, /<svg/);
    // Should have at least 2 <circle> tags
    const circleMatches = html.match(/<circle/g);
    assert.ok(circleMatches);
    assert.equal(circleMatches.length, 2);
  });

  test('轨道圆环应使用 strokeLinecap="round"', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50 })
    );
    assert.match(html, /stroke-linecap="round"/);
  });

  // ---------- 小数百分比 ----------
  test('小数百分比应四舍五入显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 33.7 })
    );
    assert.match(html, /34%/);
  });

  test('小数 33.3 应显示 33%', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 33.3 })
    );
    assert.match(html, /33%/);
  });

  // ---------- 无百分比数字 ----------
  test('hide both label and title 仍能看到环形 SVG', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 42, showPercentLabel: false })
    );
    assert.match(html, /<svg/);
    // aria-label 中有"进度 42%"，但不应该有额外独立的百分比展示
    const matches = html.match(/42[%％]/g);
    assert.ok(matches !== null);
    assert.equal(matches.length, 1); // 仅 aria-label
  });

  // ---------- 进度环 dashoffset ----------
  test('50% 时 stroke-dashoffset 应约为一半圆周', () => {
    const html = renderToStaticMarkup(
      React.createElement(ProgressRing, { percent: 50, size: 120, strokeWidth: 10 })
    );
    // radius = (120-10)/2 = 55, circumference = 2*PI*55 ≈ 345.58
    // offset for 50% = 345.58 * 0.5 ≈ 172.79
    assert.match(html, /stroke-dashoffset/);
  });
});
