import { Module } from '@nestjs/common'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { MemberModule } from '../member/member.module'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyService } from './loyalty.service'

@Module({
  imports: [MemberModule, MarketingMetricsModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService]
})
export class LoyaltyModule {}
