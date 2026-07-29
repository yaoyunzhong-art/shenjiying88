import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'inventory-rules-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inventory-rules-client.tsx'), 'utf-8');

describe('inventory/rules 来源态固证', () => {
  it('page 应导出动态壳层配置并接入权限门禁', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除');
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'inventory:rules:read'"));
  });

  it('data loader 应固化控制面与 fallback 文案', () => {
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('refreshPath'));
    assert.ok(DATA_SRC.includes('note'));
    assert.ok(DATA_SRC.includes('inventory rules fallback snapshot'));
  });

  it('data loader 应通过服务端 snapshot loader 拉取规则数据', () => {
    assert.ok(DATA_SRC.includes('INVENTORY_RULES_API_BASE'));
    assert.ok(DATA_SRC.includes('encodeURIComponent('));
    assert.ok(DATA_SRC.includes('normalizeInventoryRule'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'api'"));
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
  });

  it('client 应保留租户切换和刷新能力', () => {
    assert.ok(CLIENT_SRC.includes('buildRefreshPath'));
    assert.ok(CLIENT_SRC.includes('setTenantId'));
    assert.ok(CLIENT_SRC.includes('router.replace(nextPath)'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('client 应保留变更规则的写链路与乐观锁字段', () => {
    assert.ok(CLIENT_SRC.includes("method: 'PATCH'"));
    assert.ok(CLIENT_SRC.includes("method: 'DELETE'"));
    assert.ok(CLIENT_SRC.includes("method: 'POST'"));
    assert.ok(CLIENT_SRC.includes("method: 'PUT'"));
    assert.ok(CLIENT_SRC.includes('version: rule.version'));
  });

  it('源码中不应残留旧客户端页假设', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'));
    assert.ok(!DATA_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes('describe.skip'));
    assert.ok(!PAGE_SRC.includes('as any'));
    assert.ok(!DATA_SRC.includes('as any'));
    assert.ok(!CLIENT_SRC.includes('as any'));
  });
});
