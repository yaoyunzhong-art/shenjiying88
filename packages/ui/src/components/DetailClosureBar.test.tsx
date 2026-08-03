import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DetailClosureBar } = require('./DetailClosureBar');

describe('DetailClosureBar', () => {
  // ====== Basic rendering ======

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

  // ====== New tests: edge cases & boundary values ======

  test('renders with default heading and caption when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'test', title: 'Test', subtitle: 'Sub', href: '/test' }]
      })
    );
    assert.match(html, /上下文闭环/);
    assert.match(html, /从详情页一键回到工作台/);
  });

  test('renders a single link correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'single', title: '唯一链接', subtitle: '仅此一个', href: '/single' }]
      })
    );
    assert.match(html, /唯一链接/);
    assert.match(html, /href="\/single"/);
    assert.match(html, /detail-closure-link-single/);
    assert.match(html, /上下文闭环/);
  });

  test('renders up to 6 links in the grid', () => {
    const links = Array.from({ length: 6 }, (_, i) => ({
      key: `link-${i}`,
      title: `链接 ${i + 1}`,
      subtitle: `副标题 ${i + 1}`,
      href: `/path/${i}`
    }));
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, { links })
    );
    for (let i = 0; i < 6; i++) {
      assert.match(html, new RegExp(`链接 ${i + 1}`));
      assert.match(html, new RegExp(`detail-closure-link-link-${i}`));
    }
  });

  test('renders default variant card without warning/danger styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'normal', title: 'Normal', subtitle: 'Sub', href: '/normal' }]
      })
    );
    // Default variant has rgba(59,130,246 border (blue), not warning/danger
    assert.match(html, /rgba\(59,130,246/);
  });

  test('accepts data-testid prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        'data-testid': 'my-closure-bar',
        links: [{ key: 'l1', title: 'T1', subtitle: 'S1', href: '/1' }]
      })
    );
    assert.match(html, /data-testid="my-closure-bar"/);
    assert.match(html, /data-testid="detail-closure-grid"/);
  });

  test('uses aria-label on each link card by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'test', title: '测试链接', subtitle: 'Sub', href: '/test' }]
      })
    );
    assert.match(html, /aria-label="测试链接"/);
  });

  test('uses custom aria-label when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'test', title: '测试链接', subtitle: 'Sub', href: '/test', ariaLabel: '自定义标签' }]
      })
    );
    assert.match(html, /aria-label="自定义标签"/);
    // Should NOT use the title as aria-label
    assert.ok(!html.includes('aria-label="测试链接"'));
  });

  test('renders subtitle text for each link', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'a', title: '审批', subtitle: '待处理 3 条', href: '/approvals' },
          { key: 'b', title: '审计', subtitle: '高风险 1 条', href: '/audit' }
        ]
      })
    );
    assert.match(html, /待处理 3 条/);
    assert.match(html, /高风险 1 条/);
  });

  test('renders context text in monospace style', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'ctx', title: 'Context', subtitle: 'Sub', context: 'code=ABC', href: '/ctx' }]
      })
    );
    assert.match(html, /code=ABC/);
    // context should be in a separate div
    assert.match(html, /ABC/);
  });

  test('each link is wrapped in an <a> tag with correct href', () => {
    const links = [
      { key: 'config', title: '配置', subtitle: '管理', href: '/configuration' },
      { key: 'security', title: '安全', subtitle: '设置', href: '/settings/security' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, { links })
    );
    assert.match(html, /<a[^>]*href="\/configuration"[^>]*>/);
    assert.match(html, /<a[^>]*href="\/settings\/security"[^>]*>/);
  });

  test('renders a large number of links (10+) gracefully', () => {
    const links = Array.from({ length: 12 }, (_, i) => ({
      key: `bulk-${i}`,
      title: `大容量链接 ${i}`,
      subtitle: `副标题 ${i}`,
      href: `/bulk/${i}`
    }));
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, { links })
    );
    for (let i = 0; i < 12; i++) {
      assert.match(html, new RegExp(`大容量链接 ${i}`));
    }
  });

  test('includes section aria-label for accessibility', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 'acc', title: 'Accessible', subtitle: 'Test', href: '/' }]
      })
    );
    assert.match(html, /aria-label="Detail closure bar"/);
  });

  test('renders grid container with data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [{ key: 't', title: 'T', subtitle: 'S', href: '/' }]
      })
    );
    assert.match(html, /data-testid="detail-closure-grid"/);
  });

  test('multiple variant types render together without conflict', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        links: [
          { key: 'd1', title: '默认', subtitle: '普通', href: '/d1' },
          { key: 'w1', title: '警告', subtitle: '需关注', href: '/w1', variant: 'warning' },
          { key: 'd2', title: '危险', subtitle: '紧急', href: '/d2', variant: 'danger' },
        ]
      })
    );
    assert.match(html, /rgba\(59,130,246/); // default blue
    assert.match(html, /rgba\(245,158,11/); // warning amber
    assert.match(html, /rgba\(239,68,68/); // danger red
    assert.match(html, /默认/);
    assert.match(html, /警告/);
    assert.match(html, /危险/);
  });

  test('renders correctly with only caption and no heading override', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailClosureBar, {
        caption: '自定义描述文字',
        links: [{ key: 'c', title: 'C', subtitle: 'S', href: '/' }]
      })
    );
    assert.match(html, /自定义描述文字/);
    assert.match(html, /上下文闭环/); // default heading still present
  });
});
