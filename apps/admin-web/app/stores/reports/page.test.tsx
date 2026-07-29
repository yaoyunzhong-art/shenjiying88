import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'store-reports-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'store-reports-client.tsx'), 'utf-8');

describe('stores/reports 结构固证', () => {
  it('page 应升级为 server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('loadStoreReportsSnapshot'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStoreReportsSnapshot()'));
    assert.ok(PAGE_SRC.includes('<StoreReportsClient snapshot={snapshot} />'));
  });

  it('page 应显式展示来源态证据并保留权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源'));
    assert.ok(PAGE_SRC.includes('业务数据'));
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除');
  });

  it('data loader 应固化报表默认样本与 fallback 合同', () => {
    assert.ok(DATA_SRC.includes('export interface StoreReportsSnapshot'));
    assert.ok(DATA_SRC.includes('DEFAULT_STORE_REPORTS'));
    assert.ok(DATA_SRC.includes('/api/stores/reports'));
    assert.ok(DATA_SRC.includes('loadStoreReportsSnapshot'));
    assert.ok(DATA_SRC.includes('summary'));
  });

  it('client renderer 应承载筛选、排序与刷新交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('useState<ProfitFilter>'));
    assert.ok(CLIENT_SRC.includes('DataTable'));
    assert.ok(CLIENT_SRC.includes('Tabs'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });
});
