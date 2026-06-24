import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DetailClosureBar } = require('./DetailClosureBar');

describe('DetailClosureBar', () => {
  test('renders one card per link with the standard section heading', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'workspace', title: '返回工作台', subtitle: 'configuration', href: '/configuration' },
          { key: 'audit', title: '审计日志', subtitle: 'source=configuration', href: '/audit-trail?source=configuration' }
        ]
      })
    );
    assert.match(html, /上下文闭环/);
    assert.match(html, /返回工作台/);
    assert.match(html, /审计日志/);
    assert.match(html, /href="\/configuration"/);
    assert.match(html, /href="\/audit-trail\?source=configuration"/);
    assert.match(html, /detail-closure-link-workspace/);
    assert.match(html, /detail-closure-link-audit/);
  });

  test('returns null when no links supplied', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, { links: [] })
    );
    assert.equal(html, '');
  });

  test('renders an optional context line when present', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'foundation', title: 'Foundation 模块', subtitle: 'configuration 模块', context: 'moduleKey=configuration', href: '/foundation/modules/configuration' }
        ]
      })
    );
    assert.match(html, /moduleKey=configuration/);
  });

  test('applies the warning and danger variant classes via inline color', () => {
    const warningHtml = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'approvals', title: '审批', subtitle: '紧急', href: '/approvals', variant: 'warning' }
        ]
      })
    );
    assert.match(warningHtml, /rgba\(245,158,11/);

    const dangerHtml = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'incident', title: '事件', subtitle: '阻塞', href: '/incidents/1', variant: 'danger' }
        ]
      })
    );
    assert.match(dangerHtml, /rgba\(239,68,68/);
  });

  test('honors a custom heading and caption', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        heading: '收口链接',
        caption: '回归工作台与审计',
        links: [
          { key: 'workspace', title: '工作台', subtitle: '主入口', href: '/' }
        ]
      })
    );
    assert.match(html, /收口链接/);
    assert.match(html, /回归工作台与审计/);
  });
});
