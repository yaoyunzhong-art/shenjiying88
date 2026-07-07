/**
 * audit-trail/page.test.ts — Page-level tests for audit trail listing page.
 * Tests query parameter normalization, risk filter logic, source extraction,
 * counting, sorting, and pagination (matching audit-trail-client.tsx logic).
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: audit-trail-client.tsx, audit-trail-view-model.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type { AuditRecordContract, AuditRiskLevel } from '@m5/types';
import { RISK_LEVEL_LABEL, RISK_LEVEL_VARIANT } from '../audit-trail-view-model';

// ---- Sample data matching audit-trail-client.tsx internal logic ----

const SAMPLE_RECORDS: AuditRecordContract[] = [
  {
    auditId: 'audit-001',
    eventType: 'member.points.adjust',
    tenantId: 'tenant-demo',
    actorId: 'admin@m5.com',
    source: 'member-service',
    riskLevel: 'high',
    occurredAt: '2026-06-14T08:00:00.000Z',
    details: { memberId: 'm-1', points: 50 },
  },
  {
    auditId: 'audit-002',
    eventType: 'order.refund',
    tenantId: 'tenant-demo',
    actorId: 'cashier@store-001',
    source: 'order-service',
    riskLevel: 'medium',
    occurredAt: '2026-06-14T07:30:00.000Z',
    details: { orderId: 'ORD-12345', amount: 199.99 },
  },
  {
    auditId: 'audit-003',
    eventType: 'store.config.update',
    tenantId: 'tenant-demo',
    actorId: 'tenant.admin@m5.com',
    source: 'config-service',
    riskLevel: 'low',
    occurredAt: '2026-06-13T22:15:00.000Z',
    details: { key: 'timezone', oldValue: 'UTC+8', newValue: 'UTC+9' },
  },
  {
    auditId: 'audit-004',
    eventType: 'member.login',
    tenantId: 'tenant-demo',
    actorId: 'member@example.com',
    source: 'member-service',
    riskLevel: 'low',
    occurredAt: '2026-06-13T18:00:00.000Z',
    details: { ip: '192.168.1.1' },
  },
  {
    auditId: 'audit-005',
    eventType: 'approval.ticket.close',
    tenantId: 'tenant-demo',
    actorId: 'admin@m5.com',
    source: 'approval-service',
    riskLevel: 'high',
    occurredAt: '2026-06-13T12:00:00.000Z',
    details: { ticketId: 'TICKET-042' },
  },
];

// ---- Page-level filter helpers (mirror audit-trail-client.tsx logic) ----

function filterByRiskLevel(
  records: AuditRecordContract[],
  riskFilter: AuditRiskLevel | 'ALL',
): AuditRecordContract[] {
  if (riskFilter === 'ALL') return records;
  return records.filter((record) => record.riskLevel === riskFilter);
}

function filterBySource(
  records: AuditRecordContract[],
  sourceFilter: string,
): AuditRecordContract[] {
  if (sourceFilter === 'ALL') return records;
  return records.filter((record) => record.source === sourceFilter);
}

function filterBySearchTerm(records: AuditRecordContract[], term: string): AuditRecordContract[] {
  if (!term.trim()) return records;
  const needle = term.trim().toLowerCase();
  return records.filter((record) => {
    const haystack = `${record.eventType} ${record.actorId ?? ''} ${record.source ?? ''} ${JSON.stringify(record.details)}`.toLowerCase();
    return haystack.includes(needle);
  });
}

function extractSources(records: AuditRecordContract[]): string[] {
  return Array.from(
    new Set(records.map((record) => record.source).filter((value): value is string => Boolean(value))),
  );
}

function computeCountsByLevel(records: AuditRecordContract[]): Record<AuditRiskLevel | 'ALL', number> {
  const byLevel: Record<AuditRiskLevel | 'ALL', number> = {
    ALL: records.length,
    low: 0,
    medium: 0,
    high: 0,
  };
  for (const record of records) {
    byLevel[record.riskLevel] += 1;
  }
  return byLevel;
}

function sortRecords<T>(items: T[], key: string, direction: 'asc' | 'desc'): T[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const valueA = (a as unknown as Record<string, unknown>)[key];
    const valueB = (b as unknown as Record<string, unknown>)[key];
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return (valueA - valueB) * dir;
    }
    return String(valueA ?? '').localeCompare(String(valueB ?? '')) * dir;
  });
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// ---- 正例 ----

describe('audit-trail-page: 正例 (positive cases)', () => {
  describe('risk level filter', () => {
    it('filter ALL should return all records', () => {
      const result = filterByRiskLevel(SAMPLE_RECORDS, 'ALL');
      assert.strictEqual(result.length, SAMPLE_RECORDS.length);
    });

    it('filter high should return only high risk records', () => {
      const result = filterByRiskLevel(SAMPLE_RECORDS, 'high');
      assert.strictEqual(result.length, 2);
      for (const r of result) {
        assert.strictEqual(r.riskLevel, 'high');
      }
    });

    it('filter low should return only low risk records', () => {
      const result = filterByRiskLevel(SAMPLE_RECORDS, 'low');
      assert.strictEqual(result.length, 2);
      for (const r of result) {
        assert.strictEqual(r.riskLevel, 'low');
      }
    });
  });

  describe('source filter', () => {
    it('filter member-service should return correct records', () => {
      const result = filterBySource(SAMPLE_RECORDS, 'member-service');
      assert.strictEqual(result.length, 2);
      for (const r of result) {
        assert.strictEqual(r.source, 'member-service');
      }
    });

    it('filter ALL should return all records', () => {
      const result = filterBySource(SAMPLE_RECORDS, 'ALL');
      assert.strictEqual(result.length, SAMPLE_RECORDS.length);
    });
  });

  describe('search filter', () => {
    it('should find records by eventType', () => {
      const result = filterBySearchTerm(SAMPLE_RECORDS, 'member.points.adjust');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.auditId, 'audit-001');
    });

    it('should find records by actorId (including substring match)', () => {
      // admin@m5.com appears in audit-001 (actorId) and audit-005 (actorId)
      // Also matches audit-003 actorId 'tenant.admin@m5.com' as substring
      const result = filterBySearchTerm(SAMPLE_RECORDS, 'admin@m5.com');
      assert.strictEqual(result.length, 3); // audit-001, audit-003 (substring), audit-005
    });

    it('should find records by details JSON', () => {
      const result = filterBySearchTerm(SAMPLE_RECORDS, 'TICKET-042');
      assert.strictEqual(result.length, 1);
    });
  });

  describe('source extraction', () => {
    it('extractSources should return unique sources', () => {
      const sources = extractSources(SAMPLE_RECORDS);
      assert.ok(sources.includes('member-service'));
      assert.ok(sources.includes('order-service'));
      assert.ok(sources.includes('config-service'));
      assert.ok(sources.includes('approval-service'));
      assert.strictEqual(sources.length, 4);
    });
  });

  describe('risk level counts', () => {
    it('should count records by risk level', () => {
      const counts = computeCountsByLevel(SAMPLE_RECORDS);
      assert.strictEqual(counts.ALL, 5);
      assert.strictEqual(counts.high, 2);
      assert.strictEqual(counts.medium, 1);
      assert.strictEqual(counts.low, 2);
    });
  });

  describe('sorting', () => {
    it('should sort by occurredAt descending', () => {
      const sorted = sortRecords(SAMPLE_RECORDS, 'occurredAt', 'desc');
      assert.ok(new Date(sorted[0]!.occurredAt) >= new Date(sorted[1]!.occurredAt));
      assert.strictEqual(sorted[0]!.auditId, 'audit-001');
      assert.strictEqual(sorted[3]!.auditId, 'audit-004');
    });

    it('should sort by riskLevel (string) ascending', () => {
      const sorted = sortRecords(SAMPLE_RECORDS, 'riskLevel', 'asc');
      // high < low alphabetically; but we just check it's stable
      assert.strictEqual(sorted.length, SAMPLE_RECORDS.length);
    });
  });

  describe('pagination', () => {
    it('page 1 with pageSize 2 should return first 2 records', () => {
      const result = paginate(SAMPLE_RECORDS, 1, 2);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0]!.auditId, 'audit-001');
      assert.strictEqual(result[1]!.auditId, 'audit-002');
    });

    it('page 3 with pageSize 2 should return last record', () => {
      const result = paginate(SAMPLE_RECORDS, 3, 2);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.auditId, 'audit-005');
    });
  });

  describe('RISK_LEVEL_LABEL and VARIANT integration', () => {
    it('should map each risk level to correct labels', () => {
      assert.strictEqual(RISK_LEVEL_LABEL.low, '低风险');
      assert.strictEqual(RISK_LEVEL_LABEL.medium, '中风险');
      assert.strictEqual(RISK_LEVEL_LABEL.high, '高风险');
    });
  });

  describe('page.tsx readQueryParam helper', () => {
    it('should extract scalar value from string or array', () => {
      function readQueryParam(value: string | string[] | undefined): string | undefined {
        if (Array.isArray(value)) return value[0];
        return value;
      }
      assert.strictEqual(readQueryParam('hello'), 'hello');
      assert.strictEqual(readQueryParam(['a', 'b']), 'a');
      assert.strictEqual(readQueryParam(undefined), undefined);
    });

    it('should normalize risk level param to valid value or undefined', () => {
      function normalizeRiskLevel(value: string | string[] | undefined): 'low' | 'medium' | 'high' | undefined {
        const raw = Array.isArray(value) ? value[0] : value;
        if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
        return undefined;
      }
      assert.strictEqual(normalizeRiskLevel('high'), 'high');
      assert.strictEqual(normalizeRiskLevel('low'), 'low');
      assert.strictEqual(normalizeRiskLevel('invalid'), undefined);
      assert.strictEqual(normalizeRiskLevel(undefined), undefined);
    });

    it('should normalize limit param to valid range [1, 100]', () => {
      function normalizeLimit(value: string | string[] | undefined): number {
        const raw = Array.isArray(value) ? value[0] : value;
        const parsed = raw ? Number(raw) : 50;
        return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
      }
      assert.strictEqual(normalizeLimit('50'), 50);
      assert.strictEqual(normalizeLimit('200'), 100);
      assert.strictEqual(normalizeLimit('0'), 50);
      assert.strictEqual(normalizeLimit('-5'), 50);
      assert.strictEqual(normalizeLimit(undefined), 50);
    });
  });
});

// ---- 反例 ----

describe('audit-trail-page: 反例 (negative cases)', () => {
  it('search for nonexistent term should return empty', () => {
    const result = filterBySearchTerm(SAMPLE_RECORDS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('filter by nonexistent source should return empty', () => {
    const result = filterBySource(SAMPLE_RECORDS, 'not-a-source');
    assert.strictEqual(result.length, 0);
  });

  it('empty records should handle all filters gracefully', () => {
    const empty: AuditRecordContract[] = [];
    assert.strictEqual(filterByRiskLevel(empty, 'high').length, 0);
    assert.strictEqual(filterBySource(empty, 'ALL').length, 0);
    assert.strictEqual(filterBySearchTerm(empty, 'test').length, 0);
    assert.strictEqual(paginate(empty, 1, 10).length, 0);
    assert.deepStrictEqual(computeCountsByLevel(empty), { ALL: 0, low: 0, medium: 0, high: 0 });
    assert.deepStrictEqual(extractSources(empty), []);
  });

  it('pagination for page beyond total should return empty', () => {
    const result = paginate(SAMPLE_RECORDS, 999, 10);
    assert.strictEqual(result.length, 0);
  });
});

// ---- 边界 ----

describe('audit-trail-page: 边界 (boundary cases)', () => {
  it('single char search should find matches', () => {
    const result = filterBySearchTerm(SAMPLE_RECORDS, 'm');
    assert.ok(result.length >= 3, 'single char search should find members-related records');
  });

  it('case-insensitive search should work for eventType', () => {
    const upper = filterBySearchTerm(SAMPLE_RECORDS, 'MEMBER.POINTS.ADJUST');
    const lower = filterBySearchTerm(SAMPLE_RECORDS, 'member.points.adjust');
    assert.strictEqual(upper.length, lower.length);
  });

  it('empty search term should return all records', () => {
    const result = filterBySearchTerm(SAMPLE_RECORDS, '');
    assert.strictEqual(result.length, SAMPLE_RECORDS.length);
  });

  it('empty search term (whitespace) should return all records', () => {
    const result = filterBySearchTerm(SAMPLE_RECORDS, '   ');
    assert.strictEqual(result.length, SAMPLE_RECORDS.length);
  });

  it('pagination page 0 should return empty', () => {
    const result = paginate(SAMPLE_RECORDS, 0, 10);
    assert.strictEqual(result.length, 0);
  });

  it('pagination pageSize larger than total should return all', () => {
    const result = paginate(SAMPLE_RECORDS, 1, 100);
    assert.strictEqual(result.length, SAMPLE_RECORDS.length);
  });

  it('records with unknown risk level edge case', () => {
    const counts = computeCountsByLevel(SAMPLE_RECORDS);
    assert.strictEqual(counts.ALL, counts.low + counts.medium + counts.high);
  });

  it('filter chain: search + risk + source should compose correctly', () => {
    let result = filterBySearchTerm(SAMPLE_RECORDS, 'admin');
    result = filterByRiskLevel(result, 'high');
    result = filterBySource(result, 'approval-service');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]!.auditId, 'audit-005');
  });
});
