/**
 * chaos.service.ts — Chaos Service (canonical name)
 *
 * 混沌工程模块入口。
 * 统一导出故障注入 & 实验编排的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   ChaosExperimentService     混沌实验生命周期管理
 *   FaultInjectionService      故障注入引擎 (CPU/内存/网络/磁盘/进程)
 *   ChaosAutoRollbackService   自动回滚 & 熔断
 *
 * 实体类型 ─────────────────────
 *   ExperimentStatus            PENDING / RUNNING / PAUSED / COMPLETED / FAILED
 *   FaultType                   LATENCY / ERROR / TIMEOUT / CPU_BURN
 *   RollbackTrigger             MANUAL / AUTO / SCHEDULED
 *   FaultInjection              故障注入定义
 *   ExperimentMetrics            实验指标
 *   ExperimentResult             实验结果
 *   ChaosExperiment              实验实体
 *   RollbackHistoryEntry         回滚历史
 *   SystemMetrics                系统指标
 *   HealthStatus                 健康状态
 *
 * DTO ──────────────────────────
 *   CreateExperimentDto / UpdateExperimentDto / RunExperimentDto
 *   PauseExperimentDto / HealthMetricDto / InjectFaultDto / ExperimentIdParam
 *
 * Contract ────────────────────
 *   ChaosExperimentContract / FaultInjectionContract
 *   ExperimentResultContract / RollbackHistoryContract
 *   HealthStatusContract / SystemMetricsContract
 *
 * 常量 ─────────────────────────
 *   FAULT_TYPES, DEFAULT_EXPERIMENT_TIMEOUT_MS, AUTO_ROLLBACK_CONDITIONS
 *   EXPERIMENT_STATUS_TRANSITIONS, MAX_CONCURRENT_EXPERIMENTS
 *   CHAOS_BLAST_RADIUS, DEFAULT_FAULT_DURATION_MS
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { ChaosExperimentService, FaultInjection } from './chaos.service'
 *   const svc = app.get(ChaosExperimentService)
 *   const exp = svc.createExperiment(tenantId, { name, faults, target })
 *   const result = svc.executeExperiment(exp.id)
 *
 * @module Chaos
 */

export {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  ExperimentStatus,
  FaultType,
  RollbackTrigger,
  FaultInjection,
  ExperimentMetrics,
  ExperimentResult,
  ChaosExperiment,
  RollbackHistoryEntry,
  SystemMetrics,
  HealthStatus,
} from './chaos-engineering.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export {
  CreateExperimentDto,
  UpdateExperimentDto,
  RunExperimentDto,
  PauseExperimentDto,
  HealthMetricDto,
  InjectFaultDto,
  ExperimentIdParam,
} from './chaos-engineering.dto'

// ─── Contract ───────────────────────────────────────────────────────────────
export type {
  ChaosExperimentContract,
  FaultInjectionContract,
  ExperimentResultContract,
  RollbackHistoryContract,
  HealthStatusContract,
  SystemMetricsContract,
} from './chaos-engineering.contract'

// ─── 混沌工程常量 ──────────────────────────────────────────────────────────
export const FAULT_TYPES = ['cpu_stress', 'memory_stress', 'network_delay', 'network_loss', 'disk_fill', 'process_kill'] as const
export const DEFAULT_EXPERIMENT_TIMEOUT_MS = 300_000 // 5 min
export const AUTO_ROLLBACK_CONDITIONS = ['error_rate > 5%', 'latency_p99 > 2000ms', 'success_rate < 95%'] as const
export const EXPERIMENT_STATUS_TRANSITIONS = ['draft', 'scheduled', 'running', 'completed', 'failed', 'rollback'] as const
export const MAX_CONCURRENT_EXPERIMENTS = 5
export const CHAOS_BLAST_RADIUS = 'tenant' as const
export const DEFAULT_FAULT_DURATION_MS = 60_000 // 1 min
export const MIN_FAULT_DURATION_MS = 5_000
export const EXPERIMENT_CLEANUP_GRACE_PERIOD_MS = 30_000
export const CHAOS_AUDIT_LOG_ENABLED = true
export const CHAOS_METRICS_COLLECTION_INTERVAL_MS = 5_000 // 5s
