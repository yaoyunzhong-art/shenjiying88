/**
 * Phase 95 Webhook Module (V10 Sprint 2 Day 19)
 */

import { Global, Module } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { WebhookController } from './webhook.controller'

@Global()
@Module({
  providers: [WebhookService],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
