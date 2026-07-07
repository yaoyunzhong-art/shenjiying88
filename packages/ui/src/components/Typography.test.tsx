const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Typography, Heading, Text, Paragraph, Caption } = require('./Typography');

describe('Typography', () => {
  test('renders body1 text by default', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, null, 'Hello'));
    assert.match(html, /Hello/);
    assert.match(html, /font-size:\s*15/);
  });

  test('renders h1 with large font size and bold weight', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'h1' }, 'Title'));
    assert.match(html, /<h1[^>]*>/);
    assert.match(html, /font-size:\s*32/);
    assert.match(html, /font-weight:\s*700/);
  });

  test('renders h2 with 26px font', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'h2' }, 'Section'));
    assert.match(html, /<h2[^>]*>/);
    assert.match(html, /font-size:\s*26/);
  });

  test('renders h3-h6 with correct tag', () => {
    for (const level of [3, 4, 5, 6]) {
      const html = renderToStaticMarkup(
        React.createElement(Typography, { variant: `h${level}` as any }, `H${level}`)
      );
      assert.match(html, new RegExp(`<h${level}[^>]*>`));
    }
  });

  test('renders body2 with 13px', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'body2' }, 'Small'));
    assert.match(html, /font-size:\s*13/);
  });

  test('renders caption with 12px', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'caption' }, 'Note'));
    assert.match(html, /font-size:\s*12/);
  });

  test('renders overline with uppercase transform and letter-spacing', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'overline' }, 'Label'));
    assert.match(html, /letter-spacing:\s*0\.08em/);
    assert.match(html, /text-transform:\s*uppercase/);
  });

  test('renders label with label tag', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { variant: 'label' }, 'Name'));
    assert.match(html, /<label[^>]*>/);
  });

  test('applies color prop', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { color: 'danger' }, 'Error'));
    assert.match(html, /#f87171/);
  });

  test('applies color primary', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { color: 'primary' }, 'Link'));
    assert.match(html, /#60a5fa/);
  });

  test('applies weight override', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { weight: 'bold' }, 'Bold'));
    assert.match(html, /font-weight:\s*700/);
  });

  test('applies align', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { align: 'center' }, 'Centered'));
    assert.match(html, /text-align:\s*center/);
  });

  test('applies transform', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { transform: 'uppercase' }, 'up'));
    assert.match(html, /text-transform:\s*uppercase/);
  });

  test('truncate adds ellipsis styles', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { truncate: true }, 'Long'));
    assert.match(html, /overflow:\s*hidden/);
    assert.match(html, /text-overflow:\s*ellipsis/);
    assert.match(html, /white-space:\s*nowrap/);
  });

  test('custom as prop overrides tag', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, { as: 'div', variant: 'body1' }, 'Custom'));
    assert.match(html, /<div[^>]*>/);
  });

  test('merges custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(Typography, { style: { marginTop: 20 } }, 'Styled')
    );
    assert.match(html, /margin-top:\s*20/);
  });

  test('renders text color default as #e4e4e7', () => {
    const html = renderToStaticMarkup(React.createElement(Typography, null, 'Default'));
    assert.match(html, /#e4e4e7/);
  });
});

describe('Heading', () => {
  test('renders h1 by default', () => {
    const html = renderToStaticMarkup(React.createElement(Heading, null, 'Head'));
    assert.match(html, /<h1[^>]*>/);
  });

  test('renders custom level', () => {
    const html = renderToStaticMarkup(React.createElement(Heading, { level: 3 }, 'Sub'));
    assert.match(html, /<h3[^>]*>/);
  });

  test('passes color through', () => {
    const html = renderToStaticMarkup(React.createElement(Heading, { color: 'success' }, 'Green'));
    assert.match(html, /#4ade80/);
  });
});

describe('Text', () => {
  test('renders with body1 variant', () => {
    const html = renderToStaticMarkup(React.createElement(Text, null, 'Body'));
    assert.match(html, /font-size:\s*15/);
  });
});

describe('Paragraph', () => {
  test('renders p tag with body1 style', () => {
    const html = renderToStaticMarkup(React.createElement(Paragraph, null, 'Para'));
    assert.match(html, /<p[^>]*>/);
    assert.match(html, /font-size:\s*15/);
  });
});

describe('Caption', () => {
  test('renders with 12px font', () => {
    const html = renderToStaticMarkup(React.createElement(Caption, null, 'Small'));
    assert.match(html, /font-size:\s*12/);
  });
});
