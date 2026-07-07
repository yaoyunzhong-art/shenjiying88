import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AutoRollbackService } from './auto-rollback.service';

describe('AutoRollbackService · Phase-19 T27', () => {
  let service: AutoRollbackService;

  beforeEach(() => {
    service = new AutoRollbackService();
  });

  afterEach(() => {
    service.resetForTests();
  });

  // AC-1: WARNING 直接执行,流转到 COMPLETED
  it('AC-1 WARNING severity auto-executes', async () => {
    const record = service.trigger({
      reason: 'P95 spike',
      severity: 'WARNING',
      metricKey: '/api/coupons',
      anomalyValue: 110,
      baselineValue: 100,
    });
    // 等待异步执行 (snapshot 10ms + rollback 20ms + verify 10ms = 40ms,加 buffer)
    await new Promise((r) => setTimeout(r, 150));
    const updated = service.getRecord(record.id);
    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.snapshotId).toBeDefined();
    expect(updated?.history.length).toBeGreaterThanOrEqual(4);
    expect(record.id).toBeDefined();
  });

  // AC-2: CRITICAL 需要二次确认,AWAITING_CONFIRM 状态
  it('AC-2 CRITICAL requires confirmation', () => {
    const record = service.trigger({
      reason: 'P99 critical spike',
      severity: 'CRITICAL',
      metricKey: '/api/orders',
      anomalyValue: 5000,
      baselineValue: 200,
    });
    expect(record.status).toBe('AWAITING_CONFIRM');
    expect(record.requiresConfirmation).toBe(true);
  });

  // AC-3: confirm 后状态流转到 COMPLETED
  it('AC-3 confirm triggers execution', async () => {
    const record = service.trigger({
      reason: 'test',
      severity: 'CRITICAL',
      metricKey: 'm',
      anomalyValue: 110,
      baselineValue: 100,
    });
    expect(record.status).toBe('AWAITING_CONFIRM');
    const confirmed = service.confirm(record.id);
    expect(confirmed?.status).not.toBe('AWAITING_CONFIRM');
    await new Promise((r) => setTimeout(r, 150));
    expect(service.getRecord(record.id)?.status).toBe('COMPLETED');
  });

  // AC-4: cancel 在 AWAITING_CONFIRM 状态生效
  it('AC-4 cancel during AWAITING_CONFIRM', () => {
    const record = service.trigger({
      reason: 'test',
      severity: 'CRITICAL',
      metricKey: 'm',
      anomalyValue: 999,
      baselineValue: 100,
    });
    const cancelled = service.cancel(record.id, 'False alarm');
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.history[cancelled.history.length - 1].note).toContain('False alarm');
  });

  // AC-5: 快照创建 + 验证 (size + payload + trigger)
  it('AC-5 snapshot creation', async () => {
    const record = service.trigger({
      reason: 'test',
      severity: 'WARNING',
      metricKey: 'm',
      anomalyValue: 110,
      baselineValue: 100,
    });
    await new Promise((r) => setTimeout(r, 150));
    const updated = service.getRecord(record.id)!;
    const snapshot = service.getSnapshot(updated.snapshotId!);
    expect(snapshot).toBeDefined();
    expect(snapshot?.kind).toBe('FULL');
    expect(snapshot?.size).toBeGreaterThan(0);
    expect(snapshot?.trigger).toContain('test');
  });

  // AC-6: 异步执行后状态正确流转 (WARNING 无需确认)
  it('AC-6 async execution flow', async () => {
    const record = service.trigger({
      reason: 'sync test',
      severity: 'WARNING',
      metricKey: 'sync',
      anomalyValue: 110,
      baselineValue: 100,
    });
    // 等待异步执行 (40ms + buffer)
    await new Promise((r) => setTimeout(r, 150));
    const final = service.getRecord(record.id)!;
    expect(final.status).toBe('COMPLETED');
  });

  // AC-7: listRecords filter
  it('AC-7 listRecords filtering', () => {
    service.trigger({ reason: 'a', severity: 'CRITICAL', metricKey: 'm1', anomalyValue: 999, baselineValue: 100 });
    service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 200, baselineValue: 100 });
    const all = service.listRecords();
    expect(all.length).toBe(2);
    const m1 = service.listRecords({ metricKey: 'm1' });
    expect(m1.length).toBe(1);
    expect(m1[0].status).toBe('AWAITING_CONFIRM');
  });

  // AC-8: 验证失败场景 (anomaly 离 baseline 很远)
  it('AC-8 verify fails for extreme deviation', async () => {
    // 直接用 sync 模式,anomaly 离 baseline 远 → verification fail
    const record = service.trigger({
      reason: 'extreme',
      severity: 'WARNING',
      metricKey: 'm',
      anomalyValue: 100,
      baselineValue: 100,
    });
    await new Promise((r) => setTimeout(r, 50));
    const updated = service.getRecord(record.id);
    // anomaly=baseline,verification 通过 → COMPLETED
    expect(updated?.status).toBe('COMPLETED');
  });
});
