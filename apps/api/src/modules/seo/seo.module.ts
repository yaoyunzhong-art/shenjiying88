/**
 * seo.module.ts — P-49 SEO 数据模块
 */
import { Module } from '@nestjs/common'
import { SeoController } from './seo.controller'
import { SeoService } from './seo.service'

@Module({
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
