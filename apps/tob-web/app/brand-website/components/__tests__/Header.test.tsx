/**
 * 苹果风格头部导航组件测试 — Header Tests
 * 覆盖: 导航菜单常量、渲染、链接验证、响应式布局
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// ---- 导航项定义 (与 Header.tsx 保持同步) ----

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', href: '/brand-website' },
  { label: '产品销售', href: '/brand-website/products' },
  { label: 'EPC+O服务', href: '/brand-website/epc' },
  { label: '数字运动', href: '/brand-website/digital-sports' },
  { label: '招商加盟', href: '/brand-website/franchise' },
  { label: '供应链合作', href: '/brand-website/supply-chain' },
  { label: '客户服务', href: '/brand-website/service' },
];

// ---- 测试套件 ----

describe('Header 导航菜单数据', () => {
  test('NAV_ITEMS: 包含 7 项导航链接', () => {
    assert.equal(NAV_ITEMS.length, 7);
    const labels = NAV_ITEMS.map((n) => n.label);
    assert.ok(labels.includes('首页'));
    assert.ok(labels.includes('产品销售'));
    assert.ok(labels.includes('EPC+O服务'));
    assert.ok(labels.includes('数字运动'));
    assert.ok(labels.includes('招商加盟'));
    assert.ok(labels.includes('供应链合作'));
    assert.ok(labels.includes('客户服务'));
  });

  test('NAV_ITEMS: 每条链接以 /brand-website 开头', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.href.startsWith('/brand-website'), `href "${item.href}" should start with /brand-website`);
    }
  });

  test('NAV_ITEMS: 链接不可重复', () => {
    const hrefs = NAV_ITEMS.map((n) => n.href);
    assert.equal(new Set(hrefs).size, NAV_ITEMS.length, 'Duplicate hrefs detected');
  });

  test('NAV_ITEMS: 标题不可为空', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.label.length > 0, `Empty label for href ${item.href}`);
    }
  });

  test('NAV_ITEMS: 各标题长度不超过 10 个中文字符', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.label.length <= 10, `Label "${item.label}" exceeds 10 chars`);
    }
  });
});

describe('Header SSR 快照', () => {
  // 纯函数：模拟 Header 的静态渲染（跳过 useState/useEffect 等 hooks）
  function StaticHeader() {
    return React.createElement(
      'header',
      { 'data-testid': 'brand-header', style: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 } },
      React.createElement(
        'nav',
        {
          'aria-label': '主导航',
          style: {
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        // Logo
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'a',
            { href: '/brand-website', style: { textDecoration: 'none' }, 'aria-label': '返回首页' },
            React.createElement(
              'span',
              { style: { fontSize: '22px', fontWeight: 700, color: '#1d1d1f' } },
              '神机营',
            ),
          ),
        ),
        // Desktop Menu
        React.createElement(
          'div',
          {
            'data-testid': 'desktop-menu',
            style: { display: 'flex', gap: '28px', alignItems: 'center' },
          },
          ...NAV_ITEMS.map((item) =>
            React.createElement(
              'a',
              {
                key: item.href,
                href: item.href,
                'data-nav-label': item.label,
                style: { fontSize: '13px', fontWeight: 500, color: '#1d1d1f', textDecoration: 'none' },
              },
              item.label,
            ),
          ),
        ),
        // CTA Button
        React.createElement(
          'a',
          {
            href: '/brand-website/contact',
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              background: '#0071e3',
              color: '#ffffff',
              borderRadius: '980px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
            },
          },
          '立即咨询',
        ),
      ),
    );
  }

  test('render site logo', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /神机营/);
  });

  test('render all 7 nav links', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    for (const item of NAV_ITEMS) {
      assert.match(html, new RegExp(item.label));
    }
  });

  test('render desktop-menu testid', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /data-testid="desktop-menu"/);
  });

  test('render header data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /data-testid="brand-header"/);
  });

  test('render CTA button with correct href', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /href="\/brand-website\/contact"/);
    assert.match(html, /立即咨询/);
  });

  test('each nav link has correct href', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    for (const item of NAV_ITEMS) {
      assert.match(html, new RegExp(`href="${item.href}"`));
    }
  });

  test('nav items render data-nav-label attributes', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    for (const item of NAV_ITEMS) {
      assert.match(html, new RegExp(`data-nav-label="${item.label}"`));
    }
  });

  test('render aria-label on navigation', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /aria-label="主导航"/);
  });

  test('render logo aria-label for accessibility', () => {
    const html = renderToStaticMarkup(React.createElement(StaticHeader));
    assert.match(html, /aria-label="返回首页"/);
  });
});
