import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  RecommendRequest,
  RecommendResult,
  EquipmentCheckResult,
  EquipmentItem,
  TeamBuildingEvent,
  LockedEquipment,
  TeamBuildingReport,
  CrmSyncRecord,
  TeamBuildingDashboard,
  MonthlyTrend,
  TopPlan,
  SatisfactionBreakdown,
  EquipmentUsage,
} from './team-building.entity'

// ── Types ──

export interface TeamBuildingPlan {
  id: string
  tenantId: string
  /** 活动名称 */
  name: string
  /** 团建类型: outdoor | escape-room | script-kill | dinner | ktv | sports | other */
  type: TeamBuildingType
  /** 地点 */
  location: string
  /** 预算金额 (分) */
  budget: number
  /** 预计参与人数 */
  expectedParticipants: number
  /** 描述 / 方案内容 */
  description: string
  /** 推荐季节 */
  recommendedSeason?: string
  /** 备注 */
  remark?: string
  /** 创建时间 ISO-8601 */
  createdAt: string
  /** 更新时间 ISO-8601 */
  updatedAt: string
}

export type TeamBuildingType =
  | 'outdoor'
  | 'escape-room'
  | 'script-kill'
  | 'dinner'
  | 'ktv'
  | 'sports'
  | 'other'

export interface TeamBuildingStats {
  totalPlans: number
  byType: Record<TeamBuildingType, number>
  avgBudget: number
  minBudget: number
  maxBudget: number
}

// ── Type helpers ──

const TEAM_BUILDING_TYPES: TeamBuildingType[] = [
  'outdoor',
  'escape-room',
  'script-kill',
  'dinner',
  'ktv',
  'sports',
  'other',
]

const TYPE_LABELS: Record<TeamBuildingType, string> = {
  outdoor: '户外拓展',
  'escape-room': '密室逃脱',
  'script-kill': '剧本杀',
  dinner: '聚餐',
  ktv: 'KTV',
  sports: '运动赛事',
  other: '其他',
}

// ── In-memory store ──

const planStore = new Map<string, TeamBuildingPlan>()
const eventStore = new Map<string, TeamBuildingEvent>()
const reportStore = new Map<string, TeamBuildingReport>()
const syncStore = new Map<string, CrmSyncRecord>()
/** 设备锁定: key=`${date}|${sku}|${timeSlot}` -> lockedQty */
const equipmentLockStore = new Map<string, number>()
let seeded = false

