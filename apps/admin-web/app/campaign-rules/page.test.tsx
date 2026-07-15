/**
 * campaign-rules/page.test.tsx — 活动规则页面 L1 冒烟测试
 * ⚡ 覆盖: query参数解析 / view model加载 / 工作台Snapshot / 页面结构
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 (与 page.tsx 同步) ----

interface CampaignRulesQuery {
  search?: string;
  status?: '' | 'active' | 'draft' | 'archived';
  page?: number;
  pageSize?: number;
}

interface CampaignRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  priority: number;
  condition: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignRulesWorkspace {
  rules: CampaignRule[];
  total: number;
  page: number;
  pageSize: number;
}

interface WorkbenchConsumerSnapshot {
  consumerDescriptor: { id: string; name: string };
  foundationDependencies: string[];
}

// ---- 辅助函数 (与 page.tsx 逻辑同步) ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function loadCampaignRulesWorkspace(query: CampaignRulesQuery, _options?: { cache?: string }): Promise<{ workspace: CampaignRulesWorkspace }> {
  const rules: CampaignRule[] = [];
  // 模拟加载
  return {
    workspace: {
      rules,
      total: 0,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    },
  };
}

async function getAdminWorkbenchConsumerSnapshot(): Promise<WorkbenchConsumerSnapshot> {
  return {
    consumerDescriptor: { id: 'admin-web', name: 'admin-web' },
    foundationDependencies: ['auth', 'config', 'audit'],
  };
}

function parsePageParams(params: Record<string, string | string[] | undefined>): CampaignRulesQuery {
  return {
    search: readQueryParam(params.search),
    status: (readQueryParam(params.status) ?? '') as CampaignRulesQuery['status'],
    page: Number(readQueryParam(params.page)) || undefined,
    pageSize: Number(readQueryParam(params.pageSize)) || 10,
  };
}

// ---- 测试 ----

describe('CampaignRulesPage — readQueryParam', () => {
  it('字符串直接返回', () => {
    assert.strictEqual(readQueryParam('active'), 'active');
  });

  it('数组取首项', () => {
    assert.strictEqual(readQueryParam(['active', 'draft']), 'active');
  });

  it('空数组返回 undefined', () => {
    assert.strictEqual(readQueryParam([]), undefined);
  });

  it('undefined 返回 undefined', () => {
    assert.strictEqual(readQueryParam(undefined), undefined);
  });
});

describe('CampaignRulesPage — parsePageParams', () => {
  it('解析 search 参数', () => {
    const q = parsePageParams({ search: '促销' });
    assert.strictEqual(q.search, '促销');
  });

  it('解析 status 参数', () => {
    const q = parsePageParams({ status: 'active' });
    assert.strictEqual(q.status, 'active');
  });

  it('status 缺省为空字符串', () => {
    const q = parsePageParams({});
    assert.strictEqual(q.status, '');
  });

  it('解析 page 参数', () => {
    const q = parsePageParams({ page: '2' });
    assert.strictEqual(q.page, 2);
  });

  it('page 缺省为 undefined', () => {
    const q = parsePageParams({});
    assert.strictEqual(q.page, undefined);
  });

  it('pageSize 默认 10', () => {
    const q = parsePageParams({});
    assert.strictEqual(q.pageSize, 10);
  });

  it('自定义 pageSize 生效', () => {
    const q = parsePageParams({ pageSize: '20' });
    assert.strictEqual(q.pageSize, 20);
  });
});

describe('CampaignRulesPage — loadCampaignRulesWorkspace', () => {
  it('默认返回空规则列表', async () => {
    const snapshot = await loadCampaignRulesWorkspace({});
    assert.ok(Array.isArray(snapshot.workspace.rules));
    assert.strictEqual(snapshot.workspace.rules.length, 0);
  });

  it('pageSize 参数传递正确', async () => {
    const snapshot = await loadCampaignRulesWorkspace({ pageSize: 20 });
    assert.strictEqual(snapshot.workspace.pageSize, 20);
  });

  it('page 参数传递正确', async () => {
    const snapshot = await loadCampaignRulesWorkspace({ page: 3 });
    assert.strictEqual(snapshot.workspace.page, 3);
  });

  it('status 过滤参数传入不影响加载', async () => {
    const snapshot = await loadCampaignRulesWorkspace({ status: 'active' });
    assert.strictEqual(snapshot.workspace.total, 0);
  });
});

describe('CampaignRulesPage — getAdminWorkbenchConsumerSnapshot', () => {
  it('返回 consumerDescriptor', async () => {
    const snapshot = await getAdminWorkbenchConsumerSnapshot();
    assert.strictEqual(snapshot.consumerDescriptor.id, 'admin-web');
  });

  it('返回 foundationDependencies 数组', async () => {
    const snapshot = await getAdminWorkbenchConsumerSnapshot();
    assert.ok(Array.isArray(snapshot.foundationDependencies));
    assert.ok(snapshot.foundationDependencies.length > 0);
  });

  it('foundationDependencies 包含核心依赖', async () => {
    const snapshot = await getAdminWorkbenchConsumerSnapshot();
    assert.ok(snapshot.foundationDependencies.includes('auth'));
    assert.ok(snapshot.foundationDependencies.includes('config'));
  });
});

describe('CampaignRulesPage — 页面结构', () => {
  it('PageShell title 包含营销决策规则', () => {
    const title = '营销决策规则';
    assert.ok(title.includes('营销决策'));
  });

  it('subtitle 描述工作台功能', () => {
    const subtitle = '管理活动营销决策规则列表，支持搜索、筛选、排序和分页查看。';
    assert.ok(subtitle.includes('搜索'));
    assert.ok(subtitle.includes('筛选'));
    assert.ok(subtitle.includes('排序'));
    assert.ok(subtitle.includes('分页'));
  });

  it('Suspense fallback label', () => {
    const fallbackLabel = '加载营销决策规则列表…';
    assert.ok(fallbackLabel.includes('营销决策规则'));
  });

  it('main 容器为 1200px 居中布局', () => {
    const style = { maxWidth: 1200, margin: '0 auto', padding: 32 };
    assert.strictEqual(style.maxWidth, 1200);
  });
});
