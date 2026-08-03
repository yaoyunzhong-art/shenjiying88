import { Module } from '@nestjs/common'
import { BrandOperationsController } from './brand-operations.controller'
import { BrandOperationsService } from './brand-operations.service'
import { BrandOperationsPrismaStore } from './brand-operations.prisma-store'


@Module({
  controllers: [BrandOperationsController],
  providers: [BrandOperationsService, BrandOperationsPrismaStore],
  exports: [BrandOperationsService, BrandOperationsPrismaStore],
})
export class BrandOperationsModule {}
