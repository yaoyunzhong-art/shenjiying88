import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

// ── Type definitions ──

export type PerformancePeriod = 'monthly' | 'quarterly' | 'annual'

export interface KpiDefinition {
  name: string
  target: string
  weight: number // percentage, total weights should sum to 100
}

export interface OkrDefinition {
  objective: string
  keyResults: string[]
}

export interface PerformanceTemplate {
  id: string
  tenantId: string
  name: string
  department: string
  kpis: KpiDefinition[]
  okrs: OkrDefinition[]
  period: PerformancePeriod
  createdAt: string
  updatedAt: string
}

export interface KpiScore {
  kpiName: string
  score: number // 0-100
  comment?: string
}

export interface OkrScore {
  objective: string
  progress: number // 0-100
  comment?: string
}

export type Two71Rank = 'top20' | 'middle70' | 'bottom10'

export type EvaluationStatus = 'self' | 'manager' | 'calibration' | 'done'

export interface Evaluation {
  id: string
  tenantId: string
  employeeId: string
  templateId: string
  period: string // e.g. "2026-07" for monthly, "2026-Q2" for quarterly, "2026" for annual
  kpiScores: KpiScore[]
  okrScores: OkrScore[]
  totalScore: number
  rank: Two71Rank
  status: EvaluationStatus
  selfComment?: string
  managerComment?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SbIInterview {
  id: string
  tenantId: string
  employeeId: string
  evaluatorId: string
  situation: string
  behavior: string
  impact: string
  overallFeedback?: string
  actionPlan?: string
  interviewDate: string
  createdAt: string
}

export interface StarEmployee {
  id: string
  tenantId: string
  employeeId: string
  period: string
  type: 'monthly' | 'quarterly' | 'annual'
  achievement: string
  reward: string
  awardedAt: string
  createdAt: string
}

export interface PerformanceStats {
  totalEvaluations: number
  averageScore: number
  scoreDistribution: {
    excellent: number // >=90
    good: number // 80-89
    average: number // 70-79
    needsImprovement: number // <70
  }
  rankDistribution: Record<Two71Rank, number>
  totalStarEmployees: number
}

// ── In-memory store ──

const templateStore = new Map<string, PerformanceTemplate>()
const evaluationStore = new Map<string, Evaluation>()
const interviewStore = new Map<string, SbIInterview>()
const starStore = new Map<string, StarEmployee>()
let seeded = false

function seedData(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'
  const now = new Date().toISOString()

  // ── Templates ──

  const cashierKpis: KpiDefinition[] = [
    { name: '收银准确率', target: '≥99.8%', weight: 30 },
    { name: '平均交易时长', target: '≤45秒', weight: 20 },
    { name: '日营收误差率', target: '≤0.5%', weight: 20 },
    { name: '会员开卡转化率', target: '≥15%', weight: 15 },
    { name: '服务态度评分', target: '≥4.5/5分', weight: 15 },
  ]
  const cashierOkrs: OkrDefinition[] = [
    { objective: '提升会员转化率', keyResults: ['完成月度开卡目标', '主动推荐会员活动≥10次/班'] },
    { objective: '减少差错率', keyResults: ['连续7天零误差', '掌握新版收银系统操作'] },
  ]

  const guideKpis: KpiDefinition[] = [
    { name: '区域顾客满意度', target: '≥4.5/5分', weight: 25 },
    { name: '设备完好巡检完成率', target: '≥98%', weight: 20 },
    { name: '顾客互动频次', target: '每班≥50次主动问候', weight: 20 },
    { name: '场地卫生维护', target: '巡检达标率≥95%', weight: 20 },
    { name: '团队协作评分', target: '≥4分/5分', weight: 15 },
  ]
  const guideOkrs: OkrDefinition[] = [
    { objective: '提升顾客体验', keyResults: ['收集顾客反馈≥20条/月', '顾客投诉率降低20%'] },
    { objective: '设备管理优化', keyResults: ['每日巡检按时完成率100%', '报修响应≤5分钟'] },
  ]

  const techKpis: KpiDefinition[] = [
    { name: '故障响应时间', target: '≤10分钟', weight: 30 },
    { name: '故障修复率', target: '当日修复≥90%', weight: 25 },
    { name: '预防性维护完成率', target: '≥95%', weight: 25 },
    { name: '维修成本控制', target: '月度预算内', weight: 20 },
  ]
  const techOkrs: OkrDefinition[] = [
    { objective: '设备运行零重大故障', keyResults: ['完成月度预防性维护计划', '建立备件库存预警机制'] },
    { objective: '技术能力提升', keyResults: ['完成新设备培训', '输出操作SOP≥2份'] },
  ]

  const templates: Omit<PerformanceTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '收银岗月度考核模板',
      department: '收银岗',
      kpis: cashierKpis,
      okrs: cashierOkrs,
      period: 'monthly',
    },
    {
      name: '导玩员月度考核模板',
      department: '导玩岗',
      kpis: guideKpis,
      okrs: guideOkrs,
      period: 'monthly',
    },
    {
      name: '技术维护岗考核模板（季度）',
      department: '设备维护岗',
      kpis: techKpis,
      okrs: techOkrs,
      period: 'quarterly',
    },
  ]

  for (const t of templates) {
    const template: PerformanceTemplate = {
      id: `perf-tpl-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      ...t,
      createdAt: now,
      updatedAt: now,
    }
    templateStore.set(template.id, template)
  }

  // ── Evaluations ──

  const templateIds = Array.from(templateStore.keys())
  const evaluations: Omit<Evaluation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
    {
      employeeId: 'E001',
      templateId: templateIds[0],
      period: '2026-06',
      kpiScores: [
        { kpiName: '收银准确率', score: 99.5, comment: '基本无误，偶尔小差错' },
        { kpiName: '平均交易时长', score: 88, comment: '平均约48秒，略超目标' },
        { kpiName: '日营收误差率', score: 95, comment: '误差率0.3%，表现良好' },
        { kpiName: '会员开卡转化率', score: 82, comment: '转化率12%，有待提升' },
        { kpiName: '服务态度评分', score: 90, comment: '顾客反馈积极' },
      ],
      okrScores: [
        { objective: '提升会员转化率', progress: 75, comment: '接近目标，继续努力' },
        { objective: '减少差错率', progress: 90, comment: '表现优异' },
      ],
      totalScore: 91.5,
      rank: 'top20',
      status: 'done',
      selfComment: '本月整体表现稳定，会员转化需要更多技巧',
      managerComment: '张三工作态度认真，收银准确性高，建议加强会员推荐话术训练',
      completedAt: '2026-06-15T08:00:00.000Z',
    },
    {
      employeeId: 'E003',
      templateId: templateIds[1],
      period: '2026-06',
      kpiScores: [
        { kpiName: '区域顾客满意度', score: 92, comment: '满意度4.6分' },
        { kpiName: '设备完好巡检完成率', score: 96, comment: '1次未按时巡检' },
        { kpiName: '顾客互动频次', score: 85, comment: '日均45次互动' },
        { kpiName: '场地卫生维护', score: 90, comment: '巡查表现良好' },
        { kpiName: '团队协作评分', score: 88, comment: '配合度高' },
      ],
      okrScores: [
        { objective: '提升顾客体验', progress: 80, comment: '反馈收集量达标' },
      ],
      totalScore: 90.2,
      rank: 'top20',
      status: 'done',
      selfComment: '本月互动量有所提升',
      managerComment: '王五服务意识强，建议持续提升主动引导能力',
      completedAt: '2026-06-14T10:00:00.000Z',
    },
    {
      employeeId: 'E002',
      templateId: templateIds[2],
      period: '2026-Q2',
      kpiScores: [
        { kpiName: '故障响应时间', score: 95, comment: '平均响应8分钟' },
        { kpiName: '故障修复率', score: 92, comment: '当日修复92%' },
        { kpiName: '预防性维护完成率', score: 98, comment: '全部完成' },
        { kpiName: '维修成本控制', score: 85, comment: '略超预算5%' },
      ],
      okrScores: [
        { objective: '设备运行零重大故障', progress: 95, comment: '季度无重大故障' },
        { objective: '技术能力提升', progress: 80, comment: '完成2份SOP输出' },
      ],
      totalScore: 93.0,
      rank: 'top20',
      status: 'done',
      selfComment: '本季度设备运行良好，继续提升预防性维护水平',
      managerComment: '李四技术过硬，建议培养新人团队',
      completedAt: '2026-07-01T09:00:00.000Z',
    },
  ]

  for (const e of evaluations) {
    const evaluation: Evaluation = {
      id: `perf-eval-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      ...e,
      createdAt: now,
      updatedAt: now,
    }
    evaluationStore.set(evaluation.id, evaluation)
  }
}

