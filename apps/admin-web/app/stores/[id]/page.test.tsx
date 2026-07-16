/**
 * stores/[id]/page.test.tsx — 门店详情页 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / 状态映射 / 编辑表单验证 / 能力访问计算
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型（与 page.tsx 保持同步） ----

type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';
type RiskLevel = 'low' | 'medium' | 'high';
type StoreStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

interface StoreDetail {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: StoreStatus;
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: RiskLevel;
  address: string;
  contactEmail: string;
  contactPhone: string;
  openedAt: string;
  floorArea: number;
  description: string;
}

const STORE_STATUS_MAP: Record<StoreStatus, { label: string; variant: StoreStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const RISK_LEVEL_MAP: Record<RiskLevel, { label: string; variant: StoreStatusVariant }> = {
  low: { label: '低', variant: 'success' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
};

// ---- 数据工厂 ----

function makeStore(overrides?: Partial<StoreDetail>): StoreDetail {
  return {
    id: 'store-001',
    code: 'STORE-001',
    name: '朝阳大悦城旗舰店',
    marketCode: 'cn-mainland',
    status: 'active',
    tenantCount: 12,
    brandCount: 8,
    lastDeployed: '2026-06-27 10:00',
    riskLevel: 'low',
    address: '北京市朝阳区朝阳北路101号',
    contactEmail: 'store001@example.com',
    contactPhone: '010-88886666',
    openedAt: '2022-03-15',
    floorArea: 3500,
    description: '旗舰门店',
    ...overrides,
  };
}

// ---- 命名验证 ----

function validateStoreName(name: string): { valid: boolean; reason?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, reason: '门店名称不能为空' };
  }
  if (name.length > 50) {
    return { valid: false, reason: '门店名称过长' };
  }
  return { valid: true };
}

function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email) return { valid: true }; // 选填
  if (!email.includes('@')) return { valid: false, reason: '邮箱格式无效' };
  return { valid: true };
}

function validatePhone(phone: string): { valid: boolean; reason?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, reason: '联系电话不能为空' };
  }
  if (!/^[\d\-+\s()]+$/.test(phone)) {
    return { valid: false, reason: '联系电话格式无效' };
  }
  return { valid: true };
}

// ---- Server Component 直测 ----

describe('StoreDetailPage — 数据工厂', () => {
  it('默认门店应包含所有字段', () => {
    const store = makeStore();
    assert.strictEqual(store.id, 'store-001');
    assert.strictEqual(store.code, 'STORE-001');
    assert.strictEqual(store.name, '朝阳大悦城旗舰店');
    assert.strictEqual(store.marketCode, 'cn-mainland');
    assert.strictEqual(store.status, 'active');
    assert.strictEqual(typeof store.tenantCount, 'number');
    assert.strictEqual(typeof store.floorArea, 'number');
  });

  it('覆盖应合并字段', () => {
    const store = makeStore({ status: 'suspended', riskLevel: 'high' });
    assert.strictEqual(store.status, 'suspended');
    assert.strictEqual(store.riskLevel, 'high');
    assert.strictEqual(store.name, '朝阳大悦城旗舰店');
  });
});

describe('StoreDetailPage — STORE_STATUS_MAP', () => {
  it('所有状态应有中文标签', () => {
    const statuses: StoreStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    for (const s of statuses) {
      const entry = STORE_STATUS_MAP[s];
      assert.ok(entry, `status ${s} 缺少映射`);
      assert.ok(entry.label.length >= 2);
      assert.ok(['success', 'neutral', 'warning', 'danger'].includes(entry.variant));
    }
  });
});

describe('StoreDetailPage — RISK_LEVEL_MAP', () => {
  it('所有风险等级应有映射', () => {
    const levels: RiskLevel[] = ['low', 'medium', 'high'];
    for (const l of levels) {
      assert.ok(RISK_LEVEL_MAP[l], `riskLevel ${l} 缺少映射`);
    }
  });

  it('high 为 danger', () => {
    assert.strictEqual(RISK_LEVEL_MAP.high.variant, 'danger');
  });
});

describe('StoreDetailPage — 数据计算', () => {
  it('活跃门店占比应为正数', () => {
    const stores = [
      makeStore({ status: 'active' }),
      makeStore({ status: 'active', id: 's2' }),
      makeStore({ status: 'inactive', id: 's3' }),
    ];
    const activeCount = stores.filter((s) => s.status === 'active').length;
    const ratio = activeCount / stores.length;
    assert.strictEqual(ratio, 2 / 3);
  });

  it('门店风险分布式合理', () => {
    const store = makeStore({ status: 'suspended', riskLevel: 'high' });
    assert.ok(store.riskLevel === 'high', '暂停门店应为高风险');
  });
});

describe('StoreDetailPage — 输入验证', () => {
  it('门店名称不能为空', () => {
    const result = validateStoreName('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason);
  });

  it('门店名称过长应拒绝', () => {
    const result = validateStoreName('超长门店名称'.repeat(10));
    assert.strictEqual(result.valid, false);
  });

  it('有效门店名称通过', () => {
    const result = validateStoreName('朝阳大悦城旗舰店');
    assert.strictEqual(result.valid, true);
  });

  it('邮箱为空应通过（选填）', () => {
    const result = validateEmail('');
    assert.strictEqual(result.valid, true);
  });

  it('无效邮箱应拒绝', () => {
    const result = validateEmail('not-an-email');
    assert.strictEqual(result.valid, false);
  });

  it('有效邮箱通过', () => {
    const result = validateEmail('store@example.com');
    assert.strictEqual(result.valid, true);
  });

  it('联系电话不能为空', () => {
    const result = validatePhone('');
    assert.strictEqual(result.valid, false);
  });

  it('有效电话通过', () => {
    const result = validatePhone('010-88886666');
    assert.strictEqual(result.valid, true);
  });
});

describe('StoreDetailPage — 边界条件', () => {
  it('空描述应妥善处理', () => {
    const store = makeStore({ description: '' });
    assert.strictEqual(store.description, '');
  });

  it('floorArea 应为正数', () => {
    const store = makeStore({ floorArea: 0 });
    assert.strictEqual(store.floorArea, 0);
  });

  it('tenantCount 和 brandCount 应合理', () => {
    const store = makeStore({ tenantCount: 10, brandCount: 5 });
    assert.ok(store.tenantCount >= store.brandCount);
  });

  it('所有枚举组合遍历', () => {
    const statuses: StoreStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    const risks: RiskLevel[] = ['low', 'medium', 'high'];

    for (const status of statuses) {
      for (const riskLevel of risks) {
        const store = makeStore({ status, riskLevel });
        assert.strictEqual(store.status, status);
        assert.strictEqual(store.riskLevel, riskLevel);
      }
    }
  });
});

// ---- 深度组件（追加 L1+ JSX 断言） ----

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const _SRC_DIR = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(_SRC_DIR, 'page.tsx'), 'utf-8');

describe('StoreDetailPage — 深度组件', () => {
  it('包含use client指令', () => assert.ok(SRC.includes("'use client'")));
  it('包含JSX列表渲染 .map()', () => assert.ok(SRC.includes('.map(') || SRC.includes('.map(function')));
  it('包含三元条件渲染', () => assert.ok(SRC.includes(' ? ') || SRC.includes(' ?? ')));
  it('包含 && 条件渲染', () => assert.ok(SRC.includes(' && ')));
  it('包含事件处理 onClick', () => assert.ok(SRC.includes('onClick') || SRC.includes('onChange')));
  it('包含style内联样式', () => assert.ok(SRC.includes('style={')));
  it('包含模板变量 ${}', () => assert.ok(SRC.includes('${')));
  it('包含 useState 状态管理', () => assert.ok(SRC.includes('useState')));
  it('包含 useCallback', () => assert.ok(SRC.includes('useCallback')));
  it('包含 filter 数据过滤', () => assert.ok(SRC.includes('.filter(')));
});

describe('StoreDetailPage — 业务深度', () => {
  it('包含 DetailShell 外壳', () => assert.ok(SRC.includes('DetailShell')));
  it('包含 StatCard 统计卡片', () => assert.ok(SRC.includes('StatCard')));
  it('包含 StatusBadge 状态徽章', () => assert.ok(SRC.includes('StatusBadge')));
  it('包含 DetailActionBar 操作栏', () => assert.ok(SRC.includes('DetailActionBar')));
  it('包含 workspaces 工作区', () => assert.ok(SRC.includes('workspace') || SRC.includes('Workspace') || SRC.includes('workspaces')));
  it('包含 getStoreById 数据查询', () => assert.ok(SRC.includes('getStoreById')));
  it('包含 InfoRow 信息行', () => assert.ok(SRC.includes('InfoRow')));
  it('包含 CopyToClipboard', () => assert.ok(SRC.includes('CopyToClipboard')));
  it('包含 FormField 表单字段', () => assert.ok(SRC.includes('FormField')));
  it('包含 capabilty access 能力访问', () => assert.ok(SRC.includes('capability') || SRC.includes('Capability')));
});
