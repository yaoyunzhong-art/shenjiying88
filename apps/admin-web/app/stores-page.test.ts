/**
 * stores-page.test.ts — Unit tests for stores list page data, filtering, and logic
 *
 * 🐜 自动: [B-页面创建] [stores-page 门店管理列表页测试]
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 内联 mock 数据（与 page.tsx 中的 MOCK_STORES 结构一致） ----

interface StoreItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const STORE_STATUS_ENUM: StoreItem['status'][] = ['active', 'inactive', 'pending', 'suspended'];
const RISK_LEVEL_ENUM: StoreItem['riskLevel'][] = ['low', 'medium', 'high'];

const STORE_STATUS_MAP: Record<StoreItem['status'], { label: string; variant: string }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const RISK_LEVEL_MAP: Record<StoreItem['riskLevel'], { label: string; variant: string }> = {
  low: { label: '低', variant: 'success' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
};

const MOCK_STORES: StoreItem[] = [
  { id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low' },
  { id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland', status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium' },
  { id: 's3', code: 'STORE-003', name: '深圳万象天地店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-11 09:00', riskLevel: 'low' },
  { id: 's4', code: 'STORE-004', name: '成都太古里体验店', marketCode: 'cn-mainland', status: 'active', tenantCount: 6, brandCount: 4, lastDeployed: '2026-06-12 16:45', riskLevel: 'low' },
  { id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high' },
  { id: 's6', code: 'STORE-006', name: 'San Francisco Union Square', marketCode: 'us-default', status: 'active', tenantCount: 5, brandCount: 3, lastDeployed: '2026-06-12 08:30', riskLevel: 'medium' },
  { id: 's7', code: 'STORE-007', name: 'New York Fifth Avenue', marketCode: 'us-default', status: 'active', tenantCount: 8, brandCount: 5, lastDeployed: '2026-06-12 12:00', riskLevel: 'low' },
  { id: 's8', code: 'STORE-008', name: 'London Oxford Street', marketCode: 'uk-default', status: 'pending', tenantCount: 2, brandCount: 2, lastDeployed: '2026-06-11 15:20', riskLevel: 'low' },
  { id: 's9', code: 'STORE-009', name: '广州天河城店', marketCode: 'cn-mainland', status: 'inactive', tenantCount: 3, brandCount: 1, lastDeployed: '2026-06-09 18:00', riskLevel: 'medium' },
  { id: 's10', code: 'STORE-010', name: '南京德基广场店', marketCode: 'cn-mainland', status: 'active', tenantCount: 7, brandCount: 5, lastDeployed: '2026-06-12 13:45', riskLevel: 'low' },
  { id: 's11', code: 'STORE-011', name: '武汉天地旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-12 09:30', riskLevel: 'medium' },
  { id: 's12', code: 'STORE-012', name: '重庆来福士店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 1, brandCount: 1, lastDeployed: '2026-06-11 14:00', riskLevel: 'low' },
  { id: 's13', code: 'STORE-013', name: 'Seattle Downtown', marketCode: 'us-default', status: 'active', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-12 07:00', riskLevel: 'low' },
  { id: 's14', code: 'STORE-014', name: '苏州中心旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 5, brandCount: 4, lastDeployed: '2026-06-12 11:30', riskLevel: 'low' },
  { id: 's15', code: 'STORE-015', name: '西安大唐不夜城店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 2, brandCount: 1, lastDeployed: '2026-06-08 10:00', riskLevel: 'high' },
];

// ---- 测试套件 ----

describe('stores data integrity', () => {
  describe('MOCK_STORES', () => {
    it('should contain at least 10 stores', () => {
      assert.ok(MOCK_STORES.length >= 10, `expected >= 10, got ${MOCK_STORES.length}`);
    });

    it('every store should have a unique id', () => {
      const ids = MOCK_STORES.map((s) => s.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every store should have a unique code', () => {
      const codes = MOCK_STORES.map((s) => s.code);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every store should have a valid status', () => {
      for (const s of MOCK_STORES) {
        assert.ok(
          STORE_STATUS_ENUM.includes(s.status),
          `invalid status ${s.status} for ${s.id}`
        );
      }
    });

    it('every store should have a valid riskLevel', () => {
      for (const s of MOCK_STORES) {
        assert.ok(
          RISK_LEVEL_ENUM.includes(s.riskLevel),
          `invalid riskLevel ${s.riskLevel} for ${s.id}`
        );
      }
    });

    it('tenantCount should be non-negative', () => {
      for (const s of MOCK_STORES) {
        assert.ok(s.tenantCount >= 0, `negative tenantCount for ${s.id}`);
      }
    });

    it('brandCount should be non-negative', () => {
      for (const s of MOCK_STORES) {
        assert.ok(s.brandCount >= 0, `negative brandCount for ${s.id}`);
      }
    });

    it('brandCount should not exceed tenantCount', () => {
      for (const s of MOCK_STORES) {
        assert.ok(
          s.brandCount <= s.tenantCount,
          `brandCount ${s.brandCount} > tenantCount ${s.tenantCount} for ${s.id}`
        );
      }
    });

    it('should have stores in multiple markets', () => {
      const markets = new Set(MOCK_STORES.map((s) => s.marketCode));
      assert.ok(markets.size >= 2, `expected >= 2 markets, got ${markets.size}`);
    });

    it('should have at least one store in each status', () => {
      for (const status of STORE_STATUS_ENUM) {
        const count = MOCK_STORES.filter((s) => s.status === status).length;
        assert.ok(count > 0, `no stores with status ${status}`);
      }
    });

    it('should have at least one store per risk level', () => {
      for (const level of RISK_LEVEL_ENUM) {
        const count = MOCK_STORES.filter((s) => s.riskLevel === level).length;
        assert.ok(count > 0, `no stores with riskLevel ${level}`);
      }
    });

    it('lastDeployed should be a non-empty string', () => {
      for (const s of MOCK_STORES) {
        assert.ok(
          typeof s.lastDeployed === 'string' && s.lastDeployed.length > 0,
          `missing lastDeployed for ${s.id}`
        );
      }
    });
  });

  describe('STORE_STATUS_MAP', () => {
    it('should have entries for all statuses', () => {
      for (const s of STORE_STATUS_ENUM) {
        assert.ok(STORE_STATUS_MAP[s], `missing status ${s}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const s of STORE_STATUS_ENUM) {
        const entry = STORE_STATUS_MAP[s];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(['success', 'warning', 'danger', 'neutral'].includes(entry.variant));
      }
    });
  });

  describe('RISK_LEVEL_MAP', () => {
    it('should have entries for all risk levels', () => {
      for (const r of RISK_LEVEL_ENUM) {
        assert.ok(RISK_LEVEL_MAP[r], `missing risk level ${r}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const r of RISK_LEVEL_ENUM) {
        const entry = RISK_LEVEL_MAP[r];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(['success', 'warning', 'danger', 'neutral'].includes(entry.variant));
      }
    });
  });
});

describe('stores filtering logic', () => {
  describe('status filter', () => {
    it('should filter by active status', () => {
      const result = MOCK_STORES.filter((s) => s.status === 'active');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.status, 'active');
      }
    });

    it('should filter by pending status', () => {
      const result = MOCK_STORES.filter((s) => s.status === 'pending');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.status, 'pending');
      }
    });

    it('should filter by inactive status', () => {
      const result = MOCK_STORES.filter((s) => s.status === 'inactive');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.status, 'inactive');
      }
    });

    it('should filter by suspended status', () => {
      const result = MOCK_STORES.filter((s) => s.status === 'suspended');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.status, 'suspended');
      }
    });
  });

  describe('risk level filter', () => {
    it('should filter by low risk', () => {
      const result = MOCK_STORES.filter((s) => s.riskLevel === 'low');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.riskLevel, 'low');
      }
    });

    it('should filter by medium risk', () => {
      const result = MOCK_STORES.filter((s) => s.riskLevel === 'medium');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.riskLevel, 'medium');
      }
    });

    it('should filter by high risk', () => {
      const result = MOCK_STORES.filter((s) => s.riskLevel === 'high');
      assert.ok(result.length > 0);
      for (const s of result) {
        assert.strictEqual(s.riskLevel, 'high');
      }
    });
  });

  describe('market filter', () => {
    it('should filter by cn-mainland', () => {
      const result = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland');
      assert.ok(result.length >= 8);
      for (const s of result) {
        assert.strictEqual(s.marketCode, 'cn-mainland');
      }
    });

    it('should filter by us-default', () => {
      const result = MOCK_STORES.filter((s) => s.marketCode === 'us-default');
      assert.ok(result.length >= 2);
      for (const s of result) {
        assert.strictEqual(s.marketCode, 'us-default');
      }
    });

    it('should filter by uk-default', () => {
      const result = MOCK_STORES.filter((s) => s.marketCode === 'uk-default');
      assert.ok(result.length >= 1);
      for (const s of result) {
        assert.strictEqual(s.marketCode, 'uk-default');
      }
    });
  });

  describe('search filter', () => {
    const searchFields: (keyof StoreItem)[] = ['code', 'name', 'marketCode'];

    function searchBy(items: StoreItem[], term: string): StoreItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) =>
          String(item[key]).toLowerCase().includes(lower)
        )
      );
    }

    it('should match by store code', () => {
      const result = searchBy(MOCK_STORES, 'STORE-001');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 's1');
    });

    it('should match by store name (case-insensitive)', () => {
      const result = searchBy(MOCK_STORES, '朝阳');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 's1');
    });

    it('should match by market code', () => {
      const result = searchBy(MOCK_STORES, 'us-default');
      assert.ok(result.length >= 2);
    });

    it('should return empty for non-matching search', () => {
      const result = searchBy(MOCK_STORES, 'xyz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('empty search should return all items', () => {
      const result = searchBy(MOCK_STORES, '');
      assert.strictEqual(result.length, MOCK_STORES.length);
    });

    it('partial match should work', () => {
      const result = searchBy(MOCK_STORES, 'STORE-01');
      assert.ok(result.length >= 3);
    });

    it('international name search should work', () => {
      const result = searchBy(MOCK_STORES, 'san francisco');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 's6');
    });
  });
});

describe('stores composite filtering', () => {
  describe('status + risk level', () => {
    it('active + low risk stores should exist', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'active' && s.riskLevel === 'low'
      );
      assert.ok(result.length >= 3);
      for (const s of result) {
        assert.strictEqual(s.status, 'active');
        assert.strictEqual(s.riskLevel, 'low');
      }
    });

    it('active + high risk should be empty (no contradictory state)', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'active' && s.riskLevel === 'high'
      );
      assert.strictEqual(result.length, 0);
    });

    it('suspended + high risk stores should exist', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'suspended' && s.riskLevel === 'high'
      );
      assert.ok(result.length >= 1);
    });
  });

  describe('status + market', () => {
    it('active cn-mainland stores should exist', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'active' && s.marketCode === 'cn-mainland'
      );
      assert.ok(result.length >= 4);
    });

    it('pending uk-default stores should exist', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'pending' && s.marketCode === 'uk-default'
      );
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 's8');
    });
  });

  describe('triple filter: status + risk + market', () => {
    it('active + low + cn-mainland should have stores', () => {
      const result = MOCK_STORES.filter(
        (s) => s.status === 'active' && s.riskLevel === 'low' && s.marketCode === 'cn-mainland'
      );
      assert.ok(result.length >= 2);
    });
  });
});

describe('stores pagination logic', () => {
  it('should paginate items correctly with pageSize=5', () => {
    const pageSize = 5;
    const page = 0;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = MOCK_STORES.slice(start, end);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, MOCK_STORES[0]?.id);
  });

  it('second page should have correct items', () => {
    const pageSize = 5;
    const page = 1;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = MOCK_STORES.slice(start, end);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, 's6');
  });

  it('last page should handle fewer items', () => {
    const pageSize = 10;
    const totalPages = Math.ceil(MOCK_STORES.length / pageSize);
    const lastPage = totalPages - 1;
    const start = lastPage * pageSize;
    const pageItems = MOCK_STORES.slice(start);
    assert.ok(pageItems.length <= pageSize);
    assert.ok(pageItems.length > 0);
  });

  it('out-of-bounds page should return empty', () => {
    const pageSize = 10;
    const page = 10;
    const start = page * pageSize;
    const pageItems = MOCK_STORES.slice(start);
    assert.strictEqual(pageItems.length, 0);
  });
});

describe('stores sorting logic', () => {
  it('should sort by tenantCount ascending', () => {
    const sorted = [...MOCK_STORES].sort((a, b) => a.tenantCount - b.tenantCount);
    assert.ok((sorted[0]?.tenantCount ?? 0) <= (sorted[sorted.length - 1]?.tenantCount ?? 0));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || (sorted[i]?.tenantCount ?? 0) >= (sorted[i - 1]?.tenantCount ?? 0)
      )
    );
  });

  it('should sort by brandCount descending', () => {
    const sorted = [...MOCK_STORES].sort((a, b) => b.brandCount - a.brandCount);
    assert.ok((sorted[0]?.brandCount ?? 0) >= (sorted[sorted.length - 1]?.brandCount ?? 0));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || (sorted[i]?.brandCount ?? 0) <= (sorted[i - 1]?.brandCount ?? 0)
      )
    );
  });

  it('should sort by status order: active > suspended > pending > inactive', () => {
    const statusOrder: Record<StoreItem['status'], number> = { active: 0, suspended: 1, pending: 2, inactive: 3 };
    const sorted = [...MOCK_STORES].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
    assert.ok(
      sorted.every(
        (_, i) =>
          i === 0 || statusOrder[sorted[i]?.status ?? 'inactive'] >= statusOrder[sorted[i - 1]?.status ?? 'inactive']
      )
    );
  });
});

describe('stores stats computation', () => {
  it('should compute correct totals', () => {
    const total = MOCK_STORES.length;
    const active = MOCK_STORES.filter((s) => s.status === 'active').length;
    const highRisk = MOCK_STORES.filter((s) => s.riskLevel === 'high').length;

    assert.strictEqual(total, 15);
    assert.ok(active >= 7);
    assert.strictEqual(highRisk, 2);
  });

  it('should compute correct market distribution', () => {
    const cnMainlandCount = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland').length;
    const usCount = MOCK_STORES.filter((s) => s.marketCode === 'us-default').length;
    const ukCount = MOCK_STORES.filter((s) => s.marketCode === 'uk-default').length;

    assert.strictEqual(cnMainlandCount + usCount + ukCount, MOCK_STORES.length);
    assert.ok(cnMainlandCount > usCount);
    assert.ok(usCount > ukCount);
  });

  it('healthy rate should be correct', () => {
    const active = MOCK_STORES.filter((s) => s.status === 'active').length;
    const healthyRate = Math.round((active / MOCK_STORES.length) * 100);
    assert.ok(healthyRate >= 40);
    assert.ok(healthyRate <= 100);
  });
});

describe('stores edge cases', () => {
  it('empty filter should return empty array', () => {
    const result = MOCK_STORES.filter(() => false);
    assert.strictEqual(result.length, 0);
  });

  it('ALL market filter (no-op) should return all stores', () => {
    const result = MOCK_STORES.filter(() => true);
    assert.strictEqual(result.length, MOCK_STORES.length);
  });

  it('store name should not be empty', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.name.trim().length > 0, `empty name for ${s.id}`);
    }
  });

  it('store code should have STORE- prefix', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.code.startsWith('STORE-'), `unexpected code format: ${s.code}`);
    }
  });

  it('riskLevel should be consistent with status for suspended stores', () => {
    const suspended = MOCK_STORES.filter((s) => s.status === 'suspended');
    for (const s of suspended) {
      // Suspended stores should not be low risk
      assert.ok(s.riskLevel !== 'low', `suspended store ${s.id} has low risk, expected medium or high`);
    }
  });
});
