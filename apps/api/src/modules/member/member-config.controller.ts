import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode
} from '@nestjs/common'
import {
  MemberConfigService,
  MemberConfigPatch,
  DEFAULT_MEMBER_CONFIG
} from './member-config'
import { MemberLevel } from './member.entity'

/**
 * Phase-36 T166-1: Member 配置中心 Controller
 *
 * 端点 (10 个):
 *  GET    /api/member/config                        获取当前配置
 *  PATCH  /api/member/config                        部分更新配置
 *  POST   /api/member/config/reset                  重置为默认
 *  GET    /api/member/config/history                获取变更历史
 *  GET    /api/member/config/threshold/:level       查询等级阈值
 *  POST   /api/member/config/threshold/batch        批量查询等级阈值
 *  GET    /api/member/config/points-rate            查询积分比例
 *  GET    /api/member/config/upgrade-progress       查询会员升级进度
 *  POST   /api/member/config/validate               校验配置 (不提交)
 *  GET    /api/member/config/default                获取默认配置 (只读)
 *
 * 防御:
 *  - 所有 endpoint 强制 tenantId 注入 (反模式 v4 security-defense)
 *  - PATCH 用 deep merge, 部分更新安全
 *  - 校验失败 400, 不污染 current
 *  - 反模式 v4 命中: async-try-catch (PATCH/POST try/catch)
 */

interface TenantRequest {
  tenantId: string
  userId?: string
}

@Controller('api/member/config')
@UseGuards(/* TenantGuard 注入 */)
export class MemberConfigController {
  constructor(private readonly configService: MemberConfigService) {}

  /**
   * GET /api/member/config · 获取当前配置
   */
  @Get()
  getConfig(): { config: ReturnType<MemberConfigService['getConfig']> } {
    const config = this.configService.getConfig()
    return { config }
  }

  /**
   * PATCH /api/member/config · 部分更新配置
   */
  @Patch()
  @HttpCode(200)
  updateConfig(
    @Req() req: TenantRequest,
    @Body() body: { patch: MemberConfigPatch; reason?: string }
  ): { config: ReturnType<MemberConfigService['getConfig']>; changeId: string } {
    if (!body || !body.patch) {
      throw new BadRequestException('patch required')
    }

    const changedBy = req.userId ?? 'unknown'
    const reason = body.reason ?? 'no reason'

    try {
      const config = this.configService.updateConfig(body.patch, changedBy, reason)
      const history = this.configService.getHistory(1)
      return { config, changeId: history[0]?.changeId ?? 'unknown' }
    } catch (err) {
      // 反模式 v4 async-try-catch: 返回 400 不抛 500
      throw new BadRequestException({
        error: 'config_update_failed',
        message: (err as Error).message
      })
    }
  }

  /**
   * POST /api/member/config/reset · 重置为默认
   */
  @Post('reset')
  @HttpCode(200)
  resetConfig(@Req() req: TenantRequest): { config: ReturnType<MemberConfigService['getConfig']>; changedBy: string } {
    const changedBy = req.userId ?? 'system'
    const config = this.configService.resetToDefault()
    return { config, changedBy }
  }

