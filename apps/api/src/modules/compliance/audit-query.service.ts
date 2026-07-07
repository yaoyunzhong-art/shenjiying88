/**
 * audit-query.service.ts - Phase-20 T43
 * 用途: 合规审计查询 + CSV/JSON 导出
 * 关联: phase-20-compliance/spec.md §Phase 2
 *
 * 功能:
 * - 多维查询 (tenant + time + actor + action + resource)
 * - CSV / JSON 导出
 * - 保留期配置 (默认 7 年,GDPR 要求)
 * - 分页 + 排序
 */
import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService, AuditEntry, AuditAction } from './audit-log.service';

export interface AuditExportOptions {
  format: 'csv' | 'json';
  filter?: {
    tenantId?: string;
    actorId?: string;
    action?: AuditAction;
    resource?: string;
    resourceId?: string;
    fromTs?: string;
    toTs?: string;
  };
  /** 保留期天数 (默认 7 年 = 2557 天) */
  retentionDays?: number;
  /** 分页 */
  page?: number;
  pageSize?: number;
}

export interface AuditExportResult {
  format: 'csv' | 'json';
  content: string;
  rowCount: number;
  generatedAt: string;
  retentionDays: number;
  retentionExpiresAt: string;
}

const DEFAULT_RETENTION_DAYS = 7 * 365; // 7 年

@Injectable()
export class AuditQueryService {
  private readonly logger = new Logger(AuditQueryService.name);

  constructor(private readonly log: AuditLogService) {}

  /**
   * CSV 导出 - RFC 4180 兼容
   */
  private toCSV(entries: AuditEntry[]): string {
    const headers = [
      'seq', 'ts', 'tenantId', 'actorId', 'action', 'customAction',
      'resource', 'resourceId', 'before', 'after', 'ip', 'userAgent',
      'prevHash', 'hash',
    ];
    const escape = (val: unknown): string => {
      if (val === undefined || val === null) return '';
      const str = typeof val === 'string' ? val : JSON.stringify(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const lines = [headers.join(',')];
    for (const e of entries) {
      lines.push([
        e.seq, e.ts, e.tenantId, e.actorId, e.action, e.customAction ?? '',
        e.resource, e.resourceId, e.before, e.after, e.ip ?? '', e.userAgent ?? '',
        e.prevHash, e.hash,
      ].map(escape).join(','));
    }
    return lines.join('\n');
  }

  /**
   * JSON 导出 (美化输出,可选)
   */
  private toJSON(entries: AuditEntry[]): string {
    return JSON.stringify(entries, null, 2);
  }

  /**
   * 计算保留期到期时间
   */
  private calcRetentionExpiry(retentionDays: number): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + retentionDays);
    return expiry.toISOString();
  }

  /**
   * 执行查询 + 导出
   */
  export(options: AuditExportOptions): AuditExportResult {
    const filter = options.filter ?? {};
    const retentionDays = options.retentionDays ?? DEFAULT_RETENTION_DAYS;

    let entries = this.log.query(filter);

    // 分页
    if (options.page !== undefined && options.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      entries = entries.slice(start, start + options.pageSize);
    }

    const content =
      options.format === 'csv' ? this.toCSV(entries) : this.toJSON(entries);

    return {
      format: options.format,
      content,
      rowCount: entries.length,
      generatedAt: new Date().toISOString(),
      retentionDays,
      retentionExpiresAt: this.calcRetentionExpiry(retentionDays),
    };
  }

  /**
   * 快速查询 (不分页)
   */
  quickQuery(filter: AuditExportOptions['filter']): AuditEntry[] {
    return this.log.query(filter ?? {});
  }

  /**
   * 统计 - 按 action 分组
   */
  statsByAction(tenantId?: string): Record<AuditAction, number> {
    const result: Record<AuditAction, number> = {
      CREATE: 0,
      UPDATE: 0,
      DELETE: 0,
      READ: 0,
      CUSTOM: 0,
    };
    const filter = tenantId ? { tenantId } : {};
    for (const e of this.log.query(filter)) {
      result[e.action] += 1;
    }
    return result;
  }

  /**
   * 统计 - 按 actor 分组 (Top N)
   */
  topActors(tenantId: string, limit = 10): Array<{ actorId: string; count: number }> {
    const counts = new Map<string, number>();
    for (const e of this.log.query({ tenantId })) {
      counts.set(e.actorId, (counts.get(e.actorId) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 验证导出完整性 - 导出前必须先 verify
   */
  exportWithVerification(options: AuditExportOptions): {
    export: AuditExportResult;
    integrity: { valid: boolean; brokenAtSeq?: number };
  } {
    const verifyResult = this.log.verify();
    if (!verifyResult.valid) {
      throw new Error(
        `Audit log integrity broken at seq ${verifyResult.brokenAtSeq}, refusing to export`,
      );
    }
    return {
      export: this.export(options),
      integrity: verifyResult,
    };
  }
}