import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'store-detail-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'store-detail-client.tsx'), 'utf-8');

describe('stores/[id] data/client 结构固证', () => {
  it('snapshot loader 应聚合详情与 capability access', () => {
    assert.ok(DATA_SRC.includes('export interface StoreDetailPageSnapshot'));
    assert.ok(DATA_SRC.includes('detailDeliveryMode'));
    assert.ok(DATA_SRC.includes('capabilityDeliveryMode'));
    assert.ok(DATA_SRC.includes('loadStoreCapabilityAccessSnapshot'));
    assert.ok(DATA_SRC.includes('loadAdminStoreDetail'));
    assert.ok(DATA_SRC.includes('Promise.all'));
  });

  it('client renderer 应承载编辑、能力入口与刷新交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('validateForm'));
    assert.ok(CLIENT_SRC.includes('submitStoreEdit'));
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()");
    assert.ok(CLIENT_SRC.includes('buildCapabilityEntrypoints'));
  });

  it('client renderer 应保留详情壳层与信息块', () => {
    assert.ok(CLIENT_SRC.includes('DetailShell'));
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'));
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'));
    assert.ok(CLIENT_SRC.includes('InfoRow'));
    assert.ok(CLIENT_SRC.includes('FormField'));
  });
});
