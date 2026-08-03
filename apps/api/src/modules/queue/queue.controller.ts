import { Body, Controller, Get, Param, Post, Query, UseGuards, HttpException, HttpStatus, HttpCode } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toQueueEntryContract
} from './queue.contract'
import {
  CallNextDto,
  JoinQueueDto,
  QueueQueryDto,
  JoinByChannelDto
} from './queue.dto'
import { QueueChannel, QueueSource } from './queue.entity'
import { QueueService } from './queue.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('queue')
@UseGuards(TenantGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('join')
  joinQueue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: JoinQueueDto
  ) {
    const entry = this.queueService.joinQueue({
      tenantId: tenantContext.tenantId,
      queueType: body.queueType,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      memberId: body.memberId,
      memberName: body.memberName,
      priority: body.priority,
      remark: body.remark,
      source: body.source ?? QueueSource.Onsite,
      channel: body.channel ?? QueueChannel.Terminal
    })
    return toQueueEntryContract(entry)
  }

  @Post(':entryId/leave')
  leaveQueue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('entryId') entryId: string
  ) {
    const entry = this.queueService.leaveQueue(entryId, tenantContext.tenantId)
    return toQueueEntryContract(entry)
  }

  @Post('call-next')
  callNext(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CallNextDto
  ) {
    const entry = this.queueService.callNext(
      body.resourceId,
      tenantContext.tenantId
    )
    return entry ? toQueueEntryContract(entry) : null
  }

  @Post(':entryId/start-service')
  startService(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('entryId') entryId: string
  ) {
    const entry = this.queueService.startService(entryId, tenantContext.tenantId)
    return toQueueEntryContract(entry)
  }

  @Post(':entryId/complete')
  completeService(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('entryId') entryId: string
  ) {
    const entry = this.queueService.completeService(entryId, tenantContext.tenantId)
    return toQueueEntryContract(entry)
  }

  @Post(':entryId/no-show')
  markNoShow(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('entryId') entryId: string
  ) {
    const entry = this.queueService.markNoShow(entryId, tenantContext.tenantId)
    return toQueueEntryContract(entry)
  }

  @Get('status/:resourceId')
  getQueueStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('resourceId') resourceId: string
  ) {
    return this.queueService.getQueueStatus(resourceId, tenantContext.tenantId)
  }

  @Get('position')
  getMyPosition(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: QueueQueryDto
  ) {
    if (!query.memberId || !query.resourceId) {
      return { position: -1, estimatedWaitMinutes: 0, entry: null }
    }
    return this.queueService.getMyPosition(
      query.memberId,
      query.resourceId,
      tenantContext.tenantId
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // WP-12A: 双模排队 + 微信/App 并行入口
  // ═══════════════════════════════════════════════════════════════════

  /**
   * WP-12A: 微信小程序排队入口
   * POST /queue/wechat/join
   */
  @Post('wechat/join')
  joinWeChatQueue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: JoinByChannelDto
  ) {
    const entry = this.queueService.joinByChannel({
      tenantId: tenantContext.tenantId,
      queueType: body.queueType,
      memberId: body.memberId,
      memberName: body.memberName,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      priority: body.priority,
      remark: body.remark,
      channel: QueueChannel.WeChat
    })
    return toQueueEntryContract(entry)
  }

  /**
   * WP-12A: App排队入口
   * POST /queue/app/join
   */
  @Post('app/join')
  joinAppQueue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: JoinByChannelDto
  ) {
    const entry = this.queueService.joinByChannel({
      tenantId: tenantContext.tenantId,
      queueType: body.queueType,
      memberId: body.memberId,
      memberName: body.memberName,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      priority: body.priority,
      remark: body.remark,
      channel: QueueChannel.App
    })
    return toQueueEntryContract(entry)
  }

  /**
   * WP-12A: Kiosk 自助取号排队入口
   * POST /queue/kiosk/join
   */
  @Post('kiosk/join')
  joinKioskQueue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: JoinByChannelDto
  ) {
    const entry = this.queueService.joinByChannel({
      tenantId: tenantContext.tenantId,
      queueType: body.queueType,
      memberId: body.memberId,
      memberName: body.memberName,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      priority: body.priority,
      remark: body.remark,
      channel: QueueChannel.Kiosk
    })
    return toQueueEntryContract(entry)
  }

  /**
   * WP-12A: 获取双模排队统计
   * GET /queue/dual-mode/stats
   */
  @Get('dual-mode/stats')
  getDualModeStats(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('resourceId') resourceId?: string
  ) {
    return this.queueService.getDualModeStats(tenantContext.tenantId, resourceId)
  }

  /**
   * WP-12A: 获取按来源划分的预估等待时间
   * GET /queue/dual-mode/estimated-wait
   */
  @Get('dual-mode/estimated-wait')
  getEstimatedWait(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('resourceId') resourceId?: string
  ) {
    return this.queueService.getEstimatedWaitBySource(tenantContext.tenantId, resourceId)
  }

  /**
   * WP-12A: 队列状态同步（跨渠道查询）
   * GET /queue/sync-status/:memberId
   */
  @Get('sync-status/:memberId')
  getSyncStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.queueService.getSyncStatus(memberId, tenantContext.tenantId)
  }

  /**
   * WP-12A: 转换排队入口（线上→现场 / 现场→线上）
   * POST /queue/:entryId/transfer
   */
  @Post(':entryId/transfer')
  transferEntry(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('entryId') entryId: string,
    @Body('targetSource') targetSource: string
  ) {
    if (!targetSource || !Object.values(QueueSource).includes(targetSource as QueueSource)) {
      throw new HttpException(
        `Invalid targetSource: must be one of ${Object.values(QueueSource).join(', ')}`,
        HttpStatus.BAD_REQUEST
      )
    }
    const entry = this.queueService.transferEntry(
      entryId,
      tenantContext.tenantId,
      targetSource as QueueSource
    )
    return toQueueEntryContract(entry)
  }

  /**
   * WP-12A: 按来源查询队列
   * GET /queue/dual-mode/by-source?source=online|onsite
   */
  @Get('dual-mode/by-source')
  getQueueBySource(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('source') source: string,
    @Query('resourceId') resourceId?: string
  ) {
    if (!source || !Object.values(QueueSource).includes(source as QueueSource)) {
      throw new HttpException(
        `Invalid source: must be one of ${Object.values(QueueSource).join(', ')}`,
        HttpStatus.BAD_REQUEST
      )
    }
    return this.queueService.getQueueBySource(
      tenantContext.tenantId,
      source as QueueSource,
      resourceId
    )
  }

  /**
   * BS-0295: GET /queue/capacity
   * 获取系统容量/负载状态，取号时检测是否繁忙
   */
  @Get('capacity')
  getCapacity(
    @TenantContext() tenantContext: RequestTenantContext,
  ) {
    const status = this.queueService.getCapacityStatus(tenantContext.tenantId)
    if (status.isBusy) {
      throw new HttpException(status, HttpStatus.SERVICE_UNAVAILABLE)
    }
    return status
  }
}
