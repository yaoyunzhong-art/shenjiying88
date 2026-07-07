// auto-rollback.entity.ts - Phase-19 T27
// 用途: 自动回滚实体类型定义
// 关联: auto-rollback.service.ts

export type RollbackStatus =
  | 'PENDING'
  | 'AWAITING_CONFIRM'
  | 'SNAPSHOTTING'
  | 'ROLLING_BACK'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type SnapshotKind = 'DB' | 'REDIS' | 'CONFIG' | 'FULL';

export type RollbackSeverity = 'WARNING' | 'CRITICAL';

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

export interface RollbackConfig {
  criticalRequiresConfirm: boolean;
  confirmationDelayMs: number;
  autoTimeoutMs: number;
  maxConcurrent: number;
  snapshotRetentionMs: number;
}

export interface RollbackTriggerInput {
  reason: string;
  severity: RollbackSeverity;
  metricKey: string;
  anomalyValue: number;
  baselineValue: number;
  snapshotKind?: SnapshotKind;
  trigger?: string;
}

export interface RollbackListFilter {
  status?: RollbackStatus;
  metricKey?: string;
}

export interface RollbackEngineStatus {
  engineName: string;
  activeRecords: number;
  config: RollbackConfig;
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED';
  lastEvaluationAt?: string;
}
