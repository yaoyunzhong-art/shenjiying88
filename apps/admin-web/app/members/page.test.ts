import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'members-page-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'members-client.tsx'), 'utf-8');

describe('members 来源态固证', () => {
  it('page 应导出动态壳层配置并接入管理员权限门禁', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除');
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"));
  });

  it('data loader 应复用会员 view model 并输出来源文案', () => {
    assert.ok(DATA_SRC.includes('loadAdminMemberList'));
    assert.ok(DATA_SRC.includes('sourceLabel'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('member fallback snapshot'));
  });

  it('data loader 应保留页面级刷新路径合同', () => {
    assert.ok(DATA_SRC.includes("refreshPath: 'MembersPage -> loadMembersPageSnapshot'"));
    assert.ok(DATA_SRC.includes('generatedAt: new Date().toISOString()'));
    assert.ok(DATA_SRC.includes('members: snapshot.members'));
  });

  it('client 应保留筛选、排序、分页和刷新能力', () => {
    assert.ok(CLIENT_SRC.includes('usePagination'));
    assert.ok(CLIENT_SRC.includes('useSortedItems'));
    assert.ok(CLIENT_SRC.includes('useSearchFilter'));
    assert.ok(CLIENT_SRC.includes('Pagination'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
  });

  it('client 应保留 capability gating 与详情跳转链路', () => {
    assert.ok(CLIENT_SRC.includes('useStoreCapabilityGating'));
    assert.ok(CLIENT_SRC.includes('deriveScopedCapabilityActionItem'));
    assert.ok(CLIENT_SRC.includes('member capability'));
    assert.ok(CLIENT_SRC.includes("window.location.href = `/members/${item.id}`"));
  });

  it('源码中不应残留旧客户端 page 假设', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'));
    assert.ok(!DATA_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes('describe.skip'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(!PAGE_SRC.includes('useEffect('));
  });
});
