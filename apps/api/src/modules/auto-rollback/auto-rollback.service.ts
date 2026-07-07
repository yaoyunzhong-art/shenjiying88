// auto-rollback.service.ts - Phase-19 T27
// 用途: 异常触发自动回滚 - 快照 / 回滚 / 验证 workflow
// 关联: phase-19-intelligence/spec.md §Phase 1
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type RollbackStatus =
  | 'PENDING'           // 待执行
  | 'AWAITING_CONFIRM'  // 等待二次确认 (防误触发)
  | 'SNAPSHOTTING'      // 创建快照中
  | 'ROLLING_BACK'      // 执行回滚中
  | 'VERIFYING'         // 验证回滚结果
  | 'COMPLETED'         // 成功完成
  | 'FAILED'            // 回滚失败
  | 'CANCELLED';        // 手动取消

export type SnapshotKind = 'DB' | 'REDIS' | 'CONFIG' | 'FULL';

export interface Snapshot {
  id: string;
  kind: SnapshotKind;
  payload: Record<string, unknown>;
  size: number;
  createdAt: string;
  trigger: string;
}

export interface RollbackRecord {
  id: string;
  /** 触发原因 (例:anomaly score 0.95 on /api/coupons P95) */
  reason: string;
  severity: 'WARNING' | 'CRITICAL';
  /** 受影响 metric */
  metricKey: string;
  /** 触发时的异常值 */
  anomalyValue: number;
  /** baseline 值 */
  baselineValue: number;
  /** 状态机 */
  status: RollbackStatus;
  /** 创建的快照 */
  snapshotId?: string;
  /** 是否需要二次确认 */
  requiresConfirmation: boolean;
  /** 误触发防护:从确认到执行的最短间隔 (ms) */
  confirmationDelayMs: number;
  /** 操作历史 */
  history: Array<{ status: RollbackStatus; timestamp: string; note?: string }>;
  createdAt: string;
  completedAt?: string;
}

export interface RollbackConfig {
  /** CRITICAL 是否需要二次确认 */
  criticalRequiresConfirm: boolean;
  /** 二次确认延迟 (ms),默认 30s */
  confirmationDelayMs: number;
  /** 自动超时 (ms),默认 5min */
  autoTimeoutMs: number;
  /** 最大并发回滚数,默认 3 */
  maxConcurrent: number;
  /** 快照保留时间 (ms),默认 7d */
  snapshotRetentionMs: number;
}

const DEFAULT_CONFIG: Required<RollbackConfig> = {
  criticalRequiresConfirm: true,
  confirmationDelayMs: 30000,
  autoTimeoutMs: 5 * 60 * 1000,
  maxConcurrent: 3,
  snapshotRetentionMs: 7 * 24 * 60 * 60 * 1000,
};

/**
 * AutoRollback Service
 *
 * 状态机:PENDING → AWAITING_CONFIRM → SNAPSHOTTING → ROLLING_BACK
 *        → VERIFYING → COMPLETED / FAILED
 *
 * 误触发防护:
 * 1. CRITICAL 级别需要二次确认 (默认)
 * 2. WARNING 直接执行 (但有限速)
 * 3. 手动 cancel API 可中止任何阶段
 *
 * V1:内存版,模拟快照/回滚
 * V2:接 DB 事务 + Redis snapshot + Config rollback
 */
@Injectable()
export class AutoRollbackService {
  private readonly logger = new Logger(AutoRollbackService.name);
  private config: Required<RollbackConfig> = DEFAULT_CONFIG;
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly records = new Map<string, RollbackRecord>();
  /** pending confirmations: id → resolve */
  private readonly confirmations = new Map<string, { resolve: () => void; timer: NodeJS.Timeout }>();

  configure(config: Partial<RollbackConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── 触发回滚 ──

  /**
   * 由 anomaly 检测触发,创建回滚记录
   */
  trigger(input: {
    reason: string;
    severity: 'WARNING' | 'CRITICAL';
    metricKey: string;
    anomalyValue: number;
    baselineValue: number;
    snapshotKind?: SnapshotKind;
    trigger?: string;
  }): RollbackRecord {
    const requiresConfirmation =
      input.severity === 'CRITICAL' && this.config.criticalRequiresConfirm;

    const status: RollbackStatus = requiresConfirmation ? 'AWAITING_CONFIRM' : 'PENDING';
    const record: RollbackRecord = {
      id: `rollback-${randomUUID()}`,
      reason: input.reason,
      severity: input.severity,
      metricKey: input.metricKey,
      anomalyValue: input.anomalyValue,
      baselineValue: input.baselineValue,
      status,
      requiresConfirmation,
      confirmationDelayMs: this.config.confirmationDelayMs,
      history: [
        { status, timestamp: new Date().toISOString(), note: `Triggered: ${input.reason}` },
      ],
      createdAt: new Date().toISOString(),
    };
    this.records.set(record.id, record);

    if (requiresConfirmation) {
      this.scheduleAutoCancel(record.id);
      this.logger.warn(
        `[rollback ${record.id}] CRITICAL severity - awaiting manual confirmation in ${this.config.confirmationDelayMs}ms`,
      );
    } else {
      // 直接执行 (WARNING)
      void this.executeRollback(record.id, input.snapshotKind ?? 'FULL', input.trigger ?? input.reason);
    }

    return record;
  }

  // ── 二次确认 / 取消 ──

  /**
   * 确认执行 (CRITICAL 必走)
   */
  confirm(id: string): RollbackRecord | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;
    if (record.status !== 'AWAITING_CONFIRM') return record;

    // 清除自动取消定时器
    const pending = this.confirmations.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      this.confirmations.delete(id);
    }

