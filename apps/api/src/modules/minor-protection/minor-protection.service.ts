import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

// ── 类型 ────────────────────────────────────────────────────────────────────

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior'
export type VerificationMethod = 'id_card' | 'face' | 'parental_consent' | 'none'
export type RestrictionType = 'time_limit' | 'spend_limit' | 'content_rating' | 'game_limit' | 'blindbox_limit' | 'chat_limit'

export interface MinorProtectionProfile {
  userId: string; tenantId: string; birthDate: string; age: number; ageGroup: AgeGroup
  ageVerified: boolean; verificationMethod: VerificationMethod; verifiedAt?: Date
  parentalConsentId?: string; dailyTimeLimitMin: number; dailySpendLimit: number
  monthlySpendLimit: number; restrictions: RestrictionType[]
  createdAt: Date; updatedAt: Date
}

export interface ParentalConsent {
  id: string; minorUserId: string; parentUserId: string; parentName: string; parentIdCard: string
  relationship: string; consentType: 'full' | 'partial'; status: 'pending' | 'approved' | 'rejected' | 'revoked'
  effectiveFrom: Date; effectiveTo?: Date; createdAt: Date; updatedAt: Date
}

export interface TimeUsageRecord {
  id: string; userId: string; date: string; totalMinutes: number
  sessions: { start: Date; end: Date; durationMin: number }[]
}

export interface SpendRecord {
  id: string; userId: string; date: string; totalAmount: number; category: string
  items: { description: string; amount: number; timestamp: Date }[]
}

@Injectable()
export class MinorProtectionService {
  private readonly logger = new Logger(MinorProtectionService.name)
  private profiles = new Map<string, MinorProtectionProfile>()
  private consents = new Map<string, ParentalConsent>()
  private timeUsage = new Map<string, TimeUsageRecord>()
  private spendRecords = new Map<string, SpendRecord>()

  // ── 年龄分组 ─────────────────────────────────────────────────────────────

  private getAgeGroup(age: number): AgeGroup {
    if (age < 8) return 'child'
    if (age < 14) return 'child'
    if (age < 18) return 'teen'
    if (age < 60) return 'adult'
    return 'senior'
  }

  private getDefaultLimits(ageGroup: AgeGroup): { dailyTimeLimitMin: number; dailySpendLimit: number; monthlySpendLimit: number } {
    switch (ageGroup) {
      case 'child': return { dailyTimeLimitMin: 40, dailySpendLimit: 50, monthlySpendLimit: 200 }
      case 'teen': return { dailyTimeLimitMin: 90, dailySpendLimit: 200, monthlySpendLimit: 1000 }
      default: return { dailyTimeLimitMin: 0, dailySpendLimit: 0, monthlySpendLimit: 0 }
    }
  }

  // ── 用户注册时触发 ──────────────────────────────────────────────────────

  async registerProfile(userId: string, tenantId: string, birthDate: string, verificationMethod: VerificationMethod = 'none'): Promise<MinorProtectionProfile> {
    const age = this.calculateAge(birthDate)
    const ageGroup = this.getAgeGroup(age)
    const limits = this.getDefaultLimits(ageGroup)
    const profile: MinorProtectionProfile = {
      userId, tenantId, birthDate, age, ageGroup,
      ageVerified: verificationMethod !== 'none',
      verificationMethod,
      dailyTimeLimitMin: limits.dailyTimeLimitMin,
      dailySpendLimit: limits.dailySpendLimit,
      monthlySpendLimit: limits.monthlySpendLimit,
      restrictions: ageGroup === 'child' || ageGroup === 'teen'
        ? ['time_limit', 'spend_limit', 'content_rating', 'game_limit', 'blindbox_limit', 'chat_limit']
        : [],
      createdAt: new Date(), updatedAt: new Date(),
    }
    this.profiles.set(userId, profile)
    this.logger.log(`Minor protection profile created: userId=${userId}, ageGroup=${ageGroup}, age=${age}`)
    return profile
  }

  async getProfile(userId: string): Promise<MinorProtectionProfile> {
    return this.profiles.get(userId) ?? await this.registerProfile(userId, 'default', '2000-01-01', 'none')
  }

  async updateProfile(userId: string, updates: Partial<MinorProtectionProfile>): Promise<MinorProtectionProfile> {
    const profile = await this.getProfile(userId)
    const updated = { ...profile, ...updates, updatedAt: new Date() }
    this.profiles.set(userId, updated)
    return updated
  }

  // ── 年龄验证 ─────────────────────────────────────────────────────────────

  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  async verifyAge(userId: string, method: VerificationMethod): Promise<MinorProtectionProfile> {
    const profile = await this.getProfile(userId)
    const updated = { ...profile, ageVerified: true, verificationMethod: method, verifiedAt: new Date(), updatedAt: new Date() }
    this.profiles.set(userId, updated)
    return updated
  }

  // ── 家长同意书 ───────────────────────────────────────────────────────────

