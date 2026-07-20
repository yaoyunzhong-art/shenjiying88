import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toNotificationDispatchContract,
  toNotificationTemplateContract
} from './notification.contract'
import {
  RegisterNotificationTemplateDto,
  SendNotificationDto,
  UpdateNotificationTemplateDto
} from './notification.dto'
import {
  FoundationScopeType,
  NotificationChannelType,
  NotificationStatus
} from './notification.entity'
import { NotificationService } from './notification.service'

@UseGuards(TenantGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ── Template endpoints ──

  @Post('templates')
  registerTemplate(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterNotificationTemplateDto
  ) {
    const template = this.notificationService.registerTemplate({
      code: body.code,
      channel: body.channel,
      scopeType: body.scopeType,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId ?? tenantContext.brandId,
      storeId: body.storeId ?? tenantContext.storeId,
      marketCode: body.marketCode ?? tenantContext.marketCode,
      locale: body.locale,
      titleTemplate: body.titleTemplate,
      bodyTemplate: body.bodyTemplate,
      variables: body.variables,
      enabled: body.enabled
    })
    return toNotificationTemplateContract(template)
  }

  @Get('templates')
  listTemplates(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('channel') channel?: NotificationChannelType,
    @Query('scopeType') scopeType?: FoundationScopeType,
    @Query('enabled') enabled?: string
  ) {
    return this.notificationService
      .listTemplates({
        channel,
        scopeType,
        tenantId: tenantContext.tenantId,
        enabled: enabled !== undefined ? enabled === 'true' : undefined
      })
      .map(toNotificationTemplateContract)
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    const template = this.notificationService.getTemplate(id)
    return template ? toNotificationTemplateContract(template) : null
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() body: UpdateNotificationTemplateDto
  ) {
    const template = this.notificationService.updateTemplate(id, body)
    return template ? toNotificationTemplateContract(template) : null
  }

  // ── Dispatch endpoints ──

  @Post('send')
  send(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SendNotificationDto
  ) {
    const dispatch = this.notificationService.send({
      templateCode: body.templateCode,
      channel: body.channel,
      scopeType: body.scopeType,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId ?? tenantContext.brandId,
      storeId: body.storeId ?? tenantContext.storeId,
      recipient: body.recipient,
      payload: body.payload,
      scheduledAt: body.scheduledAt
    })
    return toNotificationDispatchContract(dispatch)
  }

  @Get('dispatches')
  listDispatches(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('status') status?: NotificationStatus,
    @Query('channel') channel?: NotificationChannelType,
    @Query('recipient') recipient?: string
  ) {
    return this.notificationService
      .listDispatches({
        status,
        channel,
        tenantId: tenantContext.tenantId,
        recipient
      })
      .map(toNotificationDispatchContract)
  }

  @Get('dispatches/:id')
  getDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.getDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }

  @Post('dispatches/:id/retry')
  retryDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.retryDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }

  @Post('dispatches/:id/cancel')
  cancelDispatch(@Param('id') id: string) {
    const dispatch = this.notificationService.cancelDispatch(id)
    return dispatch ? toNotificationDispatchContract(dispatch) : null
  }
}
