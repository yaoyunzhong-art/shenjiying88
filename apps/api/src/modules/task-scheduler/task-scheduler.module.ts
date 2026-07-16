import { Module } from '@nestjs/common'
import { TaskSchedulerController } from './task-scheduler.controller'
import { TaskSchedulerService } from './task-scheduler.service'

@Module({
  controllers: [TaskSchedulerController],
  providers: [TaskSchedulerService],
  exports: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
