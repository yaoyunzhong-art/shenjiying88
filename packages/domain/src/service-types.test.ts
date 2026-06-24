import { describe, it } from 'node:test';
import assert from 'node:assert';

import type {
  FoundationAlert,
  FoundationAlertFilter,
  PaginatedResponse,
  RuntimeOperation,
  RuntimeReceipt,
} from './service-types';

// ─── FoundationAlert ──────────────────────────────────────────────────

describe('service-types / FoundationAlert', () => {
  it('accepts a full alert shape', () => {
    const alert: FoundationAlert = {
      id: 'alert-1',
      title: 'CPU spike detected',
      description: 'CPU usage exceeded 90%',
      severity: 'error',
      status: 'open',
      source: 'monitoring',
      owner: 'team-a',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    assert.strictEqual(alert.id, 'alert-1');
    assert.strictEqual(alert.severity, 'error');
    assert.strictEqual(alert.status, 'open');
  });

  it('allows optional owner to be omitted', () => {
    const alert: FoundationAlert = {
      id: 'alert-2',
      title: 'Disk space low',
      description: 'Less than 10% free',
      severity: 'warning',
      status: 'open',
      source: 'system',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    };

    assert.strictEqual(alert.owner, undefined);
    assert.strictEqual(alert.severity, 'warning');
  });
});

// ─── FoundationAlertFilter ────────────────────────────────────────────

describe('service-types / FoundationAlertFilter', () => {
  it('accepts an empty filter', () => {
    const filter: FoundationAlertFilter = {};
    assert.deepStrictEqual(filter, {});
  });

  it('accepts single severity string', () => {
    const filter: FoundationAlertFilter = { severity: 'error' };
    assert.strictEqual(filter.severity, 'error');
  });

  it('accepts severity array', () => {
    const filter: FoundationAlertFilter = { severity: ['error', 'warning'] };
    assert.deepStrictEqual(filter.severity, ['error', 'warning']);
  });

  it('accepts status filter', () => {
    const filter: FoundationAlertFilter = { status: 'open' };
    assert.strictEqual(filter.status, 'open');
  });

  it('accepts source filter', () => {
    const filter: FoundationAlertFilter = { source: 'monitoring' };
    assert.strictEqual(filter.source, 'monitoring');
  });

  it('accepts search filter', () => {
    const filter: FoundationAlertFilter = { search: 'CPU' };
    assert.strictEqual(filter.search, 'CPU');
  });

  it('combines multiple filter fields', () => {
    const filter: FoundationAlertFilter = {
      severity: 'error',
      status: ['open', 'acknowledged'],
      source: 'monitoring',
      search: 'disk',
    };

    assert.strictEqual(filter.severity, 'error');
    assert.deepStrictEqual(filter.status, ['open', 'acknowledged']);
    assert.strictEqual(filter.source, 'monitoring');
    assert.strictEqual(filter.search, 'disk');
  });
});

// ─── PaginatedResponse ────────────────────────────────────────────────

describe('service-types / PaginatedResponse', () => {
  it('builds a paginated response', () => {
    const response: PaginatedResponse<FoundationAlert> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };

    assert.strictEqual(response.items.length, 0);
    assert.strictEqual(response.total, 0);
    assert.strictEqual(response.page, 1);
    assert.strictEqual(response.pageSize, 10);
    assert.strictEqual(response.totalPages, 0);
  });

  it('calculates totalPages correctly', () => {
    const response: PaginatedResponse<string> = {
      items: ['a', 'b'],
      total: 25,
      page: 1,
      pageSize: 10,
      totalPages: 3,
    };

    assert.strictEqual(response.totalPages, 3);
    assert.strictEqual(Math.ceil(response.total / response.pageSize), response.totalPages);
  });
});

// ─── RuntimeOperation ─────────────────────────────────────────────────

describe('service-types / RuntimeOperation', () => {
  it('accepts an operation with optional finishedAt', () => {
    const op: RuntimeOperation = {
      id: 'op-1',
      type: 'restart',
      status: 'running',
      targetId: 'svc-42',
      createdAt: '2025-06-01T10:00:00Z',
    };

    assert.strictEqual(op.id, 'op-1');
    assert.strictEqual(op.status, 'running');
    assert.strictEqual(op.finishedAt, undefined);
  });

  it('accepts a finished operation', () => {
    const op: RuntimeOperation = {
      id: 'op-2',
      type: 'scale',
      status: 'completed',
      targetId: 'svc-7',
      createdAt: '2025-06-01T10:00:00Z',
      finishedAt: '2025-06-01T10:05:00Z',
    };

    assert.strictEqual(op.status, 'completed');
    assert.strictEqual(op.finishedAt, '2025-06-01T10:05:00Z');
  });
});

// ─── RuntimeReceipt ───────────────────────────────────────────────────

describe('service-types / RuntimeReceipt', () => {
  it('builds a success receipt', () => {
    const receipt: RuntimeReceipt = {
      id: 'rec-1',
      operationId: 'op-1',
      code: 'OK',
      message: 'Operation completed successfully',
      status: 'success',
      timestamp: '2025-06-01T10:05:00Z',
    };

    assert.strictEqual(receipt.code, 'OK');
    assert.strictEqual(receipt.status, 'success');
    assert.strictEqual(receipt.operationId, 'op-1');
  });

  it('builds a failure receipt', () => {
    const receipt: RuntimeReceipt = {
      id: 'rec-2',
      operationId: 'op-2',
      code: 'ERR_TIMEOUT',
      message: 'Operation timed out',
      status: 'failed',
      timestamp: '2025-06-01T10:10:00Z',
    };

    assert.strictEqual(receipt.code, 'ERR_TIMEOUT');
    assert.strictEqual(receipt.status, 'failed');
    assert.ok(receipt.message.includes('timed out'));
  });
});
