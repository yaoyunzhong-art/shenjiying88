import { Module } from '@nestjs/common'
import { AiMarketingController } from './ai-marketing.controller'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

@Module({
  controllers: [AiMarketingController],
  providers: [
    MarketingROIService,
    CopywritingAssistant,
    CampaignPlanner,
    AIMarketingCMOService,
  ],
  exports: [
    MarketingROIService,
    CopywritingAssistant,
    CampaignPlanner,
    AIMarketingCMOService,
  ],
})
export class AiMarketingModule {}
