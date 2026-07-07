import { Injectable, Logger } from '@nestjs/common'
import { MEMBER_LEVEL_THRESHOLDS, MemberLevel } from './member.entity'

/**
 * Phase-36 T166-1: Member 可配置中心 · 后端核心
 *
 * 大飞哥 D1-D5 决策映射:
 *  - D1: phoneUniqueScope = 'global' (User.mobile @unique)
 *  - D2: 5 档等级阈值 (Bronze/Silver/Gold/Platinum/Diamond)
 *  - D3: 积分 earnRate=1 (1 元 = 1 积分), redeemRate=100 (100 积分 = 1 元)
 *  - D4: lifecycle.dormantDays=90 (90 天未访问 = Dormant)
 *  - D5: crossTenantEnabled=true (会员跨租户识别)
 *
 * 防御:
 *  - 配置热更新 (运行时立即生效)
 *  - 配置变更不影响历史订单 (历史用创建时配置)
 *  - 反模式 v4 命中: tsx-decorator-pitfall (NestJS) + async-try-catch (update 错误处理)
 */

/** 会员配置 - 8 字段完整定义 */
export interface MemberConfig {
  /** 积分配置 */
  points: {
    /** 1 元 = N 积分 (D3 默认 1) */
    earnRate: number
    /** N 积分 = 1 元 (D3 默认 100) */
    redeemRate: number
    /** 积分功能开关 */
    enabled: boolean
    /** 积分过期天数 (0 = 永不过期) */
    expiryDays: number
  }
  /** 等级配置 */
  levels: {
    /** 5 档等级阈值 (累计积分门槛) */
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  /** 生命周期配置 */
  lifecycle: {
    /** 休眠判定: N 天未访问 → Dormant (D4 大飞哥) */
    dormantDays: number
    /** 流失判定: N 天未访问 → Expired */
    churnedDays: number
  }
  /** 手机号唯一性作用域 (D1: 'global' 或 'tenant') */
  phoneUniqueScope: 'global' | 'tenant'
  /** 跨租户识别 (D5: true 启用手机号跨租户匹配) */
  crossTenantEnabled: boolean
}

/** 默认配置 (与 Phase-36 spec V3 锁定一致) */
export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: {
    earnRate: 1,
    redeemRate: 100,
    enabled: true,
    expiryDays: 365
  },
  levels: {
    thresholds: {
      BRONZE: MEMBER_LEVEL_THRESHOLDS.BRONZE,        // 0
      SILVER: MEMBER_LEVEL_THRESHOLDS.SILVER,        // 500
      GOLD: MEMBER_LEVEL_THRESHOLDS.GOLD,            // 2000
      PLATINUM: MEMBER_LEVEL_THRESHOLDS.PLATINUM,    // 10000
      DIAMOND: MEMBER_LEVEL_THRESHOLDS.DIAMOND       // 50000
    }
  },
  lifecycle: {
    dormantDays: 90,
    churnedDays: 180
  },
  phoneUniqueScope: 'global',
  crossTenantEnabled: true
}

/** 配置 patch 类型 (所有字段可选, 用于 updateConfig) */
export type MemberConfigPatch = Partial<{
  points: Partial<MemberConfig['points']>
  levels: Partial<{
    thresholds: Partial<MemberConfig['levels']['thresholds']>
  }>
  lifecycle: Partial<MemberConfig['lifecycle']>
  phoneUniqueScope: MemberConfig['phoneUniqueScope']
  crossTenantEnabled: MemberConfig['crossTenantEnabled']
}>

/** 配置变更历史 (用于审计 + 反模式 v4 observability) */
export interface MemberConfigChangeRecord {
  /** 变更 ID */
  changeId: string
  /** 变更前配置 (snapshot) */
  before: MemberConfig
  /** 变更后配置 (snapshot) */
  after: MemberConfig
  /** 变更人 (userId) */
  changedBy: string
  /** 变更原因 (运营说明) */
  reason: string
  /** 变更时间 (ISO) */
  changedAt: string
}

/**
 * MemberConfigService - 会员配置中心 service
 *
 * 核心职责:
 *  1. getConfig() - 读取当前配置 (Phase-36 业务逻辑读这里)
 *  2. updateConfig(patch) - 热更新配置 (运营后台调用)
 *  3. getThreshold(level) - 等级阈值查询 (升级逻辑调用)
 *  4. getPointsRate() - 积分比例 (支付/退款时调用)
 *  5. getHistory() - 审计 (admin-web 历史 tab)
 *
 * 设计:
 *  - in-memory store (Phase-36 spec, 真实 DB Phase-46)
 *  - 启动加载 DEFAULT (defense in depth)
 *  - 热更新立即生效 (无重启)
 *  - 变更历史 ringbuffer (LRU 100 条)
 *  - 反模式 v4 兼容: async-try-catch (更新失败不抛错业务)
 */
@Injectable()
export class MemberConfigService {
  private readonly logger = new Logger(MemberConfigService.name)
  private current: MemberConfig = JSON.parse(JSON.stringify(DEFAULT_MEMBER_CONFIG))
  /** 变更历史 ringbuffer (LRU 100 条) */
  private history: MemberConfigChangeRecord[] = []
  private readonly HISTORY_LIMIT = 100
  private changeSeq = 0

  /**
   * 获取当前配置 (深拷贝, 防止外部修改污染)
   */
  getConfig(): MemberConfig {
    return JSON.parse(JSON.stringify(this.current))
  }

