/**
 * CodeBlock 代码块组件测试
 * 覆盖：渲染、行号、语言标签、折叠、复制按钮、边界场景
 * 使用 renderToStaticMarkup（无需 jsdom）
 */
const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const React = require('react');

// 直接 inline CodeBlock 逻辑（避免 ESM 问题）
const { CodeBlock } = require('./CodeBlock');

// --------------- 辅助 ---------------

function renderHTML(props = {}) {
  return renderToStaticMarkup(
    React.createElement(CodeBlock, { code: 'const x = 1;', ...props })
  );
}

function hasText(html, text) {
  return html.includes(text);
}

function countOccurrences(html, substr) {
  let count = 0;
  let pos = 0;
  while ((pos = html.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

/**
 * 提取 data-testid 属性的值
 */
function testIdAttr(id) {
  return `data-testid="${id}"`;
}

// --------------- 测试 ---------------

describe('CodeBlock 组件', () => {
  // ====== A. 基础渲染 ======

  test('A1 - 渲染代码内容', () => {
    const html = renderHTML({ code: 'const x = 1;' });
    assert.ok(hasText(html, 'const x = 1;'), '代码内容应存在');
    assert.ok(hasText(html, testIdAttr('code-block')), '应有 code-block data-testid');
  });

  test('A2 - 显示语言标签', () => {
    const html = renderHTML({ code: 'const x = 1;', language: 'tsx' });
    assert.ok(hasText(html, 'TSX'), '应显示 TSX 语言标签');
  });

  test('A3 - 默认语言为 CODE', () => {
    const html = renderHTML({ code: 'const x = 1;' });
    assert.ok(hasText(html, 'CODE'), '默认应显示 CODE');
  });

  test('A4 - 自定义 data-testid', () => {
    const html = renderToStaticMarkup(
      React.createElement(CodeBlock, { code: 'test', 'data-testid': 'my-code' })
    );
    assert.ok(hasText(html, testIdAttr('my-code')), '应使用自定义 data-testid');
  });

  test('A5 - 空代码', () => {
    const html = renderHTML({ code: '' });
    assert.ok(hasText(html, testIdAttr('code-block')), '空代码仍渲染容器');
  });

  // ====== B. 行号 ======

  test('B1 - 默认显示行号', () => {
    const html = renderHTML({ code: 'line1\nline2\nline3' });
    assert.ok(hasText(html, testIdAttr('code-block-line-1')), '行1 行号');
    assert.ok(hasText(html, testIdAttr('code-block-line-2')), '行2 行号');
    assert.ok(hasText(html, testIdAttr('code-block-line-3')), '行3 行号');
  });

  test('B2 - 可以隐藏行号', () => {
    const html = renderHTML({ code: 'line1\nline2', showLineNumbers: false });
    assert.ok(!hasText(html, testIdAttr('code-block-line-1')), '应隐藏行号');
  });

  test('B3 - 单行代码', () => {
    const html = renderHTML({ code: 'single line' });
    assert.ok(hasText(html, testIdAttr('code-block-line-1')), '单行有行号');
  });

  test('B4 - 多行代码', () => {
    const html = renderHTML({ code: 'a\nb\nc\nd\ne' });
    assert.ok(hasText(html, testIdAttr('code-block-line-5')), '5行都有行号');
  });

  test('B5 - 15行代码', () => {
    const lines = Array.from({ length: 15 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n') });
    assert.ok(hasText(html, testIdAttr('code-block-line-15')), '第15行也有行号');
  });

  // ====== C. 复制功能 ======

  test('C1 - 默认显示复制按钮', () => {
    const html = renderHTML({ code: 'test' });
    assert.ok(hasText(html, testIdAttr('code-block-copy-btn')), '应有复制按钮');
  });

  test('C2 - 可以隐藏复制按钮', () => {
    const html = renderHTML({ code: 'test', copyable: false });
    assert.ok(!hasText(html, testIdAttr('code-block-copy-btn')), '应隐藏复制按钮');
  });

  // ====== D. 折叠功能 ======

  test('D1 - 未设置 maxLines 不显示折叠', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n') });
    assert.ok(!hasText(html, testIdAttr('code-block-collapse-toggle')), '无折叠按钮');
  });

  test('D2 - maxLines 小于总行数显示折叠按钮', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 5 });
    assert.ok(hasText(html, testIdAttr('code-block-collapse-toggle')), '应有折叠按钮');
  });

  test('D3 - 折叠时底部有展开按钮', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 3, defaultCollapsed: true });
    assert.ok(hasText(html, testIdAttr('code-block-expand-btn')), '应有展开按钮');
  });

  test('D4 - 展开按钮包含行数', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 3, defaultCollapsed: true });
    assert.ok(hasText(html, '展开全部 10'), '展开按钮文案含行数');
  });

  // ====== E. 语言颜色 ======

  test('E1 - 已知语言有颜色标识点', () => {
    const html = renderHTML({ code: '{}', language: 'json' });
    assert.ok(hasText(html, 'JSON'), '应显示语言');
    // 颜色点有 border-radius: 50%
    assert.ok(hasText(html, 'border-radius:50%'), '应有颜色圆点');
  });

  test('E2 - 未知语言显示原文', () => {
    const html = renderHTML({ code: 'test', language: 'UNKNOWN-LANG' });
    assert.ok(hasText(html, 'UNKNOWN-LANG'), '显示语言原文');
  });

  test('E3 - 无语言显示 CODE', () => {
    const html = renderHTML({ code: 'test' });
    assert.ok(hasText(html, 'CODE'), '无语言显示 CODE');
  });

  // ====== F. 边界场景 ======

  test('F1 - 空行保持不变', () => {
    const html = renderHTML({ code: 'line1\n\n\nline4' });
    assert.ok(hasText(html, 'line1'), 'line1 存在');
    assert.ok(hasText(html, 'line4'), 'line4 存在');
  });

  test('F2 - 行数等于 maxLines 时不折叠', () => {
    const lines = Array.from({ length: 5 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 5 });
    assert.ok(!hasText(html, testIdAttr('code-block-collapse-toggle')), '不折叠');
  });

  test('F3 - 行数比 maxLines 多 1 时折叠', () => {
    const lines = Array.from({ length: 6 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 5 });
    assert.ok(hasText(html, testIdAttr('code-block-collapse-toggle')), '折叠');
  });

  test('F4 - 特殊字符', () => {
    const special = '<script>alert("xss")</script>';
    const html = renderHTML({ code: special });
    assert.ok(hasText(html, '&lt;script&gt;'), '特殊字符应转义');
  });

  test('F5 - 尾部换行不产生额外行号', () => {
    const html = renderHTML({ code: 'line1\nline2\n' });
    // 只有2行有行号
    assert.ok(hasText(html, testIdAttr('code-block-line-2')), 'line2 存在');
    // 不会有 line-3 空行
    assert.ok(!hasText(html, testIdAttr('code-block-line-3')), '无空行行号');
  });

  test('F6 - 单字符代码', () => {
    const html = renderHTML({ code: 'x' });
    assert.ok(hasText(html, 'x'), '单字符渲染');
  });

  test('F7 - 中文代码内容', () => {
    const html = renderHTML({ code: 'console.log("你好世界")' });
    assert.ok(hasText(html, '你好世界'), '中文渲染');
  });

  test('F8 - 语言大小写不敏感', () => {
    const html = renderHTML({ code: '{}', language: 'JSON' });
    assert.ok(hasText(html, 'JSON'), '保持显示大小写');
  });

  test('F9 - 头部显示行数统计', () => {
    const lines = Array.from({ length: 8 }, (_, i) => `line${i + 1}`);
    const html = renderHTML({ code: lines.join('\n'), maxLines: 5 });
    assert.ok(hasText(html, '8'), '应显示总行数');
  });
});
