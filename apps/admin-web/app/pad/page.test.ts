/**
 * pad/page.test.ts — Page-level tests for the Pad workbench pages.
 * Tests:
 *   - pad/page.tsx (index) : filterPadWorkbenches (no-arg), getUniqueMarketCodes, index page helpers
 *   - pad/[role]/page.tsx (detail) : role normalization, workbench filtering, bootstrap data integrity
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: bootstrap.ts, pad/page.tsx, pad/[role]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type { RoleWorkbenchContract } from '@m5/types';

// ---- Helpers matching page.tsx logic (shared between index and detail) ----

function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_');
}

/** pad/page.tsx: index — no-arg filter, returns all PAD workbenches */
function filterPadWorkbenches(workbenches: RoleWorkbenchContract[]): RoleWorkbenchContract[] {
  return workbenches.filter((wb) => wb.channel === 'PAD');
}

/** pad/[role]/page.tsx: detail — filter by role */
function filterPadWorkbenchesByRole(
  workbenches: RoleWorkbenchContract[],
  role: string,
): RoleWorkbenchContract[] {
  const normalizedRole = normalizeWorkbenchRoleKey(role);
  return workbenches.filter(
    (wb) => wb.channel === 'PAD' && normalizeWorkbenchRoleKey(wb.role) === normalizedRole,
  );
}

// Computes unique market codes from workbenches
function getUniqueMarketCodes(workbenches: RoleWorkbenchContract[]): string[] {
  return Array.from(
    new Set(workbenches.flatMap((wb) => wb.marketCodes ?? [])),
  );
}

// ---- pad/page.tsx index page helper (ROLE_EMOJI / ROLE_LABEL_MAP) ----

const ROLE_EMOJI: Record<string, string> = {
  GUIDE: '🎙️',
  CASHIER: '🧾',
  FRONT_DESK: '🏪',
  STORE_MANAGER: '👔',
  INVENTORY_KEEPER: '📦',
  TRAINING_MANAGER: '📋',
  COACH: '🏋️',
  CUSTOMER_SERVICE: '📞',
  ASSISTANT_MANAGER: '👤',
  ENTERTAINMENT_GUIDE: '🎮',
  DELIVERY_PERSON: '🚚',
  SALES_CLERK: '🛍️',
  CONCIERGE: '🔔',
};

const ROLE_LABEL_MAP: Record<string, string> = {
  GUIDE: '导购接待',
  CASHIER: '收银工作台',
  FRONT_DESK: '前台接待',
  STORE_MANAGER: '店长工作台',
  INVENTORY_KEEPER: '库存管理',
  TRAINING_MANAGER: '培训管理',
  COACH: '教练工作台',
  CUSTOMER_SERVICE: '客服工作台',
  ASSISTANT_MANAGER: '经理助理',
  ENTERTAINMENT_GUIDE: '娱乐导览',
  DELIVERY_PERSON: '配送管理',
  SALES_CLERK: '销售工具',
  CONCIERGE: '礼宾服务',
};

function getRoleLabel(role: string): string {
  return ROLE_LABEL_MAP[role] ?? role;
}

function getRoleEmoji(role: string): string {
  return ROLE_EMOJI[role] ?? '📱';
}

// ====================================================================
// pad/page.tsx (Index) — no-arg filterPadWorkbenches, getUniqueMarketCodes, helpers
// ====================================================================

describe('pad-index-page: 正例 (positive cases)', () => {
  describe('getRoleEmoji', () => {
    it('should return correct emoji for known roles', () => {
      assert.strictEqual(getRoleEmoji('GUIDE'), '🎙️');
      assert.strictEqual(getRoleEmoji('CASHIER'), '🧾');
      assert.strictEqual(getRoleEmoji('STORE_MANAGER'), '👔');
    });

    it('should return fallback emoji for unknown roles', () => {
      assert.strictEqual(getRoleEmoji('ROBOT'), '📱');
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct label for known roles', () => {
      assert.strictEqual(getRoleLabel('GUIDE'), '导购接待');
      assert.strictEqual(getRoleLabel('STORE_MANAGER'), '店长工作台');
    });

    it('should return the role key itself for unknown roles', () => {
      assert.strictEqual(getRoleLabel('UNKNOWN'), 'UNKNOWN');
    });
  });

  describe('filterPadWorkbenches (no-arg, index page)', () => {
    it('should return only PAD channel workbenches', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const result = filterPadWorkbenches(fallbackRoleWorkbenches);
      for (const wb of result) {
        assert.strictEqual(wb.channel, 'PAD', `${wb.role} should have channel PAD`);
      }
    });

    it('should return at least one PAD workbench', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const result = filterPadWorkbenches(fallbackRoleWorkbenches);
      assert.ok(result.length >= 1, `expected >= 1 PAD workbenches, got ${result.length}`);
    });
  });

  describe('getUniqueMarketCodes (index page)', () => {
    it('should return unique market codes across all PAD workbenches', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const padWbs = filterPadWorkbenches(fallbackRoleWorkbenches);
      const codes = getUniqueMarketCodes(padWbs);
      const uniqueSet = new Set(codes);
      assert.strictEqual(codes.length, uniqueSet.size, 'codes should be unique');
    });
  });

  describe('role count consistency', () => {
    it('should have at least 3 unique PAD roles on the index page', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const padWbs = filterPadWorkbenches(fallbackRoleWorkbenches);
      const uniqueRoles = new Set(padWbs.map((wb) => wb.role));
      assert.ok(uniqueRoles.size >= 3, `expected >= 3 unique PAD roles, got ${uniqueRoles.size}`);
    });

    it('every PAD workbench should have navItems', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const padWbs = filterPadWorkbenches(fallbackRoleWorkbenches);
      for (const wb of padWbs) {
        assert.ok(wb.navItems.length > 0, `${wb.role} PAD workbench has 0 navItems`);
      }
    });
  });
});

