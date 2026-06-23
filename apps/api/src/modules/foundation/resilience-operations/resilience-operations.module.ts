import { Global, Module } from '@nestjs/common'
import { ResilienceOperationsController } from './resilience-operations.controller'
import { ResilienceOperationsService } from './resilience-operations.service'

@Global()
@Module({
  controllers: [ResilienceOperationsController],
  providers: [ResilienceOperationsService],
  exports: [ResilienceOperationsService]
})
export class ResilienceOperationsModule {}
