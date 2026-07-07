import { describe, it, expect, beforeEach } from 'vitest';
import { ContentService } from './content.service';
import type { ContentEntity } from './content.entity';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  const createInput = {
    title: '测试内容',
    slug: 'test-content',
    summary: '测试摘要',
    body: '这是完整的内容正文...',
    category: 'notice' as const,
    authorId: 'user_001',
  };

  describe('create', () => {
    it('should create content and return entity with id', async () => {
      const entity = await service.create(createInput);

      expect(entity.id).toBeDefined();
      expect(entity.id.startsWith('content_')).toBe(true);
      expect(entity.title).toBe('测试内容');
      expect(entity.slug).toBe('test-content');
      expect(entity.status).toBe('draft');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when slug already exists', async () => {
      await service.create(createInput);
      await expect(service.create(createInput)).rejects.toThrow('Slug "test-content" already exists');
    });

    it('should accept content with all optional fields', async () => {
      const entity = await service.create({
        ...createInput,
        coverImageUrl: 'https://example.com/cover.jpg',
        metadata: { tags: ['测试'], version: 1 },
      });

      expect(entity.coverImageUrl).toBe('https://example.com/cover.jpg');
      expect(entity.metadata?.tags).toContain('测试');
      expect(entity.metadata?.version).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return content by id', async () => {
      const created = await service.create(createInput);
      const found = await service.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('测试内容');
    });

    it('should return null for non-existent id', async () => {
      const found = await service.findById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return content by slug', async () => {
      await service.create(createInput);
      const found = await service.findBySlug('test-content');

      expect(found).not.toBeNull();
      expect(found!.title).toBe('测试内容');
    });

    it('should return null for non-existent slug', async () => {
      const found = await service.findBySlug('nonexistent-slug');
      expect(found).toBeNull();
    });
  });

  describe('query', () => {
    it('should return all contents when no filter applied', async () => {
      await service.create({ ...createInput, slug: 'content-1' });
      await service.create({ ...createInput, slug: 'content-2', title: '内容2' });
      await service.create({ ...createInput, slug: 'content-3', title: '内容3' });

      const result = await service.query({});
      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by category', async () => {
      await service.create({ ...createInput, slug: 'notice-1', category: 'notice' });
      await service.create({ ...createInput, slug: 'activity-1', category: 'activity', title: '活动' });

      const result = await service.query({ category: 'activity' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].category).toBe('activity');
    });

    it('should filter by status', async () => {
      const created = await service.create(createInput);
      await service.publish(created.id);

      const result = await service.query({ status: 'published' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].status).toBe('published');
    });

    it('should search by title or body', async () => {
      await service.create({ ...createInput, slug: 'a', title: '春节活动' });
      await service.create({ ...createInput, slug: 'b', title: '普通通知', body: '包含春节字样' });

      const result = await service.query({ search: '春节' });
      expect(result.items.length).toBe(2);
    });

    it('should filter by authorId', async () => {
      await service.create({ ...createInput, slug: 'a', authorId: 'user_a' });
      await service.create({ ...createInput, slug: 'b', authorId: 'user_b' });

      const result = await service.query({ authorId: 'user_a' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].authorId).toBe('user_a');
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 10; i++) {
        await service.create({ ...createInput, slug: `content-${i}`, title: `内容${i}` });
      }

      const page1 = await service.query({ limit: 3, offset: 0 });
      expect(page1.items.length).toBe(3);
      expect(page1.total).toBe(10);

      const page2 = await service.query({ limit: 3, offset: 3 });
      expect(page2.items.length).toBe(3);
      expect(page2.items[0].id).not.toBe(page1.items[0].id);
    });

    it('should return empty array for no results', async () => {
      const result = await service.query({ category: 'guide' });
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('update', () => {
    it('should update content fields', async () => {
      const created = await service.create(createInput);
      const updated = await service.update(created.id, {
        title: '新标题',
        summary: '新摘要',
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('新标题');
      expect(updated!.summary).toBe('新摘要');
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('should return null for non-existent id', async () => {
      const result = await service.update('nonexistent', { title: '新标题' });
      expect(result).toBeNull();
    });

    it('should throw when updating to an existing slug', async () => {
      await service.create({ ...createInput, slug: 'first' });
      const second = await service.create({ ...createInput, slug: 'second' });

      await expect(service.update(second.id, { slug: 'first' })).rejects.toThrow(
        'Slug "first" already exists',
      );
    });
  });

  describe('publish', () => {
    it('should set status to published and set publishedAt', async () => {
      const created = await service.create(createInput);
      const published = await service.publish(created.id);

      expect(published).not.toBeNull();
      expect(published!.status).toBe('published');
      expect(published!.publishedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent id', async () => {
      const result = await service.publish('nonexistent');
      expect(result).toBeNull();
    });

    it('should accept custom publishAt date', async () => {
      const created = await service.create(createInput);
      const futureDate = new Date('2026-12-31');
      const published = await service.publish(created.id, futureDate);

      expect(published!.publishedAt!.getTime()).toBe(futureDate.getTime());
    });
  });

  describe('archive', () => {
    it('should set status to archived', async () => {
      const created = await service.create(createInput);
      await service.publish(created.id);
      const archived = await service.archive(created.id);

      expect(archived).not.toBeNull();
      expect(archived!.status).toBe('archived');
    });
  });

  describe('softDelete / hardDelete', () => {
    it('should soft delete by setting status to deleted', async () => {
      const created = await service.create(createInput);
      const result = await service.softDelete(created.id);

      expect(result).toBe(true);

      const found = await service.findById(created.id);
      expect(found!.status).toBe('deleted');
    });

    it('should hard delete by removing from store', async () => {
      const created = await service.create(createInput);
      const result = await service.hardDelete(created.id);

      expect(result).toBe(true);
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent content', async () => {
      const softResult = await service.softDelete('nonexistent');
      expect(softResult).toBe(false);

      const hardResult = await service.hardDelete('nonexistent');
      expect(hardResult).toBe(false);
    });
  });
});
