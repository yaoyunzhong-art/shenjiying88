import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'inventory-detail-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../inventory-detail-data.ts'), 'utf-8');
});

describe('InventoryDetailPage — 服务端壳层', () => {
  it('页面应为 async server component 并等待动态 params', () => {
    assert.ok(PAGE_SRC.includes('export default async function InventoryDetailPage'));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('const { id } = await params'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载详情快照并透传给客户端', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadInventoryDetailSnapshot(id)'));
    assert.ok(PAGE_SRC.includes('<InventoryDetailClient snapshot={snapshot} />'));
  });
});

describe('InventoryDetailPage — 来源态证据', () => {
  it('页面应展示来源态证据字段', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应固证详情 fallback 来源说明', () => {
    assert.ok(PAGE_SRC.includes('loadInventoryDetailSnapshot -> inventory-data.ts local detail snapshot'));
    assert.ok(PAGE_SRC.includes('fallback 样本态'));
  });
});

describe('InventoryDetailData — 快照合同', () => {
  it('应按 productId 生成详情快照', () => {
    assert.ok(DATA_SRC.includes('productId: string'));
    assert.ok(DATA_SRC.includes('getProductById(productId)'));
    assert.ok(DATA_SRC.includes('getSKUsByProductId(productId)'));
  });

  it('应聚合采购、盘点和调拨关联数据', () => {
    assert.ok(DATA_SRC.includes('MOCK_PURCHASE_ORDERS.filter'));
    assert.ok(DATA_SRC.includes('MOCK_INVENTORY_CHECKS.filter'));
    assert.ok(DATA_SRC.includes('MOCK_TRANSFERS.filter'));
  });
});

describe('InventoryDetailClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryDetailSnapshot'));
  });

  it('客户端应保留刷新、盘点、编辑和删除动作', () => {
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes('开始盘点'));
    assert.ok(CLIENT_SRC.includes('编辑'));
    assert.ok(CLIENT_SRC.includes('删除'));
    assert.ok(CLIENT_SRC.includes('确认删除'));
    assert.ok(CLIENT_SRC.includes('/inventory/${product.productId}/edit'));
  });

  it('客户端应保留 SKU、采购、盘点、调拨四个结构区块', () => {
    assert.ok(CLIENT_SRC.includes('SKU 库存明细'));
    assert.ok(CLIENT_SRC.includes('采购订单'));
    assert.ok(CLIENT_SRC.includes('盘点记录'));
    assert.ok(CLIENT_SRC.includes('调拨记录'));
    assert.ok(CLIENT_SRC.includes('产品未找到'));
  });
});
