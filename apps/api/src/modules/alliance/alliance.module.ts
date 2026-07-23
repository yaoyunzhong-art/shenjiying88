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
import { AllianceTierService } from './alliance-tier.service'
import { AllianceCouponService } from './alliance-coupon.service'
import { AllianceDataService } from './alliance-data.service'
import { AllianceReviewService } from './alliance-review.service'
import { AllianceDashboardService } from './alliance-dashboard.service'

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
    AllianceTierService,
    AllianceCouponService,
    AllianceDataService,
    AllianceReviewService,
    AllianceDashboardService,
  ],
  exports: [
    AllianceService,
    AlliancePartner,
    PartnerGradingService,
    HealthScoreService,
    CrossMerchantSettlementService,
    UnlinkedOrderDetector,
    AnomalyDetectionService,
    AllianceTierService,
    AllianceCouponService,
    AllianceDataService,
    AllianceReviewService,
    AllianceDashboardService,
  ],
})
export class AllianceModule {}
