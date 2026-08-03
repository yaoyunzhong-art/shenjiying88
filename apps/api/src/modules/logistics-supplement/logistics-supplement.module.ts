import { Module } from '@nestjs/common'
import { LogisticsSupplementService } from './logistics-supplement.service'
import { LogisticsSupplementController } from './logistics-supplement.controller'

@Module({
  controllers: [LogisticsSupplementController],
  providers: [LogisticsSupplementService],
  exports: [LogisticsSupplementService],
})
export class LogisticsSupplementModule {}
