import { Module } from '@nestjs/common'
import { ProcurementOrderController } from './procurement-order.controller'
import { ProcurementOrderService } from './procurement-order.service'

@Module({
  controllers: [ProcurementOrderController],
  providers: [ProcurementOrderService],
  exports: [ProcurementOrderService],
})
export class ProcurementOrderModule {}