@Injectable()
export class HrPerformanceService implements OnModuleInit {
  private readonly logger = new Logger(HrPerformanceService.name)

  onModuleInit(): void {
    seedData()
    this.logger.log(`Seeded ${templateStore.size} performance templates, ${evaluationStore.size} evaluations`)
  }

  // ─────────────────────────────────────────────────────────────────
  // 考核模板管理
  // ─────────────────────────────────────────────────────────────────

  createTemplate(input: {
    tenantId: string
    name: string
    department: string
    kpis: KpiDefinition[]
    okrs: OkrDefinition[]
    period: PerformancePeriod
  }): PerformanceTemplate {
    const now = new Date().toISOString()
    const template: PerformanceTemplate = {
      id: `perf-tpl-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      name: input.name,
      department: input.department,
      kpis: input.kpis,
      okrs: input.okrs,
      period: input.period,
      createdAt: now,
      updatedAt: now,
    }
    templateStore.set(template.id, template)
    return template
  }

  findAllTemplates(tenantId: string): PerformanceTemplate[] {
    return Array.from(templateStore.values())
      .filter(t => t.tenantId === tenantId)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }

  findTemplateById(id: string, tenantId: string): PerformanceTemplate | undefined {
    const t = templateStore.get(id)
    if (!t || t.tenantId !== tenantId) return undefined
    return t
  }

  // ─────────────────────────────────────────────────────────────────
  // 考核评估
  // ─────────────────────────────────────────────────────────────────

  createEvaluation(input: {
    tenantId: string
    employeeId: string
    templateId: string
    period: string
    kpiScores: KpiScore[]
    okrScores: OkrScore[]
    status: EvaluationStatus
    selfComment?: string
  }): Evaluation {
    const now = new Date().toISOString()
    const totalScore = this.calculateTotalScore(input.kpiScores, input.templateId, input.tenantId)
    const evaluation: Evaluation = {
      id: `perf-eval-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      templateId: input.templateId,
      period: input.period,
      kpiScores: input.kpiScores,
      okrScores: input.okrScores,
      totalScore,
      rank: this.determineRank(totalScore),
      status: input.status,
      selfComment: input.selfComment,
      createdAt: now,
      updatedAt: now,
    }
    evaluationStore.set(evaluation.id, evaluation)
    return evaluation
  }

