/**
 * Phase 95 Webhook Controller (V10 Sprint 2 Day 19)
 *
 * 对齐 WebhookService 的简单 API:
 *   registerEndpoint / updateEndpoint / deleteEndpoint / listEndpoints / getById
 *   emit / getDeliveryLogs
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { WebhookService } from './webhook.service'
import {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookRequest,
} from './webhook.dto'
import { BUILTIN_WEBHOOK_EVENTS, type WebhookEventType } from './webhook.entity'
import { webhookEventBus } from './webhook.eventbus'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('webhook')
@UseGuards(TenantGuard)
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @Post('endpoints')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateWebhookRequest) {
    // 服务层 WebhookEventType 是更窄的子集, 强转以兼容 DTO.
    return this.service.registerEndpoint(
      body.url,
      body.secret,
      body.events as unknown as Parameters<WebhookService['registerEndpoint']>[2],
    )
  }

  @Get('endpoints')
  async list() {
    return this.service.listEndpoints()
  }

  @Get('endpoints/:id')
  async getById(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Patch('endpoints/:id')
  async update(@Param('id') id: string, @Body() body: UpdateWebhookRequest) {
    return this.service.updateEndpoint(
      id,
      body as unknown as Parameters<WebhookService['updateEndpoint']>[1],
    )
  }

  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.service.deleteEndpoint(id)
  }

  @Post('endpoints/:id/test')
  @HttpCode(HttpStatus.OK)
  async test(@Param('id') id: string, @Body() body: TestWebhookRequest) {
    const endpoint = await this.service.getById(id)
    if (!endpoint) {
      return { error: 'endpoint not found', id }
    }
    await this.service.emit(
      body.eventType as unknown as Parameters<WebhookService['emit']>[0],
      body.customPayload ?? {},
    )
    return { emitted: true, endpointId: id, eventType: body.eventType }
  }

  @Get('endpoints/:id/deliveries')
  async listDeliveries(
    @Param('id') endpointId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getDeliveryLogs(endpointId, limit ? Number(limit) : 50)
  }

  @Get('events')
  async getEvents() {
    return { items: BUILTIN_WEBHOOK_EVENTS }
  }

  @Post('internal/emit')
  @HttpCode(HttpStatus.ACCEPTED)
  async emitInternal(@Body() body: { eventType: WebhookEventType; data?: Record<string, unknown> }) {
    const tenantId = body.data?.tenantId as string | undefined
    if (!tenantId) {
      return { error: 'data.tenantId required' }
    }
    await webhookEventBus.emit({
      eventType: body.eventType,
      eventId: `evt-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      tenantId,
      data: body.data ?? {},
    })
    return { emitted: true, eventType: body.eventType }
  }
}
