import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');

describe('stores/[id]/page.tsx 结构固证', () => {
  it('应为 server wrapper 并消费详情快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('loadStoreDetailPageSnapshot'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStoreDetailPageSnapshot(id)'));
  });

  it('应渲染详情 client renderer 并透出来源态证据', () => {
    assert.ok(PAGE_SRC.includes('<StoreDetailClient snapshot={snapshot} />'));
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源'));
    assert.ok(PAGE_SRC.includes('businessDataSource'));
  });

  it('应保留管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'));
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"));
  });
});
