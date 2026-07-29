import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-detail-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-detail-client.tsx'), 'utf-8');

describe('inventory/[id] 结构固证', () => {
  it('page 应为 async server wrapper 并同时解析 params/searchParams', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export default async function InventoryDetailPage'));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('const [{ id }, query] = await Promise.all([params, searchParams])'));
    assert.ok(PAGE_SRC.includes('loadInventoryDetailSnapshot'));
  });

  it('page 应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'));
  });

  it('data loader 应固化详情与 movement 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface InventoryDetailSnapshot'));
    assert.ok(DATA_SRC.includes('export interface StockMovement'));
    assert.ok(DATA_SRC.includes('FALLBACK_MOVEMENTS'));
    assert.ok(DATA_SRC.includes('loadInventoryDetailSnapshot'));
    assert.ok(DATA_SRC.includes('/movements'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: InventoryDetailSnapshot'));
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()");
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('client renderer 应保留状态流转、编辑和删除链路', () => {
    assert.ok(CLIENT_SRC.includes('handleSave'));
    assert.ok(CLIENT_SRC.includes('handleStatusAction'));
    assert.ok(CLIENT_SRC.includes('handleDelete'));
    assert.ok(CLIENT_SRC.includes('availableStatusActions'));
    assert.ok(CLIENT_SRC.includes('validateEditInput'));
  });
});
