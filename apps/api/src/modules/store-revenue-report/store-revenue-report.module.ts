import { Module } from '@nestjs/common'
import { StoreRevenueReportController } from './store-revenue-report.controller'
import { StoreRevenueReportService } from './store-revenue-report.service'

@Module({
  controllers: [StoreRevenueReportController],
  providers: [StoreRevenueReportService],
  exports: [StoreRevenueReportService],
})
export class StoreRevenueReportModule {}
