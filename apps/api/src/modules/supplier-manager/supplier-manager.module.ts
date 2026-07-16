import { Module } from '@nestjs/common'
import { SupplierManagerController } from './supplier-manager.controller'
import { SupplierManagerService } from './supplier-manager.service'

@Module({
  controllers: [SupplierManagerController],
  providers: [SupplierManagerService],
  exports: [SupplierManagerService],
})
export class SupplierManagerModule {}
