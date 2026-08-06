import { Global, Module } from '@nestjs/common'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import { RuntimeGovernanceService } from './runtime-governance.service'
import { TrustGovernanceModule } from '../trust-governance/trust-governance.module'

@Global()
@Module({
  imports: [TrustGovernanceModule],
  controllers: [RuntimeGovernanceController],
  providers: [RuntimeGovernanceService],
  exports: [RuntimeGovernanceService]
})
export class RuntimeGovernanceModule {}
