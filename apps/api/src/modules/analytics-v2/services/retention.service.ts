import { Injectable } from '@nestjs/common'
import { CohortAnalyzer } from '../cohort-analyzer'
import { RetentionAdapter } from '../datasources/retention.adapter'
import type {
  TenantId,
  CohortPeriod,
  RetentionResult
} from '../analytics-v2.entity'

/**
 * Phase-43 T173: RetentionService (留存分析业务层)
 *
 * DR-43-E: Retention = 第 N 日活跃 / cohort 总数
 *
 * 业务职责:
 *  - 滚动留存矩阵
 *  - 留存健康度评分
 *  - 留存趋势分析
 */
@Injectable()
export class RetentionService {
  constructor(
    private readonly cohortAnalyzer: CohortAnalyzer,
    private readonly retentionAdapter: RetentionAdapter
  ) {}

  /**
   * 生成留存报告 (基于 cohort 矩阵)
   */
  generateReport(tenantId: TenantId, period: CohortPeriod): RetentionResult {
    const matrix = this.cohortAnalyzer.buildMatrix(tenantId, period, 12)
    const avg = this.cohortAnalyzer.getAvgRetention(tenantId, period)

    const result: RetentionResult = {
      tenantId,
      period,
      matrix: matrix.matrix.map(row => ({
        cohort: row.cohort,
        cohortSize: row.size,
        d0: row.retention[0] ?? 1,
        d1: row.retention[1] ?? 0,
        d7: row.retention[2] ?? 0,
        d30: row.retention[3] ?? 0,
        d60: row.retention[4],
        d90: row.retention[5]
      })),
      avgRetention: avg
    }

    return this.retentionAdapter.save(result)
  }

  /**
   * 查询留存报告
   */
  getReport(tenantId: TenantId, period: CohortPeriod): RetentionResult | null {
    return this.retentionAdapter.query(tenantId, period)
  }

  /**
   * 留存健康度评分 (0-100)
   *  - D1 < 30%: 差 (0-40)
   *  - D1 30-50%: 合格 (40-70)
   *  - D1 50-70%: 良好 (70-90)
   *  - D1 > 70%: 优秀 (90-100)
   */
  getHealthScore(tenantId: TenantId, period: CohortPeriod): {
    score: number
    level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
    d1: number
    d7: number
    d30: number
    recommendations: string[]
  } {
    const report = this.retentionAdapter.query(tenantId, period)
    if (!report) {
      return {
        score: 0,
        level: 'POOR',
        d1: 0, d7: 0, d30: 0,
        recommendations: ['暂无留存数据, 请先生成报告']
      }
    }

    const d1 = report.avgRetention.d1
    let score = 0
    let level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' = 'POOR'

    if (d1 < 0.30) { score = d1 * 100 * 1.0; level = 'POOR' }
    else if (d1 < 0.50) { score = 30 + (d1 - 0.30) * 200; level = 'FAIR' }
    else if (d1 < 0.70) { score = 70 + (d1 - 0.50) * 100; level = 'GOOD' }
    else { score = 90 + Math.min(10, (d1 - 0.70) * 33.3); level = 'EXCELLENT' }

    score = Math.min(100, Math.round(score))

    const recommendations: string[] = []
    if (d1 < 0.30) recommendations.push('D1 < 30% 极低, 需立即优化新用户体验 (onboarding)')
    if (report.avgRetention.d7 < 0.15) recommendations.push('D7 < 15% 失活严重, 建议增加 7 日回流激励')
    if (report.avgRetention.d30 < 0.05) recommendations.push('D30 < 5% 长期留存薄弱, 建议建立会员体系')
    if (recommendations.length === 0) recommendations.push('留存表现良好, 继续监控')

    return {
      score,
      level,
      d1: report.avgRetention.d1,
      d7: report.avgRetention.d7,
      d30: report.avgRetention.d30,
      recommendations
    }
  }

  /**
   * 留存趋势对比 (周维度)
   */
  getTrend(tenantId: TenantId, period: CohortPeriod, window: number = 4): Array<{
    cohort: string
    d1: number
    d7: number
    d30: number
  }> {
    const report = this.retentionAdapter.query(tenantId, period)
    if (!report) return []
    return report.matrix.slice(-window).map(row => ({
      cohort: row.cohort,
      d1: row.d1,
      d7: row.d7,
      d30: row.d30
    }))
  }
}