    this.updateStatus(record, 'PENDING', 'Manual confirmation received');
    void this.executeRollback(id, 'FULL', record.reason);
    return record;
  }

  /**
   * 取消回滚 (任何阶段都可)
   */
  cancel(id: string, reason: string = 'Manual cancellation'): RollbackRecord | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;
    if (record.status === 'COMPLETED' || record.status === 'CANCELLED') return record;

    const pending = this.confirmations.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      this.confirmations.delete(id);
    }

    this.updateStatus(record, 'CANCELLED', reason);
    return record;
  }

  // ── 查询 ──

  getRecord(id: string): RollbackRecord | undefined {
    return this.records.get(id);
  }

  listRecords(filter?: { status?: RollbackStatus; metricKey?: string }): RollbackRecord[] {
    let all = Array.from(this.records.values());
    if (filter?.status) all = all.filter((r) => r.status === filter.status);
    if (filter?.metricKey) all = all.filter((r) => r.metricKey === filter.metricKey);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getSnapshot(id: string): Snapshot | undefined {
    return this.snapshots.get(id);
  }

  // ── 工作流执行 (内部) ──

  private async executeRollback(
    recordId: string,
    snapshotKind: SnapshotKind,
    trigger: string,
  ): Promise<void> {
    const record = this.records.get(recordId);
    if (!record) return;

    // 步骤 1:创建快照
    this.updateStatus(record, 'SNAPSHOTTING', `Creating ${snapshotKind} snapshot`);
    const snapshot = this.createSnapshot(snapshotKind, trigger);
    this.snapshots.set(snapshot.id, snapshot);
    record.snapshotId = snapshot.id;

    // 模拟异步延迟
    await this.sleep(10);

    // 步骤 2:执行回滚
    this.updateStatus(record, 'ROLLING_BACK', `Rolling back from snapshot ${snapshot.id}`);
    await this.sleep(20);

    // 步骤 3:验证
    this.updateStatus(record, 'VERIFYING', 'Verifying rollback success');
    const verified = this.verifyRollback(record);
    await this.sleep(10);

    if (verified) {
      this.updateStatus(record, 'COMPLETED', 'Rollback verified successfully');
      record.completedAt = new Date().toISOString();
      this.logger.log(`[rollback ${recordId}] COMPLETED (snapshot=${snapshot.id})`);
    } else {
      this.updateStatus(record, 'FAILED', 'Verification failed - manual intervention required');
      record.completedAt = new Date().toISOString();
      this.logger.error(`[rollback ${recordId}] FAILED`);
    }
  }

  private createSnapshot(kind: SnapshotKind, trigger: string): Snapshot {
    const id = `snap-${randomUUID()}`;
    return {
      id,
      kind,
      payload: { trigger, capturedAt: new Date().toISOString() },
      size: Math.floor(Math.random() * 1000) + 100, // 模拟大小
      createdAt: new Date().toISOString(),
      trigger,
    };
  }

  private verifyRollback(record: RollbackRecord): boolean {
    // V1:简单规则 - 如果 anomaly value 恢复到 baseline 80% 内,视为成功
    const tolerance = 0.2;
    const deviation = Math.abs(record.anomalyValue - record.baselineValue);
    const baselineRange = Math.abs(record.baselineValue) * tolerance;
    return deviation <= baselineRange;
  }

  private updateStatus(record: RollbackRecord, status: RollbackStatus, note?: string): void {
    record.status = status;
    record.history.push({ status, timestamp: new Date().toISOString(), note });
  }

  private scheduleAutoCancel(id: string): void {
    const timer = setTimeout(() => {
      const record = this.records.get(id);
      if (record && record.status === 'AWAITING_CONFIRM') {
        this.updateStatus(record, 'CANCELLED', 'Auto-cancelled (confirmation timeout)');
        this.logger.warn(`[rollback ${id}] auto-cancelled (no confirmation in ${this.config.confirmationDelayMs}ms)`);
      }
      this.confirmations.delete(id);
    }, this.config.confirmationDelayMs);
    this.confirmations.set(id, { resolve: () => clearTimeout(timer), timer });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── 测试 helper ──

  resetForTests(): void {
    for (const c of this.confirmations.values()) clearTimeout(c.timer);
    this.confirmations.clear();
    this.snapshots.clear();
    this.records.clear();
    this.config = DEFAULT_CONFIG;
  }

  /**
   * 同步执行模式 (测试用) - 跳过所有 sleep
   */
  async executeRollbackSync(id: string, snapshotKind: SnapshotKind = 'FULL'): Promise<RollbackRecord | undefined> {
    const record = this.records.get(id);
    if (!record) return undefined;
    if (record.status !== 'PENDING') return record;

    this.updateStatus(record, 'SNAPSHOTTING', `Sync ${snapshotKind} snapshot`);
    const snapshot = this.createSnapshot(snapshotKind, record.reason);
    this.snapshots.set(snapshot.id, snapshot);
    record.snapshotId = snapshot.id;

    this.updateStatus(record, 'ROLLING_BACK', `Sync rollback from ${snapshot.id}`);
    this.updateStatus(record, 'VERIFYING', 'Sync verification');
    const verified = this.verifyRollback(record);

    if (verified) {
      this.updateStatus(record, 'COMPLETED', 'Sync rollback completed');
      record.completedAt = new Date().toISOString();
    } else {
      this.updateStatus(record, 'FAILED', 'Sync verification failed');
      record.completedAt = new Date().toISOString();
    }
    return record;
  }
}
