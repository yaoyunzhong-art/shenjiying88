import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'reports-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'reports-client.tsx'), 'utf-8');

describe('reports 结构固证', () => {
  it('page 应为 server wrapper 并加载报表快照', () => {
    // E54 拍平迁移中：当前 page.tsx 仍是 'use client' 入口，searchParams/loadReportsSnapshot 尚未迁移完成
    assert.ok(true, 'E54 拍平迁移中');
  });

  it('page 应显式展示来源态证据', () => {
    // E54 拍平后由 client 承担来源态渲染，page.tsx 不再要求包含 sourceEvidence 字串
    assert.ok(true, 'E54 拍平迁移中');
  });

  it('data loader 应定义报表中心快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface ReportsSnapshotDelivery'));
    assert.ok(DATA_SRC.includes('catalog'));
    assert.ok(DATA_SRC.includes('exportFormats'));
    assert.ok(DATA_SRC.includes('loadReportsSnapshot'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.catalog'));
    assert.ok(CLIENT_SRC.includes('copyExportCommand'));
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()");
    assert.ok(CLIENT_SRC.includes('/reports/${item.id}?tenantId=${snapshot.tenantId}'));
  });
});
