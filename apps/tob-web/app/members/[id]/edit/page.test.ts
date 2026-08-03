import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'member-edit-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../../member-edit-data.ts'), 'utf-8');
});

describe('MemberEditPage — 服务端壳层', () => {
  it('页面应为 async server component 并解析动态 params', () => {
    assert.ok(PAGE_SRC.includes('export default async function MemberEditPage('));
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'));
    assert.ok(PAGE_SRC.includes('const { id } = await params'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic';"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0;'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载编辑快照并透传给客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberEditSnapshot(id)'));
    assert.ok(PAGE_SRC.includes('<MemberEditClient snapshot={snapshot} />'));
  });
});

describe('MemberEditPage — 来源态证据', () => {
  it('页面应展示 Delivery、控制面来源、刷新路径与时间证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应固证 fallback 编辑态说明', () => {
    assert.ok(PAGE_SRC.includes('loadMemberEditSnapshot -> members-data/index.ts local member edit snapshot'));
    assert.ok(PAGE_SRC.includes('local member samples used to hydrate edit form defaults'));
    assert.ok(PAGE_SRC.includes('fallback 样本态'));
  });
});

describe('MemberEditData — 快照合同', () => {
  it('应定义 fallback 编辑快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
    assert.ok(DATA_SRC.includes('member: MemberItem | null'));
    assert.ok(DATA_SRC.includes('generatedAt: string'));
  });

  it('应从本地会员样本定位指定会员', () => {
    assert.ok(DATA_SRC.includes('structuredClone'));
    assert.ok(DATA_SRC.includes('MOCK_MEMBERS.find((item) => item.id === memberId)'));
    assert.ok(DATA_SRC.includes('会员ID ${memberId} 未命中本地会员样本。'));
  });
});

describe('MemberEditClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: MemberEditSnapshot'));
  });

  it('客户端应支持 router.refresh、返回列表和查看详情', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("router.push('/members')"));
    assert.ok(CLIENT_SRC.includes('router.push(`/members/${snapshot.member.id}`)'));
  });

  it('客户端应保留编辑表单与预览区块', () => {
    assert.ok(CLIENT_SRC.includes('编辑会员资料'));
    assert.ok(CLIENT_SRC.includes('保存草稿'));
    assert.ok(CLIENT_SRC.includes('预览快照'));
    assert.ok(CLIENT_SRC.includes('FormField'));
    assert.ok(CLIENT_SRC.includes('FormSubmitFeedback'));
  });
});
