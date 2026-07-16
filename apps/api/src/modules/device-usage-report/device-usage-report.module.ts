import { Module } from '@nestjs/common'
import { DeviceUsageReportController } from './device-usage-report.controller'
import { DeviceUsageReportService } from './device-usage-report.service'

@Module({
  controllers: [DeviceUsageReportController],
  providers: [DeviceUsageReportService],
  exports: [DeviceUsageReportService],
})
export class DeviceUsageReportModule {}
