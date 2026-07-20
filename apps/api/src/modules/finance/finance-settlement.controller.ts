/**
 * finance-settlement.controller.ts — P-38 100% 结算自动化 REST API
 *
 * 路由:
 *   POST   /api/finance/settlement/run              — 手动触发结算
 *   GET    /api/finance/settlement/history          — 结算历史
 *   GET    /api/finance/settlement/notifications    — 结算通知列表
 *   POST   /api/finance/settlement/notifications/ack— 标记通知已读
 *   POST   /api/finance/settlement/notifications/ack-all — 全部已读
 *   GET    /api/finance/settlement/metrics          — 结算指标
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Logger,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceSettlementCron, type SettlementPeriodicity } from './finance-settlement.cron'

// ─── DTO ──────────────────────────────────────────────────

export class RunSettlementDto {
  declare periodicity?: SettlementPeriodicity
}

export class AcknowledgeNotificationDto {
  declare id: string
}

// ─── Controller ──────────────────────────────────────────

@UseGuards(TenantGuard)
@Controller('finance/settlement')
export class FinanceSettlementController {
  private readonly logger = new Logger(FinanceSettlementController.name)

  constructor(private readonly settlementCron: FinanceSettlementCron) {}

  /**
   * POST /api/finance/settlement/run
   * 手动触发结算
   */
  @Post('run')
  async run(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Body() body: RunSettlementDto
  ) {
    const results = await this.settlementCron.runPeriodic({
      periodicity: body.periodicity
    })

    return {
      success: true,
      data: {
        results,
        completed: results.filter((r) => r.status === 'completed').length,
        failed: results.filter((r) => r.status === 'failed').length
      },
      message: `Settlement completed: ${results.length} tasks`
    }
  }

  /**
   * GET /api/finance/settlement/history
   * 结算历史
   */
  @Get('history')
  getHistory(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Query('limit') limit?: string
  ) {
    const history = this.settlementCron.getHistory(limit ? parseInt(limit, 10) : 20)
    return {
      success: true,
      data: { history, total: history.length },
      message: 'OK'
    }
  }

  /**
   * GET /api/finance/settlement/notifications
   * 结算通知
   */
  @Get('notifications')
  getNotifications(
    @TenantContext() _tenantContext: RequestTenantContext
  ) {
    const unacknowledged = this.settlementCron.getUnacknowledgedNotifications()
    return {
      success: true,
      data: {
        notifications: unacknowledged,
        unreadCount: unacknowledged.length
      },
      message: 'OK'
    }
  }

  /**
   * POST /api/finance/settlement/notifications/ack
   * 标记通知已读
   */
  @Post('notifications/ack')
  acknowledgeNotification(
    @TenantContext() _tenantContext: RequestTenantContext,
    @Body() body: AcknowledgeNotificationDto
  ) {
    const result = this.settlementCron.acknowledgeNotification(body.id)
    return {
      success: true,
      data: { acknowledged: result },
      message: result ? 'Notification acknowledged' : 'Notification not found'
    }
  }

  /**
   * POST /api/finance/settlement/notifications/ack-all
   * 全部已读
   */
  @Post('notifications/ack-all')
  acknowledgeAll(
    @TenantContext() _tenantContext: RequestTenantContext
  ) {
    const count = this.settlementCron.acknowledgeAll()
    return {
      success: true,
      data: { acknowledgedCount: count },
      message: `Acknowledged ${count} notifications`
    }
  }

  /**
   * GET /api/finance/settlement/metrics
   * 结算指标
   */
  @Get('metrics')
  getMetrics(
    @TenantContext() _tenantContext: RequestTenantContext
  ) {
    const metrics = this.settlementCron.getMetrics()
    return {
      success: true,
      data: metrics,
      message: 'OK'
    }
  }
}
