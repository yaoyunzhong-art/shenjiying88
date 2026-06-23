import { Module } from '@nestjs/common';
import { CrossModuleController } from './cross-module.controller';
import { CrossModuleService } from './cross-module.service';

@Module({
  controllers: [CrossModuleController],
  providers: [CrossModuleService],
  exports: [CrossModuleService]
})
export class CrossModuleModule {}
