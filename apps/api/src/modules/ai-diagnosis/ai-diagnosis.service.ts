import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'

const diagnosisStore = new Map<string, DiagnosisEntity>()
const batchStore = new Map<string, DiagnosisBatch>()
let createSeq = 0

@Injectable()
export class AiDiagnosisService {
  // ── 存储重置（仅供测试使用） ──

  static resetStores(): void {
    diagnosisStore.clear()
    batchStore.clear()
  }

  // ── 创建诊断 ──

  createDiagnosis(input: {
    engineId: string
    scenarioId: string
    tenantId: string
    requestedBy: string
    promptSummary?: string
    inputSnapshot?: Record<string, unknown>
  }): DiagnosisEntity {
    const diagnosisId = `diag-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()

    const diagnosis: DiagnosisEntity = {
      diagnosisId,
      engineId: input.engineId,
      scenarioId: input.scenarioId,
      status: 'PENDING',
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: input.promptSummary ?? `诊断任务 - ${input.scenarioId}`,
      evaluationDurationMs: 0,
      inputSnapshot: input.inputSnapshot ?? {},
      outputSnapshot: {},
      createdAt: now,
      tenantId: input.tenantId,
      requestedBy: input.requestedBy
    }

    diagnosisStore.set(diagnosisId, diagnosis)
    ;(diagnosis as Record<string, number>)._seq = ++createSeq
    return diagnosis
  }

  // ── 获取单个诊断 ──

  getDiagnosis(diagnosisId: string): DiagnosisEntity | undefined {
    return diagnosisStore.get(diagnosisId)
  }

  // ── 列出诊断 ──

  listDiagnoses(filters?: {
    engineId?: string
    status?: DiagnosisEntity['status']
    riskLevel?: DiagnosisEntity['riskLevel']
    tenantId?: string
  }): { diagnoses: DiagnosisEntity[]; total: number } {
    let results = Array.from(diagnosisStore.values())

    if (filters?.engineId) results = results.filter((d) => d.engineId === filters.engineId)
    if (filters?.status) results = results.filter((d) => d.status === filters.status)
    if (filters?.riskLevel) results = results.filter((d) => d.riskLevel === filters.riskLevel)
    if (filters?.tenantId) results = results.filter((d) => d.tenantId === filters.tenantId)

    // 按创建时间降序，相同时按创建顺序降序
    results.sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (timeDiff !== 0) return timeDiff
      return ((b as Record<string, number>)._seq ?? 0) - ((a as Record<string, number>)._seq ?? 0)
    })

    return { diagnoses: results, total: results.length }
  }

  // ── 更新诊断状态 ──

  updateDiagnosis(
    diagnosisId: string,
    patch: {
      status?: DiagnosisEntity['status']
      riskLevel?: DiagnosisEntity['riskLevel']
      recommendation?: string
      matchedRuleIds?: string[]
      matchedConditionIds?: string[]
      triggeredActionIds?: string[]
      outputSnapshot?: Record<string, unknown>
      evaluationDurationMs?: number
    }
  ): DiagnosisEntity | undefined {
    const existing = diagnosisStore.get(diagnosisId)
    if (!existing) return undefined

    const updated: DiagnosisEntity = {
      ...existing,
      ...patch,
      completedAt:
        patch.status === 'COMPLETED' || patch.status === 'FAILED'
          ? new Date().toISOString()
          : existing.completedAt
    }

    diagnosisStore.set(diagnosisId, updated)
    return updated
  }

  // ── 删除诊断 ──

  deleteDiagnosis(diagnosisId: string): boolean {
    return diagnosisStore.delete(diagnosisId)
  }

  // ── 批量诊断 ──

  createDiagnosisBatch(input: {
    engineId: string
    scenarioIds: string[]
    tenantId: string
    triggeredBy: string
  }): DiagnosisBatch {
    const batchId = `batch-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()

    const diagnoses: DiagnosisEntity[] = input.scenarioIds.map((scenarioId) =>
      this.createDiagnosis({
        engineId: input.engineId,
        scenarioId,
        tenantId: input.tenantId,
        requestedBy: input.triggeredBy,
        promptSummary: `批量诊断 - ${scenarioId}`
      })
    )

    // 自动完成所有诊断（模拟）
    for (const d of diagnoses) {
      const isMatched = d.scenarioId.includes('critical') || d.scenarioId.includes('high')
      this.updateDiagnosis(d.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: isMatched ? 'high' : 'low',
        recommendation: isMatched
          ? `场景 ${d.scenarioId} 触发高风险警告，建议即时检查规则配置`
          : `场景 ${d.scenarioId} 规则执行正常，无异常`,
        matchedRuleIds: isMatched ? [d.engineId] : [],
        matchedConditionIds: isMatched ? ['cond-risk-high'] : [],
        triggeredActionIds: isMatched ? ['act-alert'] : [],
        outputSnapshot: { riskScore: isMatched ? 85 : 5 },
        evaluationDurationMs: Math.floor(Math.random() * 200) + 10
      })
    }

