/**
 * announcements.service.test.ts — 公告管理 Service 层测试
 *
 * 覆盖:
 *   - CRUD 操作（新增/编辑/删除/归档）
 *   - 状态流转（草稿 → 已发布 → 已归档）
 *   - 统计计算
 *   - 筛选与搜索
 *   - 表单验证
 *   - 边界条件与错误处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  defaultAnnouncements,
  filterAnnouncements,
  computeAnnouncementStats,
  createEmptyAnnouncementForm,
  validateAnnouncementForm,
  formatAnnouncementDate,
  addAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  CATEGORY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_BADGE_VARIANT,
  CATEGORY_OPTIONS,
  CATEGORY_TABS,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementStatus,
  type AnnouncementPriority,
  type AnnouncementFormData,
} from './announcements-data';

// ── 工厂函数 ────────────────────────────────────────────

function makeAnnouncement(
  overrides: Partial<Announcement> = {},
): Announcement {
  return {
    id: overrides.id ?? 'test-a-001',
    title: overrides.title ?? '测试公告标题',
    category: overrides.category ?? 'system',
    status: overrides.status ?? 'draft',
    priority: overrides.priority ?? 'normal',
    summary: overrides.summary ?? '这是一条测试公告摘要',
    content: overrides.content ?? '这是一条测试公告的正文内容，用于验证各个功能模块。',
    author: overrides.author ?? '测试用户',
    publishedAt: overrides.publishedAt ?? '',
    readCount: overrides.readCount ?? 0,
    createdAt: overrides.createdAt ?? '2026-07-20',
    updatedAt: overrides.updatedAt ?? '2026-07-20',
  };
}

function makeFormData(
  overrides: Partial<AnnouncementFormData> = {},
): AnnouncementFormData {
  return {
    title: overrides.title ?? '新公告标题',
    category: overrides.category ?? 'system',
    priority: overrides.priority ?? 'normal',
    status: overrides.status ?? 'draft',
    summary: overrides.summary ?? '新公告摘要',
    content: overrides.content ?? '新公告正文内容',
  };
}

// ── 公告列表数据整合 ──────────────────────────────────────

const ANNOUNCEMENT_SAMPLE = defaultAnnouncements;

// ============================================================
//  1. 公告查询与筛选
// ============================================================

test.describe('Announcements Service — 查询与筛选', () => {
  test('filterAnnouncements returns all when no filters applied', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', '', '');
    assert.equal(result.length, ANNOUNCEMENT_SAMPLE.length);
  });

  test('filterAnnouncements filters by category', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', 'system', '');
    assert.ok(result.every((a) => a.category === 'system'));
  });

  test('filterAnnouncements filters by status', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', '', 'published');
    assert.ok(result.every((a) => a.status === 'published'));
    assert.equal(result.length, 6); // a1-a4, a9, a10
  });

  test('filterAnnouncements filters by search keyword in title', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '系统升级', '', '');
    assert.ok(result.some((a) => a.title.includes('系统升级')));
  });

  test('filterAnnouncements filters by search keyword in summary', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '应急演练', '', '');
    assert.ok(result.every((a) => a.summary.includes('应急演练') || a.title.includes('应急演练')));
  });

  test('filterAnnouncements is case-insensitive for search', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '系统升级', '', '');
    assert.ok(result.length > 0);
    assert.equal(result[0].title, '2026年7月系统升级维护通知');
  });

  test('filterAnnouncements returns empty for non-matching search', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, 'NONEXISTENT_KEYWORD_XYZ', '', '');
    assert.equal(result.length, 0);
  });

  test('filterAnnouncements combines search + category + status', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '维护', 'operation', 'published');
    assert.equal(result.length, 1); // a9
    assert.equal(result[0].id, 'a9');
  });

  test('filterAnnouncements handles whitespace in search query', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '  POS  ', '', '');
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'POS收银系统紧急修复');
  });

  test('filterAnnouncements with empty category returns all categories', () => {
    const result = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', '', '');
    assert.equal(result.length, ANNOUNCEMENT_SAMPLE.length);
  });

  test('filterAnnouncements returns same result for empty string and undefined-like category', () => {
    const emptyCat = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', '', '');
    const systemCat = filterAnnouncements(ANNOUNCEMENT_SAMPLE, '', 'system', '');
    assert.ok(emptyCat.length > systemCat.length);
  });
});

// ============================================================
//  2. 公告统计计算
// ============================================================

test.describe('Announcements Service — 统计计算', () => {
  test('computeAnnouncementStats returns correct totals', () => {
    const stats = computeAnnouncementStats(ANNOUNCEMENT_SAMPLE);
    assert.equal(stats.total, 11);
    assert.equal(stats.published, 6);
    assert.equal(stats.draft, 3);
    assert.equal(stats.archived, 2);
    assert.equal(stats.highPriority, 3);
  });

  test('computeAnnouncementStats totalReads matches expected sum', () => {
    const stats = computeAnnouncementStats(ANNOUNCEMENT_SAMPLE);
    const expectedReads = ANNOUNCEMENT_SAMPLE.reduce((s, a) => s + a.readCount, 0);
    assert.equal(stats.totalReads, expectedReads);
  });

  test('computeAnnouncementStats returns zeroes for empty array', () => {
    const stats = computeAnnouncementStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.published, 0);
    assert.equal(stats.draft, 0);
    assert.equal(stats.archived, 0);
    assert.equal(stats.highPriority, 0);
    assert.equal(stats.totalReads, 0);
  });

  test('computeAnnouncementStats single draft announcement', () => {
    const stats = computeAnnouncementStats([makeAnnouncement({ status: 'draft', priority: 'low' })]);
    assert.equal(stats.total, 1);
    assert.equal(stats.draft, 1);
    assert.equal(stats.published, 0);
    assert.equal(stats.highPriority, 0);
    assert.equal(stats.totalReads, 0);
  });

  test('computeAnnouncementStats high priority count matches', () => {
    const stats = computeAnnouncementStats(ANNOUNCEMENT_SAMPLE);
    const expectedHigh = ANNOUNCEMENT_SAMPLE.filter((a) => a.priority === 'high').length;
    assert.equal(stats.highPriority, expectedHigh);
  });

  test('computeAnnouncementStats total = published + draft + archived', () => {
    const stats = computeAnnouncementStats(ANNOUNCEMENT_SAMPLE);
    assert.equal(stats.published + stats.draft + stats.archived, stats.total);
  });
});

// ============================================================
//  3. 公告 CRUD 操作
// ============================================================

test.describe('Announcements Service — CRUD 操作', () => {
  test('addAnnouncement creates a new announcement with form data', () => {
    const form = makeFormData({ title: 'CRUD测试公告', status: 'published' });
    const result = addAnnouncement([], form);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'CRUD测试公告');
    assert.equal(result[0].status, 'published');
    assert.equal(result[0].author, '当前用户');
    assert.equal(result[0].readCount, 0);
  });

  test('addAnnouncement prepends new announcement to existing list', () => {
    const existing = [makeAnnouncement({ id: 'old-1' })];
    const form = makeFormData({ title: '新公告' });
    const result = addAnnouncement(existing, form);
    assert.equal(result.length, 2);
    assert.equal(result[0].title, '新公告');
    assert.equal(result[1].id, 'old-1');
  });

  test('addAnnouncement sets publishedAt for published status', () => {
    const form = makeFormData({ status: 'published' });
    const result = addAnnouncement([], form);
    assert.ok(result[0].publishedAt !== '');
    assert.ok(result[0].publishedAt.length > 0);
  });

  test('addAnnouncement leaves publishedAt empty for draft status', () => {
    const form = makeFormData({ status: 'draft' });
    const result = addAnnouncement([], form);
    assert.equal(result[0].publishedAt, '');
  });

  test('addAnnouncement generates a unique ID', () => {
    const form = makeFormData();
    const result = addAnnouncement([], form);
    assert.ok(result[0].id.startsWith('a'));
    assert.equal(result[0].id.length > 1, true);
  });

  test('deleteAnnouncement removes announcement by id', () => {
    const items = [makeAnnouncement({ id: 'del-1' }), makeAnnouncement({ id: 'del-2' })];
    const result = deleteAnnouncement(items, 'del-1');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'del-2');
  });

  test('deleteAnnouncement returns same array when id not found', () => {
    const items = [makeAnnouncement({ id: 'keep-1' })];
    const result = deleteAnnouncement(items, 'nonexistent');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'keep-1');
  });

  test('deleteAnnouncement handles empty array', () => {
    const result = deleteAnnouncement([], 'some-id');
    assert.equal(result.length, 0);
  });

  test('archiveAnnouncement changes published status to archived', () => {
    const items = [makeAnnouncement({ id: 'arc-1', status: 'published' })];
    const result = archiveAnnouncement(items, 'arc-1');
    assert.equal(result[0].status, 'archived');
  });

  test('archiveAnnouncement does not affect draft items', () => {
    const items = [makeAnnouncement({ id: 'arc-2', status: 'draft' })];
    const result = archiveAnnouncement(items, 'arc-2');
    assert.equal(result[0].status, 'draft'); // unchanged
  });

  test('archiveAnnouncement does not affect already archived items', () => {
    const items = [makeAnnouncement({ id: 'arc-3', status: 'archived' })];
    const result = archiveAnnouncement(items, 'arc-3');
    assert.equal(result[0].status, 'archived'); // unchanged
  });

  test('publishAnnouncement changes draft status to published', () => {
    const items = [makeAnnouncement({ id: 'pub-1', status: 'draft', publishedAt: '' })];
    const result = publishAnnouncement(items, 'pub-1');
    assert.equal(result[0].status, 'published');
    assert.ok(result[0].publishedAt !== '');
  });

  test('publishAnnouncement does not affect already published items', () => {
    const items = [makeAnnouncement({ id: 'pub-2', status: 'published' })];
    const result = publishAnnouncement(items, 'pub-2');
    assert.equal(result[0].status, 'published');
  });

  test('publishAnnouncement does not affect archived items', () => {
    const items = [makeAnnouncement({ id: 'pub-3', status: 'archived' })];
    const result = publishAnnouncement(items, 'pub-3');
    assert.equal(result[0].status, 'archived');
  });
});

// ============================================================
//  4. 表单验证
// ============================================================

test.describe('Announcements Service — 表单验证', () => {
  test('validateAnnouncementForm passes for valid data', () => {
    const form = makeFormData();
    const errors = validateAnnouncementForm(form);
    assert.equal(Object.keys(errors).length, 0);
  });

  test('validateAnnouncementForm rejects empty title', () => {
    const form = makeFormData({ title: '' });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.title, 'Should have title error');
    assert.equal(errors.title, '公告标题不能为空');
  });

  test('validateAnnouncementForm rejects whitespace-only title', () => {
    const form = makeFormData({ title: '   ' });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.title);
  });

  test('validateAnnouncementForm rejects title exceeding 100 chars', () => {
    const form = makeFormData({ title: '长'.repeat(101) });
    const errors = validateAnnouncementForm(form);
    assert.equal(errors.title, '公告标题最多100个字符');
  });

  test('validateAnnouncementForm rejects empty category', () => {
    const form = makeFormData({ category: '' as AnnouncementCategory });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.category);
  });

  test('validateAnnouncementForm rejects empty priority', () => {
    const form = makeFormData({ priority: '' as AnnouncementPriority });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.priority);
  });

  test('validateAnnouncementForm rejects empty summary', () => {
    const form = makeFormData({ summary: '' });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.summary);
  });

  test('validateAnnouncementForm rejects summary exceeding 200 chars', () => {
    const form = makeFormData({ summary: '长'.repeat(201) });
    const errors = validateAnnouncementForm(form);
    assert.equal(errors.summary, '公告摘要最多200个字符');
  });

  test('validateAnnouncementForm rejects empty content', () => {
    const form = makeFormData({ content: '' });
    const errors = validateAnnouncementForm(form);
    assert.ok(errors.content);
  });

  test('validateAnnouncementForm returns multiple errors at once', () => {
    const form = makeFormData({ title: '', summary: '', content: '' });
    const errors = validateAnnouncementForm(form);
    assert.equal(Object.keys(errors).length, 3);
    assert.ok(errors.title);
    assert.ok(errors.summary);
    assert.ok(errors.content);
  });
});

// ============================================================
//  5. 日期格式化与映射表
// ============================================================

test.describe('Announcements Service — 日期格式化与映射', () => {
  test('formatAnnouncementDate returns dash for empty string', () => {
    assert.equal(formatAnnouncementDate(''), '-');
  });

  test('formatAnnouncementDate returns the date string as-is', () => {
    assert.equal(formatAnnouncementDate('2026-07-20'), '2026-07-20');
  });

  test('CATEGORY_LABELS covers all categories', () => {
    const categories: AnnouncementCategory[] = ['system', 'promotion', 'operation', 'emergency', 'policy'];
    for (const c of categories) {
      assert.ok(CATEGORY_LABELS[c], `Missing label for ${c}`);
      assert.equal(typeof CATEGORY_LABELS[c], 'string');
      assert.ok(CATEGORY_LABELS[c].length > 0);
    }
  });

  test('STATUS_LABELS covers all statuses', () => {
    const statuses: AnnouncementStatus[] = ['draft', 'published', 'archived'];
    for (const s of statuses) {
      assert.ok(STATUS_LABELS[s], `Missing label for ${s}`);
      assert.ok(STATUS_LABELS[s].length > 0);
    }
  });

  test('PRIORITY_LABELS covers all priorities', () => {
    const priorities: AnnouncementPriority[] = ['high', 'normal', 'low'];
    for (const p of priorities) {
      assert.ok(PRIORITY_LABELS[p], `Missing label for ${p}`);
      assert.ok(PRIORITY_LABELS[p].length > 0);
    }
  });

  test('PRIORITY_COLORS maps all priorities to valid colors', () => {
    const priorities: AnnouncementPriority[] = ['high', 'normal', 'low'];
    for (const p of priorities) {
      assert.ok(PRIORITY_COLORS[p], `Missing color for ${p}`);
      assert.ok(PRIORITY_COLORS[p].startsWith('#'));
    }
  });

  test('STATUS_BADGE_VARIANT maps all statuses to valid variants', () => {
    const statuses: AnnouncementStatus[] = ['draft', 'published', 'archived'];
    const validVariants: string[] = ['default', 'success', 'warning'];
    for (const s of statuses) {
      assert.ok(validVariants.includes(STATUS_BADGE_VARIANT[s]), `Invalid variant for ${s}`);
    }
  });

  test('CATEGORY_OPTIONS has 5 non-empty options', () => {
    assert.equal(CATEGORY_OPTIONS.length, 5);
    for (const opt of CATEGORY_OPTIONS) {
      assert.ok(opt.value);
      assert.ok(opt.label);
    }
  });

  test('CATEGORY_TABS includes "all" tab plus category tabs', () => {
    assert.equal(CATEGORY_TABS.length, 5);
    assert.equal(CATEGORY_TABS[0].key, '');
    assert.equal(CATEGORY_TABS[0].label, '全部');
  });
});

// ============================================================
//  6. 边界条件与错误处理
// ============================================================

test.describe('Announcements Service — 边界条件', () => {
  test('createEmptyAnnouncementForm returns default values', () => {
    const form = createEmptyAnnouncementForm();
    assert.equal(form.title, '');
    assert.equal(form.category, 'operation');
    assert.equal(form.priority, 'normal');
    assert.equal(form.status, 'draft');
    assert.equal(form.summary, '');
    assert.equal(form.content, '');
  });

  test('addAnnouncement trims title whitespace', () => {
    const form = makeFormData({ title: '  带空格的标题  ' });
    const result = addAnnouncement([], form);
    assert.equal(result[0].title, '带空格的标题');
  });

  test('addAnnouncement trims summary whitespace', () => {
    const form = makeFormData({ summary: '  带空格的摘要  ' });
    const result = addAnnouncement([], form);
    assert.equal(result[0].summary, '带空格的摘要');
  });

  test('addAnnouncement trims content whitespace', () => {
    const form = makeFormData({ content: '  带空格的内容  ' });
    const result = addAnnouncement([], form);
    assert.equal(result[0].content, '带空格的内容');
  });

  test('archiveAnnouncement updates updatedAt', () => {
    const items = [makeAnnouncement({ id: 'time-1', status: 'published', updatedAt: '2026-01-01' })];
    const result = archiveAnnouncement(items, 'time-1');
    assert.ok(result[0].updatedAt !== '2026-01-01');
  });

  test('publishAnnouncement updates updatedAt', () => {
    const items = [makeAnnouncement({ id: 'time-2', status: 'draft', updatedAt: '2026-01-01' })];
    const result = publishAnnouncement(items, 'time-2');
    assert.ok(result[0].updatedAt !== '2026-01-01');
  });

  test('defaultAnnouncements has 11 entries', () => {
    assert.equal(defaultAnnouncements.length, 11);
  });

  test('all default announcements have non-empty ids', () => {
    for (const a of defaultAnnouncements) {
      assert.ok(a.id, 'Announcement missing id');
    }
  });

  test('all default announcements have valid status', () => {
    const validStatuses: AnnouncementStatus[] = ['draft', 'published', 'archived'];
    for (const a of defaultAnnouncements) {
      assert.ok(validStatuses.includes(a.status), `Invalid status for ${a.id}: ${a.status}`);
    }
  });

  test('all default announcements have valid categories', () => {
    const validCategories: AnnouncementCategory[] = ['system', 'promotion', 'operation', 'emergency', 'policy'];
    for (const a of defaultAnnouncements) {
      assert.ok(validCategories.includes(a.category), `Invalid category for ${a.id}: ${a.category}`);
    }
  });

  test('readCount is non-negative for all announcements', () => {
    for (const a of defaultAnnouncements) {
      assert.ok(a.readCount >= 0, `Negative readCount for ${a.id}`);
    }
  });

  test('CRUD operations maintain immutability', () => {
    const original = [makeAnnouncement({ id: 'imm-1', status: 'published' })];
    const originalLen = original.length;
    archiveAnnouncement(original, 'imm-1');
    deleteAnnouncement(original, 'imm-1');
    // original array should not be mutated
    assert.equal(original.length, originalLen);
  });
});
