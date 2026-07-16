import { Module } from '@nestjs/common'
import { WarehouseBinController } from './warehouse-bin.controller'
import { WarehouseBinService } from './warehouse-bin.service'

@Module({
  controllers: [WarehouseBinController],
  providers: [WarehouseBinService],
  exports: [WarehouseBinService],
})
export class WarehouseBinModule {}
