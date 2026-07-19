import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

// ── Type definitions ──

export type PositionType = 'full-time' | 'part-time' | 'intern'
export type PositionStatus = 'open' | 'closed'

export interface Position {
  id: string
  tenantId: string
  title: string
  department: string
  type: PositionType
  slots: number // total headcount
  filled: number // already filled
  requirements: string[]
  salary: { min: number; max: number }
  status: PositionStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export type CandidateStage = 'phone' | 'interview' | 'trial' | 'offer' | 'hired' | 'rejected'
export type CandidateSource = 'platform' | 'referral' | 'campus' | 'community'

export interface Candidate {
  id: string
  tenantId: string
  positionId: string
  name: string
  phone: string
  stage: CandidateStage
  score: number // 0-100
  interviewer?: string
  result?: string
  source: CandidateSource
  resumeUrl?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Referral {
  id: string
  tenantId: string
  candidateId: string
  referrerId: string // employee id
  referrerName: string
  reward: number // amount in CNY
  status: 'pending' | 'approved' | 'paid'
  createdAt: string
  updatedAt: string
}

export interface RecruitmentStats {
  totalPositions: number
  openPositions: number
  closedPositions: number
  totalCandidates: number
  stageDistribution: Record<CandidateStage, number>
  sourceDistribution: Record<CandidateSource, number>
  totalReferrals: number
  averageScore: number
}

// ── In-memory store ──

const positionStore = new Map<string, Position>()
const candidateStore = new Map<string, Candidate>()
const referralStore = new Map<string, Referral>()
let seeded = false

function seedData(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'
  const now = new Date().toISOString()

  // ── Positions ──

  const positions: Omit<Position, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: '导玩员',
      department: '门店运营',
      type: 'full-time',
      slots: 5,
      filled: 2,
      requirements: [
        '高中/中专以上学历',
        '性格开朗，善于与顾客互动',
        '热爱游戏文化，了解热门街机游戏',
        '能接受轮班制工作',
        '有服务行业经验者优先',
      ],
      salary: { min: 4500, max: 6000 },
      status: 'open',
      description: '负责门店顾客接待、设备引导、场地维护和顾客互动，创造欢乐的游乐氛围',
    },
    {
      title: '收银员',
      department: '财务部',
      type: 'full-time',
      slots: 3,
      filled: 1,
      requirements: [
        '高中/中专以上学历',
        '熟练使用收银系统',
        '细心谨慎，数字敏感度高',
        '具备基础的计算能力和服务意识',
        '有收银或财务经验者优先',
      ],
      salary: { min: 4200, max: 5500 },
      status: 'open',
      description: '负责收银、会员卡办理、彩票兑换及日常营收核对',
    },
    {
      title: '设备维护技术员',
      department: '技术部',
      type: 'full-time',
      slots: 2,
      filled: 0,
      requirements: [
        '中专以上学历，机电/电子相关专业优先',
        '了解基本电路原理和机械结构',
        '动手能力强，能独立完成常见设备维修',
        '有街机/游艺设备维修经验者优先',
        '持有电工证者优先',
      ],
      salary: { min: 5500, max: 7500 },
      status: 'open',
      description: '负责门店游乐设备的日常巡检、故障维修和预防性维护',
    },
  ]

  for (const p of positions) {
    const position: Position = {
      id: `pos-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      ...p,
      createdAt: now,
      updatedAt: now,
    }
    positionStore.set(position.id, position)
  }

  // ── Candidates ──

  const posIds = Array.from(positionStore.keys())
  const candidates: Omit<Candidate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[] = [
    {
      positionId: posIds[0],
      name: '陈小明',
      phone: '13900001111',
      stage: 'hired',
      score: 85,
      interviewer: '王五',
      result: '沟通能力强，服务意识好，通过试岗',
      source: 'platform',
      remark: 'BOSS直聘投递',
    },
    {
      positionId: posIds[0],
      name: '林小红',
      phone: '13900002222',
      stage: 'offer',
      score: 78,
      interviewer: '王五',
      result: '性格活泼，游戏经验丰富，已发offer',
      source: 'referral',
      remark: '员工张三推荐',
    },
    {
      positionId: posIds[1],
      name: '黄大伟',
      phone: '13900003333',
      stage: 'interview',
      score: 72,
      interviewer: '郑冬',
      result: '有收银经验，下周安排试岗',
      source: 'platform',
      remark: '前程无忧投递',
    },
    {
      positionId: posIds[2],
      name: '刘志强',
      phone: '13900004444',
      stage: 'phone',
      score: 65,
      source: 'campus',
      remark: '职业中专机电专业实习推荐',
    },
    {
      positionId: posIds[1],
      name: '周美丽',
      phone: '13900005555',
      stage: 'rejected',
      score: 45,
      interviewer: '郑冬',
      result: '收银速度慢，抗压能力不足',
      source: 'community',
      remark: '本地社区推荐',
    },
  ]

  for (const c of candidates) {
    const candidate: Candidate = {
      id: `cand-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      ...c,
      createdAt: now,
      updatedAt: now,
    }
    candidateStore.set(candidate.id, candidate)
  }

