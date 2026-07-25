// referral-tracking.service.ts · 全员营销 & KOL 推广追踪引擎
// Phase 2B 社媒增长引擎 · 2026-07-26
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
//
// 职责:
//  - 推广码生成（门店/员工/KOL 三种类型）
//  - 扫码归因追踪（无感，自动记录推广关系）
//  - 佣金计算（阶梯制 + 等级加成）
//  - 排行榜（日/周/月/季度 四维度）
//  - 达人专属链接 + KOL佣金归因

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
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
  referrerId: string // 推广人ID (员工工号/KOL_ID/用户ID)
  referrerName: string
  storeSlug: string
  channel: ReferralChannel
  createdAt: string
  totalScans: number
  totalConversions: number
  totalRevenue: number // 分
}

export interface ReferralRecord {
  id: string
  code: string
  referrerId: string
  customerPhone: string
  storeSlug: string
  scannedAt: string
  convertedAt?: string
  conversionAmount?: number // 分
  commissionRate: number // 百分比
  commissionAmount?: number // 分
  status: 'scanned' | 'converted' | 'cancelled'
}

export interface CommissionTier {
  minRevenue: number // 累计销售额(分)
  maxRevenue: number
  rate: number // 佣金比例(%)
}

export interface LeaderboardEntry {
  rank: number
  referrerId: string
  referrerName: string
  type: ReferrerType
  scans: number
  conversions: number
  revenue: number // 分
  commission: number // 分
  trend: 'up' | 'down' | 'stable'
}

// ══════════════════════════════════════════════════════
// 佣金阶梯 (宪法§13.5)
// ══════════════════════════════════════════════════════

const COMMISSION_TIERS: CommissionTier[] = [
  { minRevenue: 0, maxRevenue: 100000, rate: 3 },       // 0-1000元: 3%
  { minRevenue: 100000, maxRevenue: 500000, rate: 5 },   // 1000-5000元: 5%
  { minRevenue: 500000, maxRevenue: 2000000, rate: 8 },  // 5000-20000元: 8%
  { minRevenue: 2000000, maxRevenue: Infinity, rate: 12 }, // 20000+: 12%
]

// 等级佣金加成 (宪法§13.5 会员等级加成)
const LEVEL_BONUS: Record<string, number> = {
  '青铜': 1.0, '白银': 1.0, '黄金': 1.1, '铂金': 1.2,
  '钻石': 1.3, '王者': 1.5, 'SVIP': 2.0,
}

// KOL 类型 (比员工基础佣金高)
const KOL_COMMISSION_MULTIPLIER = 1.5 // KOL佣金是员工基础佣金的1.5倍
const CUSTOMER_REFERRAL_BONUS = 50 // 老客推荐新客双方各得50成长值

// ══════════════════════════════════════════════════════
// Service
// ══════════════════════════════════════════════════════

@Injectable()
export class ReferralTrackingService {
  private readonly logger = new Logger(ReferralTrackingService.name)

  // Mock stores
  private readonly codes = new Map<string, ReferralCode>()
  private readonly records: ReferralRecord[] = []
  private readonly referrerRevenue = new Map<string, number>() // referrerId → totalRevenue

  constructor(
    private readonly prisma: PrismaService,
  ) {
    // 种子数据：预置一些推广码
    this.createCode({
      type: 'employee', referrerId: 'EMP001', referrerName: '小陈·朝阳店店长',
      storeSlug: 'beijing-chaoyang', channel: 'wechat',
    })
    this.createCode({
      type: 'kol', referrerId: 'KOL001', referrerName: '@电竞阿杰(抖音50w粉)',
      storeSlug: 'beijing-chaoyang', channel: 'douyin',
    })
    this.createCode({
      type: 'kol', referrerId: 'KOL002', referrerName: '@亲子玩乐日记(小红书30w粉)',
      storeSlug: 'beijing-chaoyang', channel: 'xiaohongshu',
    })
    this.createCode({
      type: 'customer', referrerId: 'CUST001', referrerName: '老客户·运动达人小王',
      storeSlug: 'beijing-chaoyang', channel: 'wechat',
    })
  }

  // ── 1. 创建推广码 ─────────────────────────────────

