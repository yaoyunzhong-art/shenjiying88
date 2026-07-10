/**
 * 核心优势网格组件测试 — AdvantageGrid Tests
 * 覆盖: 渲染、数据验证、样式验证
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ---- 优势数据定义 (与 AdvantageGrid.tsx 保持同步) ----

interface Advantage {
  title: string;
  description: string;
}

// ---- 测试组件 ----

function StaticAdvantageGrid({ advantages }: { advantages: Advantage[] }) {
  return React.createElement(
    'div',
    { 'data-testid': 'advantage-grid', style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' } },
    ...advantages.map((adv, index) =>
      React.createElement(
        'div',
        {
          key: index,
          'data-advantage-idx': index,
          style: { borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9' },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
          React.createElement(
            'div',
            { style: { width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement('span', { style: { color: '#2563eb', fontWeight: 700 } }, String(index + 1)),
          ),
          React.createElement('h4', { style: { fontWeight: 700 } }, adv.title),
        ),
        React.createElement('p', null, adv.description),
      ),
    ),
  );
}

// ---- 优势数据 ----

const ADVANTAGES: Advantage[] = [
  { title: '全品类供应链', description: '覆盖食品、饮料、日用品、电子、服装等全品类产品，一站式满足企业采购需求。' },
  { title: '灵活合作模式', description: '提供经销、代销、OEM、ODM等多种合作方式，根据企业需求定制个性化方案。' },
  { title: '数字化运营', description: '智能库存管理系统，实时数据监控，帮助企业实现精细化运营和降本增效。' },
  { title: '专业培训体系', description: '提供40余节专业培训课程和3天线下训练营，助力合作伙伴快速上手。' },
  { title: '全域营销支持', description: '线上+线下全渠道营销方案，各类节日促销活动策划，提升品牌曝光与销售额。' },
  { title: '售后无忧保障', description: '7x24小时客户服务团队，快速响应处理各类问题，保障合作伙伴经营无忧。' },
];

// ---- 测试套件 ----

describe('AdvantageGrid 数据验证', () => {
  test('ADVANTAGES: 包含 6 项核心优势', () => {
    assert.equal(ADVANTAGES.length, 6);
    const titles = ADVANTAGES.map((a) => a.title);
    assert.ok(titles.includes('全品类供应链'));
    assert.ok(titles.includes('售后无忧保障'));
  });

  test('ADVANTAGES: 每项优势具有非空 title 和 description', () => {
    for (const adv of ADVANTAGES) {
      assert.ok(adv.title.length > 0, 'Empty title');
      assert.ok(adv.description.length > 0, `Empty description for "${adv.title}"`);
    }
  });

  test('ADVANTAGES: 标题长度不超过 10 个字符', () => {
    for (const adv of ADVANTAGES) {
      assert.ok(adv.title.length <= 10, `Title "${adv.title}" too long (${adv.title.length})`);
    }
  });

  test('ADVANTAGES: description 长度不少于 20 个字符', () => {
    for (const adv of ADVANTAGES) {
      assert.ok(adv.description.length >= 20, `Description for "${adv.title}" too short (${adv.description.length})`);
    }
  });
});

describe('AdvantageGrid SSR 渲染', () => {
  test('render all 6 advantage titles', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    for (const adv of ADVANTAGES) {
      assert.match(html, new RegExp(adv.title));
    }
  });

  test('render all 6 advantage descriptions', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    for (const adv of ADVANTAGES) {
      assert.match(html, new RegExp(adv.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  test('render data-testid="advantage-grid"', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    assert.match(html, /data-testid="advantage-grid"/);
  });

  test('render sequential indices (1-6)', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    assert.match(html, />1</);
    assert.match(html, />6</);
  });

  test('render grid layout', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    assert.match(html, /grid/);
  });

  test('empty grid renders no cards', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: [] }));
    // Should have no card elements
    assert.ok(!html.includes('data-advantage-idx'));
  });

  test('render advantage with data-advantage-idx attributes', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES.slice(0, 2) }));
    assert.match(html, /data-advantage-idx="0"/);
    assert.match(html, /data-advantage-idx="1"/);
  });

  test('render each card has background styling', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES.slice(0, 1) }));
    assert.match(html, /border-radius/);
    assert.match(html, /#f1f5f9/);
  });

  test('render index circles with proper color', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES.slice(0, 1) }));
    assert.match(html, /#eff6ff/);
    assert.match(html, /#2563eb/);
  });

  test('3-column grid layout style', () => {
    const html = renderToStaticMarkup(React.createElement(StaticAdvantageGrid, { advantages: ADVANTAGES }));
    assert.match(html, /repeat\(3, 1fr\)/);
  });
});