  // ── Referrals ──

  const hiredCandidates = Array.from(candidateStore.values())
    .filter(c => c.stage === 'hired' && c.source === 'referral')

  for (const c of hiredCandidates) {
    const referral: Referral = {
      id: `ref-${randomUUID().slice(0, 8)}`,
      tenantId: tenant,
      candidateId: c.id,
      referrerId: 'E001',
      referrerName: '张三',
      reward: 500,
      status: 'paid',
      createdAt: now,
      updatedAt: now,
    }
    referralStore.set(referral.id, referral)
  }
}

@Injectable()
export class HrRecruitmentService implements OnModuleInit {
  private readonly logger = new Logger(HrRecruitmentService.name)

  onModuleInit(): void {
    seedData()
    this.logger.log(`Seeded ${positionStore.size} positions, ${candidateStore.size} candidates, ${referralStore.size} referrals`)
  }

  // ─────────────────────────────────────────────────────────────────
  // 职位管理
  // ─────────────────────────────────────────────────────────────────

  createPosition(input: {
    tenantId: string
    title: string
    department: string
    type: PositionType
    slots: number
    requirements: string[]
    salary: { min: number; max: number }
    description?: string
  }): Position {
    const now = new Date().toISOString()
    const position: Position = {
      id: `pos-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      title: input.title,
      department: input.department,
      type: input.type,
      slots: input.slots,
      filled: 0,
      requirements: input.requirements,
      salary: input.salary,
      status: 'open',
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    positionStore.set(position.id, position)
    return position
  }

  findAllPositions(
    tenantId: string,
    filter?: { department?: string; status?: PositionStatus; type?: PositionType },
  ): Position[] {
    return Array.from(positionStore.values())
      .filter(p => p.tenantId === tenantId)
      .filter(p => filter?.department ? p.department === filter.department : true)
      .filter(p => filter?.status ? p.status === filter.status : true)
      .filter(p => filter?.type ? p.type === filter.type : true)
      .sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  }

  findPositionById(id: string, tenantId: string): Position | undefined {
    const p = positionStore.get(id)
    if (!p || p.tenantId !== tenantId) return undefined
    return p
  }

  updatePosition(
    id: string,
    tenantId: string,
    input: Partial<{
      title: string
      department: string
      type: PositionType
      slots: number
      filled: number
      requirements: string[]
      salary: { min: number; max: number }
      status: PositionStatus
      description: string
    }>,
  ): Position {
    const pos = this.requirePosition(id, tenantId)
    const now = new Date().toISOString()
    if (input.title !== undefined) pos.title = input.title
    if (input.department !== undefined) pos.department = input.department
    if (input.type !== undefined) pos.type = input.type
    if (input.slots !== undefined) pos.slots = input.slots
    if (input.filled !== undefined) pos.filled = input.filled
    if (input.requirements !== undefined) pos.requirements = input.requirements
    if (input.salary !== undefined) pos.salary = input.salary
    if (input.status !== undefined) pos.status = input.status
    if (input.description !== undefined) pos.description = input.description
    pos.updatedAt = now
    positionStore.set(id, pos)
    return pos
  }

  // ─────────────────────────────────────────────────────────────────
  // 候选人管理
  // ─────────────────────────────────────────────────────────────────

  createCandidate(input: {
    tenantId: string
    positionId: string
    name: string
    phone: string
    source: CandidateSource
    score?: number
    resumeUrl?: string
    remark?: string
  }): Candidate {
    const pos = this.requirePosition(input.positionId, input.tenantId)
    const now = new Date().toISOString()
    const candidate: Candidate = {
      id: `cand-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      positionId: input.positionId,
      name: input.name,
      phone: input.phone,
      stage: 'phone',
      score: input.score ?? 0,
      source: input.source,
      resumeUrl: input.resumeUrl,
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    candidateStore.set(candidate.id, candidate)
    return candidate
  }

  findCandidates(
    tenantId: string,
    filter?: { positionId?: string; stage?: CandidateStage },
  ): Candidate[] {
    return Array.from(candidateStore.values())
      .filter(c => c.tenantId === tenantId)
      .filter(c => filter?.positionId ? c.positionId === filter.positionId : true)
      .filter(c => filter?.stage ? c.stage === filter.stage : true)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  updateCandidateStatus(
    id: string,
    tenantId: string,
    input: Partial<{
      stage: CandidateStage
      score: number
      interviewer: string
      result: string
      remark: string
    }>,
  ): Candidate {
    const candidate = this.requireCandidate(id, tenantId)
    const now = new Date().toISOString()
    if (input.stage !== undefined) candidate.stage = input.stage
    if (input.score !== undefined) candidate.score = input.score
    if (input.interviewer !== undefined) candidate.interviewer = input.interviewer
    if (input.result !== undefined) candidate.result = input.result
    if (input.remark !== undefined) candidate.remark = input.remark
    candidate.updatedAt = now
    candidateStore.set(id, candidate)

    // If hired, increment the position's filled count
    if (candidate.stage === 'hired') {
      const pos = positionStore.get(candidate.positionId)
      if (pos && pos.tenantId === tenantId) {
        pos.filled = Math.min(pos.filled + 1, pos.slots)
        if (pos.filled >= pos.slots) {
          pos.status = 'closed'
        }
        pos.updatedAt = now
        positionStore.set(pos.id, pos)
      }
    }

    return candidate
  }

  // ─────────────────────────────────────────────────────────────────
  // 内推管理
  // ─────────────────────────────────────────────────────────────────

  createReferral(input: {
    tenantId: string
    candidateId: string
    referrerId: string
    referrerName: string
    reward: number
  }): Referral {
    this.requireCandidate(input.candidateId, input.tenantId)
    const now = new Date().toISOString()
    const referral: Referral = {
      id: `ref-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      candidateId: input.candidateId,
      referrerId: input.referrerId,
      referrerName: input.referrerName,
      reward: input.reward,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    referralStore.set(referral.id, referral)
    return referral
  }

  // ─────────────────────────────────────────────────────────────────
  // 统计
  // ─────────────────────────────────────────────────────────────────

  getRecruitmentStats(tenantId: string): RecruitmentStats {
    const positions = Array.from(positionStore.values()).filter(p => p.tenantId === tenantId)
    const candidates = Array.from(candidateStore.values()).filter(c => c.tenantId === tenantId)
    const referrals = Array.from(referralStore.values()).filter(r => r.tenantId === tenantId)

    const stageDistribution: Record<CandidateStage, number> = {
      phone: 0, interview: 0, trial: 0, offer: 0, hired: 0, rejected: 0,
    }
    for (const c of candidates) {
      stageDistribution[c.stage] = (stageDistribution[c.stage] || 0) + 1
    }

    const sourceDistribution: Record<CandidateSource, number> = {
      platform: 0, referral: 0, campus: 0, community: 0,
    }
    for (const c of candidates) {
      sourceDistribution[c.source] = (sourceDistribution[c.source] || 0) + 1
    }

    const scoredCandidates = candidates.filter(c => c.score > 0)
    const averageScore = scoredCandidates.length > 0
      ? parseFloat((scoredCandidates.reduce((s, c) => s + c.score, 0) / scoredCandidates.length).toFixed(1))
      : 0

    return {
      totalPositions: positions.length,
      openPositions: positions.filter(p => p.status === 'open').length,
      closedPositions: positions.filter(p => p.status === 'closed').length,
      totalCandidates: candidates.length,
      stageDistribution,
      sourceDistribution,
      totalReferrals: referrals.length,
      averageScore,
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 入职流程（对接员工创建）
  // ─────────────────────────────────────────────────────────────────

  getOnboardingInfo(candidateId: string, tenantId: string): {
    candidate: Candidate
    position: Position | undefined
    onboardingSteps: string[]
  } {
    const candidate = this.requireCandidate(candidateId, tenantId)
    const position = positionStore.get(candidate.positionId)

    const onboardingSteps = [
      '签订劳动合同',
      'IT设备领用（工卡/工服/系统账号）',
      '工位分配',
      '公司制度学习（员工手册/安全规范）',
      '导师分配（Buddy带教）',
      '第一周文化浸润培训',
      '第2-4周分级培训（设备操作→服务标准→系统使用→安全知识）',
      '第5-8周独立上岗（Buddy每日反馈）',
      '第60天入职评估',
    ]

    return { candidate, position, onboardingSteps }
  }

  // ─────────────────────────────────────────────────────────────────
  // 内部方法
  // ─────────────────────────────────────────────────────────────────

  private requirePosition(id: string, tenantId: string): Position {
    const p = positionStore.get(id)
    if (!p || p.tenantId !== tenantId) {
      throw new Error(`Position not found: ${id}`)
    }
    return p
  }

  private requireCandidate(id: string, tenantId: string): Candidate {
    const c = candidateStore.get(id)
    if (!c || c.tenantId !== tenantId) {
      throw new Error(`Candidate not found: ${id}`)
    }
    return c
  }
}
