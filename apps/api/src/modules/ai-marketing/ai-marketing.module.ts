import { Module } from '@nestjs/common'
import { AiMarketingController } from './ai-marketing.controller'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

@Module({
  controllers: [AiMarketingController],
  providers: [
    MarketingROIService,
    CopywritingAssistant,
    CampaignPlanner,
    AIMarketingCMOService,
    MarketingAnalyticsService,
    CampaignOptimizerService,
  ],
  exports: [
    MarketingROIService,
    CopywritingAssistant,
    CampaignPlanner,
    AIMarketingCMOService,
    MarketingAnalyticsService,
    CampaignOptimizerService,
  ],
})
export class AiMarketingModule {}
