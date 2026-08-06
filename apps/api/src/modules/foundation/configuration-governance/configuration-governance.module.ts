import { Global, Module } from '@nestjs/common'
import { ConfigurationGovernanceController } from './configuration-governance.controller'
import { ConfigurationGovernanceService } from './configuration-governance.service'
import { TrustGovernanceModule } from '../trust-governance/trust-governance.module'

@Global()
@Module({
  imports: [TrustGovernanceModule],
  controllers: [ConfigurationGovernanceController],
  providers: [ConfigurationGovernanceService],
  exports: [ConfigurationGovernanceService]
})
export class ConfigurationGovernanceModule {}
