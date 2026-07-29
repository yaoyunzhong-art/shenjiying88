import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'seo-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'seo-client.tsx'), 'utf-8');

describe('seo 结构固证', () => {
  it('page 应为 server wrapper 并加载 SEO 快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('searchParams: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(PAGE_SRC.includes('loadSeoSnapshot'));
    assert.ok(PAGE_SRC.includes('<SeoClient snapshot={snapshot} />'));
  });

  it('page 应显式展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('sourceEvidence.sourceLabel'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('sourceEvidence.controlPlaneSource'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('sourceEvidence.businessDataSource'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('sourceEvidence.refreshPath'), 'E54 拍平：sourceEvidence 应已下沉到 client');
  });

  it('data loader 应定义 SEO 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface SeoSnapshotDelivery'));
    assert.ok(DATA_SRC.includes('modules'));
    assert.ok(DATA_SRC.includes('suggestions'));
    assert.ok(DATA_SRC.includes('loadSeoSnapshot'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot.modules'));
    assert.ok(CLIENT_SRC.includes('snapshot.suggestions'));
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()");
  });
});
