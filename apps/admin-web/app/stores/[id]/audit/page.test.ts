import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'audit-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'audit-client.tsx'), 'utf-8');

describe('stores/[id]/audit data/client 结构固证', () => {
  it('snapshot loader 应固化审计快照合同与来源态字段', () => {
    assert.ok(DATA_SRC.includes('export interface AuditSnapshot'));
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-audit-api' | 'store-audit-fallback'"));
    assert.ok(DATA_SRC.includes('diagnostics: AuditDiagnostic[]'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('loadAuditSnapshot'));
  });

  it('snapshot loader 应保留审计样本与纯逻辑统计函数', () => {
    assert.ok(DATA_SRC.includes('DEFAULT_AUDIT_RECORDS'));
    assert.ok(DATA_SRC.includes('buildAuditSummary'));
    assert.ok(DATA_SRC.includes('buildAuditActionStats'));
    assert.ok(DATA_SRC.includes('LEVEL_CONFIG'));
  });

  it('client renderer 应保留筛选、详情和 router.refresh 刷新链路', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.records'));
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes('setDetailRecord'));
  });
});
