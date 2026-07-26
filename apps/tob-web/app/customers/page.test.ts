import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let PAGE_SRC = '';
let CLIENT_SRC = '';
let DATA_SRC = '';

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'customers-client.tsx'), 'utf-8');
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../customers-data.ts'), 'utf-8');
});

describe('CustomersPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CustomersPage()'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('页面应加载企业客户快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCustomersSnapshot()'));
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic';"));
    assert.ok(PAGE_SRC.includes('export const revalidate = 0;'));
  });
});

describe('CustomersPage — 来源态证据', () => {
  it('页面应展示来源态证据字段', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'));
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'));
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'));
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
  });

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadCustomersSnapshot -> customers'));
    assert.ok(PAGE_SRC.includes('loadCustomersSnapshot -> MOCK_CUSTOMERS fallback'));
    assert.ok(PAGE_SRC.includes('local enterprise customer samples'));
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'));
  });
});

describe('CustomersData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(DATA_SRC.includes('customers: CustomerItem[]'));
    assert.ok(DATA_SRC.includes('generatedAt: string'));
  });

  it('应尝试读取上游 customers 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('customers', resolveCustomersApiBaseUrl())"));
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ customers: CustomerItem[] }>'));
  });

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"));
    assert.ok(DATA_SRC.includes('企业客户实时接口不可达，已切换到 fallback 样本数据。'));
  });
});

describe('CustomersClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并接收 snapshot', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"));
    assert.ok(CLIENT_SRC.includes('snapshot: CustomersSnapshotDelivery'));
  });

  it('客户端组件应支持刷新并透出 fallback 错误', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'));
    assert.ok(CLIENT_SRC.includes('useTransition'));
    assert.ok(CLIENT_SRC.includes('router.refresh()'));
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"));
    assert.ok(CLIENT_SRC.includes('snapshot.error'));
  });

  it('客户端组件应保留筛选、分页和统计卡片', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'));
    assert.ok(CLIENT_SRC.includes('setStatusFilter'));
    assert.ok(CLIENT_SRC.includes('setTierFilter'));
    assert.ok(CLIENT_SRC.includes('setIndustryFilter'));
    assert.ok(CLIENT_SRC.includes('Pagination'));
    assert.ok(CLIENT_SRC.includes('StatCard label="总客户数"'));
  });

  it('客户端组件应保留空态与表格展示', () => {
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有企业客户记录'));
    assert.ok(CLIENT_SRC.includes('当前快照暂无企业客户数据'));
    assert.ok(CLIENT_SRC.includes('DataTable columns={columns} rows={paged}'));
  });
});

describe('CustomersPage — 反例与边界', () => {
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
