import { Module } from '@nestjs/common'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

@Module({
  controllers: [AllianceController],
  providers: [
    AlliancePartner,
    PartnerGradingService,
    HealthScoreService,
    CrossMerchantSettlementService,
    UnlinkedOrderDetector,
    AnomalyDetectionService,
  ],
  exports: [
    AlliancePartner,
    PartnerGradingService,
    HealthScoreService,
    CrossMerchantSettlementService,
    UnlinkedOrderDetector,
    AnomalyDetectionService,
  ],
})
export class AllianceModule {}
