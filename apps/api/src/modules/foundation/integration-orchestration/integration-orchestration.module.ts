import { Global, Module } from '@nestjs/common'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'
import { IntegrationOrchestrationService } from './integration-orchestration.service'
import { TrustGovernanceModule } from '../trust-governance/trust-governance.module'

@Global()
@Module({
  imports: [TrustGovernanceModule],
  controllers: [IntegrationOrchestrationController],
  providers: [IntegrationOrchestrationService],
  exports: [IntegrationOrchestrationService]
})
export class IntegrationOrchestrationModule {}
