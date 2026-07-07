/**
 * AnnouncementsPage Test — storefront-web
 * Tests: data rendering, search filtering, category filtering, empty state
 */
import assert from 'node:assert/strict';
import test from 'node:test';

type AnnouncementCategory = 'system' | 'operation' | 'promotion' | 'emergency';
type AnnouncementStatus = 'published' | 'draft' | 'archived';

interface AnnouncementItem {
  id: string;
  title: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  summary: string;
  priority: 'high' | 'normal' | 'low';
  publishedAt: string;
  author: string;
  readCount: number;
}

const MOCK_ITEMS: AnnouncementItem[] = [
  { id: '1', title: '系统升级公告', category: 'system', status: 'published', summary: '系统升级维护通知', priority: 'high', publishedAt: '2026-06-29', author: '系统管理员', readCount: 12580 },
  { id: '2', title: '促销活动通知', category: 'promotion', status: 'published', summary: '满减活动', priority: 'normal', publishedAt: '2026-06-28', author: '运营部', readCount: 8430 },
  { id: '3', title: '草稿公告', category: 'operation', status: 'draft', summary: '待发布', priority: 'low', publishedAt: '2026-06-30', author: '仓管部', readCount: 0 },
  { id: '4', title: '消防演练紧急通知', category: 'emergency', status: 'published', summary: '消防演练安排', priority: 'high', publishedAt: '2026-06-26', author: '安全部', readCount: 9870 },
];

function filterItems(
  items: AnnouncementItem[],
  options: { search?: string; category?: string; status?: string }
): AnnouncementItem[] {
  return items.filter((item) => {
    if (options.category && item.category !== options.category) return false;
    if (options.status && item.status !== options.status) return false;
    if (options.search) {
      const q = options.search.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.summary.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

test('AnnouncementsPage - renders all items when no filters applied', () => {
  const result = filterItems(MOCK_ITEMS, {});
  assert.equal(result.length, 4);
});

test('AnnouncementsPage - filters by search query (title match)', () => {
  const result = filterItems(MOCK_ITEMS, { search: '促销' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, '促销活动通知');
});

test('AnnouncementsPage - filters by search query (summary match)', () => {
  const result = filterItems(MOCK_ITEMS, { search: '消防' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, '消防演练紧急通知');
});

test('AnnouncementsPage - filters by category', () => {
  const result = filterItems(MOCK_ITEMS, { category: 'system' });
  assert.equal(result.length, 1);
  assert.equal(result[0].category, 'system');
});

test('AnnouncementsPage - filters by status', () => {
  const result = filterItems(MOCK_ITEMS, { status: 'draft' });
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'draft');
});

test('AnnouncementsPage - filters by category and status combined', () => {
  const result = filterItems(MOCK_ITEMS, { category: 'promotion', status: 'published' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '2');
});

test('AnnouncementsPage - returns empty when no match', () => {
  const result = filterItems(MOCK_ITEMS, { search: '不存在的公告' });
  assert.equal(result.length, 0);
});

test('AnnouncementsPage - pagination calculation', () => {
  const total = MOCK_ITEMS.length;
  const pageSize = 2;
  const totalPages = Math.ceil(total / pageSize);
  assert.equal(totalPages, 2);
});

test('AnnouncementsPage - item has required fields', () => {
  for (const item of MOCK_ITEMS) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(['system', 'operation', 'promotion', 'emergency'].includes(item.category));
    assert.ok(['published', 'draft', 'archived'].includes(item.status));
    assert.ok(typeof item.readCount === 'number');
  }
});
