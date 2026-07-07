/**
 * 灰度发布 - Service (V9 需求 6 · V10 Day 8 Phase 92)
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  CanaryExperiment, CanaryEvaluationRequest, CanaryEvaluationResponse,
  CanaryHealthSnapshot, CanaryAuditLog, CanaryStatus, CanaryStrategyConfig,
} from './canary.entity'

@Injectable()
export class CanaryService {
  private readonly experiments = new Map<string, CanaryExperiment>()
  private readonly audits: CanaryAuditLog[] = []
  private readonly healthSnapshots: CanaryHealthSnapshot[] = []

  constructor() {
    this.seed()
  }

  // ============ 1. 实验 CRUD ============

  createExperiment(input: Omit<CanaryExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentPercentage'>): CanaryExperiment {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const exp: CanaryExperiment = {
      ...input, id,
      status: 'draft', currentPercentage: 0,
      createdAt: now, updatedAt: now,
    }
    this.experiments.set(id, exp)
    this.recordAudit({ experimentId: id, action: 'create', toStatus: 'draft', operator: input.createdBy })
    return exp
  }

  getExperiment(id: string): CanaryExperiment | null {
    return this.experiments.get(id) ?? null
  }

  listExperiments(): CanaryExperiment[] {
    return Array.from(this.experiments.values())
  }

  // ============ 2. 状态机 ============

  activate(id: string, operator: string): CanaryExperiment | null {
    const exp = this.experiments.get(id)
    if (!exp) return null
    if (exp.status !== 'draft' && exp.status !== 'paused') {
      throw new BadRequestException(`Cannot activate from status=${exp.status}`)
    }
    const from = exp.status
    exp.status = 'active'
    exp.startedAt = exp.startedAt ?? new Date().toISOString()
    exp.currentPercentage = exp.currentPercentage || exp.initialPercentage
    exp.updatedAt = new Date().toISOString()
    this.recordAudit({ experimentId: id, action: 'activate', fromStatus: from, toStatus: 'active', operator })
    return exp
  }

  pause(id: string, operator: string, reason?: string): CanaryExperiment | null {
    const exp = this.experiments.get(id)
    if (!exp) return null
    if (exp.status !== 'active') {
      throw new BadRequestException(`Cannot pause from status=${exp.status}`)
    }
    exp.status = 'paused'
    exp.updatedAt = new Date().toISOString()
    this.recordAudit({ experimentId: id, action: 'pause', fromStatus: 'active', toStatus: 'paused', operator, reason })
    return exp
  }

  rollback(id: string, operator: string, reason: string): CanaryExperiment | null {
    const exp = this.experiments.get(id)
    if (!exp) return null
    const from = exp.status
    const fromPct = exp.currentPercentage
    exp.status = 'rolled_back'
    exp.currentPercentage = 0
    exp.endedAt = new Date().toISOString()
    exp.updatedAt = new Date().toISOString()
    this.recordAudit({
      experimentId: id, action: 'rollback', fromStatus: from, toStatus: 'rolled_back',
      fromPercentage: fromPct, toPercentage: 0, operator, reason,
    })
    return exp
  }

  promote(id: string, newPercentage: number, operator: string): CanaryExperiment | null {
    const exp = this.experiments.get(id)
    if (!exp) return null
    if (exp.status !== 'active') {
      throw new BadRequestException(`Cannot promote from status=${exp.status}`)
    }
    if (newPercentage < exp.currentPercentage || newPercentage > exp.targetPercentage) {
      throw new BadRequestException(`Invalid promote percentage: ${newPercentage} (current=${exp.currentPercentage} target=${exp.targetPercentage})`)
    }
    const fromPct = exp.currentPercentage
    exp.currentPercentage = newPercentage
    exp.updatedAt = new Date().toISOString()
    if (newPercentage >= exp.targetPercentage) {
      exp.status = 'completed'
      exp.endedAt = new Date().toISOString()
    }
    this.recordAudit({
      experimentId: id, action: 'promote', fromPercentage: fromPct, toPercentage: newPercentage,
      operator, reason: exp.status === 'completed' ? 'reached target' : undefined,
    })
    return exp
  }

  // ============ 3. 评估 (核心: 受众匹配) ============

  evaluate(req: CanaryEvaluationRequest): CanaryEvaluationResponse {
    const activeExps = Array.from(this.experiments.values()).filter(
      (e) => e.flagKey === req.flagKey && e.status === 'active',
    )

    for (const exp of activeExps) {
      const matched = this.matchesStrategy(exp.strategyConfig, req)
      if (matched) {
        return {
          flagKey: req.flagKey,
          enabled: true,
          matchedStrategy: exp.strategy,
          experimentId: exp.id,
          percentage: exp.currentPercentage,
          reason: `Matched ${exp.strategy} strategy`,
        }
      }
    }
    return { flagKey: req.flagKey, enabled: false, matchedStrategy: null, reason: 'No matching experiment' }
  }

  private matchesStrategy(config: CanaryStrategyConfig, req: CanaryEvaluationRequest): boolean {
    switch (config.type) {
      case 'percentage':
        // 基于 tenantId hash 决定
        if (!config.includeAll && !req.tenantId) return false
        return true // 简化: 配合 currentPercentage 使用 hash 判断
      case 'tenant':
        return config.tenantIds.includes(req.tenantId)
      case 'store':
        return req.storeId ? config.storeIds.includes(req.storeId) : false
      case 'tag':
        const reqTags = req.tags ?? []
        return config.matchAll
          ? config.tags.every((t) => reqTags.includes(t))
          : config.tags.some((t) => reqTags.includes(t))
    }
  }

  // ============ 4. 健康监控 ============

  recordHealth(snapshot: Omit<CanaryHealthSnapshot, 'timestamp'>): CanaryHealthSnapshot {
    const full: CanaryHealthSnapshot = {
      ...snapshot,
      timestamp: new Date().toISOString(),
      isHealthy: snapshot.errorRate < 0.01 && snapshot.latencyP95 < 1000,
    }
    this.healthSnapshots.push(full)
    if (this.healthSnapshots.length > 10000) this.healthSnapshots.shift()
    return full
  }

  getLatestHealth(experimentId: string): CanaryHealthSnapshot | null {
    const filtered = this.healthSnapshots.filter((s) => s.experimentId === experimentId)
    return filtered[filtered.length - 1] ?? null
  }

  listHealth(experimentId: string, limit = 100): CanaryHealthSnapshot[] {
    return this.healthSnapshots.filter((s) => s.experimentId === experimentId).slice(-limit)
  }

  // ============ 5. 自动晋级检查 ============

  /** 检查是否应该自动晋级 */
  checkAutoPromote(experimentId: string): { shouldPromote: boolean; nextPercentage?: number; reason: string } {
    const exp = this.experiments.get(experimentId)
    if (!exp || !exp.autoPromote) return { shouldPromote: false, reason: 'No auto promote rule' }
    if (exp.status !== 'active') return { shouldPromote: false, reason: `Not active (${exp.status})` }

    const health = this.getLatestHealth(experimentId)
    if (!health) return { shouldPromote: false, reason: 'No health data' }
    if (!health.isHealthy) return { shouldPromote: false, reason: 'Unhealthy' }

    const nextStep = exp.autoPromote.promoteSteps.find((s) => s > exp.currentPercentage)
    if (!nextStep) return { shouldPromote: false, reason: 'Reached max promotion step' }
    return { shouldPromote: true, nextPercentage: nextStep, reason: 'All checks passed' }
  }

  // ============ 6. 审计 ============

  listAuditLogs(experimentId: string): CanaryAuditLog[] {
    return this.audits.filter((a) => a.experimentId === experimentId)
  }

  private recordAudit(input: Omit<CanaryAuditLog, 'id' | 'timestamp'>): void {
    this.audits.push({
      ...input,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    })
    if (this.audits.length > 5000) this.audits.shift()
  }

  // ============ 7. 种子 ============

  private seed(): void {
    const now = new Date().toISOString()
    this.experiments.set('exp-seed-ai-v2', {
      id: 'exp-seed-ai-v2', name: 'AI 模型 V2 灰度',
      description: '新 AI 模型分阶段上线',
      flagKey: 'ai.model.v2_enabled',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: true },
      status: 'active',
      initialPercentage: 10,
      targetPercentage: 100,
      currentPercentage: 25,
      startedAt: now,
      autoPromote: {
        checkIntervalMin: 30,
        healthMetrics: ['error_rate', 'latency_p95'],
        promoteSteps: [10, 25, 50, 75, 100],
        healthThreshold: 0.01,
        maxPromotions: 5,
      },
      healthThreshold: 0.01,
      createdBy: 'system',
      createdAt: now, updatedAt: now,
    })
    this.experiments.set('exp-seed-checkout', {
      id: 'exp-seed-checkout', name: '新结算流程',
      description: '门店 store-001, store-002 优先体验',
      flagKey: 'checkout.new_flow',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
      status: 'active',
      initialPercentage: 100,
      targetPercentage: 100,
      currentPercentage: 100,
      startedAt: now,
      createdBy: 'system',
      createdAt: now, updatedAt: now,
    })
  }
}
