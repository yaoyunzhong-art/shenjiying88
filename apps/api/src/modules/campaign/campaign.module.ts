import { Module } from '@nestjs/common'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { MemberModule } from '../member/member.module'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'
import { CampaignTriggerService } from './trigger.service'

@Module({
  imports: [MemberModule, LoyaltyModule, MarketingMetricsModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignTriggerService],
  exports: [CampaignService, CampaignTriggerService]
})
export class CampaignModule {}
