/**
 * content.controller.ts - 内容管理 Controller
 * 用途: 内容的 API 路由定义，支持 CRUD、发布、搜索、归档
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
  PublishContentDto,
  ContentResponseDto,
  ContentPaginatedResponseDto,
} from './content.dto';
import type { ContentEntity } from './content.entity';

@UseGuards(TenantGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  private toResponse(entity: ContentEntity): ContentResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      summary: entity.summary,
      body: entity.body,
      category: entity.category,
      status: entity.status,
      authorId: entity.authorId,
      coverImageUrl: entity.coverImageUrl,
      metadata: entity.metadata,
      publishedAt: entity.publishedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * 创建内容
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContentDto): Promise<{ data: ContentResponseDto }> {
    const entity = await this.contentService.create({
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      body: dto.body,
      category: dto.category,
      authorId: dto.authorId,
      coverImageUrl: dto.coverImageUrl,
      metadata: dto.metadata,
    });
    return { data: this.toResponse(entity) };
  }

  /**
   * 分页查询内容列表
   */
  @Get()
  async findAll(@Query() query: ContentQueryDto): Promise<ContentPaginatedResponseDto> {
    const result = await this.contentService.query({
      category: query.category,
      status: query.status,
      search: query.search,
      authorId: query.authorId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      limit: query.limit,
      offset: query.offset,
    });
    return {
      items: result.items.map((item) => this.toResponse(item)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * 根据 ID 获取内容
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ data: ContentResponseDto } | { success: false; message: string }> {
    const entity = await this.contentService.findById(id);
    if (!entity) {
      return { success: false, message: `Content ${id} not found` };
    }
    return { data: this.toResponse(entity) };
  }

  /**
   * 根据 slug 获取内容
   */
  @Get('slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<{ data: ContentResponseDto } | { success: false; message: string }> {
    const entity = await this.contentService.findBySlug(slug);
    if (!entity) {
      return { success: false, message: `Content with slug "${slug}" not found` };
    }
    return { data: this.toResponse(entity) };
  }

  /**
   * 更新内容
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<{ data: ContentResponseDto } | { success: false; message: string }> {
    const entity = await this.contentService.update(id, {
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      body: dto.body,
      category: dto.category,
      status: dto.status,
      coverImageUrl: dto.coverImageUrl,
      metadata: dto.metadata,
    });
    if (!entity) {
      return { success: false, message: `Content ${id} not found` };
    }
    return { data: this.toResponse(entity) };
  }

  /**
   * 发布内容
   */
  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishContentDto,
  ): Promise<{ data: ContentResponseDto } | { success: false; message: string }> {
    const entity = await this.contentService.publish(
      id,
      dto.publishAt ? new Date(dto.publishAt) : undefined,
    );
    if (!entity) {
      return { success: false, message: `Content ${id} not found` };
    }
    return { data: this.toResponse(entity) };
  }

  /**
   * 归档内容
   */
  @Post(':id/archive')
  async archive(
    @Param('id') id: string,
  ): Promise<{ data: ContentResponseDto } | { success: false; message: string }> {
    const entity = await this.contentService.archive(id);
    if (!entity) {
      return { success: false, message: `Content ${id} not found` };
    }
    return { data: this.toResponse(entity) };
  }

  /**
   * 删除内容（软删除）
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.contentService.softDelete(id);
    if (!result) {
      return { success: false, message: `Content ${id} not found` };
    }
    return { success: true, message: 'Content deleted' };
  }
}
