// perf-monitor.module.ts - Phase-19 T27 auto
import { Module } from '@nestjs/common'
import { PerfMonitorController } from './perf-monitor.controller'
import { PerfMonitorService } from './perf-monitor.service'

@Module({
  controllers: [PerfMonitorController],
  providers: [PerfMonitorService],
  exports: [PerfMonitorService],
})
export class PerfMonitorModule {}
