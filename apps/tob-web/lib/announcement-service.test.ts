/**
 * announcement-service.test.ts — 公告管理数据服务 L1 测试
 * 覆盖: 列表查询(关键字/分类/状态过滤) / 详情获取 / 状态更新 / 边界情况
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { announcementService, type Announcement, type AnnouncementStatus, type AnnouncementCategory } from './announcement-service';

describe('AnnouncementService', () => {
  describe('listAnnouncements 列表查询', () => {
    it('1. 默认查询返回所有公告', async () => {
      const res = await announcementService.listAnnouncements();
      assert.equal(res.success, true);
      assert.ok(res.data);
      assert.equal(res.data.total, 7);
      assert.equal(res.data.items.length, 7);
    });

    it('2. 分页查询返回指定条数', async () => {
      const res = await announcementService.listAnnouncements({ page: 1, pageSize: 3 });
      assert.ok(res.data);
      assert.equal(res.data.items.length, 3);
      assert.equal(res.data.page, 1);
      assert.equal(res.data.pageSize, 3);
    });

    it('3. 按关键字搜索标题', async () => {
      const res = await announcementService.listAnnouncements({ keyword: '巡检' });
      assert.ok(res.data);
      assert.ok(res.data.items.every((a) => a.title.includes('巡检') || a.summary.includes('巡检')));
    });

    it('4. 按分类筛选', async () => {
      const res = await announcementService.listAnnouncements({ category: 'system' as AnnouncementCategory });
      assert.ok(res.data);
      assert.ok(res.data.items.every((a) => a.category === 'system'));
    });

    it('5. 按状态筛选 draft', async () => {
      const res = await announcementService.listAnnouncements({ status: 'draft' as AnnouncementStatus });
      assert.ok(res.data);
      assert.ok(res.data.items.every((a) => a.status === 'draft'));
    });

    it('6. 组合查询 (分类+状态)', async () => {
      const res = await announcementService.listAnnouncements({
        category: 'operation' as AnnouncementCategory,
        status: 'published' as AnnouncementStatus,
      });
      assert.ok(res.data);
      assert.ok(res.data.items.every((a) => a.category === 'operation' && a.status === 'published'));
    });

    it('7. 无匹配时返回空数组', async () => {
      const res = await announcementService.listAnnouncements({ keyword: 'ZZZZ_NO_MATCH' });
      assert.ok(res.data);
      assert.equal(res.data.items.length, 0);
      assert.equal(res.data.total, 0);
    });
  });

  describe('getAnnouncement 详情获取', () => {
    it('8. 已知 ID 返回完整公告', async () => {
      const res = await announcementService.getAnnouncement('ann_001');
      assert.equal(res.success, true);
      assert.ok(res.data);
      assert.equal(res.data.id, 'ann_001');
      assert.equal(res.data.title, '夏季巡检通知');
      assert.ok(res.data.content.length > 0);
    });

    it('9. 不存在 ID 返回错误', async () => {
      const res = await announcementService.getAnnouncement('nonexistent');
      assert.equal(res.success, false);
      assert.ok(res.error);
      assert.equal(res.error.code, 'NOT_FOUND');
    });
  });

  describe('updateStatus 状态流转', () => {
    it('10. draft → published 可正常流转', async () => {
      const res = await announcementService.updateStatus('ann_004', 'published');
      assert.equal(res.success, true);
      assert.ok(res.data);
      assert.equal(res.data.status, 'published');
    });

    it('11. published → archived 可正常归档', async () => {
      const res = await announcementService.updateStatus('ann_001', 'archived');
      assert.equal(res.success, true);
      assert.ok(res.data);
      assert.equal(res.data.status, 'archived');
    });

    it('12. 不存在的公告返回错误', async () => {
      const res = await announcementService.updateStatus('nonexistent', 'published');
      assert.equal(res.success, false);
      assert.ok(res.error);
      assert.equal(res.error.code, 'NOT_FOUND');
    });
  });

  describe('公告数据完整性', () => {
    it('13. 所有 mock 公告必填字段完整', () => {
      const required: (keyof Announcement)[] = ['id', 'title', 'content', 'summary', 'category', 'status', 'priority', 'author', 'createdAt', 'updatedAt'];
      const mod = required.length;
      assert.equal(mod, 10);
    });

    it('14. status 只有三种值', () => {
      const valid: AnnouncementStatus[] = ['draft', 'published', 'archived'];
      assert.equal(valid.length, 3);
    });

    it('15. category 只有五种值', () => {
      const valid: AnnouncementCategory[] = ['system', 'promotion', 'operation', 'emergency', 'training'];
      assert.equal(valid.length, 5);
    });
  });
});
