import { Injectable } from '@nestjs/common'
import { FunnelCalculator } from '../funnel-calculator'
import { FunnelAdapter } from '../datasources/funnel.adapter'
import type {
  TenantId,
  FunnelStep,
  FunnelResult
} from '../analytics-v2.entity'

/**
 * Phase-43 T173: FunnelService (漏斗分析业务层)
 *
 * DR-43-D: 多步骤漏斗 + 7d 时间窗口
 *
 * 业务职责:
 *  - 创建漏斗定义
 *  - 实时计算漏斗转化率
 *  - 多漏斗对比
 *  - 步骤过载检测
 */
@Injectable()
export class FunnelService {
  constructor(
    private readonly funnelCalculator: FunnelCalculator,
    private readonly funnelAdapter: FunnelAdapter
  ) {}

  /**
   * 创建并计算漏斗
   */
  createFunnel(input: {
    tenantId: TenantId
    name: string
    steps: FunnelStep[]
    windowDays?: number
  }): {
    funnel: FunnelResult
    isOverComplex: boolean
    warnings: string[]
  } {
    const warnings: string[] = []

    if (this.funnelCalculator.isOverComplex(input.steps)) {
      warnings.push('funnel_steps_over_complex: 漏斗步骤过多 (>5), 建议拆分')
    }

    if (input.steps.length === 0) {
      throw new Error('funnel_steps_empty: 漏斗必须至少 1 步')
    }

    const funnel = this.funnelCalculator.compute(input)

    return { funnel, isOverComplex: this.funnelCalculator.isOverComplex(input.steps), warnings }
  }

  /**
   * 列出租户所有漏斗
   */
  listFunnels(tenantId: TenantId): FunnelResult[] {
    return this.funnelAdapter.queryByTenant(tenantId)
  }

  /**
   * 查询单个漏斗
   */
  getFunnel(tenantId: TenantId, funnelId: string): FunnelResult | null {
    return this.funnelAdapter.query(tenantId, funnelId)
  }

  /**
   * 漏斗对比分析 (跨漏斗)
   */
  compareFunnels(tenantId: TenantId, funnelIds: string[]): Array<{
    funnelId: string
    name: string
    totalConversionRate: number
    stepsCount: number
    dropOff: Array<{ stepName: string; dropOffRate: number }>
  }> {
    return funnelIds
      .map(id => this.funnelAdapter.query(tenantId, id))
      .filter((f): f is FunnelResult => f !== null)
      .map(f => ({
        funnelId: f.id,
        name: f.name,
        totalConversionRate: f.totalConversionRate,
        stepsCount: f.steps.length,
        dropOff: f.stepResults.map(s => ({
          stepName: s.stepName,
          dropOffRate: s.dropOffRate
        }))
      }))
  }

  /**
   * 最大流失步骤识别 (运营优化重点)
   */
  identifyBiggestDropOff(funnelId: string): {
    funnel: FunnelResult | null
    biggestDropStep: string | null
    biggestDropRate: number
  } {
    const funnel = this.funnelAdapter.queryByTenant('').find(f => f.id === funnelId)
    // 注: 上面 queryByTenant('') 不正确, 改为通过 list 查找
    return this.findBiggestDrop(funnelId)
  }

  private findBiggestDrop(funnelId: string) {
    // 在所有 tenant 中查找
    let found: FunnelResult | null = null
    for (const tenantId of ['*']) {
      const list = this.funnelAdapter.queryByTenant(tenantId)
      const m = list.find(f => f.id === funnelId)
      if (m) { found = m; break }
    }
    if (!found) return { funnel: null, biggestDropStep: null, biggestDropRate: 0 }
    let maxDrop = 0
    let stepName: string | null = null
    for (const s of found.stepResults) {
      if (s.dropOffRate > maxDrop) {
        maxDrop = s.dropOffRate
        stepName = s.stepName
      }
    }
    return { funnel: found, biggestDropStep: stepName, biggestDropRate: maxDrop }
  }

  /**
   * 业务级: 推荐默认漏斗模板
   */
  getDefaultFunnelTemplate(): { name: string; steps: FunnelStep[] } {
    return {
      name: '电商转化漏斗',
      steps: [
        { name: '浏览商品', eventType: 'PAGEVIEW' },
        { name: '加入购物车', eventType: 'CLICK' },
        { name: '提交订单', eventType: 'CONVERSION' },
        { name: '完成支付', eventType: 'PURCHASE' }
      ]
    }
  }
}