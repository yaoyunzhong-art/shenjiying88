import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'operations-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'operations-client.tsx'), 'utf-8');

describe('stores/[id]/operations data/client 结构固证', () => {
  it('snapshot loader 应固化来源态、诊断与 fallback 合同', () => {
    assert.ok(DATA_SRC.includes('export interface OperationsSnapshot'));
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-operations-api' | 'store-operations-fallback'"));
    assert.ok(DATA_SRC.includes('diagnostics: OperationDiagnostic[]'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('refreshPath'));
    assert.ok(DATA_SRC.includes('loadOperationsSnapshot'));
  });

  it('snapshot loader 应保留运营参数样本与纯逻辑函数', () => {
    assert.ok(DATA_SRC.includes('SETTINGS'));
    assert.ok(DATA_SRC.includes('REAL_TIME_METRICS'));
    assert.ok(DATA_SRC.includes('groupSettingsByCategory'));
    assert.ok(DATA_SRC.includes('buildOperationsSummary'));
  });

  it('client renderer 应承载交互与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.realtime'));
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes('commitDraftValue'));
  });
});
