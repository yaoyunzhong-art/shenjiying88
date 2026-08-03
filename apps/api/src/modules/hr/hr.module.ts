import { Module } from '@nestjs/common'
import { HrController } from './hr.controller'
import { HrService } from './hr.service'
import { HrPerformanceController } from './hr-performance.controller'
import { HrPerformanceService } from './hr-performance.service'
import { HrRecruitmentController } from './hr-recruitment.controller'
import { HrRecruitmentService } from './hr-recruitment.service'

@Module({
  controllers: [
    HrController,
    HrPerformanceController,
    HrRecruitmentController,
  ],
  providers: [
    HrService,
    HrPerformanceService,
    HrRecruitmentService,
  ],
  exports: [
    HrService,
    HrPerformanceService,
    HrRecruitmentService,
  ],
})
export class HrModule {}
