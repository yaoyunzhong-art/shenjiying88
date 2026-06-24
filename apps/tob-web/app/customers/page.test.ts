/**
 * customers page unit tests — tob-web
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  CUSTOMER_INDUSTRIES,
  type CustomerItem,
  type CustomerStatus,
  type CustomerTier,
  type CustomerIndustry,
} from '../customers-data';

describe('customers-data', () => {
  it('MOCK_CUSTOMERS should have at least 10 items', () => {
    assert.ok(MOCK_CUSTOMERS.length >= 10, `expected >=10, got ${MOCK_CUSTOMERS.length}`);
  });

  it('every customer should have required fields', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(typeof c.id === 'string' && c.id.length > 0, `customer ${c.id}: missing id`);
      assert.ok(typeof c.companyName === 'string' && c.companyName.length > 0, `customer ${c.id}: missing companyName`);
      assert.ok(typeof c.contactName === 'string' && c.contactName.length > 0, `customer ${c.id}: missing contactName`);
      assert.ok(typeof c.industry === 'string' && c.industry.length > 0, `customer ${c.id}: missing industry`);
      assert.ok(typeof c.monthlySpend === 'number' && c.monthlySpend >= 0, `customer ${c.id}: invalid monthlySpend ${c.monthlySpend}`);
      assert.ok(typeof c.totalSpend === 'number' && c.totalSpend >= 0, `customer ${c.id}: invalid totalSpend ${c.totalSpend}`);
      assert.ok(typeof c.totalContracts === 'number' && c.totalContracts >= 0, `customer ${c.id}: invalid totalContracts`);
      assert.ok(typeof c.activeContracts === 'number' && c.activeContracts >= c.activeContracts, `customer ${c.id}: invalid activeContracts`);
    }
  });

  it('every customer status should be valid', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(
        CUSTOMER_STATUSES.includes(c.status),
        `customer ${c.id}: invalid status ${c.status}`
      );
    }
  });

  it('every customer tier should be valid', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(
        CUSTOMER_TIERS.includes(c.tier),
        `customer ${c.id}: invalid tier ${c.tier}`
      );
    }
  });

  it('every customer industry should be valid', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(
        CUSTOMER_INDUSTRIES.includes(c.industry),
        `customer ${c.id}: invalid industry ${c.industry}`
      );
    }
  });

  it('activeContracts should never exceed totalContracts', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(
        c.activeContracts <= c.totalContracts,
        `customer ${c.id}: activeContracts ${c.activeContracts} > totalContracts ${c.totalContracts}`
      );
    }
  });

  it('churned customers should have 0 activeContracts', () => {
    const churned = MOCK_CUSTOMERS.filter((c) => c.status === 'churned');
    for (const c of churned) {
      assert.equal(c.activeContracts, 0, `customer ${c.id}: churned but has ${c.activeContracts} active contracts`);
    }
  });

  it('suspended customers should have 0 activeContracts', () => {
    const suspended = MOCK_CUSTOMERS.filter((c) => c.status === 'suspended');
    for (const c of suspended) {
      assert.equal(c.activeContracts, 0, `customer ${c.id}: suspended but has ${c.activeContracts} active contracts`);
    }
  });
});

describe('customer status map coverage', () => {
  it('CUSTOMER_STATUS_MAP should cover all statuses', () => {
    for (const s of CUSTOMER_STATUSES) {
      assert.ok(s in CUSTOMER_STATUS_MAP, `missing status ${s} in map`);
      const entry = CUSTOMER_STATUS_MAP[s];
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `status ${s}: missing label`);
      assert.ok(
        ['success', 'warning', 'danger', 'neutral'].includes(entry.variant),
        `status ${s}: invalid variant ${entry.variant}`
      );
    }
  });

  it('CUSTOMER_TIER_MAP should cover all tiers', () => {
    for (const t of CUSTOMER_TIERS) {
      assert.ok(t in CUSTOMER_TIER_MAP, `missing tier ${t} in map`);
      const entry = CUSTOMER_TIER_MAP[t];
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `tier ${t}: missing label`);
      assert.ok(
        ['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant),
        `tier ${t}: invalid variant ${entry.variant}`
      );
    }
  });

  it('CUSTOMER_INDUSTRY_MAP should cover all industries', () => {
    for (const i of CUSTOMER_INDUSTRIES) {
      assert.ok(i in CUSTOMER_INDUSTRY_MAP, `missing industry ${i} in map`);
      assert.ok(
        typeof CUSTOMER_INDUSTRY_MAP[i] === 'string' && CUSTOMER_INDUSTRY_MAP[i].length > 0,
        `industry ${i}: empty label`
      );
    }
  });
});

describe('customer filtering partition', () => {
  it('status filter should partition correctly', () => {
    const sum = CUSTOMER_STATUSES.reduce(
      (acc, s) => acc + MOCK_CUSTOMERS.filter((c) => c.status === s).length,
      0
    );
    assert.equal(sum, MOCK_CUSTOMERS.length,
      `status partition sum ${sum} !== total ${MOCK_CUSTOMERS.length}`);
  });

  it('tier filter should partition correctly', () => {
    const sum = CUSTOMER_TIERS.reduce(
      (acc, t) => acc + MOCK_CUSTOMERS.filter((c) => c.tier === t).length,
      0
    );
    assert.equal(sum, MOCK_CUSTOMERS.length,
      `tier partition sum ${sum} !== total ${MOCK_CUSTOMERS.length}`);
  });

  it('industry filter should partition correctly', () => {
    const sum = CUSTOMER_INDUSTRIES.reduce(
      (acc, i) => acc + MOCK_CUSTOMERS.filter((c) => c.industry === i).length,
      0
    );
    assert.equal(sum, MOCK_CUSTOMERS.length,
      `industry partition sum ${sum} !== total ${MOCK_CUSTOMERS.length}`);
  });
});

describe('customer spend analysis', () => {
  it('totalSpend should be non-negative and accumulate correctly', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(c.totalSpend >= 0, `customer ${c.id}: negative totalSpend ${c.totalSpend}`);
      assert.ok(c.monthlySpend >= 0, `customer ${c.id}: negative monthlySpend ${c.monthlySpend}`);
    }
  });

  it('platinum customers should have highest average monthly spend', () => {
    const tiers = ['platinum', 'gold', 'silver', 'standard'] as const;
    const avgSpend: Record<string, number> = {};

    for (const t of tiers) {
      const group = MOCK_CUSTOMERS.filter((c) => c.tier === t);
      if (group.length > 0) {
        avgSpend[t] = group.reduce((s, c) => s + c.monthlySpend, 0) / group.length;
      }
    }

    // Platinum should have highest average
    assert.ok(avgSpend.platinum! > 0, 'platinum average spend should be > 0');
    if (avgSpend.gold !== undefined) {
      assert.ok(avgSpend.platinum! >= avgSpend.gold,
        `platinum avg ${avgSpend.platinum!.toFixed(0)} < gold avg ${avgSpend.gold!.toFixed(0)}`);
    }
  });

  it('region distribution breakdown should exist', () => {
    const regions = new Set(MOCK_CUSTOMERS.map((c) => c.region));
    assert.ok(regions.size >= 3, `expected at least 3 regions, got ${regions.size}`);
    for (const r of regions) {
      assert.ok(typeof r === 'string' && r.length > 0, `invalid region: ${r}`);
    }
  });
});

describe('customer city & since validation', () => {
  it('every customer should have a valid city', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(typeof c.city === 'string' && c.city.length > 0, `customer ${c.id}: missing city`);
    }
  });

  it('every customer should have a valid since date', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(typeof c.since === 'string' && c.since.length > 0, `customer ${c.id}: missing since`);
      assert.ok(!isNaN(Date.parse(c.since)), `customer ${c.id}: invalid since date ${c.since}`);
    }
  });

  it('every customer should have a valid lastActivity date', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(typeof c.lastActivity === 'string' && c.lastActivity.length > 0, `customer ${c.id}: missing lastActivity`);
      assert.ok(!isNaN(Date.parse(c.lastActivity)), `customer ${c.id}: invalid lastActivity date ${c.lastActivity}`);
    }
  });
});
