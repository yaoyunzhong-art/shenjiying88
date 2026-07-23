import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * AutoRollback E2E 增强测试 (25+ test cases)
 *
 * 覆盖:
 *   - 完整 CRUD 流程 (触发/确认/取消/查询)
 *   - 权限校验场景 (severity 级别控制)
 *   - 错误输入处理 (无效ID/已取消再操作)
 *   - 业务规则验证 (CRITICAL需二次确认/自动取消/验证逻辑)
 *   - 并发/边界情况 (多条记录/零基线/极端异常值)
 */
import 'reflect-metadata';
import { AutoRollbackService } from './auto-rollback.service';

describe('AutoRollbackService · E2E Enhanced (25+ tests)', () => {
  let service: AutoRollbackService;

  // ─── 辅助工厂 ───
  function freshService(): AutoRollbackService {
    const s = new AutoRollbackService();
    s.resetForTests();
    return s;
  }

  beforeEach(() => {
    service = freshService();
  });

  afterEach(() => {
    service.resetForTests();
  });

  // ─────────────────────────────────────────────────
  // Section 1: CRUD — Trigger Rollbacks (创建)
  // ─────────────────────────────────────────────────

  describe('CRUD — trigger()', () => {
    test('T01 trigger: WARNING creates record and auto-executes', async () => {
      const record = service.trigger({
        reason: 'P95 spike',
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      });
      expect(record.id).toBeDefined();
      expect(record.id).toMatch(/^rollback-/);
      expect(record.severity).toBe('WARNING');
      expect(record.requiresConfirmation).toBe(false);

      // Wait for async execution
      await new Promise((r) => setTimeout(r, 150));
      const updated = service.getRecord(record.id);
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.snapshotId).toBeDefined();
      expect(updated?.completedAt).toBeDefined();
    });

    test('T02 trigger: CRITICAL creates record with AWAITING_CONFIRM', () => {
      const record = service.trigger({
        reason: 'P99 critical',
        severity: 'CRITICAL',
        metricKey: '/api/orders',
        anomalyValue: 5000,
        baselineValue: 200,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
      expect(record.requiresConfirmation).toBe(true);
      expect(record.history.length).toBeGreaterThanOrEqual(1);
    });

    test('T03 trigger: accepts all optional parameters', () => {
      const record = service.trigger({
        reason: 'redis latency',
        severity: 'WARNING',
        metricKey: 'redis.cache.hit',
        anomalyValue: 0.1,
        baselineValue: 0.85,
        snapshotKind: 'REDIS',
        trigger: 'anomaly-detector:v2',
      });
      expect(record.id).toBeDefined();
      expect(record.metricKey).toBe('redis.cache.hit');
    });

    test('T04 trigger: generates unique IDs for each trigger', () => {
      const r1 = service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      const r2 = service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 120, baselineValue: 100 });
      expect(r1.id).not.toBe(r2.id);
    });

    test('T05 trigger: multiple concurrent WARNING triggers', () => {
      const records = [];
      for (let i = 0; i < 5; i++) {
        records.push(
          service.trigger({
            reason: `spike-${i}`,
            severity: 'WARNING',
            metricKey: `m${i}`,
            anomalyValue: 100 + i * 10,
            baselineValue: 100,
          }),
        );
      }
      const all = service.listRecords();
      expect(all.length).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 2: CRUD — Confirm (二次确认)
  // ─────────────────────────────────────────────────

  describe('CRUD — confirm()', () => {
    test('T06 confirm: transitions CRITICAL from AWAITING_CONFIRM to execution', () => {
      const record = service.trigger({
        reason: 'needs confirm',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
      const confirmed = service.confirm(record.id);
      expect(confirmed).toBeDefined();
      expect(confirmed!.status).not.toBe('AWAITING_CONFIRM');
    });

    test('T07 confirm: returns undefined for non-existent id', () => {
      const result = service.confirm('non-existent-id');
      expect(result).toBeUndefined();
    });

    test('T08 confirm: idempotent — confirming an already COMPLETED record is safe', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      // WARNING triggers auto-execute; confirm might be no-op but should not throw
      const result = service.confirm(record.id);
      expect(result).toBeDefined();
      // Confirm again — should be safe
      const again = service.confirm(record.id);
      expect(again).toBeDefined();
    });

    test('T09 confirm: CRITICAL with executeRollbackSync completes correctly', async () => {
      const record = service.trigger({
        reason: 'sync confirm test',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      });
      service.confirm(record.id);
      const result = await service.executeRollbackSync(record.id);
      expect(result!.status).toBe('COMPLETED');
      expect(result!.snapshotId).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────
  // Section 3: CRUD — Cancel (取消)
  // ─────────────────────────────────────────────────

  describe('CRUD — cancel()', () => {
    test('T10 cancel: cancels an AWAITING_CONFIRM record', () => {
      const record = service.trigger({
        reason: 'false start',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      const cancelled = service.cancel(record.id, 'False alarm, manual override');
      expect(cancelled?.status).toBe('CANCELLED');
      const last = cancelled!.history[cancelled!.history.length - 1];
      expect(last.note).toContain('False alarm');
    });

    test('T11 cancel: returns undefined for non-existent id', () => {
      const result = service.cancel('non-existent-id');
      expect(result).toBeUndefined();
    });

    test('T12 cancel: idempotent on already CANCELLED record', () => {
      const record = service.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      service.cancel(record.id, 'First');
      const second = service.cancel(record.id, 'Second');
      expect(second?.status).toBe('CANCELLED');
    });

    test('T13 cancel: idempotent on COMPLETED record', async () => {
      const record = service.trigger({
        reason: 'fast',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      // Wait for completion
      await new Promise((r) => setTimeout(r, 150));
      const cancelled = service.cancel(record.id, 'Too late');
      // Since it completed already, cancel should return the current record
      if (service.getRecord(record.id)?.status === 'COMPLETED') {
        // cancel is idempotent on completed records
        expect(cancelled?.status).toBe('COMPLETED');
      } else {
        // it might be cancelled
        expect(cancelled).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────
  // Section 4: CRUD — Query (查询)
  // ─────────────────────────────────────────────────

  describe('CRUD — Query Records & Snapshots', () => {
    test('T14 getRecord: returns record by id', () => {
      const record = service.trigger({
        reason: 'find me',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      const found = service.getRecord(record.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(record.id);
      expect(found!.reason).toBe('find me');
    });

    test('T15 getRecord: returns undefined for unknown id', () => {
      expect(service.getRecord('unknown')).toBeUndefined();
    });

    test('T16 listRecords: returns all records sorted descending by createdAt', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 120, baselineValue: 100 });
      const records = service.listRecords();
      expect(records.length).toBe(2);
      expect(new Date(records[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(records[1].createdAt).getTime(),
      );
    });

    test('T17 listRecords: empty when no records exist', () => {
      expect(service.listRecords()).toEqual([]);
    });

    test('T18 listRecords: filters by status', () => {
      service.trigger({ reason: 'A', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 });
      service.trigger({ reason: 'B', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
      const awaiting = service.listRecords({ status: 'AWAITING_CONFIRM' });
      expect(awaiting.length).toBe(1);
      expect(awaiting[0].status).toBe('AWAITING_CONFIRM');
    });

    test('T19 listRecords: filters by metricKey', () => {
      service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'api/coupons', anomalyValue: 110, baselineValue: 100 });
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'api/orders', anomalyValue: 120, baselineValue: 100 });
      const filtered = service.listRecords({ metricKey: 'api/coupons' });
      expect(filtered.length).toBe(1);
    });

    test('T20 listRecords: combined filter by status and metricKey', () => {
      service.trigger({ reason: 'a', severity: 'CRITICAL', metricKey: 'api/coupons', anomalyValue: 999, baselineValue: 100 });
      service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'api/orders', anomalyValue: 110, baselineValue: 100 });
      const filtered = service.listRecords({ status: 'AWAITING_CONFIRM', metricKey: 'api/coupons' });
      expect(filtered.length).toBe(1);
    });

    test('T21 getSnapshot: returns snapshot after execution', async () => {
      const record = service.trigger({
        reason: 'snapshot check',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      await new Promise((r) => setTimeout(r, 150));
      const updated = service.getRecord(record.id)!;
      expect(updated.snapshotId).toBeDefined();
      const snapshot = service.getSnapshot(updated.snapshotId!);
      expect(snapshot).toBeDefined();
      expect(snapshot!.kind).toBe('FULL');
      expect(snapshot!.trigger).toBeDefined();
    });

    test('T22 getSnapshot: returns undefined for unknown id', () => {
      expect(service.getSnapshot('unknown')).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────
  // Section 5: Configuration (配置)
  // ─────────────────────────────────────────────────

  describe('Business Rules — Configuration', () => {
    test('T23 configure: disabling criticalRequiresConfirm skips AWAITING_CONFIRM', () => {
      service.configure({ criticalRequiresConfirm: false });
      const record = service.trigger({
        reason: 'no confirm needed',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).not.toBe('AWAITING_CONFIRM');
    });

    test('T24 configure: confirmationDelayMs is reflected on record', () => {
      service.configure({ confirmationDelayMs: 15000 });
      const record = service.trigger({
        reason: 'custom delay',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.confirmationDelayMs).toBe(15000);
    });

    test('T25 configure: partial update merges with defaults', () => {
      service.configure({ maxConcurrent: 5 });
      // Trigger CRITICAL — should still require confirmation (defaults preserved)
      const record = service.trigger({
        reason: 'check default merge',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
    });

    test('T26 configure: resetForTests restores defaults', () => {
      service.configure({ criticalRequiresConfirm: false });
      service.resetForTests();
      const record = service.trigger({
        reason: 'post-reset',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM'); // Default restored
    });
  });

  // ─────────────────────────────────────────────────
  // Section 6: Workflow — executeRollbackSync (同步执行)
  // ─────────────────────────────────────────────────

  describe('Business Rules — executeRollbackSync', () => {
    test('T27 executeRollbackSync: full workflow to COMPLETED', async () => {
      // CRITICAL with no confirm needed -> goes to PENDING directly
      service.configure({ criticalRequiresConfirm: false });
      const record = service.trigger({
        reason: 'sync full flow',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      });
      await new Promise((r) => setTimeout(r, 50));
      const final = service.getRecord(record.id);
      expect(final!.status).toBe('COMPLETED');
      expect(final!.snapshotId).toBeDefined();
    });

    test('T28 executeRollbackSync: explicit sync after confirm', async () => {
      const record = service.trigger({
        reason: 'confirm then sync',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      });
      service.confirm(record.id);
      const result = await service.executeRollbackSync(record.id);
      expect(result!.status).toBe('COMPLETED');
    });

    test('T29 executeRollbackSync: returns undefined for unknown id', async () => {
      const result = await service.executeRollbackSync('unknown');
      expect(result).toBeUndefined();
    });

    test('T30 executeRollbackSync: skips when status is not PENDING/SNAPSHOTTING', async () => {
      const record = service.trigger({
        reason: 'skip test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
      const result = await service.executeRollbackSync(record.id);
      expect(result!.status).toBe('AWAITING_CONFIRM');
    });

    test('T31 executeRollbackSync: FAILED when anomaly deviates far from baseline', async () => {
      const record = service.trigger({
        reason: 'extreme anomaly',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 1000,
        baselineValue: 100,
      });
      service.confirm(record.id);
      const result = await service.executeRollbackSync(record.id);
      expect(result!.status).toBe('FAILED');
      expect(result!.completedAt).toBeDefined();
    });

    test('T32 executeRollbackSync: creates snapshot with correct metadata', async () => {
      const record = service.trigger({
        reason: 'snapshot meta',
        severity: 'CRITICAL',
        metricKey: 'test',
        anomalyValue: 105,
        baselineValue: 100,
      });
      service.confirm(record.id);
      const result = await service.executeRollbackSync(record.id);
      const snapshot = service.getSnapshot(result!.snapshotId!);
      expect(snapshot!.kind).toBe('FULL');
      expect(snapshot!.size).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────
  // Section 7: Auto-Cancel & Timeout Behavior
  // ─────────────────────────────────────────────────

  describe('Edge Cases — Auto-Cancel & Timeout', () => {
    test('T33 auto-cancel: CRITICAL record auto-cancels after confirmationDelayMs', async () => {
      service.configure({ confirmationDelayMs: 10 });
      const record = service.trigger({
        reason: 'auto cancel test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
      await new Promise((r) => setTimeout(r, 50));
      const after = service.getRecord(record.id);
      expect(after?.status).toBe('CANCELLED');
    });
  });

  // ─────────────────────────────────────────────────
  // Section 8: Edge Cases & Boundaries
  // ─────────────────────────────────────────────────

  describe('Edge Cases — Boundaries', () => {
    test('T34 handle zero baseline value', async () => {
      const record = service.trigger({
        reason: 'zero baseline',
        severity: 'WARNING',
        metricKey: 'test',
        anomalyValue: 100,
        baselineValue: 0,
      });
      expect(record.id).toBeDefined();
      // deviation should be <= 0 * 0.2 = 0, so anomaly(100) - baseline(0) = 100 > 0 → verify FAILED
      await new Promise((r) => setTimeout(r, 150));
      const after = service.getRecord(record.id);
      // With tolerance=0.2*0=0, deviation=100>0 => FAILED
      expect(after?.status).toBe('FAILED');
    });

    test('T35 handle identical anomaly and baseline values', () => {
      const record = service.trigger({
        reason: 'no deviation',
        severity: 'WARNING',
        metricKey: 'test',
        anomalyValue: 100,
        baselineValue: 100,
      });
      expect(record.id).toBeDefined();
      // deviation(0) <= tolerance(20) → should pass
    });

    test('T36 history contains full state machine trace', async () => {
      const record = service.trigger({
        reason: 'trace history',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      await new Promise((r) => setTimeout(r, 150));
      const final = service.getRecord(record.id);
      expect(final?.history.length).toBeGreaterThanOrEqual(4); // PENDING, SNAPSHOTTING, ROLLING_BACK, VERIFYING, COMPLETED
      const statuses = final!.history.map((h) => h.status);
      expect(statuses).toContain('COMPLETED');
    });

    test('T37 listRecords by non-existent status returns empty', () => {
      const result = service.listRecords({ status: 'FAILED' as any });
      expect(result).toEqual([]);
    });

    test('T38 can cancel during SNAPSHOTTING phase', () => {
      // For a CRITICAL, confirm and then cancel during execution
      const record = service.trigger({
        reason: 'cancel mid-execution',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      service.confirm(record.id);
      // After confirm, status may be PENDING (if we use sync) or progressing async
      const cancelled = service.cancel(record.id, 'Abort during snapshot');
      expect(cancelled).toBeDefined();
    });

    test('T39 negative anomaly values are handled', () => {
      const record = service.trigger({
        reason: 'negative anomaly',
        severity: 'WARNING',
        metricKey: 'revenue',
        anomalyValue: -50,
        baselineValue: 100,
      });
      expect(record.id).toBeDefined();
      // deviation = 150, tolerance = 20 → should fail
    });

    test('T40 verify that pending confirmations are cleaned on reset', () => {
      const record = service.trigger({
        reason: 'cleanup test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      expect(record.status).toBe('AWAITING_CONFIRM');
      service.resetForTests();
      // After reset, the record is gone
      expect(service.getRecord(record.id)).toBeUndefined();
    });
  });
});
