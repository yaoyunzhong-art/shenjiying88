/**
 * gdpr-erasure.service.ts - Phase-20 T41
 * 用途: 用户删除权 (Right to be Forgotten) - GDPR Article 17
 * 关联: phase-20-compliance/spec.md §Phase 1
 *
 * 流程:
 * 1. softDelete: 立即标记 isDeleted=true,记录 deletionRequestedAt
 * 2. 30 天 grace period: 用户可恢复
 * 3. hardDelete after 30 days: 不可逆删除 (跨模块级联)
 * 4. 删除审计: 记录删除请求/执行/审计
 */
import { Injectable, Logger } from '@nestjs/common';

export type ErasureStatus =
  | 'ACTIVE' // 正常用户
  | 'PENDING_ERASURE' // 标记删除,等待 grace period
  | 'ERASED' // 已硬删除 (grace period 已过)
  | 'RESTORED'; // grace period 内恢复

export interface ErasureRecord {
  userId: string;
  tenantId: string;
  status: ErasureStatus;
  deletionRequestedAt?: string; // ISO 时间
  erasureDeadlineAt?: string; // grace period 结束时间
  erasedAt?: string; // 实际硬删除时间
  restoredAt?: string;
  reason?: string;
  requestedBy?: string; // 操作人
}

export interface ErasureRequest {
  userId: string;
  tenantId: string;
  reason?: string;
  requestedBy?: string;
  /** 自定义 grace period (毫秒),默认 30 天 */
  gracePeriodMs?: number;
}

/** 默认 grace period 30 天 */
const DEFAULT_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class GDPRErasureService {
  private readonly logger = new Logger(GDPRErasureService.name);
  private readonly records = new Map<string, ErasureRecord>();
  /** 用户关联数据钩子 - 由各业务模块注册 */
  private readonly cascadeHooks = new Map<
    string,
    Array<(userId: string, tenantId: string) => Promise<number>>
  >();

  // ── Erasure lifecycle ──

  /**
   * 请求删除用户 (soft delete)
   * 立即生效:用户登录/查询被拒绝,但数据保留 30 天
   */
  requestErasure(req: ErasureRequest): ErasureRecord {
    const gracePeriodMs = req.gracePeriodMs ?? DEFAULT_GRACE_PERIOD_MS;
    const now = new Date();
    const deadline = new Date(now.getTime() + gracePeriodMs);

    const record: ErasureRecord = {
      userId: req.userId,
      tenantId: req.tenantId,
      status: 'PENDING_ERASURE',
      deletionRequestedAt: now.toISOString(),
      erasureDeadlineAt: deadline.toISOString(),
      reason: req.reason,
      requestedBy: req.requestedBy,
    };
    this.records.set(req.userId, record);
    this.logger.log(
      `[${req.tenantId}] user ${req.userId} marked for erasure, deadline ${deadline.toISOString()}`,
    );
    return record;
  }

  /**
   * 撤销删除请求 (在 grace period 内)
   */
  cancelErasure(userId: string, reason?: string): ErasureRecord {
    const record = this.records.get(userId);
    if (!record) throw new Error(`Erasure record not found: ${userId}`);
    if (record.status !== 'PENDING_ERASURE') {
      throw new Error(`Cannot cancel erasure in status: ${record.status}`);
    }
    record.status = 'ACTIVE';
    delete record.deletionRequestedAt;
    delete record.erasureDeadlineAt;
    delete record.erasedAt;
    record.restoredAt = new Date().toISOString();
    this.logger.log(`[${record.tenantId}] user ${userId} erasure cancelled`);
    return record;
  }

  /**
   * 检查用户是否处于可服务状态
   */
  isActive(userId: string): boolean {
    const record = this.records.get(userId);
    if (!record) return true; // 无记录视为 active
    return record.status === 'ACTIVE' || record.status === 'RESTORED';
  }

  /**
   * 获取当前 Erasure 记录
   */
  getRecord(userId: string): ErasureRecord | undefined {
    return this.records.get(userId);
  }

  /**
   * 列出所有待硬删除的用户 (已过 grace period)
   * 用于定时任务调度
   */
  listReadyForHardDelete(now: Date = new Date()): ErasureRecord[] {
    const ready: ErasureRecord[] = [];
    for (const record of this.records.values()) {
      if (
        record.status === 'PENDING_ERASURE' &&
        record.erasureDeadlineAt &&
        new Date(record.erasureDeadlineAt) <= now
      ) {
        ready.push(record);
      }
    }
    return ready;
  }

  /**
   * 执行硬删除 (grace period 已过)
   * 触发所有注册的级联钩子,异步执行
   */
  async hardDelete(userId: string): Promise<{
    userId: string;
    deletedFromModules: Record<string, number>;
    totalDeleted: number;
  }> {
    const record = this.records.get(userId);
    if (!record) throw new Error(`Erasure record not found: ${userId}`);
    if (record.status !== 'PENDING_ERASURE') {
      throw new Error(`Cannot hard delete in status: ${record.status}`);
    }

    const deletedFromModules: Record<string, number> = {};
    let totalDeleted = 0;

    // 执行所有注册的级联钩子
    for (const [moduleName, hooks] of this.cascadeHooks.entries()) {
      let moduleDeleted = 0;
      for (const hook of hooks) {
        try {
          const count = await hook(userId, record.tenantId);
          moduleDeleted += count;
        } catch (err) {
          this.logger.error(
            `[${record.tenantId}] cascade hook ${moduleName} failed: ${(err as Error).message}`,
          );
        }
      }
      deletedFromModules[moduleName] = moduleDeleted;
      totalDeleted += moduleDeleted;
    }

    record.status = 'ERASED';
    record.erasedAt = new Date().toISOString();
    this.records.set(userId, record);
    this.logger.log(
      `[${record.tenantId}] user ${userId} hard deleted, ${totalDeleted} records removed`,
    );
    return { userId, deletedFromModules, totalDeleted };
  }

  // ── Cascade hook registration ──

  /**
   * 注册级联删除钩子 (业务模块调用)
   * @param moduleName 模块名 (如 'member', 'order', 'invoice')
   * @param hook 删除函数,返回删除的记录数
   */
  registerCascadeHook(
    moduleName: string,
    hook: (userId: string, tenantId: string) => Promise<number>,
  ): void {
    if (!this.cascadeHooks.has(moduleName)) {
      this.cascadeHooks.set(moduleName, []);
    }
    this.cascadeHooks.get(moduleName)!.push(hook);
  }

  /**
   * 列出已注册的模块
   */
  listRegisteredModules(): string[] {
    return Array.from(this.cascadeHooks.keys());
  }

  /**
   * 批量处理到期硬删除 (定时任务)
   */
  async processScheduledDeletions(now: Date = new Date()): Promise<
    Array<{
      userId: string;
      deletedFromModules: Record<string, number>;
      totalDeleted: number;
    }>
  > {
    const ready = this.listReadyForHardDelete(now);
    const results = [];
    for (const record of ready) {
      const result = await this.hardDelete(record.userId);
      results.push(result);
    }
    return results;
  }

  // ── Audit ──

  /**
   * 查询某租户的删除审计列表
   */
  listAuditTrail(tenantId: string): ErasureRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => r.tenantId === tenantId,
    );
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.records.clear();
    this.cascadeHooks.clear();
  }
}