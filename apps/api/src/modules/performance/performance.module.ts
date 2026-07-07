import { Module } from '@nestjs/common'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'

@Module({
  controllers: [PerformanceController],
  providers: [
    PerformanceService,
    CacheTierService,
    DBOptimizeService,
    K6RunnerService,
    K8sScaleService,
  ],
  exports: [PerformanceService],
})
export class PerformanceModule {}
