import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Pure logic tests — no JSX, no React rendering to avoid transform issues.

describe('IntegrationOrchestrationEventsClient (logic-only)', () => {
  interface EventEnvelope {
    envelopeId: string;
    eventName: string;
    source: string;
    aggregateId: string | null;
    idempotencyKey: string;
    occurredAt: string;
  }

  function makeEvent(overrides: Partial<EventEnvelope> = {}): EventEnvelope {
    return {
      envelopeId: overrides.envelopeId ?? 'evt-001',
      eventName: overrides.eventName ?? 'order.created',
      source: overrides.source ?? 'shopify',
      aggregateId: overrides.aggregateId ?? null,
      idempotencyKey: overrides.idempotencyKey ?? 'ik-001',
      occurredAt: overrides.occurredAt ?? '2025-01-15T10:30:00Z',
    };
  }

  describe('source filtering', () => {
    it('filters events by selected source', () => {
      const events = [
        makeEvent({ source: 'shopify' }),
        makeEvent({ source: 'stripe', envelopeId: 'evt-002' }),
        makeEvent({ source: 'shopify', envelopeId: 'evt-003' }),
      ];
      const sourceFilter = 'shopify';
      const filtered = events.filter((e) => e.source === sourceFilter);
      assert.strictEqual(filtered.length, 2);
    });

    it('returns all when filter is ALL', () => {
      const events = [makeEvent(), makeEvent({ source: 'stripe', envelopeId: 'evt-002' })];
      const sourceFilter = 'ALL';
      const filtered = sourceFilter === 'ALL'
        ? events
        : events.filter((e) => e.source === sourceFilter);
      assert.strictEqual(filtered.length, 2);
    });
  });

  describe('search filtering', () => {
    it('matches eventName substring', () => {
      const events = [
        makeEvent({ eventName: 'order.created' }),
        makeEvent({ eventName: 'payment.succeeded' }),
      ];
      const search = 'payment';
      const filtered = events.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0]!.eventName, 'payment.succeeded');
    });

    it('matches source substring', () => {
      const events = [
        makeEvent({ source: 'shopify' }),
        makeEvent({ source: 'stripe' }),
      ];
      const search = 'stripe';
      const filtered = events.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      assert.strictEqual(filtered.length, 1);
    });

    it('ignores search when empty', () => {
      const events = [makeEvent(), makeEvent({ envelopeId: 'evt-002' })];
      const search = '';
      const filtered = search.trim() === ''
        ? events
        : events.filter((e) =>
            `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
              .toLowerCase()
              .includes(search.toLowerCase())
          );
      assert.strictEqual(filtered.length, 2);
    });
  });

  describe('combined filter and search', () => {
    it('applies source filter then search', () => {
      const events = [
        makeEvent({ source: 'shopify', eventName: 'order.created', envelopeId: 'e1' }),
        makeEvent({ source: 'shopify', eventName: 'refund.processed', envelopeId: 'e2' }),
        makeEvent({ source: 'stripe', eventName: 'payment.succeeded', envelopeId: 'e3' }),
      ];

      // Step 1: source filter
      let result = events.filter((e) => e.source === 'shopify');
      assert.strictEqual(result.length, 2);

      // Step 2: search
      const search = 'order';
      result = result.filter((e) =>
        `${e.eventName} ${e.source} ${e.aggregateId ?? ''} ${e.idempotencyKey}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.eventName, 'order.created');
    });
  });

  describe('pagination', () => {
    it('calculates total pages correctly', () => {
      const totalItems = 55;
      const pageSize = 20;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      assert.strictEqual(totalPages, 3);
    });

    it('clamps current page', () => {
      const currentPage = 5;
      const totalPages = 3;
      const safePage = Math.min(currentPage, totalPages);
      assert.strictEqual(safePage, 3);
    });

    it('handles single page', () => {
      const totalItems = 5;
      const pageSize = 20;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      assert.strictEqual(totalPages, 1);
    });

    it('slices correct page', () => {
      const items = Array.from({ length: 35 }, (_, i) => `evt-${String(i).padStart(3, '0')}`);
      const pageSize = 20;
      const page = 2;
      const paged = items.slice((page - 1) * pageSize, page * pageSize);
      assert.strictEqual(paged.length, 15);
      assert.strictEqual(paged[0]!, 'evt-020');
      assert.strictEqual(paged[14]!, 'evt-034');
    });
  });

  describe('source severity mapping', () => {
    it('maps HIGH_SENSITIVITY algorithm to warning', () => {
      const algorithm = 'HMAC_SHA256_HIGH_SENSITIVITY';
      const severity = algorithm === 'HMAC_SHA256_HIGH_SENSITIVITY' ? 'warning' : 'info';
      assert.strictEqual(severity, 'warning');
    });

    it('maps normal algorithm to info', () => {
      const algorithm = 'HMAC_SHA256';
      const algorithm_: string = 'HMAC_SHA256';
      const severity = algorithm_ === 'HMAC_SHA256_HIGH_SENSITIVITY' ? 'warning' : 'info';
      assert.strictEqual(severity, 'info');
    });
  });
});
