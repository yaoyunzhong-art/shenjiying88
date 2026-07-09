import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { InfiniteScroll } = require('./InfiniteScroll');

describe('InfiniteScroll', () => {
  test('renders children', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {} },
        React.createElement('div', null, 'item-1'),
        React.createElement('div', null, 'item-2'),
      ),
    );
    assert.ok(html.includes('item-1'));
    assert.ok(html.includes('item-2'));
  });

  test('shows loading text when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: true, onLoadMore: () => {}, loading: true },
        React.createElement('div', null, 'item'),
      ),
    );
    assert.ok(html.includes('加载中...'));
  });

  test('shows custom loading text', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: true, onLoadMore: () => {}, loading: true, loadingText: 'loading...' },
        React.createElement('div', null, 'item'),
      ),
    );
    assert.ok(html.includes('loading...'));
  });

  test('shows end text when no more data', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {}, endText: '--- END ---' },
        React.createElement('div', null, 'item'),
      ),
    );
    assert.ok(html.includes('--- END ---'));
  });

  test('shows end default text when no more data', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {} },
        React.createElement('div', null, 'x'),
      ),
    );
    assert.ok(html.includes('没有更多了'));
  });

  test('accepts custom className and style', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {}, className: 'my-scroll', style: { maxHeight: 400 } },
        React.createElement('span', null, 'hello'),
      ),
    );
    assert.ok(html.includes('my-scroll'));
    assert.ok(html.includes('max-height'));
  });

  test('does not show end text when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: true, onLoadMore: () => {}, loading: true, endText: 'END' },
        React.createElement('div', null, 'item'),
      ),
    );
    assert.ok(html.includes('加载中...'));
    assert.ok(!html.includes('END'));
  });

  test('renders with role="feed"', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {} },
        React.createElement('div', null, 'x'),
      ),
    );
    assert.ok(html.includes('role="feed"'));
  });

  test('renders aria-busy when loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: true, onLoadMore: () => {}, loading: true },
        React.createElement('div', null, 'x'),
      ),
    );
    assert.ok(html.includes('aria-busy="true"'));
  });

  test('handles horizontal direction', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        { hasMore: false, onLoadMore: () => {}, direction: 'horizontal' },
        React.createElement('div', null, 'h-item'),
      ),
    );
    assert.ok(html.includes('h-item'));
  });

  test('supports custom loader', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        InfiniteScroll,
        {
          hasMore: true,
          onLoadMore: () => {},
          loading: true,
          loader: React.createElement('div', { 'data-testid': 'custom-loader' }, 'Loading...'),
        },
        React.createElement('div', null, 'x'),
      ),
    );
    assert.ok(html.includes('custom-loader'));
  });
});
