/**
 * Phase-35: 智能体接入模块 - NestJS模块定义
 */

import { Module } from '@nestjs/common'
import { TenantLLMController } from './llm-config.controller'
import { TenantLLMService } from './llm-config.service'
import { TenantLLMGateway } from './llm-gateway'
import { I18nGeoService } from './i18n-geo.service'
import { TenantGuard } from '../../agent/tenant.guard'

@Module({
  controllers: [TenantLLMController],
  providers: [TenantLLMService, TenantLLMGateway, I18nGeoService, TenantGuard],
  exports: [TenantLLMService, TenantLLMGateway, I18nGeoService],
})
export class TenantLLMModule {}
