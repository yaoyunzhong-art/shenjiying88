import {
  describe,
  it,
} from 'node:test';
import assert from 'node:assert';

import {
  fetchAlerts,
  fetchAlertById,
  acknowledgeAlert,
  resolveAlert,
} from './alert-service';

// ─── fetchAlerts ──────────────────────────────────────────────────────

describe('alert-service / fetchAlerts', () => {

  it('returns paginated alerts without filter', async () => {
    const result = await fetchAlerts();

    assert.ok(result.items.length > 0, 'should return items');
    assert.strictEqual(typeof result.total, 'number');
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.pageSize, 10);
    assert.ok(result.totalPages > 0);
    assert.ok(result.items.length <= result.pageSize);
  });

  it('respects page and pageSize', async () => {
    const result = await fetchAlerts({ page: 2, pageSize: 5 });

    assert.strictEqual(result.page, 2);
    assert.strictEqual(result.pageSize, 5);
    assert.ok(result.items.length <= 5);
  });

  it('filters by severity (single string)', async () => {
    const result = await fetchAlerts({ severity: 'error' });

    for (const a of result.items) {
      assert.strictEqual(a.severity, 'error');
    }
  });

  it('filters by severity (array)', async () => {
    const result = await fetchAlerts({ severity: ['warning', 'error'] });

    for (const a of result.items) {
      assert.ok(
        a.severity === 'warning' || a.severity === 'error',
        `expected warning|error, got ${a.severity}`
      );
    }
  });

  it('filters by status', async () => {
    const result = await fetchAlerts({ status: 'open' });

    for (const a of result.items) {
      assert.strictEqual(a.status, 'open');
    }
  });

  it('filters by source', async () => {
    const result = await fetchAlerts({ source: 'monitoring' });

    for (const a of result.items) {
      assert.strictEqual(a.source, 'monitoring');
    }
  });

  it('filters by search keyword', async () => {
    const result = await fetchAlerts({ search: 'CPU' });

    assert.ok(result.items.length > 0, 'should find CPU alerts');
    for (const a of result.items) {
      assert.ok(
        a.title.toLowerCase().includes('cpu') || a.description.toLowerCase().includes('cpu')
      );
    }
  });

  it('combines multiple filters', async () => {
    const result = await fetchAlerts({
      severity: 'error',
      status: 'open',
      pageSize: 100,
    });

    for (const a of result.items) {
      assert.strictEqual(a.severity, 'error');
      assert.strictEqual(a.status, 'open');
    }
  });

  it('returns empty items when no alerts match', async () => {
    const result = await fetchAlerts({ search: 'zzz-nonexistent-keyword-xyz' });

    assert.strictEqual(result.items.length, 0);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.totalPages, 0);
  });
});

// ─── fetchAlertById ───────────────────────────────────────────────────

describe('alert-service / fetchAlertById', () => {

  it('returns an alert for a valid id', async () => {
    const alert = await fetchAlertById('alert-1');
    assert.ok(alert != null);
    assert.strictEqual(alert.id, 'alert-1');
    assert.strictEqual(typeof alert.title, 'string');
    assert.strictEqual(typeof alert.severity, 'string');
    assert.strictEqual(typeof alert.status, 'string');
  });

  it('returns undefined for unknown id', async () => {
    const alert = await fetchAlertById('alert-nonexistent');
    assert.strictEqual(alert, undefined);
  });
});

// ─── acknowledgeAlert ─────────────────────────────────────────────────

describe('alert-service / acknowledgeAlert', () => {

  it('acknowledges an open alert', async () => {
    // 'alert-1' has status 'open' according to the mock seed
    const updated = await acknowledgeAlert('alert-1');

    assert.strictEqual(updated.id, 'alert-1');
    assert.strictEqual(updated.status, 'acknowledged');
    assert.ok(new Date(updated.updatedAt).getTime() > 0, 'updatedAt should be a valid timestamp');
  });

  it('throws for unknown alert id', async () => {
    await assert.rejects(
      () => acknowledgeAlert('alert-unknown-xyz'),
      /not found/i
    );
  });
});

// ─── resolveAlert ─────────────────────────────────────────────────────

describe('alert-service / resolveAlert', () => {

  it('resolves an alert', async () => {
    const updated = await resolveAlert('alert-1');

    assert.strictEqual(updated.id, 'alert-1');
    assert.strictEqual(updated.status, 'resolved');
    assert.ok(new Date(updated.updatedAt).getTime() > 0, 'updatedAt should be a valid timestamp');
  });

  it('throws for unknown alert id', async () => {
    await assert.rejects(
      () => resolveAlert('alert-unknown-xyz'),
      /not found/i
    );
  });
});
