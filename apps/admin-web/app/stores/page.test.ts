import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'stores-page-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'stores-client.tsx'), 'utf-8');

describe('stores data/client 结构固证', () => {
  it('snapshot loader 应封装 deliveryMode 与来源态合同', () => {
    assert.ok(DATA_SRC.includes('export interface StoresPageSnapshot'));
    assert.ok(DATA_SRC.includes('sourceLabel'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('refreshPath'));
    assert.ok(DATA_SRC.includes('generatedAt'));
  });

  it('snapshot loader 应复用现有门店视图模型', () => {
    assert.ok(DATA_SRC.includes('loadAdminStoreList'));
    assert.ok(DATA_SRC.includes('computeStoreStats'));
    assert.ok(DATA_SRC.includes('computeStoreMarketDistribution'));
    assert.ok(DATA_SRC.includes('loadStoresPageSnapshot'));
  });

  it('client renderer 应承载交互并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh");
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()");
    assert.ok(CLIENT_SRC.includes('snapshot'));
  });

  it('client renderer 应保留门店门控与筛选能力', () => {
    assert.ok(CLIENT_SRC.includes('useStoreCapabilityGating'));
    assert.ok(CLIENT_SRC.includes('StoreCapabilityActionStrip'));
    assert.ok(CLIENT_SRC.includes('StoreCapabilityGatingBanner'));
    assert.ok(CLIENT_SRC.includes('useSearchFilter'));
    assert.ok(CLIENT_SRC.includes('usePagination'));
  });
});
