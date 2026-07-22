import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { StatTrend } = require('./StatTrend');

describe('StatTrend', () => {
  // ============ Original tests ============

  test('renders up direction with value', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+12.5%' }),
    );
    assert.ok(html.includes('↑'));
    assert.ok(html.includes('+12.5%'));
    assert.ok(html.includes('text-green'));
  });

  test('renders down with invert yields green text', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'down', value: '-3.2%', invert: true }),
    );
    assert.ok(html.includes('↓'));
    assert.ok(html.includes('-3.2%'));
    assert.ok(html.includes('text-green')); // inverted: down = green
  });

  test('renders stable with label only', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', label: '持平' }),
    );
    assert.ok(html.includes('→'));
    assert.ok(html.includes('持平'));
    assert.ok(html.includes('text-gray'));
  });

  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+5%', className: 'ml-2' }),
    );
    assert.ok(html.includes('ml-2'));
  });

  test('renders all sizes sm md lg', () => {
    const sm = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '1', size: 'sm' }),
    );
    const md = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '2', size: 'md' }),
    );
    const lg = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '3', size: 'lg' }),
    );
    assert.ok(sm.includes('text-xs'));
    assert.ok(md.includes('text-sm'));
    assert.ok(lg.includes('text-base'));
  });

  // ============ New tests: edge cases & boundary values ============

  test('renders down direction with value (no invert) shows red', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'down', value: '-5.0%' }),
    );
    assert.ok(html.includes('↓'));
    assert.ok(html.includes('-5.0%'));
    assert.ok(html.includes('text-red')); // down default = red
  });

  test('renders up direction with invert yields red text', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+8%', invert: true }),
    );
    assert.ok(html.includes('↑'));
    assert.ok(html.includes('+8%'));
    assert.ok(html.includes('text-red')); // inverted: up = red
  });

  test('renders stable direction with value only', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', value: '0.0%' }),
    );
    assert.ok(html.includes('→'));
    assert.ok(html.includes('0.0%'));
    assert.ok(html.includes('text-gray'));
  });

  test('renders stable with both value and label', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', value: '±0', label: '无变化' }),
    );
    assert.ok(html.includes('→'));
    assert.ok(html.includes('±0'));
    assert.ok(html.includes('无变化'));
  });

  test('renders empty string value gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '' }),
    );
    assert.ok(html.includes('↑'));
  });

  test('renders with size sm and direction down shows correct classes', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'down', value: '-1%', size: 'sm', invert: true }),
    );
    assert.ok(html.includes('text-xs'));
    assert.ok(html.includes('text-green')); // inverted down = green
    assert.ok(html.includes('↓'));
  });

  test('renders with size lg and direction stable', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', label: '不变', size: 'lg' }),
    );
    assert.ok(html.includes('text-base'));
    assert.ok(html.includes('→'));
    assert.ok(html.includes('不变'));
  });

  test('renders direction up with label only (no value)', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', label: '增长' }),
    );
    assert.ok(html.includes('↑'));
    assert.ok(html.includes('增长'));
    assert.ok(html.includes('text-green'));
  });

  test('renders direction down with label only (no value)', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'down', label: '下降' }),
    );
    assert.ok(html.includes('↓'));
    assert.ok(html.includes('下降'));
  });

  test('multiple StatTrend components render independently', () => {
    const html = renderToStaticMarkup(
      React.createElement('div', null,
        React.createElement(StatTrend, { direction: 'up', value: '+10%', size: 'sm' }),
        React.createElement(StatTrend, { direction: 'down', value: '-5%', size: 'md' }),
        React.createElement(StatTrend, { direction: 'stable', value: '0%', size: 'lg' }),
      )
    );
    assert.ok(html.includes('+10%'));
    assert.ok(html.includes('-5%'));
    assert.ok(html.includes('0%'));
    assert.ok(html.includes('↑'));
    assert.ok(html.includes('↓'));
    assert.ok(html.includes('→'));
  });

  test('renders with special characters in value', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '> +100%' }),
    );
    assert.ok(html.includes('> +100%'));
  });

  test('renders sm size with direction stable invert has no effect since stable uses gray', () => {
    const htmlNormal = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', label: '平', invert: false }),
    );
    const htmlInverted = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', label: '平', invert: true }),
    );
    // Both should have text-gray for stable
    assert.ok(htmlNormal.includes('text-gray'));
    assert.ok(htmlInverted.includes('text-gray'));
  });

  test('renders with very long value strings', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+999.99% (环比增长)' }),
    );
    assert.ok(html.includes('+999.99% (环比增长)'));
    assert.ok(html.includes('↑'));
  });

  test('renders default size md when no size prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+1%' }),
    );
    assert.ok(html.includes('text-sm')); // md maps to text-sm
  });

  test('className is appended to the end of the class string', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up', value: '+2%', className: 'custom-class extra' }),
    );
    assert.ok(html.includes('custom-class'));
    assert.ok(html.includes('extra'));
  });

  test('renders without any optional props (only direction)', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'up' }),
    );
    assert.ok(html.includes('↑'));
    assert.ok(html.includes('text-green'));
  });

  test('renders value with negative numbers', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'down', value: '-100%', invert: false }),
    );
    assert.ok(html.includes('-100%'));
    assert.ok(html.includes('text-red'));
  });

  test('renders value = "0" with stable direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatTrend, { direction: 'stable', value: '0' }),
    );
    assert.ok(html.includes('0'));
  });
});
