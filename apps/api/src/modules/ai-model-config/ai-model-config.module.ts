/**
 * AI 模型配置 - NestJS Module (V9 需求 1 · V10 Day 1)
 */

import { Module } from '@nestjs/common'
import { AiModelConfigController } from './ai-model-config.controller'
import { AiModelConfigService } from './ai-model-config.service'

@Module({
  controllers: [AiModelConfigController],
  providers: [AiModelConfigService],
  exports: [AiModelConfigService],
})
export class AiModelConfigModule {}