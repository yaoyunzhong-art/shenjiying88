/**
 * federated-learning.service.ts — Federated Learning Service (canonical name)
 *
 * 联邦学习模块入口。
 * 统一导出联邦任务、梯度聚合、差分隐私的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   FederatedLearningService     联邦任务/轮次/梯度管理
 *
 * 实体类型 ─────────────────────
 *   AggregationMethod             fedavg / fedprox / scaffold
 *   RoundStatus                   draft → collecting → aggregating → completed / failed
 *   SubmissionStatus              pending / submitted / accepted / rejected
 *   FederatedTask                 联邦任务
 *   FederatedRound                训练轮次
 *   GradientSubmission            梯度提交
 *   PrivacyAccount                差分隐私账户
 *   AggregationResult             聚合结果
 *
 * 聚合算法 ─────────────────────
 *   fedAvg                        加权平均
 *   fedProx                       近端项 FedProx
 *   scaffold                      控制变量修正 SCAFFOLD
 *
 * 差分隐私 ─────────────────────
 *   gaussianNoise                 高斯噪声
 *   clipGradient                  梯度裁剪
 *   computeEpsilonConsumed        ε 消耗计算
 *   basicComposition              ε 基本组合
 *   advancedComposition           ε 高级组合
 *
 * 同态加密 ─────────────────────
 *   HomomorphicCipher             同态加密接口
 *   MockHomomorphicCipher         Mock 实现 (加法同态)
 *
 * ID 生成 ───────────────────────
 *   generateTaskId / generateRoundId / generateSubmissionId
 *
 * DTO ──────────────────────────
 *   CreateFederatedTaskDto / StartRoundDto / SubmitGradientDto
 *   FederatedTaskResponse / RoundResponse / AggregationResponse
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { FederatedLearningService, FederatedTask, fedAvg } from './federated-learning.service'
 *   const svc = app.get(FederatedLearningService)
 *   const task = svc.createTask(coordinatorId, { name, modelArch, participants })
 *   const round = svc.startRound(task.id)
 *
 * @module FederatedLearning
 */

export { FederatedLearningService } from './federated.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  AggregationMethod,
  RoundStatus,
  SubmissionStatus,
  FederatedTask,
  FederatedRound,
  GradientSubmission,
  PrivacyAccount,
  AggregationResult,
} from './federated.entity'

// ─── 工具函数 ───────────────────────────────────────────────────────────────
export {
  generateTaskId,
  generateRoundId,
  generateSubmissionId,
  fedAvg,
  fedProx,
  scaffold,
  gaussianNoise,
  clipGradient,
  computeEpsilonConsumed,
  basicComposition,
  advancedComposition,
} from './federated.entity'

// ─── 同态加密 ──────────────────────────────────────────────────────────────
export type { HomomorphicCipher } from './federated.entity'
export { MockHomomorphicCipher } from './federated.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export type {
  CreateFederatedTaskDto,
  StartRoundDto,
  SubmitGradientDto,
  FederatedTaskResponse,
  RoundResponse,
  AggregationResponse,
} from './federated.dto'

// ─── 联邦学习常量 ──────────────────────────────────────────────────────────
export const DEFAULT_MIN_PARTICIPANTS = 2
export const DEFAULT_NOISE_MULTIPLIER = 1.0
export const DEFAULT_MAX_GRADIENT_NORM = 1.0
export const DEFAULT_PRIVACY_EPSILON = 4.0
export const DEFAULT_PRIVACY_DELTA = 1e-5
export const AGGREGATION_METHODS: AggregationMethod[] = ['fedavg', 'fedprox', 'scaffold']
