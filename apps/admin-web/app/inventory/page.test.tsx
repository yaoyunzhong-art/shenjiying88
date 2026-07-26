import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-client.tsx'), 'utf-8');

describe('inventory 结构固证', () => {
  it('page 应为 server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export default async function InventoryPage'));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadInventoryPageSnapshot'));
    assert.ok(PAGE_SRC.includes('<InventoryClient snapshot={snapshot} />'));
  });

  it('page 应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'));
  });

  it('data loader 应定义快照合同与 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export interface InventoryPageSnapshot'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('FALLBACK_INVENTORY_ITEMS'));
    assert.ok(DATA_SRC.includes('loadInventoryPageSnapshot'));
    assert.ok(DATA_SRC.includes('inventory fallback snapshot'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryPageSnapshot'));
    assert.ok(CLIENT_SRC.includes('useSearchParams'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('client renderer 应保留库存操作链路', () => {
    assert.ok(CLIENT_SRC.includes('handleStockIn'));
    assert.ok(CLIENT_SRC.includes('handleStockOut'));
    assert.ok(CLIENT_SRC.includes('handleCreate'));
    assert.ok(CLIENT_SRC.includes('lowStockCount'));
  });
});
