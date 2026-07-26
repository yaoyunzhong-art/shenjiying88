import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'inventory-rules-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../inventory-rules-data.ts'), 'utf-8');
});

describe('InventoryRulesPage — 服务端壳层', () => {
  it('页面应加载库存规则快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('export default async function InventoryRulesPage()'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadInventoryRulesSnapshot()'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic';"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0;'));
  });

  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('loadInventoryRulesSnapshot -> inventory-rules-data.ts local governance snapshot'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
  });
});

describe('InventoryRulesData — 快照合同', () => {
  it('应定义规则实体与 fallback 快照字段', () => {
    assert.ok(DATA_SRC.includes('export interface InventoryRuleItem'));
    assert.ok(DATA_SRC.includes('export interface InventoryRulesSnapshot'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
  });

  it('应从库存样本计算规则统计', () => {
    assert.ok(DATA_SRC.includes('MOCK_SKUS.filter((sku) => sku.stock > 0 && sku.stock < sku.safetyStock).length'));
    assert.ok(DATA_SRC.includes("MOCK_TRANSFERS.filter((transfer) => transfer.status === 'pending').length"));
    assert.ok(DATA_SRC.includes('MOCK_STORE_STATS.length'));
  });
});

describe('InventoryRulesClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryRulesSnapshot'));
  });

  it('客户端应支持返回、刷新和规则卡片展示', () => {
    assert.ok(CLIENT_SRC.includes("router.push('/inventory')"));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新规则快照'"));
    assert.ok(CLIENT_SRC.includes('来源态证据'));
  });
});
