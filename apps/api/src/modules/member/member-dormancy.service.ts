import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Optional
} from '@nestjs/common'
import { MemberService } from './member.service'
import { MemberConfigService } from './member-config'
import type { MemberProfile } from './member.entity'

/**
 * Phase-36 T166-2: Member 休眠状态机 · 后端核心
 *
 * 大飞哥 D4 决策:
 *  - 90 天未访问 → Dormant (默认)
 *  - 180 天未访问 → Churned (默认)
 *  - 任何活跃行为触发 → ACTIVE (唤醒)
 *
 * 状态机:
 *   ACTIVE → DORMANT (扫描触发, inactive >= dormantDays)
 *   DORMANT → CHURNED (扫描触发, inactive >= churnedDays)
 *   *  → ACTIVE (手动唤醒 reactivate 或活跃行为)
 *
 * 防御:
 *  - 配置可调 (不硬编码 dormantDays=90, 统一读 MemberConfigService)
 *  - ACTIVE → CHURNED 跳级非法 (必须经过 DORMANT)
 *  - 反模式 v4 命中: cron-job-pitfall (重入锁) + async-try-catch (批量错误处理)
 *  - lifecycleHistory 审计追踪 (反模式 v4 observability)
 */

export enum MemberLifecycleStage {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',
  Churned = 'CHURNED'
}

export interface MemberLifecycleHistoryEntry {
  from: MemberLifecycleStage
  to: MemberLifecycleStage
  at: string
  reason: string
}

/**
 * 扫描结果 (用于 cron + admin 接口)
 */
export interface DormancyScanResult {
  scannedCount: number
  dormantPromoted: number
  churnedPromoted: number
  durationMs: number
  scannedAt: string
  /** 配置快照 (用于审计) */
  configSnapshot: { dormantDays: number; churnedDays: number }
}

/**
 * MemberDormancyService - 会员休眠状态机 service
 *
 * 核心职责:
 *  1. scanAndPromote() - cron 扫描入口 (每 1h)
 *  2. reactivate() - 唤醒 (手动/自动)
 *  3. getLifecycleStage() - 查询当前阶段
 *  4. getStats() - 统计 (active/dormant/churned)
 *
 * 设计:
 *  - 配置可调: 反模式 v4 防御 (不硬编码 dormantDays)
 *  - 状态机: ACTIVE → DORMANT → CHURNED 单向推进
 *  - 唤醒: CHURNED → ACTIVE 仅通过 reactivate (业务可控)
 *  - lifecycleHistory: ringbuffer LRU 50 (审计追踪)
 */
@Injectable()
export class MemberDormancyService {
  private readonly logger = new Logger(MemberDormancyService.name)
  /** 反模式 v4 cron-job-pitfall: in-memory 锁防止重入 (Phase-46 升级为 Redis) */
  private scanInProgress = false

  /**
   * 反模式 v4 防御: 在测试时可注入 mock memberService
   */
  constructor(
    @Optional() private readonly memberService?: MemberService,
    @Optional() private readonly configService?: MemberConfigService
  ) {}

  /**
   * cron 入口: 扫描所有会员并推进 lifecycleStage
   *
   * 反模式 v4 cron-job-pitfall 防御:
   *  - 重入锁: scanInProgress 防止上一轮未跑完下轮触发
   *  - try/catch: 批量错误隔离, 单会员失败不影响其他
   *  - 耗时统计: durationMs 用于监控
   */
  async scanAndPromote(now: Date = new Date()): Promise<DormancyScanResult> {
    const startTime = Date.now()

    // 反模式 v4 防御 1: 重入锁
    if (this.scanInProgress) {
      this.logger.warn('Scan already in progress, skip')
      return {
        scannedCount: 0,
        dormantPromoted: 0,
        churnedPromoted: 0,
        durationMs: 0,
        scannedAt: now.toISOString(),
        configSnapshot: this.configService?.getLifecycle() ?? { dormantDays: 90, churnedDays: 180 }
      }
    }

    this.scanInProgress = true
    let dormantPromoted = 0
    let churnedPromoted = 0

    try {
      // 反模式 v4 防御 2: 配置热读取 (每次扫描前读最新)
      if (!this.configService) {
        this.logger.warn('MemberConfigService not provided, use defaults')
      }
      const { dormantDays, churnedDays } =
        this.configService?.getLifecycle() ?? { dormantDays: 90, churnedDays: 180 }

      const nowMs = now.getTime()
      const dormantThresholdMs = dormantDays * 86400_000
      const churnedThresholdMs = churnedDays * 86400_000

      const allMembers = this.memberService?.listProfiles() ?? []
      const scannedCount = allMembers.length

      for (const m of allMembers) {
        try {
          // 反模式 v4 防御 3: 批量错误隔离
          const lastActiveMs = m.lastActiveAt
            ? new Date(m.lastActiveAt).getTime()
            : new Date(m.registeredAt).getTime()

          const inactiveMs = nowMs - lastActiveMs
          const current = this.getLifecycleStage(m)

          if (current === MemberLifecycleStage.Active && inactiveMs >= dormantThresholdMs) {
            this.transition(m, MemberLifecycleStage.Dormant, `inactive for ${dormantDays} days`)
            dormantPromoted++
          } else if (current === MemberLifecycleStage.Dormant && inactiveMs >= churnedThresholdMs) {
            this.transition(m, MemberLifecycleStage.Churned, `inactive for ${churnedDays} days`)
            churnedPromoted++
          }
        } catch (err) {
          // 单会员错误不影响其他
          this.logger.error(`Failed to process member ${m.memberId}: ${(err as Error).message}`)
        }
      }

      const durationMs = Date.now() - startTime
      this.logger.log(
        `Dormancy scan: ${scannedCount} scanned, ${dormantPromoted}→DORMANT, ${churnedPromoted}→CHURNED, ${durationMs}ms`
      )

      return {
        scannedCount,
        dormantPromoted,
        churnedPromoted,
        durationMs,
        scannedAt: now.toISOString(),
        configSnapshot: { dormantDays, churnedDays }
      }
    } catch (err) {
      this.logger.error(`Scan failed: ${(err as Error).message}`)
      throw err
    } finally {
      this.scanInProgress = false
    }
  }

