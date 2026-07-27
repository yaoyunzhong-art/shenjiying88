import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'report-detail-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'report-detail-client.tsx'), 'utf-8');

describe('reports/[id] 结构固证', () => {
  it('page 应为 server wrapper 并使用 params + searchParams', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadReportDetailSnapshot'));
    assert.ok(PAGE_SRC.includes('<ReportDetailClient snapshot={snapshot} />'));
  });

  it('page 应显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('sourceEvidence.sourceLabel'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.controlPlaneSource'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.businessDataSource'));
    assert.ok(PAGE_SRC.includes('sourceEvidence.refreshPath'));
  });

  it('data loader 应定义报表详情快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface ReportDetailSnapshotDelivery'));
    assert.ok(DATA_SRC.includes('report: ReportResult | null'));
    assert.ok(DATA_SRC.includes('loadReportDetailSnapshot'));
    assert.ok(DATA_SRC.includes('getReportTitle'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.report'));
    assert.ok(CLIENT_SRC.includes('exportCsv'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });
});
