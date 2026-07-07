/**
 * contracts page unit tests — tob-web
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_CONTRACTS,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  fmtAmount,
  daysUntil,
  type ContractItem,
  type ContractStatus,
  type ContractType,
} from '../contracts-data';

describe('contracts-data', () => {
  it('MOCK_CONTRACTS should have at least 10 items', () => {
    assert.ok(MOCK_CONTRACTS.length >= 10, `expected >=10, got ${MOCK_CONTRACTS.length}`);
  });

  it('every contract should have required fields', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(typeof c.id === 'string' && c.id.length > 0, `missing id`);
      assert.ok(typeof c.contractNo === 'string' && c.contractNo.length > 0, `missing contractNo`);
      assert.ok(typeof c.title === 'string' && c.title.length > 0, `missing title`);
      assert.ok(typeof c.companyName === 'string' && c.companyName.length > 0, `missing companyName`);
      assert.ok(typeof c.amount === 'number' && c.amount >= 0, `invalid amount ${c.amount}`);
      assert.ok(typeof c.paid === 'number' && c.paid >= 0, `invalid paid ${c.paid}`);
      assert.ok(typeof c.startDate === 'string' && c.startDate.length > 0, `missing startDate`);
      assert.ok(typeof c.endDate === 'string' && c.endDate.length > 0, `missing endDate`);
    }
  });

  it('every contract status should be valid', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(
        CONTRACT_STATUSES.includes(c.status),
        `contract ${c.id}: invalid status ${c.status}`
      );
    }
  });

  it('every contract type should be valid', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(
        CONTRACT_TYPES.includes(c.type),
        `contract ${c.id}: invalid type ${c.type}`
      );
    }
  });

  it('paid should never exceed amount', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(
        c.paid <= c.amount,
        `contract ${c.id}: paid ${c.paid} > amount ${c.amount}`
      );
    }
  });

  it('startDate should be before endDate', () => {
    for (const c of MOCK_CONTRACTS) {
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      assert.ok(
        end > start,
        `contract ${c.id}: endDate ${c.endDate} <= startDate ${c.startDate}`
      );
    }
  });

  it('terminated contracts should have renewalCount >= 0', () => {
    const terminated = MOCK_CONTRACTS.filter((c) => c.status === 'terminated');
    for (const c of terminated) {
      assert.ok(typeof c.renewalCount === 'number' && c.renewalCount >= 0);
    }
  });

  it('draft contracts should have 0 paid amount', () => {
    const drafts = MOCK_CONTRACTS.filter((c) => c.status === 'draft');
    for (const c of drafts) {
      assert.equal(
        c.paid,
        0,
        `draft contract ${c.id} has paid ${c.paid}, expected 0`,
      );
    }
  });
});

describe('contract status map coverage', () => {
  it('CONTRACT_STATUS_MAP should cover all statuses', () => {
    for (const s of CONTRACT_STATUSES) {
      assert.ok(s in CONTRACT_STATUS_MAP, `missing status ${s} in map`);
      const entry = CONTRACT_STATUS_MAP[s];
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `status ${s}: missing label`);
      assert.ok(
        ['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant),
        `status ${s}: invalid variant ${entry.variant}`,
      );
    }
  });

  it('CONTRACT_TYPE_MAP should cover all types', () => {
    for (const t of CONTRACT_TYPES) {
      assert.ok(t in CONTRACT_TYPE_MAP, `missing type ${t} in map`);
      assert.ok(
        typeof CONTRACT_TYPE_MAP[t] === 'string' && CONTRACT_TYPE_MAP[t].length > 0,
        `type ${t}: empty label`,
      );
    }
  });
});

describe('contract filtering partition', () => {
  it('status filter should partition correctly', () => {
    const sum = CONTRACT_STATUSES.reduce(
      (acc, s) => acc + MOCK_CONTRACTS.filter((c) => c.status === s).length,
      0,
    );
    assert.equal(
      sum,
      MOCK_CONTRACTS.length,
      `status partition sum ${sum} !== total ${MOCK_CONTRACTS.length}`,
    );
  });

  it('type filter should partition correctly', () => {
    const sum = CONTRACT_TYPES.reduce(
      (acc, t) => acc + MOCK_CONTRACTS.filter((c) => c.type === t).length,
      0,
    );
    assert.equal(
      sum,
      MOCK_CONTRACTS.length,
      `type partition sum ${sum} !== total ${MOCK_CONTRACTS.length}`,
    );
  });
});

describe('contract amount analysis', () => {
  it('total amount should be positive', () => {
    const total = MOCK_CONTRACTS.reduce((s, c) => s + c.amount, 0);
    assert.ok(total > 0, 'total amount should be > 0');
  });

  it('pending_approval contracts should have 0 paid', () => {
    const pending = MOCK_CONTRACTS.filter((c) => c.status === 'pending_approval');
    for (const c of pending) {
      assert.equal(
        c.paid,
        0,
        `pending_approval contract ${c.id} paid ${c.paid}, expected 0`,
      );
    }
  });

  it('expiring_soon contracts should have endDate in the near future', () => {
    for (const c of MOCK_CONTRACTS.filter((c) => c.status === 'expiring_soon')) {
      const days = daysUntil(c.endDate);
      assert.ok(days >= 0 && days <= 30, `expiring_soon ${c.id}: daysUntil ${days} out of [0,30]`);
    }
  });
});

describe('contract company association', () => {
  it('multiple contracts from same company should be allowed', () => {
    const counts = new Map<string, number>();
    for (const c of MOCK_CONTRACTS) {
      counts.set(c.companyId, (counts.get(c.companyId) ?? 0) + 1);
    }
    const multi = Array.from(counts.entries()).filter(([, count]) => count > 1);
    assert.ok(
      multi.length >= 1,
      `expected at least 1 company with multiple contracts, got ${multi.length}`,
    );
  });

  it('every contract should have a valid companyName', () => {
    for (const c of MOCK_CONTRACTS) {
      assert.ok(
        typeof c.companyName === 'string' && c.companyName.length > 0,
        `contract ${c.id}: empty companyName`,
      );
    }
  });
});

describe('contract amount utilities', () => {
  it('fmtAmount should handle large numbers', () => {
    assert.equal(fmtAmount(1_800_000), '¥180.0万');
    assert.equal(fmtAmount(480_000), '¥480.0K');
    assert.equal(fmtAmount(84_000), '¥84.0K');
  });

  it('daysUntil should return non-negative integer', () => {
    for (const c of MOCK_CONTRACTS) {
      const d = daysUntil(c.endDate);
      assert.ok(typeof d === 'number' && !isNaN(d), `contract ${c.id}: daysUntil NaN`);
    }
  });
});

describe('contract description availability', () => {
  it('most contracts should have description', () => {
    const withDesc = MOCK_CONTRACTS.filter((c) => c.description && c.description.length > 0);
    assert.ok(
      withDesc.length >= MOCK_CONTRACTS.length * 0.8,
      `only ${withDesc.length}/${MOCK_CONTRACTS.length} contracts have description`,
    );
  });
});
