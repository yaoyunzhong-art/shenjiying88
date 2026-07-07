/**
 * 库房管理员工作台 — 页面级测试
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { InventoryKeeperClient } = require('./inventory-keeper-client');

describe('InventoryKeeperClient Page', () => {
  it('renders the PageShell with title', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /库房管理工作台/);
  });

  it('renders the subtitle with inbound/outbound counts', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /今日入库/);
    assert.match(html, /18/);
    assert.match(html, /出库/);
    assert.match(html, /23/);
  });

  it('renders InventoryKeeperDashboard keeper-dashboard testid', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /keeper-dashboard/);
  });

  it('renders warehouse name', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /中央配送中心/);
  });

  it('renders stock alerts', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /单品咖啡豆/);
    assert.match(html, /抹茶粉/);
    assert.match(html, /奶油芝士/);
  });

  it('renders inbound tasks', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /PO-2024-0689/);
    assert.match(html, /云南咖啡基地/);
  });

  it('renders outbound tasks', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /REQ-2024-0321/);
    assert.match(html, /门店A/);
  });

  it('renders quick action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /新建入库单/);
    assert.match(html, /发起盘点/);
    assert.match(html, /库位巡检/);
    assert.match(html, /调拨申请/);
  });

  it('renders metrics section with formatted values', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /1,256/);
    assert.match(html, /28,430/);
  });

  it('renders alert summary badges', () => {
    const html = renderToStaticMarkup(React.createElement(InventoryKeeperClient));
    assert.match(html, /低库存 7/);
    assert.match(html, /临期 3/);
  });
});
