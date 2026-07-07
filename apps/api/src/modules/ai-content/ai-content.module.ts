import { Module } from '@nestjs/common'
import { AiContentController } from './ai-content.controller'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'

@Module({
  controllers: [AiContentController],
  providers: [
    TeamBuildingReportGenerator,
    ContentModerationService,
    VideoDeduplicationService,
    ProgressAnalyzer,
  ],
  exports: [
    TeamBuildingReportGenerator,
    ContentModerationService,
    VideoDeduplicationService,
    ProgressAnalyzer,
  ],
})
export class AiContentModule {}