  createCode(params: {
    type: ReferrerType; referrerId: string; referrerName: string
    storeSlug: string; channel: ReferralChannel
  }): ReferralCode {
    const code = `REF-${params.type.slice(0, 4).toUpperCase()}-${params.referrerId}-${randomUUID().slice(0, 6)}`
    const referralCode: ReferralCode = {
      code,
      type: params.type,
      referrerId: params.referrerId,
      referrerName: params.referrerName,
      storeSlug: params.storeSlug,
      channel: params.channel,
      createdAt: new Date().toISOString(),
      totalScans: 0,
      totalConversions: 0,
      totalRevenue: 0,
    }
    this.codes.set(code, referralCode)

    // BL-6: Prisma 持久化推广码
    this.prisma.storefrontReferralCode.create({
      data: {
        code, type: params.type, tenantId: 'tenant-default',
        referrerId: params.referrerId, referrerName: params.referrerName,
        storeSlug: params.storeSlug, channel: params.channel as string,
      },
    }).catch(err => this.logger.warn(`[Referral] DB 写入失败: ${err.message}`))

    this.logger.log(`[Referral] Created ${params.type} code: ${code} → ${params.referrerName}`)
    return referralCode
  }

  // ── 2. 扫码归因（无感追踪） ─────────────────────

  trackScan(code: string, customerPhone: string): ReferralRecord {
    const referralCode = this.codes.get(code)
    if (!referralCode) throw new NotFoundException('推广码无效')

    // 检查是否已被其他人推广过（同一客户只归属于首个推广人）
    const existing = this.records.find(
      r => r.customerPhone === customerPhone && r.status === 'converted',
    )
    if (existing) {
      this.logger.log(`[Referral] ${customerPhone} 已有推广关系 → ${existing.referrerId}，跳过`)
      return existing
    }

    referralCode.totalScans++

    const record: ReferralRecord = {
      id: `ref-${Date.now()}-${randomUUID().slice(0, 6)}`,
      code, referrerId: referralCode.referrerId,
      customerPhone, storeSlug: referralCode.storeSlug,
      scannedAt: new Date().toISOString(),
      commissionRate: 0,
      status: 'scanned',
    }
    this.records.push(record)

    // BL-6: Prisma 持久化推广关系
    this.prisma.storefrontReferralRelation.create({
      data: {
        tenantId: 'tenant-default',
        referralCodeId: code, // SQLite/Postgres — 用 code 查找
        customerPhone,
        hasConverted: false,
      },
    }).catch(err => this.logger.warn(`[Referral] DB 扫描记录写入失败: ${err.message}`))

    // 不发送骚扰通知 — 宪法§13.8
    this.logger.log(`[Referral] ${customerPhone} 扫描了 ${referralCode.referrerName} 的推广码 (无通知)`)
    return record
  }

  // ── 3. 转化追踪（客户完成消费后调用） ─────────

