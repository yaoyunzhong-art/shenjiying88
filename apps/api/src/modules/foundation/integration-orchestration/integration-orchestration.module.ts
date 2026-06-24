import { Global, Module } from '@nestjs/common'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'
import { IntegrationOrchestrationService } from './integration-orchestration.service'

@Global()
@Module({
  controllers: [IntegrationOrchestrationController],
  providers: [IntegrationOrchestrationService],
  exports: [IntegrationOrchestrationService]
})
export class IntegrationOrchestrationModule {}