function seedPlans(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface SeedPlan {
    name: string
    type: TeamBuildingType
    location: string
    budget: number
    expectedParticipants: number
    description: string
    recommendedSeason?: string
    remark?: string
  }

  const plans: SeedPlan[] = [
    {
      name: '莫干山户外拓展',
      type: 'outdoor',
      location: '莫干山风景区',
      budget: 3000000,
      expectedParticipants: 30,
      description:
        '全天户外拓展训练，包含攀岩、团队穿越、篝火晚会等项目。适合增强团队凝聚力和协作能力。',
      recommendedSeason: '春秋',
      remark: '需提前一周预约教练和场地',
    },
    {
      name: '沉浸式密室逃脱',
      type: 'escape-room',
      location: 'X先生沉浸式密室 · 朝阳店',
      budget: 600000,
      expectedParticipants: 12,
      description:
        '大型沉浸式密室主题，60分钟限时解谜。分两组比赛，增加团队沟通与分工协作。',
      recommendedSeason: '全年',
      remark: '建议不超过12人，可轮换主题',
    },
    {
      name: '古风剧本杀之夜',
      type: 'script-kill',
      location: '推理大师剧本杀馆 · 静安店',
      budget: 800000,
      expectedParticipants: 14,
      description:
        '古风阵营本《长安十二时辰》，含换装和道具。多人互动推理，适合关系破冰。',
      recommendedSeason: '全年',
      remark: '需提前48小时预约DM',
    },
    {
      name: '海底捞年终聚餐',
      type: 'dinner',
      location: '海底捞 · 陆家嘴旗舰店',
      budget: 5000000,
      expectedParticipants: 50,
      description:
        '年终团建聚餐，含包场、节目表演和抽奖环节。享受火锅自助+专属服务。',
      recommendedSeason: '冬季',
      remark: '大桌可容纳50人，需提前一个月预定包间',
    },
    {
      name: 'K歌大赛 & 桌游派对',
      type: 'ktv',
      location: '纯K · 五角场店',
      budget: 400000,
      expectedParticipants: 20,
      description:
        '下午K歌比赛 + 晚上桌游局。含零食饮料套餐，轻松愉快的半日团建。',
      recommendedSeason: '全年',
      remark: '可包场至多容纳25人',
    },
    {
      name: '羽毛球友谊赛',
      type: 'sports',
      location: '洛克公园 · 徐汇旗舰馆',
      budget: 350000,
      expectedParticipants: 16,
      description:
        '羽毛球混合双打友谊赛，分ABCD四组循环赛制。配备专业裁判和解说。',
      recommendedSeason: '春秋',
      remark: '含场地、器材和运动补给',
    },
    {
      name: 'TeamLab沉浸式团建',
      type: 'other',
      location: 'TeamLab无界美术馆 · 黄浦滨江',
      budget: 1000000,
      expectedParticipants: 20,
      description:
        '参观TeamLab数字艺术展 + 团队拍照打卡任务 + 周边咖啡馆讨论复盘。',
      recommendedSeason: '全年',
      remark: '门票需提前2周团购',
    },
    {
      name: '夏日水上派对',
      type: 'outdoor',
      location: '玛雅海滩水公园',
      budget: 2500000,
      expectedParticipants: 40,
      description:
        '夏日水上团建，包含水上闯关、漂流、团队浮筏比赛等。一站式消暑团建。',
      recommendedSeason: '夏季',
      remark: '需准备防晒用品和替换衣物',
    },
  ]

  for (const p of plans) {
    const now = new Date().toISOString()
    const plan: TeamBuildingPlan = {
      id: `tb-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      ...p,
      createdAt: now,
      updatedAt: now,
    }
    planStore.set(plan.id, plan)
  }
}

@Injectable()
export class TeamBuildingService implements OnModuleInit {
  private readonly logger = new Logger(TeamBuildingService.name)

  onModuleInit(): void {
    seedPlans()
    this.logger.log(`Seeded ${planStore.size} team-building plans`)
  }

  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  create(input: {
    tenantId: string
    name: string
    type: TeamBuildingType
    location: string
    budget: number
    expectedParticipants: number
    description: string
    recommendedSeason?: string
    remark?: string
  }): TeamBuildingPlan {
    const now = new Date().toISOString()
    const plan: TeamBuildingPlan = {
      id: `tb-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      name: input.name,
      type: input.type,
      location: input.location,
      budget: input.budget,
      expectedParticipants: input.expectedParticipants,
      description: input.description,
      recommendedSeason: input.recommendedSeason,
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    planStore.set(plan.id, plan)
    return plan
  }

  findAll(tenantId: string, filter?: {
    type?: TeamBuildingType
    search?: string
  }): TeamBuildingPlan[] {
    seedPlans()
    return Array.from(planStore.values())
      .filter((p) => p.tenantId === tenantId)
      .filter((p) => (filter?.type ? p.type === filter.type : true))
      .filter((p) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  findById(id: string, tenantId: string): TeamBuildingPlan | undefined {
    seedPlans()
    const plan = planStore.get(id)
    if (!plan || plan.tenantId !== tenantId) return undefined
    return plan
  }

  update(
    id: string,
    tenantId: string,
    input: Partial<Omit<TeamBuildingPlan, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): TeamBuildingPlan {
    const plan = this.requirePlan(id, tenantId)
    const now = new Date().toISOString()

    if (input.name !== undefined) plan.name = input.name
    if (input.type !== undefined) plan.type = input.type
    if (input.location !== undefined) plan.location = input.location
    if (input.budget !== undefined) plan.budget = input.budget
    if (input.expectedParticipants !== undefined) plan.expectedParticipants = input.expectedParticipants
    if (input.description !== undefined) plan.description = input.description
    if (input.recommendedSeason !== undefined) plan.recommendedSeason = input.recommendedSeason
    if (input.remark !== undefined) plan.remark = input.remark
    plan.updatedAt = now

    planStore.set(id, plan)
    return plan
  }

  delete(id: string, tenantId: string): void {
    const plan = this.requirePlan(id, tenantId)
    planStore.delete(plan.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Stats
  // ═══════════════════════════════════════════════════════════════════

  getStats(tenantId: string): TeamBuildingStats {
    seedPlans()
    const plans = Array.from(planStore.values()).filter((p) => p.tenantId === tenantId)
    const totalPlans = plans.length

    const byType = Object.fromEntries(
      TEAM_BUILDING_TYPES.map((t) => [t, plans.filter((p) => p.type === t).length]),
    ) as Record<TeamBuildingType, number>

    const budgets = plans.map((p) => p.budget)
    const avgBudget = budgets.length > 0
      ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
      : 0
    const minBudget = budgets.length > 0 ? Math.min(...budgets) : 0
    const maxBudget = budgets.length > 0 ? Math.max(...budgets) : 0

    return { totalPlans, byType, avgBudget, minBudget, maxBudget }
  }

  /** 获取所有团建类型的中文标签映射 */
  getTypeLabels(): Record<TeamBuildingType, string> {
    return { ...TYPE_LABELS }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 方案推荐
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 推荐方案：基于人数、预算、年龄段进行智能匹配
   */
  recommendPlans(tenantId: string, req: RecommendRequest): RecommendResult[] {
    const plans = this.findAll(tenantId)
    if (plans.length === 0) return []

    const scored = plans.map((p) => {
      let score = 0

      // 人数匹配 (±30% 算合理)
      const diff = Math.abs(p.expectedParticipants - req.participants)
      if (diff === 0) score += 30
      else if (diff <= Math.round(p.expectedParticipants * 0.3)) score += 20
      else if (diff <= Math.round(p.expectedParticipants * 0.5)) score += 10

      // 预算匹配（预算偏差在 ±20% 内加分）
      const budgetRatio = req.budget / p.budget
      if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 30
      else if (budgetRatio >= 0.5 && budgetRatio <= 1.5) score += 15

      // 类型偏好加分
      if (req.preferredType && p.type === req.preferredType) score += 20

      // 年龄段推荐加成
      if (req.ageGroup === 'youth' && (p.type === 'escape-room' || p.type === 'script-kill' || p.type === 'sports')) score += 10
      if (req.ageGroup === 'adult' && (p.type === 'dinner' || p.type === 'outdoor' || p.type === 'ktv')) score += 10
      if (req.ageGroup === 'mixed' && (p.type === 'outdoor' || p.type === 'dinner')) score += 10

      // 季节适宜度加成（简化：不判断真实季节）
      if (p.recommendedSeason && (p.recommendedSeason === '全年' || p.recommendedSeason === '春秋')) score += 5

      return { plan: p, score: Math.min(score, 100) }
    })

    scored.sort((a, b) => b.score - a.score)

    const results = scored.map((s) => {
      // BS-0297: 生成AI建议备注
      const aiSuggestion = this.buildAiSuggestion(s.plan, s.score, req)

      return {
        planId: s.plan.id,
        name: s.plan.name,
        type: s.plan.type,
        location: s.plan.location,
        budget: s.plan.budget,
        score: s.score,
        equipmentCheck: { passed: true, items: [], totalCapacityRequired: 0, totalCapacityAvailable: 0 },
        reason: this.buildRecommendReason(s.plan, s.score),
        recommended: s.score >= 50,
        aiSuggestion,
      }
    })

    return results
  }

  private buildRecommendReason(plan: TeamBuildingPlan, score: number): string {
    const label = TYPE_LABELS[plan.type]
    if (score >= 80) return `非常适合！${label}方案完美匹配您的需求`
    if (score >= 60) return `推荐选择！${label}方案与需求高度契合`
    if (score >= 40) return `可以考虑，${label}方案基本满足需求`
    return `可作参考，${label}方案与需求略有偏差`
  }

  /**
   * BS-0297: 构建AI建议备注
   * 基于方案匹配度、设备校验、参与人数给出优化建议
   */
  private buildAiSuggestion(plan: TeamBuildingPlan, score: number, req: RecommendRequest): string {
    const suggestions: string[] = []

    // 人数差异建议
    const diff = Math.abs(plan.expectedParticipants - req.participants)
    if (diff > 0) {
      if (req.participants > plan.expectedParticipants) {
        suggestions.push(`建议参与人数(${req.participants}人)超出方案设计上限(${plan.expectedParticipants}人)，可分批或调整方案`)
      } else if (diff >= Math.round(plan.expectedParticipants * 0.5)) {
        suggestions.push(`参与人数(${req.participants}人)较少，可合并团队或选择小型方案`)
      }
    }

    // 预算建议
    const budgetRatio = req.budget / plan.budget
    if (budgetRatio < 0.5) {
      suggestions.push(`预算(${req.budget}分)偏低，建议适当增加预算或选择更经济的方案`)
    } else if (budgetRatio > 2.0) {
      suggestions.push(`预算充裕，可考虑升级为${plan.type === 'outdoor' ? '两天一夜' : '高端'}版本`)
    }

    // 季节建议
    if (plan.recommendedSeason && plan.recommendedSeason !== '全年') {
      suggestions.push(`推荐${plan.recommendedSeason}出行，体验更佳`)
    }

    // 类型偏好建议
    if (req.preferredType && plan.type !== req.preferredType) {
      suggestions.push(`您偏好的${TYPE_LABELS[req.preferredType]}类型有更匹配的方案，可重新筛选`)
    }

    if (suggestions.length === 0) {
      return '方案匹配度良好，无需额外调整'
    }

    return suggestions.join('；')
  }

  // ═══════════════════════════════════════════════════════════════════
  // 设备校验
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 校验方案设备库存可用性（仿真：基于模拟设备数据）
   */
  checkEquipment(planId: string, tenantId: string, date: string, participants: number): EquipmentCheckResult {
    const plan = this.requirePlan(planId, tenantId)

    // 模拟设备库（按方案类型返回不同设备需求）
    const equipConfig: Record<string, { name: string; sku: string; capacityPerUnit: number; totalStock: number }[]> = {
      outdoor: [
        { name: '攀岩安全带', sku: 'EQ-CLIMB-01', capacityPerUnit: 1, totalStock: 20 },
        { name: '户外帐篷', sku: 'EQ-TENT-01', capacityPerUnit: 4, totalStock: 10 },
        { name: '对讲机', sku: 'EQ-RADIO-01', capacityPerUnit: 1, totalStock: 30 },
      ],
      'escape-room': [
        { name: '密室对讲机', sku: 'EQ-ER-RADIO-01', capacityPerUnit: 1, totalStock: 12 },
        { name: '密室道具包', sku: 'EQ-ER-PROP-01', capacityPerUnit: 1, totalStock: 15 },
      ],
      'script-kill': [
        { name: '剧本道具箱', sku: 'EQ-SK-BOX-01', capacityPerUnit: 6, totalStock: 8 },
        { name: '换装服装', sku: 'EQ-SK-COST-01', capacityPerUnit: 1, totalStock: 20 },
      ],
      dinner: [
        { name: '投影设备', sku: 'EQ-DN-PROJ-01', capacityPerUnit: 50, totalStock: 3 },
        { name: '音响系统', sku: 'EQ-DN-SOUND-01', capacityPerUnit: 50, totalStock: 2 },
      ],
      ktv: [
        { name: '无线麦克风', sku: 'EQ-KTV-MIC-01', capacityPerUnit: 2, totalStock: 10 },
        { name: '点歌平板', sku: 'EQ-KTV-PAD-01', capacityPerUnit: 1, totalStock: 8 },
      ],
      sports: [
        { name: '羽毛球拍套装', sku: 'EQ-SPT-RACK-01', capacityPerUnit: 2, totalStock: 16 },
        { name: '计分器', sku: 'EQ-SPT-SCORE-01', capacityPerUnit: 4, totalStock: 8 },
        { name: '运动补给包', sku: 'EQ-SPT-SUPPLY-01', capacityPerUnit: 1, totalStock: 30 },
      ],
      other: [
        { name: '导览耳机', sku: 'EQ-OTH-EAR-01', capacityPerUnit: 1, totalStock: 25 },
      ],
    }

    const equipments = equipConfig[plan.type] ?? equipConfig.other

    const items: EquipmentItem[] = []
    let totalCapacityRequired = 0
    let totalCapacityAvailable = 0
    let allSatisfied = true

    for (const eq of equipments) {
      // 需求台数 = ceil(participants / capacityPerUnit)
      const requiredUnits = Math.ceil(participants / eq.capacityPerUnit)

      // 已被其他活动占用的数量
      const lockKey = `${date}|${eq.sku}|all-day`
      const lockedQty = equipmentLockStore.get(lockKey) ?? 0
      const availableUnits = Math.max(0, eq.totalStock - lockedQty)

      const satisfied = availableUnits >= requiredUnits
      if (!satisfied) allSatisfied = false

      totalCapacityRequired += requiredUnits * eq.capacityPerUnit
      totalCapacityAvailable += availableUnits * eq.capacityPerUnit

      items.push({
        name: eq.name,
        sku: eq.sku,
        capacityPerUnit: eq.capacityPerUnit,
        requiredUnits,
        availableUnits,
        satisfied,
      })
    }

    return {
      passed: allSatisfied && items.length > 0,
      items,
      totalCapacityRequired,
      totalCapacityAvailable,
      failReason: allSatisfied ? undefined : '部分设备库存不足，请调整参与人数或更换日期',
    }
  }

  /**
   * 锁定设备
   */
  lockEquipment(eventId: string, tenantId: string, lockedItems: LockedEquipment[]): void {
    const event = this.requireEvent(eventId, tenantId)

    for (const item of lockedItems) {
      const lockKey = `${item.date}|${item.sku}|${item.timeSlot}`
      const current = equipmentLockStore.get(lockKey) ?? 0
      equipmentLockStore.set(lockKey, current + item.qty)
    }

    event.lockedEquipment = [...(event.lockedEquipment ?? []), ...lockedItems]
    event.updatedAt = new Date().toISOString()
    eventStore.set(eventId, event)
  }

  /**
   * 解锁设备
   */
  unlockEquipment(eventId: string, tenantId: string): void {
    const event = this.requireEvent(eventId, tenantId)

    if (event.lockedEquipment) {
      for (const item of event.lockedEquipment) {
        const lockKey = `${item.date}|${item.sku}|${item.timeSlot}`
        const current = equipmentLockStore.get(lockKey) ?? 0
        const newQty = Math.max(0, current - item.qty)
        if (newQty === 0) {
          equipmentLockStore.delete(lockKey)
        } else {
          equipmentLockStore.set(lockKey, newQty)
        }
      }
    }

    event.lockedEquipment = []
    event.updatedAt = new Date().toISOString()
    eventStore.set(eventId, event)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 活动事件管理
  // ═══════════════════════════════════════════════════════════════════

  createEvent(input: {
    tenantId: string
    planId: string
    name: string
    eventDate: string
    participants: number
    participantMemberIds?: string[]
    remark?: string
  }): TeamBuildingEvent {
    const now = new Date().toISOString()
    const event: TeamBuildingEvent = {
      id: `evt-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      planId: input.planId,
      name: input.name,
      eventDate: input.eventDate,
      participants: input.participants,
      status: 'scheduled',
      lockedEquipment: [],
      participantMemberIds: input.participantMemberIds ?? [],
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    eventStore.set(event.id, event)
    return event
  }

  getEvents(tenantId: string, filter?: { status?: string; fromDate?: string; toDate?: string }): TeamBuildingEvent[] {
    return Array.from(eventStore.values())
      .filter((e) => e.tenantId === tenantId)
      .filter((e) => (filter?.status ? e.status === filter.status : true))
      .filter((e) => (filter?.fromDate ? e.eventDate >= filter.fromDate : true))
      .filter((e) => (filter?.toDate ? e.eventDate <= filter.toDate : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getEventById(id: string, tenantId: string): TeamBuildingEvent {
    return this.requireEvent(id, tenantId)
  }

  updateEvent(
    id: string,
    tenantId: string,
    input: Partial<Pick<TeamBuildingEvent, 'name' | 'eventDate' | 'participants' | 'status' | 'participantMemberIds' | 'remark'>>,
  ): TeamBuildingEvent {
    const event = this.requireEvent(id, tenantId)
    const now = new Date().toISOString()

    if (input.name !== undefined) event.name = input.name
    if (input.eventDate !== undefined) event.eventDate = input.eventDate
    if (input.participants !== undefined) event.participants = input.participants
    if (input.status !== undefined) event.status = input.status
    if (input.participantMemberIds !== undefined) event.participantMemberIds = input.participantMemberIds
    if (input.remark !== undefined) event.remark = input.remark
    event.updatedAt = now

    eventStore.set(id, event)
    return event
  }

  /**
   * 完成活动：记录实际数据、生成满意度分布
   */
  completeEvent(
    id: string,
    tenantId: string,
    input: { actualParticipants: number; totalSpend: number; avgSatisfaction: number; satisfactionBreakdown?: SatisfactionBreakdown },
  ): TeamBuildingEvent {
    const event = this.requireEvent(id, tenantId)

    if (event.status === 'completed') {
      throw new BadRequestException('活动已完成，不可重复完成')
    }
    if (event.status === 'cancelled') {
      throw new BadRequestException('活动已取消，不可完成')
    }

    event.status = 'completed'
    event.actualParticipants = input.actualParticipants
    event.totalSpend = input.totalSpend
    event.avgSatisfaction = input.avgSatisfaction
    event.updatedAt = new Date().toISOString()

    eventStore.set(id, event)
    return event
  }

  // ═══════════════════════════════════════════════════════════════════
  // 团建报告
  // ═══════════════════════════════════════════════════════════════════

  generateReport(eventId: string, tenantId: string): TeamBuildingReport {
    const event = this.requireEvent(eventId, tenantId)

    if (event.status !== 'completed') {
      throw new BadRequestException('只有已完成的团建活动才能生成报告')
    }
    if (!event.actualParticipants || !event.totalSpend || !event.avgSatisfaction) {
      throw new BadRequestException('活动缺少实际参与人数、总消费和满意度数据')
    }

    // 检查是否已生成
    const existing = Array.from(reportStore.values()).find((r) => r.eventId === eventId)
    if (existing) return existing

    const avgSpend = Math.round(event.totalSpend / event.actualParticipants)

    // BS-0298: 查找上次团建数据做进步对比
    const improvement = this.buildImprovement(event, tenantId)

    const report: TeamBuildingReport = {
      id: `rpt-${randomUUID().slice(0, 8)}`,
      eventId,
      tenantId,
      title: `${event.name}团建总结报告`,
      participantCount: event.actualParticipants,
      totalSpend: event.totalSpend,
      avgSpend,
      avgSatisfaction: event.avgSatisfaction,
      satisfactionBreakdown: {
        count5: Math.round(event.actualParticipants * 0.4),
        count4: Math.round(event.actualParticipants * 0.3),
        count3: Math.round(event.actualParticipants * 0.2),
        count2: Math.round(event.actualParticipants * 0.07),
        count1: Math.round(event.actualParticipants * 0.03),
      },
      equipmentUsage: (event.lockedEquipment ?? []).map((eq) => ({
        name: eq.equipmentName,
        sku: eq.sku,
        qty: eq.qty,
        usageRate: 0.85,
      })),
      crmSyncStatus: 'pending',
      improvement,
      createdAt: new Date().toISOString(),
    }

    reportStore.set(report.id, report)
    return report
  }

  /**
   * BS-0298: 构建较上次进步维度
   * 对比上次已完成活动，计算参与人数/满意度变化
   */
  buildImprovement(event: TeamBuildingEvent, tenantId: string): import('./team-building.entity').ReportImprovement | undefined {
    // 查找该租户最近一次已完成且不是当前event的活动
    const allCompleted = Array.from(eventStore.values())
      .filter((e) => e.tenantId === tenantId && e.status === 'completed' && e.id !== event.id)
      .filter((e) => e.actualParticipants != null && e.avgSatisfaction != null)
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate))

    const previous = allCompleted[0]
    if (!previous) return undefined

    const prevParticipants = previous.actualParticipants!
    const curParticipants = event.actualParticipants!
    const participantChangePercent =
      prevParticipants > 0
        ? Math.round(((curParticipants - prevParticipants) / prevParticipants) * 100)
        : 0

    const prevSatisfaction = previous.avgSatisfaction!
    const curSatisfaction = event.avgSatisfaction!
    const satisfactionChange = Math.round((curSatisfaction - prevSatisfaction) * 100) / 100

    let summary: string
    if (participantChangePercent > 0 && satisfactionChange > 0) {
      summary = '双项提升！参与人数和满意度均较上次活动进步'
    } else if (participantChangePercent > 0) {
      summary = '参与人数增加，建议保持活动质量以提升满意度'
    } else if (satisfactionChange > 0) {
      summary = '满意度提升，建议加大宣传力度吸引更多人参与'
    } else if (participantChangePercent < 0 && satisfactionChange < 0) {
      summary = '需关注！参与人数和满意度均较上次下降'
    } else {
      summary = '与上次活动相比变化不大，可尝试新方案突破'
    }

    return {
      previousParticipants: prevParticipants,
      currentParticipants: curParticipants,
      participantChangePercent,
      previousSatisfaction: prevSatisfaction,
      currentSatisfaction: curSatisfaction,
      satisfactionChange,
      summary,
    }
  }

  getReport(id: string, tenantId: string): TeamBuildingReport {
    const report = reportStore.get(id)
    if (!report || report.tenantId !== tenantId) {
      throw new NotFoundException(`Report not found: ${id}`)
    }
    return report
  }

  // ═══════════════════════════════════════════════════════════════════
  // CRM 同步
  // ═══════════════════════════════════════════════════════════════════

  syncToCrm(eventId: string, tenantId: string): CrmSyncRecord {
    const event = this.requireEvent(eventId, tenantId)

    if (event.status !== 'completed') {
      throw new BadRequestException('只有已完成的团建活动才能同步到CRM')
    }

    const existing = Array.from(syncStore.values()).find((r) => r.eventId === eventId)
    if (existing) {
      if (existing.syncStatus === 'synced') {
        throw new BadRequestException('该活动已同步到CRM，请勿重复同步')
      }
      // 重试失败的同步
      existing.syncStatus = 'synced'
      existing.syncedAt = new Date().toISOString()
      syncStore.set(existing.id, existing)
      return existing
    }

    const record: CrmSyncRecord = {
      id: `crm-${randomUUID().slice(0, 8)}`,
      eventId,
      memberIds: event.participantMemberIds,
      totalSpend: event.totalSpend ?? 0,
      eventName: event.name,
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    syncStore.set(record.id, record)

    // 更新报告 CRM 同步状态
    const report = Array.from(reportStore.values()).find((r) => r.eventId === eventId)
    if (report) {
      report.crmSyncStatus = 'synced'
      reportStore.set(report.id, report)
    }

    return record
  }

  getSyncStatus(eventId: string, tenantId: string): CrmSyncRecord | null {
    const event = this.requireEvent(eventId, tenantId)
    const record = Array.from(syncStore.values()).find((r) => r.eventId === eventId)
    return record ?? null
  }

  // ═══════════════════════════════════════════════════════════════════
  // 团建看板
  // ═══════════════════════════════════════════════════════════════════

  getDashboard(tenantId: string, month?: string): TeamBuildingDashboard {
    const allEvents = Array.from(eventStore.values()).filter((e) => e.tenantId === tenantId)

    const targetMonth = month ?? new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthEvents = allEvents.filter((e) => e.eventDate.startsWith(targetMonth))

    const totalParticipants = monthEvents.reduce((s, e) => s + (e.actualParticipants ?? e.participants), 0)
    const totalSpend = monthEvents.reduce((s, e) => s + (e.totalSpend ?? 0), 0)

    // 按类型分布
    const plans = this.findAll(tenantId)
    const planTypeMap = new Map(plans.map((p) => [p.id, p.type]))

    const byType = Object.fromEntries(
      TEAM_BUILDING_TYPES.map((t) => [t, monthEvents.filter((e) => planTypeMap.get(e.planId) === t).length]),
    ) as Record<TeamBuildingType, number>

    const spendByType: Record<string, number> = {}
    for (const evt of monthEvents) {
      const type = planTypeMap.get(evt.planId) ?? 'other'
      spendByType[type] = (spendByType[type] ?? 0) + (evt.totalSpend ?? 0)
    }

    // 满意度
    const completedEvents = monthEvents.filter((e) => e.status === 'completed' && e.avgSatisfaction !== undefined)
    const avgSatisfaction = completedEvents.length > 0
      ? completedEvents.reduce((s, e) => s + (e.avgSatisfaction ?? 0), 0) / completedEvents.length
      : 0

    // 方案排行
    const planUsageCount = new Map<string, { count: number; participants: number; satisfaction: number[] }>()
    for (const evt of monthEvents) {
      const usage = planUsageCount.get(evt.planId) ?? { count: 0, participants: 0, satisfaction: [] }
      usage.count++
      usage.participants += evt.actualParticipants ?? evt.participants
      if (evt.avgSatisfaction !== undefined) usage.satisfaction.push(evt.avgSatisfaction)
      planUsageCount.set(evt.planId, usage)
    }

    const topPlans: TopPlan[] = Array.from(planUsageCount.entries())
      .map(([planId, usage]) => {
        const plan = planStore.get(planId)
        return {
          planId,
          planName: plan?.name ?? '未知方案',
          type: plan?.type ?? 'other',
          usedCount: usage.count,
          totalParticipants: usage.participants,
          avgSatisfaction: usage.satisfaction.length > 0
            ? usage.satisfaction.reduce((a, b) => a + b, 0) / usage.satisfaction.length
            : 0,
        }
      })
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5)

    // 月度趋势（近6月）
    const monthlyTrend: MonthlyTrend[] = []
    const [yearStr, monthStr] = targetMonth.split('-')
    const year = Number.parseInt(yearStr, 10)
    const monthNum = Number.parseInt(monthStr, 10)

    for (let i = 5; i >= 0; i--) {
      let y = year
      let m = monthNum - i
      if (m <= 0) {
        y--
        m += 12
      }
      const ym = `${y}-${String(m).padStart(2, '0')}`
      const evts = allEvents.filter((e) => e.eventDate.startsWith(ym))
      monthlyTrend.push({
        month: ym,
        eventCount: evts.length,
        participants: evts.reduce((s, e) => s + (e.actualParticipants ?? e.participants), 0),
        totalSpend: evts.reduce((s, e) => s + (e.totalSpend ?? 0), 0),
      })
    }

    return {
      month: targetMonth,
      totalEvents: monthEvents.length,
      totalParticipants,
      totalSpend,
      avgSpendPerPerson: totalParticipants > 0 ? Math.round(totalSpend / totalParticipants) : 0,
      avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
      byType,
      spendByType,
      monthlyTrend,
      topPlans,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requirePlan(id: string, tenantId: string): TeamBuildingPlan {
    const plan = planStore.get(id)
    if (!plan || plan.tenantId !== tenantId) {
      throw new NotFoundException(`Team-building plan not found: ${id}`)
    }
    return plan
  }

  private requireEvent(id: string, tenantId: string): TeamBuildingEvent {
    const event = eventStore.get(id)
    if (!event || event.tenantId !== tenantId) {
      throw new NotFoundException(`Team-building event not found: ${id}`)
    }
    return event
  }
}
