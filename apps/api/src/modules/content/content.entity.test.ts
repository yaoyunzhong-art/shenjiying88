import { describe, it, expect } from 'vitest';
import type { ContentEntity, ContentStatus, ContentCategory, ContentMetadata } from './content.entity';

describe('ContentEntity', () => {
  it('should create a valid content entity with all required fields', () => {
    const entity: ContentEntity = {
      id: 'content_123',
      title: '春节活动公告',
      slug: 'spring-festival-2026',
      summary: '春节活动详情',
      body: '这是春节活动的完整内容...',
      category: 'activity',
      status: 'draft',
      authorId: 'user_001',
      coverImageUrl: 'https://example.com/cover.jpg',
      metadata: { tags: ['春节', '活动'], version: 1 },
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    };

    expect(entity.id).toBe('content_123');
    expect(entity.title).toBe('春节活动公告');
    expect(entity.slug).toBe('spring-festival-2026');
    expect(entity.category).toBe('activity');
    expect(entity.status).toBe('draft');
    expect(entity.authorId).toBe('user_001');
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle all content statuses', () => {
    const statuses: ContentStatus[] = ['draft', 'published', 'archived', 'deleted'];
    for (const status of statuses) {
      const entity: ContentEntity = {
        id: `content_${status}`,
        title: 'Test',
        slug: `test-${status}`,
        body: 'body',
        category: 'other',
        status,
        authorId: 'user_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(entity.status).toBe(status);
    }
  });

  it('should handle all content categories', () => {
    const categories: ContentCategory[] = [
      'notice', 'activity', 'guide', 'news', 'promotion', 'education', 'other',
    ];
    for (const cat of categories) {
      const entity: ContentEntity = {
        id: 'test',
        title: 'Test',
        slug: `test-${cat}`,
        body: 'body',
        category: cat,
        status: 'draft',
        authorId: 'user_001',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(entity.category).toBe(cat);
    }
  });

  it('should have optional metadata with proper structure', () => {
    const metadata: ContentMetadata = {
      tags: ['公告', '重要'],
      author: 'admin',
      sourceUrl: 'https://example.com/source',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      readTimeMinutes: 5,
      version: 2,
    };

    const entity: ContentEntity = {
      id: 'content_456',
      title: '重要公告',
      slug: 'important-notice',
      body: '公告内容...',
      category: 'notice',
      status: 'published',
      authorId: 'admin',
      metadata,
      publishedAt: new Date('2026-02-01'),
      createdAt: new Date('2026-01-30'),
      updatedAt: new Date('2026-02-01'),
    };

    expect(entity.metadata?.tags).toContain('公告');
    expect(entity.metadata?.version).toBe(2);
    expect(entity.metadata?.readTimeMinutes).toBe(5);
    expect(entity.publishedAt).toBeInstanceOf(Date);
  });

  it('should handle entity without optional fields', () => {
    const entity: ContentEntity = {
      id: 'content_min',
      title: 'Minimal',
      slug: 'minimal',
      body: 'Just body',
      category: 'other',
      status: 'draft',
      authorId: 'user_001',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(entity.summary).toBeUndefined();
    expect(entity.coverImageUrl).toBeUndefined();
    expect(entity.metadata).toBeUndefined();
    expect(entity.publishedAt).toBeUndefined();
  });
});
