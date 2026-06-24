import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toQueueEntryContract
} from './queue.contract'
import { CallNextDto, JoinQueueDto, QueueQueryDto } from './queue.dto'
import { QueueService } from './queue.service'

@Controller('queue')
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
      remark: body.remark
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
}
