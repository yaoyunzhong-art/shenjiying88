/**
 * Phase 97 联邦学习 Module (V10 Sprint 2 Day 26)
 */

import { Module, Global } from '@nestjs/common'
import { FederatedLearningService } from './federated.service'
import { FederatedLearningController } from './federated.controller'

@Global()
@Module({
  providers: [FederatedLearningService],
  controllers: [FederatedLearningController],
  exports: [FederatedLearningService],
})
export class FederatedLearningModule {}