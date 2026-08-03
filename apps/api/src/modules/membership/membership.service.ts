/**
 * membership.service.ts — 会员管理核心服务
 *
 * 功能:
 *   1. 会员注册 / 查询 / 更新 / 列表
 *   2. 等级管理 (普通/银卡/金卡/钻石)
 *   3. 积分累计 / 扣减 / 查询
 *   4. 余额充值 / 支付 / 查询
 *   5. 消费记录 / 交易流水
 *
 * PRD: prd-member-p36.md
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'

// ─── Types ────────────────────────────────────────────────────

export type MemberLevel = 'regular' | 'silver' | 'gold' | 'diamond'

export interface Member {
  id: string
  tenantId: string
  phone: string
  name: string
  level: MemberLevel
  points: number
  balance: number      // 预付余额(分)
  totalSpent: number   // 累计消费(分)
  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
}

export interface PointsTransaction {
  id: string
  memberId: string
  type: 'earn' | 'redeem' | 'expire' | 'admin'
  amount: number
  orderId?: string
  remark: string
  createdAt: Date
}

export interface BalanceTransaction {
  id: string
  memberId: string
  type: 'recharge' | 'payment' | 'refund' | 'admin'
  amount: number
  orderId?: string
  paymentMethod?: string
  remark: string
  createdAt: Date
}

export interface LevelConfig {
  level: MemberLevel
  minSpent: number
  pointsMultiplier: number
  discountRate: number  // e.g. 0.95 = 95折
  label: string
}

export interface MemberFilter {
  phone?: string
  level?: MemberLevel
  search?: string
}

export interface CreateMemberDto {
  phone: string
  name: string
  tenantId: string
}

export interface UpdateMemberDto {
  name?: string
  level?: MemberLevel
}

// ─── Level Configs ────────────────────────────────────────────

const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 'regular', minSpent: 0, pointsMultiplier: 1.0, discountRate: 1.0, label: '普通会员' },
  { level: 'silver',  minSpent: 50000, pointsMultiplier: 1.2, discountRate: 0.95, label: '银卡会员' },
  { level: 'gold',    minSpent: 200000, pointsMultiplier: 1.5, discountRate: 0.90, label: '金卡会员' },
  { level: 'diamond', minSpent: 500000, pointsMultiplier: 2.0, discountRate: 0.85, label: '钻石会员' },
]

const POINTS_TO_CENT_RATIO = 100  // 100积分 = 1元 = 100分

// ─── Service ──────────────────────────────────────────────────

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name)

  // In-memory stores for testing simplicity
  private members: Map<string, Member> = new Map()
  private pointsTx: PointsTransaction[] = []
  private balanceTx: BalanceTransaction[] = []
  private idCounter = 0

  // ── Helpers ─────────────────────────────────────────────────

  private nextId(): string {
    this.idCounter++
    return `MEM-${String(this.idCounter).padStart(6, '0')}`
  }

  private nextTxId(type: string): string {
    this.idCounter++
    return `${type.toUpperCase()}-${String(this.idCounter).padStart(8, '0')}`
  }

  calculateLevel(totalSpent: number): MemberLevel {
    const configs = [...LEVEL_CONFIGS].sort((a, b) => b.minSpent - a.minSpent)
    for (const cfg of configs) {
      if (totalSpent >= cfg.minSpent) return cfg.level
    }
    return 'regular'
  }

  getLevelConfig(level: MemberLevel): LevelConfig {
    return LEVEL_CONFIGS.find((c) => c.level === level) ?? LEVEL_CONFIGS[0]
  }

  // ═════════════════════════════════════════════════════════════
  // 1. 会员管理
  // ═════════════════════════════════════════════════════════════

  /**
   * 注册新会员
   * @throws BadRequestException 手机号已存在
   */
  register(dto: CreateMemberDto): Member {
    if (!dto.phone || dto.phone.trim() === '') {
      throw new BadRequestException('手机号不能为空')
    }

    // Check duplicate phone
    const existing = Array.from(this.members.values()).find(
      (m) => m.phone === dto.phone && m.tenantId === dto.tenantId,
    )
    if (existing) {
      throw new BadRequestException(`手机号 ${dto.phone} 已注册`)
    }

    const now = new Date()
    const member: Member = {
      id: this.nextId(),
      tenantId: dto.tenantId,
      phone: dto.phone,
      name: dto.name || '未知客户',
      level: 'regular',
      points: 0,
      balance: 0,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    }
    this.members.set(member.id, member)
    this.logger.log(`会员注册成功: ${member.id} / ${member.phone}`)
    return member
  }

  /**
   * 根据手机号查询会员
   */
  findByPhone(phone: string, tenantId: string): Member | null {
    return (
      Array.from(this.members.values()).find(
        (m) => m.phone === phone && m.tenantId === tenantId,
      ) ?? null
    )
  }

  /**
   * 根据ID查询会员
   */
  getById(id: string): Member | null {
    return this.members.get(id) ?? null
  }

  /**
   * 获取或创建会员（注册时调用）
   */
  getOrCreate(dto: CreateMemberDto): Member {
    const existing = this.findByPhone(dto.phone, dto.tenantId)
    if (existing) return existing
    return this.register(dto)
  }

  /**
   * 更新会员信息
   */
  update(id: string, dto: UpdateMemberDto): Member {
    const member = this.members.get(id)
    if (!member) throw new NotFoundException(`会员 ${id} 不存在`)

    if (dto.name !== undefined) member.name = dto.name
    if (dto.level !== undefined) {
      const validLevels: MemberLevel[] = ['regular', 'silver', 'gold', 'diamond']
      if (!validLevels.includes(dto.level)) {
        throw new BadRequestException(`无效等级: ${dto.level}`)
      }
      member.level = dto.level
    }
    member.updatedAt = new Date()
    this.members.set(id, member)
    return member
  }

  /**
   * 查询会员列表
   */
  list(filter?: MemberFilter): Member[] {
    let result = Array.from(this.members.values())
    if (filter) {
      if (filter.phone) {
        result = result.filter((m) => m.phone.includes(filter.phone!))
      }
      if (filter.level) {
        result = result.filter((m) => m.level === filter.level)
      }
      if (filter.search) {
        const q = filter.search.toLowerCase()
        result = result.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            m.id.toLowerCase().includes(q),
        )
      }
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  /**
   * 删除会员
   */
  delete(id: string): void {
    if (!this.members.has(id)) throw new NotFoundException(`会员 ${id} 不存在`)
    this.members.delete(id)
    this.logger.log(`会员删除: ${id}`)
  }

  // ═════════════════════════════════════════════════════════════
  // 2. 等级管理
  // ═════════════════════════════════════════════════════════════

  /**
   * 获取所有等级配置
   */
  getLevelConfigs(): LevelConfig[] {
    return [...LEVEL_CONFIGS]
  }

  /**
   * 根据累计消费自动计算并更新等级
   */
  refreshLevel(memberId: string): Member {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    const newLevel = this.calculateLevel(member.totalSpent)
    if (newLevel !== member.level) {
      member.level = newLevel
      member.updatedAt = new Date()
      this.members.set(memberId, member)
      this.logger.log(`会员等级更新: ${memberId} → ${newLevel}`)
    }
    return member
  }

  /**
   * 获取会员升级进度
   */
  getUpgradeProgress(memberId: string): {
    currentLevel: MemberLevel
    nextLevel: MemberLevel | null
    currentSpent: number
    nextLevelMinSpent: number
    progress: number  // 0-100
  } {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    const configs = [...LEVEL_CONFIGS].sort((a, b) => a.minSpent - b.minSpent)
    const idx = configs.findIndex((c) => c.level === member.level)
    const nextCfg = idx < configs.length - 1 ? configs[idx + 1] : null

    const currentCfg = configs[idx]
    const currentSpent = member.totalSpent
    let progress = 100
    if (nextCfg) {
      const range = nextCfg.minSpent - currentCfg.minSpent
      const done = currentSpent - currentCfg.minSpent
      progress = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100
    }

    return {
      currentLevel: member.level,
      nextLevel: nextCfg?.level ?? null,
      currentSpent,
      nextLevelMinSpent: nextCfg?.minSpent ?? currentCfg.minSpent,
      progress,
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 3. 积分管理
  // ═════════════════════════════════════════════════════════════

  /**
   * 累计积分（消费后调用）
   * @param memberId 会员ID
   * @param amount 消费金额(分)
   * @param orderId 订单ID
   */
  earnPoints(memberId: string, amount: number, orderId?: string): PointsTransaction {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    const cfg = this.getLevelConfig(member.level)
    const pointsEarned = Math.floor(amount / 100 * cfg.pointsMultiplier)

    if (pointsEarned > 0) {
      member.points += pointsEarned
      member.totalSpent += amount
      member.updatedAt = new Date()
      this.members.set(memberId, member)

      // Auto-upgrade check
      this.refreshLevel(memberId)
    }

    const tx: PointsTransaction = {
      id: this.nextTxId('points'),
      memberId,
      type: 'earn',
      amount: pointsEarned,
      orderId,
      remark: `消费 ${(amount / 100).toFixed(2)} 元，获得 ${pointsEarned} 积分`,
      createdAt: new Date(),
    }
    this.pointsTx.push(tx)
    return tx
  }

  /**
   * 扣减积分（消费抵扣）
   * @returns 实际抵扣金额(分)
   */
  redeemPoints(memberId: string, pointsToRedeem: number, orderId?: string): { pointsUsed: number; centsDiscounted: number } {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    const actualPoints = Math.min(pointsToRedeem, member.points)
    const minPoints = POINTS_TO_CENT_RATIO
    if (actualPoints < minPoints) {
      throw new BadRequestException(`积分不足，至少需要 ${minPoints} 积分才能抵扣`)
    }

    // Must be multiples of POINTS_TO_CENT_RATIO
    const roundedPoints = Math.floor(actualPoints / POINTS_TO_CENT_RATIO) * POINTS_TO_CENT_RATIO
    if (roundedPoints < minPoints) {
      throw new BadRequestException(`积分不足，至少需要 ${minPoints} 积分才能抵扣`)
    }

    const centsDiscounted = Math.floor(roundedPoints / POINTS_TO_CENT_RATIO)

    member.points -= roundedPoints
    member.updatedAt = new Date()
    this.members.set(memberId, member)

    const tx: PointsTransaction = {
      id: this.nextTxId('points'),
      memberId,
      type: 'redeem',
      amount: -roundedPoints,
      orderId,
      remark: `积分抵扣 ¥${(centsDiscounted / 100).toFixed(2)}，使用 ${roundedPoints} 积分`,
      createdAt: new Date(),
    }
    this.pointsTx.push(tx)

    return { pointsUsed: roundedPoints, centsDiscounted }
  }

  /**
   * 查询积分流水
   */
  listPointsTransactions(memberId: string, limit = 50): PointsTransaction[] {
    return this.pointsTx
      .filter((tx) => tx.memberId === memberId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * 管理员调整积分
   */
  adjustPoints(memberId: string, amount: number, remark: string): Member {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    if (member.points + amount < 0) {
      throw new BadRequestException('积分调整后不能为负数')
    }

    member.points += amount
    member.updatedAt = new Date()
    this.members.set(memberId, member)

    const tx: PointsTransaction = {
      id: this.nextTxId('points'),
      memberId,
      type: 'admin',
      amount,
      remark,
      createdAt: new Date(),
    }
    this.pointsTx.push(tx)

    return member
  }

  // ═════════════════════════════════════════════════════════════
  // 4. 余额管理
  // ═════════════════════════════════════════════════════════════

  /**
   * 充值余额
   */
  recharge(memberId: string, amount: number, paymentMethod?: string, orderId?: string): Member {
    if (amount <= 0) throw new BadRequestException('充值金额必须大于0')

    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    member.balance += amount
    member.updatedAt = new Date()
    this.members.set(memberId, member)

    const tx: BalanceTransaction = {
      id: this.nextTxId('balance'),
      memberId,
      type: 'recharge',
      amount,
      orderId,
      paymentMethod: paymentMethod ?? 'wechat',
      remark: `充值 ¥${(amount / 100).toFixed(2)}`,
      createdAt: new Date(),
    }
    this.balanceTx.push(tx)

    return member
  }

  /**
   * 余额支付
   * @returns 实际支付金额(分)
   */
  payWithBalance(memberId: string, amount: number, orderId?: string): number {
    const member = this.members.get(memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)

    if (member.balance < amount) {
      throw new BadRequestException(
        `余额不足，当前余额 ¥${(member.balance / 100).toFixed(2)}，需支付 ¥${(amount / 100).toFixed(2)}`,
      )
    }

    member.balance -= amount
    member.updatedAt = new Date()
    this.members.set(memberId, member)

    const tx: BalanceTransaction = {
      id: this.nextTxId('balance'),
      memberId,
      type: 'payment',
      amount: -amount,
      orderId,
      remark: `余额支付 ¥${(amount / 100).toFixed(2)}`,
      createdAt: new Date(),
    }
    this.balanceTx.push(tx)

    return amount
  }

  /**
   * 查询余额流水
   */
  listBalanceTransactions(memberId: string, limit = 50): BalanceTransaction[] {
    return this.balanceTx
      .filter((tx) => tx.memberId === memberId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // ═════════════════════════════════════════════════════════════
  // 5. 统计
  // ═════════════════════════════════════════════════════════════

  getStats(): {
    totalMembers: number
    byLevel: Record<MemberLevel, number>
    totalPoints: number
    totalBalance: number
    totalRecharge: number
  } {
    const all = Array.from(this.members.values())
    const byLevel: Record<MemberLevel, number> = {
      regular: 0,
      silver: 0,
      gold: 0,
      diamond: 0,
    }
    for (const m of all) {
      byLevel[m.level] = (byLevel[m.level] ?? 0) + 1
    }

    const totalRecharge = this.balanceTx
      .filter((tx) => tx.type === 'recharge')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      totalMembers: all.length,
      byLevel,
      totalPoints: all.reduce((s, m) => s + m.points, 0),
      totalBalance: all.reduce((s, m) => s + m.balance, 0),
      totalRecharge,
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ⚠️ Internal Reset (for tests)
  // ═════════════════════════════════════════════════════════════

  _reset(): void {
    this.members.clear()
    this.pointsTx = []
    this.balanceTx = []
    this.idCounter = 0
  }

  _seed(member: Partial<Member> & { phone: string }): Member {
    const now = new Date()
    const m: Member = {
      id: member.id ?? this.nextId(),
      tenantId: member.tenantId ?? 'tenant-1',
      phone: member.phone,
      name: member.name ?? `会员${member.phone.slice(-4)}`,
      level: member.level ?? 'regular',
      points: member.points ?? 0,
      balance: member.balance ?? 0,
      totalSpent: member.totalSpent ?? 0,
      createdAt: member.createdAt ?? now,
      updatedAt: now,
    }
    this.members.set(m.id, m)
    this.idCounter = Math.max(this.idCounter, parseInt(m.id.split('-')[1] ?? '0', 10))
    return m
  }
}
