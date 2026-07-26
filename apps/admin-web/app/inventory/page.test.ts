import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-client.tsx'), 'utf-8');

describe('inventory 来源态固证', () => {
  it('page 应导出动态壳层配置', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
  });

  it('page 应解析 tenantId 并加载 snapshot loader', () => {
    assert.ok(PAGE_SRC.includes('resolveTenantId'));
    assert.ok(PAGE_SRC.includes('loadInventoryPageSnapshot(resolveTenantId(query.tenantId))'));
  });

  it('data loader 应固化控制面与业务数据来源文案', () => {
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('refreshPath'));
    assert.ok(DATA_SRC.includes('note'));
  });

  it('client 应保留租户切换和操作弹窗', () => {
    assert.ok(CLIENT_SRC.includes('setTenantId'));
    assert.ok(CLIENT_SRC.includes('OperationDialog'));
    assert.ok(CLIENT_SRC.includes('CreateDialog'));
    assert.ok(CLIENT_SRC.includes('window.setTimeout(() => setToast(null), 3000)'));
  });

  it('源码中不应出现 describe.skip 或 as any', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'));
    assert.ok(!DATA_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes('describe.skip'));
    assert.ok(!PAGE_SRC.includes('as any'));
    assert.ok(!DATA_SRC.includes('as any'));
    assert.ok(!CLIENT_SRC.includes('as any'));
  });
});
