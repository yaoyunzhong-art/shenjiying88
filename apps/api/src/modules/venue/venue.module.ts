/**
 * venue.module.ts — P-25 场地管理模块
 */
import { Module } from '@nestjs/common'
import { VenueController } from './venue.controller'
import { VenueService } from './venue.service'

@Module({
  controllers: [VenueController],
  providers: [VenueService],
  exports: [VenueService],
})
export class VenueModule {}
