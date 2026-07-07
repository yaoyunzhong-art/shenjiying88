import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentQueryDto,
  PublishContentDto,
} from './content.dto';

describe('ContentDto', () => {
  describe('CreateContentDto', () => {
    it('should pass validation with valid full payload', async () => {
      const dto = plainToInstance(CreateContentDto, {
        title: '测试内容',
        slug: 'test-content',
        summary: '这是一个测试',
        body: '完整内容正文...',
        category: 'notice',
        authorId: 'user_001',
        coverImageUrl: 'https://example.com/cover.jpg',
        metadata: { tags: ['test'], version: 1 },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with minimal required fields', async () => {
      const dto = plainToInstance(CreateContentDto, {
        title: '最小内容',
        slug: 'minimal',
        body: '内容正文',
        category: 'other',
        authorId: 'user_001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      const dto = plainToInstance(CreateContentDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const fieldNames = errors.map((e) => e.property);
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('slug');
      expect(fieldNames).toContain('body');
      expect(fieldNames).toContain('category');
      expect(fieldNames).toContain('authorId');
    });

    it('should fail validation with invalid category', async () => {
      const dto = plainToInstance(CreateContentDto, {
        title: 'Test',
        slug: 'test',
        body: 'body',
        category: 'invalid_category',
        authorId: 'user_001',
      });

      const errors = await validate(dto);
      const categoryErrors = errors.filter((e) => e.property === 'category');
      expect(categoryErrors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateContentDto', () => {
    it('should pass validation when all fields optional', async () => {
      const dto = plainToInstance(UpdateContentDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with partial update fields', async () => {
      const dto = plainToInstance(UpdateContentDto, {
        title: '新标题',
        status: 'published',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid status', async () => {
      const dto = plainToInstance(UpdateContentDto, {
        status: 'nonexistent_status',
      });

      const errors = await validate(dto);
      const statusErrors = errors.filter((e) => e.property === 'status');
      expect(statusErrors.length).toBeGreaterThan(0);
    });
  });

  describe('ContentQueryDto', () => {
    it('should pass validation with valid query params', async () => {
      const dto = plainToInstance(ContentQueryDto, {
        category: 'activity',
        status: 'published',
        search: '春节',
        limit: 20,
        offset: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with empty query (all filters optional)', async () => {
      const dto = plainToInstance(ContentQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with limit > 100', async () => {
      const dto = plainToInstance(ContentQueryDto, { limit: 200 });
      const errors = await validate(dto);
      const limitErrors = errors.filter((e) => e.property === 'limit');
      expect(limitErrors.length).toBeGreaterThan(0);
    });

    it('should fail with negative offset', async () => {
      const dto = plainToInstance(ContentQueryDto, { offset: -1 });
      const errors = await validate(dto);
      const offsetErrors = errors.filter((e) => e.property === 'offset');
      expect(offsetErrors.length).toBeGreaterThan(0);
    });
  });

  describe('PublishContentDto', () => {
    it('should pass with valid ISO date string', async () => {
      const dto = plainToInstance(PublishContentDto, {
        publishAt: '2026-02-01T10:00:00Z',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass without publishAt (publish immediately)', async () => {
      const dto = plainToInstance(PublishContentDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