describe('pad-index-page: 反例 (negative cases)', () => {
  it('filterPadWorkbenches on empty array should return empty', () => {
    assert.deepStrictEqual(filterPadWorkbenches([]), []);
  });

  it('getUniqueMarketCodes on empty array should return empty', () => {
    assert.deepStrictEqual(getUniqueMarketCodes([]), []);
  });
});

// ====================================================================
// pad/[role]/page.tsx (Detail) — role filtering, bootstrap integrity
// ====================================================================

describe('pad-detail-page: 正例 (positive cases)', () => {
  describe('normalizeWorkbenchRoleKey', () => {
    it('should lowercase and replace hyphens with underscores', () => {
      assert.strictEqual(normalizeWorkbenchRoleKey('SUPER_ADMIN'), 'super_admin');
      assert.strictEqual(normalizeWorkbenchRoleKey('Store-Manager'), 'store_manager');
      assert.strictEqual(normalizeWorkbenchRoleKey('tenant-admin'), 'tenant_admin');
    });

    it('should trim whitespace', () => {
      assert.strictEqual(normalizeWorkbenchRoleKey('  guide  '), 'guide');
    });
  });

  describe('filterPadWorkbenchesByRole', () => {
    it('should find PAD workbenches for a given role', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const result = filterPadWorkbenchesByRole(fallbackRoleWorkbenches, 'GUIDE');
      for (const wb of result) {
        assert.strictEqual(wb.channel, 'PAD');
        assert.strictEqual(normalizeWorkbenchRoleKey(wb.role), 'guide');
      }
    });

    it('should return correct number of pad workbenches', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const padCount = fallbackRoleWorkbenches.filter((wb) => wb.channel === 'PAD').length;
      assert.ok(padCount >= 3, `expected >= 3 PAD workbenches, got ${padCount}`);
    });
  });

  describe('getAdminWorkbenchConsumerSnapshot > fallback delivery', () => {
    it('should provide governance summary with approvals info', async () => {
      const { getAdminWorkbenchConsumerSnapshot } = await import('../bootstrap');
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const snapshot = await getAdminWorkbenchConsumerSnapshot();
        assert.strictEqual(snapshot.deliveryMode, 'fallback');
        assert.ok(typeof snapshot.governance.summary.approvalsPending === 'number');
        assert.ok(Array.isArray(snapshot.governance.alerts));
        assert.ok(Array.isArray(snapshot.governance.topRisks));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('getRoleWorkbench', () => {
    it('should return workbench for known role', async () => {
      const { getRoleWorkbench } = await import('../bootstrap');
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const wb = await getRoleWorkbench('GUIDE');
        assert.ok(wb, 'Expected GUIDE workbench');
        assert.strictEqual(wb!.role, 'GUIDE');
        assert.ok(wb!.title.length > 0);
        assert.ok(Array.isArray(wb!.navItems));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('should return workbench for case-variant role key', async () => {
      const { getRoleWorkbench } = await import('../bootstrap');
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const wb = await getRoleWorkbench('guide');
        assert.ok(wb, 'Expected guide workbench (lowercase input)');
        assert.strictEqual(wb!.role, 'GUIDE');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('market codes', () => {
    it('should extract unique market codes from workbenches', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const codes = getUniqueMarketCodes(fallbackRoleWorkbenches);
      assert.ok(codes.length >= 1);
    });
  });
});

describe('pad-detail-page: 反例 (negative cases)', () => {
  it('getRoleWorkbench should return undefined for nonexistent role', async () => {
    const { getRoleWorkbench } = await import('../bootstrap');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const wb = await getRoleWorkbench('ROBOT_OVERLORD');
      assert.strictEqual(wb, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('filterPadWorkbenchesByRole should return empty for role with no PAD workbenches', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    const result = filterPadWorkbenchesByRole(fallbackRoleWorkbenches, 'NONEXISTENT_ROLE');
    assert.strictEqual(result.length, 0);
  });

  it('normalizeWorkbenchRoleKey of empty string should return empty', () => {
    assert.strictEqual(normalizeWorkbenchRoleKey(''), '');
  });
});

describe('pad-detail-page: 边界 (boundary cases)', () => {
  it('getRoleWorkbench with hyphenated role should resolve correctly', async () => {
    const { getRoleWorkbench } = await import('../bootstrap');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const wb = await getRoleWorkbench('STORE-MANAGER');
      assert.ok(wb, 'Expected STORE-MANAGER workbench');
      assert.strictEqual(wb!.role, 'STORE_MANAGER');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizeWorkbenchRoleKey with leading/trailing dashes should handle correctly', () => {
    assert.strictEqual(normalizeWorkbenchRoleKey('-guide-'), '_guide_');
  });

  it('fallback workbenches should have at least one PAD channel per relevant role', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    const padRoles = fallbackRoleWorkbenches
      .filter((wb) => wb.channel === 'PAD')
      .map((wb) => wb.role);
    const uniquePadRoles = new Set(padRoles);
    assert.ok(uniquePadRoles.size >= 3, `expected >= 3 unique PAD roles, got ${uniquePadRoles.size}`);
  });

  it('each PAD workbench should have non-empty navItems', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    const padWorkbenches = fallbackRoleWorkbenches.filter((wb) => wb.channel === 'PAD');
    for (const wb of padWorkbenches) {
      assert.ok(wb.navItems.length > 0, `${wb.role} PAD workbench has 0 navItems`);
    }
  });
});
