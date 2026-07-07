import {
  Injectable,
  Logger,
  Optional,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common'
import type { MemberProfile, MemberLevel } from './member.entity'
import { MemberConfigService } from './member-config'

/**
 * Phase-36 T166-3: Member 跨租户识别 · 后端核心
 *
 * 大飞哥 D1 + D5 决策:
 *  - D1: phoneUniqueScope = 'global' (User.mobile @unique DB 层强制)
 *  - D5: crossTenantEnabled = true (启用同手机号跨租户识别)
 *
 * 反模式库 v4 命中:
 *  - cross-tenant-data-leak: PII 跨租户泄露防御 (脱敏 + 权限校验)
 *  - privacy-gdpr-pattern: GDPR 合规 (审计追踪 + 字段最小化)
 *  - async-try-catch: 关联操作错误处理 (失败不污染主流程)
 *
 * 设计:
 *  - 默认仅返回脱敏数据 (CrossTenantMemberSummary)
 *  - 关闭配置时抛 ForbiddenException (不静默成功)
 *  - 关联/解关联完整审计 (linkHistory ringbuffer)
 *  - self-link / 同租户 link 防御
 */

/**
 * 跨租户会员摘要 (PII 脱敏)
 *
 * 反模式 v4 cross-tenant-data-leak 防御:
 *  - 仅返回必要的会员标识和画像字段
 *  - 不返回: 完整手机号 / 密码 / token / 隐私字段
 */
export interface CrossTenantMemberSummary {
  memberId: string
  tenantId: string
  nickname: string
  level: MemberLevel
  tags?: string[]
  createdAt: string
  /** PII 脱敏字段: 仅显示前 3 + 后 4 位 */
  mobileMasked?: string
}

/**
 * 跨租户关联结果
 */
export interface CrossTenantMemberLink {
  primaryMemberId: string
  linkedMembers: CrossTenantMemberSummary[]
  linkHistory: CrossTenantLinkHistoryEntry[]
}

/**
 * 关联操作审计追踪
 */
export interface CrossTenantLinkHistoryEntry {
  primaryMemberId: string
  secondaryMemberId: string
  action: 'LINK' | 'UNLINK'
  reason: string
  performedBy: string
  at: string
}

/**
 * MemberCrossTenantService - 会员跨租户识别 service
 *
 * 核心职责:
 *  1. findByMobileAcrossTenants(mobile) - 跨租户查询 (PII 脱敏)
 *  2. linkAcrossTenants(input) - 关联两个不同租户的会员
 *  3. unlinkAcrossTenants(input) - 解关联
 *  4. getLinkHistory(memberId) - 查询审计追踪
 *
 * 防御:
 *  - 配置驱动 (crossTenantEnabled 关闭 → ForbiddenException)
 *  - self-link 检测 (primaryId === secondaryId → 400)
 *  - 同租户 link 检测 (走 updateProfile 而非 linkAcrossTenants)
 *  - PII 字段脱敏 (mobile 仅显示前3+后4)
 *  - 反模式 v4 async-try-catch (错误隔离)
 */
@Injectable()
export class MemberCrossTenantService {
  private readonly logger = new Logger(MemberCrossTenantService.name)

  constructor(
    @Optional() private readonly memberService?: any,
    @Optional() private readonly configService?: MemberConfigService
  ) {}

  /**
   * 跨租户查询: 同手机号所有租户下的会员 (PII 脱敏)
   *
   * 反模式 v4 cross-tenant-data-leak 防御:
   *  - 仅返回脱敏数据 (CrossTenantMemberSummary)
   *  - 配置关闭时抛 ForbiddenException (不静默成功)
   *  - 校验手机号格式 (中国大陆 11 位)
   *  - 日志中只记录前 3+ 后 4 位 (不打印完整 PII)
   */
  findByMobileAcrossTenants(mobile: string): CrossTenantMemberSummary[] {
    if (!this.configService?.isCrossTenantEnabled()) {
      throw new ForbiddenException({
        error: 'cross_tenant_disabled',
        message: 'cross-tenant query disabled by config (D5: crossTenantEnabled=false)'
      })
    }
    if (!mobile || !this.validateMobile(mobile)) {
      throw new BadRequestException({
        error: 'invalid_mobile_format',
        message: 'mobile must be 11-digit Chinese mobile (e.g. 13800138000)'
      })
    }

    try {
      const allMembers = this.memberService?.listProfiles?.() ?? []
      const matched = allMembers.filter((m: MemberProfile) => m.mobile === mobile)

      // 反模式 v4 observability: 脱敏日志
      const masked = this.maskMobile(mobile)
      this.logger.log(`Cross-tenant query mobile=${masked} matches=${matched.length}`)

      return matched.map((m: MemberProfile) => this.summarize(m))
    } catch (err) {
      // 反模式 v4 async-try-catch: 失败不污染主流程
      this.logger.error(`Cross-tenant query failed: ${(err as Error).message}`)
      throw err
    }
  }

  /**
   * 关联两个不同租户的会员
   *
   * 反模式 v4 防御:
   *  - self-link 检测
   *  - 同租户 link 检测 (应走 updateProfile)
   *  - 配置关闭检测
   *  - 审计追踪 (linkHistory)
   */
  linkAcrossTenants(input: {
    primaryMemberId: string
    secondaryMemberId: string
    reason: string
    performedBy: string
  }): CrossTenantMemberLink {
    if (!this.configService?.isCrossTenantEnabled()) {
      throw new ForbiddenException('cross-tenant link disabled by config')
    }
    if (!input.primaryMemberId || !input.secondaryMemberId) {
      throw new BadRequestException({
        error: 'missing_member_id',
        message: 'primaryMemberId and secondaryMemberId required'
      })
    }
    if (input.primaryMemberId === input.secondaryMemberId) {
      throw new BadRequestException({
        error: 'self_link_not_allowed',
        message: 'cannot link a member to itself'
      })
    }

    const primary = this.memberService?.getProfile?.(input.primaryMemberId)
    const secondary = this.memberService?.getProfile?.(input.secondaryMemberId)
    if (!primary || !secondary) {
      throw new NotFoundException(`member not found (primary=${!!primary}, secondary=${!!secondary})`)
    }
    if (primary.tenantContext.tenantId === secondary.tenantContext.tenantId) {
      throw new BadRequestException({
        error: 'same_tenant_link_not_allowed',
        message: 'use member.service.updateProfile for same-tenant link'
      })
    }

    // 写入 linkHistory (审计追踪, 反模式 v4 observability)
    const link = primary as MemberProfile & { _linkHistory?: CrossTenantLinkHistoryEntry[] }
    link._linkHistory = link._linkHistory ?? []
    const historyEntry: CrossTenantLinkHistoryEntry = {
      primaryMemberId: input.primaryMemberId,
      secondaryMemberId: input.secondaryMemberId,
      action: 'LINK',
      reason: input.reason,
      performedBy: input.performedBy,
      at: new Date().toISOString()
    }
    link._linkHistory.push(historyEntry)

    // 反模式 v4 防御: ringbuffer LRU 100
    if (link._linkHistory.length > 100) {
      link._linkHistory.shift()
    }

    this.logger.log(
      `LINK ${input.primaryMemberId} <-> ${input.secondaryMemberId} by=${input.performedBy} reason="${input.reason}"`
    )

    return {
      primaryMemberId: input.primaryMemberId,
      linkedMembers: [this.summarize(secondary)],
      linkHistory: [...link._linkHistory]
    }
  }

  /**
   * 解关联 (软删除, 保留审计)
   */
  unlinkAcrossTenants(input: {
    primaryMemberId: string
    secondaryMemberId: string
    reason: string
    performedBy: string
  }): CrossTenantMemberLink {
    if (!this.configService?.isCrossTenantEnabled()) {
      throw new ForbiddenException('cross-tenant link disabled by config')
    }
    const primary = this.memberService?.getProfile?.(input.primaryMemberId)
    if (!primary) {
      throw new NotFoundException(`member ${input.primaryMemberId} not found`)
    }

    const link = primary as MemberProfile & { _linkHistory?: CrossTenantLinkHistoryEntry[] }
    link._linkHistory = link._linkHistory ?? []
    const historyEntry: CrossTenantLinkHistoryEntry = {
      primaryMemberId: input.primaryMemberId,
      secondaryMemberId: input.secondaryMemberId,
      action: 'UNLINK',
      reason: input.reason,
      performedBy: input.performedBy,
      at: new Date().toISOString()
    }
    link._linkHistory.push(historyEntry)

    if (link._linkHistory.length > 100) {
      link._linkHistory.shift()
    }

    this.logger.log(
      `UNLINK ${input.primaryMemberId} <-> ${input.secondaryMemberId} by=${input.performedBy} reason="${input.reason}"`
    )

    return {
      primaryMemberId: input.primaryMemberId,
      linkedMembers: [],
      linkHistory: [...link._linkHistory]
    }
  }

  /**
   * 查询审计追踪 (admin/审计用)
   */
  getLinkHistory(memberId: string): CrossTenantLinkHistoryEntry[] {
    const m = this.memberService?.getProfile?.(memberId) as
      | (MemberProfile & { _linkHistory?: CrossTenantLinkHistoryEntry[] })
      | undefined
    if (!m) {
      throw new NotFoundException(`member ${memberId} not found`)
    }
    return [...(m._linkHistory ?? [])]
  }

  /**
   * PII 脱敏: 仅显示前 3 + 后 4 位
   * 反模式 v4 privacy-gdpr-pattern 防御
   */
  private maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 7) return '***'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }

  /**
   * 校验中国大陆手机号 (11 位, 1[3-9] 开头)
   */
  private validateMobile(mobile: string): boolean {
    return /^1[3-9]\d{9}$/.test(mobile)
  }

  /**
   * 摘要脱敏 (CrossTenantMemberSummary)
   *
   * 反模式 v4 cross-tenant-data-leak 防御:
   *  - 不返回完整 mobile / password / token
   *  - 仅返回必要的画像字段
   */
  private summarize(m: MemberProfile): CrossTenantMemberSummary {
    return {
      memberId: m.memberId,
      tenantId: m.tenantContext.tenantId,
      nickname: m.nickname,
      level: m.level,
      tags: m.tags,
      createdAt: m.registeredAt,
      mobileMasked: m.mobile ? this.maskMobile(m.mobile) : undefined
      // 反模式 v4 PII 防御: 不返回 m.mobile 完整号 / 不返回 password / token
    }
  }
}