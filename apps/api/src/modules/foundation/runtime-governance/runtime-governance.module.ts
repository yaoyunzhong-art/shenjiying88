import { Global, Module } from '@nestjs/common'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import { RuntimeGovernanceService } from './runtime-governance.service'

@Global()
@Module({
  controllers: [RuntimeGovernanceController],
  providers: [RuntimeGovernanceService],
  exports: [RuntimeGovernanceService]
})
export class RuntimeGovernanceModule {}
