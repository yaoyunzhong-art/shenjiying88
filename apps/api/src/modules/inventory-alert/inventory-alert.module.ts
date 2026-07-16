import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { InventoryAlertController } from './inventory-alert.controller'
import { InventoryAlertService } from './inventory-alert.service'

@Module({
  imports: [PrismaModule],
  controllers: [InventoryAlertController],
  providers: [InventoryAlertService],
  exports: [InventoryAlertService],
})
export class InventoryAlertModule {}
