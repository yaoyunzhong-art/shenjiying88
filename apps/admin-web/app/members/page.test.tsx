import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'members-page-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'members-client.tsx'), 'utf-8');

describe('members 结构固证', () => {
  it('page 应为 async server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(!PAGE_SRC.includes(')export default async function MembersPage()'));
    assert.ok(!PAGE_SRC.includes(')loadMembersPageSnapshot()'));
    assert.ok(!PAGE_SRC.includes(')<MembersClient snapshot={snapshot} />'));
  });

  it('page 应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes(')来源标签: {snapshot.sourceLabel}'));
  });

  it('data loader 应定义会员列表快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface MembersPageSnapshot'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('loadAdminMemberList'));
    assert.ok(DATA_SRC.includes('loadMembersPageSnapshot'));
    assert.ok(DATA_SRC.includes('MembersPage -> loadMembersPageSnapshot'));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: MembersPageSnapshot'));
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh");
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()");
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('client renderer 应保留会员筛选与治理链路', () => {
    assert.ok(CLIENT_SRC.includes('useSearchFilter'));
    assert.ok(CLIENT_SRC.includes('StoreCapabilityGatingBanner'));
    assert.ok(CLIENT_SRC.includes('StoreCapabilityActionStrip'));
    assert.ok(CLIENT_SRC.includes('FilterChips'));
    assert.ok(CLIENT_SRC.includes('DataTable'));
  });
});
