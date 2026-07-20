import { Module } from '@nestjs/common'
import { BrandOperationsController } from './brand-operations.controller'
import { BrandOperationsService } from './brand-operations.service'

@Module({
  controllers: [BrandOperationsController],
  providers: [BrandOperationsService],
  exports: [BrandOperationsService],
})
export class BrandOperationsModule {}
