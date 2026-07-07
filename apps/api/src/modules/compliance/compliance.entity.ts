/**
 * compliance.entity.ts - Phase-20 T39-T43
 * 用途: 合规模块实体定义
 *
 * 聚合:
 * - PIIScanResult: PII 检测扫描结果实体
 * - MaskedDocument: 脱敏文档实体
 * - ErasureRequestEntity: 删除请求实体
 * - AuditLogEntryEntity: 审计日志条目实体
 * - AuditQueryResultEntity: 审计查询结果实体
 */
import type { PIIKind, PIIMatch } from './pii-detector.service';
import type { ErasureStatus, ErasureRecord } from './gdpr-erasure.service';
import type { AuditEntry, AuditAction, AuditVerifyResult } from './audit-log.service';
import type { AuditExportResult } from './audit-query.service';

/**
 * PII 扫描结果实体 - 聚合一次扫描的全部发现
 */
export class PIIScanResultEntity {
  /** 文本标识 */
  textId!: string;
  /** 扫描时间 */
  scannedAt!: string;
  /** 发现的 PII 匹配列表 */
  matches!: PIIMatch[];
  /** 按 kind 分组 */
  grouped!: Record<PIIKind, PIIMatch[]>;
  /** 是否包含 PII */
  hasPII!: boolean;
  /** 各类型计数 */
  counts!: Record<PIIKind, number>;
  /** 敏感指数 (0-1, 基于 PII 类型 + 数量加权) */
  sensitivityScore!: number;
}

/**
 * 脱敏文档实体 - 脱敏操作的结果
 */
export class MaskedDocumentEntity {
  /** 原始文本 */
  originalText!: string;
  /** 脱敏后文本 */
  maskedText!: string;
  /** 匹配/脱敏数 */
  matchedCount!: number;
  /** 脱敏率 (0-1) */
  maskRatio!: number;
  /** 脱敏时间 */
  maskedAt!: string;
  /** 脱敏类型 */
  maskChar!: string;
}

/**
 * 删除请求实体 - 封装 GDPR Erasure 全生命周期
 */
export class ErasureRequestEntity {
  /** 请求 ID */
  requestId!: string;
  /** 用户 ID */
  userId!: string;
  /** 租户 ID */
  tenantId!: string;
  /** 当前状态 */
  status!: ErasureStatus;
  /** 请求时间 */
  requestedAt!: string;
  /** Grace period 截止时间 */
  graceDeadline!: string;
  /** 硬删除时间 */
  erasedAt?: string;
  /** 恢复时间 */
  restoredAt?: string;
  /** 申请原因 */
  reason?: string;
  /** 操作人 */
  requestedBy?: string;
}

/**
 * 审计日志条目实体
 */
export class AuditLogEntryEntity {
  /** 序列号 */
  seq!: number;
  /** 时间戳 */
  ts!: string;
  /** 租户 ID */
  tenantId!: string;
  /** 操作人 */
  actorId!: string;
  /** 动作类型 */
  action!: AuditAction;
  /** 自定义动作 */
  customAction?: string;
  /** 资源类型 */
  resource!: string;
  /** 资源 ID */
  resourceId!: string;
  /** 变更前 */
  before?: unknown;
  /** 变更后 */
  after?: unknown;
  /** IP 地址 */
  ip?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 前一条 hash */
  prevHash!: string;
  /** 本条 hash */
  hash!: string;
}

/**
 * 审计查询/导出结果实体
 */
export class AuditExportResultEntity {
  /** 格式 */
  format!: 'csv' | 'json';
  /** 内容 */
  content!: string;
  /** 行数 */
  rowCount!: number;
  /** 生成时间 */
  generatedAt!: string;
  /** 保留天数 */
  retentionDays!: number;
  /** 保留到期时间 */
  retentionExpiresAt!: string;
  /** 完整性校验结果 */
  integrityCheck!: {
    valid: boolean;
    totalChecked: number;
  };
}

/**
 * 合规健康检查实体
 */
export class ComplianceHealthEntity {
  /** 模块状态 */
  status!: 'healthy' | 'degraded' | 'down';
  /** PII 检测服务状态 */
  piiDetector!: string;
  /** PII 脱敏服务状态 */
  piiMasker!: string;
  /** GDPR 删除服务状态 */
  gdprErasure!: string;
  /** 审计日志服务状态 */
  auditLog!: string;
  /** 审计查询服务状态 */
  auditQuery!: string;
  /** 审计日志条目数 */
  auditLogSize!: number;
  /** 待处理删除数 */
  pendingErasures!: number;
  /** 注册的级联删除模块 */
  cascadeModules!: string[];
  /** 检测时间 */
  checkedAt!: string;
}
