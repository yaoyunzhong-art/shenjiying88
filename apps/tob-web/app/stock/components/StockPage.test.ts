/**
 * StockPage Test — 验证 StockPage 组件结构和渲染
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import type { StockPageProps } from './StockPage';

const { renderToStaticMarkup } = require('react-dom/server');

// CJS-style require for the component
const MOD = require('./StockPage');
const StockPage: React.FC<StockPageProps> = MOD.StockPage ?? MOD.default ?? MOD;
const { MOCK_STOCK } = require('../../stock-data');

describe('StockPage (ToB)', () => {
  const defaultProps: StockPageProps = {
    items: MOCK_STOCK,
    total: MOCK_STOCK.length,
    page: 1,
    pageSize: 15,
  };

  it('renders page shell with title', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    assert.match(html, /库存管理/);
    assert.match(html, /种库存商品/);
  });

  it('renders stats cards', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    assert.match(html, /库存总值/);
    assert.match(html, /缺货预警/);
    assert.match(html, /已缺货/);
  });

  it('renders stock items with SKU values', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    assert.match(html, /SKU-/);
  });

  it('renders table with columns', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    // DataTable renders column keys in th elements
    assert.match(html, /<table/);
    assert.match(html, /name/);
    assert.match(html, /available/);
    assert.match(html, /totalValue/);
  });

  it('renders category and status filter selects', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    assert.match(html, /全部品类/);
    assert.match(html, /全部状态/);
  });

  it('shows items count', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, defaultProps));
    assert.match(html, /共.*条/);
  });

  it('renders empty state when items array is empty', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, {
      items: [],
      total: 0,
      page: 1,
      pageSize: 15,
    } as StockPageProps));
    assert.match(html, /暂无库存数据/);
  });

  it('handles partial props gracefully', () => {
    const html = renderToStaticMarkup(React.createElement(StockPage, {
      items: MOCK_STOCK.slice(0, 3),
      total: 3,
      page: 1,
      pageSize: 10,
    } as StockPageProps));
    assert.match(html, /库存管理/);
    assert.match(html, /SKU/);
  });
});