  trackConversion(customerPhone: string, orderAmount: number): ReferralRecord | null {
    const record = this.records.find(
      r => r.customerPhone === customerPhone && r.status === 'scanned',
    )
    if (!record) return null

    const referralCode = this.codes.get(record.code)
    if (!referralCode) return null

    // 计算佣金
    const currentRevenue = this.referrerRevenue.get(record.referrerId) ?? 0
    const totalRevenue = currentRevenue + orderAmount
    this.referrerRevenue.set(record.referrerId, totalRevenue)

    // 阶梯佣金率
    const tier = COMMISSION_TIERS.find(t => totalRevenue >= t.minRevenue && totalRevenue < t.maxRevenue)
    const tierRate = tier?.rate ?? 3

    // 等级加成
    const referrerLevel = this.getReferrerLevel(record.referrerId)
    const levelMultiplier = LEVEL_BONUS[referrerLevel] ?? 1.0

    // KOL加成
    const kolMultiplier = referralCode.type === 'kol' ? KOL_COMMISSION_MULTIPLIER : 1.0

    const finalRate = tierRate * levelMultiplier * kolMultiplier
    const commission = Math.floor(orderAmount * finalRate / 100)

    record.convertedAt = new Date().toISOString()
    record.conversionAmount = orderAmount
    record.commissionRate = finalRate
    record.commissionAmount = commission
    record.status = 'converted'

    referralCode.totalConversions++
    referralCode.totalRevenue += orderAmount

    // 老客推荐 → 双方奖励成长值 (宪法 13.5 社交成长值)
    if (referralCode.type === 'customer') {
      this.grantGrowthValue(record.referrerId, CUSTOMER_REFERRAL_BONUS, '老客推荐奖励')
      this.grantGrowthValue(customerPhone, CUSTOMER_REFERRAL_BONUS, '好友推荐奖励')
    }

    this.logger.log(
      `[Referral Conversion] ${customerPhone} → ${record.referrerId}(${referralCode.type}) ` +
      `订单¥${orderAmount / 100} 佣金¥${commission / 100} (${finalRate.toFixed(1)}%)`,
    )

    // BL-6: 更新 DB 转化状态 + 佣金
    this.prisma.storefrontReferralCode.upsert({
      where: { code: record.code },
      create: {
        code: record.code, type: referralCode.type as string,
        tenantId: 'tenant-default', referrerId: record.referrerId,
        referrerName: referralCode.referrerName, storeSlug: referralCode.storeSlug,
        channel: referralCode.channel as string,
        totalConversions: 1, totalCommission: commission,
        commissionTier: tierRate,
      },
      update: {
        totalConversions: { increment: 1 },
        totalCommission: { increment: commission },
        commissionTier: tierRate,
      },
    }).then(async () => {
      // 更新推广关系，标记已转化
      await this.prisma.storefrontReferralRelation.updateMany({
        where: { customerPhone, hasConverted: false },
        data: { hasConverted: true, orderAmount, commissionAmount: commission, convertedAt: new Date() },
      })
    }).catch(err => this.logger.warn(`[Referral] DB 转化写入失败: ${err.message}`))

    return record
  }

  // ── 4. 排行榜 ─────────────────────────────────────

  getLeaderboard(storeSlug: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): LeaderboardEntry[] {
    const allCodes = Array.from(this.codes.values()).filter(c => c.storeSlug === storeSlug)
    const entries: LeaderboardEntry[] = allCodes.map(c => {
      const prevRevenue = (this.referrerRevenue.get(c.referrerId) ?? 0) - c.totalRevenue
      const trend: 'up' | 'down' | 'stable' = c.totalRevenue > prevRevenue ? 'up' : c.totalRevenue < prevRevenue ? 'down' : 'stable'
      const tier = COMMISSION_TIERS.find(t => c.totalRevenue >= t.minRevenue && c.totalRevenue < t.maxRevenue)
      const rate = (tier?.rate ?? 3) * (c.type === 'kol' ? KOL_COMMISSION_MULTIPLIER : 1.0)
      return {
        rank: 0, referrerId: c.referrerId, referrerName: c.referrerName,
        type: c.type, scans: c.totalScans, conversions: c.totalConversions,
        revenue: c.totalRevenue,
        commission: Math.floor(c.totalRevenue * rate / 100),
        trend,
      }
    })

    // 按转化金额降序
    entries.sort((a, b) => b.revenue - a.revenue)
    entries.forEach((e, i) => { e.rank = i + 1 })

    return entries.slice(0, 100) // Top 100
  }

  // ── 5. 推广者个人面板 ────────────────────────────

