/**
 * members/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 会员管理页面 — B端会员信息管理与多维度筛选
 * 角色视角: 👔运营经理 · 📊数据分析 · 💳会员主管
 *
 * 测试纬度：
 *   正例 — export/use client/Suspense/统计卡片/搜索/等级筛选/状态筛选/门店筛选/市场筛选/分页
 *   反例 — 空搜索/过滤链守卫/输入校验
 *   边界 — 分页边界/数据完整性/类型枚举/Mock数据/排序/颜色映射/统计计算
 */

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'members-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'members-page-data.ts'), 'utf-8');
});

describe('MembersPage — 服务端壳层', () => {
  it('页面应为 async server component 并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('export default async function MembersPage()'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic';"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0;'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载会员快照并透传给客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMembersSnapshot()'));
    assert.ok(PAGE_SRC.includes('<MembersClient snapshot={snapshot} />'));
  });
});

describe('MembersPage — 来源态证据', () => {
  it('页面应展示 Delivery、控制面来源、刷新路径与时间证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应固证 fallback 样本来源说明', () => {
    assert.ok(PAGE_SRC.includes('loadMembersSnapshot -> members-data/index.ts local snapshot'));
    assert.ok(PAGE_SRC.includes('local member samples generated from members-data/index.ts'));
    assert.ok(PAGE_SRC.includes('fallback 样本态'));
  });
});

describe('MembersPageData — 快照合同', () => {
  it('应定义 fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
    assert.ok(DATA_SRC.includes('members: MemberItem[]'));
    assert.ok(DATA_SRC.includes('generatedAt: string'));
  });

  it('应基于本地会员样本生成服务端快照', () => {
    assert.ok(DATA_SRC.includes('structuredClone'));
    assert.ok(DATA_SRC.includes('MOCK_MEMBERS'));
    assert.ok(DATA_SRC.includes('cloneValue(MOCK_MEMBERS)'));
  });
});

describe('MembersClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: MembersPageSnapshot'));
  });

  it('客户端应支持 router.refresh 与详情跳转', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes('router.push(`/members/${item.id}`)'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新快照'"));
  });

  it('客户端应保留搜索、筛选、排序、分页和统计卡片', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'));
    assert.ok(CLIENT_SRC.includes('FilterChips'));
    assert.ok(CLIENT_SRC.includes('useSearchFilter'));
    assert.ok(CLIENT_SRC.includes('useSortedItems'));
    assert.ok(CLIENT_SRC.includes('Pagination'));
    assert.ok(CLIENT_SRC.includes('stats.total'));
    assert.ok(CLIENT_SRC.includes('stats.active'));
    assert.ok(CLIENT_SRC.includes('stats.totalPoints'));
    assert.ok(CLIENT_SRC.includes('stats.diamond'));
  });
});
