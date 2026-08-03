// referral-tracking.service.ts · 全员营销 & KOL 推广追踪引擎
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 【P0 修复 — BL-6】
// - referralCodeId 传 code 字符串 → 先查 DB id 再创建 relation
// - .catch() 吞错 → throw 传播（调用方 controller 需感知持久化失败）
// - 构造器内存 Map 种子数据 → 改为 onModuleInit DB 初始化
//
// 宪法§13.8 推广归因透明化:
//   - 扫码无感：客户扫描推广码无需额外操作，系统自动记录
//   - 被推广客户不收到骚扰通知，仅首次消费享受新人优惠
//   - 推广关系可查可解除
//
// 宪法§13.3 任务分级:
//   初级: 转发朋友圈、社群发言 (3-5分)
//   中级: 拍短视频、邀请到店 (10-20分)
//   高级: 直播带货、发展分销员 (50-100分)
//
// 宪法§13.5 佣金阶梯制: 销售额越高佣金比例越高
// 宪法§10.5: 最多2级分销 + AI佣金建议 + 等级佣金加成

import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../prisma/prisma.service'

// ══════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════

export type ReferrerType = 'employee' | 'kol' | 'customer' | 'store'
export type ReferralChannel = 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili' | 'qr_scan' | 'direct_link'

export interface ReferralCode {
  code: string
  type: ReferrerType
  referrerId: string
  referrerName: string
  storeSlug: string
  channel: ReferralChannel
  createdAt: string
  totalScans: number
  totalConversions: number
  totalRevenue: number
}

export interface ReferralRecord {
  id: string
  code: string
  referrerId: string
  customerPhone: string
  storeSlug: string
  scannedAt: string
  convertedAt?: string
  conversionAmount?: number
  commissionRate: number
  commissionAmount?: number
  status: 'scanned' | 'converted' | 'cancelled'
}

export interface CommissionTier {
  minRevenue: number
  maxRevenue: number
  rate: number
}

export interface LeaderboardEntry {
  rank: number
  referrerId: string
  referrerName: string
  type: ReferrerType
  scans: number
  conversions: number
  revenue: number
  commission: number
  trend: 'up' | 'down' | 'stable'
}

// ══════════════════════════════════════════════════════
// 佣金阶梯 (宪法§13.5)
// ══════════════════════════════════════════════════════

const COMMISSION_TIERS: CommissionTier[] = [
  { minRevenue: 0, maxRevenue: 100_000, rate: 3 },
  { minRevenue: 100_000, maxRevenue: 500_000, rate: 5 },
  { minRevenue: 500_000, maxRevenue: 2_000_000, rate: 8 },
  { minRevenue: 2_000_000, maxRevenue: Infinity, rate: 12 },
]

const LEVEL_BONUS: Record<string, number> = {
  '青铜': 1.0, '白银': 1.0, '黄金': 1.1, '铂金': 1.2,
  '钻石': 1.3, '王者': 1.5, 'SVIP': 2.0,
}

const KOL_COMMISSION_MULTIPLIER = 1.5
const CUSTOMER_REFERRAL_BONUS = 50

// 种子推广码
const SEED_CODES = [
  { type: 'employee' as ReferrerType, referrerId: 'EMP001', referrerName: '小陈·朝阳店店长', storeSlug: 'beijing-chaoyang', channel: 'wechat' as ReferralChannel },
  { type: 'kol' as ReferrerType, referrerId: 'KOL001', referrerName: '@电竞阿杰(抖音50w粉)', storeSlug: 'beijing-chaoyang', channel: 'douyin' as ReferralChannel },
  { type: 'kol' as ReferrerType, referrerId: 'KOL002', referrerName: '@亲子玩乐日记(小红书30w粉)', storeSlug: 'beijing-chaoyang', channel: 'xiaohongshu' as ReferralChannel },
  { type: 'customer' as ReferrerType, referrerId: 'CUST001', referrerName: '老客户·运动达人小王', storeSlug: 'beijing-chaoyang', channel: 'wechat' as ReferralChannel },
]

