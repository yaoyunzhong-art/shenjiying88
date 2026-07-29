import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-rules-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-rules-client.tsx'), 'utf-8');

describe('inventory/rules 结构固证', () => {
  it('page 应为 async server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export default async function InventoryRulesPage'));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadInventoryRulesSnapshot(resolveTenantId(query.tenantId))'));
    assert.ok(PAGE_SRC.includes('<InventoryRulesClient snapshot={snapshot} />'));
  });

  it('page 应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'));
  });

  it('data loader 应定义库存规则快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface InventoryRulesSnapshot'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('FALLBACK_INVENTORY_RULES'));
    assert.ok(DATA_SRC.includes('loadInventoryRulesSnapshot'));
    assert.ok(DATA_SRC.includes('refreshPath: \'InventoryRulesPage -> loadInventoryRulesSnapshot\''));
  });

  it('client renderer 应消费 snapshot 并保留刷新链路', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryRulesSnapshot'));
    assert.ok(CLIENT_SRC.includes('useSearchParams'));
    assert.ok(CLIENT_SRC.includes('router.replace(nextPath)'));
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()");
  });

  it('client renderer 应保留规则交互能力', () => {
    assert.ok(CLIENT_SRC.includes('handleToggleStatus'));
    assert.ok(CLIENT_SRC.includes('handleDelete'));
    assert.ok(CLIENT_SRC.includes('handleCreate'));
    assert.ok(CLIENT_SRC.includes('handleUpdate'));
    assert.ok(CLIENT_SRC.includes('RuleEditDialog'));
    assert.ok(CLIENT_SRC.includes('RuleCreateDialog'));
  });
});
