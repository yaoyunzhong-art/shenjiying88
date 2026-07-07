import { describe, it, expect, beforeEach } from 'vitest';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import type { ContentResponseDto, ContentPaginatedResponseDto } from './content.dto';

describe('ContentController', () => {
  let controller: ContentController;
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
    controller = new ContentController(service);
  });

  describe('POST /content — create', () => {
    it('should create content and return response', async () => {
      const result = await controller.create({
        title: '测试内容',
        slug: 'test-content',
        summary: '测试摘要',
        body: '内容正文',
        category: 'notice',
        authorId: 'user_001',
      });

      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.title).toBe('测试内容');
      expect(result.data.slug).toBe('test-content');
      expect(result.data.status).toBe('draft');
      expect(result.data.createdAt).toBeDefined();
    });

    it('should reject duplicate slug', async () => {
      await controller.create({
        title: '内容1',
        slug: 'same-slug',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      await expect(
        controller.create({
          title: '内容2',
          slug: 'same-slug',
          body: 'body2',
          category: 'notice',
          authorId: 'user_002',
        }),
      ).rejects.toThrow('Slug "same-slug" already exists');
    });
  });

  describe('GET /content — findAll', () => {
    it('should return empty list when no content', async () => {
      const result = await controller.findAll({});
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all contents sorted by creation time desc', async () => {
      await controller.create({
        title: '内容1',
        slug: 'content-1',
        body: 'body1',
        category: 'notice',
        authorId: 'user_001',
      });
      await controller.create({
        title: '内容2',
        slug: 'content-2',
        body: 'body2',
        category: 'activity',
        authorId: 'user_001',
      });

      const result = await controller.findAll({});
      expect(result.total).toBe(2);
      expect(result.items.length).toBe(2);
    });

    it('should filter by category', async () => {
      await controller.create({
        title: '通知',
        slug: 'notice-1',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });
      await controller.create({
        title: '活动',
        slug: 'activity-1',
        body: 'body',
        category: 'activity',
        authorId: 'user_001',
      });

      const result = await controller.findAll({ category: 'activity' });
      expect(result.total).toBe(1);
      expect(result.items[0].category).toBe('activity');
    });

    it('should support pagination', async () => {
      for (let i = 1; i <= 5; i++) {
        await controller.create({
          title: `内容${i}`,
          slug: `content-${i}`,
          body: 'body',
          category: 'notice',
          authorId: 'user_001',
        });
      }

      const page1 = await controller.findAll({ limit: 2, offset: 0 });
      expect(page1.items.length).toBe(2);
      expect(page1.total).toBe(5);

      const page2 = await controller.findAll({ limit: 2, offset: 2 });
      expect(page2.items.length).toBe(2);
    });
  });

  describe('GET /content/:id — findOne', () => {
    it('should return content by id', async () => {
      const created = await controller.create({
        title: '测试',
        slug: 'test',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const result = await controller.findOne(created.data.id);
      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.title).toBe('测试');
      }
    });

    it('should return error for non-existent id', async () => {
      const result = await controller.findOne('nonexistent');
      expect('success' in result).toBe(true);
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.message).toContain('not found');
      }
    });
  });

  describe('GET /content/slug/:slug — findBySlug', () => {
    it('should return content by slug', async () => {
      await controller.create({
        title: 'Slug测试',
        slug: 'my-unique-slug',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const result = await controller.findBySlug('my-unique-slug');
      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.title).toBe('Slug测试');
      }
    });

    it('should return error for non-existent slug', async () => {
      const result = await controller.findBySlug('no-such-slug');
      expect('success' in result).toBe(true);
      if ('success' in result) {
        expect(result.success).toBe(false);
      }
    });
  });

  describe('PUT /content/:id — update', () => {
    it('should update content title', async () => {
      const created = await controller.create({
        title: '旧标题',
        slug: 'update-test',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const updated = await controller.update(created.data.id, {
        title: '新标题',
      });

      expect('data' in updated).toBe(true);
      if ('data' in updated) {
        expect(updated.data.title).toBe('新标题');
      }
    });

    it('should return error for non-existent id', async () => {
      const result = await controller.update('nonexistent', {
        title: '新标题',
      });
      expect('success' in result).toBe(true);
      if ('success' in result) {
        expect(result.success).toBe(false);
      }
    });
  });

  describe('POST /content/:id/publish — publish', () => {
    it('should publish content', async () => {
      const created = await controller.create({
        title: '待发布',
        slug: 'to-publish',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const published = await controller.publish(created.data.id, {});
      expect('data' in published).toBe(true);
      if ('data' in published) {
        expect(published.data.status).toBe('published');
        expect(published.data.publishedAt).toBeDefined();
      }
    });

    it('should return error for non-existent content', async () => {
      const result = await controller.publish('nonexistent', {});
      expect('success' in result).toBe(true);
      if ('success' in result) {
        expect(result.success).toBe(false);
      }
    });
  });

  describe('POST /content/:id/archive — archive', () => {
    it('should archive content', async () => {
      const created = await controller.create({
        title: '待归档',
        slug: 'to-archive',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const archived = await controller.archive(created.data.id);
      expect('data' in archived).toBe(true);
      if ('data' in archived) {
        expect(archived.data.status).toBe('archived');
      }
    });
  });

  describe('DELETE /content/:id — remove', () => {
    it('should soft delete content', async () => {
      const created = await controller.create({
        title: '待删除',
        slug: 'to-delete',
        body: 'body',
        category: 'notice',
        authorId: 'user_001',
      });

      const result = await controller.remove(created.data.id);
      expect(result.success).toBe(true);
    });

    it('should return error for non-existent content', async () => {
      const result = await controller.remove('nonexistent');
      expect(result.success).toBe(false);
    });
  });
});
