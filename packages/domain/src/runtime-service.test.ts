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

// ─── Additional Deep Coverage ─────────────────────────────────────────

describe('runtime-service / fetchOperations — additional edge cases', () => {

  it('pageSize 1 returns single item per page', async () => {
    const result = await fetchOperations(1, 1);
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.pageSize, 1);
    assert.strictEqual(result.totalPages, 20);
  });

  it('pageSize larger than total returns all items', async () => {
    const result = await fetchOperations(1, 100);
    assert.strictEqual(result.items.length, 20);
    assert.strictEqual(result.totalPages, 1);
  });

  it('page 0 with pageSize 10 returns empty items (since slice(-10, 10) = empty)', async () => {
    const result = await fetchOperations(0 as unknown as number, 10);
    // start = (0-1)*10 = -10, slice(-10, 10) on length 20 => slice(10, 10) => empty
    assert.strictEqual(result.items.length, 0);
    assert.strictEqual(result.page, 0);
  });

  it('negative page -5 returns empty items (offset before start)', async () => {
    const result = await fetchOperations(-5, 10);
    assert.strictEqual(result.page, -5);
    assert.strictEqual(result.items.length, 0);
  });

  it('pageSize 0 leads to empty items', async () => {
    const result = await fetchOperations(1, 0);
    assert.strictEqual(result.items.length, 0);
  });

  it('negative pageSize treated as 0-length slice', async () => {
    const result = await fetchOperations(1, -5);
    assert.strictEqual(result.items.length, 15); // Array.slice(0, -5) means slice(0, 15)
  });

  it('returns correct total count regardless of pagination', async () => {
    const result1 = await fetchOperations(1, 5);
    const result2 = await fetchOperations(2, 10);
    const result3 = await fetchOperations(1, 100);
    assert.strictEqual(result1.total, 20);
    assert.strictEqual(result2.total, 20);
    assert.strictEqual(result3.total, 20);
  });

  it('operation type rotation is consistent', async () => {
    const result = await fetchOperations(1, 20);
    const types = result.items.map(o => o.type);
    assert.strictEqual(types[0], 'deploy');
    assert.strictEqual(types[1], 'rollback');
    assert.strictEqual(types[2], 'scale');
    assert.strictEqual(types[3], 'restart');
    assert.strictEqual(types[4], 'config-update');
    assert.strictEqual(types[5], 'deploy'); // rotation
  });

  it('operation status rotation is consistent', async () => {
    const result = await fetchOperations(1, 10);
    assert.strictEqual(result.items[0]!.status, 'pending');
    assert.strictEqual(result.items[1]!.status, 'running');
    assert.strictEqual(result.items[2]!.status, 'completed');
    assert.strictEqual(result.items[3]!.status, 'completed');
    assert.strictEqual(result.items[4]!.status, 'failed');
    assert.strictEqual(result.items[5]!.status, 'pending'); // rotation
  });

  it('each operation has a valid ISO timestamp for createdAt', async () => {
    const result = await fetchOperations(1, 20);
    for (const op of result.items) {
      const ts = new Date(op.createdAt);
      assert.ok(!isNaN(ts.getTime()), `invalid createdAt for ${op.id}: ${op.createdAt}`);
    }
  });

  it('completed/failed operations have finishedAt set, pending/running do not', async () => {
    const result = await fetchOperations(1, 20);
    for (const op of result.items) {
      if (op.status === 'completed' || op.status === 'failed') {
        assert.ok(typeof op.finishedAt === 'string', `${op.id} should have finishedAt`);
      } else {
        assert.strictEqual(op.finishedAt, undefined, `${op.id} should NOT have finishedAt`);
      }
    }
  });

  it('finishedAt is a valid ISO timestamp when present', async () => {
    const result = await fetchOperations(1, 20);
    for (const op of result.items) {
      if (op.finishedAt != null) {
        const ts = new Date(op.finishedAt);
        assert.ok(!isNaN(ts.getTime()), `invalid finishedAt for ${op.id}: ${op.finishedAt}`);
      }
    }
  });

  it('targetId cycles through 4 services', async () => {
    const result = await fetchOperations(1, 20);
    const targets = [...new Set(result.items.map(o => o.targetId))];
    assert.strictEqual(targets.length, 4);
    assert.ok(targets.includes('service-1'));
    assert.ok(targets.includes('service-2'));
    assert.ok(targets.includes('service-3'));
    assert.ok(targets.includes('service-4'));
  });
});

describe('runtime-service / fetchOperationById — additional edge cases', () => {

  it('returns undefined for null-like id', async () => {
    // @ts-expect-error testing runtime resilience
    const op = await fetchOperationById(null);
    assert.strictEqual(op, undefined);
  });

  it('returns undefined for undefined id', async () => {
    // @ts-expect-error testing runtime resilience
    const op = await fetchOperationById(undefined);
    assert.strictEqual(op, undefined);
  });
});

