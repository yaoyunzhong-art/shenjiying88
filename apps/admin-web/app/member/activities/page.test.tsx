import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'member-activities-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'mock-data.ts'), 'utf-8');
});

describe('MemberActivitiesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function MemberActivitiesPage()'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载会员活动快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberActivitiesSnapshot()'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'));
  });

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除');
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'member:read'"));
  });
});

describe('MemberActivitiesPage — 来源态证据', () => {
  it('页面应展示来源态证据字段', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadMemberActivitiesSnapshot -> members/activities'));
    assert.ok(PAGE_SRC.includes('loadMemberActivitiesSnapshot -> MOCK_ACTIVITIES fallback'));
    assert.ok(PAGE_SRC.includes('local member activity samples'));
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'));
  });
});

describe('MemberActivitiesData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('activities: ActivityItem[]'));
    assert.ok(DATA_SRC.includes('generatedAt: string'));
  });

  it('应尝试读取上游 members/activities 接口', () => {
    assert.ok(DATA_SRC.includes("'members/activities'"));
    assert.ok(DATA_SRC.includes('new URL('));
    assert.ok(DATA_SRC.includes('resolveMemberActivitiesApiBaseUrl'));
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ activities: ActivityItem[] }>'));
  });

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
    assert.ok(DATA_SRC.includes('会员活动实时接口不可达，已切换到 fallback 样本数据。'));
  });
});

describe('MemberActivitiesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: MemberActivitiesSnapshotDelivery'));
  });

  it('客户端组件应支持刷新并透出 fallback 错误', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"));
    assert.ok(CLIENT_SRC.includes('snapshot.error'));
  });

  it('客户端组件应保留筛选、分页和分享动作', () => {
    assert.ok(CLIENT_SRC.includes('useSearchFilter'));
    assert.ok(CLIENT_SRC.includes('usePagination'));
    assert.ok(CLIENT_SRC.includes('FilterChips'));
    assert.ok(CLIENT_SRC.includes('DetailActionBar'));
    assert.ok(CLIENT_SRC.includes("workspace: 'member-activities'"));
  });

  it('客户端组件应保留 tabs、表格与成功率展示', () => {
    assert.ok(CLIENT_SRC.includes('Tabs'));
    assert.ok(CLIENT_SRC.includes('DataTable'));
    assert.ok(CLIENT_SRC.includes("title={`活动记录（匹配 ${sortedItems.length} 条）`}"));
    assert.ok(CLIENT_SRC.includes('% 成功率'));
  });
});

describe('MemberActivitiesPage — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'));
    assert.ok(!CLIENT_SRC.includes('describe.skip'));
    assert.ok(!DATA_SRC.includes('describe.skip'));
  });

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'));
    assert.ok(!CLIENT_SRC.includes('as any'));
    assert.ok(!DATA_SRC.includes('as any'));
  });
});
