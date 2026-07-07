// time-series.module.ts - Phase-19 T27 auto
import { Module } from '@nestjs/common'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'

@Module({
  controllers: [TimeSeriesController],
  providers: [TimeSeriesCollectorService, TimeSeriesService],
  exports: [TimeSeriesCollectorService, TimeSeriesService],
})
export class TimeSeriesModule {}