  findEvaluations(
    tenantId: string,
    filter?: { employeeId?: string; period?: string },
  ): Evaluation[] {
    return Array.from(evaluationStore.values())
      .filter(e => e.tenantId === tenantId)
      .filter(e => filter?.employeeId ? e.employeeId === filter.employeeId : true)
      .filter(e => filter?.period ? e.period === filter.period : true)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  findEvaluationById(id: string, tenantId: string): Evaluation | undefined {
    const e = evaluationStore.get(id)
    if (!e || e.tenantId !== tenantId) return undefined
    return e
  }

  updateEvaluation(
    id: string,
    tenantId: string,
    input: Partial<{
      kpiScores: KpiScore[]
      okrScores: OkrScore[]
      status: EvaluationStatus
      selfComment: string
      managerComment: string
      completedAt: string
    }>,
  ): Evaluation {
    const evalRecord = this.requireEvaluation(id, tenantId)
    const now = new Date().toISOString()

    if (input.kpiScores !== undefined) evalRecord.kpiScores = input.kpiScores
    if (input.okrScores !== undefined) evalRecord.okrScores = input.okrScores
    if (input.status !== undefined) evalRecord.status = input.status
    if (input.selfComment !== undefined) evalRecord.selfComment = input.selfComment
    if (input.managerComment !== undefined) evalRecord.managerComment = input.managerComment
    if (input.completedAt !== undefined) evalRecord.completedAt = input.completedAt

    // Recalculate total score if scores changed
    if (input.kpiScores !== undefined) {
      evalRecord.totalScore = this.calculateTotalScore(
        evalRecord.kpiScores,
        evalRecord.templateId,
        tenantId,
      )
      evalRecord.rank = this.determineRank(evalRecord.totalScore)
    }

    evalRecord.updatedAt = now
    evaluationStore.set(id, evalRecord)
    return evalRecord
  }

  // ─────────────────────────────────────────────────────────────────
  // SBI面谈
  // ─────────────────────────────────────────────────────────────────

  createInterview(input: {
    tenantId: string
    employeeId: string
    evaluatorId: string
    situation: string
    behavior: string
    impact: string
    overallFeedback?: string
    actionPlan?: string
    interviewDate: string
  }): SbIInterview {
    const now = new Date().toISOString()
    const interview: SbIInterview = {
      id: `sbi-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      evaluatorId: input.evaluatorId,
      situation: input.situation,
      behavior: input.behavior,
      impact: input.impact,
      overallFeedback: input.overallFeedback,
      actionPlan: input.actionPlan,
      interviewDate: input.interviewDate,
      createdAt: now,
    }
    interviewStore.set(interview.id, interview)
    return interview
  }

  findInterviews(tenantId: string, employeeId?: string): SbIInterview[] {
    return Array.from(interviewStore.values())
      .filter(i => i.tenantId === tenantId)
      .filter(i => employeeId ? i.employeeId === employeeId : true)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─────────────────────────────────────────────────────────────────
  // 星级员工
  // ─────────────────────────────────────────────────────────────────

  createStarEmployee(input: {
    tenantId: string
    employeeId: string
    period: string
    type: 'monthly' | 'quarterly' | 'annual'
    achievement: string
    reward: string
  }): StarEmployee {
    const now = new Date().toISOString()
    const star: StarEmployee = {
      id: `star-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      period: input.period,
      type: input.type,
      achievement: input.achievement,
      reward: input.reward,
      awardedAt: now,
      createdAt: now,
    }
    starStore.set(star.id, star)
    return star
  }

  findAllStarEmployees(tenantId: string): StarEmployee[] {
    return Array.from(starStore.values())
      .filter(s => s.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─────────────────────────────────────────────────────────────────
  // 统计
  // ─────────────────────────────────────────────────────────────────

  getPerformanceStats(tenantId: string): PerformanceStats {
    const evals = Array.from(evaluationStore.values()).filter(e => e.tenantId === tenantId)

    if (evals.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        scoreDistribution: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
        rankDistribution: { top20: 0, middle70: 0, bottom10: 0 },
        totalStarEmployees: 0,
      }
    }

    const totalScore = evals.reduce((sum, e) => sum + e.totalScore, 0)
    const averageScore = parseFloat((totalScore / evals.length).toFixed(1))

    const scoreDistribution = {
      excellent: evals.filter(e => e.totalScore >= 90).length,
      good: evals.filter(e => e.totalScore >= 80 && e.totalScore < 90).length,
      average: evals.filter(e => e.totalScore >= 70 && e.totalScore < 80).length,
      needsImprovement: evals.filter(e => e.totalScore < 70).length,
    }

    const rankDistribution: Record<Two71Rank, number> = {
      top20: evals.filter(e => e.rank === 'top20').length,
      middle70: evals.filter(e => e.rank === 'middle70').length,
      bottom10: evals.filter(e => e.rank === 'bottom10').length,
    }

    const totalStarEmployees = Array.from(starStore.values())
      .filter(s => s.tenantId === tenantId)
      .length

    return {
      totalEvaluations: evals.length,
      averageScore,
      scoreDistribution,
      rankDistribution,
      totalStarEmployees,
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 内部方法
  // ─────────────────────────────────────────────────────────────────

  private calculateTotalScore(kpiScores: KpiScore[], templateId: string, tenantId: string): number {
    const template = templateStore.get(templateId)
    if (!template || template.tenantId !== tenantId) {
      // Fallback: simple average
      if (kpiScores.length === 0) return 0
      const sum = kpiScores.reduce((s, k) => s + k.score, 0)
      return parseFloat((sum / kpiScores.length).toFixed(1))
    }

    // Weighted calculation using template KPIs
    let weightedSum = 0
    let totalWeight = 0
    for (const kpiScore of kpiScores) {
      const def = template.kpis.find(k => k.name === kpiScore.kpiName)
      const weight = def?.weight ?? 100 / template.kpis.length // equal weight if not found
      weightedSum += kpiScore.score * weight
      totalWeight += weight
    }
    return totalWeight > 0
      ? parseFloat((weightedSum / totalWeight).toFixed(1))
      : 0
  }

  private determineRank(score: number): Two71Rank {
    // Simplified 271 distribution based on score thresholds
    // In real production this would use relative ranking across all evaluations
    if (score >= 90) return 'top20'
    if (score >= 70) return 'middle70'
    return 'bottom10'
  }

  private requireEvaluation(id: string, tenantId: string): Evaluation {
    const e = evaluationStore.get(id)
    if (!e || e.tenantId !== tenantId) {
      throw new Error(`Evaluation not found: ${id}`)
    }
    return e
  }
}
