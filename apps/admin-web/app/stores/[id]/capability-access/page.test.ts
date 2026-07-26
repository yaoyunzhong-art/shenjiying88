import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'capability-access-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'capability-access-client.tsx'), 'utf-8');

describe('stores/[id]/capability-access data/client 结构固证', () => {
  it('snapshot loader 应固化角色快照合同与来源态字段', () => {
    assert.ok(DATA_SRC.includes('export interface CapabilityAccessSnapshot'));
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-capability-access-api' | 'store-capability-access-fallback'"));
    assert.ok(DATA_SRC.includes('diagnostics: CapabilityDiagnostic[]'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('refreshPath'));
    assert.ok(DATA_SRC.includes('loadCapabilityAccessSnapshot'));
  });

  it('snapshot loader 应保留角色样本、用户摘要与纯逻辑函数', () => {
    assert.ok(DATA_SRC.includes('ROLE_DATA'));
    assert.ok(DATA_SRC.includes('USER_DIGEST'));
    assert.ok(DATA_SRC.includes('ACCESS_AUDIT_FINDINGS'));
    assert.ok(DATA_SRC.includes('buildCapabilitySummary'));
  });

  it('client renderer 应承载筛选、角色动作与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.roles'));
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes('createRole'));
    assert.ok(CLIENT_SRC.includes('updateRoleStatus'));
  });
});
