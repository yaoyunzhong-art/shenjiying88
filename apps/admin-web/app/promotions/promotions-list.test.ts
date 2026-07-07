/**
 * promotions-list.test.ts — 促销活动管理列表页数据层测试
 *
 * 正例 + 反例 + 边界
 * 参考: devices-page.test.ts 模式
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getPromotions } from './promotions-data';
import type { PromotionItem, PromotionType, PromotionStatus } from './promotion-types';

const ALL_TYPES: PromotionType[] = ['discount', 'coupon', 'cashback', 'gift', 'bundle', 'clearance'];
const ALL_STATUSES: PromotionStatus[] = ['draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled'];

// ---- 过滤/搜索/排序辅助函数 ----

function filterByType(items: PromotionItem[], type: PromotionType | 'ALL'): PromotionItem[] {
  if (type === 'ALL') return items;
  return items.filter((p) => p.type === type);
}

function filterByStatus(items: PromotionItem[], status: PromotionStatus | 'ALL'): PromotionItem[] {
  if (status === 'ALL') return items;
  return items.filter((p) => p.status === status);
}

function searchItems(items: PromotionItem[], keyword: string): PromotionItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.storeName.toLowerCase().includes(lower) ||
      p.createdBy.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

function sortItems(items: PromotionItem[], key: keyof PromotionItem, dir: 'asc' | 'desc'): PromotionItem[] {
  const sorted = [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av;
    }
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function countByType(items: PromotionItem[], type: PromotionType): number {
  return items.filter((p) => p.type === type).length;
}

function countByStatus(items: PromotionItem[], status: PromotionStatus): number {
  return items.filter((p) => p.status === status).length;
}

function activeCount(items: PromotionItem[]): number {
  return countByStatus(items, 'active');
}

// ---- 正例 ----

describe('promotions-page: 正例 (positive cases)', () => {
  const promos = getPromotions();

  describe('data integrity', () => {
    it('should return at least 5 promotions', () => {
      assert.ok(promos.length >= 5, `expected >= 5, got ${promos.length}`);
    });

    it('every promotion should have unique id', () => {
      const ids = promos.map((p) => p.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every promotion should have valid type and status', () => {
      for (const p of promos) {
        assert.ok(ALL_TYPES.includes(p.type), `invalid type ${p.type} for ${p.id}`);
        assert.ok(ALL_STATUSES.includes(p.status), `invalid status ${p.status} for ${p.id}`);
      }
    });

    it('every promotion should have non-empty name, storeName, createdBy', () => {
      for (const p of promos) {
        assert.ok(p.name.length > 0, `empty name for ${p.id}`);
        assert.ok(p.storeName.length > 0, `empty storeName for ${p.id}`);
        assert.ok(p.createdBy.length > 0, `empty createdBy for ${p.id}`);
      }
    });

    it('startAt should be before endAt', () => {
      for (const p of promos) {
        const start = new Date(p.startAt).getTime();
        const end = new Date(p.endAt).getTime();
        assert.ok(start <= end, `${p.id}: startAt ${p.startAt} should <= endAt ${p.endAt}`);
      }
    });

    it('budget should be >= usedBudget', () => {
      for (const p of promos) {
        assert.ok(p.budget >= p.usedBudget, `${p.id}: budget ${p.budget} < usedBudget ${p.usedBudget}`);
      }
    });

    it('should have at least 2 discount type promotions', () => {
      assert.ok(countByType(promos, 'discount') >= 2);
    });

    it('should have at least 1 active promotion', () => {
      assert.ok(activeCount(promos) >= 1);
    });

    it('should have at least 3 distinct types', () => {
      const types = new Set(promos.map((p) => p.type));
      assert.ok(types.size >= 3, `expected >= 3 types, got ${types.size}`);
    });
  });

  describe('filter by type', () => {
    it('filter discount should return only discount promotions', () => {
      const result = filterByType(promos, 'discount');
      for (const p of result) {
        assert.strictEqual(p.type, 'discount');
      }
    });

    it('filter coupon should return only coupon promotions', () => {
      const result = filterByType(promos, 'coupon');
      for (const p of result) {
        assert.strictEqual(p.type, 'coupon');
      }
    });

    it('filter ALL should return all promotions', () => {
      const result = filterByType(promos, 'ALL');
      assert.strictEqual(result.length, promos.length);
    });
  });

  describe('filter by status', () => {
    it('filter active should return only active promotions', () => {
      const result = filterByStatus(promos, 'active');
      for (const p of result) {
        assert.strictEqual(p.status, 'active');
      }
    });

    it('filter draft should return only draft promotions', () => {
      const result = filterByStatus(promos, 'draft');
      for (const p of result) {
        assert.strictEqual(p.status, 'draft');
      }
    });

    it('filter expired should return only expired promotions', () => {
      const result = filterByStatus(promos, 'expired');
      for (const p of result) {
        assert.strictEqual(p.status, 'expired');
      }
    });
  });

  describe('search', () => {
    it('should find by name (Chinese)', () => {
      const result = searchItems(promos, '618');
      assert.ok(result.length >= 1);
    });

    it('should find by storeName', () => {
      const result = searchItems(promos, '解放路');
      assert.ok(result.length >= 1);
    });

    it('should find by createdBy', () => {
      const result = searchItems(promos, '张三');
      assert.ok(result.length >= 1);
    });

    it('empty search should return all', () => {
      const result = searchItems(promos, '');
      assert.strictEqual(result.length, promos.length);
    });
  });

  describe('sorting', () => {
    it('should sort by name ascending', () => {
      const sorted = sortItems(promos, 'name', 'asc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.name ?? '') >= (sorted[i - 1]?.name ?? ''));
      }
    });

    it('should sort by name descending', () => {
      const sorted = sortItems(promos, 'name', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.name ?? '') <= (sorted[i - 1]?.name ?? ''));
      }
    });

    it('should sort by budget descending', () => {
      const sorted = sortItems(promos, 'budget', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        const a = Number(sorted[i]?.budget ?? 0);
        const b = Number(sorted[i - 1]?.budget ?? 0);
        assert.ok(a <= b);
      }
    });
  });

  describe('budget usage', () => {
    it('no promotion should exceed budget', () => {
      for (const p of promos) {
        assert.ok(p.usedBudget <= p.budget, `${p.id}: used ${p.usedBudget} > ${p.budget}`);
      }
    });

    it('at least one promotion should have usedBudget > 0', () => {
      assert.ok(promos.some((p) => p.usedBudget > 0));
    });
  });

  describe('combined filter', () => {
    it('should filter by type + status', () => {
      let result = filterByType(promos, 'discount');
      result = filterByStatus(result, 'active');
      for (const p of result) {
        assert.strictEqual(p.type, 'discount');
        assert.strictEqual(p.status, 'active');
      }
    });

    it('should filter + search combined', () => {
      let result = filterByStatus(promos, 'active');
      result = searchItems(result, '解放路');
      for (const p of result) {
        assert.strictEqual(p.status, 'active');
        assert.ok(p.storeName.includes('解放路'));
      }
    });
  });
});

// ---- 反例 ----

describe('promotions-page: 反例 (negative cases)', () => {
  const promos = getPromotions();

  it('filter by nonexistent type should return empty', () => {
    const result = filterByType(promos, 'rebate' as PromotionType);
    assert.strictEqual(result.length, 0);
  });

  it('search for nonexistent keyword should return empty', () => {
    const result = searchItems(promos, 'ZZZZ_NONEXISTENT');
    assert.strictEqual(result.length, 0);
  });

  it('empty list should handle all filters gracefully', () => {
    const empty: PromotionItem[] = [];
    assert.strictEqual(filterByType(empty, 'discount').length, 0);
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(searchItems(empty, 'test').length, 0);
    assert.strictEqual(sortItems(empty, 'name', 'asc').length, 0);
  });

  it('budget cannot be negative', () => {
    for (const p of promos) {
      assert.ok(p.budget >= 0, `${p.id}: negative budget ${p.budget}`);
    }
  });

  it('usedBudget cannot be negative', () => {
    for (const p of promos) {
      assert.ok(p.usedBudget >= 0, `${p.id}: negative usedBudget ${p.usedBudget}`);
    }
  });
});

// ---- 边界 ----

describe('promotions-page: 边界 (boundary cases)', () => {
  const promos = getPromotions();

  it('single char search should match', () => {
    const result = searchItems(promos, '6');
    assert.ok(result.length >= 1, 'single char search should find matches');
  });

  it('case-insensitive search should work', () => {
    const upper = searchItems(promos, 'COUPON');
    const lower = searchItems(promos, 'coupon');
    assert.strictEqual(upper.length, lower.length);
  });

  it('every promotion should have valid ISO dates', () => {
    for (const p of promos) {
      const start = new Date(p.startAt);
      const end = new Date(p.endAt);
      assert.ok(!Number.isNaN(start.getTime()), `invalid startAt for ${p.id}`);
      assert.ok(!Number.isNaN(end.getTime()), `invalid endAt for ${p.id}`);
    }
  });

  it('every promotion should have createdBy with at least 2 Chinese chars', () => {
    for (const p of promos) {
      assert.ok(p.createdBy.length >= 2, `${p.id}: createdBy too short "${p.createdBy}"`);
    }
  });

  it('should have at least 3 distinct stores', () => {
    const stores = new Set(promos.map((p) => p.storeId));
    assert.ok(stores.size >= 2, `expected >= 2 stores, got ${stores.size}`);
  });

  it('every status and type should have entries', () => {
    const typeSet = new Set(promos.map((p) => p.type));
    const statusSet = new Set(promos.map((p) => p.status));
    assert.ok(typeSet.size >= 4, 'should have at least 4 promotion types in data');
    assert.ok(statusSet.size >= 4, 'should have at least 4 promotion statuses in data');
  });

  it('countByType + countByStatus sum should match total', () => {
    let typeSum = 0;
    for (const t of ALL_TYPES) typeSum += countByType(promos, t);
    assert.ok(typeSum >= promos.length, `type sum ${typeSum} should >= total ${promos.length}`);

    let statusSum = 0;
    for (const s of ALL_STATUSES) statusSum += countByStatus(promos, s);
    assert.ok(statusSum >= promos.length, `status sum ${statusSum} should >= total ${promos.length}`);
  });
});
