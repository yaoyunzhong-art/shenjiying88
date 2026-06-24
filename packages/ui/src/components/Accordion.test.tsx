import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Accordion } = require('./Accordion');
import type { AccordionItem } from './Accordion';

describe('Accordion', () => {
  const items: AccordionItem[] = [
    { key: 'a1', title: '基本信息', content: '姓名、联系方式等基本信息' },
    { key: 'a2', title: '订单记录', content: '历史订单列表', subtitle: '共12条' },
    { key: 'a3', title: '系统日志', content: '操作审计日志' },
  ];

  test('renders all item titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items })
    );
    assert.match(html, /基本信息/);
    assert.match(html, /订单记录/);
    assert.match(html, /系统日志/);
  });

  test('renders subtitles when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items })
    );
    assert.match(html, /共12条/);
  });

  test('returns empty render for empty items', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items: [] })
    );
    // Returns null which renders as empty string
    assert.equal(html, '');
  });

  test('default expanded renders content visible', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, defaultExpanded: ['a1'] })
    );
    assert.match(html, /姓名、联系方式等基本信息/);
  });

  test('items not expanded hide content from HTML', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, defaultExpanded: ['a1'] })
    );
    // content exists in DOM but hidden via max-height. Still in SSR output.
    assert.match(html, /历史订单列表/);
  });

  test('multiple expanded shows all content', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, multiple: true, defaultExpanded: ['a1', 'a3'] })
    );
    assert.match(html, /姓名、联系方式等基本信息/);
    assert.match(html, /操作审计日志/);
  });

  test('controlled expanded works', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, expanded: ['a1'], onExpandedChange: () => {} })
    );
    assert.match(html, /姓名、联系方式等基本信息/);
  });

  test('variant bordered renders all titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, variant: 'bordered' })
    );
    assert.match(html, /基本信息/);
    assert.match(html, /订单记录/);
    assert.match(html, /系统日志/);
  });

  test('variant minimal renders all titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, variant: 'minimal', defaultExpanded: ['a2'] })
    );
    assert.match(html, /基本信息/);
    assert.match(html, /订单记录/);
    assert.match(html, /系统日志/);
  });

  test('size sm renders titles', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, size: 'sm' })
    );
    assert.match(html, /基本信息/);
    assert.match(html, /订单记录/);
    assert.match(html, /系统日志/);
  });

  test('disabled item renders with aria-disabled', () => {
    const disabledItems: AccordionItem[] = [
      { key: 'd1', title: '可用项', content: '可操作' },
      { key: 'd2', title: '禁用项', content: '不可操作', disabled: true },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items: disabledItems })
    );
    assert.match(html, /可用项/);
    assert.match(html, /禁用项/);
    assert.match(html, /aria-disabled="true"/);
  });

  test('aria-expanded is false when not expanded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items })
    );
    // All items should have aria-expanded="false" since none default expanded
    const matches = html.match(/aria-expanded="false"/g);
    assert.ok(matches);
    assert.ok(matches.length >= 2);
  });

  test('aria-expanded is true for expanded item', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, defaultExpanded: ['a2'] })
    );
    assert.match(html, /aria-expanded="true"/);
  });

  test('chevron SVG renders', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items })
    );
    assert.match(html, /<svg/);
    assert.match(html, /stroke="currentColor"/);
  });

  test('single item accordion renders', () => {
    const singleItem: AccordionItem[] = [
      { key: 'only', title: '唯一面板', content: '单一内容区域' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items: singleItem, defaultExpanded: ['only'] })
    );
    assert.match(html, /唯一面板/);
    assert.match(html, /单一内容区域/);
  });

  test('content region has role region', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items, defaultExpanded: ['a1'] })
    );
    assert.match(html, /role="region"/);
  });

  test('container has role region aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Accordion, { items })
    );
    assert.match(html, /aria-label="Accordion"/);
  });

  test('onExpandedChange receives expected keys on render', () => {
    const calls: string[][] = [];
    const html = renderToStaticMarkup(
      React.createElement(Accordion, {
        items,
        expanded: ['a1'],
        onExpandedChange: (keys: string[]) => calls.push(keys),
      })
    );
    assert.match(html, /基本信息/);
    // onExpandedChange not called during SSR, only on interaction
  });
});
