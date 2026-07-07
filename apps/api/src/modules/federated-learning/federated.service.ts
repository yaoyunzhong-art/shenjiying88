/**
 * Phase 97 联邦学习 Service (V10 Sprint 2 Day 26-27)
 *
 * 核心能力:
 * 1. 联邦任务 CRUD
 * 2. 训练轮次编排 (collecting → aggregating → completed)
 * 3. 客户端梯度提交 + 验证
 * 4. FedAvg/FedProx/SCAFFOLD 聚合
 * 5. 同态加密梯度 (HE 抽象层)
 * 6. 差分隐私噪声 + 预算追踪 (ε/δ)
 * 7. 梯度裁剪 (L2 clipping)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  FederatedTask,
  FederatedRound,
  GradientSubmission,
  PrivacyAccount,
  AggregationResult,
  AggregationMethod,
  RoundStatus,
  SubmissionStatus,
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
  MockHomomorphicCipher,
  HomomorphicCipher,
} from './federated.entity'
import type {
  CreateFederatedTaskDto,
  StartRoundDto,
  SubmitGradientDto,
  FederatedTaskResponse,
  RoundResponse,
  AggregationResponse,
} from './federated.dto'

@Injectable()
export class FederatedLearningService {
  /** 任务存储 */
  private readonly tasks = new Map<string, FederatedTask>()
  /** tenantId → taskIds (coordinator) */
  private readonly tasksByTenant = new Map<string, Set<string>>()
  /** 轮次存储 */
  private readonly rounds = new Map<string, FederatedRound>()
  /** taskId → roundIds */
  private readonly roundsByTask = new Map<string, Set<string>>()
  /** 提交存储 */
  private readonly submissions = new Map<string, GradientSubmission>()
  /** roundId → submissionIds */
  private readonly submissionsByRound = new Map<string, Set<string>>()
  /** 隐私账户 (taskId → PrivacyAccount) */
  private readonly privacyAccounts = new Map<string, PrivacyAccount>()

  /** 同态加密实例 (可注入) */
  private cipher: HomomorphicCipher = new MockHomomorphicCipher()
  /** 当前全局模型版本 (按 task 维度) */
  private readonly modelVersions = new Map<string, number>()

  setCipher(c: HomomorphicCipher): void { this.cipher = c }

  // ============ 1. 任务 CRUD ============

  async createTask(dto: CreateFederatedTaskDto): Promise<FederatedTask> {
    const ctx = requireTenantContext()
    if (dto.participantTenantIds.length === 0) {
      throw new BadRequestException('participantTenantIds 至少 1 个')
    }
    if (dto.privacyBudgetEpsilon !== undefined && dto.privacyBudgetEpsilon <= 0) {
      throw new BadRequestException('privacyBudgetEpsilon 必须 > 0')
    }

    const now = new Date().toISOString()
    const task: FederatedTask = {
      id: generateTaskId(),
      name: dto.name,
      modelArch: dto.modelArch,
      coordinatorTenantId: ctx.tenantId,
      participantTenantIds: dto.participantTenantIds,
      aggregationMethod: dto.aggregationMethod ?? 'fedavg',
      totalRounds: dto.totalRounds ?? 10,
      currentRound: 0,
      status: 'draft',
      privacyBudgetEpsilon: dto.privacyBudgetEpsilon ?? 1.0,
      privacyBudgetDelta: dto.privacyBudgetDelta ?? 1e-5,
      consumedEpsilon: 0,
      consumedDelta: 0,
      minParticipants: dto.minParticipants ?? 2,
      noiseMultiplier: dto.noiseMultiplier ?? 1.1,
      maxGradientNorm: dto.maxGradientNorm ?? 1.0,
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.set(task.id, task)
    if (!this.tasksByTenant.has(ctx.tenantId)) {
      this.tasksByTenant.set(ctx.tenantId, new Set())
    }
    this.tasksByTenant.get(ctx.tenantId)!.add(task.id)

    // 初始化隐私账户
    this.privacyAccounts.set(task.id, {
      taskId: task.id,
      totalEpsilon: task.privacyBudgetEpsilon,
      consumedEpsilon: 0,
      totalDelta: task.privacyBudgetDelta,
      consumedDelta: 0,
      compositionMethod: 'basic',
      updatedAt: now,
    })

    // 初始化全局模型版本
    this.modelVersions.set(task.id, 0)

    return task
  }

  async listTasks(): Promise<FederatedTaskResponse[]> {
    const ctx = requireTenantContext()
    const ids = this.tasksByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.tasks.get(id))
      .filter((t): t is FederatedTask => t != null)
      .map((t) => this.toTaskResponse(t))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async getTask(id: string): Promise<FederatedTaskResponse> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(id)
    if (!task || task.coordinatorTenantId !== ctx.tenantId) {
      throw new NotFoundException(`联邦任务 ${id} 不存在`)
    }
    return this.toTaskResponse(task)
  }

  async activateTask(id: string): Promise<FederatedTaskResponse> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(id)
    if (!task || task.coordinatorTenantId !== ctx.tenantId) {
      throw new NotFoundException(`联邦任务 ${id} 不存在`)
    }
    if (task.status !== 'draft' && task.status !== 'paused') {
      throw new BadRequestException(`只能从 draft/paused 启动 (当前 ${task.status})`)
    }
    task.status = 'active'
    task.updatedAt = new Date().toISOString()
    return this.toTaskResponse(task)
  }

  // ============ 2. 轮次编排 ============

  async startRound(taskId: string, dto: StartRoundDto = {}): Promise<RoundResponse> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(taskId)
    if (!task || task.coordinatorTenantId !== ctx.tenantId) {
      throw new NotFoundException(`联邦任务 ${taskId} 不存在`)
    }
    if (task.status !== 'active') {
      throw new BadRequestException(`任务未激活 (当前 ${task.status})`)
    }
    if (task.currentRound >= task.totalRounds) {
      throw new BadRequestException(`已达总轮次 ${task.totalRounds}`)
    }
    // 预算检查
    if (task.consumedEpsilon >= task.privacyBudgetEpsilon) {
      throw new BadRequestException(`隐私预算已用尽 (ε=${task.consumedEpsilon}/${task.privacyBudgetEpsilon})`)
    }

    const nextRoundNum = task.currentRound + 1
    const globalVer = this.modelVersions.get(taskId) ?? 0
    const deadlineMs = dto.collectionDeadlineMs ?? 60 * 60 * 1000 // 默认 1 小时
    const now = new Date()
    const deadline = new Date(now.getTime() + deadlineMs)

    const round: FederatedRound = {
      id: generateRoundId(),
      taskId,
      roundNumber: nextRoundNum,
      status: 'collecting',
      globalModelVersion: globalVer,
      expectedParticipants: task.participantTenantIds.length,
      actualParticipants: 0,
      collectionStartedAt: now.toISOString(),
      collectionDeadlineAt: deadline.toISOString(),
      epsilonConsumed: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    this.rounds.set(round.id, round)
    if (!this.roundsByTask.has(taskId)) {
      this.roundsByTask.set(taskId, new Set())
    }
    this.roundsByTask.get(taskId)!.add(round.id)
    task.currentRound = nextRoundNum
    task.updatedAt = now.toISOString()
    return this.toRoundResponse(round)
  }

  async listRounds(taskId: string): Promise<RoundResponse[]> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new NotFoundException(`联邦任务 ${taskId} 不存在`)
    }
    // 协调者及参与者均可查看轮次
    if (task.coordinatorTenantId !== ctx.tenantId && !task.participantTenantIds.includes(ctx.tenantId)) {
      throw new NotFoundException(`联邦任务 ${taskId} 不存在`)
    }
    const ids = this.roundsByTask.get(taskId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.rounds.get(id))
      .filter((r): r is FederatedRound => r != null)
      .map((r) => this.toRoundResponse(r))
      .sort((a, b) => a.roundNumber - b.roundNumber)
  }

  // ============ 3. 客户端梯度提交 ============

  async submitGradient(taskId: string, dto: SubmitGradientDto): Promise<{ submissionId: string; status: SubmissionStatus }> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(taskId)
    if (!task) throw new NotFoundException(`联邦任务 ${taskId} 不存在`)

    // 租户白名单
    if (!task.participantTenantIds.includes(ctx.tenantId)) {
      throw new ForbiddenException(`租户 ${ctx.tenantId} 不在该任务白名单`)
    }
    const round = this.rounds.get(dto.roundId)
    if (!round || round.taskId !== taskId) {
      throw new NotFoundException(`轮次 ${dto.roundId} 不存在`)
    }
    if (round.status !== 'collecting') {
      throw new BadRequestException(`轮次不在收集阶段 (当前 ${round.status})`)
    }
    if (round.collectionDeadlineAt && new Date(round.collectionDeadlineAt) < new Date()) {
      throw new BadRequestException(`轮次已过截止时间`)
    }
    // 同租户每个 round 只能提交一次
    const existingForRound = [...(this.submissionsByRound.get(round.id) ?? new Set())].map((id) => this.submissions.get(id))
      .filter((s): s is GradientSubmission => s != null)
      .find((s) => s.tenantId === ctx.tenantId)
    if (existingForRound) {
      throw new BadRequestException(`租户 ${ctx.tenantId} 在该轮次已提交`)
    }

    const sub: GradientSubmission = {
      id: generateSubmissionId(),
      roundId: round.id,
      taskId,
      tenantId: ctx.tenantId,
      sampleCount: dto.sampleCount,
      encryptedGradients: dto.encryptedGradients,
      noiseSeed: `seed-${randomUUID().slice(0, 8)}`,
      status: 'accepted',
      submittedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.submissions.set(sub.id, sub)
    if (!this.submissionsByRound.has(round.id)) {
      this.submissionsByRound.set(round.id, new Set())
    }
    this.submissionsByRound.get(round.id)!.add(sub.id)
    round.actualParticipants++
    round.updatedAt = new Date().toISOString()
    return { submissionId: sub.id, status: sub.status }
  }

  // ============ 4. 聚合 (FedAvg/FedProx/SCAFFOLD) ============

  async aggregateRound(roundId: string): Promise<AggregationResponse> {
    const ctx = requireTenantContext()
    const round = this.rounds.get(roundId)
    if (!round) throw new NotFoundException(`轮次 ${roundId} 不存在`)
    const task = this.tasks.get(round.taskId)
    if (!task || task.coordinatorTenantId !== ctx.tenantId) {
      throw new NotFoundException(`联邦任务不存在或非协调方`)
    }
    if (round.status !== 'collecting') {
      throw new BadRequestException(`轮次不在收集阶段 (当前 ${round.status})`)
    }
    if (round.actualParticipants < task.minParticipants) {
      round.status = 'failed'
      round.failureReason = `客户端不足 (${round.actualParticipants}/${task.minParticipants})`
      round.updatedAt = new Date().toISOString()
      throw new BadRequestException(round.failureReason)
    }

    const startTime = Date.now()
    round.status = 'aggregating'

    // 1. 收集所有已接受提交
    const subs = [...(this.submissionsByRound.get(roundId) ?? new Set())].map((id) => this.submissions.get(id))
      .filter((s): s is GradientSubmission => s != null && s.status === 'accepted')

    // 2. 解密所有梯度 (生产: 用同态性质不解密, 这里为简化先解密)
    const decrypted: number[][] = []
    let totalSamples = 0
    let lossSum = 0
    for (const sub of subs) {
      try {
        const grad = this.cipher.decrypt(sub.encryptedGradients)
        const clipped = clipGradient(grad, task.maxGradientNorm)
        decrypted.push(clipped)
        totalSamples += sub.sampleCount
      } catch {
        // 解密失败 - 跳过
      }
    }

    if (decrypted.length === 0) {
      round.status = 'failed'
      round.failureReason = '无有效梯度'
      throw new BadRequestException(round.failureReason)
    }

    // 3. 加权聚合 (这里简化为均匀)
    let aggregated: number[]
    if (task.aggregationMethod === 'fedavg') {
      aggregated = fedAvg(decrypted)
    } else if (task.aggregationMethod === 'fedprox') {
      aggregated = fedProx(decrypted)
    } else {
      aggregated = scaffold(decrypted)
    }

    // 4. 加 DP 噪声
    const noise = gaussianNoise(task.noiseMultiplier, aggregated.length)
    aggregated = aggregated.map((g, i) => g + noise[i])

    // 5. 计算 ε/δ 消耗 (高斯机制)
    const delta = task.privacyBudgetDelta / task.totalRounds // 平摊到每轮
    const epsilon = computeEpsilonConsumed(task.maxGradientNorm, task.noiseMultiplier, delta)
    round.epsilonConsumed = epsilon

    // 6. 加密聚合后的梯度 (再加密发回客户端)
    const aggregatedEncrypted = this.cipher.encrypt(aggregated)

    // 7. 更新隐私账户
    const account = this.privacyAccounts.get(task.id)!
    account.consumedEpsilon += epsilon
    account.consumedDelta += delta
    task.consumedEpsilon = account.consumedEpsilon
    task.consumedDelta = account.consumedDelta
    account.updatedAt = new Date().toISOString()

    // 8. 更新 round + task 状态
    round.nextModelVersion = round.globalModelVersion + 1
    round.aggregatedAt = new Date().toISOString()
    round.status = 'completed'
    round.aggregatedLoss = lossSum / subs.length || 0
    round.updatedAt = round.aggregatedAt
    this.modelVersions.set(task.id, round.nextModelVersion)

    if (task.currentRound >= task.totalRounds) {
      task.status = 'completed'
    }

    return {
      roundId: round.id,
      globalModelVersion: round.nextModelVersion!,
      participantCount: subs.length,
      totalSamples,
      averageLoss: round.aggregatedLoss ?? 0,
      epsilonConsumed: epsilon,
      deltaConsumed: delta,
      method: task.aggregationMethod,
      durationMs: Date.now() - startTime,
    }
  }

  // ============ 5. 隐私预算查询 ============

  async getPrivacyAccount(taskId: string): Promise<PrivacyAccount> {
    const ctx = requireTenantContext()
    const task = this.tasks.get(taskId)
    if (!task || task.coordinatorTenantId !== ctx.tenantId) {
      throw new NotFoundException(`联邦任务 ${taskId} 不存在`)
    }
    const account = this.privacyAccounts.get(taskId)
    if (!account) throw new NotFoundException(`隐私账户不存在`)
    return account
  }

  // ============ 6. 测试/工具函数 (导出便于测试) ============

  static fedAvg = fedAvg
  static fedProx = fedProx
  static scaffold = scaffold
  static gaussianNoise = gaussianNoise
  static clipGradient = clipGradient
  static computeEpsilonConsumed = computeEpsilonConsumed
  static basicComposition = basicComposition
  static advancedComposition = advancedComposition

  // ============ 测试用统计 ============
  countTasks(): number { return this.tasks.size }
  countRounds(): number { return this.rounds.size }
  countSubmissions(): number { return this.submissions.size }

  // ============ Helper: 响应映射 ============
  private toTaskResponse(t: FederatedTask): FederatedTaskResponse {
    return {
      id: t.id,
      name: t.name,
      modelArch: t.modelArch,
      coordinatorTenantId: t.coordinatorTenantId,
      participantTenantIds: t.participantTenantIds,
      aggregationMethod: t.aggregationMethod,
      totalRounds: t.totalRounds,
      currentRound: t.currentRound,
      status: t.status,
      privacyBudgetEpsilon: t.privacyBudgetEpsilon,
      privacyBudgetDelta: t.privacyBudgetDelta,
      consumedEpsilon: t.consumedEpsilon,
      consumedDelta: t.consumedDelta,
      minParticipants: t.minParticipants,
      noiseMultiplier: t.noiseMultiplier,
      maxGradientNorm: t.maxGradientNorm,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  private toRoundResponse(r: FederatedRound): RoundResponse {
    return {
      id: r.id,
      taskId: r.taskId,
      roundNumber: r.roundNumber,
      status: r.status,
      globalModelVersion: r.globalModelVersion,
      nextModelVersion: r.nextModelVersion,
      expectedParticipants: r.expectedParticipants,
      actualParticipants: r.actualParticipants,
      collectionStartedAt: r.collectionStartedAt,
      collectionDeadlineAt: r.collectionDeadlineAt,
      aggregatedAt: r.aggregatedAt,
      epsilonConsumed: r.epsilonConsumed,
      aggregatedLoss: r.aggregatedLoss,
      failureReason: r.failureReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }
  }
}