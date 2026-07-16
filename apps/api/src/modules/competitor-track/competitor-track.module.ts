import { Module } from '@nestjs/common'
import { CompetitorTrackController } from './competitor-track.controller'
import { CompetitorTrackService } from './competitor-track.service'

@Module({
  controllers: [CompetitorTrackController],
  providers: [CompetitorTrackService],
  exports: [CompetitorTrackService]
})
export class CompetitorTrackModule {}
