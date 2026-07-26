import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA_SRC = readFileSync(resolve(DIR, 'inspection-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'inspection-client.tsx'), 'utf-8');

describe('stores/[id]/inspection data/client 结构固证', () => {
  it('snapshot loader 应固化来源态与 fallback 合同', () => {
    assert.ok(DATA_SRC.includes('export interface InspectionSnapshot'));
    assert.ok(DATA_SRC.includes('DEFAULT_INSPECTIONS'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('loadInspectionSnapshot'));
  });

  it('snapshot loader 应通过 actor headers 在服务端取数', () => {
    assert.ok(DATA_SRC.includes('buildActorHeaders'));
    assert.ok(DATA_SRC.includes('INSPECTION_PAGE_ACTOR'));
    assert.ok(DATA_SRC.includes('/api/logistics/inspections'));
  });

  it('client renderer 应保留提醒、结果录入与刷新链路', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('buildInspectionHeaders'));
    assert.ok(CLIENT_SRC.includes('handleRemind'));
    assert.ok(CLIENT_SRC.includes('handleRecordResult'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });
});
