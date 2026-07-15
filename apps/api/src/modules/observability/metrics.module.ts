import { Global, Module } from '@nestjs/common'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'
import { MetricsInterceptor } from './metrics.interceptor'
import { ObservabilityService } from './observability.service'

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, ObservabilityService, MetricsInterceptor],
  exports: [MetricsService, ObservabilityService, MetricsInterceptor]
})
export class MetricsModule {}
