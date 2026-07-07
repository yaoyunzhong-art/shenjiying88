/**
 * 🐜 自动: [compliance] [A] contract 补全
 *
 * 合规模块：跨模块合约类型
 * 定义 compliance 模块对外暴露的稳定合约接口，
 * 供其他模块（anomaly-detector, tenant, observer 等）消费。
 */
import type { PIIKind } from './pii-detector.service';
import type { AuditAction } from './audit-log.service';
import type {
  PIIScanResultEntity,
  MaskedDocumentEntity,
  ErasureRequestEntity,
  AuditLogEntryEntity,
  AuditExportResultEntity,
  ComplianceHealthEntity,
} from './compliance.entity';

/**
 * PII 扫描结果合约（跨模块安全子集）
 */
export interface PIIScanResultContract {
  textId: string;
  scannedAt: string;
  hasPII: boolean;
  matchCount: number;
  sensitivityScore: number;
  groupedCounts: Record<PIIKind, number>;
}

/**
 * PII 脱敏结果合约（跨模块安全子集）
 */
export interface PIIMaskResultContract {
  maskedText: string;
  matchedCount: number;
  maskRatio: number;
}

/**
 * 删除请求合约（跨模块安全子集）
 */
export interface ErasureRequestContract {
  requestId: string;
  userId: string;
  tenantId: string;
  status: string;
  requestedAt: string;
  graceDeadline?: string;
  erasedAt?: string;
  reason?: string;
}

/**
 * 审计日志条目合约（跨模块安全子集）
 */
export interface AuditLogEntryContract {
  seq: number;
  ts: string;
  tenantId: string;
  actorId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  hash: string;
  prevHash: string;
}

/**
 * 审计查询结果合约（跨模块安全子集）
 */
export interface AuditQueryResultContract {
  entries: AuditLogEntryContract[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 审计链完整性合约（跨模块安全子集）
 */
export interface AuditVerifyContract {
  valid: boolean;
  brokenAtSeq?: number;
  totalChecked: number;
  checkedAt: string;
}

/**
 * 合规健康检查合约（跨模块安全子集）
 */
export interface ComplianceHealthContract {
  status: 'healthy' | 'degraded' | 'down';
  services: Record<string, string>;
  auditLogSize: number;
  pendingErasures: number;
  cascadeModules: string[];
  checkedAt: string;
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toPIIScanResultContract(entity: PIIScanResultEntity): PIIScanResultContract {
  return {
    textId: entity.textId,
    scannedAt: entity.scannedAt,
    hasPII: entity.hasPII,
    matchCount: Object.values(entity.counts).reduce((a, b) => a + b, 0),
    sensitivityScore: entity.sensitivityScore,
    groupedCounts: { ...entity.counts },
  };
}

/** 实体 -> 合约映射 */
export function toPIIMaskResultContract(entity: MaskedDocumentEntity): PIIMaskResultContract {
  return {
    maskedText: entity.maskedText,
    matchedCount: entity.matchedCount,
    maskRatio: entity.maskRatio,
  };
}

/** 实体 -> 合约映射 */
export function toErasureRequestContract(entity: ErasureRequestEntity): ErasureRequestContract {
  return {
    requestId: entity.requestId,
    userId: entity.userId,
    tenantId: entity.tenantId,
    status: entity.status,
    requestedAt: entity.requestedAt,
    graceDeadline: entity.graceDeadline,
    erasedAt: entity.erasedAt,
    reason: entity.reason,
  };
}

/** 实体 -> 合约映射 */
export function toAuditLogEntryContract(entity: AuditLogEntryEntity): AuditLogEntryContract {
  return {
    seq: entity.seq,
    ts: entity.ts,
    tenantId: entity.tenantId,
    actorId: entity.actorId,
    action: entity.action,
    resource: entity.resource,
    resourceId: entity.resourceId,
    hash: entity.hash,
    prevHash: entity.prevHash,
  };
}

/** 实体集合 -> 合约映射 */
export function toAuditLogEntryContracts(entities: AuditLogEntryEntity[]): AuditLogEntryContract[] {
  return entities.map(toAuditLogEntryContract);
}

/** 实体 -> 合约映射 */
export function toComplianceHealthContract(entity: ComplianceHealthEntity): ComplianceHealthContract {
  return {
    status: entity.status,
    services: {
      piiDetector: entity.piiDetector,
      piiMasker: entity.piiMasker,
      gdprErasure: entity.gdprErasure,
      auditLog: entity.auditLog,
      auditQuery: entity.auditQuery,
    },
    auditLogSize: entity.auditLogSize,
    pendingErasures: entity.pendingErasures,
    cascadeModules: [...entity.cascadeModules],
    checkedAt: entity.checkedAt,
  };
}