  async createParentalConsent(data: Omit<ParentalConsent, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ParentalConsent> {
    const consent: ParentalConsent = {
      id: `pc-${randomUUID()}`, ...data, status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    }
    this.consents.set(consent.id, consent)
    return consent
  }

  async approveConsent(id: string): Promise<ParentalConsent> {
    const c = this.consents.get(id)
    if (!c) throw new BadRequestException('Consent not found')
    const updated = { ...c, status: 'approved' as const, updatedAt: new Date() }
    this.consents.set(id, updated)
    // 解除未成年人限制
    await this.updateProfile(c.minorUserId, { dailyTimeLimitMin: 0, dailySpendLimit: 0, monthlySpendLimit: 0, restrictions: [], parentalConsentId: id })
    return updated
  }

  async getConsents(minorUserId: string): Promise<ParentalConsent[]> {
    return Array.from(this.consents.values()).filter(c => c.minorUserId === minorUserId)
  }

  // ── 限制检查 ─────────────────────────────────────────────────────────────

  async checkTimeLimit(userId: string, sessionDurationMin: number): Promise<{ allowed: boolean; remainingMinutes: number; reason?: string }> {
    const profile = await this.getProfile(userId)
    if (!profile.restrictions.includes('time_limit')) return { allowed: true, remainingMinutes: -1 }

    const today = new Date().toISOString().slice(0, 10)
    const key = `${userId}:${today}`
    const record = this.timeUsage.get(key)
    const used = record?.totalMinutes ?? 0
    const remaining = profile.dailyTimeLimitMin - used - sessionDurationMin

    if (remaining < 0) {
      return { allowed: false, remainingMinutes: Math.max(0, profile.dailyTimeLimitMin - used), reason: `已达到每日使用时长上限 ${profile.dailyTimeLimitMin} 分钟` }
    }
    return { allowed: true, remainingMinutes: remaining }
  }

  async checkSpendLimit(userId: string, amount: number): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
    const profile = await this.getProfile(userId)
    if (!profile.restrictions.includes('spend_limit')) return { allowed: true, remaining: -1 }

    const today = new Date().toISOString().slice(0, 10)
    const key = `${userId}:${today}`
    const todaySpent = this.spendRecords.get(key)?.totalAmount ?? 0
    if (todaySpent + amount > profile.dailySpendLimit) {
      return { allowed: false, remaining: Math.max(0, profile.dailySpendLimit - todaySpent), reason: `超过每日消费限额 ¥${profile.dailySpendLimit}` }
    }

    const month = new Date().toISOString().slice(0, 7)
    const monthlySpent = Array.from(this.spendRecords.values()).filter(r => r.userId === userId && r.date.startsWith(month)).reduce((s, r) => s + r.totalAmount, 0)
    if (monthlySpent + amount > profile.monthlySpendLimit) {
      return { allowed: false, remaining: Math.max(0, profile.monthlySpendLimit - monthlySpent), reason: `超过每月消费限额 ¥${profile.monthlySpendLimit}` }
    }
    return { allowed: true, remaining: profile.dailySpendLimit - todaySpent - amount }
  }

  async checkBlindboxAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const profile = await this.getProfile(userId)
    if (profile.restrictions.includes('blindbox_limit')) {
      return { allowed: false, reason: '未成年人禁止购买盲盒' }
    }
    return { allowed: true }
  }

  async checkContentRating(userId: string, rating: string): Promise<{ allowed: boolean; reason?: string }> {
    const profile = await this.getProfile(userId)
    if (!profile.restrictions.includes('content_rating')) return { allowed: true }

    const ratingMap: Record<string, number> = { G: 0, PG: 1, PG13: 2, R: 3, NC17: 4 }
    const userMaxRating = profile.ageGroup === 'child' ? 1 : profile.ageGroup === 'teen' ? 2 : 10
    if ((ratingMap[rating] ?? 0) > userMaxRating) {
      return { allowed: false, reason: `内容分级 ${rating} 超出年龄限制` }
    }
    return { allowed: true }
  }

  // ── 使用记录 ─────────────────────────────────────────────────────────────

  async recordTimeUsage(userId: string, sessionDurationMin: number): Promise<TimeUsageRecord> {
    const today = new Date().toISOString().slice(0, 10)
    const key = `${userId}:${today}`
    const existing = this.timeUsage.get(key)
    const session = { start: new Date(Date.now() - sessionDurationMin * 60000), end: new Date(), durationMin: sessionDurationMin }
    const record: TimeUsageRecord = existing
      ? { ...existing, totalMinutes: existing.totalMinutes + sessionDurationMin, sessions: [...existing.sessions, session] }
      : { id: `tu-${randomUUID()}`, userId, date: today, totalMinutes: sessionDurationMin, sessions: [session] }
    this.timeUsage.set(key, record)
    return record
  }

  async recordSpend(userId: string, amount: number, category: string, description: string): Promise<SpendRecord> {
    const today = new Date().toISOString().slice(0, 10)
    const key = `${userId}:${today}`
    const existing = this.spendRecords.get(key)
    const item = { description, amount, timestamp: new Date() }
    const record: SpendRecord = existing
      ? { ...existing, totalAmount: existing.totalAmount + amount, items: [...existing.items, item] }
      : { id: `sr-${randomUUID()}`, userId, date: today, totalAmount: amount, category, items: [item] }
    this.spendRecords.set(key, record)
    return record
  }

  // ── 汇总 ─────────────────────────────────────────────────────────────────

  async getUsageReport(userId: string, startDate: string, endDate: string): Promise<{ totalMinutes: number; totalSpend: number; sessions: number }> {
    const timeRecords = Array.from(this.timeUsage.values()).filter(r => r.userId === userId && r.date >= startDate && r.date <= endDate)
    const spendRecords = Array.from(this.spendRecords.values()).filter(r => r.userId === userId && r.date >= startDate && r.date <= endDate)
    return {
      totalMinutes: timeRecords.reduce((s, r) => s + r.totalMinutes, 0),
      totalSpend: spendRecords.reduce((s, r) => s + r.totalAmount, 0),
      sessions: timeRecords.reduce((s, r) => s + r.sessions.length, 0),
    }
  }
}
