import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { BreadcrumbPageHeader } = require('./BreadcrumbPageHeader');

const sampleBreadcrumbs = [
  { label: '首页' },
  { label: '门店管理', href: '/stores' },
  { label: '门店详情' },
];

describe('BreadcrumbPageHeader', () => {
  test('renders title and breadcrumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
      })
    );
    assert.match(html, /门店详情/);
    assert.match(html, /首页/);
    assert.match(html, /门店管理/);
  });

  test('renders description when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
        description: '查看和编辑门店基本信息',
      })
    );
    assert.match(html, /查看和编辑门店基本信息/);
  });

  test('does not render description when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
      })
    );
    assert.doesNotMatch(html, /查看/);
  });

  test('renders primary action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
        actions: [{ label: '编辑', variant: 'primary', onClick: () => {} }],
      })
    );
    assert.match(html, /编辑/);
  });

  test('renders multiple action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
        actions: [
          { label: '编辑', variant: 'primary' },
          { label: '删除', variant: 'danger' },
          { label: '返回', variant: 'ghost' },
        ],
      })
    );
    assert.match(html, /编辑/);
    assert.match(html, /删除/);
    assert.match(html, /返回/);
  });

  test('renders icon in action button', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '新建门店',
        actions: [{ label: '保存', icon: '✓', variant: 'primary' }],
      })
    );
    assert.match(html, /✓/);
    assert.match(html, /保存/);
  });

  test('disables action button when disabled is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '门店详情',
        actions: [{ label: '删除', variant: 'danger', disabled: true }],
      })
    );
    // disabled attribute should be present
    assert.match(html, /disabled/);
  });

  test('renders custom data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '测试',
        'data-testid': 'custom-header',
      })
    );
    assert.match(html, /data-testid="custom-header"/);
  });

  test('last breadcrumb is marked aria-current', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '详情',
      })
    );
    assert.match(html, /aria-current="page"/);
  });

  test('breadcrumbs with href render as links', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreadcrumbPageHeader, {
        breadcrumbs: sampleBreadcrumbs,
        title: '详情',
      })
    );
    assert.match(html, /href="\/stores"/);
  });
});
