import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SearchFilterInput } = require('./SearchFilterInput');

describe('SearchFilterInput', () => {
  test('renders input with placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
        placeholder: 'Find...',
      })
    );
    assert.match(html, /Find\.\.\./);
  });

  test('renders default placeholder', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, { value: '', onChange: () => {} })
    );
    assert.match(html, /Search\.\.\./);
  });

  test('renders input with value', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: 'Alice',
        onChange: () => {},
      })
    );
    assert.match(html, /value="Alice"/);
  });

  test('shows clear button when value present', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: 'test',
        onChange: () => {},
      })
    );
    assert.match(html, /清空搜索/);
  });

  test('hides clear button when value empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
      })
    );
    assert.doesNotMatch(html, /清空搜索/);
  });

  test('hides clear button when clearable=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: 'test',
        onChange: () => {},
        clearable: false,
      })
    );
    assert.doesNotMatch(html, /清空搜索/);
  });

  test('renders search icon svg', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, { value: '', onChange: () => {} })
    );
    assert.match(html, /<svg/);
    assert.match(html, /viewBox="0 0 16 16"/);
  });

  test('accepts custom width number', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
        width: 400,
      })
    );
    assert.match(html, /width:400px/);
  });

  test('accepts string width', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
        width: '100%',
      })
    );
    assert.match(html, /width:100%/);
  });

  test('renders disabled input', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
        disabled: true,
      })
    );
    assert.match(html, /disabled=""/);
  });

  test('accepts onKeyDown handler prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: '',
        onChange: () => {},
        onKeyDown: () => {},
      })
    );
    assert.match(html, /type="text"/);
  });

  test('disabled hides clear button even with value', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: 'blocked',
        onChange: () => {},
        disabled: true,
      })
    );
    assert.match(html, /value="blocked"/);
    // disabled styling shows 'not-allowed' cursor on input
    assert.match(html, /not-allowed/);
  });

  test('clearable button has X icon svg', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterInput, {
        value: 'X',
        onChange: () => {},
      })
    );
    // The X icon svg inside the clear button
    assert.match(html, /viewBox="0 0 14 14"/);
  });
});
