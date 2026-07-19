/**
 * chaos.service.ts — Chaos Service (canonical name)
 *
 * 混沌工程模块入口。
 * 统一导出故障注入 & 实验编排的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   ChaosExperimentService    混沌实验生命周期管理 (创建/执行/回滚)
 *   FaultInjectionService     故障注入引擎 (CPU/内存/网络/磁盘)
 *   ChaosAutoRollbackService  自动回滚 & 熔断
 *
 * 实体类型 ─────────────────────
 *   ChaosExperiment          实验定义
 *   ChaosFault               故障模板
 *   ExperimentTarget          实验目标
 *   ExperimentResult          实验结果
 *   RollbackPlan              回滚计划
 *   ChaosWorkflow             工作流
 *
 * DTO 类型 ─────────────────────
 *   CreateExperimentDto       创建实验 DTO
 *   UpdateExperimentDto       更新实验 DTO
 *   RunExperimentDto          运行实验 DTO
 *   ExperimentListResponse    实验列表响应
 *
 * Contract ────────────────────
 *   ChaosContract             契约定义
 *   ExperimentConstraints     实验约束
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { ChaosExperimentService, ChaosFault } from './chaos.service'
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
  ChaosExperiment,
  ChaosFault,
  ExperimentTarget,
  ExperimentResult,
  RollbackPlan,
  ChaosWorkflow,
} from './chaos-engineering.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export type {
  CreateExperimentDto,
  UpdateExperimentDto,
  RunExperimentDto,
  ExperimentListResponse,
} from './chaos-engineering.dto'

// ─── Contract ───────────────────────────────────────────────────────────────
export type { ChaosContract, ExperimentConstraints } from './chaos-engineering.contract'

// ─── 混沌工程常量 ──────────────────────────────────────────────────────────
export const FAULT_TYPES = ['cpu_stress', 'memory_stress', 'network_delay', 'network_loss', 'disk_fill', 'process_kill'] as const
export const DEFAULT_EXPERIMENT_TIMEOUT_MS = 300_000 // 5 min
export const AUTO_ROLLBACK_CONDITIONS = ['error_rate > 5%', 'latency_p99 > 2000ms', 'success_rate < 95%'] as const
