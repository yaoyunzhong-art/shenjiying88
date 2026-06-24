import { Global, Module } from '@nestjs/common'
import { ConfigurationGovernanceModule } from './configuration-governance/configuration-governance.module'
import { GovernanceApprovalModule } from './governance-approval/governance-approval.module'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'
import { IdentityAccessModule } from './identity-access/identity-access.module'
import { IntegrationOrchestrationModule } from './integration-orchestration/integration-orchestration.module'
import { ResilienceOperationsModule } from './resilience-operations/resilience-operations.module'
import { RuntimeGovernanceModule } from './runtime-governance/runtime-governance.module'
import { TrustGovernanceModule } from './trust-governance/trust-governance.module'

@Global()
@Module({
  imports: [
    IdentityAccessModule,
    ConfigurationGovernanceModule,
    IntegrationOrchestrationModule,
    TrustGovernanceModule,
    ResilienceOperationsModule,
    RuntimeGovernanceModule,
    GovernanceApprovalModule
  ],
  controllers: [FoundationController],
  providers: [FoundationService],
  exports: [FoundationService]
})
export class FoundationModule {}