  getReferrerDashboard(referrerId: string) {
    const myCodes = Array.from(this.codes.values()).filter(c => c.referrerId === referrerId)
    const totalScans = myCodes.reduce((s, c) => s + c.totalScans, 0)
    const totalConversions = myCodes.reduce((s, c) => s + c.totalConversions, 0)
    const totalRevenue = myCodes.reduce((s, c) => s + c.totalRevenue, 0)
    const conversionRate = totalScans > 0 ? ((totalConversions / totalScans) * 100).toFixed(1) : '0.0'

    // 当前佣金阶梯
    const tier = COMMISSION_TIERS.find(t => totalRevenue >= t.minRevenue && totalRevenue < t.maxRevenue)
    const nextTier = COMMISSION_TIERS.find(t => t.minRevenue > totalRevenue)

    const referrerLevel = this.getReferrerLevel(referrerId)
    const levelMultiplier = LEVEL_BONUS[referrerLevel] ?? 1.0

    // KOL类型判断
    const isKol = myCodes.some(c => c.type === 'kol')
    const kolMultiplier = isKol ? KOL_COMMISSION_MULTIPLIER : 1.0

    const currentRate = (tier?.rate ?? 3) * levelMultiplier * kolMultiplier
    const commission = Math.floor(totalRevenue * currentRate / 100)

    return {
      referrerId,
      referrerName: myCodes[0]?.referrerName ?? referrerId,
      type: myCodes[0]?.type ?? 'employee',
      level: referrerLevel,
      stats: { totalScans, totalConversions, totalRevenue, conversionRate: `${conversionRate}%`, commission },
      currentTier: { rate: tier?.rate ?? 3, label: `¥${(tier?.minRevenue ?? 0) / 100} - ¥${(tier?.maxRevenue ?? Infinity) === Infinity ? '∞' : (tier?.maxRevenue ?? 0) / 100}` },
      nextTier: nextTier ? { rate: nextTier.rate, needRevenue: nextTier.minRevenue - totalRevenue, label: `还需¥${(nextTier.minRevenue - totalRevenue) / 100} 升级到 ${nextTier.rate}%` } : null,
      levelMultiplier, kolMultiplier, effectiveRate: currentRate,
      activeCodes: myCodes.length,
    }
  }

  // ── 6. 达人专属链接生成 ──────────────────────────

  createKolLink(kolId: string, kolName: string, platform: 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili', storeSlug: string) {
    const code = this.createCode({
      type: 'kol', referrerId: kolId, referrerName: kolName,
      storeSlug, channel: platform,
    })
    return {
      kolId, kolName, platform, storeSlug,
      referralCode: code.code,
      // TOC网页挂载链接 — 达人可在其社媒主页/视频下挂载此URL
      trackingUrl: `https://${storeSlug}.shenjiying.com?ref=${code.code}`,
      // 小程序路径
      miniProgramPath: `/pages/store/index?ref=${code.code}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://${storeSlug}.shenjiying.com?ref=${code.code}`)}`,
      // 佣金说明（透明化）
      commissionNote: `基础佣金${COMMISSION_TIERS[0].rate}%起，累计销售额达标后阶梯提升至${COMMISSION_TIERS[COMMISSION_TIERS.length - 1].rate}%。KOL享受1.5倍系数。`,
    }
  }

  // ── 7. 推广关系管理 ──────────────────────────────

  getReferralsByCustomer(customerPhone: string): ReferralRecord | null {
    return this.records.find(r => r.customerPhone === customerPhone && r.status === 'converted') ?? null
  }

  // 解除推广关系（宪法§13.8: 可查可解除）
  removeReferralRelationship(customerPhone: string): boolean {
    const record = this.records.find(r => r.customerPhone === customerPhone && r.status !== 'cancelled')
    if (!record) return false
    record.status = 'cancelled'

    const code = this.codes.get(record.code)
    if (code) {
      code.totalConversions = Math.max(0, code.totalConversions - 1)
      code.totalRevenue = Math.max(0, code.totalRevenue - (record.conversionAmount ?? 0))
    }

    const currentRevenue = this.referrerRevenue.get(record.referrerId) ?? 0
    this.referrerRevenue.set(record.referrerId, Math.max(0, currentRevenue - (record.conversionAmount ?? 0)))

    this.logger.log(`[Referral] 解除关系: ${customerPhone} × ${record.referrerId}`)
    return true
  }

  // ── 辅助方法 ──────────────────────────────────────

  private getReferrerLevel(referrerId: string): string {
    if (referrerId.startsWith('KOL')) return 'SVIP' // KOL按SVIP待遇
    if (referrerId.startsWith('EMP001')) return '王者'
    if (referrerId.startsWith('CUST')) return '钻石'
    return '青铜'
  }

  private grantGrowthValue(userId: string, amount: number, reason: string) {
    // TODO: 接会员引擎 → 增加成长值
    this.logger.log(`[Growth] ${userId} +${amount} 成长值 · ${reason}`)
  }
}
