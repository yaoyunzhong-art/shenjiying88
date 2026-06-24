import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DescriptionList } = require('./DescriptionList');

// --------------- tests ---------------

describe('DescriptionList', () => {
  test('renders label and value pairs', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [
          { label: '姓名', value: '张三' },
          { label: '手机', value: '13800138000' },
        ],
      })
    );
    assert.match(html, /姓名/);
    assert.match(html, /张三/);
    assert.match(html, /手机/);
    assert.match(html, /13800138000/);
  });

  test('renders empty value as dash', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: '备注', value: undefined }],
      })
    );
    assert.match(html, /备注/);
    assert.match(html, /-/);
  });

  test('renders null value as dash', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: '备注', value: null }],
      })
    );
    assert.match(html, /-/);
  });

  test('renders zero value', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: '数量', value: 0 }],
      })
    );
    assert.match(html, /0/);
  });

  test('renders render prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [
          {
            label: '状态',
            render: () => React.createElement('span', { style: { color: 'green' } }, '正常'),
          },
        ],
      })
    );
    assert.match(html, /正常/);
  });

  test('render prop takes precedence over value', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [
          {
            label: '状态',
            value: '异常',
            render: () => React.createElement('span', null, '正常'),
          },
        ],
      })
    );
    assert.match(html, /正常/);
    assert.doesNotMatch(html, /异常/);
  });

  test('renders with title', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        title: '基本信息',
        items: [{ label: '姓名', value: '张三' }],
      })
    );
    assert.match(html, /基本信息/);
  });

  test('does not render title when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: 'ID', value: '123' }],
      })
    );
    assert.doesNotMatch(html, /<h3/);
  });

  test('renders with 1 column', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        columns: 1,
        items: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ],
      })
    );
    // grid should have 1 column
    assert.match(html, /grid-template-columns:1fr/);
  });

  test('renders with 3 columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        columns: 3,
        items: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
          { label: 'C', value: '3' },
        ],
      })
    );
    assert.match(html, /grid-template-columns:1fr 1fr 1fr/);
  });

  test('renders with 4 columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        columns: 4,
        items: [
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
          { label: 'C', value: '3' },
          { label: 'D', value: '4' },
        ],
      })
    );
    assert.match(html, /grid-template-columns:1fr 1fr 1fr 1fr/);
  });

  test('defaults to 2 columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: 'A', value: '1' }],
      })
    );
    assert.match(html, /grid-template-columns:1fr 1fr/);
  });

  test('renders compact size with smaller padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        size: 'compact',
        items: [{ label: 'ID', value: '123' }],
      })
    );
    assert.match(html, /padding:4px 0/);
  });

  test('renders vertical layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        layout: 'vertical',
        items: [{ label: '地址', value: '北京市朝阳区' }],
      })
    );
    assert.match(html, /flex-direction:column/);
  });

  test('horizontal is default layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [{ label: 'A', value: '1' }],
      })
    );
    // inner cell should be row direction (horizontal)
    assert.match(html, /flex-direction:row/);
  });

  test('applies span to grid column', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        columns: 4,
        items: [
          { label: '描述', value: '一段很长的描述文字', span: 2 },
        ],
      })
    );
    assert.match(html, /grid-column:span 2/);
  });

  test('clamps span to column count', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        columns: 2,
        items: [
          { label: '描述', value: 'text', span: 10 },
        ],
      })
    );
    assert.match(html, /grid-column:span 2/);
  });

  test('no grid-column style when span is 1', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [
          { label: '描述', value: 'text', span: 1 },
        ],
      })
    );
    assert.doesNotMatch(html, /grid-column/);
  });

  test('renders ReactNode values', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        items: [
          {
            label: '标签',
            value: React.createElement(
              'span',
              { style: { background: '#dbeafe', padding: '2px 8px', borderRadius: 4 } },
              'VIP'
            ),
          },
        ],
      })
    );
    assert.match(html, /VIP/);
    assert.match(html, /background:#dbeafe/);
  });

  test('renders many items', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      label: `字段${i + 1}`,
      value: `值${i + 1}`,
    }));
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, { items })
    );
    assert.match(html, /字段1/);
    assert.match(html, /字段20/);
    assert.match(html, /值20/);
  });

  test('renders className on wrapper', () => {
    const html = renderToStaticMarkup(
      React.createElement(DescriptionList, {
        className: 'my-custom-class',
        items: [{ label: 'A', value: '1' }],
      })
    );
    assert.match(html, /my-custom-class/);
  });
});