    const completedDiagnoses = diagnoses.map(
      (d) => diagnosisStore.get(d.diagnosisId)!
    )

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 } as Record<DiagnosisEntity['riskLevel'], number>
    for (const d of completedDiagnoses) {
      riskDistribution[d.riskLevel]++
    }

    const batch: DiagnosisBatch = {
      batchId,
      engineId: input.engineId,
      totalDiagnoses: completedDiagnoses.length,
      matchedDiagnoses: completedDiagnoses.filter((d) => d.matchedRuleIds.length > 0).length,
      matchRate:
        completedDiagnoses.length > 0
          ? completedDiagnoses.filter((d) => d.matchedRuleIds.length > 0).length /
            completedDiagnoses.length
          : 0,
      riskDistribution,
      avgEvaluationDurationMs:
        completedDiagnoses.length > 0
          ? Math.round(
              completedDiagnoses.reduce((sum, d) => sum + d.evaluationDurationMs, 0) /
                completedDiagnoses.length
            )
          : 0,
      diagnoses: completedDiagnoses,
      createdAt: now,
      triggeredBy: input.triggeredBy,
      tenantId: input.tenantId
    }

    batchStore.set(batchId, batch)
    ;(batch as Record<string, number>)._seq = ++createSeq
    return batch
  }

  getDiagnosisBatch(batchId: string): DiagnosisBatch | undefined {
    return batchStore.get(batchId)
  }

  listDiagnosisBatches(filters?: { engineId?: string; tenantId?: string }): DiagnosisBatch[] {
    let results = Array.from(batchStore.values())

    if (filters?.engineId) results = results.filter((b) => b.engineId === filters.engineId)
    if (filters?.tenantId) results = results.filter((b) => b.tenantId === filters.tenantId)

    // 按创建时间降序，相同时按创建顺序降序
    results.sort((a, b) => {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (timeDiff !== 0) return timeDiff
      return ((b as Record<string, number>)._seq ?? 0) - ((a as Record<string, number>)._seq ?? 0)
    })
    return results
  }

  // ── 风险报告 ──

  generateRiskReport(filters?: { engineId?: string; tenantId?: string }): {
    generatedAt: string
    totalEvaluated: number
    riskDistribution: { low: number; medium: number; high: number; critical: number }
    topRecommendations: Array<{ diagnosisId: string; riskLevel: string; recommendation: string }>
    averageEvaluationDurationMs: number
  } {
    let diagnoses = Array.from(diagnosisStore.values())

    if (filters?.engineId) diagnoses = diagnoses.filter((d) => d.engineId === filters.engineId)
    if (filters?.tenantId) diagnoses = diagnoses.filter((d) => d.tenantId === filters.tenantId)

    const riskDistribution: Record<DiagnosisEntity['riskLevel'], number> = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const d of diagnoses) {
      riskDistribution[d.riskLevel]++
    }

    const topRecommendations = diagnoses
      .filter((d) => d.riskLevel === 'high' || d.riskLevel === 'critical')
      .sort((a, b) => {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        return (order[a.riskLevel] ?? 99) - (order[b.riskLevel] ?? 99)
      })
      .slice(0, 10)
      .map((d) => ({
        diagnosisId: d.diagnosisId,
        riskLevel: d.riskLevel,
        recommendation: d.recommendation
      }))

    const averageEvaluationDurationMs =
      diagnoses.length > 0
        ? Math.round(
            diagnoses.reduce((sum, d) => sum + d.evaluationDurationMs, 0) / diagnoses.length
          )
        : 0

    return {
      generatedAt: new Date().toISOString(),
      totalEvaluated: diagnoses.length,
      riskDistribution,
      topRecommendations,
      averageEvaluationDurationMs
    }
  }
}
