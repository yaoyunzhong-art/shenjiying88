import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createMockMembers,
  MOCK_MEMBERS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  ALL_STORES,
  ALL_MARKETS,
  ALL_SALESPERSONS,
} from './index';

describe('members-data', () => {
  test('MOCK_MEMBERS has 60 entries', () => {
    assert.equal(MOCK_MEMBERS.length, 60);
  });

  test('every member has required fields', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.id, 'id is required');
      assert.ok(m.code, 'code is required');
      assert.ok(m.name, 'name is required');
      assert.ok(m.phone, 'phone is required');
      assert.ok(m.marketCode, 'marketCode is required');
      assert.ok(m.storeName, 'storeName is required');
      assert.ok(m.tier, 'tier is required');
      assert.ok(m.status, 'status is required');
      assert.equal(typeof m.points, 'number');
      assert.equal(typeof m.totalSpent, 'number');
      assert.ok(m.lastVisit);
      assert.ok(m.createdAt);
      assert.ok(m.salesperson);
      assert.ok(Array.isArray(m.tags));
    }
  });

  test('tier values are valid', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_TIERS.includes(m.tier), `invalid tier: ${m.tier}`);
    }
  });

  test('status values are valid', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_STATUSES.includes(m.status), `invalid status: ${m.status}`);
    }
  });

  test('marketCode values are valid', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(ALL_MARKETS.includes(m.marketCode), `invalid marketCode: ${m.marketCode}`);
    }
  });

  test('storeName values are valid', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(ALL_STORES.includes(m.storeName), `invalid storeName: ${m.storeName}`);
    }
  });

  test('salesperson values are valid', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(ALL_SALESPERSONS.includes(m.salesperson), `invalid salesperson: ${m.salesperson}`);
    }
  });

  test('points are non-negative', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.points >= 0, `negative points: ${m.points}`);
    }
  });

  test('totalSpent is non-negative', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.totalSpent >= 0, `negative totalSpent: ${m.totalSpent}`);
    }
  });

  test('MEMBER_TIER_MAP has all tiers', () => {
    for (const tier of MEMBER_TIERS) {
      const entry = MEMBER_TIER_MAP[tier];
      assert.ok(entry, `missing tier map entry: ${tier}`);
      assert.ok(entry.label);
      assert.ok(entry.variant);
      assert.ok(entry.color);
    }
  });

  test('MEMBER_STATUS_MAP has all statuses', () => {
    for (const status of MEMBER_STATUSES) {
      const entry = MEMBER_STATUS_MAP[status];
      assert.ok(entry, `missing status map entry: ${status}`);
      assert.ok(entry.label);
      assert.ok(entry.variant);
    }
  });

  test('createMockMembers generates requested count', () => {
    const small = createMockMembers(5);
    assert.equal(small.length, 5);
    const large = createMockMembers(100);
    assert.equal(large.length, 100);
  });

  test('sorted by totalSpent descending', () => {
    for (let i = 1; i < MOCK_MEMBERS.length; i++) {
      assert.ok(
        MOCK_MEMBERS[i].totalSpent <= MOCK_MEMBERS[i - 1].totalSpent,
        `not sorted at index ${i}: ${MOCK_MEMBERS[i].totalSpent} > ${MOCK_MEMBERS[i - 1].totalSpent}`
      );
    }
  });

  test('createdAt is valid date', () => {
    for (const m of MOCK_MEMBERS) {
      const d = new Date(m.createdAt);
      assert.ok(!isNaN(d.getTime()), `invalid createdAt: ${m.createdAt}`);
    }
  });

  test('lastVisit is valid date', () => {
    for (const m of MOCK_MEMBERS) {
      const d = new Date(m.lastVisit);
      assert.ok(!isNaN(d.getTime()), `invalid lastVisit: ${m.lastVisit}`);
    }
  });
});
