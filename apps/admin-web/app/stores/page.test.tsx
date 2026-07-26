import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');

describe('stores/page.tsx 结构固证', () => {
  it('应为 server wrapper，而不是 client page', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export const dynamic = \'force-dynamic\''));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
  });

  it('应在服务端加载 snapshot 并渲染 client renderer', () => {
    assert.ok(PAGE_SRC.includes('loadStoresPageSnapshot'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStoresPageSnapshot()'));
    assert.ok(PAGE_SRC.includes('<StoresClient snapshot={snapshot} />'));
  });

  it('应显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源'));
    assert.ok(PAGE_SRC.includes('业务数据'));
    assert.ok(PAGE_SRC.includes('刷新路径'));
    assert.ok(PAGE_SRC.includes('generatedAt'));
  });

  it('应保留管理员权限边界', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'));
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"));
  });
});
