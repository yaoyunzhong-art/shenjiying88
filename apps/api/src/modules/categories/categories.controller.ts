// CategoriesController · 商品分类 REST API
// 路由前缀: /api/v1/categories (全局前缀自动添加)
// 创建: 2026-07-20

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './categories.entity';
import { TenantGuard } from '../agent/tenant.guard';

@ApiTags('商品分类')
@Controller('categories')
@UseGuards(TenantGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/v1/categories
   * 获取全部商品分类列表
   */
  @Get()
  @ApiOperation({ summary: '获取全部商品分类' })
  findAll(): Category[] {
    return this.categoriesService.findAll();
  }

  /**
   * GET /api/v1/categories/stats
   * 获取分类统计信息
   */
  @Get('stats')
  @ApiOperation({ summary: '获取分类统计信息' })
  getStats(): { total: number; categories: string[] } {
    return this.categoriesService.getCategoryStats();
  }

  /**
   * GET /api/v1/categories/:name
   * 按名称查询分类详情
   */
  @Get(':name')
  @ApiOperation({ summary: '按名称查询分类详情' })
  @ApiParam({ name: 'name', description: '分类名称' })
  findByName(@Param('name') name: string): Category {
    return this.categoriesService.findByName(name);
  }
}
