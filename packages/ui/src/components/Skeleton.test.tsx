import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const REACT_DOM_SERVER = (() => {
  try {
    return require('react-dom/server.node.js');
  } catch {
    return require(
      '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
    );
  }
})();
const { Skeleton } = require('./Skeleton');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

test('Skeleton renders default rect shape', () => {
  const html = render(React.createElement(Skeleton));
  assert.match(html, /<div/);
  assert.match(html, /border-radius:8px/);
});

test('Skeleton renders circle shape', () => {
  const html = render(React.createElement(Skeleton, { shape: 'circle', width: 48 }));
  assert.match(html, /border-radius:50%/);
  assert.match(html, /width:48px/);
  assert.match(html, /height:48px/);
});

test('Skeleton renders text shape', () => {
  const html = render(React.createElement(Skeleton, { shape: 'text' }));
  assert.match(html, /border-radius:4px/);
});

test('Skeleton renders multiple text lines', () => {
  const html = render(React.createElement(Skeleton, { shape: 'text', lines: 3 }));
  // Should contain 3 div children inside
  const matchCount = (html.match(/animation-delay:/g) || []).length;
  assert.equal(matchCount, 3);
});

test('Skeleton respects custom width and height', () => {
  const html = render(React.createElement(Skeleton, { width: 200, height: 100 }));
  assert.match(html, /width:200px/);
  assert.match(html, /height:100px/);
});

test('Skeleton supports custom borderRadius', () => {
  const html = render(React.createElement(Skeleton, { borderRadius: 16 }));
  assert.match(html, /border-radius:16px/);
});

test('Skeleton disables animation when animated=false', () => {
  const html = render(React.createElement(Skeleton, { animated: false }));
  assert.match(html, /animation:none/);
});

test('Skeleton passes className', () => {
  const html = render(React.createElement(Skeleton, { className: 'custom-sk' }));
  assert.match(html, /class="custom-sk"/);
});