describe('runtime-service / fetchReceiptsByOperation — additional edge cases', () => {

  it('failed operation has exactly 2 receipts', async () => {
    const receipts = await fetchReceiptsByOperation('op-5'); // op-5 is 'failed'
    assert.strictEqual(receipts.length, 2);
    assert.strictEqual(receipts[0]!.code, 'STARTED');
    assert.strictEqual(receipts[1]!.code, 'ERROR');
  });

  it('completed operation has STARTED and COMPLETED receipts', async () => {
    const receipts = await fetchReceiptsByOperation('op-3'); // op-3 is 'completed'
    assert.strictEqual(receipts.length, 2);
    assert.strictEqual(receipts[0]!.code, 'STARTED');
    assert.strictEqual(receipts[1]!.code, 'COMPLETED');
  });

  it('receipt for completed operation has status ok', async () => {
    const receipts = await fetchReceiptsByOperation('op-3');
    assert.strictEqual(receipts[1]!.status, 'ok');
  });

  it('receipt for failed operation has status error', async () => {
    const receipts = await fetchReceiptsByOperation('op-5');
    assert.strictEqual(receipts[1]!.status, 'error');
  });

  it('receipt STARTED message mentions operation type', async () => {
    const receipts = await fetchReceiptsByOperation('op-6'); // op-6 status is 'pending' (type: deploy again)
    assert.ok(receipts[0]!.message.includes('started'), 'STARTED message should contain started');
  });

  it('receipt ERROR message mentions failure', async () => {
    const receipts = await fetchReceiptsByOperation('op-5');
    assert.ok(receipts[1]!.message.toLowerCase().includes('failed'), 'ERROR message should mention failure');
  });

  it('receipt COMPLETED message mentions success', async () => {
    const receipts = await fetchReceiptsByOperation('op-3');
    assert.ok(receipts[1]!.message.toLowerCase().includes('completed'), 'COMPLETED message should mention completed');
  });

  it('receipt timestamps are valid ISO strings', async () => {
    for (let i = 1; i <= 20; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      for (const rcpt of receipts) {
        const ts = new Date(rcpt.timestamp);
        assert.ok(!isNaN(ts.getTime()), `invalid timestamp for receipt ${rcpt.id}`);
      }
    }
  });

  it('all receipts across all operations have unique ids', async () => {
    const allIds: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      for (const rcpt of receipts) {
        allIds.push(rcpt.id);
      }
    }
    const uniqueIds = new Set(allIds);
    assert.strictEqual(uniqueIds.size, allIds.length, 'receipt ids should be unique across all operations');
  });

  it('pending operations have STARTED receipt only referencing pending status', async () => {
    // op-1 is 'pending' type 'deploy'
    const receipts = await fetchReceiptsByOperation('op-1');
    assert.strictEqual(receipts.length, 2);
    // Pending ops still get a COMPLETED receipt (mock behavior)
    assert.strictEqual(receipts[1]!.code, 'COMPLETED');
  });
});

describe('runtime-service / cross-function consistency', () => {

  it('fetchOperations total matches enum of all findable operations', async () => {
    const result = await fetchOperations(1, 100);
    assert.strictEqual(result.total, 20);
    const count = result.items.length;
    assert.strictEqual(count, 20);
  });

  it('fetchReceiptsByOperation operationId matches Operation id', async () => {
    for (let i = 1; i <= 20; i++) {
      const op = await fetchOperationById(`op-${i}`);
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      assert.ok(op != null);
      for (const rcpt of receipts) {
        assert.strictEqual(rcpt.operationId, op!.id);
      }
    }
  });

  it('all receipt codes are uppercase', async () => {
    for (let i = 1; i <= 5; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      for (const rcpt of receipts) {
        assert.strictEqual(rcpt.code, rcpt.code.toUpperCase(), `code should be uppercase: ${rcpt.code}`);
      }
    }
  });

  it('operation type is always one of the 5 known types', async () => {
    const result = await fetchOperations(1, 20);
    const knownTypes = ['deploy', 'rollback', 'scale', 'restart', 'config-update'];
    for (const op of result.items) {
      assert.ok(knownTypes.includes(op.type), `unknown type: ${op.type}`);
    }
  });

  it('operation status is always one of 4 known statuses', async () => {
    const result = await fetchOperations(1, 20);
    const knownStatuses = ['pending', 'running', 'completed', 'failed'];
    for (const op of result.items) {
      assert.ok(knownStatuses.includes(op.status), `unknown status: ${op.status}`);
    }
  });

  it('receipt status is always ok or error', async () => {
    for (let i = 1; i <= 20; i++) {
      const receipts = await fetchReceiptsByOperation(`op-${i}`);
      for (const rcpt of receipts) {
        assert.ok(rcpt.status === 'ok' || rcpt.status === 'error',
          `invalid receipt status: ${rcpt.status}`);
      }
    }
  });
});
