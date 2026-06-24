import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Drawer } = require('./Drawer');

describe('Drawer', () => {
  test('open=false renders nothing', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: false, onClose: () => {} },
        React.createElement('p', null, '内容')
      )
    );
    assert.strictEqual(html, '');
  });

  test('open=true renders title and children', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '编辑信息' },
        React.createElement('p', null, '抽屉内容')
      )
    );
    assert.match(html, /编辑信息/);
    assert.match(html, /抽屉内容/);
  });

  test('renders close button by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '测试' })
    );
    assert.match(html, /aria-label="关闭"/);
  });

  test('showClose=false hides close button', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '无关闭', showClose: false })
    );
    assert.doesNotMatch(html, /aria-label="关闭"/);
  });

  test('renders footer when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, {
        open: true,
        onClose: () => {},
        title: '编辑',
        footer: React.createElement('button', null, '保存'),
      },
        React.createElement('p', null, 'form')
      )
    );
    assert.match(html, /保存/);
    assert.match(html, /form/);
  });

  test('does not render footer when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, {
        open: true,
        onClose: () => {},
        title: '无Footer',
      },
        React.createElement('p', null, 'content')
      )
    );
    // The close button exists, but no footer div with border-top after content
    assert.match(html, /无Footer/);
    assert.match(html, /content/);
    // footer should have border-top style which is different from header border-bottom
    // count occurrences: border-bottom appears in header, border-top should NOT appear (only header has border-bottom)
    const borderTopCount = (html.match(/border-top/g) || []).length;
    assert.strictEqual(borderTopCount, 0);
  });

  test('placement=left renders left-positioned drawer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'left', title: '左侧' },
        React.createElement('p', null, 'left content')
      )
    );
    assert.match(html, /left:0/);
    assert.match(html, /drawer-slide-in-left/);
    assert.match(html, /左侧/);
  });

  test('placement=right is default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '默认右侧' })
    );
    assert.match(html, /right:0/);
    assert.match(html, /drawer-slide-in-right/);
  });

  test('placement=top renders top-positioned drawer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'top', title: '顶部' },
        React.createElement('p', null, 'top content')
      )
    );
    assert.match(html, /top:0/);
    assert.match(html, /drawer-slide-in-top/);
  });

  test('placement=bottom renders bottom-positioned drawer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'bottom', title: '底部' },
        React.createElement('p', null, 'bottom content')
      )
    );
    assert.match(html, /bottom:0/);
    assert.match(html, /drawer-slide-in-bottom/);
  });

  test('custom size is applied to panel dimensions', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, size: 600, title: '宽抽屉' })
    );
    assert.match(html, /width:600px/);
    assert.match(html, /宽抽屉/);
  });

  test('default size for left/right is 448', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'left', title: '默认宽' })
    );
    assert.match(html, /width:448px/);
  });

  test('default size for top/bottom is 320 height', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'top', title: '默认高' })
    );
    assert.match(html, /height:320px/);
  });

  test('renders aria-modal dialog role', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '对话框' })
    );
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
  });

  test('without title aria-label defaults to Drawer', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {} },
        React.createElement('p', null, '无标题')
      )
    );
    assert.match(html, /aria-label="Drawer"/);
  });

  test('renders overlay mask with backdrop-filter', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '遮罩' })
    );
    assert.match(html, /backdrop-filter/);
    assert.match(html, /drawer-mask-fade-in/);
  });

  test('supports custom zIndex', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, zIndex: 2000, title: '高层级' })
    );
    assert.match(html, /z-index:2000/);
  });

  test('header has border-bottom separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '标头' })
    );
    assert.match(html, /border-bottom/);
    assert.match(html, /标头/);
  });

  test('footer has border-top separator', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, {
        open: true,
        onClose: () => {},
        title: '底部栏',
        footer: React.createElement('button', null, '确认'),
      })
    );
    assert.match(html, /border-top/);
    assert.match(html, /确认/);
  });

  test('content area has overflow-y:auto for scrolling', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '滚动' },
        React.createElement('div', null, '长内容')
      )
    );
    assert.match(html, /overflow-y:auto/);
  });

  test('panel has dark background and shadow', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'right', title: '右侧' })
    );
    assert.match(html, /#1e293b/);
    assert.match(html, /box-shadow/);
  });

  test('title is rendered as h2', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, title: '标题h2' })
    );
    assert.match(html, /<h2/);
    assert.match(html, /标题h2/);
  });

  test('max-width constraint for horizontal placements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'right', title: '最大宽' })
    );
    assert.match(html, /max-width:calc\(100vw - 48px\)/);
  });

  test('max-height constraint for vertical placements', () => {
    const html = renderToStaticMarkup(
      React.createElement(Drawer, { open: true, onClose: () => {}, placement: 'top', title: '最大高' })
    );
    assert.match(html, /max-height:calc\(100vh - 48px\)/);
  });
});
