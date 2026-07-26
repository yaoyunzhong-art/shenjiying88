import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
const DATA_SRC = readFileSync(resolve(DIR, 'member-edit-data.ts'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(DIR, 'member-edit-client.tsx'), 'utf-8');

describe('members/[id]/edit 来源态固证', () => {
  it('page 应导出动态壳层配置并接入权限门禁', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'));
    assert.ok(PAGE_SRC.includes("requiredPermission: 'member:read'"));
  });

  it('data loader 应复用会员详情 view model 并输出 fallback 文案', () => {
    assert.ok(DATA_SRC.includes('loadAdminMemberDetail'));
    assert.ok(DATA_SRC.includes('sourceLabel'));
    assert.ok(DATA_SRC.includes('controlPlaneSource'));
    assert.ok(DATA_SRC.includes('businessDataSource'));
    assert.ok(DATA_SRC.includes('member detail fallback snapshot'));
  });

  it('data loader 应保留 memberId 与空数据保护', () => {
    assert.ok(DATA_SRC.includes('memberId: string'));
    assert.ok(DATA_SRC.includes('member: MemberDetail | null'));
    assert.ok(DATA_SRC.includes('error: detail.member ? undefined :'));
  });

  it('client 应保留表单校验与提交反馈能力', () => {
    assert.ok(CLIENT_SRC.includes('interface EditFormData'));
    assert.ok(CLIENT_SRC.includes('interface EditFormErrors'));
    assert.ok(CLIENT_SRC.includes('validateForm'));
    assert.ok(CLIENT_SRC.includes('FormSubmitFeedback'));
    assert.ok(CLIENT_SRC.includes("type: 'date'"));
  });

  it('client 应保留保存、审批结果与返回链路', () => {
    assert.ok(CLIENT_SRC.includes('handleSave'));
    assert.ok(CLIENT_SRC.includes('updateAdminMemberProfile'));
    assert.ok(CLIENT_SRC.includes('isMemberMutationApprovalResult'));
    assert.ok(CLIENT_SRC.includes("router.push('/members')"));
    assert.ok(CLIENT_SRC.includes('router.push(`/members/${snapshot.memberId}`)'));
  });

  it('源码中不应残留 describe.skip 或错误类型断言', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'));
    assert.ok(!DATA_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes("MemberFormData['gender']"));
  });
});
