const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { NumberFormat, Currency, Percent, Compact } = require('./NumberFormat');

describe('NumberFormat', function() {
  // ---- 基础渲染 ----
  test('renders a decimal number by default', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 123.456 }));
    assert.match(html, /123\.46/);
  });

  test('renders integer type without decimals', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 123.789, type: 'integer' }));
    assert.match(html, /124/);
    assert.doesNotMatch(html, /\./);
  });

  test('renders currency type with ¥ prefix', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 99.9, type: 'currency' }));
    assert.match(html, /¥99\.90/);
  });

  test('renders percent type (multiplies by 100 and adds %)', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 0.256, type: 'percent' }));
    assert.match(html, /25\.6%/);
  });

  test('renders compact type for 万 range', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 12345, type: 'compact' }));
    assert.match(html, /1\.2万/);
  });

  test('renders compact type for 亿 range', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 123456789, type: 'compact' }));
    assert.match(html, /1\.2亿/);
  });

  test('renders compact type for k range', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1234, type: 'compact' }));
    assert.match(html, /1\.2k/);
  });

  // ---- null / undefined ----
  test('renders placeholder for null value', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: null }));
    assert.match(html, /--/);
  });

  test('renders placeholder for undefined value', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: undefined }));
    assert.match(html, /--/);
  });

  test('renders custom placeholder text', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: null, placeholder: 'N/A' }));
    assert.match(html, /N\/A/);
  });

  // ---- 自定义 decimals ----
  test('respects custom decimals override', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 3.14159, decimals: 4 }));
    assert.match(html, /3\.1416/);
  });

  test('integer type with decimals=0 rounds correctly', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 99.9, type: 'integer', decimals: 0 }));
    assert.match(html, /100/);
  });

  // ---- signDisplay ----
  test('signDisplay=always adds + for positive', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 42, signDisplay: 'always' }));
    assert.match(html, /\+42/);
  });

  test('signDisplay=always shows - for negative', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: -8, signDisplay: 'always' }));
    assert.match(html, /-8/);
  });

  test('signDisplay=never strips minus sign', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: -5, signDisplay: 'never' }));
    // Should render positive 5.00 (no leading minus before number)
    assert.match(html, /5\.00/);
    assert.match(html, /font-variant-numeric/);
  });

  // ---- prefix / suffix ----
  test('renders prefix text before number', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 100, prefix: '≈' }));
    assert.match(html, /≈/);
    assert.match(html, /100/);
  });

  test('renders suffix text after number', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 88, suffix: '件' }));
    assert.match(html, /88/);
    assert.match(html, /件/);
  });

  // ---- colorizeTrend ----
  test('colorizeTrend applies success color for positive', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 15, colorizeTrend: true }));
    assert.match(html, /#4ade80/);
  });

  test('colorizeTrend applies danger color for negative', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: -10, colorizeTrend: true }));
    assert.match(html, /#f87171/);
  });

  test('colorizeTrend neutral for zero', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 0, colorizeTrend: true }));
    assert.doesNotMatch(html, /#4ade80|#f87171/);
  });

  // ---- sizes ----
  test('renders xs size with 11px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'xs' }));
    assert.match(html, /font-size:\s*11/);
  });

  test('renders sm size with 13px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'sm' }));
    assert.match(html, /font-size:\s*13/);
  });

  test('renders md size with 15px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'md' }));
    assert.match(html, /font-size:\s*15/);
  });

  test('renders lg size with 20px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'lg' }));
    assert.match(html, /font-size:\s*20/);
  });

  test('renders xl size with 28px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'xl' }));
    assert.match(html, /font-size:\s*28/);
  });

  test('renders xxl size with 40px font', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, size: 'xxl' }));
    assert.match(html, /font-size:\s*40/);
  });

  // ---- colors ----
  test('renders with danger color', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 50, color: 'danger' }));
    assert.match(html, /#f87171/);
  });

  test('renders with primary color', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 50, color: 'primary' }));
    assert.match(html, /#60a5fa/);
  });

  test('renders with muted color', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 50, color: 'muted' }));
    assert.match(html, /#71717a/);
  });

  // ---- custom currencySymbol ----
  test('renders custom currency symbol', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 10, type: 'currency', currencySymbol: '$' }));
    assert.match(html, /\$10\.00/);
  });

  // ---- zero & negative ----
  test('renders zero correctly', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 0 }));
    assert.match(html, /0\.00/);
  });

  test('renders negative numbers correctly', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: -3.5 }));
    assert.match(html, /-3\.50/);
  });

  // ---- style / className ----
  test('passes className and style to span', function() {
    var html = renderToStaticMarkup(React.createElement(NumberFormat, { value: 1, className: 'my-class', style: { background: 'red' } }));
    assert.match(html, /class="my-class"/);
    assert.match(html, /background:\s*red/);
  });
});

// ============================================
// Compound Exports
// ============================================

describe('Currency', function() {
  test('renders with ¥ prefix and 2 decimals', function() {
    var html = renderToStaticMarkup(React.createElement(Currency, { value: 50 }));
    assert.match(html, /¥50\.00/);
  });

  test('renders placeholder for null', function() {
    var html = renderToStaticMarkup(React.createElement(Currency, { value: null }));
    assert.match(html, /--/);
  });
});

describe('Percent', function() {
  test('renders value * 100 with %', function() {
    var html = renderToStaticMarkup(React.createElement(Percent, { value: 0.035 }));
    assert.match(html, /3\.5%/);
  });
});

describe('Compact', function() {
  test('renders 15000 as 1.5万', function() {
    var html = renderToStaticMarkup(React.createElement(Compact, { value: 15000 }));
    assert.match(html, /1\.5万/);
  });

  test('renders 999 as 999.0', function() {
    var html = renderToStaticMarkup(React.createElement(Compact, { value: 999 }));
    assert.match(html, /999\.0/);
  });
});
