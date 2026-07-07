/**
 * content.service.ts - 内容管理 Service
 * 用途: 通用内容 CRUD、发布、搜索、归档
 */

import { Injectable } from '@nestjs/common';
import type {
  ContentEntity,
  ContentCategory,
  ContentStatus,
  ContentMetadata,
} from './content.entity';

export interface CreateContentInput {
  title: string;
  slug: string;
  summary?: string;
  body: string;
  category: ContentCategory;
  authorId: string;
  coverImageUrl?: string;
  metadata?: ContentMetadata;
}

export interface UpdateContentInput {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  category?: ContentCategory;
  status?: ContentStatus;
  coverImageUrl?: string;
  metadata?: ContentMetadata;
}

export interface ContentQuery {
  category?: ContentCategory;
  status?: ContentStatus;
  search?: string;
  authorId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ContentService {
  private readonly contentStore = new Map<string, ContentEntity>();
  private idCounter = 0;

  private generateId(): string {
    this.idCounter++;
    return `content_${Date.now()}_${this.idCounter}`;
  }

  private toEntity(input: CreateContentInput): ContentEntity {
    return {
      id: this.generateId(),
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      category: input.category,
      status: 'draft',
      authorId: input.authorId,
      coverImageUrl: input.coverImageUrl,
      metadata: input.metadata ?? { version: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /** 创建内容 */
  async create(input: CreateContentInput): Promise<ContentEntity> {
    // 检查 slug 唯一性
    for (const [, content] of this.contentStore) {
      if (content.slug === input.slug) {
        throw new Error(`Slug "${input.slug}" already exists`);
      }
    }

    const entity = this.toEntity(input);
    this.contentStore.set(entity.id, entity);
    return { ...entity };
  }

  /** 根据 ID 获取内容 */
  async findById(id: string): Promise<ContentEntity | null> {
    const content = this.contentStore.get(id);
    return content ? { ...content } : null;
  }

  /** 根据 slug 获取内容 */
  async findBySlug(slug: string): Promise<ContentEntity | null> {
    for (const [, content] of this.contentStore) {
      if (content.slug === slug) {
        return { ...content };
      }
    }
    return null;
  }

  /** 分页查询内容 */
  async query(query: ContentQuery): Promise<PaginatedResult<ContentEntity>> {
    let results = Array.from(this.contentStore.values());

    // 过滤
    if (query.category) {
      results = results.filter((c) => c.category === query.category);
    }
    if (query.status) {
      results = results.filter((c) => c.status === query.status);
    }
    if (query.authorId) {
      results = results.filter((c) => c.authorId === query.authorId);
    }
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.body.toLowerCase().includes(searchLower) ||
          (c.summary && c.summary.toLowerCase().includes(searchLower)),
      );
    }
    if (query.fromDate) {
      const from = new Date(query.fromDate);
      results = results.filter((c) => c.createdAt >= from);
    }
    if (query.toDate) {
      const to = new Date(query.toDate);
      results = results.filter((c) => c.createdAt <= to);
    }

    const total = results.length;

    // 按创建时间降序
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    results = results.slice(offset, offset + limit);

    return {
      items: results.map((c) => ({ ...c })),
      total,
      limit,
      offset,
    };
  }

  /** 更新内容 */
  async update(id: string, input: UpdateContentInput): Promise<ContentEntity | null> {
    const existing = this.contentStore.get(id);
    if (!existing) return null;

    // 检查 slug 唯一性（如果更新了 slug）
    if (input.slug && input.slug !== existing.slug) {
      for (const [, content] of this.contentStore) {
        if (content.slug === input.slug && content.id !== id) {
          throw new Error(`Slug "${input.slug}" already exists`);
        }
      }
    }

    const updated: ContentEntity = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      updatedAt: new Date(),
    };

    this.contentStore.set(id, updated);
    return { ...updated };
  }

  /** 发布内容（状态改为 published）*/
  async publish(id: string, publishAt?: Date): Promise<ContentEntity | null> {
    const existing = this.contentStore.get(id);
    if (!existing) return null;

    const updated: ContentEntity = {
      ...existing,
      status: 'published',
      publishedAt: publishAt ?? new Date(),
      updatedAt: new Date(),
    };

    this.contentStore.set(id, updated);
    return { ...updated };
  }

  /** 归档内容 */
  async archive(id: string): Promise<ContentEntity | null> {
    const existing = this.contentStore.get(id);
    if (!existing) return null;

    const updated: ContentEntity = {
      ...existing,
      status: 'archived',
      updatedAt: new Date(),
    };

    this.contentStore.set(id, updated);
    return { ...updated };
  }

  /** 软删除内容 */
  async softDelete(id: string): Promise<boolean> {
    const existing = this.contentStore.get(id);
    if (!existing) return false;

    const updated: ContentEntity = {
      ...existing,
      status: 'deleted',
      updatedAt: new Date(),
    };

    this.contentStore.set(id, updated);
    return true;
  }

  /** 硬删除内容 */
  async hardDelete(id: string): Promise<boolean> {
    return this.contentStore.delete(id);
  }

  /** 测试辅助：重置存储 */
  __reset(): void {
    this.contentStore.clear();
    this.idCounter = 0;
  }
}
