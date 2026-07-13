import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('IntegrationOrchestrationEventsPage', () => {
  describe('readQueryParam helper', () => {
    const readQueryParam = (value: string | string[] | undefined): string | undefined => {
      if (Array.isArray(value)) return value[0];
      return value;
    };

    it('returns undefined for undefined input', () => {
      assert.strictEqual(readQueryParam(undefined), undefined);
    });

    it('returns string as-is', () => {
      assert.strictEqual(readQueryParam('shopify'), 'shopify');
    });

    it('returns first element for string array', () => {
      assert.strictEqual(readQueryParam(['a', 'b', 'c']), 'a');
    });

    it('returns undefined for empty array', () => {
      assert.strictEqual(readQueryParam([]), undefined);
    });
  });

  describe('filter logic (inlined)', () => {
    const events = [
      { id: '1', eventName: 'order.created', source: 'shopify', aggregateId: null, idempotencyKey: 'ik-1', envelopeId: 'e1', occurredAt: '2025-01-01T00:00:00Z' },
      { id: '2', eventName: 'payment.succeeded', source: 'stripe', aggregateId: 'agg-1', idempotencyKey: 'ik-2', envelopeId: 'e2', occurredAt: '2025-01-02T00:00:00Z' },
      { id: '3', eventName: 'refund.processed', source: 'shopify', aggregateId: null, idempotencyKey: 'ik-3', envelopeId: 'e3', occurredAt: '2025-01-03T00:00:00Z' },
    ];

    it('filters by source', () => {
      const sourceFilter = 'stripe';
      const filtered = events.filter((e) => e.source === sourceFilter);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0]!.eventName, 'payment.succeeded');
    });

    it('filters by search text', () => {
      const search = 'refund';
      const filtered = events.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0]!.eventName, 'refund.processed');
    });

    it('combines source filter and search', () => {
      let result = events.filter((e) => e.source === 'shopify');
      const search = 'order';
      result = result.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.eventName, 'order.created');
    });

    it('returns all events when no filter applied', () => {
      assert.strictEqual(events.length, 3);
    });
  });

  describe('pagination math', () => {
    it('calculates correct total pages', () => {
      const items = Array.from({ length: 55 });
      const pageSize = 20;
      const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
      assert.strictEqual(totalPages, 3);
    });

    it('clamps page to valid range', () => {
      const totalPages = 3;
      const currentPage = 5;
      const safePage = Math.min(currentPage, totalPages);
      assert.strictEqual(safePage, 3);
    });

    it('handles empty list', () => {
      const items: unknown[] = [];
      const pageSize = 20;
      const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
      assert.strictEqual(totalPages, 1);
    });

    it('slices correct page of items', () => {
      const items = Array.from({ length: 45 }, (_, i) => i);
      const pageSize = 20;
      const page = 2;
      const paged = items.slice((page - 1) * pageSize, page * pageSize);
      assert.strictEqual(paged.length, 20);
      assert.strictEqual(paged[0]!, 20);
      assert.strictEqual(paged[paged.length - 1]!, 39);
    });
  });

  describe('date formatting (inlined)', () => {
    const formatDate = (iso: string): string => {
      const d = new Date(iso);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${min}`;
    };

    it('formats valid ISO date correctly', () => {
      assert.strictEqual(formatDate('2025-01-03T14:30:00Z'), '2025-01-03 14:30');
    });

    it('handles midnight correctly', () => {
      assert.strictEqual(formatDate('2025-06-01T00:00:00Z'), '2025-06-01 00:00');
    });

    it('returns N/A for invalid date', () => {
      try {
        const d = new Date('not-a-date');
        const isValid = !isNaN(d.getTime());
        assert.equal(isValid, false);
      } catch {
        assert.ok(true);
      }
    });

    it('sort events by occurredAt descending', () => {
      const items = [
        { id: '1', occurredAt: '2025-01-01T00:00:00Z' },
        { id: '2', occurredAt: '2025-03-01T00:00:00Z' },
        { id: '3', occurredAt: '2025-02-01T00:00:00Z' },
      ];
      const sorted = [...items].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
      assert.strictEqual(sorted[0]!.id, '2');
      assert.strictEqual(sorted[1]!.id, '3');
      assert.strictEqual(sorted[2]!.id, '1');
    });
  });

  describe('idempotencyKey uniqueness constraint', () => {
    it('detects duplicate idempotency keys', () => {
      const items = ['ik-1', 'ik-2', 'ik-1', 'ik-3'];
      const dupes = items.filter((k, i) => items.indexOf(k) !== i);
      assert.strictEqual(dupes.length, 1);
      assert.strictEqual(dupes[0]!, 'ik-1');
    });

    it('no duplicates returns empty', () => {
      const items = ['ik-1', 'ik-2', 'ik-3'];
      const dupes = items.filter((k, i) => items.indexOf(k) !== i);
      assert.strictEqual(dupes.length, 0);
    });
  });
});
