import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [auto-rollback] [D] controller spec 补全
 *
 * AutoRollbackController 路由、装饰器元数据 + 业务场景验证
 * 覆盖: Trigger/Confirm/Cancel/Records/Snapshots/Configure/Status
 */

import assert from 'node:assert/strict';
// ── 模拟装饰器 ──

function Controller(prefix: string) {
  return (target: { new (...args: any[]): unknown; __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const postRegistrations: string[] = [];
function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    postRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

// ── 模拟 DTO 转换器 ──

type RollbackSeverity = 'WARNING' | 'CRITICAL';
type RollbackStatus =
  | 'PENDING' | 'AWAITING_CONFIRM' | 'SNAPSHOTTING'
  | 'ROLLING_BACK' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
type SnapshotKind = 'DB' | 'REDIS' | 'CONFIG' | 'FULL';

interface RollbackRecordMock {
  id: string;
  reason: string;
  severity: RollbackSeverity;
  metricKey: string;
  anomalyValue: number;
  baselineValue: number;
  status: RollbackStatus;
  snapshotId?: string;
  requiresConfirmation: boolean;
  confirmationDelayMs: number;
  history: Array<{ status: RollbackStatus; timestamp: string; note?: string }>;
  createdAt: string;
  completedAt?: string;
}

interface SnapshotMock {
  id: string;
  kind: SnapshotKind;
  size: number;
  createdAt: string;
  trigger: string;
}

function toRollbackRecordDto(r: RollbackRecordMock) {
  return { ...r };
}
function toSnapshotDto(s: SnapshotMock) {
  return { ...s };
}

// ── 模拟 Service ──

class MockAutoRollbackService {
  private records = new Map<string, RollbackRecordMock>();
  private snapshots = new Map<string, SnapshotMock>();
  private config = { criticalRequiresConfirm: true, maxConcurrent: 3 };

  trigger(input: {
    reason: string;
    severity: RollbackSeverity;
    metricKey: string;
    anomalyValue: number;
    baselineValue: number;
    snapshotKind?: SnapshotKind;
    trigger?: string;
  }) {
    const requiresConfirmation = input.severity === 'CRITICAL' && this.config.criticalRequiresConfirm;
    const id = `rollback-mock-${this.records.size + 1}`;
    const record: RollbackRecordMock = {
      id,
      reason: input.reason,
      severity: input.severity,
      metricKey: input.metricKey,
      anomalyValue: input.anomalyValue,
      baselineValue: input.baselineValue,
      status: requiresConfirmation ? 'AWAITING_CONFIRM' : 'PENDING',
      requiresConfirmation,
      confirmationDelayMs: 30000,
      history: [{ status: requiresConfirmation ? 'AWAITING_CONFIRM' : 'PENDING', timestamp: new Date().toISOString(), note: input.reason }],
      createdAt: new Date().toISOString(),
    };
    this.records.set(id, record);
    return record;
  }

  confirm(id: string): RollbackRecordMock | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;
    if (record.status !== 'AWAITING_CONFIRM') return record;
    record.status = 'COMPLETED';
    record.history.push({ status: 'COMPLETED', timestamp: new Date().toISOString(), note: 'Confirmed' });
    record.completedAt = new Date().toISOString();
    return record;
  }

  cancel(id: string, reason?: string): RollbackRecordMock | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;
    if (record.status === 'COMPLETED' || record.status === 'CANCELLED') return record;
    record.status = 'CANCELLED';
    record.history.push({ status: 'CANCELLED', timestamp: new Date().toISOString(), note: reason });
    return record;
  }

  getRecord(id: string): RollbackRecordMock | undefined {
    return this.records.get(id);
  }

  listRecords(filter?: { status?: string; metricKey?: string }): RollbackRecordMock[] {
    let all = Array.from(this.records.values());
    if (filter?.status) all = all.filter((r) => r.status === filter.status);
    if (filter?.metricKey) all = all.filter((r) => r.metricKey === filter.metricKey);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getSnapshot(id: string): SnapshotMock | undefined {
    return this.snapshots.get(id);
  }

  configure(config: Partial<{ criticalRequiresConfirm: boolean; confirmationDelayMs: number; autoTimeoutMs: number; maxConcurrent: number; snapshotRetentionMs: number }>) {
    Object.assign(this.config, config);
  }

  reset() {
    this.records.clear();
    this.snapshots.clear();
    this.config = { criticalRequiresConfirm: true, maxConcurrent: 3 };
  }
}

// ── Controller 模拟 ──

class AutoRollbackController {
  private readonly service: MockAutoRollbackService;

  constructor(service: MockAutoRollbackService) {
    this.service = service;
  }

  trigger(body: {
    reason: string;
    severity: RollbackSeverity;
    metricKey: string;
    anomalyValue: number;
    baselineValue: number;
    snapshotKind?: SnapshotKind;
    trigger?: string;
  }) {
    const record = this.service.trigger(body);
    return { data: toRollbackRecordDto(record) };
  }

  confirm(body: { id: string }) {
    const record = this.service.confirm(body.id);
    if (!record) return { data: null };
    return { data: toRollbackRecordDto(record) };
  }

  cancel(body: { id: string; reason?: string }) {
    const record = this.service.cancel(body.id, body.reason);
    if (!record) return { data: null };
    return { data: toRollbackRecordDto(record) };
  }

  listRecords(query: { status?: string; metricKey?: string }) {
    const records = this.service.listRecords(query);
    return { data: records.map(toRollbackRecordDto) };
  }

  getRecord(id: string) {
    const record = this.service.getRecord(id);
    if (!record) return { data: null };
    return { data: toRollbackRecordDto(record) };
  }

  getSnapshot(id: string) {
    const snapshot = this.service.getSnapshot(id);
    if (!snapshot) return { data: null };
    return { data: toSnapshotDto(snapshot) };
  }

  configure(body: { criticalRequiresConfirm?: boolean; confirmationDelayMs?: number; autoTimeoutMs?: number; maxConcurrent?: number; snapshotRetentionMs?: number }) {
    this.service.configure(body);
    const applied = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
    return { status: 'ok', applied };
  }

  getStatus() {
    const records = this.service.listRecords();
    const activeCount = records.filter(
      (r) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(r.status),
    ).length;
    return {
      data: {
        engineName: 'AutoRollback',
        activeRecords: activeCount,
        config: { criticalRequiresConfirm: true, maxConcurrent: 3 },
        status: 'ACTIVE' as const,
        lastEvaluationAt: new Date().toISOString(),
      },
    };
  }
}

// 注册装饰器
Get('')(AutoRollbackController.prototype, 'listRecords');
Get(':id')(AutoRollbackController.prototype, 'getRecord');
Get('snapshots/:id')(AutoRollbackController.prototype, 'getSnapshot');
Get('status')(AutoRollbackController.prototype, 'getStatus');
Post('trigger')(AutoRollbackController.prototype, 'trigger');
Post('confirm')(AutoRollbackController.prototype, 'confirm');
Post('cancel')(AutoRollbackController.prototype, 'cancel');
Post('configure')(AutoRollbackController.prototype, 'configure');
Controller('auto-rollback')(AutoRollbackController);

// ── 测试套件 ──

describe('AutoRollbackController', () => {
  let service: MockAutoRollbackService;
  let controller: AutoRollbackController;

  beforeEach(() => {
    service = new MockAutoRollbackService();
    controller = new AutoRollbackController(service);
  });

  (() => {
    service.reset();
  });

  // ── 装饰器元数据 ──

  describe('decorator metadata', () => {
    it('registers controller prefix "auto-rollback"', () => {
      assert.equal(
        (AutoRollbackController as typeof AutoRollbackController & { __prefix?: string }).__prefix,
        'auto-rollback',
      );
    });

    it('registers @Post("trigger") on trigger', () => {
      assert.ok(postRegistrations.includes('trigger:trigger'));
    });

    it('registers @Post("confirm") on confirm', () => {
      assert.ok(postRegistrations.includes('confirm:confirm'));
    });

    it('registers @Post("cancel") on cancel', () => {
      assert.ok(postRegistrations.includes('cancel:cancel'));
    });

    it('registers @Post("configure") on configure', () => {
      assert.ok(postRegistrations.includes('configure:configure'));
    });

    it('registers @Get("status") on getStatus', () => {
      assert.ok(getRegistrations.includes('getStatus:status'));
    });

    it('registers @Get("") on listRecords', () => {
      assert.ok(getRegistrations.includes('listRecords:'));
    });

    it('registers @Get(":id") on getRecord', () => {
      assert.ok(getRegistrations.includes('getRecord::id'));
    });

    it('registers @Get("snapshots/:id") on getSnapshot', () => {
      assert.ok(getRegistrations.includes('getSnapshot:snapshots/:id'));
    });
  });

  // ── POST /auto-rollback/trigger ──

  describe('POST /auto-rollback/trigger', () => {
    it('WARNING severity triggers immediate PENDING', () => {
      const result = controller.trigger({
        reason: 'P95 spike on coupons API',
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      });
      assert.ok(result.data.id);
      assert.equal(result.data.severity, 'WARNING');
      assert.equal(result.data.requiresConfirmation, false);
      assert.equal(result.data.status, 'PENDING');
      assert.equal(result.data.metricKey, '/api/coupons');
    });

    it('CRITICAL severity sets AWAITING_CONFIRM', () => {
      const result = controller.trigger({
        reason: 'P99 critical spike on orders API',
        severity: 'CRITICAL',
        metricKey: '/api/orders',
        anomalyValue: 5000,
        baselineValue: 200,
      });
      assert.equal(result.data.status, 'AWAITING_CONFIRM');
      assert.equal(result.data.requiresConfirmation, true);
      assert.equal(result.data.severity, 'CRITICAL');
    });

    it('accepts optional snapshotKind field', () => {
      const result = controller.trigger({
        reason: 'DB write spike',
        severity: 'WARNING',
        metricKey: 'db.write.latency',
        anomalyValue: 2500,
        baselineValue: 500,
        snapshotKind: 'DB',
      });
      assert.ok(result.data.id);
      assert.equal(result.data.status, 'PENDING');
    });

    it('accepts optional trigger field', () => {
      const result = controller.trigger({
        reason: 'Manual trigger',
        severity: 'WARNING',
        metricKey: 'custom.test',
        anomalyValue: 10,
        baselineValue: 5,
        trigger: 'admin-request',
      });
      assert.ok(result.data.id);
    });
  });

  // ── POST /auto-rollback/confirm ──

  describe('POST /auto-rollback/confirm', () => {
    it('confirms a CRITICAL rollback - status transitions away from AWAITING_CONFIRM', () => {
      const triggerResult = controller.trigger({
        reason: 'critical test',
        severity: 'CRITICAL',
        metricKey: 'api.test',
        anomalyValue: 999,
        baselineValue: 100,
      });
      assert.equal(triggerResult.data.status, 'AWAITING_CONFIRM');

      const confirmResult = controller.confirm({ id: triggerResult.data.id });
      assert.notEqual(confirmResult.data, null);
      assert.notEqual(confirmResult.data!.status, 'AWAITING_CONFIRM');
      assert.equal(confirmResult.data!.id, triggerResult.data.id);
    });

    it('returns null for non-existent id', () => {
      const result = controller.confirm({ id: 'non-existent-id' });
      assert.equal(result.data, null);
    });

    it('idempotent: confirming already-confirmed record returns it unchanged', () => {
      const triggerResult = controller.trigger({
        reason: 'critical test',
        severity: 'CRITICAL',
        metricKey: 'api.test',
        anomalyValue: 999,
        baselineValue: 100,
      });
      controller.confirm({ id: triggerResult.data.id });
      const secondConfirm = controller.confirm({ id: triggerResult.data.id });
      assert.notEqual(secondConfirm.data, null);
      assert.equal(secondConfirm.data!.status, 'COMPLETED');
    });
  });

  // ── POST /auto-rollback/cancel ──

  describe('POST /auto-rollback/cancel', () => {
    it('cancels an AWAITING_CONFIRM rollback with reason', () => {
      const triggerResult = controller.trigger({
        reason: 'false alarm test',
        severity: 'CRITICAL',
        metricKey: 'api.test',
        anomalyValue: 999,
        baselineValue: 100,
      });
      const cancelResult = controller.cancel({ id: triggerResult.data.id, reason: 'False alarm - manual override' });
      assert.notEqual(cancelResult.data, null);
      assert.equal(cancelResult.data!.status, 'CANCELLED');
    });

    it('cancels without reason defaults gracefully', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      const cancelResult = controller.cancel({ id: triggerResult.data.id });
      assert.notEqual(cancelResult.data, null);
      assert.equal(cancelResult.data!.status, 'CANCELLED');
    });

    it('returns null for non-existent id', () => {
      const result = controller.cancel({ id: 'does-not-exist' });
      assert.equal(result.data, null);
    });

    it('returns completed record without changing status', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      controller.confirm({ id: triggerResult.data.id });
      const cancelResult = controller.cancel({ id: triggerResult.data.id });
      assert.notEqual(cancelResult.data, null);
      // Once COMPLETED, cancel should not downgrade
      assert.equal(cancelResult.data!.status, 'COMPLETED');
    });
  });

  // ── GET /auto-rollback/records ──

  describe('GET /auto-rollback/records', () => {
    it('returns empty array when no records', () => {
      const result = controller.listRecords({});
      assert.deepEqual(result.data, []);
    });

    it('lists all created records', () => {
      controller.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      controller.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm2', anomalyValue: 999, baselineValue: 100 });
      const result = controller.listRecords({});
      assert.equal(result.data.length, 2);
    });

    it('filters by status', () => {
      controller.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      controller.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm2', anomalyValue: 999, baselineValue: 100 });
      const result = controller.listRecords({ status: 'AWAITING_CONFIRM' });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].status, 'AWAITING_CONFIRM');
    });

    it('filters by metricKey', () => {
      controller.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      controller.trigger({ reason: 'b', severity: 'WARNING', metricKey: 'm2', anomalyValue: 200, baselineValue: 100 });
      const result = controller.listRecords({ metricKey: 'm1' });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].metricKey, 'm1');
    });

    it('filters by status and metricKey together', () => {
      controller.trigger({ reason: 'a', severity: 'CRITICAL', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 });
      controller.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm2', anomalyValue: 999, baselineValue: 100 });
      controller.trigger({ reason: 'c', severity: 'WARNING', metricKey: 'm2', anomalyValue: 110, baselineValue: 100 });
      const result = controller.listRecords({ status: 'AWAITING_CONFIRM', metricKey: 'm2' });
      assert.equal(result.data.length, 1);
    });
  });

  // ── GET /auto-rollback/records/:id ──

  describe('GET /auto-rollback/records/:id', () => {
    it('returns record by id', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      });
      const result = controller.getRecord(triggerResult.data.id);
      assert.notEqual(result.data, null);
      assert.equal(result.data!.id, triggerResult.data.id);
      assert.equal(result.data!.metricKey, 'm');
    });

    it('returns null for non-existent id', () => {
      const result = controller.getRecord('non-existent');
      assert.equal(result.data, null);
    });
  });

  // ── GET /auto-rollback/snapshots/:id ──

  describe('GET /auto-rollback/snapshots/:id', () => {
    it('returns null for non-existent snapshot', () => {
      const result = controller.getSnapshot('non-existent-snapshot');
      assert.equal(result.data, null);
    });
  });

  // ── POST /auto-rollback/configure ──

  describe('POST /auto-rollback/configure', () => {
    it('applies single config value', () => {
      const result = controller.configure({ criticalRequiresConfirm: false });
      assert.equal(result.status, 'ok');
      assert.deepEqual(result.applied, ['criticalRequiresConfirm']);
    });

    it('applies multiple config values', () => {
      const result = controller.configure({
        criticalRequiresConfirm: false,
        confirmationDelayMs: 60000,
        maxConcurrent: 5,
      });
      assert.equal(result.status, 'ok');
      assert.ok(result.applied.includes('criticalRequiresConfirm'));
      assert.ok(result.applied.includes('confirmationDelayMs'));
      assert.ok(result.applied.includes('maxConcurrent'));
    });

    it('returns empty applied for empty config', () => {
      const result = controller.configure({});
      assert.equal(result.status, 'ok');
      assert.deepEqual(result.applied, []);
    });

    it('applied list omits undefined fields', () => {
      const result = controller.configure({ criticalRequiresConfirm: true, confirmationDelayMs: undefined });
      assert.ok(result.applied.includes('criticalRequiresConfirm'));
      assert.ok(!result.applied.includes('confirmationDelayMs'));
    });
  });

  // ── GET /auto-rollback/status ──

  describe('GET /auto-rollback/status', () => {
    it('returns engine status with zero active records initially', () => {
      const result = controller.getStatus();
      assert.equal(result.data.engineName, 'AutoRollback');
      assert.equal(result.data.status, 'ACTIVE');
      assert.equal(result.data.activeRecords, 0);
      assert.ok(result.data.lastEvaluationAt);
    });

    it('reflects active records count correctly', () => {
      controller.trigger({ reason: 'a', severity: 'WARNING', metricKey: 'm', anomalyValue: 110, baselineValue: 100 });
      controller.trigger({ reason: 'b', severity: 'CRITICAL', metricKey: 'm', anomalyValue: 999, baselineValue: 100 });
      const status = controller.getStatus();
      // WARNING → PENDING (active), CRITICAL → AWAITING_CONFIRM (active)
      assert.equal(status.data.activeRecords, 2);
    });

    it('completed/cancelled records are not counted as active', () => {
      const triggerResult = controller.trigger({
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
      });
      controller.confirm({ id: triggerResult.data.id });
      const status = controller.getStatus();
      assert.equal(status.data.activeRecords, 0);
    });
  });

  // ── 业务场景: 完整的回滚生命周期 ──

  describe('full rollback lifecycle', () => {
    it('WARNING: trigger → auto-execute → status downstream of PENDING', () => {
      const triggerResult = controller.trigger({
        reason: 'latency spike',
        severity: 'WARNING',
        metricKey: 'api.latency',
        anomalyValue: 2000,
        baselineValue: 500,
      });
      assert.equal(triggerResult.data.requiresConfirmation, false);
      assert.equal(triggerResult.data.status, 'PENDING');

      // Verify record exists via GET
      const fetched = controller.getRecord(triggerResult.data.id);
      assert.notEqual(fetched.data, null);
    });

    it('CRITICAL: trigger → confirm → COMPLETED', () => {
      const t1 = controller.trigger({
        reason: 'critical memory leak',
        severity: 'CRITICAL',
        metricKey: 'memory.heap',
        anomalyValue: 95,
        baselineValue: 60,
      });
      assert.equal(t1.data.status, 'AWAITING_CONFIRM');

      const confirmed = controller.confirm({ id: t1.data.id });
      assert.equal(confirmed.data!.status, 'COMPLETED');
    });

    it('CRITICAL: trigger → cancel → CANCELLED', () => {
      const t1 = controller.trigger({
        reason: 'CRITICAL false alarm',
        severity: 'CRITICAL',
        metricKey: 'cpu.usage',
        anomalyValue: 90,
        baselineValue: 50,
      });
      assert.equal(t1.data.status, 'AWAITING_CONFIRM');

      const cancelled = controller.cancel({ id: t1.data.id, reason: 'False positive' });
      assert.equal(cancelled.data!.status, 'CANCELLED');
    });
  });
});
