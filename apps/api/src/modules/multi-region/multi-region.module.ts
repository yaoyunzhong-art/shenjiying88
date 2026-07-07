/**
 * multi-region.module.ts - Phase-20 T47-T48
 * 用途: 多区域模块入口
 */
import { Module, Global } from '@nestjs/common';
import { MultiRegionController } from './multi-region.controller';
import { MultiRegionService } from './multi-region.service';
import { FailoverService } from './failover.service';

@Global()
@Module({
  controllers: [MultiRegionController],
  providers: [MultiRegionService, FailoverService],
  exports: [MultiRegionService, FailoverService],
})
export class MultiRegionModule {}
