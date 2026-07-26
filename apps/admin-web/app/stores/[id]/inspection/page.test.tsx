import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');

describe('stores/[id]/inspection/page.tsx 结构固证', () => {
  it('应为 server wrapper 并加载巡检快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('loadInspectionSnapshot'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadInspectionSnapshot(id)'));
    assert.ok(PAGE_SRC.includes('<InspectionClient snapshot={snapshot} />'));
  });

  it('应透出来源态证据并保留权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源'));
    assert.ok(PAGE_SRC.includes('业务数据'));
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'));
  });
});
