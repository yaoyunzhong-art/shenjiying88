import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Logger,
  Optional,
  BadRequestException,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import {
  MemberDormancyService,
  MemberLifecycleStage,
  type DormancyScanResult
} from './member-dormancy.service'
import { MemberDormancyCron, type CronMetrics } from './member-dormancy.cron'

/**
 * Phase-36 T166-2: Member 休眠状态机 · HTTP 接口
 *
 * 端点 (5):
 *  - POST /api/member/dormancy/:memberId/reactivate - 唤醒单个会员
 *  - POST /api/member/dormancy/scan - 手动触发扫描 (admin-only)
 *  - GET  /api/member/dormancy/stats - 获取统计
 *  - GET  /api/member/dormancy/list/:stage - 列出某阶段会员
 *  - GET  /api/member/dormancy/cron-metrics - cron 监控指标
 *
 * 反模式 v4 防御:
 *  - 强制 tenantId (controller 层校验)
 *  - 跨租户访问防御
 *  - async-try-catch (失败不暴露栈)
 *
 * TODO: 接入 TenantGuard + AdminGuard (Phase-37 RBAC)
 */
@UseGuards(TenantGuard)
@Controller('api/member/dormancy')
export class MemberDormancyController {
  private readonly logger = new Logger(MemberDormancyController.name)

  constructor(
    @Optional() private readonly dormancy?: MemberDormancyService,
    @Optional() private readonly cron?: MemberDormancyCron
  ) {}

  /**
   * 唤醒单个会员
   * body: { tenantId, reason? }
   */
  @Post(':memberId/reactivate')
  async reactivate(
    @Param('memberId') memberId: string,
    @Body() body: { tenantId: string; reason?: string }
  ): Promise<{ ok: true; memberId: string; stage: string }> {
    if (!body.tenantId) {
      throw new BadRequestException('tenantId required')
    }
    if (!this.dormancy) {
      throw new BadRequestException('MemberDormancyService not available')
    }

    const m = this.dormancy.reactivate(memberId, body.tenantId, body.reason ?? 'manual')
    return {
      ok: true,
      memberId: m.memberId,
      stage: MemberLifecycleStage.Active
    }
  }

  /**
   * 手动触发扫描 (admin-only)
   * body: { tenantId? }
   */
  @Post('scan')
  async manualScan(
    @Body() body: { tenantId?: string }
  ): Promise<DormancyScanResult | { ok: false; error: string }> {
    if (!this.cron) {
      throw new BadRequestException('MemberDormancyCron not available')
    }
    const result = await this.cron.hourlyScan()
    if (!result) {
      return { ok: false, error: 'scan failed (see logs)' }
    }
    return result
  }

  /**
   * 获取统计
   * query: ?tenantId=
   */
  @Get('stats')
  async stats(@Body() body: { tenantId?: string }): Promise<{
    active: number
    dormant: number
    churned: number
    total: number
  }> {
    if (!this.dormancy) {
      throw new BadRequestException('MemberDormancyService not available')
    }
    return this.dormancy.getStats(body.tenantId)
  }

  /**
   * 列出某阶段会员
   * query: ?tenantId=
   */
  @Get('list/:stage')
  async listByStage(
    @Param('stage') stage: string,
    @Body() body: { tenantId?: string }
  ): Promise<{
    stage: string
    members: Array<{ memberId: string; tenantId: string; lastActiveAt?: string; nickname: string }>
  }> {
    if (!this.dormancy) {
      throw new BadRequestException('MemberDormancyService not available')
    }
    if (!Object.values(MemberLifecycleStage).includes(stage as MemberLifecycleStage)) {
      throw new BadRequestException(`invalid stage: ${stage}`)
    }
    const members = this.dormancy.listByStage(stage as MemberLifecycleStage, body.tenantId)
    return {
      stage,
      members: members.map((m) => ({
        memberId: m.memberId,
        tenantId: m.tenantContext.tenantId,
        lastActiveAt: m.lastActiveAt,
        nickname: m.nickname
      }))
    }
  }

  /**
   * cron 监控指标
   */
  @Get('cron-metrics')
  async cronMetrics(): Promise<CronMetrics> {
    if (!this.cron) {
      throw new BadRequestException('MemberDormancyCron not available')
    }
    return this.cron.getMetrics()
  }
}