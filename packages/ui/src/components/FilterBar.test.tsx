import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FilterBar } = require('./FilterBar');

function makeChips(activeIndices: number[] = [0]) {
  return ['All', 'Active', 'Inactive', 'Pending'].map((label, i) => ({
    key: label.toLowerCase(),
    label,
    active: activeIndices.includes(i),
    onClick: () => {},
  }));
}

describe('FilterBar', () => {
  test('renders all chip buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips() })
    );
    assert.match(html, /All/);
    assert.match(html, /Active/);
    assert.match(html, /Inactive/);
    assert.match(html, /Pending/);
  });

  test('renders chips as buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips() })
    );
    assert.match(html, /<button/);
  });

  test('shows active chip with active background', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips([0]) })
    );
    // Active chip has blue accent background
    assert.match(html, /rgba\(59,130,246,0\.15\)/);
  });

  test('inactive chip has transparent background', () => {
    const chips = makeChips([]);
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips })
    );
    assert.match(html, /transparent/);
  });

  test('shows Clear all when onClearAll provided and filters active', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, {
        chips: makeChips([0]),
        onClearAll: () => {},
      })
    );
    assert.match(html, /Clear all/);
  });

  test('does not show Clear all when onClearAll not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips([0, 1]) })
    );
    assert.doesNotMatch(html, /Clear all/);
  });

  test('does not show Clear all when no filters active', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, {
        chips: makeChips([]),
        onClearAll: () => {},
      })
    );
    assert.doesNotMatch(html, /Clear all/);
  });

  test('uses activeCount prop to show Clear all', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, {
        chips: makeChips([]),
        onClearAll: () => {},
        activeCount: 3,
      })
    );
    assert.match(html, /Clear all/);
  });

  test('activeCount=0 hides Clear all', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, {
        chips: makeChips([]),
        onClearAll: () => {},
        activeCount: 0,
      })
    );
    assert.doesNotMatch(html, /Clear all/);
  });

  test('renders flex wrap layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips() })
    );
    assert.match(html, /flex-wrap/);
  });

  test('active chip has blue border', () => {
    const html = renderToStaticMarkup(
      React.createElement(FilterBar, { chips: makeChips([2]) })
    );
    assert.match(html, /rgba\(96,165,250,0\.3\)/);
  });
});