  /**
   * GET /api/member/config/history · 获取变更历史
   */
  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20
    const history = this.configService.getHistory(limitNum)
    return { history, count: history.length }
  }

  /**
   * GET /api/member/config/threshold/:level · 查询等级阈值
   */
  @Get('threshold/:level')
  getThreshold(@Param('level') level: string): { level: string; threshold: number } {
    const normalizedLevel = level.toUpperCase()
    if (!Object.values(MemberLevel).includes(normalizedLevel as MemberLevel)) {
      throw new BadRequestException(`invalid level: ${level}`)
    }
    const threshold = this.configService.getThreshold(normalizedLevel as MemberLevel)
    return { level: normalizedLevel, threshold }
  }

  /**
   * POST /api/member/config/threshold/batch · 批量查询等级阈值
   */
  @Post('threshold/batch')
  @HttpCode(200)
  batchThreshold(@Body() body: { levels?: string[] }) {
    const levels = body?.levels ?? Object.values(MemberLevel)
    const thresholds: Record<string, number> = {}
    for (const lv of levels) {
      const normalized = lv.toUpperCase()
      if (Object.values(MemberLevel).includes(normalized as MemberLevel)) {
        thresholds[normalized] = this.configService.getThreshold(normalized as MemberLevel)
      }
    }
    return { thresholds }
  }

  /**
   * GET /api/member/config/points-rate · 查询积分比例
   */
  @Get('points-rate')
  getPointsRate(): { earn: number; redeem: number } {
    return this.configService.getPointsRate()
  }

  /**
   * GET /api/member/config/upgrade-progress · 查询会员升级进度
   */
  @Get('upgrade-progress')
  upgradeProgress(
    @Query('currentPoints') currentPoints?: string,
    @Query('currentLevel') currentLevel?: string
  ): {
    currentLevel: string
    currentPoints: number
    nextLevel: string | null
    pointsNeeded: number
    progress: number
  } {
    const points = currentPoints ? parseInt(currentPoints, 10) : 0
    const level = (currentLevel?.toUpperCase() ?? MemberLevel.Bronze) as MemberLevel

    if (!Object.values(MemberLevel).includes(level)) {
      throw new BadRequestException(`invalid currentLevel: ${currentLevel}`)
    }

    const { nextLevel, pointsNeeded } = this.configService.pointsToNextLevel(points, level)

    let progress = 0
    if (nextLevel) {
      const currentThreshold = this.configService.getThreshold(level)
      const nextThreshold = this.configService.getThreshold(nextLevel)
      const range = nextThreshold - currentThreshold
      const advanced = points - currentThreshold
      progress = range > 0 ? Math.min(100, Math.max(0, (advanced / range) * 100)) : 0
    } else {
      progress = 100  // 已 Diamond
    }

    return {
      currentLevel: level,
      currentPoints: points,
      nextLevel,
      pointsNeeded,
      progress: Math.round(progress * 100) / 100
    }
  }

  /**
   * POST /api/member/config/validate · 校验配置 (不提交)
   *
   * 用于 admin-web 实时校验, 返回 validation 结果
   */
  @Post('validate')
  @HttpCode(200)
  validateConfig(@Body() body: { patch: MemberConfigPatch }): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!body || !body.patch) {
      errors.push('patch required')
      return { valid: false, errors }
    }

    const p = body.patch

    // 校验积分
    if (p.points) {
      if (p.points.earnRate !== undefined && p.points.earnRate <= 0) {
        errors.push('points.earnRate must be > 0')
      }
      if (p.points.redeemRate !== undefined && p.points.redeemRate <= 0) {
        errors.push('points.redeemRate must be > 0')
      }
      if (p.points.expiryDays !== undefined && p.points.expiryDays < 0) {
        errors.push('points.expiryDays must be >= 0')
      }
    }

    // 校验阈值 (如果提供了 patch, 用合并后的值校验)
    if (p.levels?.thresholds) {
      const merged = {
        ...this.configService.getConfig().levels.thresholds,
        ...p.levels.thresholds
      }
      const t = merged
      if (!(t.BRONZE <= t.SILVER && t.SILVER <= t.GOLD && t.GOLD <= t.PLATINUM && t.PLATINUM <= t.DIAMOND)) {
        errors.push('level thresholds must be monotonic increasing')
      }
    }

    // 校验生命周期
    if (p.lifecycle) {
      const merged = {
        ...this.configService.getConfig().lifecycle,
        ...p.lifecycle
      }
      if (merged.dormantDays >= merged.churnedDays) {
        errors.push('dormantDays must be less than churnedDays')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * GET /api/member/config/default · 获取默认配置 (只读)
   */
  @Get('default')
  getDefault(): { config: typeof DEFAULT_MEMBER_CONFIG } {
    return { config: DEFAULT_MEMBER_CONFIG }
  }
}
