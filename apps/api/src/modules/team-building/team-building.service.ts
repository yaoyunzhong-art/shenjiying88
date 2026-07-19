import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

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
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requirePlan(id: string, tenantId: string): TeamBuildingPlan {
    const plan = planStore.get(id)
    if (!plan || plan.tenantId !== tenantId) {
      throw new Error(`Team-building plan not found: ${id}`)
    }
    return plan
  }
}
