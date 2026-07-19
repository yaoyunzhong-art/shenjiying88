// CategoriesModule · 商品分类
// 创建: 2026-07-20 · 轻量级内存模块
// 用途: 为 POS 前端和下游系统提供商品分类 API

import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
