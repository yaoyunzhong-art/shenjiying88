/**
 * doc.module.ts - API文档模块
 * 提供 Swagger/OpenAPI 文档生成、多格式导出、端点管理功能
 */

import { Module } from '@nestjs/common'
import { DocController } from './doc.controller'
import { SwaggerGenService } from './swagger-gen.service'

@Module({
  controllers: [DocController],
  providers: [SwaggerGenService],
  exports: [SwaggerGenService],
})
export class DocModule {}
