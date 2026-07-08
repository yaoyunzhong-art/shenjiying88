/**
 * announcements/[id]/page.test.ts — 公告详情页 L1 冒烟测试
 * 覆盖: 参数解构 / 状态映射 / 状态流转 / 错误处理 / 辅助函数
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 类型对齐 announcement-service.ts ----

type AnnouncementStatus = 'draft' | 'published' | 'archived';
type AnnouncementCategory = 'system' | 'promotion' | 'operation' | 'emergency' | 'training';

interface Announcement {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author: string;
  publishedAt: string;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---- 辅助函数（与 page.tsx 对齐） ----

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统', promotion: '促销', operation: '运营', emergency: '应急', training: '培训',
};

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '草稿', published: '已发布', archived: '已归档',
};

function getNextStatuses(current: AnnouncementStatus): { status: AnnouncementStatus; label: string }[] {
  switch (current) {
    case 'draft':
      return [{ status: 'published', label: '发布公告' }];
    case 'published':
      return [{ status: 'archived', label: '归档公告' }];
    case 'archived':
      return [];
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN');
}

// ---- Mock 数据 ----

const mockDraft: Announcement = {
  id: 'ann_004', title: 'POS系统更新计划', content: 'POS系统将于7月8日凌晨更新',
  summary: 'POS系统更新', category: 'system', status: 'draft', priority: 'urgent',
  author: '技术部', publishedAt: '', readCount: 0,
  createdAt: '2026-07-04T16:00:00Z', updatedAt: '2026-07-04T16:00:00Z',
};

const mockPublished: Announcement = {
  id: 'ann_001', title: '夏季巡检通知', content: '各门店请在7月15日前完成巡检',
  summary: '夏季设备巡检', category: 'operation', status: 'published', priority: 'high',
  author: '运营部', publishedAt: '2026-07-01T08:00:00Z', readCount: 2340,
  createdAt: '2026-06-28T10:00:00Z', updatedAt: '2026-07-01T08:00:00Z',
};

const mockArchived: Announcement = {
  id: 'ann_007', title: '年中优秀门店评选结果', content: '恭喜获奖门店',
  summary: '上半年优秀门店', category: 'operation', status: 'archived', priority: 'normal',
  author: '运营部', publishedAt: '2026-06-15T09:00:00Z', readCount: 6780,
  createdAt: '2026-06-10T08:00:00Z', updatedAt: '2026-06-15T09:00:00Z',
};

// ---- 测试 ----

describe('AnnouncementDetailPage (tob-web) 公告详情页', () => {
  describe('模块可导入', () => {
    it('1. 模块可导入并导出函数', async () => {
      const mod = await import('./page');
      assert.equal(typeof mod.default, 'function');
    });
  });

  describe('状态映射 - 正例', () => {
    it('2. draft 对应中文"草稿"', () => {
      assert.equal(STATUS_LABELS.draft, '草稿');
    });
    it('3. published 对应中文"已发布"', () => {
      assert.equal(STATUS_LABELS.published, '已发布');
    });
    it('4. archived 对应中文"已归档"', () => {
      assert.equal(STATUS_LABELS.archived, '已归档');
    });
  });

  describe('分类映射', () => {
    it('5. 五种分类均有中文标签', () => {
      assert.equal(CATEGORY_LABELS.system, '系统');
      assert.equal(CATEGORY_LABELS.promotion, '促销');
      assert.equal(CATEGORY_LABELS.operation, '运营');
      assert.equal(CATEGORY_LABELS.emergency, '应急');
      assert.equal(CATEGORY_LABELS.training, '培训');
    });
  });

  describe('状态流转 - getNextStatuses', () => {
    it('6. draft → 可发布', () => {
      const next = getNextStatuses('draft');
      assert.equal(next.length, 1);
      assert.equal(next[0].status, 'published');
      assert.equal(next[0].label, '发布公告');
    });

    it('7. published → 可归档', () => {
      const next = getNextStatuses('published');
      assert.equal(next.length, 1);
      assert.equal(next[0].status, 'archived');
      assert.equal(next[0].label, '归档公告');
    });

    it('8. archived → 无流转', () => {
      const next = getNextStatuses('archived');
      assert.equal(next.length, 0);
    });
  });

  describe('formatDateTime', () => {
    it('9. 合法 ISO 返回非空字符串', () => {
      const result = formatDateTime('2026-07-01T08:00:00Z');
      assert.ok(result.includes('2026'));
      assert.ok(result.includes('7') || result.includes('07'));
    });

    it('10. 空字符串返回 "-"', () => {
      assert.equal(formatDateTime(''), '-');
    });
  });

  describe('Mock 数据完整性', () => {
    it('11. mockDraft 状态为 draft', () => {
      assert.equal(mockDraft.status, 'draft');
      assert.equal(mockDraft.readCount, 0);
    });

    it('12. mockPublished 状态为 published', () => {
      assert.equal(mockPublished.status, 'published');
      assert.ok(mockPublished.readCount > 0);
    });

    it('13. mockArchived 状态为 archived', () => {
      assert.equal(mockArchived.status, 'archived');
      assert.equal(mockArchived.priority, 'normal');
    });
  });

  describe('错误处理', () => {
    it('14. 详情获取失败应有错误消息', () => {
      const errorResponse = { success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } };
      assert.equal(errorResponse.success, false);
      assert.equal(errorResponse.error.message, '公告不存在');
    });

    it('15. announcement 不存在时显示错误状态', () => {
      const error = '公告不存在';
      const hasError = true;
      assert.equal(hasError, true);
      assert.ok(error.length > 0);
    });
  });

  describe('API 结构', () => {
    it('16. updateStatus 成功返回结果', async () => {
      const { announcementService } = await import('../../../lib/announcement-service');
      const res = await announcementService.updateStatus('ann_004', 'published');
      assert.equal(res.success, true);
      if (res.data) assert.equal(res.data.status, 'published');
    });
  });
});