// ══════════════════════════════════════════════════════
// Service
// ══════════════════════════════════════════════════════

@Injectable()
export class ReferralTrackingService implements OnModuleInit {
  private readonly logger = new Logger(ReferralTrackingService.name)

  // 内存缓存：code → ReferralCode（读多写少，辅助快速访问）
  private readonly codeCache = new Map<string, ReferralCode>()

  // 内存缓存：referrerId → totalRevenue (分)
  private readonly referrerRevenue = new Map<string, number>()

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 模块初始化：种子推广码写入 DB（幂等）
   */
  async onModuleInit(): Promise<void> {
    await this.seedInitialCodes()
  }

  private async seedInitialCodes(): Promise<void> {
    for (const seed of SEED_CODES) {
      const existing = await this.prisma.storefrontReferralCode.findFirst({
        where: { referrerId: seed.referrerId, storeSlug: seed.storeSlug, active: true },
      })
      if (!existing) {
        await this.createCode(seed)
      }
    }
    this.logger.log(`[Referral] 种子推广码已初始化 (${SEED_CODES.length}个)`)
  }

  // ── 1. 创建推广码 ─────────────────────────────────

  async createCode(params: {
    type: ReferrerType; referrerId: string; referrerName: string
    storeSlug: string; channel: ReferralChannel
  }): Promise<ReferralCode> {
    const code = `REF-${params.type.slice(0, 4).toUpperCase()}-${params.referrerId}-${randomUUID().slice(0, 6)}`

    // BL-6: Prisma 持久化推广码 — 先写 DB，再写缓存
    const record = await this.prisma.storefrontReferralCode.create({
      data: {
        code,
        tenantId: 'tenant-default',
        type: params.type,
        referrerId: params.referrerId,
        referrerName: params.referrerName,
        storeSlug: params.storeSlug,
        channel: params.channel,
      },
    })

    const referralCode: ReferralCode = {
      code: record.code,
      type: record.type as ReferrerType,
      referrerId: record.referrerId,
      referrerName: record.referrerName,
      storeSlug: record.storeSlug,
      channel: record.channel as ReferralChannel,
      createdAt: record.createdAt.toISOString(),
      totalScans: record.totalScans,
      totalConversions: record.totalConversions,
      totalRevenue: record.totalCommission,
    }
    this.codeCache.set(code, referralCode)

    this.logger.log(`[Referral] Created ${params.type} code: ${code} → ${params.referrerName}`)
    return referralCode
  }

  // ── 2. 扫码归因（无感追踪） ─────────────────────

  async trackScan(code: string, customerPhone: string): Promise<ReferralRecord> {
    const referralCode = await this.getCodeCacheOrDB(code)
    if (!referralCode) throw new NotFoundException('推广码无效')

    // 同一客户只归属于首个转化成功的推广人
    const existingRelation = await this.prisma.storefrontReferralRelation.findFirst({
      where: { customerPhone, hasConverted: true },
    })
    if (existingRelation) {
      this.logger.log(`[Referral] ${customerPhone} 已有推广关系，跳过`)
      return {
        id: existingRelation.id,
        code,
        referrerId: referralCode.referrerId,
        customerPhone,
        storeSlug: referralCode.storeSlug,
        scannedAt: existingRelation.scannedAt.toISOString(),
        commissionRate: 0,
        status: 'converted',
      }
    }

    // 更新 DB: totalScans +1
    await this.prisma.storefrontReferralCode.update({
      where: { code },
      data: { totalScans: { increment: 1 } },
    })

    referralCode.totalScans++
    this.codeCache.set(code, referralCode)

    // BL-6 修复: 先查 referralCode DB id，再创建 relation
    const dbCode = await this.prisma.storefrontReferralCode.findUnique({ where: { code } })
    if (!dbCode) throw new NotFoundException('推广码不存在')

    const relation = await this.prisma.storefrontReferralRelation.create({
      data: {
        tenantId: 'tenant-default',
        referralCodeId: dbCode.id,  // 正确：传 DB 主键 id，而非 code 字符串
        customerPhone,
        hasConverted: false,
      },
    })

    this.logger.log(`[Referral] ${customerPhone} 扫描了 ${referralCode.referrerName} 的推广码 (无通知)`)

    return {
      id: relation.id,
      code,
      referrerId: referralCode.referrerId,
      customerPhone,
      storeSlug: referralCode.storeSlug,
      scannedAt: relation.scannedAt.toISOString(),
      commissionRate: 0,
      status: 'scanned',
    }
  }

