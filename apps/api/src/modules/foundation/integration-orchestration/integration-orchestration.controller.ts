import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { EventListQueryDto, PublishEventDto, WebhookIngestDto } from './integration-orchestration.dto'
import { IntegrationOrchestrationService } from './integration-orchestration.service'
import { TenantGuard } from '../../agent/tenant.guard';

@Controller('foundation/integration-orchestration')
@UseGuards(TenantGuard)
export class IntegrationOrchestrationController {
  constructor(private readonly integrationOrchestrationService: IntegrationOrchestrationService) {}

  @Get('webhooks/sources')
  getWebhookSources(): unknown {
    return this.integrationOrchestrationService.getWebhookSourceCatalog()
  }

  @Get('events')
  async getEvents(@Query() query: EventListQueryDto): Promise<unknown> {
    return this.integrationOrchestrationService.getEventEnvelopes(query.source)
  }

  @Get('idempotency-records')
  async getIdempotencyRecords(@Query() query: EventListQueryDto): Promise<unknown> {
    return this.integrationOrchestrationService.getIdempotencyRecords(query.source)
  }

  @Post('events')
  async publishEvent(@Body() body: PublishEventDto): Promise<unknown> {
    return this.integrationOrchestrationService.publishEvent(body.eventName, body.payload, {
      source: body.source,
      aggregateId: body.aggregateId,
      idempotencyKey: body.idempotencyKey
    })
  }

  @Post('webhooks/:source/ingest')
  async ingestWebhook(@Param('source') source: string, @Body() body: WebhookIngestDto): Promise<unknown> {
    return this.integrationOrchestrationService.acceptWebhook(source, body)
  }
}
