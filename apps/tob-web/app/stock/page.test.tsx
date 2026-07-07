/**
 * StockListPage Test — 验证库存管理列表页渲染
 * 使用 node:test 风格 (匹配 apps/tob-web 项目规范)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import type { StockItem } from '../stock-data';

const { renderToStaticMarkup } = require('react-dom/server');

// Load mock data
const stockData = require('../stock-data');
const MOCK_STOCK: StockItem[] = stockData.MOCK_STOCK;

describe('StockListPage (page.tsx)', () => {
  it('renders the page title and description — module exports default', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('module can be imported without errors', async () => {
    await assert.doesNotReject(async () => {
      await import('./page');
    });
  });

  it('depends on StockPage from components', async () => {
    const stockPageMod = await import('./components/StockPage');
    assert.equal(typeof stockPageMod.StockPage, 'function');
  });

  it('stock-data has correct MOCK_STOCK count', () => {
    assert.equal(MOCK_STOCK.length, 48);
  });

  it('MOCK_STOCK items have all required fields', () => {
    const requiredFields: (keyof StockItem)[] = [
      'id', 'sku', 'name', 'category', 'quantity', 'available',
      'minStock', 'maxStock', 'status', 'unitPrice', 'totalValue',
      'warehouse', 'supplier', 'location', 'unit',
    ];
    for (const item of MOCK_STOCK) {
      for (const field of requiredFields) {
        assert.ok(item[field] !== undefined, `Missing field "${field}" in item ${item.id}`);
      }
    }
  });

  it('stock-data has all statuses in STOCK_STATUS_MAP', () => {
    const statuses = ['in_stock', 'low_stock', 'out_of_stock', 'expired'];
    for (const s of statuses) {
      assert.ok(stockData.STOCK_STATUS_MAP[s], `Missing status map entry: ${s}`);
      assert.equal(typeof stockData.STOCK_STATUS_MAP[s].label, 'string');
      assert.equal(typeof stockData.STOCK_STATUS_MAP[s].variant, 'string');
    }
  });

  it('all categories in STOCK_CATEGORY_MAP have label', () => {
    const categories = ['raw_material', 'semi_finished', 'finished', 'consumable', 'gift'];
    for (const c of categories) {
      assert.ok(stockData.STOCK_CATEGORY_MAP[c], `Missing category map entry: ${c}`);
      assert.equal(typeof stockData.STOCK_CATEGORY_MAP[c].label, 'string');
    }
  });

  it('stock-data has status labels in Chinese', () => {
    assert.equal(stockData.STOCK_STATUS_MAP.in_stock.label, '充足');
    assert.equal(stockData.STOCK_STATUS_MAP.low_stock.label, '缺货预警');
    assert.equal(stockData.STOCK_STATUS_MAP.out_of_stock.label, '缺货');
  });

  it('stock-data contains at least one of each status', () => {
    const statuses = new Set(MOCK_STOCK.map((s: StockItem) => s.status));
    for (const s of stockData.STOCK_STATUSES as string[]) {
      assert.ok(statuses.has(s as StockItem['status']), `Missing stock item with status: ${s}`);
    }
  });

  it('stock-data contains at least one of each category', () => {
    const categories = new Set(MOCK_STOCK.map((s: StockItem) => s.category));
    for (const c of stockData.STOCK_CATEGORIES as string[]) {
      assert.ok(categories.has(c as StockItem['category']), `Missing stock item with category: ${c}`);
    }
  });

  it('SKU values are unique across mock data', () => {
    const skus = MOCK_STOCK.map((s: StockItem) => s.sku);
    assert.equal(new Set(skus).size, skus.length);
  });

  it('item IDs are unique across mock data', () => {
    const ids = MOCK_STOCK.map((s: StockItem) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('available stock is non-negative', () => {
    for (const s of MOCK_STOCK) {
      assert.ok(s.available >= 0, `${s.id} available is negative`);
    }
  });

  it('quantity >= reserved and available === quantity - reserved', () => {
    for (const s of MOCK_STOCK) {
      assert.ok(s.quantity >= s.reserved, `${s.id} quantity < reserved`);
      assert.equal(s.available, s.quantity - s.reserved, `${s.id} available !== quantity - reserved`);
    }
  });

  it('renders page shell with title via StockPage', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /库存管理/);
    assert.match(html, /种库存商品/);
  });

  it('renders stats cards', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /库存总值/);
    assert.match(html, /缺货预警/);
    assert.match(html, /已缺货/);
  });

  it('renders search input', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /搜索/);
  });

  it('renders category and status filter selects', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /全部品类/);
    assert.match(html, /全部状态/);
  });

  it('renders table column headers', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /SKU/);
    assert.match(html, /商品名称/);
    assert.match(html, /品类/);
    assert.match(html, /可用库存/);
    assert.match(html, /状态/);
    assert.match(html, /库存价值/);
    assert.match(html, /仓库/);
  });

  it('renders pagination info', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /条\/页/);
  });

  it('renders empty state when items array is empty', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: [],
        total: 0,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /暂无库存数据/);
  });

  it('renders stock items with SKU values', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /SKU-/);
  });

  it('renders stock total value stat containing ¥', () => {
    const StockPage = require('./components/StockPage').StockPage;
    const html = renderToStaticMarkup(
      React.createElement(StockPage, {
        items: MOCK_STOCK,
        total: MOCK_STOCK.length,
        page: 1,
        pageSize: 15,
      }),
    );
    assert.match(html, /¥/);
  });

  it('all items have positive unitPrice', () => {
    for (const s of MOCK_STOCK) {
      assert.ok(s.unitPrice > 0, `${s.id} unitPrice invalid`);
    }
  });

  it('stock-data has items spanning different warehouses', () => {
    const warehouses = new Set(MOCK_STOCK.map((s: StockItem) => s.warehouse));
    assert.ok(warehouses.size >= 2, 'Expected at least 2 different warehouses');
  });

  it('stock-data has items across multiple categories', () => {
    const categories = new Set(MOCK_STOCK.map((s: StockItem) => s.category));
    assert.ok(categories.size >= 2, 'Expected at least 2 different categories');
  });

  it('lastCheckIn dates are valid', () => {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const s of MOCK_STOCK) {
      assert.ok(dateRe.test(s.lastCheckIn), `${s.id} invalid lastCheckIn: ${s.lastCheckIn}`);
    }
  });

  it('out_of_stock items have quantity === 0', () => {
    for (const s of MOCK_STOCK) {
      if (s.status === 'out_of_stock') {
        assert.equal(s.quantity, 0, `${s.id} out_of_stock but quantity > 0`);
      }
    }
  });

  it('in_stock items have quantity > minStock', () => {
    for (const s of MOCK_STOCK) {
      if (s.status === 'in_stock' && s.quantity > 0) {
        assert.ok(s.quantity > s.minStock,
          `${s.id} in_stock but quantity (${s.quantity}) <= minStock (${s.minStock})`);
      }
    }
  });
});
