import React from 'react';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');
const REACT_DOM_SERVER = (() => {
  try {
    return require('react-dom/server.node.js');
  } catch {
    return require(
      '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
    );
  }
})();
const { InlineNotification } = require('./InlineNotification');

function render(el: React.ReactElement) {
  return REACT_DOM_SERVER.renderToStaticMarkup(el);
}

describe('InlineNotification', () => {
  test('renders default info notification with message', () => {
    const html = render(React.createElement(InlineNotification, { message: 'Hello' }));
    assert.match(html, /Hello/);
    assert.match(html, /role="alert"/);
    assert.match(html, /ℹ/);
  });

  test('renders success type', () => {
    const html = render(React.createElement(InlineNotification, { type: 'success', message: 'Done' }));
    assert.match(html, /✓/);
  });

  test('renders warning type', () => {
    const html = render(React.createElement(InlineNotification, { type: 'warning', message: 'Caution' }));
    assert.match(html, /⚠/);
  });

  test('renders error type', () => {
    const html = render(React.createElement(InlineNotification, { type: 'error', message: 'Fail' }));
    assert.match(html, /✕/);
  });

  test('renders title', () => {
    const html = render(React.createElement(InlineNotification, { title: 'Title', message: 'Msg' }));
    assert.match(html, /<strong.*>Title<\/strong>/);
    assert.match(html, /Msg/);
  });

  test('renders closable close button', () => {
    const html = render(React.createElement(InlineNotification, { closable: true, message: 'X' }));
    assert.match(html, /关闭通知/);
    assert.match(html, /✕/);
  });

  test('supports custom className', () => {
    const html = render(React.createElement(InlineNotification, { className: 'my-notif', message: 'Test' }));
    assert.match(html, /class="my-notif"/);
  });

  test('supports custom style', () => {
    const html = render(React.createElement(InlineNotification, { style: { marginTop: 10 }, message: 'Styled' }));
    assert.match(html, /margin-top:10/);
  });

  test('supports data-testid', () => {
    const html = render(React.createElement(InlineNotification, { 'data-testid': 'my-notif', message: 'Id' }));
    assert.match(html, /data-testid="my-notif"/);
  });

  test('renders action element', () => {
    const btn = React.createElement('button', null, 'Undo');
    const html = render(React.createElement(InlineNotification, { action: btn, message: 'Action' }));
    assert.match(html, /Undo/);
  });

  test('has role="alert"', () => {
    const html = render(React.createElement(InlineNotification, { message: 'Alert' }));
    assert.match(html, /role="alert"/);
  });

  test('default type info shows blue accent', () => {
    const html = render(React.createElement(InlineNotification, { message: 'Info' }));
    assert.match(html, /background-color:#eff6ff/);
    assert.match(html, /border-left:4px solid #93c5fd/);
  });
});
