/**
 * Champion Module
 *
 * 注册 Champion 相关组件到 NestJS DI 容器
 */

import { Module } from '@nestjs/common';
import { ChampionController } from './champion.controller';
import { ChampionService } from './champion.service';

@Module({
  controllers: [ChampionController],
  providers: [ChampionService],
  exports: [ChampionService],
})
export class ChampionModule {}