  // ── 3. 转化追踪 ──────────────────────────────────

  async trackConversion(customerPhone: string, orderAmount: number): Promise<ReferralRecord | null> {
    // 查找扫描但未转化的关系
    const relation = await this.prisma.storefrontReferralRelation.findFirst({
      where: { customerPhone, hasConverted: false },
      orderBy: { scannedAt: 'desc' },
    })
    if (!relation) return null

    const dbCode = await this.prisma.storefrontReferralCode.findUnique({
      where: { id: relation.referralCodeId },
    })
    if (!dbCode) return null

    const referralCode = this.codeCache.get(dbCode.code)
    if (!referralCode) return null

    // 阶梯佣金计算
    const currentRevenue = this.referrerRevenue.get(referralCode.referrerId) ?? 0
    const totalRevenue = currentRevenue + orderAmount
    this.referrerRevenue.set(referralCode.referrerId, totalRevenue)

    const tier = COMMISSION_TIERS.find(
      t => totalRevenue >= t.minRevenue && totalRevenue < t.maxRevenue,
    )
    const tierRate = tier?.rate ?? 3
    const referrerLevel = this.getReferrerLevel(referralCode.referrerId)
    const levelMultiplier = LEVEL_BONUS[referrerLevel] ?? 1.0
    const kolMultiplier = referralCode.type === 'kol' ? KOL_COMMISSION_MULTIPLIER : 1.0
    const finalRate = tierRate * levelMultiplier * kolMultiplier
    const commission = Math.floor(orderAmount * finalRate / 100)

    // 更新推广码的转化计数和佣金
    await this.prisma.storefrontReferralCode.update({
      where: { id: dbCode.id },
      data: {
        totalConversions: { increment: 1 },
        totalCommission: { increment: commission },
        commissionTier: tierRate,
      },
    })

    // 更新推广关系为已转化
    await this.prisma.storefrontReferralRelation.update({
      where: { id: relation.id },
      data: {
        hasConverted: true,
        orderAmount,
        commissionAmount: commission,
        convertedAt: new Date(),
      },
    })

    referralCode.totalConversions++
    referralCode.totalRevenue += orderAmount
    this.codeCache.set(referralCode.code, referralCode)

    // 老客推荐 → 双方奖励成长值
    if (referralCode.type === 'customer') {
      this.grantGrowthValue(referralCode.referrerId, CUSTOMER_REFERRAL_BONUS, '老客推荐奖励')
      this.grantGrowthValue(customerPhone, CUSTOMER_REFERRAL_BONUS, '好友推荐奖励')
    }

    this.logger.log(
      `[Referral Conversion] ${customerPhone} → ${referralCode.referrerId}(${referralCode.type}) ` +
      `订单¥${orderAmount / 100} 佣金¥${commission / 100} (${finalRate.toFixed(1)}%)`,
    )

    return {
      id: relation.id,
      code: referralCode.code,
      referrerId: referralCode.referrerId,
      customerPhone,
      storeSlug: referralCode.storeSlug,
      scannedAt: relation.scannedAt.toISOString(),
      convertedAt: new Date().toISOString(),
      conversionAmount: orderAmount,
      commissionRate: finalRate,
      commissionAmount: commission,
      status: 'converted',
    }
  }

