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
});
