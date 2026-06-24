import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DetailActionBar } = require('./DetailActionBar');

describe('DetailActionBar', () => {
  test('returns null when actions is empty', () => {
    const html = renderToStaticMarkup(React.createElement(DetailActionBar, { actions: [] }));
    assert.equal(html, '');
  });

  test('returns null when actions is undefined', () => {
    const html = renderToStaticMarkup(React.createElement(DetailActionBar, {}));
    assert.equal(html, '');
  });

  test('renders the default heading and caption', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    assert.match(html, /详情收口动作/);
    assert.match(html, /复制深链/);
  });

  test('renders custom heading and caption', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }],
        heading: '自定义标题',
        caption: '自定义副标题'
      })
    );
    assert.match(html, /自定义标题/);
    assert.match(html, /自定义副标题/);
  });

  test('renders a button for each action in order', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [
          { key: 'copy', label: '复制深链', onClick: () => undefined, icon: 'copy' },
          { key: 'export', label: '导出 JSON', onClick: () => undefined, icon: 'export' },
          { key: 'share', label: '分享', onClick: () => undefined, icon: 'share' }
        ]
      })
    );
    assert.match(html, /data-testid="detail-action-copy"/);
    assert.match(html, /data-testid="detail-action-export"/);
    assert.match(html, /data-testid="detail-action-share"/);
    assert.match(html, />复制深链</);
    assert.match(html, />导出 JSON</);
    assert.match(html, />分享</);
  });

  test('uses description as aria-label and title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [
          {
            key: 'copy',
            label: '复制',
            description: '复制当前页面 URL',
            onClick: () => undefined
          }
        ]
      })
    );
    assert.match(html, /aria-label="复制当前页面 URL"/);
    assert.match(html, /title="复制当前页面 URL"/);
  });

  test('falls back to label for aria-label and title when description is missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    assert.match(html, /aria-label="复制"/);
    assert.match(html, /title="复制"/);
  });

  test('renders the copy/link icon when icon="copy"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined, icon: 'copy' }]
      })
    );
    assert.match(html, /data-testid="detail-action-icon"/);
    assert.match(html, /M11 5V3/);
  });

  test('renders the export/download icon when icon="export"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'export', label: '导出', onClick: () => undefined, icon: 'export' }]
      })
    );
    assert.match(html, /M8 2v8/);
  });

  test('renders the share icon when icon="share"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'share', label: '分享', onClick: () => undefined, icon: 'share' }]
      })
    );
    assert.match(html, /M5.4 7.2L10.6 4.3/);
  });

  test('renders the print icon when icon="print"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'print', label: '打印', onClick: () => undefined, icon: 'print' }]
      })
    );
    assert.match(html, /M4 6V2h8v4/);
  });

  test('applies primary variant styles when variant="primary"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'save', label: '保存', onClick: () => undefined, variant: 'primary' }]
      })
    );
    assert.match(html, /rgba\(59,130,246,0.16\)/);
  });

  test('applies danger variant styles when variant="danger"', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'remove', label: '删除', onClick: () => undefined, variant: 'danger' }]
      })
    );
    assert.match(html, /rgba\(239,68,68,0.12\)/);
  });

  test('uses default variant styles when variant is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    // Should not contain primary blue background
    assert.doesNotMatch(html, /rgba\(59,130,246,0.16\)/);
    // Should not contain danger red background
    assert.doesNotMatch(html, /rgba\(239,68,68,0.12\)/);
  });

  test('disabled action renders as disabled button', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined, disabled: true }]
      })
    );
    assert.match(html, /disabled/);
    assert.match(html, /opacity:\s*0\.55/);
  });

  test('button has type="button" to prevent form submission', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    assert.match(html, /type="button"/);
  });

  test('omits icon svg when icon is not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    assert.doesNotMatch(html, /data-testid="detail-action-icon"/);
  });

  test('renders data-testid wrapper when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }],
        'data-testid': 'custom-action-bar'
      })
    );
    assert.match(html, /data-testid="custom-action-bar"/);
  });

  test('renders the default data-testid when not overridden', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }]
      })
    );
    assert.match(html, /data-testid="detail-action-bar"/);
  });

  test('renders all 6 known icon names without throwing', () => {
    const icons = ['copy', 'export', 'share', 'print', 'download', 'link'];
    for (const icon of icons) {
      const html = renderToStaticMarkup(
        React.createElement(DetailActionBar, {
          actions: [{ key: 'a', label: 'A', onClick: () => undefined, icon: icon as never }]
        })
      );
      assert.match(html, /<button/);
    }
  });

  test('accepts a custom successToast message without rendering it in SSR', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [
          {
            key: 'copy',
            label: '复制',
            onClick: () => undefined,
            successToast: { message: '复制完成' }
          }
        ]
      })
    );
    // The toast isn't rendered server-side; only the button is.
    assert.match(html, /<button/);
    assert.match(html, />复制</);
  });

  test('accepts a custom errorToast message without rendering it in SSR', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [
          {
            key: 'copy',
            label: '复制',
            onClick: () => undefined,
            errorToast: { message: '复制失败请重试' }
          }
        ]
      })
    );
    assert.match(html, /<button/);
  });

  test('showToast=false still renders the bar without toast container', () => {
    const html = renderToStaticMarkup(
      React.createElement(DetailActionBar, {
        actions: [{ key: 'copy', label: '复制', onClick: () => undefined }],
        showToast: false
      })
    );
    assert.match(html, /data-testid="detail-action-bar"/);
  });
});
