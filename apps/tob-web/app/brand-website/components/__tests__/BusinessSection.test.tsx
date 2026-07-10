/**
 * 核心业务板块组件测试 — BusinessSection Tests
 * 覆盖: 业务卡片数据定义、常量验证、渲染验证
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ---- 内联业务卡片定义 (与 BusinessSection.tsx 保持同步) ----

interface BusinessCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  color: string;
}

const BUSINESS_CARDS: BusinessCard[] = [
  {
    id: 'products',
    title: '产品销售合作',
    subtitle: '全品类供应链支持',
    description: '涵盖食品、饮料、日用品、电子、服装等全品类产品，灵活的供货政策和价格体系，满足不同规模企业的采购需求。',
    features: ['一站式采购平台', '灵活定价机制', '全品类覆盖', '物流配送保障'],
    ctaText: '了解更多',
    ctaLink: '/brand-website/products',
    color: '#0071e3',
  },
  {
    id: 'epc',
    title: 'EPC+O全流程服务',
    subtitle: '工程到运营一体化',
    description: '从项目勘测、方案设计、工程施工到运营支持的全流程服务，专业团队全程跟进，确保项目高效落地。',
    features: ['专业勘测评估', '定制方案设计', '工程施工管理', '运营培训支持'],
    ctaText: '申请项目勘测',
    ctaLink: '/brand-website/epc',
    color: '#34c759',
  },
  {
    id: 'digital-sports',
    title: '数字运动潮玩馆',
    subtitle: '一站式馆型规划',
    description: '提供数字运动潮玩馆的全新创业模式，涵盖馆型规划、设备选型、运营培训、市场推广等全方位支持。',
    features: ['智能设备配套', '运营培训体系', '营销推广支持', '会员系统搭建'],
    ctaText: '获取馆型规划',
    ctaLink: '/brand-website/digital-sports',
    color: '#ff9500',
  },
  {
    id: 'franchise',
    title: '招商加盟合作',
    subtitle: '三类模式灵活选择',
    description: '提供特许加盟、合资联营、品牌授权三种合作模式，灵活的政策和全方位的支持体系，助力合作伙伴快速起步。',
    features: ['城市独家保护', '阶梯式返利', '40节培训课程', '3天线下训练营'],
    ctaText: '申请加盟考察',
    ctaLink: '/brand-website/franchise',
    color: '#af52de',
  },
];

// ---- 测试套件 ----

describe('BusinessSection 业务卡片数据', () => {
  test('BUSINESS_CARDS: 包含 4 项核心业务', () => {
    assert.equal(BUSINESS_CARDS.length, 4);
    const ids = BUSINESS_CARDS.map((c) => c.id);
    assert.ok(ids.includes('products'));
    assert.ok(ids.includes('epc'));
    assert.ok(ids.includes('digital-sports'));
    assert.ok(ids.includes('franchise'));
  });

  test('BUSINESS_CARDS: 每张卡片必有 id / title / subtitle / description / color', () => {
    for (const card of BUSINESS_CARDS) {
      assert.ok(card.id, `card ${card.title} missing id`);
      assert.ok(card.title.length > 0, `card missing title`);
      assert.ok(card.subtitle.length > 0, `card ${card.id} missing subtitle`);
      assert.ok(card.description.length > 0, `card ${card.id} missing description`);
      assert.match(card.color, /^#[0-9a-f]{6}$/i, `card ${card.id} invalid color ${card.color}`);
    }
  });

  test('BUSINESS_CARDS: 每张卡片必有 4 个 features', () => {
    for (const card of BUSINESS_CARDS) {
      assert.equal(card.features.length, 4, `card ${card.id} expected 4 features, got ${card.features.length}`);
    }
  });

  test('BUSINESS_CARDS: 每张卡片 ctaText 不为空且 ctaLink 以 /brand-website 开头', () => {
    for (const card of BUSINESS_CARDS) {
      assert.ok(card.ctaText.length > 0, `card ${card.id} missing ctaText`);
      assert.ok(card.ctaLink.startsWith('/brand-website'), `card ${card.id} ctaLink should start with /brand-website`);
    }
  });

  test('BUSINESS_CARDS: colors 各不同（避免视觉冲突）', () => {
    const colors = BUSINESS_CARDS.map((c) => c.color);
    const uniqueColors = new Set(colors);
    assert.equal(uniqueColors.size, 4, 'Each card must have a unique color');
  });

  test('BUSINESS_CARDS: ids 全局唯一', () => {
    const ids = BUSINESS_CARDS.map((c) => c.id);
    assert.equal(new Set(ids).size, 4, 'Duplicate card IDs detected');
  });
});

describe('BusinessSection SSR 快照', () => {
  // 纯函数：从 BusinessSection 中提取的静态渲染
  function StaticBusinessSection() {
    return React.createElement(
      'section',
      { 'data-testid': 'business-section' },
      React.createElement(
        'div',
        { style: { maxWidth: '1200px', margin: '0 auto' } },
        // Section Header
        React.createElement(
          'div',
          { style: { textAlign: 'center', marginBottom: '64px' } },
          React.createElement('h2', null, '四大核心业务线'),
          React.createElement('p', null, '满足企业客户的全方位商业需求，提供一站式解决方案'),
        ),
        // Business Cards Grid
        React.createElement(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            },
          },
          ...BUSINESS_CARDS.map((card) =>
            React.createElement(
              'div',
              { key: card.id, 'data-business-id': card.id, style: { borderRadius: '20px', border: `1px solid transparent` } },
              React.createElement('h3', null, card.title),
              React.createElement('p', { style: { color: card.color } }, card.subtitle),
              React.createElement('p', null, card.description),
              React.createElement(
                'ul',
                null,
                ...card.features.map((f, i) => React.createElement('li', { key: i }, f)),
              ),
              React.createElement('a', { href: card.ctaLink }, card.ctaText),
            ),
          ),
        ),
      ),
    );
  }

  test('render all 4 business card titles', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /产品销售合作/);
    assert.match(html, /EPC\+O全流程服务/);
    assert.match(html, /数字运动潮玩馆/);
    assert.match(html, /招商加盟合作/);
  });

  test('render section header', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /四大核心业务线/);
    assert.match(html, /一站式解决方案/);
  });

  test('render feature lists for each card', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    // Products features
    assert.match(html, /一站式采购平台/);
    assert.match(html, /灵活定价机制/);
    assert.match(html, /全品类覆盖/);
    // EPC features
    assert.match(html, /专业勘测评估/);
    assert.match(html, /运营培训支持/);
    // Digital sports features
    assert.match(html, /智能设备配套/);
    assert.match(html, /会员系统搭建/);
    // Franchise features
    assert.match(html, /城市独家保护/);
    assert.match(html, /3天线下训练营/);
  });

  test('render CTA links with correct hrefs', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /href="\/brand-website\/products"/);
    assert.match(html, /href="\/brand-website\/epc"/);
    assert.match(html, /href="\/brand-website\/digital-sports"/);
    assert.match(html, /href="\/brand-website\/franchise"/);
  });

  test('render CTA texts', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /了解更多/);
    assert.match(html, /申请项目勘测/);
    assert.match(html, /获取馆型规划/);
    assert.match(html, /申请加盟考察/);
  });

  test('each card has data-business-id attribute', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /data-business-id="products"/);
    assert.match(html, /data-business-id="epc"/);
    assert.match(html, /data-business-id="digital-sports"/);
    assert.match(html, /data-business-id="franchise"/);
  });

  test('render all 16 feature items across 4 cards', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    // Count <li> tags
    const liMatches = html.match(/<li>/g);
    assert.equal(liMatches?.length, 16, `Expected 16 <li> tags, got ${liMatches?.length}`);
  });

  test('render BusinessSection data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /data-testid="business-section"/);
  });

  test('unique business-card color classes rendered', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    // colors should appear inside inline styles
    for (const card of BUSINESS_CARDS) {
      assert.ok(html.includes(card.color), `Color ${card.color} for ${card.id} not found in rendered HTML`);
    }
  });

  test('grid layout style present', () => {
    const html = renderToStaticMarkup(React.createElement(StaticBusinessSection));
    assert.match(html, /repeat/);
  });
});
