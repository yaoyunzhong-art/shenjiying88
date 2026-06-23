import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Modal } = require('./Modal');

describe('Modal', () => {
  test('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: false, onClose: () => {} }, 'Content'),
    );
    assert.equal(html, '');
  });

  test('renders children when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {} }, 'Modal Content'),
    );
    assert.match(html, /Modal Content/);
  });

  test('renders title', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {}, title: 'Edit User' }, 'Body'),
    );
    assert.match(html, /Edit User/);
  });

  test('renders footer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, {
        open: true,
        onClose: () => {},
        footer: React.createElement('button', null, 'Save'),
      }, 'Body'),
    );
    assert.match(html, /Save/);
  });

  test('renders close button by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {}, title: 'Modal' }, 'Body'),
    );
    assert.match(html, /关闭/);
  });

  test('hides close button when showClose=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {}, showClose: false }, 'Body'),
    );
    assert.doesNotMatch(html, /关闭/);
  });

  test('uses dialog role and aria-modal', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {}, title: 'My Dialog' }, 'Body'),
    );
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /aria-label="My Dialog"/);
  });

  test('applies custom width', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {}, width: 600 }, 'Body'),
    );
    assert.match(html, /width:600px/);
  });

  test('renders modal animations', () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, { open: true, onClose: () => {} }, 'Body'),
    );
    assert.match(html, /modal-fade-in/);
    assert.match(html, /modal-slide-up/);
  });
});