  // ── 4. 排行榜 ─────────────────────────────────────

  async getLeaderboard(storeSlug: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<LeaderboardEntry[]> {
    const dbCodes = await this.prisma.storefrontReferralCode.findMany({
      where: { storeSlug, active: true },
      orderBy: { totalCommission: 'desc' },
      take: 100,
    })

    const entries: LeaderboardEntry[] = dbCodes.map((c, i) => {
      const tier = COMMISSION_TIERS.find(
        t => c.totalCommission >= t.minRevenue && c.totalCommission < t.maxRevenue,
      )
      const rate = (tier?.rate ?? 3) * (c.type === 'kol' ? KOL_COMMISSION_MULTIPLIER : 1.0)
      return {
        rank: i + 1,
        referrerId: c.referrerId,
        referrerName: c.referrerName,
        type: c.type as ReferrerType,
        scans: c.totalScans,
        conversions: c.totalConversions,
        revenue: c.totalCommission,
        commission: Math.floor(c.totalCommission * rate / 100),
        trend: 'stable',
      }
    })

    return entries
  }

  // ── 5. 推广者个人面板 ────────────────────────────

  async getReferrerDashboard(referrerId: string) {
    const dbCodes = await this.prisma.storefrontReferralCode.findMany({
      where: { referrerId, active: true },
    })

    if (dbCodes.length === 0) {
      return {
        referrerId,
        referrerName: referrerId,
        type: 'employee' as ReferrerType,
        level: '青铜',
        stats: { totalScans: 0, totalConversions: 0, totalRevenue: 0, conversionRate: '0.0%', commission: 0 },
        currentTier: { rate: 3, label: '¥0 - ¥1,000' },
        nextTier: { rate: 5, needRevenue: 100_000, label: '还需¥1,000 升级到 5%' },
        levelMultiplier: 1.0,
        kolMultiplier: 1.0,
        effectiveRate: 3.0,
        activeCodes: 0,
      }
    }

    const totalScans = dbCodes.reduce((s, c) => s + c.totalScans, 0)
    const totalConversions = dbCodes.reduce((s, c) => s + c.totalConversions, 0)
    const totalRevenue = dbCodes.reduce((s, c) => s + c.totalCommission, 0)
    const conversionRate = totalScans > 0 ? ((totalConversions / totalScans) * 100).toFixed(1) : '0.0'

    const tier = COMMISSION_TIERS.find(
      t => totalRevenue >= t.minRevenue && totalRevenue < t.maxRevenue,
    )
    const nextTier = COMMISSION_TIERS.find(t => t.minRevenue > totalRevenue)

    const referrerLevel = this.getReferrerLevel(referrerId)
    const levelMultiplier = LEVEL_BONUS[referrerLevel] ?? 1.0
    const isKol = dbCodes.some(c => c.type === 'kol')
    const kolMultiplier = isKol ? KOL_COMMISSION_MULTIPLIER : 1.0
    const currentRate = (tier?.rate ?? 3) * levelMultiplier * kolMultiplier
    const commission = Math.floor(totalRevenue * currentRate / 100)

    return {
      referrerId,
      referrerName: dbCodes[0].referrerName,
      type: dbCodes[0].type as ReferrerType,
      level: referrerLevel,
      stats: { totalScans, totalConversions, totalRevenue, conversionRate: `${conversionRate}%`, commission },
      currentTier: {
        rate: tier?.rate ?? 3,
        label: `¥${(tier?.minRevenue ?? 0) / 100} - ¥${(tier?.maxRevenue ?? Infinity) === Infinity ? '∞' : (tier?.maxRevenue ?? 0) / 100}`,
      },
      nextTier: nextTier
        ? { rate: nextTier.rate, needRevenue: nextTier.minRevenue - totalRevenue, label: `还需¥${(nextTier.minRevenue - totalRevenue) / 100} 升级到 ${nextTier.rate}%` }
        : null,
      levelMultiplier, kolMultiplier, effectiveRate: currentRate,
      activeCodes: dbCodes.length,
    }
  }

  // ── 6. 达人专属链接 ──────────────────────────────

  async createKolLink(
    kolId: string, kolName: string,
    platform: 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili',
    storeSlug: string,
  ) {
    const code = await this.createCode({
      type: 'kol', referrerId: kolId, referrerName: kolName,
      storeSlug, channel: platform,
    })

    return {
      kolId, kolName, platform, storeSlug,
      referralCode: code.code,
      trackingUrl: `https://${storeSlug}.shenjiying.com?ref=${code.code}`,
      miniProgramPath: `/pages/store/index?ref=${code.code}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://${storeSlug}.shenjiying.com?ref=${code.code}`)}`,
      commissionNote: `基础佣金${COMMISSION_TIERS[0].rate}%起，累计销售额达标后阶梯提升至${COMMISSION_TIERS[COMMISSION_TIERS.length - 1].rate}%。KOL享受1.5倍系数。`,
    }
  }

  // ── 7. 推广关系管理 ──────────────────────────────

  async getReferralsByCustomer(customerPhone: string): Promise<ReferralRecord | null> {
    const relation = await this.prisma.storefrontReferralRelation.findFirst({
      where: { customerPhone, hasConverted: true },
      orderBy: { scannedAt: 'desc' },
    })
    if (!relation) return null

    const dbCode = await this.prisma.storefrontReferralCode.findUnique({
      where: { id: relation.referralCodeId },
    })

    return {
      id: relation.id,
      code: dbCode?.code ?? 'unknown',
      referrerId: dbCode?.referrerId ?? 'unknown',
      customerPhone,
      storeSlug: dbCode?.storeSlug ?? '',
      scannedAt: relation.scannedAt.toISOString(),
      convertedAt: relation.convertedAt?.toISOString(),
      conversionAmount: relation.orderAmount ?? undefined,
      commissionRate: 0,
      commissionAmount: relation.commissionAmount ?? undefined,
      status: 'converted',
    }
  }

  async removeReferralRelationship(customerPhone: string): Promise<boolean> {
    const deleted = await this.prisma.storefrontReferralRelation.deleteMany({
      where: { customerPhone },
    })

    const removed = deleted.count > 0
    if (removed) {
      this.logger.log(`[Referral] 解除关系: ${customerPhone}`)
    }
    return removed
  }

  // ── 辅助方法 ──────────────────────────────────────

  /**
   * 从缓存获取推广码，miss 时查 DB 并回填缓存
   */
  private async getCodeCacheOrDB(code: string): Promise<ReferralCode | undefined> {
    const cached = this.codeCache.get(code)
    if (cached) return cached

    const dbCode = await this.prisma.storefrontReferralCode.findUnique({ where: { code } })
    if (!dbCode) return undefined

    const rc: ReferralCode = {
      code: dbCode.code,
      type: dbCode.type as ReferrerType,
      referrerId: dbCode.referrerId,
      referrerName: dbCode.referrerName,
      storeSlug: dbCode.storeSlug,
      channel: dbCode.channel as ReferralChannel,
      createdAt: dbCode.createdAt.toISOString(),
      totalScans: dbCode.totalScans,
      totalConversions: dbCode.totalConversions,
      totalRevenue: dbCode.totalCommission,
    }
    this.codeCache.set(code, rc)
    return rc
  }

  private getReferrerLevel(referrerId: string): string {
    if (referrerId.startsWith('KOL')) return 'SVIP'
    if (referrerId.startsWith('EMP001')) return '王者'
    if (referrerId.startsWith('CUST')) return '钻石'
    return '青铜'
  }

  private grantGrowthValue(userId: string, amount: number, reason: string) {
    this.logger.log(`[Growth] ${userId} +${amount} 成长值 · ${reason}`)
  }
}
