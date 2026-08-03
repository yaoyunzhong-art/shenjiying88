import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'inventory-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'inventory-page-data.ts'), 'utf-8');
});

describe('InventoryPage — 服务端壳层', () => {
  it('页面应为 async server component 并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('export default async function InventoryPage()'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic';"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0;'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载库存快照并透传给客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadInventorySnapshot()'));
    assert.ok(PAGE_SRC.includes('<InventoryClient snapshot={snapshot} />'));
  });
});

describe('InventoryPage — 来源态证据', () => {
  it('页面应展示 Delivery、控制面来源、刷新路径与时间证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应固证 fallback 样本来源说明', () => {
    assert.ok(PAGE_SRC.includes('loadInventorySnapshot -> inventory-data.ts local snapshot'));
    assert.ok(PAGE_SRC.includes('local inventory product, sku, purchase-order, check and transfer samples'));
    assert.ok(PAGE_SRC.includes('fallback 样本态'));
  });
});

describe('InventoryPageData — 快照合同', () => {
  it('应定义 fallback 快照结构与 skuMap', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
    assert.ok(DATA_SRC.includes('skuMap: Record<string, SKU[]>'));
    assert.ok(DATA_SRC.includes('purchaseOrders: PurchaseOrder[]'));
    assert.ok(DATA_SRC.includes('inventoryChecks: InventoryCheck[]'));
    assert.ok(DATA_SRC.includes('transfers: CrossStoreTransfer[]'));
  });

  it('应从 inventory-data.ts 样本构建服务端快照', () => {
    assert.ok(DATA_SRC.includes('structuredClone'));
    assert.ok(DATA_SRC.includes('MOCK_PRODUCTS'));
    assert.ok(DATA_SRC.includes('MOCK_SKUS.filter((sku) => sku.productId === product.productId)'));
  });
});

describe('InventoryClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryPageSnapshot'));
  });

  it('客户端应支持 router.refresh 与规则页跳转', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("router.push('/inventory/rules')"));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('客户端应保留四个业务 Tab 与交互动作', () => {
    assert.ok(CLIENT_SRC.includes('商品管理'));
    assert.ok(CLIENT_SRC.includes('采购订单'));
    assert.ok(CLIENT_SRC.includes('库存盘点'));
    assert.ok(CLIENT_SRC.includes('跨店调拨'));
    assert.ok(CLIENT_SRC.includes('receivePO'));
    assert.ok(CLIENT_SRC.includes('approveTransfer'));
    assert.ok(CLIENT_SRC.includes('executeTransfer'));
    assert.ok(CLIENT_SRC.includes('receiveTransfer'));
  });
});
