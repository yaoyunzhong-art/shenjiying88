import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'member-edit-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-edit-client.tsx'), 'utf-8');

describe('members/[id]/edit 结构固证', () => {
  it('page 应为 async server wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"));
    assert.ok(PAGE_SRC.includes('export default async function EditMemberPage'));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('loadMemberEditPageSnapshot(id)'));
    assert.ok(PAGE_SRC.includes('<MemberEditClient snapshot={snapshot} />'));
  });

  it('page 应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
    assert.ok(PAGE_SRC.includes('来源标签: {snapshot.sourceLabel}'));
  });

  it('data loader 应定义会员编辑快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface MemberEditPageSnapshot'));
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('loadAdminMemberDetail'));
    assert.ok(DATA_SRC.includes('loadMemberEditPageSnapshot'));
    assert.ok(DATA_SRC.includes("refreshPath: 'EditMemberPage -> loadMemberEditPageSnapshot'"));
  });

  it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: MemberEditPageSnapshot'));
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('router.refresh();'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('client renderer 应保留表单与提交链路', () => {
    assert.ok(CLIENT_SRC.includes('validateForm'));
    assert.ok(CLIENT_SRC.includes('buildInitialFormData'));
    assert.ok(CLIENT_SRC.includes('updateAdminMemberProfile'));
    assert.ok(CLIENT_SRC.includes('isMemberMutationApprovalResult'));
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'));
  });
});
