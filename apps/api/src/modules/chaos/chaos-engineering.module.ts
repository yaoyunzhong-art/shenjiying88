import { Module } from '@nestjs/common'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'

@Module({
  controllers: [ChaosEngineeringController],
  providers: [
    ChaosExperimentService,
    FaultInjectionService,
    ChaosAutoRollbackService,
  ],
  exports: [
    ChaosExperimentService,
    FaultInjectionService,
    ChaosAutoRollbackService,
  ],
})
export class ChaosEngineeringModule {}
