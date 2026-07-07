import { Module } from '@nestjs/common'
import { PointsController } from './points.controller'
import { PointsAtomicService } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier } from './points-risk.service'

@Module({
  controllers: [PointsController],
  providers: [
    PointsAtomicService,
    PointsRiskService,
    {
      provide: InflationMonitor,
      useFactory: () => new InflationMonitor()
    },
    {
      provide: CircuitBreaker,
      useFactory: () => new CircuitBreaker({})
    },
    {
      provide: ExpirationNotifier,
      useFactory: () => new ExpirationNotifier()
    }
  ],
  exports: [
    PointsAtomicService,
    PointsRiskService
  ]
})
export class PointsModule {}
