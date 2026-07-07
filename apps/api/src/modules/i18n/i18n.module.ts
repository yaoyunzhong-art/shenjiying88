/**
 * i18n.module.ts - Phase-20 T44-T46
 * 用途: 国际化模块入口
 */
import { Module, Global } from '@nestjs/common';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';
import { LocaleRouterService } from './locale-router.service';

@Global()
@Module({
  controllers: [I18nController],
  providers: [I18nService, LocaleRouterService],
  exports: [I18nService, LocaleRouterService],
})
export class I18nModule {}
