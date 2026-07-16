import { Module } from '@nestjs/common'
import { PriceMonitorController } from './price-monitor.controller'
import { PriceMonitorService } from './price-monitor.service'

@Module({
  controllers: [PriceMonitorController],
  providers: [PriceMonitorService],
  exports: [PriceMonitorService],
})
export class PriceMonitorModule {}
