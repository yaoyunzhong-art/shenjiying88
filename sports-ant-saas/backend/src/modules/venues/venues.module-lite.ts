import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { Venue } from './entities/venue.entity';

/**
 * VenuesModuleLite - 简化版本的场馆模块
 * 只包含最基本功能，用于解决依赖注入问题
 * 目标：确保服务能够启动，然后逐步恢复功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Venue]),
  ],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModuleLite {}