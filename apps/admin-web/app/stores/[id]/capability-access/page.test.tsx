import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');

describe('stores/[id]/capability-access/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载能力访问快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export default async function CapabilityAccessPage'));
    assert.ok(PAGE_SRC.includes('loadCapabilityAccessSnapshot'));
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCapabilityAccessSnapshot(id)'));
    assert.ok(PAGE_SRC.includes('<CapabilityAccessClient snapshot={snapshot} />'));
  });

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'));
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"));
  });
});
