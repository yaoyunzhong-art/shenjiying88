import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-client.tsx'), 'utf-8');

describe('stores/[id]/inventory 结构固证', () => {
  it('page 应为 server wrapper 并读取 tenant 查询参数', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadInventorySnapshot'));
    assert.ok(PAGE_SRC.includes('resolveTenantId(query.tenantId)'));
    assert.ok(PAGE_SRC.includes('<InventoryClient snapshot={snapshot} />'));
  });

  it('page 应显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源'));
    assert.ok(PAGE_SRC.includes('业务数据'));
    assert.ok(PAGE_SRC.includes('generatedAt'));
  });

  it('data loader 应固化库存样本、申领流转与 fallback 合同', () => {
    assert.ok(DATA_SRC.includes('export interface InventorySnapshotDelivery'));
    assert.ok(DATA_SRC.includes('REQUEST_API_BASE'));
    assert.ok(DATA_SRC.includes('ITEMS'));
    assert.ok(DATA_SRC.includes('RESTOCK_LOG'));
    assert.ok(DATA_SRC.includes('loadInventorySnapshot'));
  });

  it('client renderer 应真正消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.items'));
    assert.ok(CLIENT_SRC.includes('snapshot.categories'));
    assert.ok(CLIENT_SRC.includes('snapshot.restockLog'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });

  it('client renderer 应保留物料申领动作链路', () => {
    assert.ok(CLIENT_SRC.includes('buildInventoryHeaders'));
    assert.ok(CLIENT_SRC.includes('handleCreateMaterialRequest'));
    assert.ok(CLIENT_SRC.includes('handleApproveMaterialRequest'));
    assert.ok(CLIENT_SRC.includes('handleOutboundMaterialRequest'));
  });
});
