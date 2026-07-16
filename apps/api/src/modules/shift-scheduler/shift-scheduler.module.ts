import { Module } from '@nestjs/common'
import { ShiftSchedulerController } from './shift-scheduler.controller'
import { ShiftSchedulerService } from './shift-scheduler.service'

@Module({
  controllers: [ShiftSchedulerController],
  providers: [ShiftSchedulerService],
  exports: [ShiftSchedulerService],
})
export class ShiftSchedulerModule {}
