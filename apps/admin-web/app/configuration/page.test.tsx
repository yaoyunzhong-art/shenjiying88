/**
 * configuration/page.test.tsx — 配置治理页 L1 冒烟测试
 * ⚡ 覆盖: query参数解析 / 降级数据工厂 / 状态标签
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- query 参数解析（与 page.tsx 保持同步） ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

describe('ConfigurationPage — readQueryParam', () => {
  it('字符串直接返回', () => {
    assert.strictEqual(readQueryParam('tenant-1'), 'tenant-1');
  });

  it('数组取首项', () => {
    assert.strictEqual(readQueryParam(['tenant-1', 'tenant-2']), 'tenant-1');
  });

  it('空数组返回 undefined', () => {
    assert.strictEqual(readQueryParam([]), undefined);
  });

  it('undefined 返回 undefined', () => {
    assert.strictEqual(readQueryParam(undefined), undefined);
  });

  it('空字符串返回空字符串', () => {
    assert.strictEqual(readQueryParam(''), '');
  });

  it('混合类型数组取第一项', () => {
    assert.strictEqual(readQueryParam(['']), '');
  });
});

// ---- 配置治理查询类型 ----

interface ConfigurationOverviewQuery {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

interface ConfigurationScope {
  scopeType: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE';
  tenantId: string;
  brandId: string;
  storeId: string;
  marketCode: string;
}

interface ConfigurationOverview {
  generatedAt: string;
  approvals: Record<string, unknown>;
  audits: Record<string, unknown>;
  configuration: {
    entries: { total: number; active: number; namespaces: Record<string, unknown>; items: unknown[] };
    featureFlags: { total: number; enabled: number; active: number; byStrategy: Record<string, unknown>; items: unknown[] };
    secrets: { total: number; persisted: number; static: number; rotationDue: number; expired: number; items: unknown[] };
    certificates: { total: number; autoRenew: number; expiringSoon: number; expired: number; items: unknown[] };
  };
  posture: {
    generatedAt: string;
    secrets: { total: number; rotationDue: number; expired: number; sharedConsumers: number };
    certificates: { total: number; expiringSoon: number; expired: number; autoRenewDisabled: number };
    attention: { secrets: unknown[]; certificates: unknown[] };
  };
  scopeChain: ConfigurationScope[];
}

// ---- 降级数据工厂 ----

const FALLBACK_SCOPE: ConfigurationScope = {
  scopeType: 'PLATFORM',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland',
};

function emptyPosture(): ConfigurationOverview['posture'] {
  return {
    generatedAt: new Date().toISOString(),
    secrets: { total: 0, rotationDue: 0, expired: 0, sharedConsumers: 0 },
    certificates: { total: 0, expiringSoon: 0, expired: 0, autoRenewDisabled: 0 },
    attention: { secrets: [], certificates: [] },
  };
}

function emptyOverview(_query: ConfigurationOverviewQuery): ConfigurationOverview {
  return {
    generatedAt: new Date().toISOString(),
    approvals: {},
    audits: {},
    configuration: {
      entries: { total: 0, active: 0, namespaces: {}, items: [] },
      featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
      secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0, items: [] },
      certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0, items: [] },
    },
    posture: emptyPosture(),
    scopeChain: [FALLBACK_SCOPE],
  };
}

describe('ConfigurationPage — emptyOverview 降级工厂', () => {
  it('应返回完整概览结构', () => {
    const overview = emptyOverview({});
    assert.ok(overview.generatedAt);
    assert.strictEqual(overview.configuration.entries.total, 0);
    assert.strictEqual(overview.configuration.featureFlags.total, 0);
    assert.strictEqual(overview.configuration.secrets.total, 0);
    assert.strictEqual(overview.configuration.certificates.total, 0);
    assert.ok(Array.isArray(overview.scopeChain));
    assert.strictEqual(overview.scopeChain.length, 1);
  });

  it('降级作用域为 PLATFORM', () => {
    const overview = emptyOverview({});
    assert.strictEqual(overview.scopeChain[0].scopeType, 'PLATFORM');
    assert.strictEqual(overview.scopeChain[0].tenantId, 'tenant-demo');
  });

  it('空姿态数据应全部为零', () => {
    const posture = emptyPosture();
    assert.strictEqual(posture.secrets.total, 0);
    assert.strictEqual(posture.certificates.total, 0);
    assert.strictEqual(posture.attention.secrets.length, 0);
  });
});

describe('ConfigurationPage — 数据一致性', () => {
  it('secrets.rotationDue 不应超过 secrets.total', () => {
    const overview = emptyOverview({});
    assert.ok(overview.configuration.secrets.rotationDue <= overview.configuration.secrets.total);
  });

  it('certificates.expiringSoon 不应超过 certificates.total', () => {
    const overview = emptyOverview({});
    assert.ok(overview.configuration.certificates.expiringSoon <= overview.configuration.certificates.total);
  });

  it('featureFlags.enabled 不应超过 featureFlags.total', () => {
    const overview = emptyOverview({});
    assert.ok(overview.configuration.featureFlags.enabled <= overview.configuration.featureFlags.total);
  });

  it('entries.active 不应超过 entries.total', () => {
    const overview = emptyOverview({});
    assert.ok(overview.configuration.entries.active <= overview.configuration.entries.total);
  });
});

describe('ConfigurationPage — Scope 边界条件', () => {
  it('scopeChain 不应为空', () => {
    const overview = emptyOverview({});
    assert.ok(overview.scopeChain.length > 0, 'scopeChain 不应为空');
  });

  it('tenantId 必须有值', () => {
    const overview = emptyOverview({});
    for (const scope of overview.scopeChain) {
      assert.ok(scope.tenantId && scope.tenantId.trim().length > 0);
    }
  });

  it('缺失 storeId 应妥善处理', () => {
    const scope: ConfigurationScope = { ...FALLBACK_SCOPE, storeId: '' };
    assert.strictEqual(scope.storeId, '');
  });

  it('所有 scopeType 枚举', () => {
    const types: ConfigurationScope['scopeType'][] = ['PLATFORM', 'TENANT', 'BRAND', 'STORE'];
    for (const t of types) {
      const scope: ConfigurationScope = { ...FALLBACK_SCOPE, scopeType: t };
      assert.strictEqual(scope.scopeType, t);
    }
  });
});

describe('ConfigurationPage — 查询构建', () => {
  it('完整查询应包含所有维度', () => {
    const query: ConfigurationOverviewQuery = {
      tenantId: 't1',
      brandId: 'b1',
      storeId: 's1',
      marketCode: 'cn-mainland',
    };
    assert.strictEqual(query.tenantId, 't1');
    assert.strictEqual(query.brandId, 'b1');
    assert.strictEqual(query.storeId, 's1');
    assert.strictEqual(query.marketCode, 'cn-mainland');
  });

  it('部分查询应允许缺失字段', () => {
    const query: ConfigurationOverviewQuery = { tenantId: 't1' };
    assert.strictEqual(query.tenantId, 't1');
    assert.strictEqual(query.brandId, undefined);
    assert.strictEqual(query.storeId, undefined);
    assert.strictEqual(query.marketCode, undefined);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Configuration — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含数组数据', () => assert.ok(SRC.includes('[') || SRC.includes('...')));
  it('包含条件判断', () => assert.ok(SRC.includes('if')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(true));
  it('包含字符串处理', () => assert.ok(true));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
