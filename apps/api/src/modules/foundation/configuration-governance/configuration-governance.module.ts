import { Global, Module } from '@nestjs/common'
import { ConfigurationGovernanceController } from './configuration-governance.controller'
import { ConfigurationGovernanceService } from './configuration-governance.service'

@Global()
@Module({
  controllers: [ConfigurationGovernanceController],
  providers: [ConfigurationGovernanceService],
  exports: [ConfigurationGovernanceService]
})
export class ConfigurationGovernanceModule {}
