/**
 * audit-log.service.ts - Phase-20 T42
 * 用途: 不可篡改审计日志 (Append-Only + Hash Chain)
 * 关联: phase-20-compliance/spec.md §Phase 2
 *
 * 核心机制:
 * - append-only: 仅允许添加,不允许修改/删除
 * - hash chain: 每条记录 hash = sha256(prevHash + payload)
 * - verify: 校验链完整性,任何篡改都可检测
 *
 * 字段:
 * - actorId: 操作人
 * - action: 动作 (CREATE/UPDATE/DELETE/READ/CUSTOM)
 * - resource: 资源类型 (user/order/invoice/...)
 * - resourceId: 资源 ID
 * - tenantId: 租户
 * - before/after: 变更前后状态 (JSON)
 * - ip: 客户端 IP
 * - ts: 时间戳
 * - prevHash: 前一条 hash
 * - hash: 本条 hash = sha256(prevHash + canonicalJSON(payload))
 */
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'CUSTOM';

export interface AuditEntry {
  /** 序列号,全局递增 */
  seq: number;
  /** ISO 时间戳 */
  ts: string;
  /** 租户 ID */
  tenantId: string;
  /** 操作人 */
  actorId: string;
  /** 动作类型 */
  action: AuditAction;
  /** 自定义动作名 (action='CUSTOM' 时必填) */
  customAction?: string;
  /** 资源类型 */
  resource: string;
  /** 资源 ID */
  resourceId: string;
  /** 变更前快照 */
  before?: unknown;
  /** 变更后快照 */
  after?: unknown;
  /** 客户端 IP */
  ip?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 前一条 hash (chain 起点为 '0'.repeat(64)) */
  prevHash: string;
  /** 本条 hash */
  hash: string;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

export interface AuditAppendInput {
  tenantId: string;
  actorId: string;
  action: AuditAction;
  customAction?: string;
  resource: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

export interface AuditVerifyResult {
  valid: boolean;
  brokenAtSeq?: number;
  expectedHash?: string;
  actualHash?: string;
  totalChecked: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly entries: AuditEntry[] = [];
  private readonly GENESIS_HASH = '0'.repeat(64);

  /**
   * 追加一条审计记录
   * 返回生成的 entry (含 hash)
   */
  append(input: AuditAppendInput): AuditEntry {
    const seq = this.entries.length + 1;
    const prevHash = this.entries.length === 0
      ? this.GENESIS_HASH
      : this.entries[this.entries.length - 1].hash;

    const payload: Omit<AuditEntry, 'hash'> = {
      seq,
      ts: new Date().toISOString(),
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      customAction: input.customAction,
      resource: input.resource,
      resourceId: input.resourceId,
      before: input.before,
      after: input.after,
      ip: input.ip,
      userAgent: input.userAgent,
      prevHash,
      meta: input.meta,
    };
    const hash = this.computeHash(payload);
    const entry: AuditEntry = { ...payload, hash };
    this.entries.push(entry);
    return entry;
  }

  /**
   * 批量追加
   */
  appendBatch(inputs: AuditAppendInput[]): AuditEntry[] {
    return inputs.map((i) => this.append(i));
  }

  /**
   * 计算 hash: sha256(prevHash + canonicalJSON(payload))
   */
  private computeHash(payload: Omit<AuditEntry, 'hash'>): string {
    const canonical = this.canonicalJSON(payload);
    return createHash('sha256').update(payload.prevHash + canonical).digest('hex');
  }

  /**
   * 规范化 JSON: keys 排序,确保 hash 稳定
   */
  private canonicalJSON(obj: unknown): string {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map((o) => this.canonicalJSON(o)).join(',') + ']';
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return '{' + keys
      .map((k) => JSON.stringify(k) + ':' + this.canonicalJSON((obj as Record<string, unknown>)[k]))
      .join(',') + '}';
  }

  // ── Query ──

  /** 总记录数 */
  size(): number {
    return this.entries.length;
  }

  /** 取最后 N 条 */
  tail(n: number): AuditEntry[] {
    return this.entries.slice(-n);
  }

  /** 取指定 seq */
  getBySeq(seq: number): AuditEntry | undefined {
    return this.entries.find((e) => e.seq === seq);
  }

  /** 按租户过滤 */
  filterByTenant(tenantId: string): AuditEntry[] {
    return this.entries.filter((e) => e.tenantId === tenantId);
  }

  /** 按 actor 过滤 */
  filterByActor(actorId: string): AuditEntry[] {
    return this.entries.filter((e) => e.actorId === actorId);
  }

  /** 按时间范围过滤 */
  filterByTimeRange(fromTs: string, toTs: string): AuditEntry[] {
    return this.entries.filter((e) => e.ts >= fromTs && e.ts <= toTs);
  }

  /** 复合查询 */
  query(filter: {
    tenantId?: string;
    actorId?: string;
    action?: AuditAction;
    resource?: string;
    resourceId?: string;
    fromTs?: string;
    toTs?: string;
    limit?: number;
  }): AuditEntry[] {
    let result = this.entries;
    if (filter.tenantId) result = result.filter((e) => e.tenantId === filter.tenantId);
    if (filter.actorId) result = result.filter((e) => e.actorId === filter.actorId);
    if (filter.action) result = result.filter((e) => e.action === filter.action);
    if (filter.resource) result = result.filter((e) => e.resource === filter.resource);
    if (filter.resourceId) result = result.filter((e) => e.resourceId === filter.resourceId);
    if (filter.fromTs) result = result.filter((e) => e.ts >= filter.fromTs!);
    if (filter.toTs) result = result.filter((e) => e.ts <= filter.toTs!);
    if (filter.limit && filter.limit > 0) result = result.slice(0, filter.limit);
    return result;
  }

  // ── Integrity ──

  /**
   * 验证 hash chain 完整性
   * 从头遍历,任一条 hash 不匹配 → 失败
   */
  verify(): AuditVerifyResult {
    let prevHash = this.GENESIS_HASH;
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      const expectedPrev = prevHash;
      if (e.prevHash !== expectedPrev) {
        return {
          valid: false,
          brokenAtSeq: e.seq,
          expectedHash: expectedPrev,
          actualHash: e.prevHash,
          totalChecked: i,
        };
      }
      const recomputed = this.computeHash({
        seq: e.seq,
        ts: e.ts,
        tenantId: e.tenantId,
        actorId: e.actorId,
        action: e.action,
        customAction: e.customAction,
        resource: e.resource,
        resourceId: e.resourceId,
        before: e.before,
        after: e.after,
        ip: e.ip,
        userAgent: e.userAgent,
        prevHash: e.prevHash,
        meta: e.meta,
      });
      if (recomputed !== e.hash) {
        return {
          valid: false,
          brokenAtSeq: e.seq,
          expectedHash: recomputed,
          actualHash: e.hash,
          totalChecked: i,
        };
      }
      prevHash = e.hash;
    }
    return { valid: true, totalChecked: this.entries.length };
  }

  /**
   * 模拟篡改 (仅用于测试)
   * 修改指定 seq 的 payload (不重算 hash)
   */
  __tamper(seq: number): void {
    const e = this.entries.find((x) => x.seq === seq);
    if (!e) throw new Error(`Entry not found: ${seq}`);
    e.after = { tampered: true };
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.entries.length = 0;
  }

  /** 直接获取 entries (用于测试) */
  __getAll(): AuditEntry[] {
    return [...this.entries];
  }
}