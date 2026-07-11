import { Module } from '@nestjs/common'
import { ScoutController } from './scout.controller'
import { ScoutService } from './scout.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ScoutController],
  providers: [ScoutService],
  exports: [ScoutService],
})
export class ScoutModule {}
