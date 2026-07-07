/**
 * compliance.dto.ts - Phase-20 T39-T43
 * 用途: 合规模块 DTO (请求/响应体)
 */
import type { PIIKind } from './pii-detector.service';
import type { AuditAction } from './audit-log.service';

// ── PII 检测 DTO ──

export class PIIDetectRequestDto {
  /** 待检测文本 */
  text!: string;
  /** 限定检测类型 (默认全部) */
  kinds?: PIIKind[];
  /** 最小置信度 (默认 0.8) */
  minConfidence?: number;
}

export class PIIDetectResponseDto {
  /** 文本标识 */
  textId!: string;
  /** 是否包含 PII */
  hasPII!: boolean;
  /** 发现的 PII 匹配 */
  matches!: Array<{
    kind: PIIKind;
    value: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  /** 各类型计数 */
  counts!: Record<PIIKind, number>;
  /** 敏感指数 */
  sensitivityScore!: number;
}

// ── PII 脱敏 DTO ──

export class PIIMaskRequestDto {
  /** 待脱敏文本 */
  text!: string;
  /** 替换字符 (默认 '*') */
  maskChar?: string;
  /** 是否保留原始类型信息 */
  withKind?: boolean;
}

export class PIIMaskResponseDto {
  /** 脱敏后文本 */
  maskedText!: string;
  /** 发现并脱敏的 PII 数 */
  matchedCount!: number;
  /** 脱敏率 */
  maskRatio!: number;
}

// ── 批量检测 DTO ──

export class PIIBatchDetectRequestDto {
  /** 待检测文本数组 */
  texts!: string[];
  /** 最小置信度 */
  minConfidence?: number;
}

export class PIIBatchDetectResponseDto {
  /** 文本数量 */
  totalTexts!: number;
  /** 含 PII 的文本数 */
  textsWithPII!: number;
  /** 各文本结果 */
  results!: Array<{
    index: number;
    hasPII: boolean;
    count: number;
    matches: Array<{ kind: PIIKind; value: string; confidence: number }>;
  }>;
}

// ── 批量脱敏 DTO ──

export class PIIBatchMaskRequestDto {
  texts!: string[];
  maskChar?: string;
  withKind?: boolean;
}

export class PIIBatchMaskResponseDto {
  results!: string[];
  totalMatched!: number;
}

// ── GDPR Erasure DTO ──

export class ErasureRequestDto {
  /** 用户 ID */
  userId!: string;
  /** 租户 ID */
  tenantId!: string;
  /** 原因 */
  reason?: string;
  /** 操作人 */
  requestedBy?: string;
  /** 自定义 grace period (ms), 默认 30 天 */
  gracePeriodMs?: number;
}

export class ErasureCancelDto {
  /** 撤销原因 */
  reason?: string;
}

export class ErasureResponseDto {
  /** 请求 ID */
  requestId!: string;
  /** 用户 ID */
  userId!: string;
  /** 当前状态 */
  status!: string;
  /** 请求时间 */
  requestedAt!: string;
  /** Grace period 截止 */
  graceDeadline?: string;
  /** 硬删除时间 */
  erasedAt?: string;
  /** 恢复时间 */
  restoredAt?: string;
  /** 原因 */
  reason?: string;
}

export class ErasureHardDeleteResponseDto {
  userId!: string;
  deletedFromModules!: Record<string, number>;
  totalDeleted!: number;
}

export class ErasureScheduledDeletionsResponseDto {
  processed!: number;
  details!: Array<{
    userId: string;
    totalDeleted: number;
  }>;
}

// ── 审计日志 DTO ──

export class AuditLogAppendDto {
  /** 租户 ID */
  tenantId!: string;
  /** 操作人 */
  actorId!: string;
  /** 动作类型 */
  action!: AuditAction;
  /** 自定义动作 (action='CUSTOM' 时必填) */
  customAction?: string;
  /** 资源类型 */
  resource!: string;
  /** 资源 ID */
  resourceId!: string;
  /** 变更前 */
  before?: unknown;
  /** 变更后 */
  after?: unknown;
  /** 客户端 IP */
  ip?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 额外元数据 */
  meta?: Record<string, unknown>;
}

export class AuditLogQueryDto {
  tenantId?: string;
  actorId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  fromTs?: string;
  toTs?: string;
  page?: number;
  pageSize?: number;
}

export class AuditLogExportDto {
  /** 导出格式 */
  format!: 'csv' | 'json';
  /** 过滤条件 */
  filter?: {
    tenantId?: string;
    actorId?: string;
    action?: AuditAction;
    resource?: string;
    resourceId?: string;
    fromTs?: string;
    toTs?: string;
  };
  /** 保留期 (天), 默认 7 年 */
  retentionDays?: number;
  /** 分页 */
  page?: number;
  pageSize?: number;
}

export class AuditVerifyResponseDto {
  valid!: boolean;
  brokenAtSeq?: number;
  totalChecked!: number;
  checkedAt!: string;
}

// ── 合规健康检查 DTO ──

export class ComplianceHealthResponseDto {
  status!: string;
  services!: Record<string, string>;
  auditLogSize!: number;
  pendingErasures!: number;
  cascadeModules!: string[];
  checkedAt!: string;
}
