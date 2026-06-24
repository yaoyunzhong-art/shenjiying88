import { Global, Module } from '@nestjs/common'
import { TrustGovernanceController } from './trust-governance.controller'
import { TrustGovernanceService } from './trust-governance.service'

@Global()
@Module({
  controllers: [TrustGovernanceController],
  providers: [TrustGovernanceService],
  exports: [TrustGovernanceService]
})
export class TrustGovernanceModule {}
