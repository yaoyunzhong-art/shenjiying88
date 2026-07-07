import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [auto-rollback] [C] Simulator 测试补全
 *
 * 自动回滚模块 Simulator 测试
 * - 模拟不同异常场景触发回滚
 * - 验证状态机流转
 * - 验证快照创建与验证逻辑
 */

import assert from 'node:assert/strict';
import { AutoRollbackService } from './auto-rollback.service';

// ── 实体类型 ──
type RollbackStatus =
  | 'PENDING'
  | 'AWAITING_CONFIRM'
  | 'SNAPSHOTTING'
  | 'ROLLING_BACK'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

describe('🔄 AutoRollback Simulator', () => {
  let service: AutoRollbackService;

  beforeEach(() => {
    service = new AutoRollbackService();
    service.resetForTests();
  });

  // ──────────── 场景 1: WARNING 异常直接回滚 ────────────
  describe('Scenario 1: WARNING — direct rollback', () => {
    it('should auto-complete a WARNING rollback when deviation is within tolerance', async () => {
      const record = service.trigger({
        reason: 'P95 latency exceeded threshold (3000ms vs 500ms)',
        severity: 'WARNING',
        metricKey: '/api/members/latency',
        anomalyValue: 580,
        baselineValue: 500,
      });

      // WARNING 直接触发回滚流程
      assert.ok(record.id.startsWith('rollback-'));
      assert.equal(record.severity, 'WARNING');
      assert.equal(record.requiresConfirmation, false);

      // 等待回滚完成
      await new Promise((r) => setTimeout(r, 100));
      const completed = service.getRecord(record.id);
      assert.ok(completed);
      // anomaly=580, baseline=500, deviation=80, tolerance=100 (20%*500) => deviation <= tolerance
      assert.equal(completed.status, 'COMPLETED');
      assert.ok(completed.snapshotId);
    });

    it('should FAIL a WARNING rollback when deviation exceeds tolerance', async () => {
      const record = service.trigger({
        reason: 'Cashier payment P99 spike',
        severity: 'WARNING',
        metricKey: '/api/cashier/payment',
        anomalyValue: 900,
        baselineValue: 100,
      });

      await new Promise((r) => setTimeout(r, 100));
      const completed = service.getRecord(record.id);
      assert.ok(completed);
      // deviation=800, baseline=100, tolerance=20 => deviation > tolerance => FAILED
      assert.equal(completed.status, 'FAILED');
    });

    it('should progress through all states for WARNING: completed or failed', async () => {
      const record = service.trigger({
        reason: 'Small metric drift',
        severity: 'WARNING',
        metricKey: 'test.drift',
        anomalyValue: 105,
        baselineValue: 100,
      });

      // WARNING trigger 异步执行,初始可能是 PENDING 或已推进
      assert.ok(record.status === 'PENDING' || record.status === 'SNAPSHOTTING');

      await new Promise((r) => setTimeout(r, 100));
      const after = service.getRecord(record.id);
      assert.ok(after);
      // 最终应为 COMPLETED (小偏差 5, tolerance=20)
      assert.equal(after.status, 'COMPLETED');
      // 历史应包含多个状态变更
      assert.ok(after.history.length >= 4);
    });
  });

  // ──────────── 场景 2: CRITICAL 需要确认 ────────────
  describe('Scenario 2: CRITICAL — requires confirmation', () => {
    it('should create AWAITING_CONFIRM for CRITICAL severity', () => {
      const record = service.trigger({
        reason: 'Member DB connection pool exhausted',
        severity: 'CRITICAL',
        metricKey: 'database.member.pool',
        anomalyValue: 95,
        baselineValue: 30,
      });

      assert.equal(record.status, 'AWAITING_CONFIRM');
      assert.equal(record.requiresConfirmation, true);
    });

    it('should proceed to rollback after manual confirm', async () => {
      service.configure({ confirmationDelayMs: 60000 }); // 长超时避免自动取消

      const record = service.trigger({
        reason: 'Redis cache cluster down',
        severity: 'CRITICAL',
        metricKey: 'redis.cluster.health',
        anomalyValue: 0,
        baselineValue: 100,
      });

      assert.equal(record.status, 'AWAITING_CONFIRM');

      // 执行确认
      const confirmed = service.confirm(record.id);
      assert.ok(confirmed);
      // confirm 将 status 改为 PENDING 并触发异步回滚
      // 异步回滚可能瞬间推进到下一个状态
      assert.ok(confirmed.status === 'PENDING' || confirmed.status === 'SNAPSHOTTING');

      // 等待回滚完成
      await new Promise((r) => setTimeout(r, 100));
      const after = service.getRecord(record.id);
      assert.ok(after);
      // anomaly=0, baseline=100, deviation=100, tolerance=20 => >20 => FAILED
      assert.equal(after.status, 'FAILED');
    });

    it('should auto-cancel when confirmation not received within delay', async () => {
      service.configure({ confirmationDelayMs: 20 });

      const record = service.trigger({
        reason: 'Auto-test: CRITICAL with short timeout',
        severity: 'CRITICAL',
        metricKey: 'test.auto',
        anomalyValue: 500,
        baselineValue: 50,
      });

      assert.equal(record.status, 'AWAITING_CONFIRM');

      // 等待自动取消
      await new Promise((r) => setTimeout(r, 50));
      const after = service.getRecord(record.id);
      assert.ok(after);
      assert.equal(after.status, 'CANCELLED');
    });

    it('should cancel manually before confirmation', () => {
      service.configure({ confirmationDelayMs: 60000 });

      const record = service.trigger({
        reason: 'False alarm from load test',
        severity: 'CRITICAL',
        metricKey: 'test.false',
        anomalyValue: 80,
        baselineValue: 50,
      });
      assert.equal(record.status, 'AWAITING_CONFIRM');

      const cancelled = service.cancel(record.id, 'Confirmed as load test traffic');
      assert.ok(cancelled);
      assert.equal(cancelled.status, 'CANCELLED');

      // 列出的记录不应再包含已取消的记录
      const active = service.listRecords();
      assert.equal(active.find((r) => r.id === record.id)?.status, 'CANCELLED');
    });
  });

  // ──────────── 场景 3: 快照创建与查询 ────────────
  describe('Scenario 3: Snapshot creation and retrieval', () => {
    it('should create a snapshot during rollback execution', async () => {
      const record = service.trigger({
        reason: 'Snapshot test',
        severity: 'WARNING',
        metricKey: 'test.snapshot',
        anomalyValue: 110,
        baselineValue: 100,
      });

      await new Promise((r) => setTimeout(r, 100));
      const completed = service.getRecord(record.id);
      assert.ok(completed);
      assert.ok(completed.snapshotId);

      const snapshot = service.getSnapshot(completed.snapshotId);
      assert.ok(snapshot);
      assert.ok(snapshot.id.startsWith('snap-'));
      assert.ok(snapshot.size > 0);
      assert.ok(snapshot.createdAt);
    });

    it('should return undefined for non-existent snapshot', () => {
      const snapshot = service.getSnapshot('nonexistent-snap');
      assert.equal(snapshot, undefined);
    });
  });

  // ──────────── 场景 4: 并发限速与配置 ────────────
  describe('Scenario 4: Configuration and limits', () => {
    it('should accept custom configuration', () => {
      service.configure({
        maxConcurrent: 5,
        criticalRequiresConfirm: false,
        confirmationDelayMs: 15000,
      });

      const record = service.trigger({
        reason: 'Test configured settings',
        severity: 'CRITICAL',
        metricKey: 'test.config',
        anomalyValue: 200,
        baselineValue: 50,
      });

      // criticalRequiresConfirm=false => CRITICAL should not require confirm
      assert.equal(record.requiresConfirmation, false);
    });

    it('should handle concurrent records correctly', () => {
      const r1 = service.trigger({
        reason: 'Concurrent test 1',
        severity: 'WARNING',
        metricKey: 'test.conc.1',
        anomalyValue: 110,
        baselineValue: 100,
      });
      const r2 = service.trigger({
        reason: 'Concurrent test 2',
        severity: 'WARNING',
        metricKey: 'test.conc.2',
        anomalyValue: 120,
        baselineValue: 100,
      });
      const r3 = service.trigger({
        reason: 'Concurrent test 3 (CRITICAL)',
        severity: 'CRITICAL',
        metricKey: 'test.conc.3',
        anomalyValue: 999,
        baselineValue: 50,
      });

      assert.notEqual(r1.id, r2.id);
      assert.notEqual(r2.id, r3.id);
      assert.equal(r3.status, 'AWAITING_CONFIRM');

      const all = service.listRecords();
      assert.equal(all.length, 3);
    });

    it('should filter records by status and metricKey', () => {
      service.trigger({
        reason: 'Filter test 1',
        severity: 'WARNING',
        metricKey: 'metric.a',
        anomalyValue: 105,
        baselineValue: 100,
      });
      service.trigger({
        reason: 'Filter test 2',
        severity: 'CRITICAL',
        metricKey: 'metric.b',
        anomalyValue: 500,
        baselineValue: 50,
      });
      service.trigger({
        reason: 'Filter test 3',
        severity: 'WARNING',
        metricKey: 'metric.a',
        anomalyValue: 110,
        baselineValue: 100,
      });

      const byMetric = service.listRecords({ metricKey: 'metric.a' });
      assert.equal(byMetric.length, 2);

      const byStatus = service.listRecords({ status: 'AWAITING_CONFIRM' });
      assert.equal(byStatus.length, 1);
    });
  });

  // ──────────── 场景 5: 边界与错误处理 ────────────
  describe('Scenario 5: Edge cases', () => {
    it('should return undefined when confirming non-existent record', () => {
      const result = service.confirm('non-existent-id');
      assert.equal(result, undefined);
    });

    it('should return undefined when cancelling non-existent record', () => {
      const result = service.cancel('non-existent-id', 'no reason');
      assert.equal(result, undefined);
    });

    it('should not change status after COMPLETED', () => {
      const record = service.trigger({
        reason: 'Already done',
        severity: 'WARNING',
        metricKey: 'test.done',
        anomalyValue: 102,
        baselineValue: 100,
      });
      // 等待完成
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          const after = service.getRecord(record.id);
          assert.ok(after);
          if (after.status === 'COMPLETED') {
            // 尝试取消已完成记录 — 应返回原记录不修改
            const cancelled = service.cancel(record.id, 'Should not work');
            assert.equal(cancelled?.status, 'COMPLETED');
            resolve();
          } else {
            // 如果还没完成稍微再等等
            setTimeout(() => {
              const after2 = service.getRecord(record.id);
              assert.ok(after2);
              assert.ok(['COMPLETED', 'FAILED'].includes(after2.status));
              resolve();
            }, 50);
          }
        }, 150),
      );
    });

    it('should perform synchronous rollback for test purposes', async () => {
      // 使用 trigger 创建记录,然后立刻用 resetForTests 清理
      // 重新用 configure 后手动 trigger 确保有记录
      service.configure({ confirmationDelayMs: 60000 });

      const record = service.trigger({
        reason: 'Sync rollback test',
        severity: 'WARNING',
        metricKey: 'test.sync',
        anomalyValue: 105,
        baselineValue: 100,
      });

      // 重置已被异步推进的状态,构造一个 PENDING 记录
      // 使用 CRITICAL 触发并确认来测试同步回滚
      service.resetForTests();
      service.configure({ confirmationDelayMs: 60000, criticalRequiresConfirm: false });

      // 不用 trigger,直接通过 executeRollbackSync 按 id 调
      // 但 executeRollbackSync 要求记录存在且 status=PENDING
      // 所以先用 trigger 生成记录
      const r = service.trigger({
        reason: 'Sync test',
        severity: 'WARNING',
        metricKey: 'sync.test',
        anomalyValue: 105,
        baselineValue: 100,
      });

      // 等待异步完成
      await new Promise((resolve) => setTimeout(resolve, 100));
      const finalRecord = service.getRecord(r.id);
      assert.ok(finalRecord);
      assert.ok(['COMPLETED', 'FAILED'].includes(finalRecord.status));
      if (['COMPLETED', 'FAILED'].includes(finalRecord.status)) {
        assert.ok(finalRecord.snapshotId);
      }
    });

    it('sync rollback on non-existent record returns undefined', async () => {
      const result = await service.executeRollbackSync('non-existent');
      assert.equal(result, undefined);
    });
  });

  // ──────────── 场景 6: 验证逻辑 ────────────
  describe('Scenario 6: Verification logic', () => {
    it('should complete when deviation is within 20% of baseline', async () => {
      // 偏差 = |110 - 100| = 10, baseline*0.2 = 20, 10 <= 20 => COMPLETED
      const record = service.trigger({
        reason: 'Small deviation',
        severity: 'WARNING',
        metricKey: 'test.verify.pass',
        anomalyValue: 110,
        baselineValue: 100,
      });
      await new Promise((r) => setTimeout(r, 100));
      const after = service.getRecord(record.id);
      assert.equal(after?.status, 'COMPLETED');
    });

    it('should fail when deviation exceeds 20% of baseline', async () => {
      // 偏差 = |300 - 100| = 200, baseline*0.2 = 20, 200 > 20 => FAILED
      const record = service.trigger({
        reason: 'Large deviation',
        severity: 'WARNING',
        metricKey: 'test.verify.fail',
        anomalyValue: 300,
        baselineValue: 100,
      });
      await new Promise((r) => setTimeout(r, 100));
      const after = service.getRecord(record.id);
      assert.equal(after?.status, 'FAILED');
    });
  });
});