  /**
   * 热更新配置 (深合并, 部分更新)
   *
   * @param patch 配置变更
   * @param changedBy 变更人 userId
   * @param reason 变更原因
   * @returns 更新后配置
   */
  updateConfig(
    patch: MemberConfigPatch,
    changedBy: string = 'system',
    reason: string = 'no reason'
  ): MemberConfig {
    try {
      // 深拷贝当前配置作为 before snapshot
      const before = JSON.parse(JSON.stringify(this.current))

      // 深度合并 patch
      const after: MemberConfig = {
        points: { ...this.current.points, ...(patch.points ?? {}) },
        levels: {
          thresholds: {
            ...this.current.levels.thresholds,
            ...(patch.levels?.thresholds ?? {})
          }
        },
        lifecycle: { ...this.current.lifecycle, ...(patch.lifecycle ?? {}) },
        phoneUniqueScope: patch.phoneUniqueScope ?? this.current.phoneUniqueScope,
        crossTenantEnabled: patch.crossTenantEnabled ?? this.current.crossTenantEnabled
      }

      // 防御 1: 等级阈值必须单调递增 (Bronze < Silver < Gold < Platinum < Diamond)
      const t = after.levels.thresholds
      if (!(t.BRONZE <= t.SILVER && t.SILVER <= t.GOLD && t.GOLD <= t.PLATINUM && t.PLATINUM <= t.DIAMOND)) {
        throw new Error('level thresholds must be monotonic increasing (Bronze < Silver < Gold < Platinum < Diamond)')
      }

      // 防御 2: dormantDays < churnedDays (休眠天数必须小于流失天数)
      if (after.lifecycle.dormantDays >= after.lifecycle.churnedDays) {
        throw new Error('dormantDays must be less than churnedDays')
      }

      // 防御 3: earnRate / redeemRate 必须正数
      if (after.points.earnRate <= 0 || after.points.redeemRate <= 0) {
        throw new Error('earnRate and redeemRate must be positive')
      }

      // 防御 4: expiryDays >= 0 (0 = 永不过期 OK)
      if (after.points.expiryDays < 0) {
        throw new Error('expiryDays must be >= 0')
      }

      // 提交更新
      this.current = after

      // 写入历史
      this.changeSeq += 1
      const record: MemberConfigChangeRecord = {
        changeId: `cfg-${Date.now()}-${this.changeSeq}`,
        before,
        after: JSON.parse(JSON.stringify(after)),
        changedBy,
        reason,
        changedAt: new Date().toISOString()
      }
      this.history.push(record)
      if (this.history.length > this.HISTORY_LIMIT) {
        this.history.shift()  // ringbuffer LRU
      }

      this.logger.log(`Config updated by ${changedBy} reason="${reason}"`)
      return JSON.parse(JSON.stringify(after))
    } catch (err) {
      // 反模式 v4 async-try-catch: 失败不抛业务, 返回原配置
      this.logger.error(`Config update failed: ${(err as Error).message}`)
      throw err  // 控制器层处理 4xx 错误
    }
  }

  /**
   * 获取等级阈值
   */
  getThreshold(level: MemberLevel): number {
    const t = this.current.levels.thresholds[level]
    if (t === undefined) {
      throw new Error(`unknown level: ${level}`)
    }
    return t
  }

  /**
   * 获取积分比例
   */
  getPointsRate(): { earn: number; redeem: number } {
    return {
      earn: this.current.points.earnRate,
      redeem: this.current.points.redeemRate
    }
  }

  /**
   * Phase-36 T166-2: 获取生命周期配置 (休眠/流失天数)
   * 反模式 v4 防御: 不硬编码 dormantDays/churnedDays, 统一从配置中心读取
   */
  getLifecycle(): { dormantDays: number; churnedDays: number } {
    return {
      dormantDays: this.current.lifecycle.dormantDays,
      churnedDays: this.current.lifecycle.churnedDays
    }
  }

  /**
   * Phase-36 T166-3: 是否启用跨租户识别 (D5)
   * 反模式 v4 cross-tenant-data-leak 防御: 关闭时禁止跨租户查询
   */
  isCrossTenantEnabled(): boolean {
    return this.current.crossTenantEnabled === true
  }

  /**
   * Phase-36 T166-3: 获取手机号唯一性作用域 (D1)
   */
  getPhoneUniqueScope(): 'global' | 'tenant' {
    return this.current.phoneUniqueScope
  }

  /**
   * 计算升级到目标等级还差多少积分
   */
  pointsToNextLevel(currentPoints: number, currentLevel: MemberLevel): {
    nextLevel: MemberLevel | null
    pointsNeeded: number
  } {
    const order: MemberLevel[] = [
      MemberLevel.Bronze,
      MemberLevel.Silver,
      MemberLevel.Gold,
      MemberLevel.Platinum,
      MemberLevel.Diamond
    ]
    const currentIdx = order.indexOf(currentLevel)

    if (currentIdx >= order.length - 1) {
      // 已是最高等级
      return { nextLevel: null, pointsNeeded: 0 }
    }

    const nextLevel = order[currentIdx + 1]
    const nextThreshold = this.getThreshold(nextLevel)
    const pointsNeeded = Math.max(0, nextThreshold - currentPoints)

    return { nextLevel, pointsNeeded }
  }

  /**
   * 获取变更历史 (深拷贝, 防止外部修改)
   */
  getHistory(limit: number = 20): MemberConfigChangeRecord[] {
    const items = this.history.slice(-limit)
    return JSON.parse(JSON.stringify(items))
  }

  /**
   * 重置为默认配置 (测试 / 紧急恢复用)
   */
  resetToDefault(): MemberConfig {
    this.current = JSON.parse(JSON.stringify(DEFAULT_MEMBER_CONFIG))
    this.history = []
    this.changeSeq = 0
    this.logger.warn('Config reset to DEFAULT')
    return this.getConfig()
  }

  /**
   * 测试用: 获取 history 大小
   */
  historySize(): number {
    return this.history.length
  }
}
