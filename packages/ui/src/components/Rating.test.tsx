import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Rating } = require('./Rating');

describe('Rating', () => {
  test('renders with default props', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {}),
    );
    assert.match(html, /role="radiogroup"/);
    assert.match(html, /aria-label="评分"/);
    assert.match(html, /0 \/ 5/);
    // Should render 5 stars
    const starMatches = html.match(/role="radio"/g);
    assert.equal(starMatches?.length, 5);
  });

  test('renders correct number of stars based on max', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { max: 3 }),
    );
    const starMatches = html.match(/role="radio"/g);
    assert.equal(starMatches?.length, 3);
    assert.match(html, /0 \/ 3/);
  });

  test('shows filled stars for given value', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 3, max: 5, interactive: false }),
    );
    assert.match(html, /data-filled="true"/);
    assert.match(html, /data-filled="false"/);
    assert.match(html, /3 \/ 5/);
  });

  test('max stars show when value equals max', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 5, max: 5, interactive: false }),
    );
    assert.match(html, /5 \/ 5/);
    // All stars should be filled
    const filledMatches = html.match(/data-filled="true"/g);
    assert.equal(filledMatches?.length, 5);
  });

  test('zero value shows empty stars', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 0, max: 5, interactive: false }),
    );
    assert.match(html, /0 \/ 5/);
    const filledMatches = html.match(/data-filled="true"/g);
    assert.equal(filledMatches, null); // no stars filled
  });

  test('clamps value between 0 and max', () => {
    const over = renderToStaticMarkup(
      React.createElement(Rating, { value: 10, max: 5, interactive: false }),
    );
    assert.match(over, /5 \/ 5/);

    const under = renderToStaticMarkup(
      React.createElement(Rating, { value: -3, max: 5, interactive: false }),
    );
    assert.match(under, /0 \/ 5/);
  });

  test('uses activeColor and inactiveColor', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 2,
        max: 5,
        interactive: false,
        activeColor: '#ff0000',
        inactiveColor: '#cccccc',
      }),
    );
    assert.match(html, /#ff0000/);
    assert.match(html, /#cccccc/);
  });

  test('custom size applied to stars', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 3, size: 32, interactive: false }),
    );
    // SVG width/height should reflect size
    assert.match(html, /width="32"/);
    assert.match(html, /height="32"/);
  });

  test('hides value label when showValue is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 4, showValue: false, interactive: false }),
    );
    assert.doesNotMatch(html, /data-testid=".*-label"/);
  });

  test('uses custom formatLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 3,
        max: 5,
        formatLabel: (v: number, m: number) => `${v}星 / ${m}星`,
        interactive: false,
      }),
    );
    assert.match(html, /3星 \/ 5星/);
  });

  test('custom aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 2,
        'aria-label': '商品评分',
        interactive: false,
      }),
    );
    assert.match(html, /aria-label="商品评分"/);
  });

  test('data-testid propagated to elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 3,
        'data-testid': 'my-rating',
        interactive: false,
      }),
    );
    assert.match(html, /data-testid="my-rating"/);
    assert.match(html, /data-testid="my-rating-label"/);
    assert.match(html, /data-testid="my-rating-star-0"/);
    assert.match(html, /data-testid="my-rating-star-4"/);
  });

  test('starLabels render as aria-label on each star', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 2,
        starLabels: ['糟糕', '不好', '一般', '好', '很好'],
        interactive: false,
      }),
    );
    assert.match(html, /aria-label="糟糕"/);
    assert.match(html, /aria-label="很好"/);
  });

  test('half-star precision enabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 3.5, max: 5, half: true, interactive: false }),
    );
    assert.match(html, /3\.5 \/ 5/);
    // Half-filled stars have clipPath
    assert.match(html, /clipPath/);
  });

  test('interactive stars are clickable', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 2, interactive: true }),
    );
    assert.match(html, /cursor:pointer/);
    // tabIndex 0 means focusable
    assert.match(html, /tabindex="0"/);
  });

  test('non-interactive stars are not clickable', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 2, interactive: false }),
    );
    assert.match(html, /cursor:default/);
    assert.match(html, /tabindex="-1"/);
  });

  test('className propagated to root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 3,
        className: 'custom-rating',
        interactive: false,
      }),
    );
    assert.match(html, /custom-rating/);
  });

  test('style prop merged into root element', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, {
        value: 3,
        style: { marginBottom: 16 },
        interactive: false,
      }),
    );
    assert.match(html, /margin-bottom:16px/);
  });

  test('default star labels used when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 3, interactive: false }),
    );
    assert.match(html, /aria-label="很差"/);
    assert.match(html, /aria-label="很好"/);
  });

  test('max of 10 renders correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 7, max: 10, interactive: false }),
    );
    const starMatches = html.match(/role="radio"/g);
    assert.equal(starMatches?.length, 10);
    assert.match(html, /7 \/ 10/);
  });

  test('half star with value at exactly integer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 4, max: 5, half: true, interactive: false }),
    );
    assert.match(html, /4 \/ 5/);
    // Exactly 4 filled; no half indicator
    assert.match(html, /data-half="false"/);
  });

  test('interactive stars have tabIndex 0 (focusable)', () => {
    const interactive = renderToStaticMarkup(
      React.createElement(Rating, { value: 3, interactive: true }),
    );
    const nonInteractive = renderToStaticMarkup(
      React.createElement(Rating, { value: 3, interactive: false }),
    );
    // Interactive stars: tabindex="0"
    assert.match(interactive, /tabindex="0"/);
    // Non-interactive stars: tabindex="-1"
    assert.match(nonInteractive, /tabindex="-1"/);
    // Interactive has pointer cursor
    assert.match(interactive, /cursor:pointer/);
  });

  test('single star (max=1) works', () => {
    const html = renderToStaticMarkup(
      React.createElement(Rating, { value: 1, max: 1, interactive: false }),
    );
    const starMatches = html.match(/role="radio"/g);
    assert.equal(starMatches?.length, 1);
    assert.match(html, /1 \/ 1/);
  });
});

// Re-export for package index
module.exports = { Rating };
