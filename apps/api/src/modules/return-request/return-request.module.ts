import { Module } from '@nestjs/common'
import { ReturnRequestController } from './return-request.controller'
import { ReturnRequestService } from './return-request.service'

@Module({
  controllers: [ReturnRequestController],
  providers: [ReturnRequestService],
  exports: [ReturnRequestService],
})
export class ReturnRequestModule {}
