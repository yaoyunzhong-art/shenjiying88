import {
  describe,
  it,
} from 'node:test';
import assert from 'node:assert';

import {
  fetchOperations,
  fetchOperationById,
  fetchReceiptsByOperation,
} from './runtime-service';

// ─── fetchOperations ─────────────────────────────────────────────────

describe('runtime-service / fetchOperations', () => {

  it('returns paginated operations with default page 1 / pageSize 10', async () => {
    const result = await fetchOperations();

    assert.ok(result.items.length > 0, 'should return items');
    assert.ok(result.items.length <= 10, 'default pageSize should be 10');
    assert.strictEqual(typeof result.total, 'number');
    assert.ok(result.total > 0);
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.pageSize, 10);
    assert.strictEqual(result.totalPages, Math.ceil(result.total / result.pageSize));
  });

  it('respects custom page and pageSize', async () => {
    const result = await fetchOperations(2, 5);

    assert.strictEqual(result.page, 2);
    assert.strictEqual(result.pageSize, 5);
    assert.ok(result.items.length <= 5);
    assert.strictEqual(result.totalPages, Math.ceil(result.total / 5));
  });

  it('returns empty items for page beyond total pages', async () => {
    const result = await fetchOperations(999, 10);

    assert.strictEqual(result.items.length, 0);
    assert.ok(result.page > result.totalPages);
  });

  it('each operation has required fields', async () => {
    const result = await fetchOperations(1, 20);

    for (const op of result.items) {
      assert.ok(typeof op.id === 'string' && op.id.length > 0, 'id should be a non-empty string');
      assert.ok(['deploy', 'rollback', 'scale', 'restart', 'config-update'].includes(op.type), `unexpected type: ${op.type}`);
      assert.ok(['pending', 'running', 'completed', 'failed'].includes(op.status), `unexpected status: ${op.status}`);
      assert.ok(typeof op.targetId === 'string' && op.targetId.length > 0, 'targetId should be a non-empty string');
      assert.ok(typeof op.createdAt === 'string', 'createdAt should be an ISO string');
      if (op.finishedAt != null) {
        assert.ok(typeof op.finishedAt === 'string', 'finishedAt should be an ISO string when present');
      }
    }
  });

  it('items are sorted by most recent first (descending createdAt)', async () => {
    const result = await fetchOperations(1, 10);

    if (result.items.length >= 2) {
      const times = result.items.map(op => new Date(op.createdAt).getTime());
      for (let i = 0; i < times.length - 1; i++) {
        assert.ok(times[i]! >= times[i + 1]!, 'operations should be in descending chronological order');
      }
    }
  });
});

// ─── fetchOperationById ──────────────────────────────────────────────

describe('runtime-service / fetchOperationById', () => {

  it('returns the correct operation for a known id', async () => {
    const op = await fetchOperationById('op-1');

    assert.ok(op != null);
    assert.strictEqual(op.id, 'op-1');
    assert.strictEqual(op.type, 'deploy');
    assert.strictEqual(op.targetId, 'service-1');
    assert.ok(typeof op.status === 'string');
    assert.ok(typeof op.createdAt === 'string');
  });

  it('returns undefined for unknown operation id', async () => {
    const op = await fetchOperationById('op-99999');
    assert.strictEqual(op, undefined);
  });

  it('returns undefined for empty string id', async () => {
    const op = await fetchOperationById('');
    assert.strictEqual(op, undefined);
  });

  it('all known operation ids 1–20 are findable', async () => {
    for (let i = 1; i <= 20; i++) {
      const op = await fetchOperationById(`op-${i}`);
      assert.ok(op != null, `op-${i} should be found`);
      assert.strictEqual(op.id, `op-${i}`);
    }
  });
});

// ─── fetchReceiptsByOperation ────────────────────────────────────────

describe('runtime-service / fetchReceiptsByOperation', () => {

  it('returns receipts for a known operation', async () => {
    const receipts = await fetchReceiptsByOperation('op-1');

    assert.ok(Array.isArray(receipts));
    assert.ok(receipts.length >= 1, 'should have at least one receipt');
    for (const rcpt of receipts) {
      assert.strictEqual(rcpt.operationId, 'op-1');
      assert.ok(typeof rcpt.id === 'string' && rcpt.id.length > 0, 'receipt id should be non-empty');
      assert.ok(typeof rcpt.code === 'string', 'code should be a string');
      assert.ok(typeof rcpt.message === 'string', 'message should be a string');
      assert.ok(['ok', 'error'].includes(rcpt.status), `unexpected receipt status: ${rcpt.status}`);
      assert.ok(typeof rcpt.timestamp === 'string', 'timestamp should be a string');
    }
  });

  it('returns STARTED and COMPLETED/ERROR receipts for each operation', async () => {
    const receipts = await fetchReceiptsByOperation('op-2');

    assert.strictEqual(receipts.length, 2, 'should have exactly 2 receipts');
    assert.strictEqual(receipts[0]!.code, 'STARTED');
    assert.ok(receipts[1]!.code === 'COMPLETED' || receipts[1]!.code === 'ERROR');
  });

  it('returns ERROR receipt for failed operations', async () => {
    // op-5 status is 'failed'
    const receipts = await fetchReceiptsByOperation('op-5');

    const errorReceipt = receipts.find(r => r.code === 'ERROR');
    assert.ok(errorReceipt != null, 'failed operation should have an ERROR receipt');
    assert.strictEqual(errorReceipt.status, 'error');
    assert.ok(errorReceipt.message.toLowerCase().includes('failed'), 'ERROR message should indicate failure');
  });

  it('returns empty array for unknown operation id', async () => {
    const receipts = await fetchReceiptsByOperation('op-unknown');
    assert.deepStrictEqual(receipts, []);
  });

  it('returns empty array for empty string operation id', async () => {
    const receipts = await fetchReceiptsByOperation('');
    assert.deepStrictEqual(receipts, []);
  });

  it('all known operation ids 1–20 have receipts', async () => {
    for (let i = 1; i <= 20; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      assert.ok(receipts.length > 0, `op-${i} should have receipts`);
      for (const rcpt of receipts) {
        assert.strictEqual(rcpt.operationId, `op-${i}`);
      }
    }
  });

  it('receipts are ordered (STARTED before COMPLETED/ERROR)', async () => {
    for (let i = 1; i <= 10; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      assert.strictEqual(receipts[0]!.code, 'STARTED', `op-${i} first receipt should be STARTED`);
    }
  });
});
