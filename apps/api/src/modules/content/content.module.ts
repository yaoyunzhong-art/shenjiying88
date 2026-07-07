/**
 * content.module.ts - 内容管理 Module
 * 用途: 内容管理模块定义
 */

import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
