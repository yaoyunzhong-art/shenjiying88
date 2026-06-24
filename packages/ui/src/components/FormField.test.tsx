import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FormField } = require('./FormField');

describe('FormField', () => {
  test('renders label and child', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Name' }, React.createElement('input', null))
    );
    assert.match(html, /Name/);
    assert.match(html, /<input/);
  });

  test('shows required asterisk', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Email', required: true }, React.createElement('input', null))
    );
    assert.match(html, /\*/);
  });

  test('does not show asterisk when not required', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Nickname' }, React.createElement('input', null))
    );
    assert.doesNotMatch(html, /\*/);
  });

  test('shows error message', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Password', error: 'Too short' }, React.createElement('input', null))
    );
    assert.match(html, /Too short/);
  });

  test('shows hint when no error', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Bio', hint: 'Tell us about yourself' }, React.createElement('input', null))
    );
    assert.match(html, /Tell us about yourself/);
  });

  test('uses helper as fallback for hint', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Age', helper: 'In years' }, React.createElement('input', null))
    );
    assert.match(html, /In years/);
  });

  test('prioritizes error over hint', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Code', error: 'Invalid', hint: 'Enter code' }, React.createElement('input', null))
    );
    assert.match(html, /Invalid/);
    assert.doesNotMatch(html, /Enter code/);
  });

  test('associates label with input via htmlFor', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Username', htmlFor: 'user-input' }, React.createElement('input', { id: 'user-input' }))
    );
    assert.match(html, /for="user-input"/);
  });

  test('renders with compact margin', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Zip', compact: true }, React.createElement('input', null))
    );
    assert.match(html, /margin-bottom:8px/);
  });

  test('renders with default margin when not compact', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'City' }, React.createElement('input', null))
    );
    assert.match(html, /margin-bottom:16px/);
  });

  test('applies disabled color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Readonly', disabled: true }, React.createElement('input', null))
    );
    assert.match(html, /#64748b/);
  });

  test('renders error with red color', () => {
    const html = renderToStaticMarkup(
      React.createElement(FormField, { label: 'Amount', error: 'Negative' }, React.createElement('input', null))
    );
    assert.match(html, /#fca5a5/);
  });
});
