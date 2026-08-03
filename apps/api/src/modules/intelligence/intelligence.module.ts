import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { IntelligenceController } from './intelligence.controller'
import { IntelligenceService } from './intelligence.service'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'
import { MonitorScheduler } from './monitor-scheduler'
import { VenueDataService } from './venue-data.service'
import { EmpowerCardService } from '../empower-card/empower-card.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [IntelligenceController],
  providers: [IntelligenceService, IntelligenceAiService, MonitorCollectorService, MonitorScheduler, VenueDataService, EmpowerCardService],
  exports: [IntelligenceService, MonitorCollectorService, MonitorScheduler],
})
export class IntelligenceModule {}
