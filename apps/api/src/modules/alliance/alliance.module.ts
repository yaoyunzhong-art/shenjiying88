import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { AllianceController } from './alliance.controller'
import { AllianceService } from './alliance.service'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
} from './alliance-settlement.service'

@Module({
  imports: [AuditModule],
  controllers: [AllianceController],
  providers: [
    AllianceService,
    AlliancePartner,
    PartnerGradingService,
    HealthScoreService,
    CrossMerchantSettlementService,
    UnlinkedOrderDetector,
    AnomalyDetectionService,
  ],
  exports: [
    AllianceService,
    AlliancePartner,
    PartnerGradingService,
    HealthScoreService,
    CrossMerchantSettlementService,
    UnlinkedOrderDetector,
    AnomalyDetectionService,
  ],
})
export class AllianceModule {}
