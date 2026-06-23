import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SplitPane } = require('./SplitPane');

describe('SplitPane', () => {
  const FirstPane = () =>
    React.createElement('div', { 'data-testid': 'first' }, 'First');
  const SecondPane = () =>
    React.createElement('div', { 'data-testid': 'second' }, 'Second');

  test('renders both panels', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
      }),
    );
    assert.ok(html.includes('First'));
    assert.ok(html.includes('Second'));
  });

  test('renders with default horizontal direction (separator aria-orientation)', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
      }),
    );
    assert.ok(html.includes('role="separator"'));
    assert.ok(html.includes('aria-orientation="horizontal"'));
  });

  test('renders vertical direction separator', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        direction: 'vertical',
      }),
    );
    assert.ok(html.includes('aria-orientation="vertical"'));
  });

  test('renders with custom className', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        className: 'custom-split',
      }),
    );
    assert.ok(html.includes('custom-split'));
  });

  test('renders with accessible separator label', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        direction: 'horizontal',
      }),
    );
    assert.ok(html.includes('aria-label="horizontal resize handle"'));
  });

  test('renders first panel with flexBasis style (initialSplit reflected)', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        initialSplit: 0.3,
      }),
    );
    assert.ok(html.includes('flex-basis:30%'));
  });

  test('clamps initialSplit to valid range', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        initialSplit: 1.5, // should clamp to 1.0 => 100%
      }),
    );
    assert.ok(html.includes('flex-basis:100%'));
  });

  test('handles initialSplit 0', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        initialSplit: 0,
      }),
    );
    assert.ok(html.includes('flex-basis:0%'));
  });

  test('separator has tabIndex 0 for keyboard accessibility', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
      }),
    );
    assert.ok(html.includes('tabindex="0"'));
  });

  test('renders with custom dividerWidth', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        dividerWidth: 8,
      }),
    );
    // horizontal direction, divider width applied as CSS width
    assert.ok(html.includes('width:8px'));
  });

  test('renders with custom minHeight and minWidth', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        minHeight: 400,
        minWidth: 500,
      }),
    );
    assert.ok(html.includes('min-height:400px'));
    assert.ok(html.includes('min-width:500px'));
  });

  test('renders second panel as flex child', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
      }),
    );
    // second pane should have flex:1
    assert.ok(html.includes('flex:1'));
  });

  test('has split-pane-container class', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
      }),
    );
    assert.ok(html.includes('split-pane-container'));
  });

  test('handles nested React elements in panels', async () => {
    const NestedFirst = () =>
      React.createElement(
        'ul',
        null,
        React.createElement('li', { key: 'a' }, 'Item A'),
        React.createElement('li', { key: 'b' }, 'Item B'),
      );
    const NestedSecond = () =>
      React.createElement('span', null, 'Summary');

    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(NestedFirst),
        second: React.createElement(NestedSecond),
      }),
    );
    assert.ok(html.includes('Item A'));
    assert.ok(html.includes('Item B'));
    assert.ok(html.includes('Summary'));
  });

  test('vertical: renders separator with row-resize cursor style', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        direction: 'vertical',
      }),
    );
    assert.ok(html.includes('cursor:row-resize'));
  });

  test('horizontal: renders separator with col-resize cursor style', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        direction: 'horizontal',
      }),
    );
    assert.ok(html.includes('cursor:col-resize'));
  });

  test('renders with custom style prop', async () => {
    const html = renderToStaticMarkup(
      React.createElement(SplitPane, {
        first: React.createElement(FirstPane),
        second: React.createElement(SecondPane),
        style: { borderRadius: '8px' },
      }),
    );
    assert.ok(html.includes('border-radius:8px'));
  });
});
