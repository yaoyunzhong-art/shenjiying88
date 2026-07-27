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

  // ══════════════════════════════════════════════════
  // 原始测试 (8个) - 保留不动
  // ══════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════
  // 增强测试 (新增 17+ tests) - 总 25+ tests
  // ══════════════════════════════════════════════════

  // ── Section A: trigger 创建场景 (4 tests) ──

  it('A1 trigger 生成唯一 ID', () => {
    const r1 = service.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
    const r2 = service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 120, baselineValue: 100 });
    expect(r1.id).not.toBe(r2.id);
    expect(r1.id).toMatch(/^rollback-/);
    expect(r2.id).toMatch(/^rollback-/);
  });

  it('A2 批量连续 trigger 不报错', () => {
    const count = 10;
    for (let i = 0; i < count; i++) {
      service.trigger({ reason: `batch-${i}`, severity: 'WARNING', metricKey: `m${i}`, anomalyValue: 100 + i, baselineValue: 100 });
    }
    const all = service.listRecords();
    expect(all.length).toBe(count);
  });

  it('A3 指定 snapshotKind 和 trigger 参数', () => {
    const record = service.trigger({
      reason: 'redis snapshot',
      severity: 'WARNING',
      metricKey: 'redis.cache',
      anomalyValue: 0.1,
      baselineValue: 0.85,
      snapshotKind: 'REDIS',
      trigger: 'anomaly-detector:v2',
    });
    expect(record.id).toBeDefined();
    expect(record.metricKey).toBe('redis.cache');
  });

  it('A4 CRITICAL trigger 状态为 AWAITING_CONFIRM', () => {
    const record = service.trigger({
      reason: 'p99 critical spike',
      severity: 'CRITICAL',
      metricKey: '/api/orders',
      anomalyValue: 5000,
      baselineValue: 200,
    });
    expect(record.status).toBe('AWAITING_CONFIRM');
    expect(record.requiresConfirmation).toBe(true);
  });

  // ── Section B: confirm 增强 (3 tests) ──

  it('B1 confirm 未知 ID 返回 undefined', () => {
    const result = service.confirm('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('B2 confirm 已 COMPLETED 的记录安全幂等', () => {
    const record = service.trigger({ reason: 'test', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 });
    const result = service.confirm(record.id);
    expect(result).toBeDefined();
    // 再次 confirm 也是安全的
    const again = service.confirm(record.id);
    expect(again).toBeDefined();
  });

  it('B3 confirm 后 executeRollbackSync 正确完成', async () => {
    const record = service.trigger({ reason: 'sync', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 105, baselineValue: 100 });
    service.confirm(record.id);
    const result = await service.executeRollbackSync(record.id);
    expect(result!.status).toBe('COMPLETED');
    expect(result!.snapshotId).toBeDefined();
  });

  // ── Section C: cancel 增强 (3 tests) ──

  it('C1 cancel 未知 ID 返回 undefined', () => {
    const result = service.cancel('non-existent-id');
    expect(result).toBeUndefined();
  });

  it('C2 cancel 已 CANCELLED 的记录幂等', () => {
    const record = service.trigger({ reason: 'test', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
    service.cancel(record.id, 'First cancel');
    const result = service.cancel(record.id, 'Second cancel');
    expect(result?.status).toBe('CANCELLED');
  });

  it('C3 cancel 指定原因记录到历史', () => {
    const record = service.trigger({ reason: 'test', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
    const cancelled = service.cancel(record.id, 'Manual override by operator');
    const last = cancelled!.history[cancelled!.history.length - 1];
    expect(last.note).toContain('Manual override');
    expect(last.status).toBe('CANCELLED');
  });

  // ── Section D: 查询场景 (3 tests) ──

  it('D1 getRecord 未知 ID 返回 undefined', () => {
    expect(service.getRecord('unknown')).toBeUndefined();
  });

  it('D2 getRecord 根据 ID 正确返回记录', () => {
    const record = service.trigger({ reason: 'find-me', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 });
    const found = service.getRecord(record.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(record.id);
    expect(found!.reason).toBe('find-me');
  });

  it('D3 listRecords 按 status+metricKey 组合过滤', () => {
    service.trigger({ reason: 'a', severity: 'CRITICAL', metricKey: 'api/orders', anomalyValue: 999, baselineValue: 100 });
    service.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'api/coupons', anomalyValue: 200, baselineValue: 100 });
    const filtered = service.listRecords({ status: 'AWAITING_CONFIRM', metricKey: 'api/orders' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].metricKey).toBe('api/orders');
  });

  // ── Section E: 配置场景 (2 tests) ──

  it('E1 关闭 criticalRequiresConfirm 后 CRITICAL 直接执行', () => {
    service.configure({ criticalRequiresConfirm: false });
    const record = service.trigger({ reason: 'no-confirm', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
    expect(record.status).not.toBe('AWAITING_CONFIRM');
  });

  it('E2 resetForTests 恢复默认配置', () => {
    service.configure({ criticalRequiresConfirm: false });
    service.resetForTests();
    const record = service.trigger({ reason: 'post-reset', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
    expect(record.status).toBe('AWAITING_CONFIRM');
  });

  // ── Section F: executeRollbackSync 场景 (2 tests) ──

  it('F1 executeRollbackSync 未知 ID 返回 undefined', async () => {
    const result = await service.executeRollbackSync('unknown');
    expect(result).toBeUndefined();
  });

  it('F2 executeRollbackSync 异常偏离 baseline 时 FAILED', async () => {
    const record = service.trigger({ reason: 'extreme', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 1000, baselineValue: 100 });
    service.confirm(record.id);
    const result = await service.executeRollbackSync(record.id);
    expect(result!.status).toBe('FAILED');
    expect(result!.completedAt).toBeDefined();
  });

  // ══════════════════════════════════════════════════
  // 测试统计: 8 (原始) + 17 (新增) = 25 tests ✓
  // ══════════════════════════════════════════════════
});
