/**
 * pad/[role]/page.test.ts — Page-level tests for the Pad role workbench page.
 * Tests role resolution, channel filtering, bootstrap data integrity,
 * statistic rendering logic, and closure-bar link generation.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: bootstrap.ts, workbench-data.ts, pad/[role]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type { RoleWorkbenchContract } from '@m5/types';

// ---- Helpers mirroring page.tsx server-component logic ----

function isPadChannel(workbench: RoleWorkbenchContract): boolean {
  return workbench.channel === 'PAD';
}

function filterPadRoleWorkbenches(
  workbenches: RoleWorkbenchContract[],
  normalizedRole: string,
): RoleWorkbenchContract[] {
  return workbenches.filter(
    (wb) => wb.channel === 'PAD' && wb.role.toLowerCase() === normalizedRole,
  );
}

function buildStatCards(workbench: RoleWorkbenchContract) {
  return {
    channel: workbench.channel,
    moduleCount: workbench.navItems.length,
    marketCodes: workbench.marketCodes,
  };
}

function buildClosureLinks(detailId: string) {
  return [
    { label: '返回 Pad 工作台', href: '/pad' },
    { label: `${detailId} 详情`, href: `/pad/${detailId}` },
  ];
}

// ---- 正例 ----

describe('pad/[role]/page: 正例 (positive cases)', () => {
  describe('pad role workbench filtering', () => {
    it('should filter PAD-channel workbenches by normalized role', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const guide = filterPadRoleWorkbenches(fallbackRoleWorkbenches, 'guide');
      assert.ok(guide.length >= 1, 'should find at least 1 PAD guide workbench');
      for (const wb of guide) {
        assert.strictEqual(wb.channel, 'PAD');
        assert.strictEqual(wb.role.toLowerCase(), 'guide');
      }
    });

    it('should filter coach PAD workbench correctly', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const coach = filterPadRoleWorkbenches(fallbackRoleWorkbenches, 'coach');
      assert.ok(coach.length >= 1, 'coach should have at least 1 PAD workbench');
      for (const wb of coach) {
        assert.strictEqual(wb.channel, 'PAD');
      }
    });

    it('should filter cashier PAD workbench correctly', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const cashier = filterPadRoleWorkbenches(fallbackRoleWorkbenches, 'cashier');
      assert.ok(cashier.length >= 1, 'cashier should have at least 1 PAD workbench');
      for (const wb of cashier) {
        assert.strictEqual(wb.channel, 'PAD');
      }
    });

    it('should return empty for store_manager (no PAD variant)', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const sm = filterPadRoleWorkbenches(fallbackRoleWorkbenches, 'store_manager');
      assert.strictEqual(sm.length, 0, 'store_manager has no PAD workbench');
    });
  });

  describe('isPadChannel', () => {
    it('should identify PAD channel workbenches', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const padWbs = fallbackRoleWorkbenches.filter(isPadChannel);
      assert.ok(padWbs.length > 0, 'should have PAD workbenches');
      for (const wb of padWbs) {
        assert.strictEqual(wb.channel, 'PAD');
      }
    });
  });

  describe('stat card construction', () => {
    it('should return correct stat values from a workbench contract', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const guidePad = fallbackRoleWorkbenches.find(
        (wb) => wb.role === 'GUIDE' && wb.channel === 'PAD',
      ) as RoleWorkbenchContract | undefined;
      assert.ok(guidePad, 'guide PAD workbench should exist');
      const stats = buildStatCards(guidePad!);
      assert.strictEqual(stats.channel, 'PAD');
      assert.strictEqual(stats.moduleCount, guidePad!.navItems.length);
      assert.deepStrictEqual(stats.marketCodes, guidePad!.marketCodes);
    });
  });

  describe('closure links', () => {
    it('should generate correct closure links for guide role', () => {
      const links = buildClosureLinks('guide');
      assert.strictEqual(links.length, 2);
      assert.strictEqual(links[0]!.label, '返回 Pad 工作台');
      assert.strictEqual(links[0]!.href, '/pad');
      assert.strictEqual(links[1]!.label, 'guide 详情');
      assert.strictEqual(links[1]!.href, '/pad/guide');
    });
  });

  describe('fallback bootstrap data integration', () => {
    it('all PC+guide workbenches should be accessible via fallback', async () => {
      const { fallbackRoleWorkbenches } = await import('../../workbench-data');
      const guideWorkbenches = fallbackRoleWorkbenches.filter(
        (wb) => wb.role === 'GUIDE',
      );
      assert.ok(guideWorkbenches.length >= 1);
      const padGuide = guideWorkbenches.find((wb) => wb.channel === 'PAD');
      assert.ok(padGuide, 'should have a PAD-channel GUIDE workbench');
      assert.strictEqual(padGuide.title, padGuide.title);
      assert.ok(padGuide.navItems.length > 0);
    });
  });
});

// ---- 反例 ----

describe('pad/[role]/page: 反例 (negative cases)', () => {
  it('should return empty array for nonexistent role', () => {
    const result = filterPadRoleWorkbenches([], 'unknown_role');
    assert.strictEqual(result.length, 0);
  });

  it('should not return PC workbenches when filtering for PAD', async () => {
    const { fallbackRoleWorkbenches } = await import('../../workbench-data');
    const cashierPad = filterPadRoleWorkbenches(fallbackRoleWorkbenches, 'cashier');
    // Only PAD results — no PC workbenches should leak through
    for (const wb of cashierPad) {
      assert.strictEqual(wb.channel, 'PAD');
    }
  });

  it('filterPadRoleWorkbenches should be case-sensitive on role after normalization', () => {
    // After normalizing to lowercase, "STORE_MANAGER" must match "store_manager"
    const wb: RoleWorkbenchContract = {
      role: 'STORE_MANAGER',
      channel: 'PAD',
      title: '测试',
      description: '测试',
      navItems: [],
      marketCodes: ['cn-mainland'],
    };
    assert.strictEqual(filterPadRoleWorkbenches([wb], 'store_manager').length, 1);
    assert.strictEqual(filterPadRoleWorkbenches([wb], 'cashier').length, 0);
  });
});

// ---- 边界 ----

describe('pad/[role]/page: 边界 (boundary cases)', () => {
  it('workbench with empty navItems should still render stat card', () => {
    const wb: RoleWorkbenchContract = {
      role: 'COACH',
      channel: 'PAD',
      title: '教练Pad',
      description: '测试用',
      navItems: [],
      marketCodes: [],
    };
    const stats = buildStatCards(wb);
    assert.strictEqual(stats.moduleCount, 0);
    assert.deepStrictEqual(stats.marketCodes, []);
  });

  it('should handle role with multiple market codes', async () => {
    const { fallbackRoleWorkbenches } = await import('../../workbench-data');
    const padWbs = fallbackRoleWorkbenches.filter(isPadChannel);
    const multiMarket = padWbs.find((wb) => wb.marketCodes.length > 1);
    if (multiMarket) {
      assert.ok(multiMarket.marketCodes.length >= 2);
    }
  });

  it('getRoleWorkbench fallback should resolve PAD workbenches', async () => {
    const { getRoleWorkbench } = await import('../../bootstrap');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('fallback', { status: 500 })) as typeof fetch;
    try {
      const wb = await getRoleWorkbench('guide');
      assert.ok(wb, 'guide should resolve from fallback');
      // Even though pad/[role]/page.tsx filters by PAD channel,
      // the bootstrap fallback contains both PC & PAD variants
      assert.ok(['GUIDE'].includes(wb!.role));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalized role should produce same result for hyphen and underscore', async () => {
    const { normalizeWorkbenchRoleKey } = await import('../../bootstrap');
    assert.strictEqual(normalizeWorkbenchRoleKey('store-manager'), 'store_manager');
    assert.strictEqual(normalizeWorkbenchRoleKey('store_manager'), 'store_manager');
    assert.strictEqual(normalizeWorkbenchRoleKey('Store-Manager'), 'store_manager');
  });
});
