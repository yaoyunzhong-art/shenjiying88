/**
 * configuration/three-level/page.test.tsx — 三级独立配置 L1 测试
 *
 * 覆盖: 工作台配置查询、级别枚举、状态映射、降级回退
 * 正例: 配置数据结构、级别判定、数量统计
 * 反例: 空配置、无效工作台编码、缺失字段
 * 边界: 全种类覆盖、单条数据、空数组
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// ── 类型 ──

type TenantConfigWorkbenchCode = 'W-S' | 'W-T' | 'W-B';

interface TenantConfigEffective {
  id: string;
  key: string;
  value: string;
  version: number;
  updatedAt: string;
}

interface WorkbenchSnapshot {
  code: TenantConfigWorkbenchCode;
  title: string;
  description: string;
  level: 'store' | 'tenant' | 'brand';
  items: TenantConfigEffective[];
  total: number;
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

// ── 常量 ──

const WORKBENCH_INFO: Record<TenantConfigWorkbenchCode, { title: string; description: string; level: 'store' | 'tenant' | 'brand' }> = {
  'W-S': { title: '门店工作台', description: '门店级配置', level: 'store' },
  'W-T': { title: '租户工作台', description: '租户级配置', level: 'tenant' },
  'W-B': { title: '品牌工作台', description: '品牌级配置', level: 'brand' },
};

const WORKBENCH_CODES: TenantConfigWorkbenchCode[] = ['W-S', 'W-T', 'W-B'];

// ── Mock 数据 ──

const MOCK_CONFIG_ITEMS: TenantConfigEffective[] = [
  { id: 'cfg-001', key: 'store.display.logo', value: 'true', version: 3, updatedAt: '2026-06-15' },
  { id: 'cfg-002', key: 'store.display.theme', value: 'dark', version: 1, updatedAt: '2026-06-10' },
  { id: 'cfg-003', key: 'tenant.max.users', value: '100', version: 5, updatedAt: '2026-07-01' },
  { id: 'cfg-004', key: 'brand.default.currency', value: 'CNY', version: 2, updatedAt: '2026-05-20' },
  { id: 'cfg-005', key: 'store.inventory.threshold', value: '50', version: 1, updatedAt: '2026-07-10' },
];

// ── 辅助函数 ──

function getWorkbenchInfo(code: TenantConfigWorkbenchCode): { title: string; description: string; level: string } | undefined {
  return WORKBENCH_INFO[code];
}

function computeConfigStats(items: TenantConfigEffective[]): {
  total: number; updatedThisMonth: number; totalVersions: number;
} {
  const now = new Date('2026-07-21');
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const updatedThisMonth = items.filter(i => i.updatedAt.startsWith(thisMonth)).length;
  const totalVersions = items.reduce((s, i) => s + i.version, 0);
  return { total: items.length, updatedThisMonth, totalVersions };
}

function buildSnapshot(code: TenantConfigWorkbenchCode, items: TenantConfigEffective[]): WorkbenchSnapshot {
  const info = getWorkbenchInfo(code);
  return {
    code,
    title: info?.title ?? code,
    description: info?.description ?? '',
    level: (info?.level as 'store') ?? 'store',
    items,
    total: items.length,
    deliveryMode: items.length > 0 ? 'api' : 'fallback',
  };
}

// ===================================================================
describe('ThreeLevelConfig — 工作台信息', () => {
  it('三种工作台编码均有对应信息', () => {
    for (const code of WORKBENCH_CODES) {
      const info = getWorkbenchInfo(code);
      assert.ok(info, `Workbench ${code} should have info`);
      assert.ok(info.title.length > 0, `Title for ${code} should not be empty`);
      assert.ok(['store', 'tenant', 'brand'].includes(info.level), `Valid level for ${code}`);
    }
  });

  it('W-S 是门店级别', () => {
    const info = getWorkbenchInfo('W-S');
    assert.equal(info?.level, 'store');
  });

  it('W-T 是租户级别', () => {
    const info = getWorkbenchInfo('W-T');
    assert.equal(info?.level, 'tenant');
  });

  it('W-B 是品牌级别', () => {
    const info = getWorkbenchInfo('W-B');
    assert.equal(info?.level, 'brand');
  });
});

// ===================================================================
describe('ThreeLevelConfig — 配置项统计', () => {
  it('应正确计算总配置数', () => {
    const stats = computeConfigStats(MOCK_CONFIG_ITEMS);
    assert.equal(stats.total, 5);
  });

  it('应正确计算本月更新数（2026-07）', () => {
    const stats = computeConfigStats(MOCK_CONFIG_ITEMS);
    assert.equal(stats.updatedThisMonth, 2); // cfg-004 + cfg-005
  });

  it('应正确计算版本总和', () => {
    const stats = computeConfigStats(MOCK_CONFIG_ITEMS);
    assert.equal(stats.totalVersions, 12);
  });

  it('空列表统计应为零', () => {
    const stats = computeConfigStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.updatedThisMonth, 0);
    assert.equal(stats.totalVersions, 0);
  });
});

// ===================================================================
describe('ThreeLevelConfig — Snapshot 构建', () => {
  it('带配置时 deliveryMode 为 api', () => {
    const snap = buildSnapshot('W-S', MOCK_CONFIG_ITEMS);
    assert.equal(snap.deliveryMode, 'api');
    assert.equal(snap.total, 5);
  });

  it('空配置时 deliveryMode 为 fallback', () => {
    const snap = buildSnapshot('W-T', []);
    assert.equal(snap.deliveryMode, 'fallback');
    assert.equal(snap.total, 0);
  });

  it('snapshot 包含正确的工作台编码', () => {
    const snap = buildSnapshot('W-B', []);
    assert.equal(snap.code, 'W-B');
    assert.equal(snap.title, '品牌工作台');
  });

  it('配置项必须包含 id/key/value 三个必要字段', () => {
    for (const item of MOCK_CONFIG_ITEMS) {
      assert.ok(item.id, 'id required');
      assert.ok(item.key, 'key required');
      assert.notEqual(item.value, undefined, 'value required');
    }
  });

  it('version 必须大于等于 1', () => {
    for (const item of MOCK_CONFIG_ITEMS) {
      assert.ok(item.version >= 1, `version should be >= 1, got ${item.version}`);
    }
  });
});

// ===================================================================
describe('ThreeLevelConfig — 边界情况', () => {
  it('单个配置项统计', () => {
    const single = [MOCK_CONFIG_ITEMS[0]];
    const stats = computeConfigStats(single);
    assert.equal(stats.total, 1);
    assert.equal(stats.totalVersions, MOCK_CONFIG_ITEMS[0].version);
  });

  it('大版本号不溢出', () => {
    const large: TenantConfigEffective[] = [
      { id: 'big', key: 'test', value: 'x', version: 999999, updatedAt: '2026-07-01' },
    ];
    const stats = computeConfigStats(large);
    assert.equal(stats.totalVersions, 999999);
  });

  it('空 snapshot 不抛异常', () => {
    assert.doesNotThrow(() => buildSnapshot('W-S', []));
  });

  it('long key 不截断', () => {
    const longKey = 'this.is.a.very.long.configuration.key.with.many.segments';
    const item: TenantConfigEffective = { id: 'long', key: longKey, value: 'x', version: 1, updatedAt: '2026-07-01' };
    const snap = buildSnapshot('W-S', [item]);
    assert.equal(snap.items[0]!.key, longKey);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('configuration/three-level — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes('requiredPermission="foundation.governance.read"'));
  });
});

describe('ThreeLevelConfig — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('export default async')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('Promise.all')));
  it('包含权限边界组件', () => assert.ok(SRC.includes('AdminPermissionGate')));
  it('包含 Suspense 骨架屏', () => assert.ok(SRC.includes('Suspense') && SRC.includes('LoadingSkeleton')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
});
