import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'tenant-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'tenant-client.tsx'), 'utf-8');

describe('stores/[id]/tenant 结构固证', () => {
  it('page 应为 server wrapper 并读取 tenant 查询参数', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadTenantSnapshot'));
    assert.ok(PAGE_SRC.includes('resolveTenantId(query.tenantId)'));
    assert.ok(PAGE_SRC.includes('<TenantClient snapshot={snapshot} />'));
  });

  it('page 应显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('sourceEvidence.sourceLabel'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.controlPlaneSource'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.businessDataSource'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.refreshPath'));
    assert.ok(PAGE_SRC.includes('generatedAt'));
  });

  it('data loader 应定义租户快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface TenantSnapshotDelivery'));
    assert.ok(DATA_SRC.includes('migrationQueue'));
    assert.ok(DATA_SRC.includes('planOptions'));
    assert.ok(DATA_SRC.includes('loadTenantSnapshot'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.tenants'));
    assert.ok(CLIENT_SRC.includes('snapshot.migrationQueue'));
    assert.ok(CLIENT_SRC.includes('refreshSnapshot'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });
});
