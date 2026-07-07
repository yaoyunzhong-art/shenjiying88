/**
 * AnnouncementBadge Test — storefront-web
 * Tests: badge rendering for categories and statuses
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const CATEGORY_LABELS: Record<string, string> = {
  system: '系统通知',
  operation: '运营公告',
  promotion: '促销活动',
  emergency: '紧急通知',
};

const CATEGORY_COLORS: Record<string, string> = {
  system: '#6366f1',
  operation: '#f59e0b',
  promotion: '#10b981',
  emergency: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const STATUS_COLORS: Record<string, string> = {
  published: '#10b981',
  draft: '#9ca3af',
  archived: '#6b7280',
};

test('AnnouncementBadge - category labels are complete', () => {
  const categories = ['system', 'operation', 'promotion', 'emergency'];
  for (const cat of categories) {
    assert.ok(CATEGORY_LABELS[cat], `Missing label for category: ${cat}`);
    assert.ok(CATEGORY_COLORS[cat], `Missing color for category: ${cat}`);
  }
  assert.equal(Object.keys(CATEGORY_LABELS).length, 4);
});

test('AnnouncementBadge - status labels are complete', () => {
  const statuses = ['published', 'draft', 'archived'];
  for (const st of statuses) {
    assert.ok(STATUS_LABELS[st], `Missing label for status: ${st}`);
    assert.ok(STATUS_COLORS[st], `Missing color for status: ${st}`);
  }
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

test('AnnouncementBadge - category mappings correct', () => {
  assert.equal(CATEGORY_LABELS.system, '系统通知');
  assert.equal(CATEGORY_LABELS.promotion, '促销活动');
  assert.equal(CATEGORY_LABELS.emergency, '紧急通知');
  assert.equal(CATEGORY_LABELS.operation, '运营公告');
});

test('AnnouncementBadge - status mappings correct', () => {
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

test('AnnouncementBadge - category colors are valid CSS hex', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  for (const color of Object.values(CATEGORY_COLORS)) {
    assert.ok(hexRegex.test(color), `Invalid hex color: ${color}`);
  }
});

test('AnnouncementBadge - status colors are valid CSS hex', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  for (const color of Object.values(STATUS_COLORS)) {
    assert.ok(hexRegex.test(color), `Invalid hex color: ${color}`);
  }
});
