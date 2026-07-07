import { Injectable } from '@nestjs/common'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import type {
  TenantId,
  ABExperiment,
  ABVariantType,
  ABResult
} from './marketing.entity'

/**
 * Phase-42 T172: ABTestEngine (A/B 测试引擎)
 *
 * DR-42-B: hash(memberId) % 2 = 50/50 · 最小样本 1000 · p < 0.05
 *
 * 反模式 v4 ab-test-bias-pattern:
 *  - 样本偏差: 流量分配必须 hash
 *  - 时间偏差: 实验需时间对齐
 *  - 早停: 显著性未达禁止结束
 *  - 网络效应: 用户间影响隔离
 *  - 选择偏差: 随机化避免
 */

const MIN_SAMPLE_SIZE = 1000
const SIGNIFICANCE_LEVEL = 0.05

@Injectable()
export class ABTestEngine {
  constructor(private readonly experimentAdapter: ExperimentAdapter) {}

  /**
   * 简单哈希: memberId → 0/1
   * (用 djb2 哈希, 替代 crypto.createHash 以避免依赖)
   */
  private hash(memberId: string): number {
    let hash = 5381
    for (let i = 0; i < memberId.length; i++) {
      hash = ((hash << 5) + hash + memberId.charCodeAt(i)) & 0xffffffff
    }
    return Math.abs(hash)
  }

  /**
   * 分配变体: 基于 hash 决定 A 或 B
   */
  assignVariant(experimentId: string, memberId: string): ABVariantType {
    const existing = this.experimentAdapter.getAssignment(experimentId, memberId)
    if (existing) return existing.variant

    const variant: ABVariantType = this.hash(memberId) % 2 === 0 ? 'A' : 'B'
    return this.experimentAdapter.recordAssignment(experimentId, memberId, variant).variant
  }

  /**
   * 创建实验
   */
  createExperiment(input: Omit<ABExperiment, 'id' | 'metrics' | 'createdAt'>): ABExperiment {
    const experiment: ABExperiment = {
      ...input,
      id: `ab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      metrics: {
        sentA: 0, sentB: 0,
        clickedA: 0, clickedB: 0,
        convertedA: 0, convertedB: 0,
        revenueCentsA: 0, revenueCentsB: 0
      },
      createdAt: new Date().toISOString()
    }
    return this.experimentAdapter.save(experiment)
  }

  /**
   * 记录曝光
   */
  recordImpression(experimentId: string, memberId: string): void {
    const variant = this.assignVariant(experimentId, memberId)
    const exp = this.experimentAdapter.queryAny(experimentId)
    if (!exp) return
    if (variant === 'A') exp.metrics.sentA++
    else exp.metrics.sentB++
    this.experimentAdapter.save(exp)
  }

  /**
   * 记录点击
   */
  recordClick(experimentId: string, memberId: string): void {
    const variant = this.assignVariant(experimentId, memberId)
    const exp = this.experimentAdapter.queryAny(experimentId)
    if (!exp) return
    if (variant === 'A') exp.metrics.clickedA++
    else exp.metrics.clickedB++
    this.experimentAdapter.save(exp)
  }

  /**
   * 记录转化
   */
  recordConversion(experimentId: string, memberId: string, revenueCents: number): void {
    const variant = this.assignVariant(experimentId, memberId)
    const exp = this.experimentAdapter.queryAny(experimentId)
    if (!exp) return
    if (variant === 'A') {
      exp.metrics.convertedA++
      exp.metrics.revenueCentsA += revenueCents
    } else {
      exp.metrics.convertedB++
      exp.metrics.revenueCentsB += revenueCents
    }
    this.experimentAdapter.save(exp)
  }

  /**
   * 计算实验结果 (z 检验近似)
   * 返回 winner 或 INCONCLUSIVE
   */
  computeResult(experimentId: string): ABResult {
    const exp = this.experimentAdapter.queryAny(experimentId)
    if (!exp) return 'INCONCLUSIVE'

    const m = exp.metrics
    // 最小样本检查
    if (m.sentA < MIN_SAMPLE_SIZE || m.sentB < MIN_SAMPLE_SIZE) {
      return 'INCONCLUSIVE'
    }

    // 转化率
    const rateA = m.sentA > 0 ? m.convertedA / m.sentA : 0
    const rateB = m.sentB > 0 ? m.convertedB / m.sentB : 0

    if (rateA === rateB) return 'INCONCLUSIVE'

    // 两比例 z 检验
    const p = (m.convertedA + m.convertedB) / (m.sentA + m.sentB)
    const se = Math.sqrt(p * (1 - p) * (1 / m.sentA + 1 / m.sentB))
    if (se === 0) return 'INCONCLUSIVE'

    const z = (rateA - rateB) / se
    const pValue = 2 * (1 - this.normalCdf(Math.abs(z)))

    exp.pValue = pValue
    const result: ABResult = pValue < SIGNIFICANCE_LEVEL
      ? (rateA > rateB ? 'A' : 'B')
      : 'INCONCLUSIVE'
    exp.result = result
    this.experimentAdapter.save(exp)
    return result
  }

  /**
   * 反模式 v4: 早停检测 - 显著性未达就禁止结束
   */
  canStopEarly(experimentId: string): boolean {
    const result = this.computeResult(experimentId)
    return result !== 'INCONCLUSIVE'
  }

  /**
   * 查询实验
   */
  queryExperiment(tenantId: TenantId, experimentId: string): ABExperiment | null {
    return this.experimentAdapter.query(tenantId, experimentId)
  }

  /**
   * 查询实验 (任意租户, 用于获取含 pValue 的完整状态)
   */
  getExperimentAny(experimentId: string): ABExperiment | null {
    return this.experimentAdapter.queryAny(experimentId)
  }

  /**
   * 查询租户实验列表
   */
  listExperiments(tenantId: TenantId): ABExperiment[] {
    return this.experimentAdapter.queryByTenant(tenantId)
  }

  // ─── 工具: 标准正态分布 CDF 近似 ──────────────────

  private normalCdf(z: number): number {
    // Abramowitz & Stegun 近似
    const t = 1 / (1 + 0.2316419 * z)
    const d = 0.3989422804014327 * Math.exp(-z * z / 2)
    const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    return 1 - p
  }
}