  /**
   * 唤醒: 任意状态 → ACTIVE
   *
   * 反模式 v4 async-try-catch 防御:
   *  - 失败不抛业务 (controller 转 4xx)
   *  - 记录 lifecycleHistory (审计)
   */
  reactivate(memberId: string, tenantId: string, reason: string = 'manual'): MemberProfile {
    const m = this.memberService?.getProfile(memberId)
    if (!m) {
      throw new NotFoundException(`member ${memberId} not found`)
    }
    if (m.tenantContext.tenantId !== tenantId) {
      throw new BadRequestException({
        error: 'cross_tenant_member_access',
        message: 'member belongs to a different tenant'
      })
    }

    const before = this.getLifecycleStage(m)
    this.transition(m, MemberLifecycleStage.Active, reason)
    m.lastActiveAt = new Date().toISOString()

    this.logger.log(`Member ${memberId} reactivated (${before}→ACTIVE) reason=${reason}`)
    return m
  }

  /**
   * 查询单个会员的 lifecycleStage (默认 ACTIVE)
   */
  getLifecycleStage(m: MemberProfile): MemberLifecycleStage {
    // MemberProfile.lifecycleStage 是运营阶段 (prospect/newly-paid/...), 与活跃度不同
    // 反模式 v4 防御: 不污染既有字段, 单独存
    return (m as MemberProfile & { _lifecycleStage?: MemberLifecycleStage })._lifecycleStage
      ?? MemberLifecycleStage.Active
  }

  /**
   * 统计: 当前 active/dormant/churned 数量
   */
  getStats(tenantId?: string): { active: number; dormant: number; churned: number; total: number } {
    const all = this.memberService?.listProfiles() ?? []
    const filtered = tenantId
      ? all.filter((m) => m.tenantContext.tenantId === tenantId)
      : all

    let active = 0
    let dormant = 0
    let churned = 0
    for (const m of filtered) {
      const stage = this.getLifecycleStage(m)
      if (stage === MemberLifecycleStage.Active) active++
      else if (stage === MemberLifecycleStage.Dormant) dormant++
      else if (stage === MemberLifecycleStage.Churned) churned++
    }
    return { active, dormant, churned, total: filtered.length }
  }

  /**
   * 列出某阶段的会员 (用于 admin-web 列表)
   */
  listByStage(stage: MemberLifecycleStage, tenantId?: string): MemberProfile[] {
    const all = this.memberService?.listProfiles() ?? []
    return all.filter((m) => {
      if (tenantId && m.tenantContext.tenantId !== tenantId) return false
      return this.getLifecycleStage(m) === stage
    })
  }

  /**
   * 状态转换内部方法 (防御非法跳级)
   *
   * 允许的转换:
   *  - ACTIVE → DORMANT (cron 扫描)
   *  - DORMANT → CHURNED (cron 扫描)
   *  - DORMANT → ACTIVE (reactivate)
   *  - CHURNED → ACTIVE (reactivate, 召回)
   *  - ACTIVE → ACTIVE (no-op)
   *
   * 禁止:
   *  - ACTIVE → CHURNED (跳级, 必须经过 DORMANT)
   *  - 任何 → DORMANT/CHURNED (仅 cron 可触发)
   */
  private transition(
    m: MemberProfile,
    to: MemberLifecycleStage,
    reason: string
  ): void {
    const from = this.getLifecycleStage(m)

    if (from === to) return  // no-op

    // 反模式 v4 防御: 跳级非法
    if (from === MemberLifecycleStage.Active && to === MemberLifecycleStage.Churned) {
      throw new BadRequestException({
        error: 'lifecycle_skip_not_allowed',
        message: 'cannot skip DORMANT stage (ACTIVE → CHURNED)',
        from,
        to
      })
    }

    // 写入 _lifecycleStage (扩展字段, 不污染 MemberProfile.lifecycleStage 业务语义)
    const ext = m as MemberProfile & {
      _lifecycleStage?: MemberLifecycleStage
      _lifecycleStageChangedAt?: string
      _lifecycleHistory?: MemberLifecycleHistoryEntry[]
    }
    ext._lifecycleStage = to
    ext._lifecycleStageChangedAt = new Date().toISOString()
    ext._lifecycleHistory = ext._lifecycleHistory ?? []
    ext._lifecycleHistory.push({
      from,
      to,
      at: ext._lifecycleStageChangedAt,
      reason
    })

    // 反模式 v4 observability: ringbuffer LRU 50
    if (ext._lifecycleHistory.length > 50) {
      ext._lifecycleHistory.shift()
    }

    this.logger.debug(`Member ${m.memberId} lifecycle ${from}→${to} reason=${reason}`)
  }

  /**
   * 注入 lastActiveAt (测试辅助 + 业务可调)
   * 反模式 v4 防御: 集中处理 lastActiveAt 更新, 业务代码不直接改
   */
  recordActivity(m: MemberProfile, at: Date = new Date()): void {
    m.lastActiveAt = at.toISOString()
    // 活跃行为自动唤醒 (CHURNED 也可召回)
    const current = this.getLifecycleStage(m)
    if (current !== MemberLifecycleStage.Active) {
      this.transition(m, MemberLifecycleStage.Active, 'activity recorded')
    }
  }
}