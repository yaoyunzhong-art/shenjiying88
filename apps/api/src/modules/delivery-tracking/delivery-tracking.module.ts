import { Module } from '@nestjs/common'
import { DeliveryTrackingController } from './delivery-tracking.controller'
import { DeliveryTrackingService } from './delivery-tracking.service'

@Module({
  controllers: [DeliveryTrackingController],
  providers: [DeliveryTrackingService],
  exports: [DeliveryTrackingService],
})
export class DeliveryTrackingModule {}
